# K-Volley Lab V-리그 팀 명단 자동화 운영 v1

## 목적
KOVO 공식 공시 수집 결과를 GPT/ChatGPT 없이 GitHub Actions만으로 현재 시즌 V-리그 선수명단까지 안전하게 게시한다.

## 실제 데이터 경로
KOVO 공식 공지·공시
→ `registration_rows.csv` / `change_events.csv`
→ `roster_projection.json` / `roster_review_queue.json`
→ `kovo_team_roster_publish.py`
→ 남녀 `rosters.json`
→ Git commit
→ GitHub Pages build
→ 공개 JSON exact readback

## 실행 주기
GitHub cron은 매시간 13분에 시작한다. 실제 네트워크 수집은 cadence gate가 결정한다.

- 최근 14일 안에 선수 변동 공시가 있는 집중 상태: 1시간마다
- 정규 시즌 중 일반 상태: 3시간마다
- 시즌 종료 후: 하루 1회, 08:13 KST
- 수동 workflow_dispatch: 즉시 실행

현재 시즌 종료일 이후에는 공시 모니터링만 계속하고 2026-27 roster 파일은 수정하지 않는다.
새 시즌 baseline 검증 후 `data/team-rosters/v-league/index.json`의 `currentSeason`을 전환해야 게시가 재개된다.

## 자동 반영 안전 규칙
1. projection에 포함된 high-confidence 공식 등록은 현재 roster에 추가할 수 있다.
2. 기존 선수 삭제는 projection에서 빠졌다는 이유만으로 하지 않는다.
3. 삭제에는 applied high-confidence 해지/방출/은퇴/이적/임대 이벤트가 필요하다.
4. `roster_review_queue.json`의 blocked source와 연결된 기존 선수는 마지막 검증 명단을 유지한다.
5. 외국인 선수의 약칭/정식명 차이는 팀 + 등번호 + 동일 공시 source로 재식별한다.
6. Player_ID가 없는 신규 선수는 명단에는 표시하되 ID를 임의 생성하지 않는다.
7. 팀 내 동일 등번호 또는 Player_ID 중복이 생기면 publication을 실패시킨다.
8. 종료된 시즌은 새 공시로 덮어쓰지 않는다.

## 현재 팀 페이지 연결
팀 페이지는 현재 시즌 남녀 `rosters.json`을 프로팀의 최신 명단 source로 사용해야 한다.
Player_ID가 있는 선수는 기존 Player Master 프로필과 합쳐 상세정보/메모/비교를 유지한다.
Player_ID 미연결 선수는 최신 roster에는 표시하되 개인 메모·비교·프로필은 연결 완료 전 비활성 처리한다.

## 시즌 저장
- 안정 식별자: Player Master / 향후 Team Master
- 시즌 snapshot:
  - `data/competitions/v-league-men-<season>/rosters.json`
  - `data/competitions/v-league-women-<season>/rosters.json`
- 공식 변동 원장:
  - `data/kovo/official-notices/<season>/change_events.csv`
- 시즌 포인터:
  - `data/team-rosters/v-league/index.json`
- 종료 시즌: frozen 처리 후 자동 수정 금지

## 운영 확인
각 roster 변경 commit 후 GitHub Pages build를 명시적으로 요청하고,
`kovo_team_roster_public_verify.py`가 공개 남녀 roster JSON을 로컬 commit과 exact semantic comparison한다.

## 복구
문제가 생기면 해당 GitHub Actions commit을 revert한다.
공시 원장 자체는 삭제하지 않고, roster snapshot만 마지막 정상 commit으로 복원한다.
