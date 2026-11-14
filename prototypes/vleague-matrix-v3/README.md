# V-리그 1~6라운드 승패 조견표 v3

Status: **PROTOTYPE / IMPLEMENTED / VERIFIED WITH LIMITS / READY FOR REVIEW / NOT DEPLOYED**.
2026-11-14 KST. 운영 main, MASTER, Competition Engine V2, 기존 자동화는 수정하지 않았다.
기준 main: `774c1ef2504ab891cef9e33611ef80961cc824f0`.
격리 브랜치: `feature/vleague-round-matrix-v3`.

## 실행

저장소 루트에서 Node.js 20 이상으로 실행한다. 빌드에는 외부 npm 패키지가 필요 없다.

```sh
node prototypes/vleague-matrix-v3/build.cjs
```

생성된 `index.html`을 브라우저로 열면 남녀부 전환이 가능하다. `?gender=women`으로 여자부에서 시작할 수도 있다.
HTML 안의 데이터는 체크아웃한 `data.json`을 빌드 시 자동 포함한 읽기 전용 저장본이다.
페이지를 열면 GitHub main의 같은 남녀부 `data.json`/`config.json`을 읽고, 이후 60초마다 재확인한다.
오프라인 또는 요청 실패 시 마지막 유효 저장본과 **최신 데이터 확인 실패**를 표시한다.
폰트·내비게이션 이미지는 기존 공개 KVL 자산을 사용하므로 오프라인에서는 대체 글꼴/이미지 제한이 있을 수 있다.

## 데이터 계약 및 계산

- 기존 시즌 JSON만 사용한다. 새 수동 입력 DB나 MASTER 쓰기 경로를 만들지 않는다.
- 행과 열은 `previousSeasonRanking.rows`의 `rank` 순서로 고정한다. 7개 팀의 중복/순위 누락이면 실패를 표시한다.
- 공식 약칭은 시즌 `config.structure.calendarDisplay.teamAliases`를 사용한다.
- 라운드는 명시 `round` 또는 현재 데이터의 `stage: "1라운드"` 등을 읽는다. 충돌은 제외하고 경고한다.
- 정규리그 6라운드 × 21경기 = 각 부 126경기. 포스트시즌·올스타는 제외한다.
- `status === "final"`만 계산한다. 세트 합계, 실제 세트 점수, 3세트 선승, 듀스, 5세트 점수 및 명시적 검증 실패 여부를 확인한다.
- 맞대결 셀은 그 라운드에서 획득한 세트 수다. 0은 숫자 0, 아직 종료되지 않은 경기는 공란, 자기 팀은 대각선이다.
- 3–0/3–1은 승자 3점·패자 0점, 3–2는 승자 2점·패자 1점이다.
- 총승점과 순위는 1~해당 라운드까지의 종료 결과, R승점은 해당 라운드의 종료 결과만 반영한다.
- 미시작 라운드의 순위·총승점·R승점은 공란이다. 진행 중/라운드 종료/이전 라운드 미완료를 구분한다.
- 순위는 승점 → 승수 → 세트 득실률 → 점수 득실률. 비율은 반올림 없이 교차 곱으로 비교한다.
- 여기까지 2팀 동률이면 가장 최근 맞대결 승자, 3팀 이상 동률이면 동률 팀 간 승수 → 세트 득실률 → 점수 득실률을 적용한다. 끝까지 미해결인 동률은 `=`로 표시한다.
- 기존 공식 순위가 현재 누적 8개 지표(경기·승·패·승점·세트 득실·점수 득실)와 전부 일치하면 공식 순위를 채택한다. 과거 라운드에 현재 순위를 덮어쓰지 않는다.
- 같은 라운드·팀 쌍의 동일 중복은 한 번만 반영한다. 상충하는 중복/식별자는 제외하고 경고한다. 누락 일정·잘못된 종료 결과가 있으면 관련 순위를 숨긴다.
- 매 갱신 때 원본 전체에서 재계산하므로 정정 결과가 이중 누적되지 않는다. 이전 성별의 늦은 응답은 새 성별 화면을 덮어쓰지 않는다.

## 공식 근거

KOVO **HK흥국금융 2026~2027 V-리그 운영요강 제22조**, 인쇄쪽 270, PDF 4번째 펼침면을 실제 열어 확인했다.

