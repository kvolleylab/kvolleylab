# K-Volley Lab 팀 명단 시즌 운영 기준 v1

## 핵심 원칙
- GPT/ChatGPT는 운영 자동화의 필수 경로에 두지 않는다.
- GitHub Actions + 공식 KOVO 데이터/공시 + 검증 스크립트가 현재 명단을 만든다.
- Player ID와 Team ID는 시즌이 바뀌어도 유지한다.
- 시즌 명단은 덮어쓰지 않고 시즌별 스냅샷으로 보관한다.
- 시즌 종료 후 해당 시즌 명단은 immutable(동결) 처리한다.

## 데이터 역할
1. 안정 ID
   - Player Master: 선수 영구 ID
   - Team Master: 팀 영구 ID
2. 공식 변동 원장
   - data/kovo/official-notices/<season>/registration_rows.csv
   - data/kovo/official-notices/<season>/change_events.csv
3. 현재 시즌 projection
   - data/kovo/official-notices/<season>/roster_projection.json
4. 홈페이지에 게시되는 검증 스냅샷
   - data/competitions/v-league-men-<season>/rosters.json
   - data/competitions/v-league-women-<season>/rosters.json
5. 시즌 인덱스
   - data/team-rosters/v-league/index.json
   - 현재 시즌과 과거 시즌의 roster 경로만 참조하며 선수 데이터를 중복 저장하지 않는다.

## 권장 시즌 인덱스
```json
{
  "currentSeason": "2026-27",
  "seasons": [
    {
      "season": "2026-27",
      "status": "active",
      "men": "data/competitions/v-league-men-2026-27/rosters.json",
      "women": "data/competitions/v-league-women-2026-27/rosters.json",
      "frozen": false
    }
  ]
}
```

## GitHub Actions 흐름
KOVO 공식 공시/등록
→ registration_rows/change_events 수집
→ roster_projection 재생성
→ 신원/중복/소속 충돌 검증
→ 확정 가능한 이벤트만 시즌 rosters.json 반영
→ Player Master 현재 소속 projection 갱신
→ 테스트
→ Git commit
→ Pages 배포
→ 배포 결과 readback

자동 적용 금지:
- 동명이인/Player ID 미확정
- 공시 해석이 하나로 결정되지 않는 경우
- 임대/복귀/군입대 등 effective date 불명확
- 기존 MASTER와 충돌하는 경우

이 경우 roster_review_queue.json으로 보내고 홈페이지의 마지막 검증 명단을 유지한다.

## 실행 주기 권장
- 시즌 중: 3시간마다 GitHub Actions 확인
- 드래프트/등록 마감/FA 집중기간: 1시간마다
- 비시즌: 하루 1회
- workflow_dispatch 수동 실행 유지

## 시즌 전환
1. 새 시즌 디렉터리 생성.
2. KOVO 최초 등록 명단을 baseline으로 저장.
3. currentSeason 포인터를 새 시즌으로 변경.
4. 이전 시즌은 final checksum/commit SHA를 기록하고 frozen=true.
5. 과거 팀 페이지는 해당 시즌 rosters.json을 읽는다.
6. 과거 시즌 파일은 자동화가 다시 수정하지 않는다.

## 팀 페이지
- 기본 화면은 currentSeason.
- 이후 시즌 선택 UI를 추가하면 현재/과거 명단을 같은 팀 상세에서 조회한다.
- 과거 명단은 Player ID를 통해 현재 선수 프로필과 연결하되 당시 소속/등번호/포지션은 당시 시즌 snapshot을 표시한다.
