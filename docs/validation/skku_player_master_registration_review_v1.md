# 성균관대학교 Player Master 등록 검토 v1

## 대상

- 인원: 16명
- 제안 ID: `KVL-P-000017` ~ `KVL-P-000032`
- 원본: `data/seed/player_master_registration_batch_univ_2026_v1.json`
- 출처 코드: `SRC-DOM-UNIV-2026-SKKU-001`

## 검토 결과

| ID | 이름 | 등번호 | 포지션 | 키 | 출신교 | 상태 |
|---|---|---:|---|---:|---|---|
| KVL-P-000017 | 권준범 | 11 | 미확인 | 미확인 | 미확인 | needs_review |
| KVL-P-000018 | 신명호 | 1 | 미확인 | 미확인 | 미확인 | needs_review |
| KVL-P-000019 | 송대영 | 10 | 미확인 | 미확인 | 미확인 | needs_review |
| KVL-P-000020 | 한승우 | 6 | 미확인 | 미확인 | 미확인 | needs_review |
| KVL-P-000021 | 전현태 | 14 | 미확인 | 미확인 | 미확인 | needs_review |
| KVL-P-000022 | 김정식 | 12 | 미확인 | 미확인 | 미확인 | needs_review |
| KVL-P-000023 | 최보민 | 9 | 미확인 | 미확인 | 미확인 | needs_review |
| KVL-P-000024 | 강환승 | 4 | 미확인 | 미확인 | 미확인 | needs_review |
| KVL-P-000025 | 김대환 | 3 | 미확인 | 미확인 | 미확인 | needs_review |
| KVL-P-000026 | 원태호 | 17 | 미확인 | 미확인 | 미확인 | needs_review |
| KVL-P-000027 | 백승현 | 18 | 미확인 | 미확인 | 미확인 | needs_review |
| KVL-P-000028 | 박태민 | 20 | 미확인 | 미확인 | 미확인 | needs_review |
| KVL-P-000029 | 김도윤 | 15 | L | 183cm | 현일고 | needs_review |
| KVL-P-000030 | 김남범 | 33 | 미확인 | 미확인 | 미확인 | needs_review |
| KVL-P-000031 | 김동균 | 13 | MB | 202cm | 동해광희고 | needs_review |
| KVL-P-000032 | 최준영 | 7 | OH | 187cm | 진주동명고 | needs_review |

## 등록 판단

- 임시 ID와 제안 영구 ID 연결은 16명 모두 정상이다.
- 이름 매칭은 16명 모두 정상이다.
- 생년월일이 전원 미확정이라 `display_code` 생성이 불가능하다.
- 포지션·키·출신교가 확인된 선수는 3명뿐이다.
- 따라서 이번 단계에서는 Player Master 본파일에 `active / reviewed / permanent` 상태로 정식 등록하지 않는다.
- 다음 단계에서 생년월일과 미확인 필드를 보강한 뒤 정식 등록한다.

Related issue: #6
