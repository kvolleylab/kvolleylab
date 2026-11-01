# Competition Engine V2 — 신규 대회 추가

화면의 기본 경로는 **한 개의 `competition-engine.html` + 대회별 `config.json` + `data.json` + 선택 모듈**이다. 신규 대회 등록은 여기에 **`operations.json`**을 함께 만들어 **페이지 제작 + MASTER 연결 + 자동 업데이트 + 종료 후 기록 보관**을 한 작업으로 관리한다. 기존 AVC 남녀 HTML을 복사하거나 대회별 HTML/CSS/JS를 만들지 않는다. 모든 대회는 같은 Shell/Controller/Components와 기존 V2 geometry를 사용한다.

현재 상태: `VALIDATED_PENDING_PRINT_PDF`. 데이터만으로 신규 대회 생성·검증은 가능하다. 실제 브라우저 인쇄 PDF 검수가 끝나기 전에는 `PRODUCTION_READY`로 선언하지 않는다. 기존 AVC/VNL production 교체와 신규 공통 엔진 승인은 별개다.

운영 manifest는 **연결계약과 활성화 전 검수 gate**다. 공통 수집기·대회별 PDF/OCR/엑셀 parser·MASTER writer·보관 runner가 이 파일만으로 만들어지는 것은 아니다. 생성 직후에는 `DRAFT`, `automation.enabled=false`이며 페이지 렌더링에 성공해도 자동 운영 `ACTIVE`로 표시하지 않는다.

## 필요한 파일과 폴더

| 위치 | 역할 | 필수 여부 |
| --- | --- | --- |
| `data/competitions/<slug>/config.json` | 식별·대회명·시즌·성별·계열·Hero·SEO·구조 모드·모듈 선언 | 필수 |
| `data/competitions/<slug>/data.json` | 상태·기간·장소·참가국·일정·결과·순위·자료 | 필수 |
| `data/competitions/<slug>/operations.json` | 공식 출처·MASTER 정밀 범위·일정·담당자·검수·종료 후 보관 계약 | 신규 등록 필수 |
| 같은 폴더의 `rosters.json`, `qualifications.json` 등 | 선택 모듈에서 읽는 별도 JSON | 분리할 경우만 |
| 승인된 PC/mobile Hero 자산 | config.hero에서 참조 | production 필수 |

slug는 소문자 영문·숫자·하이픈으로 만든다. 권장 규칙은 `<family>-<event>-<season>-<gender>`이다. 이미 존재하는 기존 대회의 파일/폴더 이름은 바꾸지 않는다. 대회별 상태가 바뀌어도 slug와 competitionId는 유지한다.

표준 빈 양식은 `templates/competition-config-v2.starter.json`, `templates/competition-content-v2.starter.json`, `templates/competition-operations-v1.starter.json`이다. 생성기는 slug와 공통 페이지 경로만 연결한다. MASTER·출처·시작일·종료일·검수 결과를 추정해서 채우지 않으며, 빈 운영 필드는 활성화 검사를 통과하지 못한다.

## 생성 절차와 URL

```sh
# 새 폴더에 config/data/operations 세 JSON을 생성한다. 기존 폴더는 변경하지 않는다.
node scripts/scaffold-competition-v2.cjs --slug example-open-2032-men

# 기존 페이지 계약만 검사한다. 기존 2파일 대회에도 같은 명령을 사용할 수 있다.
node scripts/scaffold-competition-v2.cjs \
  --check data/competitions/example-open-2032-men

# 출처·MASTER·일정·보관 검수 근거가 모두 기입되어 있는지 별도로 검사한다.
node scripts/scaffold-competition-v2.cjs \
  --check-operations data/competitions/example-open-2032-men

# 운영 전환 검토 전에는 production 페이지 계약과 operations를 함께 검사한다.
node scripts/scaffold-competition-v2.cjs \
  --ready-to-activate data/competitions/example-open-2032-men
```

