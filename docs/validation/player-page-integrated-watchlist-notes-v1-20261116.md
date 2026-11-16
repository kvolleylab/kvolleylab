# Player Page Integrated Watchlist + Notes v1 — 2026-11-16

## 목적
로그인 후 선수 페이지 안에서 관심선수와 개인 메모를 바로 사용한다.
별도 관리자 선수공간으로 이동하지 않고, 현재 선수 검색 화면의 기존 탭을 실제 데이터에 연결한다.

## UX
### 선수 검색
- 기존 선수 카드 UI 유지.
- 관심선수 버튼은 실제 bookmark 저장/해제.
- 메모 버튼은 같은 페이지 note dialog 오픈.
- 프로필은 기존 모달/전체화면 유지.

### 내 추적 선수
- 별도 페이지가 아니라 기존 선수 검색 결과에 bookmarks 필터를 적용.
- 기존 분류/성별/포지션/학교·팀 필터와 조합 가능.
- 관심선수 해제 시 즉시 목록에서 사라짐.
- 상단 badge와 member summary count 즉시 갱신.

### 내 메모
- 같은 players.html의 notes tab에서 실제 private notes 표시.
- 선수명 / 소속 / 시즌 / 작성일 / 수정일 / 제목 / 본문 표시.
- 검색 및 시즌 필터.
- 같은 페이지에서 수정/삭제.
- 선수 프로필로 바로 이동 가능.

### 프로필 팝업 연동
- embedded player profile의 비공개 메모에서 수정/새 메모 선택 시 parent players.html에 postMessage.
- 관리자 작업공간으로 이동하지 않고 같은 선수 페이지 note dialog 오픈.
- 전체화면 player profile의 메모 action은 players.html note route로 연결.

## 데이터
현재 로그인 오픈 단계에서는 active admin account만 players 영역에 접근 가능하므로,
기존 admin-player-workspace Edge Function의 owner-scoped bookmark/note API를 그대로 사용한다.

기존 데이터 보존:
- bookmarks 2
- notes 5
- active admin 1

일반회원 계정 오픈 전에는 별도 member CRUD API를 만들지 않는다.
회원 오픈 시 같은 UI를 유지하고 backend authorization layer만 member-aware endpoint로 교체한다.

## 검증
- latest main 기준 behind 0
- HTML id / workspace $() refs 누락 0
- list/toggle bookmarks action 연결
- list/save/delete notes action 연결
- tracking view = bookmark filter
- notes view = in-page render
- note modal 존재
- profile edit/new postMessage bridge 존재
- players workspace asset cache bumped
- player private-note JS/CSS cache bumped
