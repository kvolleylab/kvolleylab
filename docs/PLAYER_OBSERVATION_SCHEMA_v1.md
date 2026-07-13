# Player Observation Schema v1

선수 관찰 메모는 공개 프로필 데이터와 분리해 관리한다.

## 기본 구조

```json
{
  "observation_id": "KVL-OBS-000001",
  "player_id": "KVL-P-000001",
  "observed_at": "2026-07-13",
  "competition_id": "",
  "match_id": "",
  "observer": "K-Volley Lab",
  "visibility": "private",
  "status": "active",
  "summary": "",
  "strengths": [],
  "improvements": [],
  "tags": [],
  "source_ids": []
}
```

## 운영 원칙

- `player_id`로 Player Master와 연결한다.
- 기본 공개 범위는 `private`이며, 공개 승인된 메모만 `public`로 변경한다.
- 사실 정보와 평가 의견을 구분한다.
- 경기나 대회 기반 메모는 가능한 경우 `competition_id`, `match_id`를 함께 저장한다.
- 선수·보호자·학교의 정정 또는 삭제 요청에 대응할 수 있도록 출처와 작성일을 유지한다.
- 현재 웹 공개 페이지에는 `visibility: public`인 메모만 표시한다.
