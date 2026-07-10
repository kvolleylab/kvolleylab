# K-Volley Lab Player Data Mapping Rule v1

문서 코드: KVL-MAP-PLAYER-001  
상태: Active  
최종 갱신: 2026-07-10

이 문서는 최신 명단·팜플렛·Seed 데이터를 공통 `player_master`와 국내/국제 활용 데이터로 편입하는 공식 매핑 규칙이다.

## 1. 목적

```text
실제 명단
↓
Seed 데이터
↓
기존 선수 조회
↓
공통 player_id 확정
↓
공통 마스터 + 국내/국제 데이터에 연결
```

목표는 같은 선수를 여러 번 만들지 않고, 최신 정보부터 안전하게 누적하는 것이다.

## 2. 편입 전 확인 순서

새 선수를 만들기 전에 아래 순서로 기존 선수를 찾는다.

```text
1. 기존 player_id
2. 이름 + 생년월일
3. 이름 + 생년 + 학교/팀
4. 이름 + 포지션 + 학교/팀
5. 출처와 이전 명단 비교
```

완전히 일치하지 않으면 자동 병합하지 않고 `duplicate_review` 또는 `needs_review`로 둔다.

## 3. 신규 ID 부여

기존 선수와 일치하지 않을 때만 새 ID를 발급한다.

```text
KVL-P-000001
KVL-P-000002
KVL-P-000003
```

금지:

```text
KVL-DOM-000001
KVL-INT-000001
KVL-VNL-000001
```

국내·국제·대회별 별도 선수 ID를 만들지 않는다.

## 4. Draft ID 처리

Seed 단계에서는 임시 Draft ID를 사용할 수 있다.

```text
KVL-P-DRAFT-INHA-001
```

정식 편입 시 매핑표를 남긴다.

```text
KVL-P-DRAFT-INHA-001 → KVL-P-000001
```

Draft ID를 사용하는 모든 파일에서 같은 정식 ID로 교체한다.

대상 예시:

```text
player seed
school/team roster
competition roster
growth history
source link
profile URL
```

## 5. 공통 마스터 필드 매핑

| Seed 위치 | Master 필드 | 처리 |
|---|---|---|
| `system.display_code` | `display_code` | 표시용 코드로 저장 |
| `identity.name_ko` | `name_ko` | 공통 기본정보 |
| `identity.name_en` | `name_en` | 없으면 빈 값 유지 |
| `identity.name_native` | `name_native` | 원문 표기 |
| `identity.gender` | `gender` | 공통 기본정보 |
| `identity.nationality` | `nationality` | ISO-3 우선 |
| `identity.birth_date` | `birth_date` | `YYYY-MM-DD` |
| `identity.birth_year` | `birth_year` | 날짜가 없을 때 활용 |
| `classification.primary_position` | `primary_position` | 현재 기준 요약값 |
| `classification.sub_position` | `sub_position` | 선택값 |
| `physical.height_cm` | `height_cm` | 최신 확인값 |
| `physical.weight_kg` | `weight_kg` | 최신 확인값 |
| `source_ids` | `source_ids` | 출처 연결 |

공통 마스터에는 모든 대회·학교별 세부사항을 반복 저장하지 않는다.

## 6. 국내 데이터 매핑

국내 명단에서 발생한 시점성 정보는 `data/domestic/` 영역에 둔다.

| 명단 항목 | 국내 활용 필드 예시 |
|---|---|
| 학교/팀 | `current_school_id`, `current_team_id` |
| 학년 | `grade` |
| 단계 | `current_level` |
| 등번호 | `jersey_number` |
| 대회명 | `competition_id` 또는 `competition_name` |
| 출신학교 | `previous_school_id` |
| 명단 기준일 | `effective_date` |
| 출처 | `source_ids` |

학교·팀·등번호는 바뀔 수 있으므로 선수의 영구 신원값으로 취급하지 않는다.

## 7. 국제 데이터 매핑

국제대회 및 해외 활동 정보는 `data/international/` 영역에 둔다.

| 명단 항목 | 국제 활용 필드 예시 |
|---|---|
| 대표 국가 | `national_team_country_id` |
| 국제대회 | `competition_id` |
| 로스터 상태 | `roster_status` |
| 등번호 | `jersey_number` |
| 해외 클럽 | `club_team_id` |
| 시즌 | `season` |
| 출처 | `source_ids` |

한국 선수가 국제대회 로스터에 포함되어도 국내 마스터 선수와 같은 `player_id`를 사용한다.

## 8. 최신값과 이력값

### 공통 마스터 요약값

검색과 기본 프로필에 필요한 최신값을 둔다.

```text
primary_position
height_cm
weight_kg
current_team_id 또는 current_team_name
updated_at
```

### 이력 데이터

과거 값은 덮어쓰지 않고 이력으로 보존한다.

```text
height_history
position_history
team_history
school_history
roster_history
```

예: 키가 192cm에서 195cm로 바뀌면 마스터는 195cm로 갱신하고, 출처가 있는 이전 192cm는 이력에 남길 수 있다.

## 9. 필수 검수

정식 편입 전 확인:

```text
player_id 중복 없음
동명이인 확인
생년월일 형식
키·체중 숫자 형식
포지션 표준값
학교/팀 ID 연결
source_id 연결
Draft ID 잔존 여부
JSON 문법
```

## 10. 데이터 충돌 처리

출처가 서로 다를 경우:

1. 공식·최신 출처를 우선한다.
2. 과거 출처는 삭제하지 않고 이력으로 남긴다.
3. 확정하기 어렵다면 `data_confidence: needs_review`로 둔다.
4. 추정값을 사실처럼 저장하지 않는다.

## 11. 인하대 Seed 적용 예시

```text
KVL-P-DRAFT-INHA-001
선주성
2004-06-24
L
177cm
인하대학교 남자배구부
```

편입 과정:

```text
기존 선수 조회
→ 일치 선수 없음
→ 새 KVL-P-번호 발급
→ 기본 신원은 player_master
→ 인하대 소속·학년·등번호는 domestic 데이터
→ 출처는 source_master와 연결
→ Draft ID 연결값 일괄 교체
```

## 12. 운영 원칙 요약

```text
한 선수 = 한 player_id
최신 명단부터 입력
공통 신원 = player_master
국내 활동 = data/domestic
국제 활동 = data/international
과거 정보 = 이력
불확실 정보 = needs_review
모든 핵심 정보 = source_ids
```