1. config에 대회 식별·시즌·성별·competitionFamily·승인된 Hero·SEO description·구조 모드를 입력한다.
2. data에 확인된 상태·개최 정보·참가국·일정·결과 등을 입력한다. 미확정 수치는 null, 예정 경기는 `score:null`, 미확정 순위는 null로 둔다.
3. 필요할 때만 모듈 JSON을 분리하거나 원본 데이터를 공통 schema로 정규화한다. UI 코드는 작성하지 않는다.
4. operations에 확인된 출처·MASTER·실행 시작/종료일·수집주기·책임자·보관 경로를 입력하고 아래 검수를 완료한다. 이 단계 전에는 페이지 준비 상태와 운영 준비 상태를 구분한다.
5. 통합 검사를 통과한 새 폴더와 필요한 이미지 자산만 검토 변경에 추가한다. 공통 HTML 수정·새 HTML 생성·대회 registry 수정은 페이지 URL 동작을 위해 필요하지 않다. 실제 자동화에는 명시한 수집 adapter와 workflow의 연결·실행 검증이 추가로 필요하다.
6. `/competition-engine.html?competition=example-open-2032-men`으로 연다. 메뉴는 `&view=overview|schedule|groups|knockout|rosters|resources`, 선수 선택은 `&team=TEAMCODE`를 붙인다. 메뉴·KPI·달력 이동은 competition 값을 유지한다.
7. 다른 페이지나 메뉴에서 연결할 때 위 URL을 사용한다. 메뉴에 노출하는 작업은 별도 운영 선택이며, URL 작동을 위한 조건이 아니다. 기존 AVC 남녀/VNL URL은 유지한다.

위 example 이름은 문서 설명용이며 실제 대회로 게시되어 있지 않다. 테스트 자료는 production 검사를 통과시키기 위해 isTest를 제거하지 않는다. 검증 자료는 `/tests/` 아래 별도 collection과 noindex 진입점에서만 읽는다.

## 운영 manifest와 활성화 전 필수 검수

`operations.json`은 자격증명·선수 원문·개인 연락처를 담지 않는 공개 가능한 연결 메타데이터다. Google 인증 JSON, 토큰, 서명된 임시 다운로드 URL을 넣지 않는다. 실제 권한은 기존 GitHub/Google 권한 구성에서 관리한다. 검증기는 정의하지 않은 필드와 자격증명 형태의 URL을 거부한다.

| 필드 | 통과 조건과 확인할 내용 |
| --- | --- |
| `competition` | config와 같은 stable competitionId·slug·season·gender. 기존 ID를 재발급하지 않는다 |
| `owner` | 책임자의 GitHub 사용자 또는 팀 handle |
| `page.route`, `page.qa` | 일치하는 공통 URL 및 PC/mobile·메뉴·기존 기능·자료 연결·필요한 인쇄 검수 근거 |
| `sources[]` | 고유 sourceId, 발행기관, 실제 공식 HTTPS URL, 파일 형식, 저장소에 존재하는 adapterPath, 고정 parserVersion |
| `sources[].qualification` | 해당 대회·자료형의 실제 표본으로 추출/중복/수정본/빈 데이터/오류 사례를 검증한 기록. 다른 대회 신청 양식만으로 경기결과 parser를 승인하지 않는다 |
| `sources[].permissionReview` | 공개 수집 범위·원본 보관·공개 가능한 필드·재배포 범위 검토 근거 |
| `master` | 정확한 spreadsheetId, 숫자 sheetId, tabTitle, 한 탭 안의 유한한 writeRange. `B2:S127` 같은 셀 범위만 허용하며 `A:Z`·전체 시트·다른 탭을 포함한 값은 거부 |
| `master.permissionReview`, `master.writeReadback` | 대상 파일·탭·허용 셀 권한과 검증된 쓰기/재조회 결과. 파일 제목 검색이나 이름 유사 일치로 대상 변경 금지 |
| `automation` | 실제 workflowPath, startDate/endDate, IANA timezone, 명시한 intervalMinutes. 시작·종료일은 `YYYY-MM-DD`, 종료일은 시작일 이상. 기본 timezone은 Asia/Seoul |
| `automation.integration`, `automation.endGuard` | 수집→검증→MASTER 정밀 반영·재조회→공개 데이터의 실행 근거 및 종료 경계에서 정기 갱신이 중단되는 검증 |
| `archive` | 확인된 기존 Drive folder ID, `data/archive/<...>/<slug>/...json` 형태의 메타데이터 경로, 실제 보관 절차 문서, 최종 검수 유예일수 graceDays |
| `archive.verification` | 종료 검수·원본 버전·최종 기록·MASTER 재대조·정기 갱신 중단·복구 절차 시험 근거. 읽기 전용 보관과 버전별 정정 정책은 true |

