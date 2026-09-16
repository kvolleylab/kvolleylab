# K-Volley Lab 국제대회 페이지 기본 템플릿 v2

## 목적
2026 AVC 남자·여자 대륙선수권 프로토타입을 PC 1180px, 모바일 390px/360px에서 교차 검수한 결과를 K-Volley Lab 국제대회 공통 기준으로 승격한다.

V2는 특정 실제 대회 페이지를 복제하는 방식이 아니라 **공통 구조 + 성별/대회계열 테마 + 대회 데이터 + 대회 상태(upcoming/active/completed)** 를 분리한 재사용 기준이다. V1은 역사적 동결 스냅샷으로 보존하고 신규 대회는 V2를 우선한다.

2026-09-15 사용자 육안검수로 PC 1180px, 모바일 390px/360px 기준에서 문제가 없음을 확인했으며 V2를 기본 동결 기준본으로 사용한다.

## Source of Truth
- HTML: `templates/competition-page-pc-mobile-v2.html`
- 공통 CSS: `assets/css/kvl-competition-template-v2.css`
- 공통 JS: `assets/js/kvl-competition-template-v2.js`
- 데이터 예시: `templates/competition-page-v2.example.json`
- manifest: `templates/competition-page-pc-mobile-v2.manifest.json`
- 테마 정책: `docs/KVL_COMPETITION_THEME_POLICY_V1.md`
- 상태 재사용 smoke test: `tests/competition-page-v2-reuse-smoke.html`
- 테마 smoke test: `tests/competition-page-v2-theme-smoke.html`
- Hero 자산 규칙: Drive `KVL_COMPETITION_HERO_IMAGE_GUIDE_v1`

## 공통 구조
1. Hero
2. 6개 메뉴: `overview / schedule / groups / knockout / rosters / resources`
3. 성별 전환
4. 대회 한눈에 보기 KPI
5. 대회의 의미 · 국제 진출권
6. 월간 일정
7. 경기일정
8. 조별순위 + 예선 종합순위
9. 최종 1~4위 + 결선 토너먼트
10. 참가국 + 등록 선수명단
11. 공식자료

## 공통 상호작용
- 메뉴 활성화는 대회 데이터 fetch와 분리하고 `?view=`만으로 먼저 동작한다.
- 한눈에 보기 KPI 4개는 마우스·키보드 이동을 지원한다.
  - 참가국 → `?view=rosters&team=KOR`
  - 조 편성 → `?view=groups`
  - 전체 일정 → `?view=schedule`
  - 결선 진출 → `?view=knockout`
- PC hover/focus는 카드가 약간 상승하고 테마색 테두리·배경·아이콘·핵심값으로 클릭 가능성을 표현한다.
- `참가국 보기 →` 별도 CTA는 KPI와 기능이 중복되므로 기본 템플릿에서 제거한다.
- MEN/WOMEN 전환은 동일 단계끼리 연결하며 prototype 검수 중 production으로 빠지지 않는다.

## PC / 모바일 규격
### PC
- 콘텐츠 최대폭 1180px.
- 스코어 기본색 `#4B5563`.
- Gold는 우승·메달·올림픽 직행 등 특수 성취에만 사용한다.
- 최종 1~4위 카드는 국기·국가명·결과 영역 기준선을 통일한다.

### 모바일
- 390px 우선, 360px 보조, breakpoint max-width 680px.
- 6개 메뉴는 3+3.
- 특별한 데이터표 외 가로 스크롤 금지.
- 공식자료는 1열이며 긴 제목은 최대 2줄까지 보여 핵심 내용이 잘리지 않게 한다.
- 최종 1~4위는 4카드 1행을 유지할 수 있으며, 확정된 후속대회 진출 문구는 작은 2줄 보조문구로 표시한다.
- 예선 종합순위의 `조별리그 탈락`은 바깥 결과 셀 전체 배경을 칠하지 않고 작은 탈락 뱃지만 사용한다.

## 테마 우선순위
구조·크기·간격은 모든 분류에서 공통이며 색상만 변수로 분리한다. 상세 기준은 `KVL_COMPETITION_THEME_POLICY_V1`을 따른다.

### WOMEN · 최우선 Rose
여자부는 대회 종류와 관계없이 항상 Rose를 사용한다. `competitionFamily`보다 `gender=women`이 우선한다.
- AVC 여자부 → Rose
- FIVB 여자부 → Rose
- 국내 여자부 → Rose
- primary `#8E315E`
- strong `#A53D68`
- dark `#6F234A`
- accent `#E7A8C2`
- soft `#FFF1F6`

### MEN · 대회계열별 색상
- AVC → Green: primary `#176638` / strong `#0D6F3C` / soft `#EEF8F1`
- FIVB → Purple: primary `#5B3A8E` / strong `#442A70` / soft `#F3EFFA`
- 국내대회 → Navy: primary `#163A5F` / strong `#102C49` / soft `#EEF4F8`

