# 제107회 전국체육대회 배구 — K-Volley Lab 프로토타입 기록

- 작업일: 2026-10-17 KST
- 목적: 종합대회 배구 5개 세부종별의 국내대회 V2 프로토타입 구성
- 작업 전 `main` 확인 커밋: `9285e5b5e833ccfc89d29da445200785aba3de28`
- 운영기준: Google Drive `KVL_운영원칙_MASTER_v14`, `KVL_COMPETITION_PAGE_TEMPLATE_V2`, `KVL_COMPETITION_HERO_IMAGE_GUIDE_v1`; GitHub `docs/KVL_COMPETITION_THEME_POLICY_V1.md`
- 범위: 새로운 종별 config/data 10개, 종별 선택 허브 HTML 1개, 이 문서. 운영 홈 `index.html`, `competition-engine.html`, 내비게이션·공통 CSS/JS 및 기존 대회 프로덕션 파일 미수정

## 접근 링크

- 종별 선택 허브: `/national-sports-festival-volleyball-2026-prototype.html`
- 상세 엔진: `/competition-engine-prototype.html?competition=national-sports-festival-<division>-2026`
- 종별 slug: `men-u18`, `men-university`, `men-general`, `women-u18`, `women-general`
- `competition-engine-prototype.html`의 `production:false` 및 `noindex` 유지

## 대회 분류 및 자료 출처

**국내대회 / 종합대회 / 시·도 대항 토너먼트 (competitionFamily=domestic, structure.competitionType=knockout)**. 대회 전체기간은 2026-10-16~22, 개최지는 제주특별자치도, 주최는 대한체육회.

| slug | 실제 종별 | 공식 표기 경기일 | 공식 경기장 / 주소 |
| --- | --- | --- | --- |
| men-u18 | 남자18세이하부 | 10.16~10.20 | 신성여자중학교 체육관 / 제주시 아봉로 174-1 |
| men-university | 남자대학부 | 10.16~10.20 | 천지학생체육관(서귀포고) / 서귀포시 중앙로 140 |
| men-general | 남자일반부 | 10.16~10.21 | 천지학생체육관(서귀포고) / 서귀포시 중앙로 140 |
| women-u18 | 여자18세이하부 | 10.16~10.21 | 표선생활체육관 / 서귀포시 표선면 한마음초등로 399 |
| women-general | 여자일반부 | 10.16~10.20 | 표선생활체육관 / 서귀포시 표선면 한마음초등로 399 |

- 대회 공식 개요: https://meet.sports.or.kr/national/event/outline.do
- 공식 종목별 경기장/날짜: https://meet.sports.or.kr/national/event/venue.do
- 토너먼트 대진표: https://meet.sports.or.kr/national/schedule/scheduleTDaejin.do (종목 '배구' 및 종별을 UI에서 선택)
- 종목별 경기일정/결과: https://meet.sports.or.kr/national/schedule/scheduleClass.do

**주의:** 전국체전 대회 전체 기간과 배구 종별 경기일을 혼동하지 않는다. 경기장과 일정은 변경될 수 있으므로 공식 정정 공지를 우선한다.

## 공통 엔진 계약

1. 신규 대회별 HTML/CSS/JS를 복사하거나 직접 렌더링하지 않는다. 각 종별 `config.json`/`data.json`은 공통 `competition-engine-prototype.html`에서 로드한다.
2. 남자부 = 국내대회 Navy (#163A5F); 여자부 = Rose (#8E315E). 레이아웃과 텍스트 계층은 공통 V2.
3. 대회 형식은 `structure.competitionType=knockout`으로 명시했다. 현재 공통 renderer는 불특정 참가수의 16강/1회전/부전승 완전한 전수 토너먼트를 지원한다고 보장하지 않는다. 공식 대진 경기별 자료 정규화 전에는 `structure.knockout.mode=none`과 명확한 대기 문구를 사용해 임의의 8강·3위 결정전 대진을 만들지 않는다. 이것은 대회가 리그이거나 토너먼트가 없다는 뜻이 아니다. 정식 도입에는 공통 토너먼트 그래프/선수별 링크 확장과 회귀검수가 필요하다.
4. `standings.mode=none`은 실제 조별리그가 없으므로 사실에 맞고, `participants.mode=flat`은 인위적인 A/B조를 만들지 않는다. 선수명단은 공식 등록자료 확보 전 `roster.mode=none`, 임의의 학교 로스터 링크도 제공하지 않는다.
5. `matches=[]`, `participants=[]`, `finalRanking=[]`은 **확정 경기 또는 참가팀이 0개라는 뜻이 아니라 미연결/미검수 상태**다. 미확인 수치는 미정으로 표시한다. 허구의 경기시간, 세트점수, 국가대표/지역대표 명단은 생성하지 않았다.
6. 종별 선택 허브는 대회 묶음의 선택 화면일 뿐, 경쟁대회 상세 엔진을 복제한 또 하나의 전용 템플릿이 아니다. 공식 경기는 기존 경기일정/최종순위/참가 시·도/공식자료 view를 이용한다.
7. 한쪽 성별에 대응하는 동일 종별이 없는 남자대학부는 다른 여대부를 생성하지 않는다. 남녀 버튼은 대응 관계가 확인된 18세 이하부와 일반부 사이에만 연결한다.

## 검수 및 남은 작업

- GitHub API main readback: 허브 1개, 신규 종별 5 `config.json`·5 `data.json` 읽기 및 JSON 파싱 PASS, 모든 family=domestic/성별/자료 출처/날짜/경기장 검증.
- 데이터 무결성: `matches` / `participants` / `finalRanking` 빈 배열이며 확인되지 않은 결과 0건 작성 PASS.
- 허브 버튼: 코드는 `aria-pressed` 상태 변경, 5종별 필터 및 `?division=` 직접 링크·뒤로가기를 지원함; 실제 브라우저 직접 클릭 검수는 별도 필요.
- HTTP/Pages·PC 1180px / 모바일 390px·360px **실브라우저 시각 검수는 현재 실행 도구에서 수행하지 못했으므로 미검증으로 명시**. GitHub API 파일 존재와 성공된 Pages HTTP/실기기 검수는 별개이다.
- 보류: 대한체육회 종별 참가 시·도 명단, 토너먼트 매치 ID/대진 순서, 부전승, 시간·경기장별 일정 및 세트 득점 공식 원문 전수확인 후 data.json 반영. 종별별 실제 상위 단계 / 공동3위 판정 / 시·도 대표팀별 명단 및 팀 링크도 공식 근거 확보 후.
- 실제 Homepage 또는 `domestic-competitions.html` 목록 노출, production URL 전환은 승인 후 별도 진행한다.
