# K-Volley Lab Competition V2 공통 렌더링 엔진

## 목적
대회별 페이지를 계속 수정하면서 AVC용, VNL용, 국내대회용 템플릿이 분기되는 문제를 막는다.

V2의 구현 원칙은 단순하다.

**대회별 페이지와 adapter는 UI를 만들지 않는다.**
대회별 코드는 원본 데이터를 KVL 공통 스키마로 변환한다.
Hero, KPI, 월간 달력, 경기일정, 순위, 토너먼트, 참가국, 선수명단, 공식자료의 DOM과 크기·간격·반응형은 공통 shell/controller/component renderer가 만든다.

## Source of Truth
- 공통 진입점: `competition-engine.html?competition=<slug>`
- Config/data 경계: `assets/js/kvl-competition-config-v2.js`
- DATA ONLY 선택 모듈: `assets/js/kvl-competition-modules-v2.js`
- DATA ONLY starter/생성기: `docs/KVL_COMPETITION_PRODUCTION_STARTER_V2.md`
- Validation/reference 시작점: `templates/competition-page-pc-mobile-v2.html`
- 공통 DOM shell: `assets/js/kvl-competition-shell-v2.js`
- 공통 메타/상태/테마 controller: `assets/js/kvl-competition-template-v2.js`
- 공통 component renderer: `assets/js/kvl-competition-components-v2.js`
- 공통 기본 CSS: `assets/css/kvl-competition-template-v2.css`
- 공통 component CSS: `assets/css/kvl-competition-components-v2.css`
- 공통 데이터 예시: `templates/competition-page-v2.example.json`
- 구조 smoke test: `tests/competition-page-v2-structure-engine-smoke.html`

## 역할 분리
### shell
모든 대회에 동일한 Hero / 6개 view / KPI / qualification / calendar / schedule / standings / final / participants / resources slot을 한 번만 만든다.

### controller
기존 V2 controller는 다음을 담당한다.
- view 전환
- gender / competitionFamily 테마
- 대회명·기간·장소·KPI
- upcoming / active / completed 상태
- 기본 공식자료 연결

### component renderer
다음 UI를 모든 대회에 동일한 DOM/class로 렌더링한다.
- qualification cards
- monthly calendar
- schedule day group / match row
- standings
- final ranking
- knockout bracket
- participants
- optional roster

### competition adapter
대회별 adapter는 데이터 normalize만 수행한다.
예: `assets/js/kvl-vnl-men-2026-v2.js`

## 금지
대회별 adapter에서 다음을 만들지 않는다.
- 경기 카드 HTML
- 순위표 HTML
- 토너먼트 HTML
- 참가국 카드 HTML
- 공식자료 카드 HTML
- 해당 대회만을 위한 카드 크기/간격 CSS

대회별 CSS를 새로 만들어 공통 컴포넌트 geometry를 재정의하지 않는다.

## 허용
대회별 adapter는 다음만 수행할 수 있다.
- 공식 원본 JSON/MASTER fetch
- 이름/국가코드/국기/URL mapping
- 원본 stage/round → KVL 표준 stage/round normalize
- 결선 연결관계 `nextMatchId` normalize
- 대회 규정/진출상태/대회명/장소/Hero 등 데이터 제공
- normalize 완료 후
  - `window.KVLCompetitionTemplateV2.apply()`
  - `window.KVLCompetitionComponentsV2.render(normalizedData)`
  호출

## Structure Schema
```json
{
  "structure": {
    "labels": {
      "groupsTab": "예선순위",
      "groupsKpi": "예선 경기",
      "groupsKpiUnit": "경기",
      "knockoutKpi": "파이널 진출",
      "standingsTitle": "예선순위"
    },
    "calendar": true,
    "schedule": {
      "stages": ["전체", "예선", "8강", "준결승", "결승"]
    },
    "standings": {
      "mode": "single-league"
    },
    "knockout": {
      "mode": "bracket-8"
    },
    "participants": {
      "mode": "flat"
    },
    "roster": {
      "mode": "link-only"
    }
  }
}
```

지원 mode:
- standings: `single-league`, `pools-combined`, `none`
- knockout: `bracket-8`, `none`
- participants: `flat`, `groups`
- roster: `full`, `link-only`, `none`

이 mode는 별도 템플릿이 아니다. 동일 공통 컴포넌트의 데이터 표시 방식이다.

## Match Schema
```json
{
  "id": "M1",
  "date": "2026-07-29",
  "time": "16:00",
  "stage": "8강",
  "round": "QF",
  "nextMatchId": "SF1",
  "home": {"name":"대한민국","en":"South Korea","code":"KOR","flag":"..."},
  "away": {},
  "venueLabel": "경기장",
  "score": {
    "home": 3,
    "away": 1,
    "sets": [{"home":25,"away":20}]
  }
}
```

round 표준:
- `QF`
- `SF`
- `BRONZE`
- `FINAL`

## Standing Schema
```json
{
  "rank": 1,
  "team": {"name":"대한민국","en":"South Korea","code":"KOR","flag":"..."},
  "played": 12,
  "wins": 10,
  "losses": 2,
  "points": 29,
  "setRatio": "2.267",
  "pointRatio": "1.108",
  "status": "qualified",
  "statusLabel": "결선 진출"
}
```

status:
- `qualified`
- `host-qualified`
- `out`
- 빈 값

## 변경 전파 원칙
카드 높이, 국기 크기, 일자별 경기 구조, 토너먼트 사다리, 참가국 버튼, 공식자료 버튼을 변경할 때는 공통 shell/controller/component CSS·JS만 수정한다.

대회 adapter는 수정하지 않는다.

즉 한 번 변경하면 V2를 사용하는 AVC / VNL / FIVB / 국내대회에 동일하게 반영되어야 한다.

## VNL 2026 검증
`assets/js/kvl-vnl-men-2026-v2.js`는 UI 생성 코드를 제거하고 데이터 adapter 전용으로 사용한다.

VNL이 공통 엔진에 제공하는 차이는 다음뿐이다.
- `competitionFamily = fivb` → Purple
- standings `single-league`
- knockout `bracket-8`
- participants `flat`
- roster `link-only`

기존 production `vnl.html`은 검증 단계에서 변경하지 않는다.
