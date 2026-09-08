# K-Volley Lab 모바일 대회 페이지 기본 템플릿 v5

## 목적
K-Volley Lab 모바일 대회페이지는 **대회명·일정·장소·참가팀·경기결과·규정·공개 선수명단 데이터만 바꾸고 화면 양식은 바꾸지 않는 것**을 기본 원칙으로 한다.

v5는 여자부 기준으로 확정한 390px 공통 규격을 모든 대회에 적용한다. 실제 여자부/남자부 페이지는 회귀검수 대상이며 Source of Truth가 아니다.

## Source of Truth
- 규격 문서: `docs/KVL_MOBILE_COMPETITION_TEMPLATE_V5.md`
- 신규 HTML 시작점: `templates/competition-page-v1.html`
- 공통 대회 UI: `assets/css/kvl-competition-template-v1.css`
- 모바일 세부 UI: `assets/css/kvl-mobile-competition-template-v3.css`
- 예선 종합순위 고정 좌표 UI: `assets/css/kvl-mobile-combined-ranking-v1.css`
- 참가국/선수명단 UI: `assets/css/kvl-participant-roster-v1.css`
- 공통 렌더러: `assets/js/kvl-competition-template-v1.js`
- 참가국/선수명단 렌더러: `assets/js/kvl-participant-roster-v1.js`
- 데이터 예시: `data/competitions/_template/competition-v1.template.json`

## 1. 검수 기준
- 우선 기준폭: **390px**.
- 360px까지 보조 확인.
- 모바일 규칙은 `max-width:680px` 안에서 처리.
- PC 레이아웃은 유지.
- 특별한 표를 제외하고 가로 스크롤 금지.
- 남녀 차이는 테마색과 대회 데이터에만 둔다.
- 같은 컴포넌트의 글씨·카드·국기·간격·위치가 다르면 개별 페이지가 아니라 공통 CSS/renderer를 수정한다.

## 2. 메인 대회 제목 카드
- Hero padding `24px 18px`, radius `20px`.
- 대회 제목 `24px`, 영문 부제 `12px`.
- 날짜 / 장소 / 경기장은 필요 시 각각 1줄, 최대 3줄.
- 모바일 상태뱃지는 주요 상태 1개만 표시하며 마지막 장소/경기장 줄 우측에 둔다.

## 3. 상단 메뉴 — 6개 고정
- 메뉴는 항상 **6개 = 3 + 3** 구조를 기본으로 한다.
- 순서: `한눈에보기 | 경기일정 | 조별순위 | 최종순위 | 참가국(또는 참가팀) | 공식자료`.
- gap `6px`, padding `6px`, radius `14px`.
- 메뉴 높이 `42px`, 글씨 `13px`.
- **선수명단은 7번째 상단 메뉴로 추가하지 않는다.**
- 선수명단은 `참가국/참가팀`에 종속된 정보로 처리한다.

## 4. 대회 한눈에 보기
- KPI 2열, gap `8px`.
- KPI 최소높이 `92px`, padding `13px 12px`, radius `14px`.
- 주요 숫자 `29px`.
- 장소카드는 KPI 아래 전체폭.
- 장소카드는 `장소` 라벨 아래 국가 + 도시 + 경기장 전체명을 한 줄로 표시한다.
- 국가+도시 `16px / 900`, 경기장명 `12px / 800`.
- 선수명단이 연결된 대회는 KPI 아래 **선수명단 바로가기**를 둔다.
- 바로가기는 별도 상단 메뉴를 만들지 않고 `참가국/참가팀` 화면으로 이동한다.

## 5. 월간 달력
- 7열 전체 월 표시.
- 월 제목 `15px`, 요일 `10px`, 날짜 `10px`.
- 셀 최소높이 `58px`.
- 경기수 `8px`, 경기시간 `8px`.

