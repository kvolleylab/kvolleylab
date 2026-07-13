# K-Volley Lab Platform Architecture v1

문서 상태: Active  
최초 작성: 2026-07-13  
목적: K-Volley Lab의 페이지 구조, 데이터 관계, ID 체계, 개발 우선순위를 하나의 기준으로 고정한다.

---

## 1. 플랫폼 정의

K-Volley Lab은 단순한 배구 뉴스 사이트가 아니다.

```text
공개 원본 자료
    ↓
검증·정리된 데이터
    ↓
선수·팀·대회·경기·팜플렛 연결
    ↓
검색·일정·성장 추적·분석 도구
```

핵심 가치는 다음 세 가지다.

1. 흩어진 한국 배구 자료를 한곳에서 찾는다.
2. 선수·팀·대회·경기·출처를 고유 ID로 연결한다.
3. 팬뿐 아니라 선수·지도자·학부모·분석관이 반복 사용한다.

---

## 2. 최종 상단 메뉴

공개 메뉴는 다음 구조를 기준으로 한다.

```text
Home
Players
Competitions
Schedules
Pamphlets
Request
```

비공개 또는 개발 중 기능:

```text
Simulator / 진출계산기
Reports
Scout
Admin
```

운영 원칙:

- 모든 공개 페이지에서 헤더 높이, 로고 위치, 글자 크기, 메뉴 간격을 동일하게 유지한다.
- 메뉴는 공통 스크립트와 공통 CSS에서만 관리한다.
- 개발 중 기능은 메뉴에 노출하지 않는다.
- 사용자는 주요 정보에 3번 이내 클릭으로 도달해야 한다.

---

## 3. 정보 구조

```text
Home
├─ Players
│  ├─ 선수 검색
│  ├─ 선수 상세
│  ├─ 성장 Timeline
│  ├─ 국가대표 이력
│  ├─ 학교·팀 이력
│  └─ 출처·영상·기사
│
├─ Competitions
│  ├─ VNL
│  ├─ AVC
│  ├─ KOVO / V-League
│  ├─ 대학리그
│  └─ 국내 연령별·학교대회
│
├─ Schedules
│  ├─ 대회별 일정
│  ├─ 국가·팀별 필터
│  ├─ 한국시간 변환
│  └─ 경기 상세 연결
│
├─ Pamphlets
│  ├─ 연도별
│  ├─ 대회별
│  ├─ 학교·팀별
│  ├─ 원문 PDF
│  └─ 선수·대회 DB 연결
│
└─ Request
   ├─ 정보 등록
   ├─ 오류 정정
   ├─ 삭제 요청
   └─ 자료 제보
```

---

## 4. 핵심 사용자 이동 흐름

### 4.1 대회 중심 흐름

```text
Competition
→ VNL 2026
→ 참가국
→ 국가 엔트리
→ 선수 클릭
→ 선수 상세
→ 출처·일정·경기
```

### 4.2 선수 중심 흐름

```text
Players
→ 이름·학교·국가·포지션 검색
→ 선수 상세
→ 성장 Timeline
→ 대회 참가 이력
→ 경기·팜플렛·출처
```

### 4.3 팜플렛 중심 흐름

```text
Pamphlets
→ 2026 대학리그 팜플렛
→ 참가팀
→ 선수명
→ Player Master
→ 선수 상세
```

### 4.4 일정 중심 흐름

```text
Schedules
→ 대회 선택
→ 팀 필터
→ 날짜 선택
→ 경기 상세
→ 엔트리·결과·관련 자료
```

---

## 5. 데이터 관계

```text
Country
  └─ Team
      ├─ Roster
      │   └─ Player
      └─ Match
          └─ Competition

Competition
  ├─ Match
  ├─ Roster
  ├─ Standing
  ├─ Pamphlet
  └─ Source

Player
  ├─ Player History
  ├─ Team Membership
  ├─ Competition Entry
  ├─ Match Record
  ├─ Award
  ├─ Media
  └─ Source
```

핵심 원칙:

- 선수는 어느 화면에서 등장하더라도 하나의 `player_id`만 사용한다.
- 엔트리와 소속은 선수 자체 정보가 아니라 별도 관계 데이터로 저장한다.
- 대회별 등번호·포지션·엔트리 상태는 해당 대회 Roster에 저장한다.
- 키·생년월일 등 공통 신원 정보는 Player Master에 저장한다.
- 모든 주요 값은 `source_id`로 출처를 추적한다.

---

## 6. 고유 ID 체계

```text
Player       KVL-P-000001
Team         KVL-T-000001
School       KVL-S-000001
Country      KVL-CTY-000001
Competition  KVL-COMP-000001
Match        KVL-M-000001
Roster       KVL-RST-000001
Pamphlet     KVL-PAM-000001
Source       KVL-SRC-000001
Media        KVL-MED-000001
```

표시용 보조 코드가 필요할 경우 선수 신규 코드 형식은 다음을 사용한다.

```text
INITIALS-YYMMDD
```

내부 DB의 영구 연결 기준은 반드시 `KVL-*` ID다.

---

## 7. 권장 데이터 구조

