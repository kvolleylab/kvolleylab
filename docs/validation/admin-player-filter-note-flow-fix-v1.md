# Admin player search / note flow fix v1

## 검수 피드백 반영
1. 관리자 선수 검색에 명시적 분류 필터 추가.
2. `프로 · 2026-27 등록` 선택 시 current roster만 표시.
3. 프로팀 드롭다운 추가.
4. 검색창에 `프로 / 프로배구 / V-리그 / V리그` 입력 시에도 current roster만 표시.
5. 기존 프로/은퇴 선수의 과거 MASTER 기록은 삭제하지 않음.

## 메모 수정 UX
- 기존 메모 수정창에서 `작성일 · 최근 수정일` 표시.
- 프로필에서 새 메모/수정으로 진입한 경우 저장 후 원래 선수 프로필로 자동 복귀.
- 복귀한 프로필 타임라인에서 갱신된 최근 수정일을 바로 확인 가능.

## 로그아웃
- 관리자 작업공간 로그아웃 후 내부 관리자 로그인 폼에 머무르지 않고
  `member-login.html`로 이동.
- next target은 `players.html?member-gate-preview=1`.

## Static verification
- admin JS syntax PASS
- private profile JS syntax PASS
- admin JS DOM missing refs: 0
- currentPro tag present
- explicit current pro + team filter present
- note audit present
- safe profile-return flow present
- latest main behind: 0