## 6. 경기일정
- 경기시간 `13px`.
- 경기카드 padding `12px 10px`.
- 중앙 스코어 열 `46px`, 좌우 gap `8px`.
- 팀명 `18px`, 세트스코어 `18px`, 세트별 스코어 `10px`.
- 국기 `34×24px`.
- 왼쪽 `국기 → 국가명`, 오른쪽 `국가명 → 국기`.
- 모든 경기시간은 기준시간대를 개별 경기에도 표시한다.
- AVC 여자부: `HH:MM KST` + 중국 현지시간.
- AVC 남자부(일본): `HH:MM KST` + JST 동일 시각.

## 7. 조별순위
- 조 카드 radius `17px`.
- 팀 행 높이 `54px`.
- 행 grid `24px / 28px / 국가명 / 통계`.
- 순위 `12px`, 국기 `27×19px`, 국가명 `13px`, 보조 `10px`, 통계 `10px`.

## 8. 예선 종합순위
- 제목 `16px`, 상태설명 `9px`, 헤더 `11px`.
- 행 `54px`.
- 종합순위 `14px`, 국가명 `14px`, 세부통계 `12px`, 결과표시 `11px`, 국기 `28×19px`.
- 데이터 행의 국기는 진행 중/완료 여부와 관계없이 항상 표시한다.
- 헤더에서는 `국기`라는 별도 글자를 표시하지 않는다.
- `국가` 헤더는 국기+국가명 두 열 전체에 걸쳐 가운데 정렬한다.
- 진행 중: `종합순위 / 국가 / 조순위 / 승리 경기수 / 승점 / 세트 득실률 / 득점 득실률`.
- 완료 후: `종합순위 / 국가 / 결과 / 승리 경기수 / 승점 / 세트 득실률 / 득점 득실률 / 조순위`.
- `종합순위 + 국기 + 국가명`은 고정 **194px identity block**으로 렌더링한다.
- 내부 규격 `44px / 28px / 110px`, gap `6px`.
- 상태에 따라 identity block의 좌표·폭·정렬을 바꾸지 않는다.

## 9. 최종순위 / 결선 토너먼트
### 확정 경기
- 라운드 제목 `13px`.
- 경기 헤더 `9px`, 경기 ID `10px`.
- 팀명 `18px`, 스코어 `18px`, 국기 `32×23px`.
- 한 카드에서 좌우 두 팀을 대칭 배치한다.

### QF 예상대진
- `현재 예상/확정`을 위, `예선 종합 n위`를 아래에 둔다.
- 왼쪽 `국기 + 국가명 | 상태/시드`, 오른쪽 `상태/시드 | 국가명 + 국기`.
- 가운데 `VS`.
- 국가명 `14px`, 국기 `34×24px`, 상태 `9px`, 시드 `9.5px`, VS `10px`.
- 미확정 준결승/결승 슬롯의 국기는 추정하지 않는다.

## 10. 참가국 / 참가팀 + 선수명단 허브
- 참가국 기본 카드는 2열, gap `7px`, 최소높이 `68px`, padding `9px 8px`, radius `15px`.
- 국기 `35×24px`, 한글명 `12px`, 영문명 `9px`.
- 우측 메타에 `조 · 등록인원`과 `선수명단 보기`를 표시한다.
- 국가/팀 카드는 클릭 가능한 버튼으로 제공한다.
- 클릭 시 별도 페이지 이동보다 **동일 화면의 roster dialog/sheet**를 기본으로 한다.
- roster dialog 상단에는 국기, 국가명, 영문명, 조, 등록 인원, 검수상태를 표시한다.
- 선수 행은 **등번호 오름차순**으로 표시한다.
- 공개 선수 행 기본값: `등번호 | 영문/공식 선수명 | 한글명 · 키 · 생년월일 | 포지션 | Volleybox`.
- Volleybox가 공식적으로 연결되지 않은 선수는 링크를 비워두며 임의 연결하지 않는다.
- 참가 인원은 14명으로 고정하지 않는다. 대회 실제 등록/검수 인원을 그대로 표시한다.
- 예: 바레인 13명, 카타르 REGISTERED 12처럼 MASTER 상태를 보존한다.