검수 객체는 `status=VERIFIED`, `evidence`, `verifiedAt`(UTC), `verifiedBy`를 모두 요구한다. `verifiedAt`은 검사 시각 이하이어야 하며 미래 시각의 검수 완료 기록은 실패다. evidence에는 실제 검수 문서의 저장소 경로나 HTTPS 실행/검수 기록을 넣는다. 로컬 근거 파일·adapter·workflow·보관 절차는 실제 존재해야 한다. parserVersion은 고정 버전(예: `1.0.0`) 또는 `git:<40자리 commit>`을 기록한다. 빈 문자열, `NOT_VERIFIED`, 존재하지 않는 파일은 실패다.

이 CLI는 기록의 형식·일치·존재를 검사하며 외부 권한, 원본의 공식성, 검수 문서의 결론을 실시간 재검증하지 않는다. 담당자는 **실제 검수 뒤에만** VERIFIED를 기록한다. 출처 양식·parser·MASTER 범위·종료일·보관 절차가 바뀌면 관련 검수는 다시 수행한다. 이 절차를 단순히 모든 상태를 VERIFIED로 바꾸는 작업으로 대체하지 않는다.

`--check`는 기존 config/data/modules 검사만 유지한다. `--check-operations`는 운영 근거 계약을 검사한다. 신규 자동 운영 대회의 검토 완료 판단에는 **`--ready-to-activate`를 사용**한다. 이 명령은 `--validation`으로 production 보호를 우회하지 못하며, 해당 timezone에서 종료일이 지난 대회는 새 활성화 대신 종료 검수를 요구한다. 종료일은 해당 지역의 마지막 날 전체를 포함한다.

`startDate`는 해당 시간대의 시작일 00:00부터 포함하고 `endDate`는 종료일 하루 전체를 포함한다. offset-aware runtime 정책의 `starts_at`·`ends_at`은 시작 포함·종료 미포함 구간이므로, 연결 어댑터는 `endDate` 다음 현지 날짜의 00:00을 `ends_at`으로 변환해야 한다. 예를 들어 **`timezone=Asia/Seoul`, `endDate=2027-04-09`는 `ends_at=2027-04-10T00:00:00+09:00`과 대응**한다. 날짜 문자열을 그대로 자정 종료 시각으로 읽어 하루 일찍 중단하지 않는다. 이 변환과 종료일 마지막 순간/다음 날 경계는 `automation.endGuard` 검수에 포함한다.

모든 검증 명령은 읽기 전용이다. `--ready-to-activate` 성공은 `DRAFT` 또는 `READY_FOR_REVIEW`, 자동화 비활성 상태의 **운영 전환 검토 준비**만 의미한다. 실제 workflow 연결·권한·최초 실행·MASTER 재조회·배포 확인을 완료하고 승인된 전환을 적용한 뒤에만 운영 상태를 `ACTIVE`로 기록한다. 이 파일은 기존 runtime이 자동으로 읽거나 실행하지 않는다.

`archive.graceDays`는 갱신 종료 후의 **별도 보관 검토 기간**이며 자동 수집·MASTER 쓰기·게시 가능 구간을 연장하지 않는다. 마지막 결과·순위·명단·출처 개정 여부를 검수하고, 기존 Drive 원본 폴더와 버전·해시를 유지하며 메타데이터 및 최종 snapshot을 보관한다. 갱신 재개가 필요하면 근거·담당자·새 기간을 기록한 별도 정책 변경을 거친다. 보관 검수까지 끝나야 `ARCHIVED`를 기록한다. 보관된 원본·stable ID·기존 경기결과는 삭제하거나 새 시즌 값으로 덮어쓰지 않는다. 이후 정정은 근거와 변경 이력이 있는 별도 버전으로 처리한다. `operations.json`의 archive 선언만으로 실제 보관 완료를 주장하지 않는다.

### 신규 연결계약과 기존 V-리그 runtime의 범위

