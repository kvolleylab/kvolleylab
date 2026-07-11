# 2026 대학 남자배구 Player Master 배치 실행 트리거 v2

이 변경은 `pull_request` 기반 워크플로를 실행하여 207명 등록 후보 JSON을 생성·검증하기 위한 트리거다.

기대 결과:

- `data/seed/player_master_registration_batch_univ_2026_v1.json` 생성
- 207명
- `KVL-P-000017` ~ `KVL-P-000223` 연속
- 중복 ID 없음
- 전체 `pending_review` / `unreviewed` / `proposed` 유지

Player Master 본파일은 변경하지 않는다.

Related issue: #6
