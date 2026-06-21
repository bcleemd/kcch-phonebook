# KCCH 내선번호부 뷰어 구현 플랜

이 문서는 `PhoneBook.json` 데이터를 브라우저에서 읽어 동적으로 평탄화 및 검색 렌더링하는 뷰어 웹앱의 설계 기준 문서입니다.

---

## 1. 목표

- 브라우저 로딩 시 `PhoneBook.json`을 캐시 방지 처리(`?t=timestamp`)를 적용해 `fetch()`로 로드
- 트리 형태의 복잡한 계층형 JSON 구조를 평탄화(`flattenPhoneBook`)하여 1차원 검색 리스트 형태로 가공
- 입력어 필터링을 통해 장소명, 부서명, 내선번호에 대해 실시간 키워드 실시간 매칭
- PC 및 모바일 화면에 맞춰 유연하게 반응하는 가로 정렬(Flex Row) 카드 레이아웃 구현

---

## 2. 파일 구성

```
프로젝트 루트/
├── index.html              ← 검색바와 결과 컨테이너가 마련된 셸 HTML
├── style.css               ← Google Fonts(Inter) 기반 모던 웹 스타일시트
├── script.js               ← fetch + 계층형 JSON 평탄화 + 실시간 검색 로직
└── PhoneBook.json          ← 원본 전화번호부 데이터
```

---

## 3. index.html 구조

`index.html`은 데이터를 직접 내장하지 않고 빈 컨테이너 `<div id="resultsList">`만 두고 `script.js`가 채우는 동적 셸 구조입니다.

```html
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>KCCH PhoneBook</title>
    <meta name="description" content="원자력병원 내선번호 검색 서비스">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="style.css?v=fresh_v12">
</head>
<body>
    <div class="app-container">
        <header class="header">
            <div class="header-top">
                <h1 class="title">KCCH PhoneBook</h1>
                <p class="subtitle">오류가 발견되면, 이비인후과 이병철에게 카톡 또는 문자 남겨주세요</p>
            </div>
            <div id="searchBar" class="search-container">
                <input type="text" id="searchInput" placeholder="장소 또는 이름으로 검색하세요..." autofocus>
                <div class="search-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                </div>
            </div>
        </header>

        <main class="content">
            <div id="resultsList" class="results-list">
                <div class="loading">데이터를 불러오는 중...</div>
            </div>
        </main>

        <footer class="footer">
            <p>&copy; 2026 KCCH PhoneBook. All rights reserved.</p>
        </footer>
    </div>
    <script src="script.js?v=fresh_v1"></script>
</body>
</html>
```

---

## 4. script.js 핵심 로직

### 4.1 계층형 데이터 평탄화 (`flattenPhoneBook`)

`PhoneBook.json`의 트리 데이터 구조를 순회하면서, 최상위 공통 대분류 키(예: `한국원자력의학원`, `진료과` 등)를 스킵하고 리프 노드까지의 유일 경로명을 병합해 검색용 `searchPath`와 화면 표시용 `place`로 가공합니다.

```javascript
function flattenPhoneBook(data) {
    const results = [];
    const SKIPPED_KEYS = ['한국원자력의학원', '진료과', '주요전화', '임원진', '공통'];

    function traverse(obj, currentPath = []) {
        if (Array.isArray(obj)) {
            if (obj.length > 0 && typeof obj[0] === 'string') {
                const numbers = obj.filter(n => typeof n === 'string' && n.trim() !== '');
                if (numbers.length > 0) {
                    const uniquePath = [];
                    currentPath.forEach(part => {
                        if (uniquePath.length === 0 || uniquePath[uniquePath.length - 1] !== part) {
                            uniquePath.push(part);
                        }
                    });

                    let displayPlace = '';
                    if (uniquePath.length >= 2) {
                        displayPlace = `${uniquePath[uniquePath.length - 1]} - ${uniquePath[uniquePath.length - 2]}`;
                    } else if (uniquePath.length === 1) {
                        displayPlace = uniquePath[0];
                    }

                    results.push({
                        place: displayPlace.trim(),
                        searchPath: uniquePath.join(' ').toLowerCase(),
                        number: numbers.join(' / ')
                    });
                }
            } else {
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
```

### 4.2 데이터 fetch 로드 및 검색 이벤트 연동

페이지 로드 시 캐시 방지 파라미터를 추가하여 `PhoneBook.json`을 가져옵니다.

```javascript
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const resultsList = document.getElementById('resultsList');
    let phoneData = [];

    async function loadPhoneBook() {
        try {
            const cacheBuster = `?t=${new Date().getTime()}`;
            const response = await fetch('PhoneBook.json' + cacheBuster);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            phoneData = flattenPhoneBook(data);
            displayResults(phoneData);
        } catch (error) {
            resultsList.innerHTML = `<div class="no-results">데이터 로드 실패: ${error.message}</div>`;
        }
    }

    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();
        if (searchTerm === '') {
            displayResults(phoneData);
            return;
        }
        const filtered = phoneData.filter(item =>
            item.searchPath.includes(searchTerm) ||
            item.number.toLowerCase().includes(searchTerm)
        );
        displayResults(filtered);
    });

    loadPhoneBook();
});
```

---

## 5. 실행 방법

`server.js` Express 서버가 실행 중인 상태에서 브라우저를 통해 접속합니다.

```bash
# 1. 의존성 설치
npm install

# 2. 로컬 개발 서버 실행
npm run dev

# 3. 브라우저에서 접속
# -> http://localhost:5050
```
