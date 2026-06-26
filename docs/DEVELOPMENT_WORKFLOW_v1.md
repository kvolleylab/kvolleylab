# K-Volley Lab Development Workflow v1

문서 코드: KVL-STD-001-WORKFLOW

이 문서는 K-Volley Lab의 개발 순서와 작업 기준을 정리한다.

## 1. 현재 개발 원칙

K-Volley Lab은 기능을 먼저 계속 추가하기보다, 데이터와 폴더 구조를 먼저 안정화한 뒤 기능을 확장한다.

우선순위는 다음과 같다.

```text
1. 폴더 구조 정리
2. 공통 CSS/JS 분리
3. 국내 선수 DB 구축 시작
4. 선수 공용 코드 시스템 적용
5. 페이지 기능 확장
```

## 2. 작업 순서

### 1단계: 폴더 구조 정리

목표:

- international, domestic, data 구조를 분리한다.
- 대회 중심 데이터와 선수 중심 데이터를 분리한다.
- 향후 파일 수가 늘어나도 구조가 무너지지 않게 만든다.

권장 구조:

```text
kvolleylab/
├─ index.html
├─ assets/
│  ├─ css/
│  ├─ js/
│  └─ images/
├─ data/
│  ├─ master/
│  ├─ international/
│  ├─ domestic/
│  ├─ schema/
│  ├─ template/
│  ├─ sample/
│  └─ seed/
├─ international/
├─ domestic/
└─ docs/
```

### 2단계: 공통 CSS/JS 분리

목표:

- 상단 메뉴, 색상, 카드 디자인, 버튼 스타일을 한 곳에서 관리한다.
- 페이지마다 다른 디자인이 생기지 않게 한다.

현재 공통 CSS 위치:

```text
assets/css/style.css
```

향후 공통 JS 위치:

```text
assets/js/main.js
```

### 3단계: 국내 선수 DB 구축 시작

목표:

- 국내 선수 데이터 구조를 별도 JSON으로 만든다.
- 공개 팜플렛과 대회자료 기반으로 선수 정보를 누적한다.
- VNL 선수 데이터와 국내 선수 데이터를 섞지 않는다.

권장 파일:

```text
data/domestic/domestic_players.json
data/domestic/growth_history.json
data/domestic/sources.json
```

### 4단계: 선수 공용 코드 시스템 적용

목표:

- 국내 선수와 국제 선수를 하나의 선수 체계로 연결한다.
- 선수명 변경, 학교 이동, 팀 이동, 국가대표 이력, 국제대회 출전 이력을 하나의 ID로 추적한다.

선수 공용 코드 원칙:

```text
KVL-P-xxxxx
```

초기에는 사람이 관리 가능한 순번형으로 시작하고, 이후 필요하면 세부 규칙을 확장한다.

예시:

```text
KVL-P-00001
KVL-P-00002
KVL-P-00003
```

## 3. 개발 시 주의사항

- 기존 페이지 링크가 깨지지 않도록 한 번에 대규모 파일 이동을 하지 않는다.
- 파일을 이동하기 전에는 연결된 HTML, JS, JSON 경로를 먼저 확인한다.
- 데이터 구조를 바꿀 때는 반드시 schema 문서를 먼저 갱신한다.
- 선수 데이터는 공개 출처 기반으로만 작성한다.
- 주민등록번호, 연락처, 주소 등 민감 개인정보는 저장하지 않는다.

## 4. 변경 기록 관리

큰 구조 변경이 있을 때는 `CHANGELOG.md`에 기록한다.

기록 형식:

```text
YYYY-MM-DD
- 변경 내용
- 영향받은 파일
- 다음 작업
```

## 5. 현재 권장 다음 작업

```text
1. docs/ 기준 문서 정리
2. data/ 폴더 뼈대 생성
3. player master schema 작성
4. domestic player sample JSON 생성
5. 기존 players.json을 international 데이터로 분리
6. 기존 페이지의 fetch 경로 점진 수정
```
