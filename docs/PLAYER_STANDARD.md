# K-Volley Lab Player Standard

문서 코드: KVL-STD-PLAYER-001  
상태: Active  
최종 갱신: 2026-07-10

이 문서는 K-Volley Lab의 선수 데이터 관리 기준을 정리한다.

## 1. 선수 공용 ID

모든 선수는 공용 선수 ID를 가진다.

```text
KVL-P-000001
```

운영 원칙:

- 한 선수는 하나의 KVL 선수 ID만 가진다.
- 국내 선수 DB와 국제 선수 DB에서 같은 선수를 별도로 생성하지 않는다.
- 학교, 팀, 국가대표, 대회가 바뀌어도 같은 ID를 유지한다.
- 동명이인은 서로 다른 ID를 사용한다.
- 이름 표기가 달라도 동일 인물이면 같은 ID를 유지한다.

## 2. 화면 분리 원칙

선수 ID와 기본 신원은 공통 마스터에서 관리하지만, 화면과 세부 활용 데이터는 분리한다.

```text
공통: data/master/player_master.json
국내: domestic/ + data/domestic/
국제: international/ + data/international/
```

### 국내 화면의 중심 정보

```text
학교·국내 팀
학년·단계
등번호
국내 대회 참가
성장 경로
```

### 국제 화면의 중심 정보

```text
국가대표
국제대회 로스터
해외 클럽
이적
국제 기록
```

## 3. 최신 명단 우선 입력

처음부터 모든 선수의 전체 이력을 채우지 않는다.

최신 명단에서는 아래 항목을 우선한다.

```text
선수명
생년 또는 생년월일
현재 소속
포지션
키
출처
```

나중에 추가할 수 있는 확장 항목:

```text
이전 소속
성장 타임라인
대표팀 경력
대회 이력
수상 이력
이적 이력
영상·기사
```

확장 항목이 비어 있으면 화면에서 해당 섹션을 숨긴다.

## 4. 공통 기본 필드

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
sub_position
height_cm
weight_kg
source_ids
status
data_confidence
created_at
updated_at
```

현재 소속처럼 시점에 따라 바뀌는 값은 공통 마스터에 요약값을 둘 수 있지만, 상세 이력은 별도 국내/국제 데이터에서 관리한다.

## 5. 표시 형식

국내 선수 예시:

```text
김민준 (OH)
인하대학교 · 190cm · 2005년생
```

국제 선수 예시:

```text
Poriya Khanzadeh (OH) 🇮🇷
포리야 칸자데 · 이란 · 196cm
```

미확인 값은 추측하지 않는다.

```text
키 확인 불가
생년 확인 불가
```

내부 Draft ID와 검수 상태는 관리자·개발 단계에서만 표시하고, 일반 공개 화면에서는 숨기는 것을 원칙으로 한다.

## 6. ID와 표시 코드

```text
player_id: KVL-P-000001
display_code: KMJ-051029
```

- `player_id`는 영구 내부 기본키다.
- `display_code`는 사람이 보기 쉬운 보조 코드다.
- `display_code`가 중복되거나 변경되어도 `player_id`는 유지한다.
- Draft ID는 정식 편입 전 임시 연결에만 사용한다.

## 7. 국내 성장 이력

국내 선수에게 필요한 확장 데이터:

```text
school_history
team_history
position_history
height_history
competition_history
award_history
national_team_history
injury_history
media_history
```

모든 항목을 필수로 채우지 않는다. 공개 자료와 운영 필요가 있을 때만 누적한다.

## 8. 국제 활동 이력

국제 선수 또는 국제 활동이 있는 선수에게 필요한 확장 데이터:

```text
national_team_history
international_rosters
club_history
transfer_history
international_competition_history
international_statistics
```

한국 선수가 국제대회에 참가해도 새 선수 ID를 만들지 않는다.

## 9. 출처 연결

```json
"source_ids": ["KVL-SRC-000001", "KVL-SRC-000002"]
```

핵심 정보는 가능한 한 공식 출처와 연결한다. 출처가 충돌하면 값을 단정하지 않고 출처별 차이를 기록한다.

## 10. 입력 체크리스트

```text
대회명 또는 명단 기준일
연도
학교/팀명
선수명
생년월일 또는 생년
학년 또는 단계
등번호
포지션
키
출처
기존 player_id 존재 여부
동명이인 여부
```

## 11. 개인정보 보호

- 주민등록번호, 연락처, 개인 주소는 입력하지 않는다.
- 공개되지 않은 의료·가족·사생활 정보는 입력하지 않는다.
- 공개 자료 기반 정보만 관리한다.

## 12. Seed 편입

Seed 데이터를 정식 마스터로 편입할 때는 [`PLAYER_DATA_MAPPING_RULE_v1.md`](PLAYER_DATA_MAPPING_RULE_v1.md)를 따른다.
