# K-Volley Lab Database Standard v1

문서 코드: KVL-STD-001

이 문서는 K-Volley Lab의 첫 번째 공식 데이터베이스 표준 문서다.

현재 버전은 v1 초안이며, 향후 프로젝트가 커지면서 계속 버전업한다.

## 1. 목표

K-Volley Lab의 데이터베이스는 선수, 팀, 학교, 대회, 경기, 뉴스, 영상, 출처를 하나의 체계로 연결하는 것을 목표로 한다.

최종 방향:

```text
PERSON MASTER
│
├─ PLAYER MASTER
│
├─ COACH MASTER
│
TEAM MASTER
│
├─ MATCH MASTER
│
├─ COMPETITION MASTER
│
NEWS / VIDEO
```

## 2. 핵심 마스터 데이터

K-Volley Lab의 핵심 마스터 데이터는 다음과 같다.

```text
player_master.json
school_master.json
team_master.json
country_master.json
competition_master.json
source_master.json
```

## 3. Player Master

선수 데이터의 중심 파일이다.

권장 위치:

```text
data/master/player_master.json
```

선수는 국내/국제/대회/팀 소속 여부와 관계없이 하나의 공용 ID로 관리한다.

권장 ID 형식:

```text
KVL-P-00001
```

## 4. Player Master 주요 항목

`player_master.json`은 다음 항목을 포함할 수 있다.

```text
기본정보
신체정보
소속이력
국가대표
대회출전
기록
수상이력
부상
성장기록
미디어
출처
시스템정보
```

## 5. 국내 선수 DB와 국제 선수 DB 관계

국내 선수와 국제 선수는 서로 분리된 데이터가 아니라, 하나의 선수 마스터 아래에서 구분한다.

```text
player_master.json
│
├─ domestic player data
│
└─ international player data
    │
    ├─ VNL
    ├─ AVC
    ├─ U21
    └─ KOVO
```

## 6. Source Master

모든 주요 데이터는 출처를 연결해야 한다.

권장 위치:

```text
data/master/source_master.json
```

출처 예시:

- 공식 대회 팜플렛
- 공식 경기 기록지
- 협회/연맹 공지
- 공식 선수 프로필
- 공개 기사
- Volleybox 프로필
- Volleyball World 프로필

## 7. 개인정보 보호 원칙

저장 금지 또는 공개 금지 항목:

```text
주민등록번호
개인 연락처
개인 주소
비공개 가족정보
공식 출처 없는 의료 세부 정보
사생활 정보
```

저장 가능한 항목은 공개 출처로 확인 가능한 정보로 제한한다.

## 8. JSON 작성 원칙

- 필드명은 영어 소문자와 언더스코어를 사용한다.
- 날짜는 가능하면 `YYYY-MM-DD` 형식을 사용한다.
- 모르는 값은 억지로 채우지 않는다.
- 확인되지 않은 값은 `null` 또는 빈 문자열로 둔다.
- 출처가 필요한 값은 `source_ids`로 연결한다.

## 9. 버전 관리

스키마가 바뀔 경우 파일명에 버전을 남긴다.

```text
player_master_schema_v1.json
player_master_schema_v2.json
player_master_schema_v3.json
```

## 10. 현재 우선 구축 대상

```text
1. player_master_schema_v1.json
2. domestic_players_sample.json
3. source_master_sample.json
4. 기존 players.json의 international 데이터 분리
```
