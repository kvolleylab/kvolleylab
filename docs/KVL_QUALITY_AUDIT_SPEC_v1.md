# KVL Quality Audit v1 운영 명세

작성: 2026-10-30 KST. 상태: **운영 적용 승인 / main 설치 완료 / 자동 일정·알림 활성화 검증 중**. 후속 실행 증거는 [운영 전환 기록](quality-audit/ACTIVATION_v1.md)에 기록한다.

이 프로그램은 GitHub Actions의 Python·Node.js·Chromium으로 실행한다. ChatGPT Pro, Plus, Work, OpenAI API 키·결제·세션을 사용하지 않는다. 구독 변경이나 해지는 이미 GitHub에 설치된 프로그램의 실행 조건이 아니다. AI 분석은 오류 보고서를 사람이 검토한 뒤 요청하는 선택 절차다.

## 1. 범위와 보호 대상

- 첫 대상: 2026 KOVO컵 남녀, 2026-27 V-리그 남녀의 Competition Engine V2 데이터.
- 독립 경로: `scripts/quality_audit/`, `tests/test_quality_audit.py`, 신규 workflow, 이 명세와 검수 보고서.
- 경기 MASTER, 서비스 JSON/HTML/CSS, Player ID, 공시 수집 결과, 완료된 AVC Production은 읽기만 한다.
- 기존 테스트 중 검수 JSON을 쓰는 테스트는 임시 복사본에서 실행한다. 감사 출력은 저장소 밖의 지정 디렉터리에만 쓴다.
- 기존 workflow의 스케줄·권한·명령은 변경하지 않는다. 감사 코드·감사 테스트·감사 workflow가 main에 반영될 때 읽기 전용 운영 검증을 실행한다. PR/수동 실행도 유지한다.
- 사용자는 2026-10-30 main 병합, 운영 검증, 매일 09:00 KST 점검 및 Issue 알림을 승인했다. Drive 공유·자격 증명 추가, 기존 운영 데이터 자동 수정은 이 승인에 포함하지 않는다.

기준 main은 작업 시작과 제출 직전에 재조회한다. 보고서에는 실제 검사한 commit을 기록하며 과거 작업의 SHA를 현재 상태로 간주하지 않는다.

## 2. 근거와 우선순위

읽은 운영 근거는 `KVL_운영원칙_MASTER_v16`, `KVL_데이터_공개등급_운영원칙_v1`, 컵/리그 경기 MASTER, 남녀 시즌 선수 MASTER의 검수현황, Drive 국제대회 공통 템플릿, 저장소의 AGENTS/PROJECT_RULES/DESIGN_SYSTEM/개발 workflow/결정 로그/V2 템플릿/국내 템플릿/공시 수집기 문서다.

최근의 명시적 사용자 승인 → 적용 범위가 일치하는 날짜별 결정 → 범위별 운영 문서 → 구현 순서로 판단한다. PRIVATE 문서 원문과 Drive 파일 ID를 공개 저장소에 복제하지 않는다. Drive에서 독립된 최신 STATUS 파일과 국내대회 템플릿 원본을 찾지 못한 사실은 **자료 미접근(NOT VERIFIED)** 으로 기록한다. 파일 부재를 확정하지 않는다. 확인한 검수현황 탭과 GitHub 결정 로그는 대체 근거이며 동일한 문서로 취급하지 않는다.

문서 충돌과 적용 판단은 [기존 자동화·중복 분석](quality-audit/EXISTING_AUTOMATION_v1.md)에 기록한다. 오래된 1120/1400px 규칙, 이름·생년월일 기반 ID 발급 규칙, 남녀 공통 차콜 문구를 일괄 적용하지 않는다. 현재 대상은 1180/390/360px, 기존 영구 Player ID, 남자 차콜·여자 로즈 기준이다.

## 3. 데이터 흐름

1. 공식 원본/수집 결과: 사실 근거. 공시 후보와 불완전한 rolling feed는 MASTER가 아니다.
2. 검수본: 신원·시즌·효력일·공개등급 확인 전에는 배포 대상이 아니다.
3. Drive MASTER: 승인된 관리 기준. 검수중 선수 MASTER를 실시간 공식 등록명단으로 간주하지 않는다.
4. GitHub 서비스 Snapshot: 대회 당시 참가명단과 공개 검수 데이터를 보존한다. 현재 소속으로 과거 참가명단을 덮어쓰지 않는다.
5. 운영 홈페이지: 공개 JSON의 구조를 검사 commit과 비교한다. HTTP 수정 시각을 실제 배포 시각으로 단정하지 않는다.

