# V-리그 포스트시즌 표시 복구 · 2026-10-28

Status: IMPLEMENTED / VERIFIED / RELEASE AUTHORIZED. 배포 여부와 최종 merge SHA, Pages 실행 및 운영 화면 증거는 release PR에서 확인한다.

## 기준과 범위

- 사용자 요청: V-리그 포스트시즌 사다리 표시 오류 확인 및 디자인 수정. 기존 운영 페이지 수정 승인 범위의 후속 작업.
- 조사 기준 main: `20296f34153b783828868411f0baac490373b873` (#196).
- 릴리스 기준 main: `3d66e6ffe6081c7d9c5582081f542a4ad7702b91` (#197). 동시에 적용된 종합대회/U-리그 Hero 변경을 rebase로 보존.
- 대상: 공통 엔진 `pro-postseason` 모드의 V-리그 남녀 페이지.
- 기존 config의 준PO 조건, PO 3전 2선승, 챔피언결정전 5전 3선승을 재사용. 새 경기 결과·순위·선수·원본 자료를 수집하거나 변경하지 않음. 기존 MASTER v16의 수정시각은 변경 없음.

## 원인과 변경

국내대회 스킨이 `data-kvl-family=domestic`을 적용했지만 시리즈 내부 선택자는 `data-kvl-family=pro`에만 연결돼 있었다. 외곽 카드만 남고 팀·점수·일정이 일반 텍스트처럼 붙어 표시됐다.

공통 CSS를 `pro` 및 `.kvl-pro-league-domestic-v2`에 함께 적용하고 중복된 이전 사다리 스타일을 정리했다. 901px 이상은 3단 가로 연결, 900px 이하는 세로 연결이다. 카드 상단을 정렬하고 팀명 두 행, 시리즈 승, 경기별 일정/결과, 진출 조건을 구분한다. 이름은 말줄임 없이 줄바꿈한다. 남자부 차콜/여자부 기존 로즈 팔레트, 시리즈·세트 점수는 `#4B5563`이다. 회색 hover 복원을 유지한다.

대진 미확정 상태는 팀 미정/—로 표시한다. 실제 일정의 참가팀을 우선하고 홈·원정이 뒤집혀도 두 팀과 승수를 정확히 연결한다. 준PO가 PO에 중복 포함되지 않도록 라운드를 분리하고 날짜순 정렬한다. 유효한 종료 스코어만 시리즈 승수에 포함하며, 시리즈 승자를 다음 단계로 연결하고 승부가 끝난 뒤 남은 차전은 미실시로 표시한다. 실제 팀 링크는 기존 팀 경기결과 경로를 유지한다. 실시간 수집기를 추가한 것은 아니다.

## 파일

- `assets/js/kvl-competition-components-v2.js`: 포스트시즌 렌더러 및 시리즈 연결.
- `assets/css/kvl-competition-components-v2.css`: 두 스킨에 적용되는 반응형 사다리.
- `competition-engine.html`: 해당 JS/CSS cache token.
- `tests/vleague-postseason.test.cjs`: 미확정/스킨 누락/홈원정 역전/라운드 분리/진출/우승/미실시/부분·진행 중 점수 회귀.
- `tests/competition-v2-pro-cup-pool-columns.test.cjs`: CSS cache 기대값 갱신.
- `.github/workflows/kovo-cup-production-20261027-smoke.yml`: 새 검사와 CSS 변경 감지.
- 본 문서 및 `docs/KVL_DECISION_LOG.md`.

## 검증

- DOM 회귀 63/63 통과: 새 포스트시즌 6개, V-리그 명단/한눈에/최근+다음 경기, Cup 명단, 대학 국내대회 및 국제대회 옵션 분리.
- 남녀 미확정 카드 3개와 1/3/5개 차전, 홈·원정 역전 및 날짜 역순 입력, 준PO/PO 분리, 2승/3승 확정, 실제 팀 링크, 부분/진행 중 점수 제외, 원본 객체 불변 확인.
- Cup 생산 템플릿/프로토타입/PC 경기 정렬/7열 순위표 smoke 4개 통과.
- 최종 여자부 팔레트와 진행 중 상태 문구 조정 후 포스트시즌 6/6 재검증. JS 구문 및 git diff whitespace 검사 통과.
- 브라우저: PC 1280/1024와 모바일 390/360. 카드 및 페이지 가로 넘침 없음. 실제 운영 데이터와 별도 가상 종료 시리즈로 팀명·점수·우승·미실시 확인.
- 1280 여자부 가상 결과: 모든 점수 `rgb(75, 85, 99)`, 내부 overflow 0. 360 여자부 가상 결과: body clientWidth/scrollWidth 345/345, 내부 overflow 0.
- 전체 저장소 CI를 모두 통과했다고 주장하지 않음. 관계없는 기존 워크플로 실패는 release PR에 구분 기록.
- 시리즈 완료 화면의 가상 데이터는 ignored `.preview` 안에서만 사용하며 운영 데이터에는 포함하지 않는다. 검수 이미지는 별도 QA branch에 보관하고 PR에서 연결한다.

## 복구와 다음 단계

운영 반영은 PR의 검증된 head를 main에 병합하고 GitHub Pages 성공 및 남녀 live 화면을 확인한다. 문제 발생 시 이 PR의 코드/테스트/cache 변경만 되돌린다. 원본 데이터 복원은 불필요하다. 다른 작업의 main 변경과 기존 회색 hover 상태를 덮어쓰지 않는다.
