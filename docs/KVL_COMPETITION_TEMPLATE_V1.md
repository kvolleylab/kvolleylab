# K-Volley Lab Competition Template v1

## 적용 원칙

- 이 템플릿은 **다음에 새로 만드는 대회 페이지부터 기본값으로 사용**한다.
- 이미 운영 중인 단양·고성·중고·AVC·VNL 페이지를 일괄 변환하지 않는다.
- 기존 페이지는 필요한 수정이 생길 때만 점진적으로 공통 요소를 옮긴다.
- 공통 UI 수정은 페이지별 HTML에 반복해서 넣지 않고 `kvl-competition-template-v1.css` 또는 `kvl-competition-template-v1.js`에 반영한다.
- 대회 고유 규칙은 공통 템플릿에 억지로 넣지 않고 개별 runtime/data로 분리한다.

## 파일 구조

```text
assets/
  css/
    kvl-competition-standard.css        # 기존 페이지와 공유되는 최소 공통 규칙
    kvl-competition-template-v1.css     # 신규 대회 페이지 공통 UI
  js/
    kvl-competition-template-v1.js      # 신규 대회 페이지 공통 렌더러
    <competition>-runtime.js             # 필요한 경우에만 대회 전용 기능

templates/
  competition-page-v1.html              # 신규 대회 HTML 시작점

data/
  competitions/
    _template/
      competition-v1.template.json      # 신규 대회 설정/데이터 구조 예시
    <competition>.json                   # 대회 기본 설정
    <competition>-schedule.json          # 일정/결과
    <competition>-groups.json            # 조별순위
    <competition>-final-ranking.json     # 최종순위/결선
    <competition>-participants.json      # 참가팀/국가/학교
    <competition>-rosters.json           # 선수명단
```

## 공통 메뉴 기본 순서

1. 한눈에 보기
2. 경기일정
3. 조별순위
4. 최종순위
5. 참가팀/참가국/참가대학/참가학교
6. 선수명단
7. 공식자료

대회에 존재하지 않는 기능은 `features`에서 `false`로 숨긴다.

## 공통 UI 기준

- 제목 앞 KVL 대회 로고
- 대회명 / 기간 / 개최지 / 경기장 / 상태
- 한눈에 보기 KPI는 **숫자와 단위를 같은 줄**에 표시
- 카드 hover는 금색 테두리 + 연한 금색 배경
- 토너먼트가 있는 경우 `최종순위` 안에 포함
- 모바일은 동일 정보 구조를 유지하면서 1열/가로 스크롤로 변환
- 국제대회 참가 단위는 `참가국`, 대학은 `참가대학`, 중고는 `참가학교`
- 여자부 기본 색상은 KVL Soft Rose (`#D2648F`, `#A43F68`, `#FFF8FB`, `#EDBED0`)
- 공식/대회 데이터와 외부 프로필 값이 다를 경우 공식 대회 값을 우선 표시

## 새 대회 생성 순서

1. GitHub 최신 `main` SHA 확인
2. Google Drive 대회 폴더/MASTER 위치 확인
3. `templates/competition-page-v1.html`을 새 페이지로 복사
4. `competition-v1.template.json`을 새 대회 데이터로 복사
5. `competitionId`, 대회명, 날짜, 장소, 성별, 유형, 기능을 설정
6. 공통 기능은 템플릿에서 사용
7. 대회 전용 규정/자동 계산만 별도 runtime으로 추가
8. 공식 출처 검수 후 Drive MASTER와 홈페이지 데이터를 동기화
9. PC/모바일 화면 검수

## 금지 원칙

- 같은 공통 CSS를 각 HTML에 다시 복사하지 않는다.
- 공통 메뉴 순서를 대회마다 임의로 변경하지 않는다.
- 대회별 차이를 맞추기 위해 공통 템플릿 자체를 무리하게 변형하지 않는다.
- 기존 대회를 새 템플릿으로 일괄 이전하지 않는다.

## 확장 방식

공통 템플릿에서 반복 수정이 발생하는 항목은 v1에 흡수한다. 반대로 한 대회에서만 필요한 기능은 해당 대회 runtime에 둔다. 반복 빈도가 높아져 두 개 이상의 대회에서 같은 기능을 사용하게 되면 공통 템플릿으로 승격한다.
