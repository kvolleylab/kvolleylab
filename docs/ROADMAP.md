# K-Volley Lab Roadmap

이 문서는 K-Volley Lab의 단계별 개발 로드맵을 정리한다.

## Phase 1. 구조 안정화

목표:

- 저장소 구조 정리
- 공통 디자인 기준 생성
- 데이터 표준 문서 작성
- 기존 페이지 메뉴 통일

작업:

```text
공통 CSS 생성
상단 메뉴 통일
README 수정
docs 기준 문서 생성
data 폴더 구조 설계
```

## Phase 2. 데이터 구조 시작

목표:

- 선수 마스터 구조 생성
- 국내 선수 샘플 데이터 생성
- 출처 마스터 생성
- VNL 선수 데이터 분리

작업:

```text
data/master/player_master.json
data/master/source_master.json
data/schema/player_master_schema_v1.json
data/sample/player_master_sample.json
data/domestic/domestic_players.json
```

## Phase 3. Players 기능 정리

목표:

- Players 메뉴를 선수 검색 허브로 정리
- 국내 선수 검색과 국제 선수 검색을 구분
- 선수 상세 페이지 구조 확장

권장 구조:

```text
Players
├─ 국내 선수 검색
├─ 국제 선수 검색
├─ 선수 상세
└─ 성장 타임라인
```

## Phase 4. Competition 기능 정리

목표:

- VNL, AVC, KOVO, 대학대회 등 대회별 데이터 구조 정리
- 대회별 선수 명단과 일정 연결

권장 구조:

```text
Competition
├─ VNL
├─ AVC
├─ KOVO
├─ 대학리그
└─ 국내대회
```

## Phase 5. Schedules 기능 확장

목표:

- 대회 일정 JSON 분리
- 경기 결과 업데이트 구조 추가
- 한국시간 기준 고정
- 대회별 비교 기능 강화

## Phase 6. Pamphlets Archive

목표:

- 공개 팜플렛 아카이브 구축
- 대회별, 연도별, 부문별 검색
- 선수 데이터의 출처로 연결

## Phase 7. Simulator

목표:

- 조별리그 본선 진출 계산기
- 세트득실, 점수득실, 승패 조건 계산
- 대회별 시뮬레이터 확장

## Phase 8. Records / Media / News

목표:

- 선수 기록과 영상, 뉴스 데이터 연결
- 전력분석관 관점의 데이터 활용 가능 구조 구축

## 장기 목표

K-Volley Lab은 단순 정보 페이지가 아니라, 한국 배구 데이터 인프라를 목표로 한다.

최종 방향:

```text
선수 DB
팀 DB
학교 DB
대회 DB
경기 DB
팜플렛 아카이브
뉴스/영상 연결
전력분석 도구
```