### 로스터 데이터 구조
- 대회 roster index schema: `kvl-rosters-v1`.
- 국가별 roster schema: `kvl-team-roster-v1`.
- index는 팀명/조/등록인원/검수상태/`rosterSrc`만 우선 로드한다.
- 국가를 클릭할 때 해당 `rosterSrc`만 lazy-load하는 것을 기본으로 한다.
- 기본 공개 필드: `number`, `name`, `fullName`, `nameKo`, `position`, `birthDate`, `heightCm`, `volleyboxUrl`.
- 대회 설정에서는 `features.participantRosters=true`와 `data.rosters=<roster index>`를 사용한다.
- `rosters`는 section/nav key가 아니다.

### 공개 금지 필드
- 연봉 추정, 연봉 신뢰도, 내부 관찰메모, 스카우팅 코멘트, 내부 상태/평가 등 비공개 분석 필드는 공개 roster JSON에 넣지 않는다.
- 공개 GitHub에는 공식/공개 선수 프로필에 필요한 항목만 저장한다.

## 11. 공식자료
- 1열, gap `7px`, 최소높이 `48px`, padding `10px`, radius `14px`.
- 자료명 `11px`, 링크 `10px`, pill 버튼.

## 12. 개발 원칙
- 실제 대회 HTML에 공통 모바일 숫자값을 새로 추가하지 않는다.
- 신규 대회는 `templates/competition-page-v1.html`에서 시작한다.
- 데이터/규정 차이는 renderer/data에서 처리하고 시각 규격은 공통 CSS에서 처리한다.
- 참가국/선수명단 기능은 `kvl-participant-roster-v1.*`을 재사용한다.
- 개별 대회는 roster index와 팀별 JSON만 교체한다.
- 대회별 로스터는 한 파일에 전부 넣기보다 index + 팀별 파일 분리를 권장한다.

## 회귀검수 대상
- `international-competition-avc-women-continental-2026.html`
- `international-competition-avc-men-continental-2026.html`

## 버전 이력
- v4 / 2026-09-07: 여자부 완성형 수치를 공통 컴포넌트 기준으로 승격.
- v5 / 2026-09-08: Hero 상태뱃지, 장소 한 줄, 경기별 시간대, 예선종합순위, QF 예상대진 공통 규칙 확정.
- v5 보완1: 예선 종합순위 `국가` 헤더를 국기+국가명 중앙으로 통합.
- v5 보완2: `종합순위+국기+국가명` 194px 고정 identity block 확정.
- v5 보완3: 종합순위 헤더 11px, 순위·국가명 14px, 통계 12px, 결과 11px 공통화.
- **v5 보완4 / 2026-09-08:** 상단 메뉴를 6개로 고정하고 `참가국/참가팀 → 국가 클릭 → 선수명단`을 공통 모바일 표준으로 확정. 한눈에보기에는 선수명단 바로가기를 제공하고, roster index + 국가별 lazy-load 구조를 도입.

## Shared combined ranking component v1
- Source: `assets/js/kvl-mobile-combined-ranking-v1.js`.
- Geometry: `assets/css/kvl-mobile-combined-ranking-v1.css` + `assets/css/kvl-mobile-competition-template-v3.css`.
- 남녀/대회별 state가 달라도 글씨, 국기, 행 높이, 첫 identity 좌표는 동일하다.
- 390px 기준 rendered DOM에 `data-kvl-common-component="combined-ranking-v1"`이 존재해야 한다.

## Shared participant roster component v1
- Source: `assets/js/kvl-participant-roster-v1.js`.
- Geometry: `assets/css/kvl-participant-roster-v1.css`.
- top-level nav를 늘리지 않고 participants 내부를 roster hub로 만든다.
- 선수명단은 팀 클릭 시 lazy-load하며, 공개 MASTER 필드만 출력한다.