```text
data/
├─ master/
│  ├─ player_master.json
│  ├─ team_master.json
│  ├─ school_master.json
│  ├─ country_master.json
│  ├─ competition_master.json
│  └─ source_master.json
│
├─ roster/
│  ├─ vnl-2026-men.json
│  └─ competition-team-roster.json
│
├─ schedules/
│  ├─ vnl-2026-men.json
│  └─ avc-2026-men.json
│
├─ matches/
│  └─ match_master.json
│
├─ pamphlets/
│  └─ pamphlet_master.json
│
├─ domestic/
├─ international/
├─ schema/
└─ archive/
```

원본 Excel은 장기 관리 원본으로 사용하고, JSON은 검증 후 웹 배포용으로 생성한다.

```text
Excel Master
→ Schema Validation
→ Duplicate Check
→ JSON Export
→ Site Test
→ Release
```

---

## 8. 페이지 템플릿

### 8.1 선수 상세

필수 영역:

```text
기본 정보
현재 소속
국가대표·대회 엔트리
성장 Timeline
이적·진학 이력
경기·기록
관련 팜플렛
출처
수정 요청
```

### 8.2 국가·팀 페이지

필수 영역:

```text
국기·팀명
감독
Active / Reserve
선수 명단
일정
최근 경기
대회 참가 이력
관련 자료·출처
```

### 8.3 대회 페이지

필수 영역:

```text
대회 개요
참가팀
엔트리
일정
결과
순위
경기 상세
팜플렛
출처
```

### 8.4 경기 상세

필수 영역:

```text
대회·날짜·장소
홈 / 원정
세트스코어
세트별 점수
출전 엔트리
라인업
기록
영상·기사
출처
```

---

## 9. 디자인 시스템 원칙

최종 디자인은 사용자가 별도로 확정하되, 구조는 다음 기준을 고정한다.

- Arial 중심 글꼴
- 페이지별 공통 헤더와 콘텐츠 최대 폭
- 동일한 제목 단계와 카드 간격
- 표는 모바일 가로 스크롤 지원
- 일정은 경기 수가 늘어나도 잘리지 않음
- 색상은 의미가 있을 때만 사용
- 페이지별 임의 CSS 추가를 최소화
- 공통 컴포넌트 우선

공통 관리 대상:

```text
assets/css/style.css
assets/css/site-theme-*.css
assets/js/unified-nav.js
assets/css/national-team.css
assets/js/national-team.js
```

---

## 10. 개발 우선순위

### P0 — 현재 운영 안정화

- 229명 Player Master 보호
- 공통 메뉴 및 링크 오류 점검
- VNL 18개국 페이지 데이터 완성도 검수
- 실제 사이트 배포 확인 절차 고정

### P1 — 선수 연결 완성

- 국가 엔트리의 선수명을 `player_id` 기반 상세페이지로 연결
- 국내 229명과 국제선수 DB의 검색 역할 분리
- 선수 상세 공통 템플릿 구축

### P2 — Competition / Match 구조

- Competition Master 생성
- Schedule JSON 분리
- 경기 상세페이지 생성
- 일정 → 경기 → 선수 연결

### P3 — Pamphlet Archive

- Pamphlet Master 생성
- PDF 원문·연도·대회·팀·출처 메타데이터 저장
- 팜플렛 → 선수·대회 연결

### P4 — 성장 Timeline

- 선수 소속·진학·포지션 변화·대표 경력을 시간순으로 표시
- 공개 출처와 당시 정보 기준 저장

### P5 — 비공개 도구 고도화

- 범용 진출계산기 규칙 엔진
- 전력분석 리포트
- 선수 비교 및 스카우트 필터

---

## 11. v1.0 공개 기준

다음 조건을 모두 만족할 때 첫 정식 공개 버전으로 본다.

- 주요 페이지의 헤더와 UI가 통일됨
- Players 검색과 Player Detail이 안정적으로 연결됨
- VNL 18개국 페이지에 검증된 엔트리가 표시됨
- Competition → Schedule → Team → Player 이동이 정상 작동함
- 일정이 PC와 모바일에서 잘리지 않음
- 팜플렛 아카이브 최소 1개 대회가 실제 연결됨
- 모든 핵심 데이터에 출처 또는 확인 상태가 표시됨
- 잘못된 정보의 정정 요청 경로가 있음
- GitHub 배포 후 실제 사이트 검증이 완료됨

---

## 12. 변경 관리 원칙

1. 큰 구조 변경은 설계 문서를 먼저 수정한다.
2. 보호 파일은 한 번에 하나씩 변경한다.
3. 신규 기능은 feature branch와 Pull Request를 원칙으로 한다.
4. 데이터 수가 바뀌는 작업은 변경 전후 건수를 검증한다.
5. 완료 보고는 저장소 반영이 아니라 실제 사이트 확인 후 한다.
6. 임시 페이지를 공개 메뉴에 바로 노출하지 않는다.
7. 확인되지 않은 정보는 추정값처럼 보이게 표시하지 않는다.

---

## 13. 바로 이어서 실행할 작업

```text
1. VNL 18개국 데이터 완성도 감사
2. Player Master와 VNL 선수의 ID 연결 방식 확정
3. 선수 상세페이지 v2 설계
4. Competition Master 최소 스키마 생성
5. Schedule 데이터를 HTML에서 JSON으로 분리
```

이 문서는 이후 K-Volley Lab의 기능 추가와 구조 변경 판단 기준으로 사용한다.
