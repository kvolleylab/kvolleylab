# V-리그 자동 업데이트 v1

작성일: 2026-10-31. 2026-11-01 사용자 운영 승인. 상태: **기존 v1 운영 연결·최초 수동 MASTER 반영·공개 게시 검증 완료**. 설치: [PR #213](https://github.com/kvolleylab/kvolleylab/pull/213), 후속 수정: [PR #215](https://github.com/kvolleylab/kvolleylab/pull/215). 최초 실제 성공: [Actions #7](https://github.com/kvolleylab/kvolleylab/actions/runs/41305975071). 예약 실행의 첫 후속 성공은 이 수동 실행의 성공과 별도로 확인한다. [운영 전환 기록](validation/vleague-activation_v1.md).

2026-11-02 사용자가 PR #227 병합과 챔피언결정전까지의 자동화 확장을 승인했다. 공식 일정·규정·지원 범위와 실제 병합/실행 증거는 [포스트시즌 보완 기록](validation/vleague-postseason-automation-20261102.md)을 따른다. 운영 전 준비 중이던 이전 문서 상태는 최초 성공 기록으로 대체한다.

## 목적과 실행 위치

GitHub Actions가 KOVO 공식 경기 자료를 주기적으로 수집하고, 검증한 결과를 기존 Google Sheets MASTER와 남녀 V-리그 데이터에 반영한다. ChatGPT 세션, OpenAI API 키, 개인 PC의 상시 실행은 필요하지 않다. 원본 MASTER를 유지하므로 최초 Google 실행 권한 연결은 별도로 필요하다.

실행 파일은 `.github/workflows/vleague-auto-update-v1.yml`이다. PR에서는 읽기 전용 검사만 실행한다. 운영 게시와 실패 Issue는 저장소 변수 `KVL_VLEAGUE_UPDATE_APPROVED`가 정확히 `true`인 main의 예약 실행 또는 `publish=true` 수동 실행에만 허용된다. 변수 미설정은 비활성 상태다.

## 반영 범위

- 2026-27 남녀 정규리그 각 126경기: 날짜·시각·경기장·진행 상태·종료 스코어·세트별 점수.
- 남녀 조건부 준플레이오프·플레이오프·챔피언결정전의 공식 확정 대진과 결과. 최대 18경기이며 준PO 미개최와 시리즈 조기 종료를 구분한다.
- 종료 경기로 계산한 승점·승패·세트/점수 합계와 KOVO 공식 순위의 대조.
- 기존 대회 화면의 순위표, 최근 결과, 다음 경기에서 사용하는 데이터.
- 기존 `MatchID`와 공식 경기 식별자의 영구 연결 이력.

선수 등록·이적·명단, 선수 ID와 타 대회는 이 경기 수집기의 수정 대상이 아니다. 공시·기사 수집기와 Quality Audit 일정은 독립적으로 유지한다. 연기·취소 전용 공식 플래그는 아직 검증되지 않았으므로 지원했다고 표시하지 않는다. 확인된 일정 변경과 예정/진행/종료, 규정과 확정 결과로 입증된 포스트시즌 미실시를 처리한다.

## 공식 자료와 검증 순서

현재 KOVO 공개 웹 앱이 사용하는 `user-api.kovo.co.kr`의 다음 공개 GET 응답을 사용한다. 인증·로그인·회피 수단을 사용하지 않는다. 제공자 응답 구조가 바뀌면 자동 적용을 중단한다.

| 자료 | 요청 경로와 고정 매개변수 |
|---|---|
| 전체 정규리그 일정·결과 | `/stat/game-schedule?gcode=001&seasonCode=023&leagueCode=201&gender=1&page=0&size=200` |
| 공식 순위 | `/stat/league/team-rank?seasonCode=023&leagueCode=201&gender=1&round=0&page=0&size=30` |
| 준플레이오프 / 플레이오프 / 챔피언결정전 | 같은 경기일정 경로의 `leagueCode=204 / 202 / 203` |

여자부는 `gender=2`를 사용한다. 한 번의 수집은 기본 10개 요청(정규 일정·순위 4개 + 포스트시즌 6개)이다. 검증 job과 게시 job은 각각 새 자료를 조회한다. 정상 빈 포스트시즌 응답은 편성 대기이며 오류나 시즌 종료가 아니다. 팀·시각·경기장이 미정인 행은 보류하고 확정 경기로 만들지 않는다.

1. 남녀 각각 126경기, 7개 팀, 라운드별 21경기와 팀별 36경기, 중복·누락을 확인한다.
2. 최초 연결은 성별·라운드·홈팀·원정팀의 정확한 일치로 결정한다. 공식 경기번호는 남녀 통합 번호이므로 KVL ID의 숫자 부분과 동일시하지 않는다. 다음 실행부터 저장된 연결도 대조한다. 날짜 변경은 기존 ID를 유지한다.
3. 종료 경기의 3승, 세트 수, 25점/5세트 15점과 듀스 조건을 검사한다. 진행 중 점수는 종료 결과로 공개하지 않는다.
4. 계산한 승패·승점·세트·득실점 합계를 공식 순위와 대조한다. 공식 팀 ID와 이름도 확인한다. 경기한 팀이 빠지거나 수치가 충돌하면 전체 반영을 중단한다. 미경기 팀의 순위는 임의로 만들지 않는다.
5. 기존 Quality Audit의 경기·순위 검사 4개와 공개 export 검사를 후보 데이터에 적용한다. 실제 직렬화 바이트의 SHA-256·공식 출처·검증 시각을 남기며, 비공개·검토 전·인증정보 필드가 있으면 차단한다. 검증 기록은 자동 공식 자료 대조임을 명시하며 사람의 검수로 표시하지 않는다.
6. MASTER를 읽고 필요한 셀만 계획한다. 쓰기 직전 원본을 다시 확인하고 반영 후 재조회한다.
7. MASTER 대조가 끝난 뒤 허용된 JSON 3개만 작성·커밋한다. 검증한 이벤트 커밋과 최신 main이 다르면 중단한다.
8. Pages 빌드를 명시적으로 요청하고, 배포 SHA 및 공개 남녀 JSON 전체가 예상 내용과 일치하는지 확인한다.

포스트시즌 차전은 원문 `roundName`의 `N차전`에서 읽는다. 원문 `round=1`을 차전으로
오인하지 않는다. 기존 정규 MatchID를 유지하고 새 확정 경기에는
`VL2627-M-PO-001` 등 단계별 영속 ID를 부여한다. 공식 순위와 대조한 정규리그 완료는
`regularSeasonComplete`로 분리하고, 준PO 조건·PO 2승·CH 3승 및 진출 경로가 모두 맞아야
전체 시즌을 완료로 판정한다. 포스트시즌 결과는 정규 순위 합계에 포함하지 않는다.

현재 시즌의 세부 동률 규칙을 추정해 순위를 만들지 않는다. 공식 순위와 모든 합계를 대조하는 경로만 운영 게시에서 사용한다.

## MASTER와 공개 파일

대상: `2026-27_V리그_경기일정_MASTER`의 `경기일정_MASTER` 탭. 문서 ID와 필수 헤더는 `scripts/kovo_vleague_master.py`에 고정되어 있다. 다른 문서를 자동 탐색하거나 생성하지 않는다.

쓰기 허용 열은 F:H(날짜·요일·시간), K(경기장), M:R(상태·결과·공식 출처·검증 상태)이다. MatchID·SeasonID·팀·라운드·도시·비고·셀 서식은 보존한다. 수식과 수동 잠금, 이미 입력된 종료 결과의 변경은 중지 대상으로 다룬다. `[LOCK]`, `[MANUAL]`, `[수동]`, `[잠금]`, `수동 확정`, `자동갱신 금지`는 잠금 표식이다.

R열의 검증 상태는 실제 MASTER의 strict dropdown에 있는 `공식확정`을 사용한다. `공식검증`이라는 별도 상태를 추가하지 않고 R열의 검증 규칙을 유지한다.

신규 포스트시즌 경기만 예외적으로 기존 빈 행 254:271의 정해진 슬롯(성별당 준PO1·PO3·CH5)에
신원 A:E·I:J를 최초 한 번 입력한다. 빈 행 전체를 쓰기 전 다시 확인하고 기존 값·수식·비고가
있으면 중단한다. 시트 행 삽입이나 다른 문서 생성은 하지 않는다. 최초 입력 후 신원은 다시 보호한다.
M254:M271의 검증 선택지에만 `미실시`를 추가했다. 규정상 미개최/클린치로 불필요해진
기존 경기만 미실시로 표시하며 공식 취소와 구분한다. 원래 없던 잔여 경기 행을 새로 만들지 않는다.

공개 작성 경로는 다음 세 개뿐이다.

```text
data/competitions/v-league-men-2026-27/data.json
data/competitions/v-league-women-2026-27/data.json
data/kovo/vleague/2026-27/state_v1.json
```

상태 파일에는 공개 경기 ID 연결만 보관한다. MASTER 스냅샷·비고·인증값·비공개 쓰기 계획은 저장소와 Actions artifact에 올리지 않는다. 같은 자료를 다시 확인하면 경기 수정 시각·파일·커밋을 새로 만들지 않는다. 게시 실행은 3개 후보의 해시가 포함된 `PUBLIC`/`VERIFIED` 검증 영수증을 보고서에 남긴다. 기존 수동 PR용 `public-review-manifest.json`은 수정하지 않으며 다른 공개 export의 검토를 대체하지 않는다.

## 실행과 최초 설정

### 1. 읽기 전용 검토

기본 실행은 운영 파일과 MASTER를 쓰지 않는다.

```bash
python -B scripts/kovo_vleague_update.py --root . --output /tmp/vleague-preview
```

출력에는 공개 후보 JSON과 정제한 보고서가 포함된다. Google 권한 없이 실행한 결과는 `SOURCE_AND_SITE_VERIFIED_MASTER_NOT_CHECKED`로 표시한다. 이미 연결한 단기 토큰이 있는 환경에서 `--check-master`를 추가하면 MASTER도 읽어서 대조하며 쓰지는 않는다. `--source-file`과 `--master-snapshot`은 로컬 재현 전용이고 `--publish`와 함께 사용할 수 없다.

PR의 `check` job은 단위·통합 검사, 실제 공식 자료 조회, 후보 DOM 검사, 현재 Pages 설정의 읽기 전용 검사를 수행한다. Google 인증과 게시 권한을 받지 않는다.

### 2. GitHub에서 MASTER를 사용할 실행 권한 연결

ChatGPT에 연결된 Google Drive 계정은 GitHub Actions에 자동으로 전달되지 않는다. 최초 운영 전 다음 연결을 구성한다.

1. 운영자가 관리하는 Google Cloud 프로젝트에서 Sheets API와 Workload Identity Federation에 필요한 IAM/STS API를 준비한다.
2. V-리그 전용 서비스 계정을 만들고 **해당 MASTER 한 문서**에만 편집 권한을 준다. 광범위한 Drive 공유나 도메인 전체 위임은 필요하지 않다.
3. GitHub OIDC 발급자 `https://token.actions.githubusercontent.com`에 대한 Workload Identity Pool/Provider를 설정한다. 신뢰 조건은 `kvolleylab/kvolleylab`, `refs/heads/main`, 이 workflow 경로, 허용 이벤트로 제한한다. 가능하면 저장소/소유자의 숫자 ID도 제한에 사용한다.
4. 해당 외부 주체가 전용 서비스 계정을 사용할 수 있도록 `roles/iam.workloadIdentityUser`를 부여한다. Google 공식 Action의 서비스 계정 경유 설정을 따른다.
5. 저장소 **Settings → Secrets and variables → Actions → Variables**에 다음 두 값을 등록한다.

| 변수 | 값 |
|---|---|
| `KVL_GOOGLE_WORKLOAD_IDENTITY_PROVIDER` | `projects/…/locations/global/workloadIdentityPools/…/providers/…` |
| `KVL_GOOGLE_SERVICE_ACCOUNT` | 전용 서비스 계정의 `…@….iam.gserviceaccount.com` 주소 |

workflow는 `google-github-actions/auth@v3`로 `https://www.googleapis.com/auth/spreadsheets` 범위의 단기 액세스 토큰을 발급받는다. JSON 키 파일을 만들거나 artifact로 내보내지 않는다. 이번 작업에서 서비스 계정과 GitHub 실행 권한을 연결하지 않았으며 **운영 인증은 미검증**이다. 이 문서의 설정 예시는 연결 완료 증거가 아니다.

### 3. 검토 승인 후 활성화

저장소 `AGENTS.md`는 운영 병합·배포의 명시적 사용자 승인을 요구한다. 구현 검토와 권한 연결 후 다음 순서로 운영 전환한다.

1. 승인된 PR을 main에 병합한다. 활성화 변수가 없으면 예약 수집·게시·Issue는 실행하지 않는다.
2. 저장소 변수 `KVL_VLEAGUE_UPDATE_APPROVED=true`를 설정한다.
3. Actions의 **V-League Auto Update v1 → Run workflow → main → publish=true**로 최초 반영한다.
4. MASTER 재조회 확인, 데이터 커밋, Pages 빌드 SHA와 공개 남녀 JSON 대조를 모두 확인한다. 이 단계까지 성공한 뒤 `ACTIVE`로 기록한다.

수동 실행의 `publish` 기본값은 false다. true여도 활성화 변수와 trusted-main 조건이 없으면 게시하지 않는다. 이 워크플로에는 main 보호 규칙을 우회하는 권한이 없다. 직접 bot push가 허용되지 않는 저장소 정책이면 운영 전환 전에 소유자가 게시 방식을 검토해야 한다.

## 일정·실패·복구

### 대회별 실행 기간과 종료 후 처리

`config/automation/vleague-2026-27_v1.json`이 정규리그부터 챔피언결정전까지의 시간 경계다.
기존 canonical Competition_ID와 정규리그 각 126경기 ID를 유지한다.
기존 automation_id의 `regular` 접미사는 영속 식별자이며 현재 범위는
`phase_scope=season_through_championship`과 `included_phases`로 명시한다.

| 항목 | 현재 설정 |
|---|---|
| 시간대 | Asia/Seoul |
| 갱신 시작(포함) | 2026-10-31 00:00 KST |
| 공식 연결 데이터의 마지막 정규리그 편성일 | 남녀 모두 2027-04-02 |
| 준플레이오프 | 남 2027-04-06 / 여 2027-04-05, 조건부 단판 |
| 플레이오프 | 남 2027-04-08~12 / 여 2027-04-07~11, 3전 2선승 |
| 챔피언결정전 | 남 2027-04-14~22 / 여 2027-04-13~21, 5전 3선승 |
| 최종 확인 기간 | 전체 최종 가능일 다음 7일, 2027-04-23~29 |
| 갱신 종료(미포함) | 2027-04-30 00:00 KST |

이는 운영상 갱신 마감이며 공식 대회·포스트시즌 종료일이 아니다. 근거는 정책 파일의
Source ID·URL·관측 시각·기준 커밋에 남긴다. 실제 일정이 검토한 기간 밖으로 이동하면
공식 근거를 확인해 정책을 변경해야 한다. 페이지 `dateLabel`만으로 자동 연장하지 않는다.

경량 기간 검사는 비싼 수집 전에 수행한다. 게시 진입·MASTER 재조회 후 쓰기 직전·로컬 저장·
Git push·Pages 요청 전에도 실제 시각을 다시 확인한다. 수동 실행으로 종료 경계를 우회하지 않는다.
정상 종료는 실패 Issue가 아닌 `SKIPPED`이며, 정책 오류나 실행 중 마감은 정제된 실패 사유를 남긴다.
PR 회귀 검사는 기간 이후에도 유지한다.

종료 시 `STOPPED_PENDING_ARCHIVE`로 멈춘다. `ARCHIVED`는 정규리그와 챔피언결정전까지의 최종 결과,
검수된 공식 종료 근거, MASTER 재조회, 공개 JSON과 배포 커밋의 일치, 고정 스냅샷·해시를
모두 검증한 뒤에만 부여한다. 현재 진행 중 시즌의 archive manifest는 생성하지 않았다.
GitHub cron은 종료 후에도 경량 검사에 깨어날 수 있다. 자동 수집·게시 중지와 cron 자체 중지는 구분한다.

공통 정책: [대회 자동화 운영기준](KVL_COMPETITION_AUTOMATION_OPERATING_STANDARD_v1.md).

### 반복 일정과 복구

승인 후 일정은 KST 09:17 하루 한 번, KST 12:07~23:52의 15분 간격이다. cron에는 UTC 값을 사용한다. GitHub 예약 실행은 지연되거나 누락될 수 있으므로 정확한 시각 또는 실시간 중계를 보장하지 않는다. 다음 실행도 전체 시즌을 대조하므로 중간 실행 누락을 보완한다.

검증 실패 시 기존 데이터를 유지하고 하나의 고정 Issue에 정제한 사유·경기 개수·실행 링크를 남긴다. 같은 실패는 반복 댓글이나 새 Issue를 만들지 않는다. MASTER 원문과 인증 오류 응답은 넣지 않는다. 조치 완료 후 Issue는 운영자가 닫는다.

MASTER 반영과 GitHub push/Pages 배포는 하나의 트랜잭션이 아니다. MASTER가 먼저 반영된 뒤 push·배포가 실패할 수 있다. 다음 실행은 동일 결과를 다시 대조하여 나머지 단계를 이어 간다. 배포만 실패했으면 새 데이터 커밋이 없어도 Pages 빌드를 다시 확인/요청한다. 이미 올바르게 확정된 MASTER 값을 무조건 되돌리지 않는다.

Sheets의 쓰기 전/후 대조도 원자적 compare-and-swap은 아니다. 자동 작성자는 이 workflow 하나로 유지하고, 수동 확정·정정이 필요한 행은 먼저 잠근다. 공식 종료 점수의 사후 정정은 자동 덮어쓰기하지 않고 검토 후 MASTER와 데이터의 기준을 함께 정정한다.

즉시 중지는 `KVL_VLEAGUE_UPDATE_APPROVED=false`로 한다. 실행 중인 job까지 멈추려면 Actions에서 해당 실행을 취소하고 MASTER/데이터/배포 상태를 확인한다. 다음 시즌은 현재 상수·검증 범위를 그대로 재사용하지 말고 새 시즌 어댑터를 검토한다.

## 관련 문서와 근거

- [최초 검증 결과](validation/vleague-auto-update_v1.md)
- [KVL Quality Audit](KVL_QUALITY_AUDIT_SPEC_v1.md)
- [Google GitHub 인증 Action](https://github.com/google-github-actions/auth#workload-identity-federation-through-a-service-account)
- [GitHub OIDC claim 명세](https://docs.github.com/en/actions/reference/security/oidc)
- [GitHub Pages 빌드 API](https://docs.github.com/en/rest/pages/pages#request-a-github-pages-build)
- [GITHUB_TOKEN push와 Pages 빌드](https://docs.github.com/en/actions/concepts/security/github_token)
- [예약 이벤트의 시간·제약](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule)


## 2026-11-03 · 오늘 경기 요약과 관측 세트 스코어

홈과 V-리그의 기존 다음 경기 칸은 KST 오늘 경기를 우선하여 경기 전·진행·종료까지 유지한다. 최근 결과에는 같은 날 경기를 중복 노출하지 않고, 다음 날부터 확정 결과로 이동한다. 새 카드/구역을 추가하지 않는다. 남녀는 독립 선택하며 같은 날 여러 경기는 진행 중, 시작 시각이 지난 미확인 경기, 예정, 종료 순서로 한 경기만 보여준다. 전체 일정 링크는 유지한다.

기존 공식 `stat/game-schedule` 수집기의 `live` 판정과 `sets_won`만 별도 `liveScore`로 전달한다. 필드는 `home`, `away`, 정확한 `sourceKey`, 실제 수집 시각 `observedAt`이다. 기존 `score`·세트별 최종 점수·검수 완료·승패·순위에는 포함하지 않는다. 최종 결과 확인 시 `liveScore`를 제거한다. 세트 승수 또는 진행 상태의 역행은 검토 대상으로 중지한다. 경기 중 포인트, 현재 세트 번호, 실시간 중계는 지원했다고 표시하지 않는다.

브라우저는 공식 출처 URL/경기 연결 키/당일 관측 시각/유효한 세트 승수를 검사한다. 유효한 관측만 점수와 확인 시각을 표시하며 30분이 지나면 ‘갱신 지연’으로 바꾼다. 관측 없는 진행 상태나 시작 시각만 지난 예정 경기는 ‘상태 확인 중’과 VS로 유지한다. 종료로 추측하지 않는다.

기존 15분 수집 일정과 전체 시즌·MASTER·게시 gate를 유지한다. 진행 중인 경기만 실제 재관측 시각이 갱신되어 같은 세트 스코어라도 JSON을 갱신할 수 있다. 이는 현재 점수의 마지막 실제 확인 시각을 보존하기 위한 제한된 예외이며 동일 관측 재실행은 변경0이다. 진행 경기가 없고 원문 내용이 동일하면 기존 무변경 게시 방지를 유지한다. 화면이 보일 때 기존 공개 JSON을 5분마다 다시 읽고 1분마다 날짜/지연 상태를 계산한다. 다운로드 시각을 공식 확인 시각으로 사용하지 않는다.

실제 검증·운영 재시도 및 진행 중 관측의 미확인 범위는 [검수 기록](validation/today-match-summary-20261103.md)을 따른다.
