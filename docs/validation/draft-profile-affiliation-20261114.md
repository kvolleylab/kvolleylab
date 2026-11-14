# 2026-11-14 신인 드래프트 지명 구단 → 선수 프로필 표시 (검수용)

상태: **구현 브랜치 / CI 검증 대기 / 운영 배포 아님**.
기준 main: `6d3ba0ddc7334c54095e779955c6e76c2b62a6f3`.
사용자 요구: 드래프트에서 프로팀에 선발된 사실과 구단이 기존 선수 프로필에 보여야 하며, 향후 KOVO 선수등록 공시와 현재 소속이 함께 갱신되어야 한다.
후속 전체 자동화: [Issue #331](https://github.com/kvolleylab/kvolleylab/issues/331).

## 실제 확인한 입력
- 공식 결과 `data/draft-applicants/2026-27/results.json`: 남자 18건, 여자 16건, 총 34건 (`VERIFIED/PUBLIC`).
- 기존 링크 `data/draft-applicants/2026-27/player-links.json`: 34명 중 30명은 Player_ID 연결, 4명 미연결(남 이율리; 여 김아중, Audrey Pak, 오해솔). **이름으로 ID를 추측하지 않는다.**
- 기존 프로필 `assets/js/player-profile-integration-v1.mjs`은 드래프트 이력 하단 표시만 가능했다. 본 변경으로 프로필 첫 카드에도 지명 구단·순위·출신 소속을 보여준다.
- 남녀 14개 구단 `data/competitions/v-league-{men,women}-2026-27/rosters.json` 및 `data/master/player_master_pro_vleague_2026_27_v1.json`은 **이번 범위에서 변경하지 않는다**.
- KOVO 공시 수집·roster projection은 운영 데이터 쓰기와 연결되지 않으므로 이번 변경만으로 최신 선수명단/프로 현 소속이 자동 갱신되지는 않는다.

## 표시 규칙
- 결과의 `record_status=VERIFIED`, `access_level=PUBLIC`, `status=selected` 및 연결의 `match_status=matched`, `profile_verified=true`, `Player_ID`와 실제 프로필 이름 일치가 모두 필요.
- `지명 구단 / n라운드 n순위`, 수련선수는 `수련선수 지명` 표시. 공식 출처 및 Draft Hub 연결 유지.
- UI 경고: **드래프트 지명은 KOVO 선수 등록과 다름**. 최신 소속은 등록 공시 확인 후 별도 반영.
- 학교·학년·과거 대회·기존 소속·등록 상태는 수정하지 않는다. 우선은 **검증된 지명 사실만 강조**한다.
- PC·모바일 기존 선수 프로필 카드 재사용. 남 파랑, 여 로즈 톤.
- 동일한 Player_ID 이력을 동일 시즌에 중복 연결하지 않고, 프로필 접근 경로·관심선수·메모 연결 유지.

## 수정 파일
- `assets/js/draft-profile-selection-v1.mjs` (신규 독립 함수)
- `assets/js/player-profile-integration-v1.mjs`
- `assets/css/player-profile-integration-v1.css`
- `player.html` (정적 자산 캐시 버전)
- `tests/draft-profile-selection.test.mjs`
- `.github/workflows/player-draft-integration.yml`
- `docs/KVL_DECISION_LOG.md` 및 본 검증 기록

## 검수 및 후속
- 회귀 테스트: 34개 지명, 30개 검증 프로필, 4개 미연결 보류, 윤경 1라운드 1순위 / OK저축은행, 수련선수, 중복 렌더 방지, 기존 학교 보존.
- GitHub PR CI 실제 통과와 브라우저 360/390px 및 PC 검수, 공식 출처/링크 검증은 별도 증거를 남겨야 한다. **미실시 항목을 통과로 표시하지 않는다.**
- 운영 배포는 별도 사용자 승인 후. 되돌릴 때는 해당 PR merge commit을 revert한다. 기존 MASTER를 오래된 버전으로 덮어쓰지 않는다.


## GitHub Actions 검증 결과 (2026-11-14)
- [Player and Draft Integration CI run 43600667912](https://github.com/kvolleylab/kvolleylab/actions/runs/43600667912)
- `draft-board` job: **success**.
- `identity-and-routing` job: **failure**, 전체 Node 34개 중 24개 성공/10개 실패. Python 신청명단 테스트 14개 통과.
- **이번 변경에 새로 추가한 `tests/draft-profile-selection.test.mjs`의 4개는 전부 통과**: 34 지명/30 연결/4 보류, 정확한 Player_ID·구단, 기존 학교 무변경 및 출처, 수련선수 표기.
- 기존 실패 대표 원인: 이전 테스트가 URL 버전 쿼리(`player-workspace-core.mjs?v=20261111-pro-1`)를 실제 파일 경로로 취급하는 오류, 과거 선수 수 `1,842` 명 고정 검증과 최신 `2,013`명 카탈로그의 불일치, 과거 여섯 선수 정정 시점의 해시 고정 검사. 본 변경은 기존 `player_master_pro`, 원래 CI 테스트의 검증 계약, 데이터 로더를 수정하지 않았다.
- 따라서 **새 기능 단위 테스트는 통과했지만 전체 기존 CI는 통과하지 않았으며 READY FOR REVIEW / 배포 완료로 표시할 수 없다**. 별도 기존 테스트 계약 정비와 PC·모바일 실제 브라우저 검증이 필요하다.
