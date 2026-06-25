# K-Volley Lab Structure

이 문서는 K-Volley Lab 저장소의 현재 구조와 앞으로의 권장 구조를 정리한다.

## 1. 현재 저장소 상태

현재 저장소는 정적 HTML 기반의 초기 홈페이지 구조다.

확인된 주요 파일:

```text
kvolleylab/
├─ README.md
├─ index.html
├─ domestic-db.html
├─ domestic-style.css
├─ vnl.html
├─ players.html
├─ player.html
├─ player-search.html
├─ players.json
└─ schedules.html
```

## 2. 현재 페이지 역할

### `index.html`

K-Volley Lab 메인 페이지다.

역할:

- 브랜드 소개
- 주요 기능 카드
- 국내 선수 DB, 선수 검색, 일정 페이지 등으로 연결
- 제보/요청 폼 연결

### `domestic-db.html`

국내 선수 성장 DB 소개 페이지다.

역할:

- 국내 선수 성장 이력 DB 방향 설명
- 공개 자료 기반 운영 원칙 안내
- 선수 검색, 프로필 예시, 성장 타임라인, 팜플렛 아카이브로 연결

### `vnl.html`

VNL 남자부 대표팀 DB 페이지다.

역할:

- 국가별 VNL 선수 DB 진입
- 일본, 브라질, 폴란드 등 국가 페이지 연결
- VNL 일정 페이지 연결

### `players.html`

현재는 VNL 선수 검색 페이지에 가깝다.

역할:

- `players.json`을 불러와 국가/포지션별 검색
- 선수 카드를 클릭하면 `player.html?name=...`으로 이동

주의:

- `players.html`은 VNL 선수 데이터 구조에 맞춰져 있다.
- 국내 선수 검색용 페이지와 혼동하지 않도록 역할을 명확히 해야 한다.

### `player.html`

VNL 선수 상세 페이지다.

역할:

- `players.json`에서 이름 기준으로 선수 상세 정보 표시
- Volleybox 링크와 VNL 공식 프로필 링크 표시

### `player-search.html`

국내 선수 성장 DB용 검색 페이지로 설계되어 있다.

주의:

- 현재 `players.json`을 불러오고 있으나, 코드가 기대하는 데이터 필드가 VNL용 `players.json`과 맞지 않는다.
- `name_ko`, `name_en`, `player_id`, `current_team`, `current_level` 등을 기대한다.
- 따라서 국내 선수용 JSON을 별도로 만들거나 코드를 수정해야 한다.

### `players.json`

현재 VNL 선수 데이터 파일이다.

대표 필드:

```json
{
  "country": "Brazil",
  "flag": "🇧🇷",
  "number": 1,
  "name": "Darlan Ferreira Souza",
  "korean": "다를란 페헤이라 소우자",
  "position": "O",
  "height": 192,
  "dob": "2002-06-24",
  "club": "TBD",
  "vnlProfile": "...",
  "volleybox": "...",
  "status": "VNL 프로필/키 확인완료"
}
```

### `schedules.html`

대회 일정 달력 페이지다.

역할:

- VNL 2026 Men
- AVC Men’s Cup 2026
- 한국시간 기준 월별 달력 표시

주의:

- 현재 일정 데이터는 페이지 안의 JavaScript 객체에 직접 들어가 있다.
- 향후 대회가 많아지면 JSON 데이터 파일로 분리하는 것이 좋다.

### `domestic-style.css`

국내 선수 DB 계열 일부 페이지에서 사용하는 CSS 파일이다.

주의:

- 전체 사이트 공통 스타일은 아직 분리되어 있지 않다.
- 향후 `assets/css/style.css`로 통합하는 것이 좋다.

## 3. 현재 구조상 가장 중요한 문제

### 1. 공통 CSS 부재

여러 HTML 파일이 각자 CSS를 가지고 있어 디자인이 흔들릴 수 있다.

