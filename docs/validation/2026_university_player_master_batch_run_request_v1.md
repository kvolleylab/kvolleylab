# 2026 대학 남자배구 Player Master 배치 실행 요청 v1

이 변경은 등록 배치 생성 워크플로를 실행하기 위한 트리거다.

## 기대 결과

- `scripts/build_university_player_master_batch.py` 실행
- 207명 등록 후보 생성
- `KVL-P-000017` ~ `KVL-P-000223` 연속성 검증
- 중복 ID 없음 확인
- 전체 상태 `pending_review` / `proposed` 유지
- 결과 파일 `data/seed/player_master_registration_batch_univ_2026_v1.json` 생성

Player Master 본파일은 이 단계에서 변경하지 않는다.

Related issue: #6
