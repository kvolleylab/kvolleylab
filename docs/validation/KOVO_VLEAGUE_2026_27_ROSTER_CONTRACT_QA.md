# 2026-27 KOVO V-리그 선수명단 및 계약 검수 — 2026-10-15

## 범위 및 출처
- KOVO 공개 공시 API 수집: `scripts/kovo_official_notices.py`, 시즌별 통합 JSON `data/kovo/official-notices/2026-27/index.json`.
- 공시 70건(2026-04-08~2026-10-14), 선수별 정규화 변동 이벤트 76건. 기본 12페이지 설정이지만 실제 8페이지 검사 후 날짜 컷오프에 도달함. 수집된 모든 공시와 누락 없이 동일한지 보장하는 자료는 아님.
- Google Drive: 남자 https://docs.google.com/spreadsheets/d/1WD2odv51xNDx9BqRfAjkkLVu0p_DX2EX_GEbqR-G4og/edit , 여자 https://docs.google.com/spreadsheets/d/18-SkyyCeCXBKSUbCCevhAFDmyjSOPrQubreSXIG2PBU/edit .
- **홈페이지 및 Production 수정 없음.** 공식 등록과 자동 추론/검수결과를 혼동하지 않는다.

## 1. 선수 식별 검사 (Player_ID)
- 14개 구단 공시 기반 현재등록 표: 남자 122 / 여자 121 = 243명.
- 공통 `data/national/player_id_links_v1.json`의 **정확한 선수명+생년월일**로 남자 21명의 Player_ID를 신규 연결.
- 남자 구단 현재등록 표에 **KVL-P 형식 ID 39건**: 그중 이름+생년월일 대조 38건; 최민호의 기존 `KVL-P-001608` ID는 이 링크 DB에 항목이 없어 원본 추가 검수 필요.
- 남자 나머지 **83명**, 여자 **121명**은 유효한 KVL-P 매핑 미확인; 신원 식별번호를 추정해서 만들거나 이름만으로 연결하지 않음.
- 전진선에게 잘못 삽입돼 있던 Drive 파일 ID 값을 `KVL-P-001546`으로 정정. 신장호/나두환에 공통 반복 사용된 잘못된 파일 ID는 삭제하고 `선수ID_신원검수` 시트에 원래 오류 값을 기록.
- 동명이인: 남자 이재현(현대캐피탈 2002-10-21 / 삼성화재 2002-11-02), 여자 이주아·김다은·박은서 각각 2명. 독립 신원으로 유지, 생년월일이 같지 않으면 병합 금지.

## 2. 공시 이벤트 기반 등록상태 검수
- 남자 2026-27 후속 변동 이벤트 **15건**, 여자 **30건**을 구단/선수명/외국인 등록명/등번호/포지션/소속 이전 여부와 대조했으며 명단 불일치 **0건**.
- 지난 시즌 공시는 참고용으로 따로 두며 이번 시즌의 새로운 이적/탈퇴로 적용하지 않음.
- GitHub 독립 계산 `roster_projection.json`은 남 122 / 여 121, Google Drive 현재등록 표 243명의 구단·이름(등록명 포함)·등번호와 전원 일치.
- 독립 계산에서 실제 적용한 이벤트는 **44건**; 흥국생명 해외임대 이다현 1건은 최초 등록 명단에 없어서 현등록 제외 여부만 확인하고 복귀/현재등록으로 자동 판단하지 않음. `roster_review_queue.json`에 경고 1건 유지.
- 동일 이름의 서로 다른 선수 4쌍은 생년월일 데이터가 없는 독립 계산기에서 무조건 동일 선수로 추정하지 않도록 검수 대기 항목으로 보존.

## 3. 연봉·옵션 검수
- KOVO 1차 연봉·옵션/합계: 남 115명, 여 104명. 후속 공시로 계약금액 최신 반영: 남 3명, 여 9명.
- 계약 합계 = 연봉 + 옵션 일치 확인, 불일치 **0건**.
- 5명(남)/14명(여)의 외국인·아시아쿼터 선수에 해당 국내 연봉/옵션 금액 공시를 확인하지 못해 금액 미기입.
- Google Drive `KOVO_최신계약검수` 별도 시트에 선수 243명의 가장 최신 공시 근거, 금액, 확인 상태 기록. 기존 USD 예상연봉 항목과 혼합하지 않음.

## 4. 공통 자동화
- `.github/workflows/kovo-official-notices-collector.yml` 매일 08:13 KST 예약 실행 또는 수동 실행.
- 공시 수집 → 선수별 이벤트 추출 → Python 단위 테스트 → `scripts/kovo_verify_roster_contracts.py` 후보 명단/원화 계약 검증 → `roster_projection.json`/`roster_review_queue.json` 갱신 및 GitHub 커밋.
- 2026-10-15 최종 재검증 성공 GitHub Actions: https://github.com/kvolleylab/kvolleylab/actions/runs/38707060491 (기본 12개 + 추가 6개 테스트 통과).
- 최근 공시 변경 0건이면 `latest_changes.json`을 빈 배열로 재설정하여 이전 변화가 신규처럼 남지 않게 함.
- 임대 종료 비교일을 고정 문자열로 두지 않고 GitHub 작업 실행 당시 **Asia/Seoul 현지 날짜**로 계산.
- GitHub 자동화에는 Google Drive 쓰기 OAuth/서비스계정 인증이 없으므로 **MASTER 무인 자동 갱신은 미구현**. 새 공시가 있으면 후보 및 검수 큐 생성까지 자동이고, 검증된 사항만 연결 가능한 Drive 작업으로 반영한다.
- API 전체 공시 수집과 실제 등록의 법적/실시간 보증, 해외임대 후 자동 복귀 단정, 상업적 공시 원문 재배포를 하지 않는다.

## 향후 다른 채팅에서 재사용
`docs/validation/KOVO_VLEAGUE_2026_27_ROSTER_CONTRACT_QA.md`와 `docs/KVL_KOVO_OFFICIAL_NOTICES_COLLECTOR.md`, `data/kovo/official-notices/2026-27/roster_projection.json`, `roster_review_queue.json`을 확인한 후 최신 Action 결과 및 Drive MASTER를 대조한다. 이미 완료된 2026-10-15 검수를 반복하지 말고 이후 신규 공시부터 진행한다.
