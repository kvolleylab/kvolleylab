# K-Volley Lab Player Standard

문서 코드: KVL-STD-PLAYER-001

이 문서는 K-Volley Lab의 선수 데이터 관리 기준을 정리한다.

## 1. 선수 공용 ID

K-Volley Lab의 모든 선수는 공용 선수 ID를 가진다.

권장 형식:

```text
KVL-P-00001
```

의미:

```text
KVL = K-Volley Lab
P   = Player
00001 = 선수 고유 순번
```

## 2. ID 운영 원칙

- 한 선수는 하나의 KVL 선수 ID만 가진다.
- 학교, 팀, 국가대표, 대회가 바뀌어도 같은 ID를 유지한다.
- 동명이인은 반드시 다른 ID를 사용한다.
- 이름이 바뀌거나 표기가 달라져도 같은 선수라면 같은 ID를 유지한다.

## 3. 기본 선수 표시 형식

해외 선수 표시 예시:

```text
Poriya Khanzadeh (OH) 🇮🇷
(포리야 칸자데, 이란, 196cm)
```

국내 선수 표시 예시:

```text
김민준 (OH)
(인하대학교, 190cm, KVL-P-00001)
```

키가 확인되지 않으면 다음과 같이 표시한다.

```text
키 확인 불가
```

## 4. 선수 기본 필드

권장 기본 필드:

```text
player_id
name_ko
name_en
name_native
gender
nationality
birth_date
birth_year
height_cm
weight_kg
position
sub_position
current_team
current_level
source_ids
created_at
updated_at
```

## 5. 성장 이력 필드

국내 선수 성장 DB에서 사용하는 필드:

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

## 6. 출처 연결

선수 데이터는 가능한 한 출처 ID와 연결한다.

예시:

```json
"source_ids": ["SRC-2026-0001", "SRC-2026-0002"]
```

## 7. 데이터 입력 체크리스트

대회 팜플렛이나 공개 자료에서 선수 정보를 입력할 때 확인할 항목:

```text
대회명
연도
학교/팀명
선수명
학년 또는 연령대
등번호
포지션
키
생년월일 또는 생년
출처
비고
```

## 8. 주의사항

- 주민등록번호, 연락처, 주소는 입력하지 않는다.
- 공개되지 않은 부상 세부정보는 입력하지 않는다.
- 공식 자료와 팜플렛 정보가 다를 경우 출처별로 기록하고 단정하지 않는다.
- 선수 이름 한글/영문 표기는 출처에 따라 차이가 있을 수 있으므로 alias 구조를 고려한다.
