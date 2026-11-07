# KVL Admin → Member UX Preview v2

## Purpose
관리자 전용 로그인 상태에서 향후 일반 회원이 사용할 로그인 UX를 먼저 검수한다. 이 단계에서는 전역 로그인이나 일반 회원 로그인 경로를 열지 않는다.

## UX changes
- 관리자 전용 도구 느낌을 줄이고 로그인 사용자용 `내 선수 공간` 구조로 변경.
- 상단에 로그인 상태/관리자 권한을 명확히 표시.
- 주요 탭을 `선수 검색 / 관심선수 / 내 메모 / 분석` 4개로 통일.
- 선수 검색 결과에서 관심선수, 메모 작성, 공개 프로필 보기 연결.
- 관심선수 화면에서 같은 선수 행 UI를 재사용.
- 내 메모 카드에 선수·소속·포지션·시즌·최근 수정 정보를 함께 표시.
- 메모 검색 및 시즌 필터 추가. 저장 스키마는 변경하지 않음.
- 분석 탭은 관리자 전용 준비 영역으로 두고, 선수 분석 / 경기 분석 / 회원 공개 후보의 향후 구조를 표시.
- PC와 모바일 모두 같은 정보 구조를 유지.

## Security / rollout
- `admin-player-workspace.html`은 계속 noindex/nofollow이며 공개 메뉴에 연결하지 않음.
- 일반 회원 가입/로그인, 전역 로그인 상태, 회원 전용 페이지는 아직 활성화하지 않음.
- Supabase Auth/Edge Function/관리자 allow-list 및 private bookmarks/notes 저장 구조는 변경하지 않음.
- 기존 메모와 관심선수 데이터는 마이그레이션 없이 그대로 사용.

## Static validation
- Admin client module syntax compilation after stripping ESM imports: PASS.
- Every `$('...')` DOM id referenced by the admin client exists in the new HTML: PASS.
- Required panes `searchPane / bookmarksPane / notesPane / analysisPane`: PASS.
- No Supabase schema or Edge Function change in this UX-only revision.

## Owner validation after deploy
1. 관리자 세션이 자동 복원되는지 확인.
2. 선수 검색 → 관심선수 등록/해제.
3. 관심선수 탭 → 메모 작성.
4. 내 메모 → 검색/시즌 필터/수정.
5. 분석 탭 PC·모바일 레이아웃.
6. 로그아웃 후 다시 로그인해 기존 데이터 유지 확인.