### 구현
- 성별: `data-kvl-gender="men|women"`, 데이터 `gender`
- 대회계열: `data-kvl-family="avc|fivb|domestic"`, 데이터 `competitionFamily`
- 미분류 남자부는 production 적용 전 계열을 확정한다. 임시 fallback은 AVC Green.
- 여자부가 남자부 selector를 재사용하기 위한 `data-avc-gender="men"` 같은 우회 속성에는 의존하지 않는다.

## 대회의 의미 · 국제 진출권
- 진출권 규칙은 `qualification[]` 데이터로 관리한다.
- LA28, World Cup, 랭킹 등 카드 레이아웃은 공통이다.
- `대회 결과` 행은 **설명 아래, 카드 foot 위**에 둔다.
- LA28 카드도 World Cup 카드와 동일한 위치에 `대회 결과`를 둔다.
- 진행 중에는 이미 공식 확정된 팀만 표시한다.
- 미확정 팀을 순위·예상으로 채우지 않는다.
- 종료 후에는 공식 확정 팀을 모두 표시한다.
- 결과가 없으면 `대회 결과` 행 자체를 숨긴다.

## 대회 상태 모델
대회 상태는 `upcoming / active / completed` 3단계로 관리하고 세부 단계는 별도 `stageLabel`로 둔다.

### UPCOMING · 대회 시작 전
- Hero 상태 `대회 시작 전`.
- Hero 보조 상태는 공식 확인된 정보만 사용한다. 예: `일정 발표`, `조편성 확정`, `선수명단 공개`.
- KPI는 공식 확정값만 표시한다. 미확정 값은 `미정` 또는 `확정 전`이며 임의로 0을 넣지 않는다.
- 일정이 발표되면 일정/달력을 보여주되 결과를 만들지 않는다.
- 조편성이 발표되면 조 구성은 표시할 수 있으나 경기 전 예선 종합순위의 임의 순서를 만들지 않는다.
- 결선 대진이 규정상 계산 가능해도 seed 확정 전에는 `예상`임을 명시한다.
- 최종순위·우승·진출팀 결과를 만들지 않는다.
- 국제 진출권 카드는 규칙만 보여주고 `대회 결과` 행은 숨긴다.

### ACTIVE · 대회 진행 중
- Hero 상태 `대회 진행 중`; `stageLabel`로 현재 단계 표시.
- 일정은 종료/예정 상태를 함께 보여준다.
- 조별순위와 예선 종합순위는 현재 공식 결과 기준으로 자동계산/반영한다.
- 우승 확정 전 한눈에 보기 우측 안내 기본값은 `조별리그 결과에 따라 예상 8강 대진이 자동 반영됩니다.`이다. 조별리그 이후에는 단계별 안내로 교체할 수 있다.
- 결선 대진은 `예상`과 `확정`을 구분한다.
- 최종 1~4위는 확정된 자리만 표시하고 나머지를 추정하지 않는다.
- 국제 진출권 `대회 결과`는 이미 공식 확정된 팀만 표시한다.

### COMPLETED · 대회 종료
- Hero 상태 `대회 종료`.
- 한눈에 보기 우측의 진행 안내를 제거하고 `우승 [국가]` + 확정된 특수 성취로 교체한다.
- 결과 묶음 왼쪽 3px 세로선은 PC/모바일 모두 유지하며 현재 테마색을 사용한다.
- `LA28 올림픽 직행` 같은 특수 성취는 Gold.
- 일정·조별순위·예선 종합순위·최종순위·토너먼트는 최종 공식 결과로 고정하고 예측/예상 문구를 제거한다.
- 국제 진출권 `대회 결과`에는 공식 확정팀 전체를 표시한다.
- 참가국/선수명단은 **그 대회 당시 등록 로스터 Snapshot**을 유지한다.

## 한눈에 보기 결과 영역
- upcoming: 결과 영역 숨김 또는 시작 전 상태문구만 사용.
- active: 우승 결과를 만들지 않고 단계별 안내 표시.
- completed: `우승 [국가]` + 특수 성취 표시.
- 3px 세로선은 실제 결과가 있을 때 사용한다.
- 색상은 여자부 Rose / 남자부 AVC Green · FIVB Purple · 국내 Navy이며 특수 성취만 Gold.

## 조별순위 / 예선 종합순위
- 승리 경기수, 승점, 세트 득실률, 득점 득실률을 대회 규정에 따라 계산한다.
- 국기 열 유지.
- 진출팀은 진출 상태, 탈락팀은 작은 `조별리그 탈락` 뱃지.
- 탈락 결과 셀 전체에 별도 회색 배경을 두지 않는다.

