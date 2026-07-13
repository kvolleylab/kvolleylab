# Player Timeline Schema v1

## 목적

선수의 학교, 소속팀, 국가대표, 포지션 변화, 수상 이력을 `player_id` 기준으로 연결한다.

## 데이터 구조

```json
{
  "player_id": "KVL-P-000001",
  "events": [
    {
      "event_id": "KVL-P-000001-TL-001",
      "start_date": "2026-01-01",
      "end_date": "",
      "year": 2026,
      "event_type": "education_team",
      "organization": "인하대학교",
      "team": "인하대학교",
      "position": "",
      "status": "current",
      "note": "2026 대학부 공개 명단 기준",
      "source_ids": ["SRC-DOM-UNIV-2026-INHA-001"]
    }
  ]
}
```

## event_type

- `education_team`: 학교·대학 소속
- `club_team`: 프로·실업·해외클럽
- `national_team`: 국가대표
- `position_change`: 포지션 변경
- `award`: 개인 수상
- `injury_return`: 공개된 부상·복귀 이력

## 운영 원칙

- 공개 출처로 확인된 사실만 기록한다.
- 현재 명단만 보고 과거 소속 기간을 추정하지 않는다.
- 정확한 시작일이 없으면 연도 단위로 기록하고 메모에 근거를 남긴다.
- 같은 기간에 학교와 국가대표 이력이 겹치는 것은 허용한다.
- 모든 이벤트는 `source_ids`를 보유한다.
- 정정 또는 삭제 요청이 들어오면 해당 이벤트 단위로 수정할 수 있어야 한다.
