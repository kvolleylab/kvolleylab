# Competition Master Schema v1

## 목적

대회·참가팀·엔트리·일정·경기·순위·출처를 하나의 `competition_id`로 연결한다.

## 영구 ID

```text
Competition  KVL-COMP-000001
Participant  KVL-COMP-000001-P01
Match        KVL-M-000001
Roster       KVL-RST-000001
```

## 핵심 관계

```text
Competition
├─ Participants
├─ Rosters
│  └─ Player Master
├─ Schedule
│  └─ Match Master
├─ Standings
├─ Pamphlets
└─ Sources
```

## 현재 등록 대회

- `KVL-COMP-000001` — 2026 VNL 남자부

## 운영 원칙

1. 대회 화면의 문구가 아니라 `competition_id`가 영구 연결 기준이다.
2. 참가국은 대회별 Participant 관계로 저장한다.
3. 엔트리는 선수 신원 정보와 분리한다.
4. 등번호·포지션·Active/Reserve 상태는 해당 대회 Roster에 저장한다.
5. 일정 HTML은 향후 Match Master JSON으로 분리한다.
6. 대회 규정·결과·순위는 별도 데이터 파일로 관리한다.
7. 확인되지 않은 경기·순위 데이터는 빈 파일을 사실처럼 표시하지 않는다.