## 최종순위 / 결선
- PC/모바일 모두 1~4위 카드 정보계층을 동일하게 유지한다.
- 후속대회 진출 문구는 데이터 기반으로 각 카드에 부착하며 `상위 3팀`을 모든 대회에 하드코딩하지 않는다.
- 모바일 진출 문구는 최대 2줄 보조텍스트.
- 진출 자격이 없으면 문구를 만들지 않는다.
- 토너먼트 스코어는 중립색, 승자·진출 상태만 테마색/배지로 강조한다.

## 참가국 / 선수명단
- 참가국 선택상태는 테마색의 전체 outline으로 표시한다.
- roster가 없으면 `미착수/확인 중` 상태를 표시하고 선수를 추정 생성하지 않는다.
- 선수는 Player ID 기준 연결, 한국어 이름 우선·영문명 보조.
- 향후 회원별 선수 체크용 action slot을 보존한다.
- 개인 체크/관찰메모는 공개 GitHub/JSON에 저장하지 않는다.

## 공식자료
- 공식 출처만 연결한다.
- 실제 존재하는 링크 수를 그대로 표시하며 남녀 카드 수를 억지로 맞추지 않는다.
- PC 2열, 모바일 1열.
- 모바일 제목 최대 2줄, 버튼은 우측 `공식페이지 →`.
- 긴 제목 때문에 가로 overflow가 생기면 안 된다.

## Hero
- `KVL_COMPETITION_HERO_IMAGE_GUIDE_v1` 준수.
- 대회별 PC/MOBILE 독립 자산.
- 구조/텍스트 위치는 공통, 이미지와 테마만 교체.
- 공식 로고/실제 선수 등 권리 불명확 자산은 사용하지 않는다.

## 데이터 분리
### 공통 템플릿
- 구조, 레이아웃, 반응형, 상호작용
- 상태 전환 규칙
- theme variables
- Player ID/action slot
- qualification result slot

### 대회 데이터
- 대회명, 공식명, 기간, 장소
- 참가국 수, 조 수, 경기 수
- 팀/조/경기/세트 결과
- `gender`, `competitionFamily`
- `status`, `stageLabel`
- qualification 규칙과 공식 확정 결과
- 우승/최종순위
- 공식자료 URL
- roster 연결상태

### 테마 데이터
- 여자부는 공통 Rose 우선
- 남자부는 AVC/FIVB/국내 계열별 토큰
- Hero PC/MOBILE 이미지
- hover/focus 강조색

### 공통 템플릿에 넣지 않는다
- 실제 대회 고유 국가명·팀수·경기수
- AVC/FIVB 특정 대회 URL
- 특정 대회 fallback/guard 등 임시 복구코드
- pseudo-element에 하드코딩한 우승팀/진출팀

## 신규 대회 적용 순서
1. V2 HTML/데이터 예시 복제
2. competition ID·메타 입력
3. `gender` + `competitionFamily` 입력
4. `status`·`stageLabel` 입력
5. Hero PC/MOBILE 연결
6. 참가국/조편성/일정 연결
7. qualification 규칙 연결
8. roster/Player ID 연결
9. 공식자료 연결
10. PC 1180 검수
11. 모바일 390/360 검수
12. upcoming/active/completed 각각 smoke test
13. theme smoke test로 성별/대회계열 색상 확인
14. production 배포

## 승격·동결 근거
- 남자부 프로토타입: PC + 모바일 검수 완료.
- 여자부 프로토타입: PC + 모바일 검수 완료.
- 공통 확인: 6-view 구조, KPI 이동, Hero, 진출권 결과행, 조별/종합순위, 최종 1~4위, 참가국, 공식자료, 모바일 반응형.
- 2026-09-15 사용자 육안검수: PC 1180 + 모바일 390/360 기준 문제 없음 확인.
- 테마 우선순위: 여자부 전체 Rose, 남자부 AVC Green / FIVB Purple / 국내 Navy로 확정.
- V2는 남녀부에서 공통 검증된 요소만 승격하며 특정 대회 임시 복구코드는 제외한다.


## 2026-09-16 rebuild validation notice

Current status: **REBUILD_VALIDATION_ONLY_BASELINE_CONFLICT_OPEN**. See `docs/KVL_COMPETITION_REBUILD_AUDIT_V2.md`. Production men and women have measured geometry differences. The extracted common geometry is provisionally the male production baseline, with palette-only themes; this is not a claim of exact reproduction of both source pages. The shared engine adds the missing roster and focus sections, corrects VNL validation to 108+8 matches using the canonical MASTER IDs, and provides `validation-competition-v2-rebuild.html` for 1180/390/360 comparisons. Production promotion remains prohibited until explicitly requested.
