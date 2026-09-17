# Competition Engine V2 — 신규 대회 추가

기본 경로는 **한 개의 `competition-engine.html` + 대회별 `config.json` + `data.json` + 선택 모듈**이다. 기존 AVC 남녀 HTML을 복사하거나 대회별 HTML/CSS/JS를 만들지 않는다. 모든 대회는 같은 Shell/Controller/Components와 기존 V2 geometry를 사용한다.

현재 상태: `VALIDATED_PENDING_PRINT_PDF`. 데이터만으로 신규 대회 생성·검증은 가능하다. 실제 브라우저 인쇄 PDF 검수가 끝나기 전에는 `PRODUCTION_READY`로 선언하지 않는다. 기존 AVC/VNL production 교체와 신규 공통 엔진 승인은 별개다.

## 필요한 파일과 폴더

| 위치 | 역할 | 필수 여부 |
| --- | --- | --- |
| `data/competitions/<slug>/config.json` | 식별·대회명·시즌·성별·계열·Hero·SEO·구조 모드·모듈 선언 | 필수 |
| `data/competitions/<slug>/data.json` | 상태·기간·장소·참가국·일정·결과·순위·자료 | 필수 |
| 같은 폴더의 `rosters.json`, `qualifications.json` 등 | 선택 모듈에서 읽는 별도 JSON | 분리할 경우만 |
| 승인된 PC/mobile Hero 자산 | config.hero에서 참조 | production 필수 |

slug는 소문자 영문·숫자·하이픈으로 만든다. 권장 규칙은 `<family>-<event>-<season>-<gender>`이다. 이미 존재하는 기존 대회의 파일/폴더 이름은 바꾸지 않는다. 대회별 상태가 바뀌어도 slug와 competitionId는 유지한다.

표준 빈 양식은 `templates/competition-config-v2.starter.json`과 `templates/competition-content-v2.starter.json`이다. 빈 식별자나 필수 데이터는 생성기에서 임의로 채우지 않으며 검사를 통과하지 못한다.

## 생성 절차와 URL

```sh
# 새 폴더와 두 JSON만 생성한다. 기존 폴더가 있으면 실패한다.
node scripts/scaffold-competition-v2.cjs --slug example-open-2032-men

# 두 JSON을 확인된 대회 정보로 채운 다음 검사한다.
node scripts/scaffold-competition-v2.cjs \
  --check data/competitions/example-open-2032-men
```

1. config에 대회 식별·시즌·성별·competitionFamily·승인된 Hero·SEO description·구조 모드를 입력한다.
2. data에 확인된 상태·개최 정보·참가국·일정·결과 등을 입력한다. 미확정 수치는 null, 예정 경기는 `score:null`, 미확정 순위는 null로 둔다.
3. 필요할 때만 모듈 JSON을 분리하거나 원본 데이터를 공통 schema로 정규화한다. UI 코드는 작성하지 않는다.
4. 계약 검사를 통과한 새 폴더와 필요한 이미지 자산만 저장소에 추가한다. 공통 HTML 수정·새 HTML 생성·대회 registry 수정이 필요 없다.
5. `/competition-engine.html?competition=example-open-2032-men`으로 연다. 메뉴는 `&view=overview|schedule|groups|knockout|rosters|resources`, 선수 선택은 `&team=TEAMCODE`를 붙인다. 메뉴·KPI·달력 이동은 competition 값을 유지한다.
6. 다른 페이지나 메뉴에서 연결할 때 위 URL을 사용한다. 메뉴에 노출하는 작업은 별도 운영 선택이며, URL 작동을 위한 조건이 아니다. 기존 AVC 남녀/VNL URL은 유지한다.

위 example 이름은 문서 설명용이며 실제 대회로 게시되어 있지 않다. 테스트 자료는 production 검사를 통과시키기 위해 isTest를 제거하지 않는다. 검증 자료는 `/tests/` 아래 별도 collection과 noindex 진입점에서만 읽는다.

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
- 기존 가상대회 JSON 경로: `/tests/competition-page-v2-config-smoke.html?competition=horizon-2031-women&view=rosters`
- 경로별 화면 검사: `/tests/competition-page-v2-production-gate.html`의 `config/data 경로 검증`
- 기존 144개 + 42개 UI 검사 결과는 재사용하며 이번 작업에서 처음부터 반복하지 않았다.
- 여자 production SyntaxError는 이전 수정 상태를 확인했다. 기존 남녀 production은 보존하고 신규 남녀는 V2 한 벌을 사용한다.
- 남은 승인 조건은 실제 브라우저 PDF의 한글·국기·누락·페이지 분할·잘림 검사다. 현재 연결 브라우저는 PDF export 미지원이다.
- 외부 브라우저에서 검토 링크의 선택 국가/전체 인쇄 → PDF 저장으로 2장(18명)과 9장(116명)을 출력해 전달하면 파일을 검수할 수 있다. 출력 전 인쇄 설정은 A4 가로, 배율 100%, CSS 여백을 따른다. 결과 PDF를 확인한 후에만 인쇄 Gate를 완료한다.
