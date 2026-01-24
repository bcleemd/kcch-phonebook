document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const resultsList = document.getElementById('resultsList');
    let phoneData = [];

    // CSV 파일 로드 및 파싱 (캐시 방지 및 상세 에러 핸들링 추가)
    async function loadPhoneBook() {
        try {
            // 파일명 뒤에 타임스탬프를 붙여 브라우저 캐시를 무시하도록 함
            const cacheBuster = `?t=${new Date().getTime()}`;
            const response = await fetch('PhoneBook.csv' + cacheBuster);

            if (!response.ok) {
                throw new Error(`파일을 찾을 수 없거나 응답이 없습니다. (상태 코드: ${response.status})`);
            }
            const data = await response.text();
            parseCSV(data);
            displayResults(phoneData);
        } catch (error) {
            console.error('Error loading CSV:', error);
            resultsList.innerHTML = `
                <div class="no-results">
                    데이터를 불러오는 중 오류가 발생했습니다.<br>
                    <small style="font-size: 0.8rem; color: #ef4444;">오류 내용: ${error.message}</small>
                </div>`;
        }
    }

    function parseCSV(text) {
        const lines = text.split(/\r?\n/);
        phoneData = lines.slice(1)
            .filter(line => line.trim() !== '')
            .map(line => {
                const parts = line.split(',');
                return {
                    place: parts[0]?.trim() || '',
                    number: parts[1]?.trim() || ''
                };
            });
    }

    function displayResults(results) {
        resultsList.innerHTML = '';

        if (results.length === 0) {
            resultsList.innerHTML = '<div class="no-results">검색 결과가 없습니다.</div>';
            return;
        }

        results.forEach(item => {
            const card = document.createElement('div');
            card.className = 'card';
            // Final resort: Inline styles for horizontal alignment
            Object.assign(card.style, {
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'flex-start', // Top alignment for multi-line
                width: '100%'
            });

            // Process number to wrap on / or ~
            const formattedNumber = item.number.replace(/([/~])/g, '<br>$1');

            card.innerHTML = `
                <div class="card-info" style="display: flex; flex-direction: row; flex: 1; align-items: flex-start; min-width: 0; padding-top: 2px;">
                    <div class="card-place" style="font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1;">${item.place}</div>
                </div>
                <div class="card-number" style="font-weight: 700; color: #3b82f6; margin-left: 20px; text-align: right; flex-shrink: 0; line-height: 1.4;">${formattedNumber}</div>
            `;

            resultsList.appendChild(card);
        });
        console.log('Phonbook: Displayed ' + results.length + ' results with class search-item-row');
    }


    // --- Event Listeners ---

    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();
        if (searchTerm === '') {
            displayResults(phoneData);
            return;
        }
        const filtered = phoneData.filter(item =>
            item.place.toLowerCase().includes(searchTerm) ||
            item.number.toLowerCase().includes(searchTerm)
        );
        displayResults(filtered);
    });


    // 초기 데이터 로드
    loadPhoneBook();
});
