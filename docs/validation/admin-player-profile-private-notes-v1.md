# Admin player profile private notes v1

## Purpose
관리자 로그인 UX 검수 단계에서 선수 검색의 '프로필 보기'로 이동했을 때 해당 선수에게 남긴 비공개 메모를 프로필 안에서 날짜순으로 확인한다.

## Changes
- 관리자 선수 목록/관심선수/메모 화면에서 KVL Player ID를 시각적으로 숨김. 내부 연결키로는 계속 사용.
- 소속 표시를 학교 선수의 경우 `학교 · 학년` 형식으로 변경.
- 관리자 페이지의 프로필 링크에 `admin=1`을 붙여 로그인 상태용 프로필 UX만 활성화.
- 기존 공개 `player.html`의 선수정보 렌더링은 그대로 재사용.
- 관리자 프로필에서 해당 선수의 private notes만 필터링하여 작성일 내림차순으로 표시.
- 메모 카드에는 시즌, 제목, 본문, 작성일, 최근 수정일(변경된 경우)을 표시.
- 관리자 프로필에서 뒤로가기는 `내 선수 공간`으로 연결.
- 일반 `player.html?id=...` 접근은 private note script가 즉시 비활성화되어 기존 공개 프로필 UI를 변경하지 않음.

## Security
- private notes는 기존 Supabase Auth 세션을 `getUser()`로 재확인한 뒤 Edge Function의 관리자 allow-list 검사를 다시 통과해야 표시됨.
- Supabase schema, Edge Function, RLS, 관리자 권한 구조는 변경하지 않음.
- Player ID는 URL/내부 키에는 사용하지만 로그인 UI의 선수명 옆에는 표시하지 않음.

## Static validation
- admin workspace JS syntax: PASS.
- admin private profile JS syntax: PASS.
- visible player ID markup in admin player/note rows: none.
- profile route carries admin-only activation query.
- public profile activation guard: PASS.
- created_at / updated_at timeline rendering: PASS.
- profile assets wired in player.html: PASS.

## Owner verification after deploy
1. 관리자 페이지에서 대학 선수 확인: `학교 · N학년` 표시.
2. 선수 이름 옆 KVL-P 번호 미표시.
3. '프로필 보기' 진입 후 해당 선수 메모가 작성 날짜/내용과 함께 표시.
4. 메모가 없는 선수는 비공개 메모 없음 안내.
5. 일반 공개 선수 프로필 주소에서는 관리자 메모가 보이지 않는지 확인.