이 starter의 `archive.metadataPath`는 **신규 대회의 운영 연결계약**이며 `data/archive/<...>/<slug>/...json` 경로를 요구한다. 실제 신규 대회용 adapter가 이 계약을 읽고 수행하는 것은 별도 구현·검증 대상이다.

현재 V-리그 자동화는 이 starter의 `operations.json`을 사용하지 않는다. 기존 전용 정책 `config/automation/vleague-2026-27_v1.json`과 `scripts/kvl_competition_lifecycle.py`를 사용하며, 종료 검수 후 고정 snapshot·보관 manifest를 확인하는 경로는 **`data/automation/archive/{automation_id}/`**다. 이 경로는 기존 V-리그 adapter의 계약으로 유지한다. 신규 starter의 경로 검사에 맞추려고 기존 V-리그 자료를 이동하거나, 두 경로를 같은 runtime으로 설명하지 않는다. 추후 통합할 때는 명시적인 adapter 매핑·이관 검수와 기록 보존이 필요하며, 현재 검증기에서 임의 보관 경로를 허용하도록 범위를 넓히지 않는다.

## 필수/선택 데이터

| 영역 | 필드와 조건 |
| --- | --- |
| config 필수 | schemaVersion=2, slug, competition.{competitionId,displayName,officialName,season,gender,competitionFamily}, structure, data |
| 성별·계열 | gender=men/women; competitionFamily=avc/fivb/domestic. 여자는 Rose, 남자는 계열별 기존 팔레트. 별도 geometry 없음 |
| production 필수 | hero.pcImage/mobileImage, seo.description. title은 생략하면 대회명 + K-Volley Lab. canonical은 공통 URL에서 생성 |
| data 필수 | status=upcoming/active/completed. participants/matches 등 없거나 비어 있는 항목은 사실상 미확정 상태를 뜻함 |
| 개최 정보 | dateLabel, locationLabel, venueLabel, 선택 venuePrimary/venueSecondary. 미정이면 해당 안내 문구를 입력 |
| KPI | teamCount, groupCount, matchCount, knockoutTeamCount. 확인되지 않은 숫자는 null |
| 참가국·조 | participants[]: code,name,en,flag,group,count/rosterCount. 조별 구조는 group으로 묶음 |
| 경기 | matches[]: id,date(YYYY-MM-DD),time(KST),home/away 팀 객체,stage,round,group,venueLabel,localTimeLabel,nextMatchId |
| 점수 | score:null 또는 {home,away,sets:[{home,away}]}. 실제 sets만 기본 표시. 3/4/5세트 지원, 예정 경기의 가짜 점수 금지 |
| 순위 | standings.pools[].rows/combinedRows 또는 single-league의 rows. rank,team,wins,losses,points,setRatio,pointRatio,status/statusLabel |
| 최종 결과 | finalRanking[]: rank,team,flag,result,qualification. active에서는 공식 확정 항목만 confirmed:true |
| 선수명단 | rosters[teamCode].players[]: playerId,number,name,en,position,dob,heightCm,club,volleybox. 없는 데이터는 생성하지 않음 |
| 선택 설명 | stageLabel, meaning, scheduleNote, standingsNote, standingsRule, qualifications[], focus, rosterNote 등 공통 schema 필드 |
| 공식자료 | resources[]: title,url. 실제 확인된 HTTP/HTTPS 링크만 입력 |

upcoming에는 경기 결과·우승팀·최종순위·확정 진출팀을 넣지 않는다. 순위 계산/타이브레이크/규정 판정은 원본 데이터 또는 DATA ONLY normalizer의 책임이다. 엔진은 예상 결과를 공식 결과처럼 계산하지 않는다.

## Optional modules

모듈을 쓰지 않으면 rosters/qualifications/resources/focus를 data.json 안에 그대로 둔다. 분리하려면 해당 필드를 data.json에서 제거하고 config에 선언한다.

```json
"modules": [
  {"id": "rosters", "source": "rosters.json"},
  {"id": "qualifications", "source": "qualifications.json"}
]
```

기본 등록 모듈은 rosters, qualifications, resources, focus다. 경로는 해당 대회 폴더 안의 상대 JSON 파일만 허용한다. 중복 필드·미등록 모듈·잘못된 경로는 명시적으로 실패한다. modules는 공통 renderer에 전달할 데이터만 반환한다.

