# K-Volley Lab TODO

이 문서는 K-Volley Lab 홈페이지의 다음 작업 목록을 정리한다.

작업 우선순위는 현재 구조 안정화 → 디자인 통일 → 데이터 분리 → 기능 확장 순서로 진행한다.

## 1. 최우선 작업

### 1-1. README 수정

현재 `README.md`는 GitHub 기본 프로필 템플릿 상태다.

해야 할 일:

- K-Volley Lab 프로젝트 소개로 변경
- 사이트 목적 설명
- 현재 기능 목록 정리
- 작업 시 확인해야 할 문서 링크 추가

예상 작업 파일:

```text
README.md
```

### 1-2. 공통 디자인 정리

현재 페이지별 CSS가 흩어져 있다.

해야 할 일:

- `assets/css/style.css` 생성
- 공통 색상 변수 정리
- 헤더, nav, 버튼, 카드, 패널 스타일 통합
- 기존 페이지에서 점진적으로 공통 CSS 사용

예상 작업 파일:

```text
assets/css/style.css
index.html
domestic-db.html
vnl.html
players.html
player.html
player-search.html
schedules.html
```

### 1-3. 메뉴 구조 통일

현재 메뉴 구성이 페이지마다 다르다.

권장 기본 메뉴:

```text
Home
국내 선수 DB
VNL
선수 검색
일정
팜플렛
Simulator
Request
```

해야 할 일:

- 모든 주요 페이지의 메뉴 순서 통일
- active 표시 방식 통일
- Request 링크는 Google Form 새 창으로 열기

## 2. 데이터 구조 정리

### 2-1. VNL 선수 데이터 분리

현재 `players.json`은 VNL 선수 데이터다.

해야 할 일:

- 기존 `players.json`을 VNL용 데이터로 명확히 지정
- 장기적으로 `data/vnl/players-2026.json`으로 이동
- `players.html`, `player.html`의 fetch 경로 정리

권장 구조:

```text
data/vnl/players-2026.json
```

### 2-2. 국내 선수 샘플 데이터 생성

`player-search.html`은 국내 선수 DB용 데이터 구조를 기대하지만, 현재 VNL 선수 JSON을 불러오고 있다.

해야 할 일:

- 국내 선수 샘플 JSON 생성
- `player-search.html`의 fetch 경로 수정
- `player-profile.html`, `growth-timeline.html`과 연결 구조 정리

권장 구조:

```text
data/domestic/players-sample.json
data/domestic/sources-sample.json
```

국내 선수 데이터 필드 예시:

```json
{
  "player_id": "KVL-KMJ-060101",
  "name_ko": "김민준",
  "name_en": "Kim Minjun",
  "position": "OH",
  "sub_position": "OP",
  "height_cm": 190,
  "birth_year": 2006,
  "current_team": "인하대학교",
  "current_level": "대학",
  "tags": ["U대표", "공격형 OH"],
  "source_ids": ["SRC-2026-001"]
}
```

### 2-3. 일정 데이터 분리

`schedules.html` 안에 일정 데이터가 직접 들어가 있다.

해야 할 일:

- VNL 일정 JSON 분리
- AVC 일정 JSON 분리
- `schedules.html`에서 선택한 대회 JSON을 불러오게 수정

권장 구조:

```text
data/schedules/vnl-2026-men.json
data/schedules/avc-men-cup-2026.json
```

## 3. 기능별 작업

### 3-1. 국내 선수 성장 DB

해야 할 일:

- 국내 선수 검색 데이터 구조 확정
- 선수 프로필 페이지 연결
- 성장 타임라인 페이지 연결
- 출처 표시 영역 추가

우선순위: 높음

### 3-2. VNL DB

해야 할 일:

- 국가별 페이지 구조 통일
- 선수 카드에서 키, 포지션, 생년월일, Volleybox 링크 표시
- 트라이아웃 참가 표시 가능 구조 검토
- 국가별 완료/작성중 상태 표시

우선순위: 높음

### 3-3. 일정 페이지

해야 할 일:

- VNL/AVC 일정 탭 유지
- 월별 달력 UI 개선
- 경기 결과가 있는 경우 `3-0`, `0-3`, `3-2`처럼 괄호 없이 표시
- 승리 팀 bold 처리 가능 구조 검토
- 한국시간 기준 표시 고정

우선순위: 높음

### 3-4. 팜플렛 아카이브

해야 할 일:

- `pamphlet-archive.html` 점검 또는 생성
- 대회명, 연도, 부문, 파일 링크, 출처 링크 필드 설계
- PDF 원본 링크와 요약 정보 분리

우선순위: 중간

### 3-5. Simulator

해야 할 일:

- `simulator.html` 존재 여부 확인
- 본선 진출 경우의 수 계산기 구조 설계
- 조별 승패, 세트득실, 점수득실 입력 구조 검토

우선순위: 중간

## 4. 오류 및 정리 필요 항목

### 4-1. `players.html` CSS 오류 수정

`.card` CSS 안에 `.card:hover`가 잘못 들어가 있다.

해야 할 일:

- CSS 블록 정상화
- 카드 hover 스타일 분리

우선순위: 높음

### 4-2. `players.html`과 `player-search.html` 역할 구분

현재 두 페이지가 모두 선수 검색처럼 보인다.

권장 정리:

```text
players.html = VNL/국제 선수 검색
player-search.html = 국내 선수 성장 DB 검색
```

또는 장기적으로:

```text
vnl-players.html
domestic-player-search.html
```

단, 기존 링크가 깨지지 않도록 리다이렉트 또는 메뉴 정리를 먼저 한다.

### 4-3. 샘플 숫자 표시 정리

메인 페이지와 국내 DB 페이지에는 샘플 등록 선수 수, 샘플 등록 대회 수 등이 표시되어 있다.

해야 할 일:

- 실제 데이터 연결 전까지 `샘플` 또는 `준비중` 표시를 명확히 유지
- 오해될 수 있는 확정 숫자는 피하기

## 5. 문서 유지보수

아래 문서는 작업 후 필요할 때 업데이트한다.

```text
PROJECT_RULES.md
DESIGN_SYSTEM.md
STRUCTURE.md
TODO.md
```

새 기능을 추가하거나 파일 구조를 크게 바꾸면 `STRUCTURE.md`와 `TODO.md`를 함께 갱신한다.

## 6. 추천 작업 순서

현재 기준으로 다음 순서가 가장 안전하다.

```text
1. README.md 프로젝트용으로 수정
2. assets/css/style.css 생성
3. 헤더/메뉴 공통화
4. players.html CSS 오류 수정
5. 선수 검색 페이지 역할 분리
6. 국내 선수 샘플 JSON 생성
7. 일정 데이터 JSON 분리
8. 팜플렛 아카이브 구조 정리
9. Simulator 구조 정리
```

## 7. 장기 목표

K-Volley Lab의 장기 목표는 다음과 같다.

- 한국 배구 선수 DB
- 대회 팜플렛 아카이브
- 국제대회 선수 DB
- 경기 일정 및 결과 달력
- 본선 진출 계산기
- 전력분석관용 자료 정리 도구
- 사용자 제보 기반 데이터 보완 시스템

작업은 빠르게 늘리는 것보다, 같은 구조 안에서 계속 확장될 수 있게 만드는 것을 우선한다.
