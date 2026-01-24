document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const resultsList = document.getElementById('resultsList');
    let phoneData = [];

    // JSON 파일 로드 및 파싱 (캐시 방지 및 상세 에러 핸들링 추가)
    async function loadPhoneBook() {
        try {
            const cacheBuster = `?t=${new Date().getTime()}`;
            const response = await fetch('PhoneBook.json' + cacheBuster);

            if (!response.ok) {
                throw new Error(`파일을 찾을 수 없거나 응답이 없습니다. (상태 코드: ${response.status})`);
            }
            const data = await response.json();
            phoneData = flattenPhoneBook(data);
            displayResults(phoneData);
        } catch (error) {
            console.error('Error loading JSON:', error);
            resultsList.innerHTML = `
                <div class="no-results">
                    데이터를 불러오는 중 오류가 발생했습니다.<br>
                    <small style="font-size: 0.8rem; color: #ef4444;">오류 내용: ${error.message}</small>
                </div>`;
        }
    }

    /**
     * 중첩된 JSON 구조를 { place, number } 배열로 평탄화합니다.
     * CSV 버전과 유사한 느낌을 주기 위해 일부 최상위 카테고리 키는 생략합니다.
     */
    function flattenPhoneBook(data) {
        const results = [];
        const SKIPPED_KEYS = ['한국원자력의학원', '진료과', '주요전화', '임원진', '공통'];

        function traverse(obj, currentPath = []) {
            if (Array.isArray(obj)) {
                if (obj.length > 0 && typeof obj[0] === 'string') {
                    // 문자열 배열은 전화번호 목록으로 간주
                    const numbers = obj.filter(n => typeof n === 'string' && n.trim() !== '');
                    if (numbers.length > 0) {
                        // 경로에서 중복되는 단어 제거 (예: "내과 내과 의국" -> "내과 의국")
                        const uniquePath = [];
                        currentPath.forEach(part => {
                            if (uniquePath.length === 0 || uniquePath[uniquePath.length - 1] !== part) {
                                uniquePath.push(part);
                            }
                        });

                        results.push({
                            place: uniquePath.join(' ').trim(),
                            number: numbers.join(' / ')
                        });
                    }
                } else {
                    // 객체나 배열을 포함한 배열
                    obj.forEach(item => traverse(item, currentPath));
                }
            } else if (typeof obj === 'object' && obj !== null) {
                for (const key in obj) {
                    if (key === '기준일') continue;

                    const nextPath = [...currentPath];
                    if (!SKIPPED_KEYS.includes(key)) {
                        nextPath.push(key);
                    }
                    traverse(obj[key], nextPath);
                }
            }
        }

        traverse(data);
        return results;
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
            // 가로 정렬을 강제하기 위한 스타일 적용
            Object.assign(card.style, {
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                width: '100%'
            });

            // 번호에 / 나 ~ 가 있을 경우 줄바꿈 처리
            const formattedNumber = item.number.replace(/([/~])/g, '<br>$1');

            card.innerHTML = `
                <div class="card-info" style="display: flex; flex-direction: row; flex: 1; align-items: flex-start; min-width: 0; padding-top: 2px;">
                    <div class="card-place" style="font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1;">${item.place}</div>
                </div>
                <div class="card-number" style="font-weight: 700; color: #3b82f6; margin-left: 20px; text-align: right; flex-shrink: 0; line-height: 1.4;">${formattedNumber}</div>
            `;

            resultsList.appendChild(card);
        });
        console.log('Phonebook: Displayed ' + results.length + ' results');
    }

    // --- 이벤트 리스너 ---

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

