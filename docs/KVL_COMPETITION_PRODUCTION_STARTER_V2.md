# Competition Page V2 신규 대회 시작점

공통 Shell / Controller / Components / geometry는 그대로 사용한다. 대회별 작업은 데이터 입력과 필요한 normalizer뿐이다. 현재 구현은 데이터 연결로 페이지 생성 가능하나, 기존 여자 production 재현 및 실제 브라우저 인쇄 PDF Gate가 완료되지 않아 최종 `PRODUCTION_READY` 승격은 보류한다.

## 생성

1. `templates/competition-data-v2.starter.json`을 새 대회 데이터 경로로 복사한다.
2. ID·대회명·성별·상태·확인된 일정/참가국/규정·SEO·PC/MOBILE Hero를 채운다. 미확정 수치는 null, 예정 경기는 `score: null`, 미확정 순위는 null로 둔다.
3. 원본 필드가 다를 때만 `templates/competition-data-adapter-v2.cjs`를 복사해 JSON → 공통 데이터 변환 함수를 작성한다.
4. 생성기를 실행한다. 기존 출력 파일은 덮어쓰지 않는다.

```sh
node scripts/create-competition-v2.cjs \
  --data data/competitions/new-competition.json \
  --out international-competition-new.html

# 원본 데이터 정규화가 필요한 경우에만 추가
# --adapter adapters/new-competition.cjs

# 별도 검증 HTML 생성 시에만 추가
# --validation
```

`--validation` 없는 생성물은 noindex/nofollow/noarchive를 포함하지 않는다. title, description, canonical, Open Graph 메타데이터는 빌드 시 데이터로 생성하므로 검색엔진이 JavaScript 실행 없이 읽을 수 있다. 공유 엔진의 런타임 title도 같은 데이터를 따른다. `isTest`, DUMMY/SMOKE/KVL-TEMPLATE ID, 필수 SEO/Hero 누락은 production 빌드 오류다. 파일이름만 바꿔 validation HTML을 production으로 사용하는 방식은 금지한다.

`templates/competition-page-pc-mobile-v2.html`과 기존 예시 JSON은 validation/reference용이다. 신규 production 시작점은 `templates/competition-page-production-v2.html`과 위 생성기다. 두 경로의 UI 엔진은 같다.

## 정규화된 데이터

| 영역 | 주요 필드 |
| --- | --- |
| 식별·메타 | competitionId, displayName, officialName, gender, competitionFamily, status, stageLabel, seo |
| Hero/KPI | hero.pcImage/mobileImage, dateLabel, locationLabel, venueLabel, teamCount, groupCount, matchCount, knockoutTeamCount |
| 참가국 | participants[]: code, name, en, flag, group, count/rosterCount, optional url |
| 경기 | matches[]: id, date (YYYY-MM-DD), time (KST), home/away 팀 객체, stage, round, group, venueLabel, localTimeLabel, nextMatchId |
| 점수 | score: null 또는 {home, away, sets:[{home,away}]} |
| 순위 | standings.pools[].rows / combinedRows 또는 single-league의 rows; team, rank, wins, losses, points, setRatio, pointRatio, status, statusLabel |
| 최종 결과 | finalRanking[]: rank, team, flag, result, qualification; active에서 확정 결과만 confirmed:true |
| 진출권 | qualifications[]: brand, title, description, foot, resultTeams; 미확정 팀 없음 |
| 선수 | rosters[teamCode].players[]: playerId, number, name, en, position, dob, heightCm, club, volleybox |
| 공식자료 | resources[]: title, url (HTTP/HTTPS); 실제 확인된 자료 수만 입력 |

세트별 점수는 `score.sets[]`가 있으면 공통 renderer가 기본 출력한다. 각 세트 승수와 경기 세트스코어의 불일치, null/빈 set 점수는 계약 검사에서 거부한다. 세트별 자료가 없는 결과 경기에는 세트스코어만 표시하고, 예정 경기는 VS만 표시한다. 순위 계산·타이브레이크·공식 진출 판정은 대회 데이터/normalizer의 책임이며 UI에서 결과를 추정하지 않는다.

## 현재 지원 범위와 확장 경계

| 컴포넌트 | 현재 지원 | 범위 |
| --- | --- | --- |
| standings | pools-combined / single-league / none | 동일 행·정보계층 재사용 |
| participants | groups / flat | 동일 카드와 확대 국기, contain |
| roster | full / link-only / none | 동일 선수명단, 선택/전체 인쇄, 14명 단위 분할 |
| knockout | bracket-8 / none | QF 4경기 → SF 2경기 → FINAL, optional BRONZE |
| 상태 | upcoming / active / completed | 미확정 결과는 표시하지 않음 |

4강부터 시작, 16강, 5~8위 결정전, 기타 순위결정전 및 AVC/FIVB 연령별 다단계 포맷은 **현재 검증된 지원으로 선언하지 않는다**. bracket-8에 SF만 넣어 빈 8강 열을 만드는 방식은 지원이 아니다.

확장은 공통 knockout component에 라운드 목록과 연결 관계를 받는 graph 모드를 추가한다. 각 노드는 match ID, round ID, 다음 경기, winner/loser 진출 경로, 순위 범위를 제공한다. 기존 `bmatch/bteam/setLine`과 같은 경기 카드 구조를 재사용하고, classification 경로도 같은 공통 라운드 renderer가 배치한다. 조별 다단계 방식도 standings 데이터 단계 목록으로 확장한다. 새 모드를 추가할 때 공통 계약·renderer·검증 fixture를 함께 확장하며, 대회별 HTML/CSS 템플릿은 만들지 않는다.

## 검증/승격

- DATA ONLY / 빌드 검사: `node tests/competition-v2-production-starter.test.cjs`
- 독립 가상대회: `tests/competition-page-v2-structure-engine-smoke.html?view=rosters`
- 전체 검증: `tests/competition-page-v2-production-gate.html`
- 상태/테마: `?status=upcoming|active|completed&gender=men|women`
- 변형: `standings=single-league|none`, `participants=flat`, `roster=none|link-only`, `resources=one`, `phase=final-pending`
- 가상대회는 자체 일정·경기·선수 데이터를 생성한다. 기존 AVC 이미지 자산은 로딩 검증에만 사용하며, 실제 대회 결과나 승인된 신규 Hero로 주장하지 않는다.

모든 Gate 통과 전 manifest는 PRODUCTION_READY가 아니다. Gate 통과와 기존 production 교체 승인은 별개다. 사용자의 명시적인 production 반영 요청이 있어야 기존 AVC/VNL 페이지를 교체한다.
