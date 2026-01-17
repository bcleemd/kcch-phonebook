document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const resultsList = document.getElementById('resultsList');
    let phoneData = [];

    // CSV 파일 로드 및 파싱
    async function loadPhoneBook() {
        try {
            const response = await fetch('PhoneBook.csv');
            if (!response.ok) {
                throw new Error('CSV 파일을 불러올 수 없습니다.');
            }
            const data = await response.text();
            parseCSV(data);
            displayResults(phoneData);
        } catch (error) {
            console.error('Error loading CSV:', error);
            resultsList.innerHTML = '<div class="no-results">데이터를 불러오는 중 오류가 발생했습니다.</div>';
        }
    }

    function parseCSV(text) {
        // 줄바꿈으로 분리
        const lines = text.split(/\r?\n/);
        // 헤더 제외하고 데이터 추출 (장소, 내선번호)
        phoneData = lines.slice(1)
            .filter(line => line.trim() !== '')
            .map(line => {
                // 단순 쉼표 분리 (데이터에 쉼표가 있을 경우를 고려하여 정규식 사용 가능하지만, 현재 데이터는 단순함)
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
            
            card.innerHTML = `
                <div class="card-info">
                    <span class="card-place">${item.place}</span>
                </div>
                <div class="card-number">${item.number}</div>
            `;
            
            resultsList.appendChild(card);
        });
    }

    // 검색 핸들러
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
