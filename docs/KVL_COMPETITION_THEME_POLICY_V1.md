# K-Volley Lab 대회 색상 테마 정책 v1

## 목적
KVL 국제·국내 대회 페이지에서 성별과 대회 계열이 동시에 존재할 때 어떤 색상을 우선할지 고정한다. 이 규칙은 `KVL_COMPETITION_PAGE_TEMPLATE_V2`의 테마 선택 기준이다.

## 최우선 규칙
**여자부는 대회 종류와 관계없이 항상 KVL Rose를 사용한다.**

따라서 다음은 모두 동일한 Rose 계열이다.
- AVC 여자부
- FIVB 여자부
- 국내 여자부
- 향후 다른 연맹/국제대회의 여자부

FIVB의 Purple, 국내대회의 Navy 같은 대회 분류색은 여자부 Rose를 덮어쓰지 않는다. 여자부 대회별 개성은 Hero 이미지, 모티프, 데이터와 세부 그래픽으로 표현한다.

## 남자부 대회 계열
- AVC 남자부: Green
  - primary `#176638`
  - strong `#0D6F3C`
  - soft `#EEF8F1`
- FIVB 남자부: Purple
  - primary `#5B3A8E`
  - strong `#442A70`
  - soft `#F3EFFA`
- 국내 남자부: Navy
  - primary `#163A5F`
  - strong `#102C49`
  - soft `#EEF4F8`

## 여자부 공통 Rose
- primary `#8E315E`
- strong `#A53D68`
- dark `#6F234A`
- accent `#E7A8C2`
- soft `#FFF1F6`

## 선택 우선순위
1. `gender = women`이면 무조건 Rose.
2. `gender = men`이면 `competitionFamily`을 적용한다.
   - `avc` → Green
   - `fivb` → Purple
   - `domestic` → Navy
3. 남자부에서 아직 분류되지 않은 신규 국제대회는 별도 색상 승격 전까지 AVC Green을 임시 fallback으로 사용하되, production 적용 전 분류를 명시한다.

## 구현 필드
- `data-kvl-gender="men|women"`
- `data-kvl-family="avc|fivb|domestic"`
- 데이터 필드: `competitionFamily`

JS가 데이터의 `gender`와 `competitionFamily`을 body dataset으로 반영하고, CSS가 위 우선순위에 따라 테마 변수를 결정한다.

## 공통 예외
- 경기 스코어는 테마색과 무관하게 `#4B5563`.
- Gold는 우승, 메달, 올림픽 직행, 특별 자격 등 의미가 있는 성취에만 사용한다.
- 성별/대회 분류가 달라도 화면 구조, 카드 크기, 정보 순서, 반응형 규격은 바꾸지 않는다.

## 검수
`tests/competition-page-v2-theme-smoke.html`에서 MEN AVC / MEN FIVB / MEN DOMESTIC / WOMEN AVC / WOMEN FIVB / WOMEN DOMESTIC 조합을 확인한다. 여자부 3개 조합은 모두 Rose여야 한다.
