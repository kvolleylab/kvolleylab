# 선수 현재값 확인 기록 — 오재성 첫 검증 (2026-11-03 KST)

Status: **POLICY APPROVED / NATIVE RECORD + READBACK VERIFIED / MANUAL GITHUB IMPLEMENTATION IN PR / GITHUB WRITE NOT EXECUTED / NOT DEPLOYED**.

사용자는 현재값 확인 기록을 별도로 도입하고 오재성 1명부터 검증하도록 승인했다. 기준 main은 `56006570b078266470765b991fb81ade68abaa3d`, 구현 검토는 [PR #241](https://github.com/kvolleylab/kvolleylab/pull/241)이다. 이전 [공식 효력일 재검토](player-effective-date-review-20261102.md)에서의 미확인 효력일과 당시 검토 상태는 보존한다.

## 1. 실제 완료한 결과

| 항목 | 실제 결과 |
|---|---|
| 운영원칙 | 기존 Google 문서를 같은 ID로 `KVL_운영원칙_MASTER_v18`로 개정하고 제목·11-3-1절·변경 이력을 재조회 |
| 대상 | 기존 `KVL-P-001585`, 오재성, 우리카드, 남자부 2026–27, 확인 필드 `number`, 값 `5` |
| 신원 보조 근거 | KOVO 선수 `0001550`, 기존 생년월일과 포지션 L 일치; 새 ID 생성 없음 |
| 별도 기록 위치 | 기존 남자 선수 MASTER의 `KVL_현재값확인`, sheetId `710020129`, 26열, 첫 기록 2행 |
| 최초 기록 | `KVL-CVV-4d5951a95a34d4c419203297`, runId `native-20261103-oh-current-v1` |
| 실제 저장 | 2026-11-03 01:02:12 KST, 한 행 추가 |
| 독립 재조회 | 01:02:13 KST 수신, 실제 셀·메타데이터 검증 완료 01:03:55 KST |
| 같은 실행 재시도 | 공식 자료 재조회 후 01:04:46 KST 검증, `already_verified`, 추가 0행, 저장된 최초 시각 유지 |
| 현재등록 보존 | 지정 읽기 범위 `현재등록_공시기반!A1:M300`의 값·수식·메모·검증 규칙·명시 링크·보호 구조 보존 검사 통과 |
| 기존 사건 이력 | `KVL_자동반영이력!A1:V200` 실제 전후 조회 동일 |
| 변경량 | 선수 셀 0, 기존 사건 이력 0, 공개 roster 파일 0, 홈페이지 게시 0 |
| 날짜 | `effective_date=null`, `source_as_of=null`; 공시일과 관측일로 대체하지 않음 |
| 실행 주체 | 연결된 native Google 도구. GitHub Actions 서비스계정의 실제 쓰기 검증은 아직 수행하지 않음 |

정제된 실제 결과: [`current_value_verification.json`](../../data/player-updates/current_value_verification.json). 최초 저장과 쓰기 없는 재시도 영수증을 모두 담는다. 원격 전체 행·비공개 메모·인증정보·비공개 MASTER에서 파생한 계획 해시는 공개하지 않는다.

## 2. 공식 자료와 의미

서로 다른 역할의 공개 공식 endpoint 다섯 개를 실제로 조회했다.

| 공식 자료 | 확인한 사실 |
|---|---|
| [공시 157018](https://kovo.co.kr/news/official-notices/157018) / [공식 API](https://user-api.kovo.co.kr/contents/news/official-notices/157018) | 오재성 배번 3→5, 본문의 공시일 2026-09-16. 명시적 효력일은 없음 |
| [우리카드 현재 선수 명단](https://user-api.kovo.co.kr/teams/1009/players) | 공식 선수 ID가 정확히 한 번 존재, 5번·L·REGISTER, 공개된 정식 선수 |
| [선수 상세](https://user-api.kovo.co.kr/players/0001550) / [구단 선수 페이지](https://wooriwon.kovo.co.kr/teams/players?playerCode=0001550) | 공식 ID·이름·생년월일·구단·번호·포지션 교차 확인 |
| [현재 시즌](https://user-api.kovo.co.kr/main/game/season) | 시즌 코드 023, 대회 코드 001 |
| [시즌 목록](https://user-api.kovo.co.kr/matches/001/seasons) | 해당 코드가 2026–2027 V-리그인 현재 운영 맥락 확인 |

선택 선수의 정규화 해시는 `36193372cc161608ac02826cd1f97759aac72908cc0548072aaf65b40b7c2331`, 공시 본문 해시는 `bf8be0d5a538ef75fdada84e7befb39ce7bd8b12551ed97734d1555a97d47579`다. 시각은 영수증에서 각 출처별로 분리한다.

현재명단 응답에는 시즌 필드와 공식 기준 시각이 없다. 따라서 `season_basis=official_current_context_only`로 남기며 특정 과거 시즌 명단으로 인증하지 않는다. 시간대 없는 API `createdAt`에 임의 시간대를 붙이지 않고 본문에 명시된 날짜만 `notice_published_at=2026-09-16`으로 보존한다. 이 고정된 5개 자료 검증은 모든 후속 공시를 전수 조사했다는 의미가 아니다. 확인된 원문 버전·현재 상태·값이 달라지면 중단하고 새 검토를 받는다.

## 3. 저장 계약과 실제 호환성

새 탭은 200행×26열이며 첫 행을 고정하고 헤더에 한국어 설명 메모를 제공한다. 기존 표의 행·열·서식은 변경하지 않았다. 26열은 확인 ID, 유형, 기존 선수 ID, 시즌·성별·구단, 필드·값, 미확인 효력일, 공시 ID·URL·본문 해시·공시일, 공식 현재명단 URL·선수 ID·정규화 해시·조회일·명시 기준일, 관측일, MASTER 값·조회일, 검토 역할·시각, 실행 ID, 공개 근거 해시다.

실제 native 통합에서 다음 차이를 확인하고 검증기에 반영했다.

- MASTER의 `1992.04.02`와 공식 자료의 `1992-04-02`는 엄격한 날짜 파싱으로 비교한다. 셀이나 snapshot 원문은 바꾸지 않으며 실행 중 원본 표기가 바뀌어도 동시 편집으로 감지한다.
- Google Sheets가 URL 문자열에 동일 주소의 링크 메타데이터를 자동 추가한다. 공시 URL L열과 명단 URL O열에만 빈 링크 또는 정확히 같은 URL을 허용한다. 다른 링크 대상·다른 열의 숨긴 링크는 차단한다. 실제 저장된 행을 다시 쓰거나 중복 추가하여 해결하지 않았다.
- 최초 기록 시각은 `stored_record`에, 이번 재조회 근거 시각은 `sources.role=current_execution_recheck`에 구분한다. 재시도로 원래 관측 시각이나 검토자를 덮어쓰지 않는다.
- 원격 전체 자료의 해시는 메모리에서 동시 편집을 감지할 때만 사용한다. 비공개 노트가 공개 영수증의 지문에 영향을 주지 않도록 공개 `plan_hash`를 제거했다.

native connector가 실제 Sheets 요청을 수행했고, 수신한 전체 보호 메타데이터 및 한정 CellData 응답을 같은 Python 검증기로 처리했다. 단위 테스트의 가상 응답을 실제 증거로 사용하지 않았다. 이 검증은 GitHub HTTP 인증 transport까지 실행한 종단간 시험과 구분한다. native 시트의 열 폭·행 높이·wrap·헤더 구성은 API로 확인했으며, 로그인된 UI의 실제 화면 렌더 검수는 수행하지 않았다.

## 4. GitHub 수동 실행 경로

기존 `V-League Auto Update v1` workflow에 `player_current_value_check`를 추가한다. 기본값은 false이며 schedule에서는 실행하지 않는다. 정확한 저장소·main·기존 workflow·수동 요청·기존 서비스계정·명시 입력이 모두 일치해야 한다.

순서는 로컬 준비 검사 → 공식 자료 수집 → 최신 main SHA 확인 → 기존 WIF 인증 → 공식 자료 재조회 및 의미상 동일성 확인 → 실제 MASTER·확인 이력 조회 → 한 행 저장 또는 동일 실행 재확인 → 독립 재조회다. 저장 직전 설정·운영기간·실행 맥락과 5분 신선도를 다시 검사한다.

새 모드를 선택하면 기존 경기 공개, 선수 사건 적용, 접근 진단은 실행하지 않는다. job 권한은 `contents: read`, `id-token: write`이며 토큰은 record 단계에만 전달한다. artifact에는 정제된 `report.json` 하나만 보관한다. Git commit/push·Pages·새 cron·서비스계정 키·IAM 범위 확대는 포함하지 않는다.

운영기간은 기존 선수 감시 설정을 사용한다: 2026-11-01~2027-10-31 KST, 2027-06-01 검토기한부터 일시정지. 이는 공식 경기 종료일이 아니다. 현재 공식 시즌 맥락이 바뀌면 기간이 남아 있어도 확인을 중단한다.

`GITHUB_RUN_ID`가 같은 재시도는 추가 0행, 새로 시작한 수동 실행은 별도 관측 한 행이다. 불확실한 쓰기 응답은 재조회하여 확인하며 자동으로 다시 쓰지 않는다. 쓰기 이후 동시 편집이나 결과 검증 실패는 성공으로 표시하지 않는다.

## 5. 회귀 검증과 미완료 범위

로컬 회귀 결과:

| 검사 | 결과 |
|---|---|
| `python -B -m unittest discover -s tests -p 'test_kvl_player*.py'` | 186개 통과. 신규 현재값 core 30·source 12·CLI 23·workflow 9개(합계74개) 포함 |
| 기존 공식 공시 검사 | 15개 통과 |
| 기존 roster 출처 계약 검사 | 7개 통과 |
| 기존 V-리그 운영 검사 | 36개 통과 |
| 기존 `tests/vleague-rosters.test.cjs` | jsdom 26.1.0으로 통과 |
| 실제 기존 사건 파일럿 preflight | `BLOCKED / pilot_disabled`, 인증·외부 요청·쓰기 없음 |
| 변경 공개 JSON 두 파일 | 승인 출처·정확한 SHA-256·공개 정보 검사 통과 |
| 독립 코드 검토 | 재시도 시각 혼합·private 계획 지문을 수정한 뒤 CLI23개 및 핵심3개 재실행 통과 |

Python 합계는 **244개**다. GitHub PR 실행 결과는 실제 commit의 checks에서 별도로 확인한다. 신규 검사는 현재값 일치·기존 ID·날짜 표기·공식 출처 버전·시간대·미래/오래된 조회·수식/보호/링크·중복·응답 유실·동시 편집·비공개 자료 비노출·수동 모드 격리·설정과 기간 변화·artifact 실패를 포함한다.

기존 `pilot.json`은 `enabled=false`, `event_scope=null`, `BLOCKED_EFFECTIVE_DATE`이며 승인 사건과 매핑 목록은 계속 비어 있다. 기존 공시·기사 수집과 경기 자동화의 일정도 유지한다. 실제 선수값 수정, 등록·이적·해지, 여자부, 다른 선수, 과거 대회 명단, 홈페이지 표시 확대는 이번 완료 범위가 아니다.

## 6. 검토 후 다음 단계와 복구

운영 코드 병합은 저장소 `AGENTS.md` 규칙 7의 별도 운영 반영 승인 대상이다. 이 PR을 검토·승인한 뒤 병합하면 기존 Actions 화면의 `Run workflow`에서 **`player_current_value_check`만 true**로 선택해 실행한다. 이 도구 환경에는 해당 새 입력으로 workflow를 시작하는 기능이 없어, 실제 수동 실행은 사용자가 수행해야 한다. 기존 실행을 재시도하여 새 입력 실행처럼 표시하지 않는다.

그 실행에서 기존 서비스계정의 실제 선수 행 읽기·확인 이력 저장·재조회 및 동일 run 재시도 0행을 검증한 뒤 GitHub runtime 상태를 갱신한다. native 기록의 성공을 먼저 GitHub 쓰기 성공으로 바꾸지 않는다.

중단하려면 새 current-value 설정의 `enabled`를 false로 변경하고 검토 후 반영한다. schedule은 새 기록 경로를 실행하지 않는다. PR을 되돌려도 이미 남긴 native 확인 기록은 감사 이력으로 보존한다. 잘못된 기록이 발견되면 원문과 실행 ID를 검토한 뒤 별도 정정 기록을 설계하며 이력 삭제·효력일 보정·선수 셀 롤백을 자동으로 수행하지 않는다.
