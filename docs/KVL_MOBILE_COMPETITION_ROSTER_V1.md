# K-Volley Lab 모바일 대회 선수명단 공통 규격 v1

## 목적
모바일 대회 기본 메뉴는 기존 6개(`한눈에보기 / 경기일정 / 조별순위 / 최종순위 / 참가국(참가팀) / 공식자료`)를 유지한다. `선수명단`은 7번째 메뉴로 추가하지 않고 `참가국/참가팀` 안의 하위 정보로 제공한다.

## 기본 UX
- `참가국/참가팀` 화면은 국가·팀별 카드 목록을 표시한다.
- 국가·팀 카드를 누르면 해당 대회의 등록 선수명단이 같은 카드 아래에서 열린다.
- 동시에 여러 국가를 열지 않고 한 국가만 펼친다.
- `한눈에보기`에는 `선수명단 보기` 바로가기를 제공한다.
- 현재 AVC 남자 대륙선수권은 바로가기에서 대한민국 카드를 바로 펼칠 수 있다.
- 신규 공통 템플릿에서는 바로가기가 `participants` 화면으로 이동한다.

## 국가/팀 카드
- 국기 / 한글 국가명 / 영문 국가명 / 조 / 등록 인원 / 펼침 표시를 사용한다.
- 선수명단이 연결된 모바일 화면에서는 1열 카드 구조를 사용한다.
- 국가별 실제 등록 인원 수를 표시하며 14명으로 임의 고정하지 않는다.
- 남녀·대회별 색상은 개별 roster CSS로 만들지 않고 대회 테마 변수를 따른다.

## 선수 행
모바일에서 가로 스크롤 없이 다음 정보를 표시한다.
- 등번호
- 공식 선수명
- 한글명
- 생년월일
- 포지션
- 키
- 외부 선수 프로필 액션(연결된 경우)

외부 프로필 액션은 다음 규칙을 사용한다.
- PC: `Volleybox ↗`
- 모바일 390px 기준: `VB↗`
- 모바일은 키 오른쪽 마지막 고정 폭 액션 칸에 표시한다.
- 새 탭으로 열고 `rel="noopener noreferrer"`를 사용한다.
- 실제 Volleybox 프로필 URL이 확인된 선수만 활성화한다.
- 링크가 미확인인 선수는 검색 URL이나 추정 URL을 만들지 않는다.
- 외부 링크는 Volleybox 도메인만 허용하도록 런타임에서 검증한다.

연봉, 연봉 신뢰도, 내부 관찰메모, 스카우팅 코멘트, 검수 메모 등 비공개 운영정보는 노출하지 않는다.

## Source of Truth
- 원장 데이터는 대회별 Google Drive 선수명단 MASTER를 우선한다.
- 홈페이지용 roster JSON에는 공개에 필요한 기본 필드만 복제한다.
- Volleybox 연결도 MASTER에 저장된 실제 프로필 URL을 우선한다.
- 공통 UI: `assets/js/kvl-competition-roster-v1.js`
- 공통 CSS: `assets/css/kvl-competition-roster-v1.css`
- 대회별 데이터는 `data/competitions/` 아래에 둔다.

## 기본 템플릿 연결 방법
신규 대회는 `templates/competition-page-v1.html`에서 시작한다.

대회 설정 JSON에서:
- `features.participants=true`
- `features.participantRosters=true`
- `data.rosters`에 roster JSON 경로를 문자열 1개 또는 배열로 지정한다.
- 외부 프로필 링크를 roster 본문과 분리해 관리할 때는 `data.rosterLinks`에 링크 맵 JSON을 지정할 수 있다.

예시:
```json
"features": {
  "participants": true,
  "participantRosters": true
},
"data": {
  "rosters": [
    "data/competitions/example-rosters-a.json",
    "data/competitions/example-rosters-b.json",
    "data/competitions/example-rosters-c.json"
  ],
  "rosterLinks": "data/competitions/example-roster-links.json"
}
```

`rosters`는 독립 section/nav key가 아니다. 공통 템플릿의 top-level section은 `overview / schedule / groups / finalRanking / participants / resources` 6개만 사용한다.

## roster JSON 기본 구조
현재 AVC 남자부와 동일하게 그룹 파일 안에 `teams` 배열을 둔다. 각 팀은 최소한 다음 값을 가진다.
- `name`, `en`, `code`, `group`, `status`, `count`
- `players[]`
- 선수 기본 필드: `number`, `officialName`, `fullName`, `koreanName`, `position`, `birthDate`, `heightCm`
- 필요하면 선수 객체에 `volleyboxUrl`을 직접 둘 수도 있다.

별도 `rosterLinks` 파일을 사용할 때는 국가/팀 `code`와 등번호를 키로 실제 프로필 URL을 연결한다. 선수 객체의 `volleyboxUrl`이 있으면 그 값을 우선한다.

선수는 화면에서 등번호 오름차순으로 자동 정렬한다.

## 현재 적용 기준
`AVC 남자 대륙선수권 2026`부터 적용한다. 이후 국제대회·국내대회도 동일한 `참가국(참가팀) → 선수명단` 정보구조를 기본으로 한다.