개선 방향:

```text
assets/css/style.css
```

공통 색상, 헤더, 버튼, 카드, 그리드 스타일을 이 파일로 옮긴다.

### 2. 선수 데이터 역할 혼재

현재 `players.json`은 VNL 선수용인데, `player-search.html`은 국내 선수 DB용 데이터 구조를 기대한다.

개선 방향:

```text
data/vnl/players-2026.json
data/domestic/players-sample.json
```

### 3. 일정 데이터 하드코딩

`schedules.html`에 경기 일정이 직접 들어가 있다.

개선 방향:

```text
data/schedules/vnl-2026-men.json
data/schedules/avc-men-cup-2026.json
```

## 4. 권장 장기 구조

향후 목표 구조는 다음과 같다.

```text
kvolleylab/
├─ index.html
├─ pages/
│  ├─ domestic-db.html
│  ├─ vnl.html
│  ├─ players.html
│  ├─ player.html
│  ├─ player-search.html
│  ├─ schedules.html
│  ├─ simulator.html
│  └─ pamphlet-archive.html
├─ assets/
│  ├─ css/
│  │  └─ style.css
│  ├─ js/
│  │  ├─ main.js
│  │  ├─ players.js
│  │  └─ schedules.js
│  └─ images/
├─ data/
│  ├─ vnl/
│  │  └─ players-2026.json
│  ├─ domestic/
│  │  ├─ players-sample.json
│  │  └─ sources-sample.json
│  └─ schedules/
│     ├─ vnl-2026-men.json
│     └─ avc-men-cup-2026.json
├─ docs/
│  ├─ data-policy.md
│  └─ source-rules.md
├─ PROJECT_RULES.md
├─ DESIGN_SYSTEM.md
├─ STRUCTURE.md
└─ TODO.md
```

단, 현재는 GitHub Pages 정적 사이트로 운영 중이므로 한 번에 큰 이동을 하지 않는다. 링크 깨짐을 막기 위해 점진적으로 이동한다.

## 5. 페이지 명명 원칙

권장 파일명:

```text
index.html
vnl.html
players.html
player.html
schedules.html
pamphlet-archive.html
simulator.html
domestic-db.html
player-search.html
```

대회별 페이지가 필요할 경우:

```text
schedule-vnl-2026.html
schedule-avc-men-cup-2026.html
```

데이터 파일은 다음 형식을 권장한다.

```text
players-2026-vnl-men.json
schedule-2026-vnl-men.json
schedule-2026-avc-men-cup.json
```

## 6. 작업 전 확인 체크리스트

새 작업을 시작할 때는 다음을 확인한다.

```text
1. 이 작업이 어느 페이지에 영향을 주는가?
2. 기존 링크가 깨지지 않는가?
3. 같은 역할의 페이지가 이미 존재하는가?
4. 사용할 데이터 JSON 구조가 화면 코드와 맞는가?
5. 공통 디자인 규칙을 따르는가?
6. 모바일 화면에서 볼 수 있는가?
7. 출처가 필요한 데이터인가?
```

## 7. 우선 정리해야 할 구조 작업

1. `README.md`를 프로젝트 소개용으로 수정
2. 공통 CSS 파일 `assets/css/style.css` 생성
3. 헤더/메뉴 디자인 통일
4. `players.html`과 `player-search.html` 역할 정리
5. VNL 선수 데이터와 국내 선수 데이터 분리
6. 일정 데이터를 JSON으로 분리
7. 팜플렛 아카이브 구조 생성

## 8. 운영 메모

K-Volley Lab은 장기 프로젝트다.

따라서 단기적으로는 현재 파일명을 유지하면서 기능을 살리고, 중장기적으로 `assets/`, `data/`, `pages/` 구조로 이동하는 것이 좋다.

기능을 추가할 때는 임시 코드보다 나중에 다시 찾고 고칠 수 있는 구조를 우선한다.
