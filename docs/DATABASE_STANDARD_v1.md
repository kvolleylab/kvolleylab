# K-Volley Lab Database Standard v1

문서 코드: KVL-STD-001  
상태: Active  
최종 갱신: 2026-07-10

이 문서는 K-Volley Lab의 공식 데이터베이스 표준이다.

## 1. 핵심 원칙

K-Volley Lab은 국내 선수 화면과 국제 선수 화면을 분리하지만, 선수의 내부 고유 ID는 하나만 사용한다.

```text
선수 ID는 하나
화면과 활용 데이터는 국내/국제로 분리
```

같은 선수가 국내 학교 명단, 국가대표 로스터, 국제대회 명단에 반복 등장해도 동일한 `player_id`를 참조한다.

```text
국내 선수 검색 ─┐
학교·대학 명단   ├─ KVL-P-000001
국가대표 로스터 ┤
국제대회 로스터 ┘
```

## 2. 최종 선수 아키텍처

```text
data/master/player_master.json
        │
        ├─ domestic/
        │   ├─ search.html
        │   ├─ profile.html
        │   └─ timeline.html
        │
        ├─ international/
        │   ├─ search.html
        │   ├─ profile.html
        │   └─ roster pages
        │
        └─ competition / roster / history data
```

### 공통 마스터

`data/master/player_master.json`은 선수의 불변 ID와 공통 기본정보를 관리한다.

주요 공통 항목:

```text
player_id
display_code
name_ko
name_en
name_native
gender
nationality
birth_date
birth_year
primary_position
height_cm
weight_kg
source_ids
status
created_at
updated_at
```

### 국내 영역

권장 위치:

```text
domestic/
data/domestic/
```

국내 영역에서 관리할 정보:

```text
현재 학교/팀
학년 또는 단계
등번호
국내 대회 참가
학교 이동과 성장 경로
국내 출처
```

### 국제 영역

권장 위치:

```text
international/
data/international/
```

국제 영역에서 관리할 정보:

```text
국가대표 경력
국제대회 로스터
해외 클럽
이적 이력
국제 기록
국제 출처
```

## 3. 마스터 데이터

```text
data/master/player_master.json
data/master/school_master.json
data/master/team_master.json
data/master/country_master.json
data/master/competition_master.json
data/master/source_master.json
```

## 4. ID 표준

```text
Player      KVL-P-000001
School      KVL-S-000001
Team        KVL-T-000001
Country     KVL-CTY-000001
Competition KVL-COMP-000001
Match       KVL-M-000001
Source      KVL-SRC-000001
```

ID 운영 원칙:

- 한 선수는 하나의 `player_id`만 가진다.
- 국내·국제·대표팀·대회별 별도 선수 ID를 만들지 않는다.
- 이름, 소속, 포지션, 국적 표기 변경에도 ID를 유지한다.
- 동명이인은 서로 다른 ID를 사용한다.
- `display_code`는 표시용이며 기본키로 사용하지 않는다.

## 5. 최신 명단 우선 운영

초기 구축에서는 모든 이력을 한꺼번에 완성하지 않는다.

먼저 최신 명단의 핵심 필드만 등록한다.

```text
선수명
생년 또는 생년월일
현재 소속
포지션
키
출처
```

추가 데이터는 확인되는 순서대로 같은 `player_id`에 누적한다.

```text
성장 타임라인
대표팀 경력
대회 참가 이력
수상 이력
이적 이력
영상·기사
```

비어 있는 확장 필드는 오류가 아니다. 화면에서는 데이터가 있는 섹션만 표시한다.

## 6. Seed → Master 편입

실제 자료는 먼저 Seed 단계에서 검수한다.

```text
공식 자료 / 팜플렛 / 최신 명단
↓
Excel 마스터
↓
Seed JSON
↓
중복·출처·ID 검수
↓
player_master 편입
↓
국내/국제 화면에서 참조
```

정식 편입 전 Draft ID 예시:

```text
KVL-P-DRAFT-INHA-001
```

정식 편입 후:

```text
KVL-P-000001
```

Draft ID를 정식 ID로 바꿀 때 연결된 로스터, 이력, 출처 파일도 함께 매핑한다.

세부 매핑 규칙은 [`PLAYER_DATA_MAPPING_RULE_v1.md`](PLAYER_DATA_MAPPING_RULE_v1.md)를 따른다.

## 7. Source Master

모든 주요 데이터는 출처와 연결한다.

```text
data/master/source_master.json
```

주요 출처:

- 공식 대회 팜플렛
- 공식 경기 기록지
- 협회·연맹 공지
- 공식 선수·구단 프로필
- 공개 기사
- Volleybox
- Volleyball World / FIVB

## 8. 개인정보 보호

저장 또는 공개하지 않는 항목:

```text
주민등록번호
개인 연락처
개인 주소
비공개 가족정보
공식 출처 없는 의료 세부정보
사생활 정보
```

공개 출처로 확인 가능한 배구 관련 정보만 관리한다.

## 9. JSON 작성 원칙

- 필드명은 영어 소문자와 언더스코어를 사용한다.
- 날짜는 `YYYY-MM-DD`를 우선한다.
- 모르는 값은 추측하지 않는다.
- 미확인 값은 `null` 또는 빈 값으로 둔다.
- 출처가 필요한 값은 `source_ids`로 연결한다.
- 운영 JSON과 Seed JSON을 구분한다.
- Excel을 장기 원본으로, JSON을 웹 배포용으로 사용한다.

## 10. 버전 관리

스키마가 바뀌면 버전을 올린다.

```text
player_master_schema_v1.json
player_master_schema_v2.json
player_master_schema_v3.json
```

운영 마스터 파일명에는 매번 버전을 붙이지 않고, Git History와 Release로 변경 이력을 관리한다.
