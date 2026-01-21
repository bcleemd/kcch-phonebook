document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const resultsList = document.getElementById('resultsList');
    const searchBar = document.getElementById('searchBar');
    const editBtn = document.getElementById('editBtn');
    const editActions = document.getElementById('editActions');
    const tableView = document.getElementById('tableView');
    const tableBody = document.getElementById('tableBody');
    const cancelBtn = document.getElementById('cancelBtn');
    const saveBtn = document.getElementById('saveBtn');

    let phoneData = [];
    let isEditMode = false;

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
            // Explicitly set display flex via style attribute as a last resort
            card.style.display = 'flex';
            card.style.flexDirection = 'row';
            card.style.justifyContent = 'space-between';
            card.style.alignItems = 'center';

            card.innerHTML = `
                <div class="card-info" style="display: flex; flex-direction: row; flex: 1; align-items: center;">
                    <div class="card-place" style="font-weight: 600;">${item.place}</div>
                </div>
                <div class="card-number" style="font-weight: 700; color: #3b82f6; margin-left: auto;">${item.number}</div>
            `;

            resultsList.appendChild(card);
        });
        console.log('Phonbook: Displayed ' + results.length + ' results with class search-item-row');
    }

    // --- Edit Mode Logic ---

    function toggleEditMode() {
        isEditMode = !isEditMode;

        if (isEditMode) {
            searchBar.classList.add('hidden');
            resultsList.classList.add('hidden');
            editActions.classList.remove('hidden');
            tableView.classList.remove('hidden');
            editBtn.classList.add('hidden');
            renderTable();
        } else {
            searchBar.classList.remove('hidden');
            resultsList.classList.remove('hidden');
            editActions.classList.add('hidden');
            tableView.classList.add('hidden');
            editBtn.classList.remove('hidden');
            displayResults(phoneData);
        }
    }

    function renderTable() {
        tableBody.innerHTML = '';

        phoneData.forEach((item, index) => {
            addRowToTable(item.place, item.number, index);
        });

        // 빈 행 추가 (새 데이터 입력용)
        addRowToTable('', '', phoneData.length);
    }

    function addRowToTable(place, number, index) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td contenteditable="true" class="cell-place">${place}</td>
            <td contenteditable="true" class="cell-number">${number}</td>
            <td class="col-action">
                ${index < phoneData.length ? `<button class="delete-btn" data-index="${index}">&times;</button>` : ''}
            </td>
        `;

        // 삭제 이벤트
        const deleteBtn = tr.querySelector('.delete-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                phoneData.splice(index, 1);
                renderTable();
            });
        }

        // 편집 완료 시 데이터 업데이트
        const cells = tr.querySelectorAll('td[contenteditable="true"]');
        cells.forEach(cell => {
            cell.addEventListener('blur', () => {
                const updatedPlace = tr.querySelector('.cell-place').innerText.trim();
                const updatedNumber = tr.querySelector('.cell-number').innerText.trim();

                if (index < phoneData.length) {
                    // 기존 행 업데이트
                    phoneData[index] = { place: updatedPlace, number: updatedNumber };
                } else if (updatedPlace || updatedNumber) {
                    // 새 행 추가
                    phoneData.push({ place: updatedPlace, number: updatedNumber });
                    renderTable();
                }
            });
        });

        tableBody.appendChild(tr);
    }

    function saveToCSV() {
        const header = "장소,내선번호\n";
        const csvContent = phoneData
            .map(item => `${item.place},${item.number}`)
            .join('\n');

        const fullContent = header + csvContent;
        const blob = new Blob(["\ufeff" + fullContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "PhoneBook.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toggleEditMode();
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

    editBtn.addEventListener('click', toggleEditMode);
    cancelBtn.addEventListener('click', toggleEditMode);
    saveBtn.addEventListener('click', saveToCSV);

    // 초기 데이터 로드
    loadPhoneBook();
});