새 특수 규정의 normalizer가 필요하면 `templates/competition-module-v2.starter.js`의 register(id,{fields,normalize}) 계약을 사용한다. 재사용 모듈 파일을 한 번 공통 진입점에 연결한 뒤 대회별 config에서는 등록 ID/source/options만 선택한다. 모듈은 선언한 공통 schema 필드만 반환하며 Hero/카드/토너먼트 HTML이나 CSS를 만들지 않는다. 기존 engine renderer를 수정하지 않고 원본 필드·규정 계산을 확장하는 경계다. 별도 모듈을 계약 검사에도 연결할 때는 `--module assets/js/modules/my-module.js`를 추가한다(여러 번 지정 가능). 같은 모듈 파일은 브라우저 등록과 Node 검사 양쪽에서 사용한다. 새 UI 구조 자체가 필요하면 아래 공통 구조 확장 절차를 따른다.

## 지원 범위

| 컴포넌트 | 현재 검증된 지원 |
| --- | --- |
| standings | pools-combined / single-league / none |
| participants | groups / flat |
| roster | full / link-only / none |
| knockout | bracket-8 / none: QF 4경기 → SF 2경기 → FINAL, 선택 BRONZE |
| 상태 | upcoming / active / completed |

4강 시작·16강·5~8위·다른 순위결정전·연령별 특수 형식은 아직 검증된 지원이 아니다. 현재 지원하지 않는 구조를 optional module 이름만으로 지원한다고 표시하지 않는다. 향후 공통 bracket renderer에 라운드 목록과 winner/loser 연결 graph를 추가하고 같은 경기 카드와 geometry를 재사용한다. 대회별 템플릿은 만들지 않는다.

## SEO와 기존 시작점

공통 URL은 config를 읽은 후 title/description/canonical/Open Graph를 갱신한다. 새 대회마다 HTML을 만들지 않는 정적 사이트 방식이므로 JavaScript를 실행하지 않는 공유/검색 클라이언트에는 공통 기본 메타만 보일 수 있다. 개별 대회의 서버 렌더링 메타가 구현된 것으로 주장하지 않는다.

공통 production HTML에는 validation용 noindex나 예시 대회 데이터를 넣지 않았다. 다만 현재 사이트 전체의 `unified-nav.js`에 PRIVATE_REVIEW_MODE가 켜져 있어 런타임 검색 차단은 유지된다. 이번 작업은 사이트 전체 공개 상태를 바꾸지 않는다.

이전 `scripts/create-competition-v2.cjs`, `templates/competition-page-production-v2.html`, 단일 통합 data starter는 기존 생성물의 호환성과 정적 SEO가 필요한 명시적 별도 작업을 위해 보존한다. 신규 대회 추가의 기본 경로로 사용하지 않는다.

## 검증과 남은 Gate

- 신규 config/data/modules 계약: `node tests/competition-v2-config.test.cjs`
- 운영 연결·종료일·보관 검수·기존 결과 보존: `node tests/competition-operations-v1.test.cjs`
- 기존 가상대회 JSON 경로: `/tests/competition-page-v2-config-smoke.html?competition=horizon-2031-women&view=rosters`
- 경로별 화면 검사: `/tests/competition-page-v2-production-gate.html`의 `config/data 경로 검증`
- 기존 144개 + 42개 UI 검사 결과는 재사용하며 이번 작업에서 처음부터 반복하지 않았다.
- 여자 production SyntaxError는 이전 수정 상태를 확인했다. 기존 남녀 production은 보존하고 신규 남녀는 V2 한 벌을 사용한다.
- 남은 승인 조건은 실제 브라우저 PDF의 한글·국기·누락·페이지 분할·잘림 검사다. 현재 연결 브라우저는 PDF export 미지원이다.
- 외부 브라우저에서 검토 링크의 선택 국가/전체 인쇄 → PDF 저장으로 2장(18명)과 9장(116명)을 출력해 전달하면 파일을 검수할 수 있다. 출력 전 인쇄 설정은 A4 가로, 배율 100%, CSS 여백을 따른다. 결과 PDF를 확인한 후에만 인쇄 Gate를 완료한다.
