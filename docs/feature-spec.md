# Feature Specification: KCCH PhoneBook Editor & Deploy Pipeline

이 문서는 KCCH 내선번호부 프로젝트(`PJ_KCCH_PhoneBook`)의 편집 및 배포 시스템의 기능 요구사항과 아키텍처 명세를 기술합니다.

---

## 1. 아키텍처 개요

시스템은 **시각적 웹 에디터**, **로컬 Express API 서버**, **정적 웹 뷰어**, 그리고 **GitHub 배포 파이프라인**의 4가지 계층으로 구성되어 있습니다.

```
[ 시각적 에디터 (editor_home/index.html) ]
                   │ (HTTP API 호출)
                   ▼
  [ 로컬 Express 서버 (server.js) ] ───▶ [ 로컬 PhoneBook.json 저장 (루트 및 web_home/) ]
                   │ (git CLI 실행)
                   ▼
  [ GitHub 배포 파이프라인 ] ──▶ [ 원격 리포지토리 (bcleemd/kcch-phonebook) ]
                                            │
                                            ▼ (GitHub Pages 호스팅)
                             [ 정적 웹 뷰어 (index.html, script.js 등) ]
```

---

## 2. 세부 기능 명세

### A. 로컬 Express API 서버 (`server.js`)
로컬 포트 `5050`에서 작동하며, 파일 제어 및 Git 배포 스크립트를 기동하기 위한 백엔드 역할을 담당합니다.

* **정적 파일 서빙**:
  * `/editor_home/` 경로로 트리 기반 편집 UI(`editor_home/index.html`)를 서빙합니다.
  * `/` 경로로 정적 웹 뷰어(`index.html`)를 서빙합니다.
* **전화번호 데이터 조회 API (`GET /api/phonebook`)**:
  * 로컬 루트 경로의 `PhoneBook.json` 데이터를 동적으로 로드해 클라이언트에 JSON 형태로 제공합니다.
* **전화번호 데이터 저장 API (`POST /api/phonebook`)**:
  * 클라이언트로부터 전달받은 JSON 데이터를 직렬화하고, `PhoneBook.json` 파일에 덮어씁니다.
  * 이때, 로컬 뷰어와 배포용 뷰어가 동일하게 최신 상태를 유지할 수 있도록 **프로젝트 루트**와 **`web_home/` 하위 디렉토리** 두 곳에 이중으로 저장합니다.
* **Git 배포 API (`POST /api/deploy`)**:
  * 클라이언트로부터 커밋 메시지를 수신합니다.
  * 로컬 컴퓨터에 로그인된 `gh` CLI 세션을 활용하여 GitHub API (`PUT`) 요청을 직접 전송합니다:
    1. 원격 저장소(`bcleemd/kcch-phonebook`)의 기존 `PhoneBook.json` 파일의 **SHA 값**을 동적으로 획득합니다.
    2. 로컬 `PhoneBook.json` 내용을 Base64 형식으로 인코딩합니다.
    3. `gh api --method PUT`를 실행하여 원격 파일만 직접 업데이트합니다. (이 방식은 로컬에 `.git` 폴더가 없는 환경에서도 정상 동작합니다.)

### B. 시각적 웹 에디터 UI (`editor_home/index.html`)
사용자가 JSON의 텍스트 형식 데이터를 복잡하게 조작할 필요가 없도록 해주는 웹 프론트엔드 작업 영역입니다.

* **인터랙티브 트리 뷰**:
  * 계층형 데이터(`PhoneBook.json`)를 동적으로 파싱하여 트리(폴더/전화 아이콘) 구조로 그리며, 접고 펼칠 수 있는 인터랙티브 액션을 제공합니다.
* **노드 조작**:
  * **수정**: 노드의 연필(✏️) 아이콘을 눌러 그룹의 이름 또는 연락처의 이름과 전화번호 리스트를 자유롭게 편집합니다.
  * **추가**: 상위 그룹의 플러스 아이콘(`➕📁`, `➕📞`)을 클릭하여 하위에 새로운 그룹이나 번호를 안전하게 생성합니다.
  * **삭제**: 휴지통(🗑️) 아이콘을 통해 손쉽게 노드를 완전히 제거합니다.
* **검색 및 포커스**:
  * 사이드바 검색창에 키워드 입력 시 전체 데이터를 실시간 필터링하고 검색 결과가 포함된 트리를 자동 전개하며 포커스를 이동해 하이라이트합니다.
* **저장 및 배포 단추**:
  * 상단 고정 헤더 바에 `저장하기` 및 `GitHub 배포` 액션 버튼을 배치하여 손쉬운 배포 경험을 제공합니다.

### C. 정적 웹 뷰어 (`index.html`, `script.js`, `style.css`, `PhoneBook.json`)
최종 사용자(병원 구성원)가 모바일이나 PC 브라우저로 내선번호를 조회하는 검색 중심의 가벼운 클라이언트 사이드 웹 뷰어입니다.
* 배포 완료 후 GitHub Pages를 통해 외부 서버가 없어도 원자력병원 내선번호 검색 서비스를 즉각 가동합니다.

---

## 3. 배포 필터링 정책 (`.gitignore`)
원격 저장소를 오직 뷰어 실행에 적합한 정적 리소스 파일로만 청결히 유지하기 위해 다음의 폴더와 소스는 커밋 및 업로드 대상에서 배제합니다.
- Node.js 종속 패키지 (`node_modules/`)
- 로컬 웹 서버 로직 (`server.js`)
- 패키지 종속성 정의 (`package.json`, `package-lock.json`)
- 에디터 작업 영역 소스 (`editor_home/`)
- 로컬 파이썬 가상환경 및 변환 도구 (`.venv/`, `pyproject.toml`, `uv.lock`, `transform_json.py` 등)