동기화 프로그램은 위 단계의 차이를 **보고만** 한다. 자동 수집기가 만든 공시 검수 큐를 재사용하고 신규 공시 수집기를 만들지 않는다. 후속 검수 기록으로 이미 반영된 공시는 신규 오류에서 제외한다.

## 4. 검사 규칙과 한계

| 영역 | v1에서 실행하는 검사 | 전수 확인으로 표현하지 않는 부분 |
|---|---|---|
| A 경기 | ID·대회·시즌·남녀부·참가팀·홈/원정·일시·조 연결, 중복 대진, KST 오프셋, 세트 점수/합계/승수, 순위 승패·승점, 컵 결승 진출·우승 연결 | 공식 전체 시즌 일정/세트별 점수 확보, 모든 동률 순위 규정 |
| A 공식 비교 | 기존 `kovo_match_schedule_bridge.py`의 공개 읽기·정규화 재사용. 관측 경기의 상태·최종 세트승·팀·날짜·라운드 비교 | rolling API 밖의 경기. 미관측을 누락이나 종료로 추정하지 않음 |
| B 선수·팀 | 실제 공개 catalog loader의 1,842 ID 계약, 원장별 중복/누락 ID, 명단의 ID 존재·생년월일 충돌·팀 연결·동일 대회 중복, 출처 없는 연결, 기존 프로필/신원 테스트 | Drive 선수 MASTER 전수, 동명이인의 신규 신원 확정, 모든 학교 소속 이력 |
| B 공시 | 기존 검수 큐와 후속 명시적 공시 검수 근거 비교 | 등록·방출·임대 자동 확정 및 MASTER 자동 반영 |
| C UI | 기존 24개 핵심 JS 테스트 묶음(PR #199의 드래프트 6개 포함), Chromium 4대회×6화면×3폭. 렌더·넘침·국내 로고·점수 중앙·팀명 잘림·메뉴·남녀 테마·팀 클릭 명단 | 외부 이미지 가용성, 모든 학교/국제·드래프트 페이지 육안 검사, 인쇄/PDF, 운영 관리자 저장 |
| D 동기화 | 경기 MASTER와 서비스의 MatchID 기반 비교, 운영 JSON 구조 비교, Engine v2 schema 계약 | 인증 없는 Actions의 Drive 읽기, 선수 MASTER 전체, 배포 manifest 기반 갱신 시각 |
| E 반복 작업 | 기존 workflow/수집기/검수 경로 및 대상 기록 수 분석 | 사람이 실제 수행한 입력 횟수·시간은 로그 없이 추정하지 않음 |
| F 안전 | 전체 data JSON 파싱·명시적 비공개/검수전 레코드/인증정보 키, 필수 HTML 경로, 기존 회귀, workflow YAML·권한 검토 | 무표식 레거시 공개등급, 모든 JS의 의미적 보안 분석, branch protection 설정·실배포 차단 적용 |

현재 표의 “실행하는 검사”는 기능 설명이다. 특정 실행의 PASS/FAIL/NOT VERIFIED/NOT RUN은 JSON 보고서의 해당 행으로 판단한다. 외부 출처 실패, 브라우저 미설치, Git 과거 commit 미접근은 데이터 결함으로 바꾸지 않는다.

브라우저는 HTTPS 운영 origin의 요청을 검사 checkout의 바이트로 응답한다. 실제 사이트에 쓰거나 production 검증을 완화하지 않는다. 이는 HTTP localhost에서 HTTPS canonical 계약이 실패하는 오탐을 방지한다. 외부 글꼴/국기는 차단된 조건이며 국내 로고와 기하 검사는 이 통제된 범위에 한정한다. 현재 승인된 pro 국내 presentation의 `--dv2-accent`(남자 #292d33 / 여자 #9b4c70)를 검사하며 오래된 base theme 변수로 덮어 판단하지 않는다.

### 경기 정규화 주의

- Engine v2 기존 계약은 score가 있으면 종료, 없으면 예정으로 표시한다. 이 계약을 유지한다. 시간이 지났다는 이유로 종료로 바꾸지 않는다.
- 명시적 연기·취소가 관측되면 공식 상태를 기대값으로 보고한다. 임의 점수와 추정 결과는 만들지 않는다.
- V-리그 공식 경기번호는 남녀 통합 순번이고 서비스 ID는 남녀별 순번이다. 숫자 치환을 하지 않는다. 검수된 provider map 또는 시즌·남녀부·날짜·양 팀·라운드가 모두 일치하는 유일 후보만 비교한다. 애매하면 NOT VERIFIED.
- 종료 API의 `startTime`은 실제 첫 서브 시각이다. 예정 시각과 직접 비교하지 않는다. 향후 공식 예정 시각 필드가 확인될 때만 별도 확장한다.
- 완전한 MASTER 범위와 부분 공식 feed를 구분한다. 부분 feed에서 안 보이는 경기를 누락으로 신고하지 않는다. MASTER의 알려진 19열 순서가 바뀌면 NOT VERIFIED로 중단하며, 잘못 읽은 열로 경기 불일치를 확정하지 않는다.
- 컵 결선은 현재 main과 MASTER에 반영되어 있다. 오래된 미병합 수정 PR을 신규 결선 누락의 근거로 쓰지 않는다.

## 5. 오류 모델과 재검증

오류 ID는 `KVL-QA-` + SHA-256(`규칙`, `검사 범위`, `안정적 대상 키`) 앞 16자리다. 값·심각도·commit·발견 날짜가 달라져도 같은 오류 ID다. 다른 규칙은 별도 오류다. 행 번호는 식별키 자체가 누락된 경우에만 임시 위치로 사용한다.

각 finding에 오류 ID, 최초/최종 확인일(KST), 경로, 관련 식별키, 기존값/기대값, 공식 URL·확인 시각, 검사 commit, 심각도·검증 상태, 제안·영향 범위, 담당 작업·처리 상태, 관측 횟수와 실행 ID를 기록한다. 로컬 구문 오류처럼 공식 출처가 적용되지 않는 항목은 URL을 null로 둔다. 실사용 담당자 자동 배정은 하지 않는다.

| 심각도 | 의미 |
|---|---|
| P0 | 비공개 데이터·인증정보 노출 등 긴급 보안 문제 |
| P1 | 공식 결과·상태 불일치, 선수 ID 연결 등 중요 데이터 오류 |
| P2 | 부분 UI·구문·회귀 실패 또는 점검 실행 장애 |
| P3 | 추가 검토가 필요한 권한·자동화 개선 후보 |

| 검증 상태 | 처리 |
|---|---|
| CONFIRMED | 기계적 계약 또는 객관적 근거로 확인 |
| SUSPECTED | 후보만 확인. 공개 Issue 신규 게시하지 않음 |
| NOT VERIFIED | 자료/환경/계약 검증 실패. 데이터 오류로 확정하지 않음 |
| RESOLVED | 같은 대상·같은 검사 범위가 실제 재검증에 성공한 경우만 변경 |

검사 결과는 별도로 PASS / FAIL / NOT VERIFIED / NOT RUN을 사용한다. NOT VERIFIED/NOT RUN 또는 일부 관측만으로 기존 오류를 해결 처리하지 않는다. 사람이 Issue를 닫았다는 사실만으로 데이터가 고쳐졌다고 보지 않는다.

## 6. 이력·알림

공개 가능한 CONFIRMED 오류만 GitHub Issue를 만든다. 안정적 오류 ID와 HTML 주석의 JSON ledger를 사용하며 열린/닫힌 Issue를 모두 페이지 단위로 읽는다. 중복 ID가 이미 있거나 목록 페이지를 완전히 읽지 못하면 쓰기를 중단한다.

- 신규 CONFIRMED: Issue 1개 생성.
- 같은 오류 반복: 첫 발견일 보존, 마지막 확인·값 갱신. 반복 댓글 없음.
- 심각도 상승: 기존 Issue 갱신, 같은 전환에 댓글 1회. 댓글 생성 직후 중단되어도 재시도 중복을 방지한다.
- RESOLVED 오류 재발: 기존 Issue 재개방.
- 확인된 해결: 기존 Issue를 해결로 닫음. 매일 정상 보고 Issue를 만들지 않음.
- source 접근 실패: 서로 다른 실행 ID로 3회 연속 실패할 때 별도 OP_ACCESS 운영 경고. 같은 실행 재시도는 횟수를 늘리지 않음. 성공 시 복구.
- workflow 실행/의존성/아티팩트 실패: OP_EXECUTION 운영 경고. 데이터 결함과 다른 ID로 관리. 알림 job 자체가 실패하면 GitHub Actions 실패 알림이 마지막 경로다.

Issues가 결함 이력의 기준이다. 최초 승인된 main 실행은 정제된 시범 state로 최초 발견일을 보존하고 실제 Issue 이력으로 갱신한다. Actions cache는 연속 접근 실패 횟수를 보조한다. cache가 삭제되면 미확정 접근 실패의 3회 카운터는 다시 시작할 수 있다. 이미 생성된 Issue 이력은 재조회로 보존한다. 동시에 같은 브랜치의 알림이 실행되지 않도록 workflow concurrency를 둔다.

PRIVATE finding은 공개 출력 전에 값·경로·식별키·출처를 삭제하고 불투명 ID만 남긴다. PRIVATE finding은 공개 Issue에 게시하지 않는다. CONFIRMED P0/P1은 Actions gate를 실패시켜 Actions 실패 알림으로 검수를 요청한다. 이를 수집기 실행 장애로 잘못 게시하지 않는다. 원문은 해당 비공개 자료의 권한 있는 환경에서 사람이 검토한다. 공개 로그·artifact·Issue에 MASTER 원문, 회원 메모, 토큰 또는 예외 메시지를 출력하지 않는다.

### 사용자가 실제 알림을 받는 설정

승인 후 저장소 GitHub 화면에서 **Watch → Custom → Issues**를 켜고 GitHub **Settings → Notifications**에서 이메일 또는 GitHub Mobile 전달을 설정한다. Watch All은 기존 workflow 등의 알림도 늘릴 수 있다. Actions 실패 알림 설정도 별도로 확인한다. 정상 완료 메일이 불필요하면 실패만 수신하도록 설정한다. 테스트용 Issue를 한 번 게시하고 실제 수신 여부를 사용자가 확인해야 전달 검증이 완료된다. 이번 시범에서는 계정 알림 설정 변경·테스트 Issue 게시·실수신 확인을 하지 않았다.

## 7. 권한과 배포 경계

신규 workflow 기본 권한은 `contents: read`. audit job은 이력 복원용 `issues: read`만 추가한다. `issues: write`는 별도 notify job에 한정하며 아래 조건을 모두 만족할 때만 실행한다.

1. 2026-10-30 사용자 승인과 활성화 commit의 기본 활성 설정. 선택적 저장소 변수 `KVL_QUALITY_AUDIT_APPROVED`가 없거나 `true`이면 활성, `false` 또는 다른 비어 있지 않은 값이면 자동 실행·알림을 중지한다. 변수 삭제는 승인된 기본 활성 상태로 복귀하므로 중지하려면 명시적으로 `false`를 사용한다.
2. `refs/heads/main`.
3. 매일 09:00 KST schedule, 감사 전용 파일의 main 반영, 또는 수동 실행의 `notify=true`.

승인 기본값 변경은 공개 코드 검토와 PR 이력에 남긴다. 별도 브라우저 인증·PAT·OpenAI 키가 필요하지 않다. 런타임의 Issue 프로그램은 여전히 명시적 `KVL_AUDIT_APPROVED=true`와 main·허용 이벤트를 모두 확인한다. PR은 읽기·시험·안전한 report만 수행한다. `pull_request_target`은 쓰지 않는다. checkout은 `persist-credentials: false`다. 원본 수집기처럼 contents 쓰기나 git push를 하지 않는다. 14일 보관 artifact는 report.json/report.md/정제된 state.json 세 파일뿐이다.

`export_gate.py`는 PR에서 새로 추가/변경한 `data/**/*.json`, `players.json`에 파일 해시가 일치하는 PUBLIC+VERIFIED 검수 manifest를 요구한다. 누락/다른 해시/내부 PRIVATE·DRAFT 레코드는 실패한다. 파일 단위 승인이 중첩된 비공개 표시를 덮어쓸 수 없다. manifest의 `source_ids`, `verified_at`은 실제 검수 증거여야 하며 임의로 채워 통과시키지 않는다.

기존 파일 전체를 VERIFIED로 소급 선언하지 않도록 manifest는 빈 상태다. required status check와 main 직접 push 보호를 설정하기 전에는 이 gate만으로 배포를 강제 차단한다고 주장하지 않는다. 기존 자동 수집기의 main 직접 push는 이 PR gate를 통과하지 않으므로 승인된 후속 작업에서 배포 파이프라인과 연결해야 한다. 이번에는 기존 수집기를 바꾸지 않는다. JS에 포함된 임의 데이터와 무표식 레거시는 추가 검수 대상이다.

## 8. Drive 접근

로컬 시범은 권한 있는 연결로 읽은 경기일정_MASTER만 임시 파일로 전달한다. 파일 원문은 commit/artifact에 포함하지 않는다. 인증이 없는 Actions에서는 Drive 검사가 NOT VERIFIED가 된다. 파일을 공개하거나 공개 CSV로 바꾸지 않는다.

승인 후 선택할 구성:

- Google Cloud 전용 service account를 대상 경기 MASTER 두 파일에 Viewer로만 공유하거나 WIF 기반 읽기 전용 인증을 구성한다. 전체 Drive 폴더 접근이 필수는 아니다.
- API scope: `https://www.googleapis.com/auth/spreadsheets.readonly`.
- private mapping `KVL_AUDIT_DRIVE_MAP`은 GitHub Secret으로 저장한다. `cup`/`league`의 file ID만 포함한다. 프로그램의 range는 `'경기일정_MASTER'!A1:S600`으로 고정하며 private 메모 탭을 선택하지 못한다.
- ADC용 `GOOGLE_APPLICATION_CREDENTIALS`를 일시 경로에 두고 `google-auth`/`requests`를 검수한 버전으로 설치한다. 현재 기본 workflow에는 이 자격 증명 전달 단계를 넣지 않았다. WIF에는 추가 `id-token: write`가 필요하므로 별도 승인 PR에서만 추가한다.
- Secret은 승인된 main 전용 job에만 전달한다. PR에 전달하지 않는다. 광범위한 실행 코드가 토큰을 읽지 않도록 향후 Drive 읽기 단계와 회귀 테스트 단계를 분리한다.

현재 adapter의 합성 인증 실패/응답 계약 검사는 통과했다. GitHub Actions→실제 Google Sheets 인증의 종단간 검증은 **NOT VERIFIED**다. 선수 MASTER 전체 비교 adapter는 후속 범위다.

## 9. 실행과 재현

저장소 root에서 Python 3.12, Node 24, Git 전체 이력을 사용한다. shell에서 `TMPDIR` 등 시스템 변수를 바꾸지 말고 독립 경로를 지정한다.

```bash
python -m pip install -r scripts/quality_audit/requirements.txt
npm install --prefix /tmp/kvl-audit-deps --no-audit --no-fund jsdom@26.1.0 playwright@1.56.1
node /tmp/kvl-audit-deps/node_modules/playwright/cli.js install --with-deps chromium
python -B -m unittest discover -s tests -p test_quality_audit.py -v
KVL_JSDOM_PATH=/tmp/kvl-audit-deps/node_modules/jsdom \
KVL_PLAYWRIGHT_PATH=/tmp/kvl-audit-deps/node_modules/playwright \
python -B -m scripts.quality_audit.runner --root . --output /tmp/kvl-audit-output \
  --core-tests --ui --live --run-id manual-1
```

재실행은 `--state /tmp/kvl-audit-output/state.json --run-id manual-2`를 추가한다. 같은 실행 재시도는 동일 run-id를 사용한다. `--master-input /보안/임시경로`는 cup-master.json/league-master.json의 Google Sheets values 응답을 읽는다. 출력 폴더와 입력 폴더를 저장소 안에 두지 않는다.

기본 종료 코드는 실행 완료 0, 실행 장애 2다. 시범 workflow는 확인된 기존 데이터 오류도 report에 남기며 실행 성공과 데이터 PASS를 구분한다. workflow에 지정한 `--gate`는 CONFIRMED P0/P1이 있으면 1을 반환한다. 신규 합성 테스트와 PR 공개 export gate의 실패도 Actions job을 실패시킨다. 기존 P2 회귀 실패는 report에서 FAIL로 유지한다.

신규 workflow가 default branch에 없을 때 GitHub UI의 수동 실행 항목이 아직 나타나지 않을 수 있다. Draft PR에서는 pull_request 검증으로 실행 근거를 확보한다. main 등록 이후 `Actions → KVL Quality Audit v1 → Run workflow`가 수동 운영 경로다.

## 10. 승인 후 활성화 순서와 복구

1. Draft PR의 코드·시범 보고·기존 오류 및 미검증 범위를 검토한다.
2. 사용자 승인 후 main 병합. PR #200을 `dd49cabf9af4e96b0d7e1a38862ec0213e40455b`로 병합 완료했다.
3. main에서 먼저 알림 없는 운영 점검. 브라우저 로그인 의존성을 없애기 위해 감사 코드의 main 반영 시 같은 검사를 실행하며 수동 경로도 유지한다. 새 source 상태·브라우저 결과 확인.
4. 필요하면 별도 승인된 read-only Drive 인증을 구성하고 실패를 데이터 누락과 구분하는지 재검증.
5. 승인 기록을 workflow에 포함해 추가 브라우저 로그인·자격 증명 없이 활성화한다. main 감사 코드 반영 실행에서 Issue 게시와 이력 재실행을 확인한다. 계정별 이메일/모바일 실수신은 별도 확인한다.
6. 승인된 후속 workflow 변경에서 `schedule: [{cron: '0 0 * * *'}]` 추가. UTC 00:00 = KST 09:00. GitHub 스케줄은 지연/누락될 수 있어 정시 SLA가 아니다. 공개 저장소는 장기 비활동 시 예약 실행이 중단될 수 있다.
7. required check/배포 gate 연결은 기존 writer와 함께 검토하고 별도 승인. PRIVATE export 방지의 실제 배포 검증을 완료한다.

중지: 저장소 변수 `KVL_QUALITY_AUDIT_APPROVED=false` 또는 감사 workflow 비활성화. schedule만 제거하면 감사 코드 변경 시 실행·알림은 남으므로 전체 중지와 구분한다. 변수 삭제는 기본 활성 상태로 되돌린다. 기존 수집기·사이트·MASTER는 감사 프로그램을 중지해도 그대로 유지된다. 새 프로그램 제거는 감사 파일을 되돌리는 PR로 처리한다. 데이터 복구는 필요하지 않다.

## 11. 예상 비용과 의존성

현재 저장소가 공개이고 표준 GitHub-hosted Linux runner를 사용하는 한 Actions 실행은 무료 범주다. 첫 설치 포함 5~15분/회로 예산을 잡으면 일 1회 약 150~450 runner분/월이며 실제 실행 시간으로 조정한다. 이는 실측 확정 비용이 아닌 상한 계획치다. PR 검사 횟수는 추가된다. report 세 파일의 14일 보관만 사용하며, 대형 screenshot·원본 문서는 저장하지 않는다. GitHub 정책·runner 종류·private 전환·저장 용량에 따라 비용이 달라질 수 있다.

최종 시범 Actions 실측은 154초/회, 정제 artifact ZIP 15,173바이트였다. 같은 조건에서 하루 1회·30일이면 약 77분/월이지만 source 상태와 runner 부하에 따라 달라지므로 위 예산에 여유를 둔다.

ChatGPT/OpenAI 사용료는 자동 점검 기준 **0**이다. Python 표준 라이브러리, PyYAML, Node.js, jsdom, Playwright를 사용한다. Google 인증을 선택할 경우 Google Cloud/Sheets의 해당 계정 정책·quota를 별도 확인한다. 유료 AI 분석을 추가하더라도 기본 감사 workflow의 필수 의존성으로 만들지 않는다.

공식 운영 참고:

- https://docs.github.com/en/billing/concepts/product-billing/github-actions
- https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule
- https://docs.github.com/en/subscriptions-and-notifications/get-started/configuring-notifications
- https://docs.github.com/en/actions/concepts/workflows-and-actions/notifications-for-workflow-runs

실제 최초 결과와 한계: [PILOT_v1.md](quality-audit/PILOT_v1.md).