[KOVO 운영요강 PDF](https://cdn.kovo.co.kr/1/games/v-leagues/league-info-test/HK흥국금융%202026~2027%20V-리그%20운영요강.pdf)

파일 SHA256: `6fc933863c2b26f66ff8f32796e846f641c278cffe06504dbb9fe92265713150`.
기존 Python 순위 도구의 과거 NOT VERIFIED 메모를 근거로 새 순위 규칙을 추정하지 않았으며, 그 운영 코드는 변경하지 않았다.

## 화면

기존 KVL 공통 Pretendard·사이드바·모바일 헤더를 빌드에 그대로 포함한다. 오래된 문서의 Arial 일반 지침보다 현행 공통 글꼴과 이번 사용자 요청을 따른다.
본문 최대 1180px, PC 2×3, 900px 이하 한 열. 360/390px에서 표 내부 가로 스크롤 없이 340/370px로 표시한다.
숫자 14px, 모바일 팀명·열 제목 12px. 흰 배경·회색 테두리/헤더·살구색 총승점·노란 1위만 사용한다.

## 검증 및 남은 범위

[상세 검수 기록](../../docs/validation/vleague-matrix-v3-20261114.md)을 확인한다.
계산/갱신/실제 생성 HTML 검사 20개 통과. 관련 기존 UI 검사 55개 통과, 수집 후보 미제공 검사 1개 건너뜀.
실제 브라우저 8조건(남녀 × 360/390/768/1180px)에서 페이지·표 가로 넘침 0px.
조회 시각이 11:34 → 11:35 KST로 자동 변경되는 것을 확인했다.
이전 실제 JSON(여자부 종료 11경기)에서 현재 12경기 JSON으로 바뀌는 타이머 재계산은 제어된 테스트로 검증했다.
이 작업 시간에 새 실경기가 종료되지 않았으므로 **새 경기 발생 → 공식 수집 → MASTER → main → 조견표** 전체 경로의 새 이벤트 관측은 미검증이다.

```sh
node prototypes/vleague-matrix-v3/build.cjs
node --test tests/matrix-v3/core.test.cjs
# 기존 테스트 환경의 jsdom이 필요하다. 이 작업에서는 jsdom 26.1.0을 사용했다.
node --test tests/matrix-v3/page.test.cjs
node --test tests/vleague-auto-update-ui.test.cjs tests/vleague-calendar.test.cjs tests/vleague-match-summary.test.cjs tests/vleague-roster-ui.test.cjs tests/vleague-postseason.test.cjs
```

과거 실제 데이터 재생 테스트는 커밋 `223bab9a1561ffa9b8ddc218f0cd095200cfe952`가 Git 객체로 있어야 한다(얕은 복제에서는 해당 이력을 가져온 후 실행).
전체 126경기 및 3라운드 중간 누적 테스트의 합성 결과는 검사에만 쓰며, 사용자 화면에는 넣지 않는다.

## 승인 후 운영 연결 계획 — 이번 작업에 포함하지 않음

| 파일 | 후속 변경 |
| --- | --- |
| `assets/js/kvl-vleague-matrix-v3.js` (신규 예정) | 이 core/render를 모듈로 옮기고 기존 엔진 데이터를 받아 그린다. |
| `assets/css/kvl-vleague-matrix-v3.css` (신규 예정) | 조견표 전용 범위의 CSS만 분리한다. 페이지 전체 body/nav 스타일은 옮기지 않는다. |
| `assets/js/kvl-competition-components-v2.js` | `renderStandings()`의 단일 리그 표 아래에 두 V-리그 slug만 조건부 연결하고 기존 refresh 흐름에서 다시 그린다. |
| `competition-engine.html` | 위 모듈의 로더 연결. 다른 대회에는 조견표를 생성하지 않는다. |
| `tests/matrix-v3/*`, 관련 UI 테스트 | 운영 연결 시 순위·일정·선수·포스트시즌·남녀 전환 회귀 확인. |

`data.json`, `config.json`, 경기 MASTER, 선수 MASTER, 자동화 workflow/주기는 변경할 필요가 없다.
기본 연결 위치는 `view=groups`의 정규리그 순위표 아래다. 대회 한눈에 요약에도 추가하려면 별도 검수한다.
승인 전에는 main 병합/Pages 배포를 하지 않는다. 복구는 격리 브랜치를 사용 중단하면 되며 운영 복구 작업이 필요 없다.
