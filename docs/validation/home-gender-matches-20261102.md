# 홈 경기 일정·결과 — 남녀 동시 표시

Status: USER APPROVED / IMPLEMENTED / PREVIEW VERIFIED. 사용자가 두 카드 안에 남녀를 함께 넣는 제안에 “진행해봐, 모바일에서도 보기 편했으면 좋겠어”로 진행을 요청했다. 병합·Pages·운영 확인은 release PR에 기록한다.

- Base main: `3dd01417357aec3830a206ebfffbe138e7d16b34`. PR #236 모바일 헤더/달력 및 PR #237 선수 MASTER 진단을 보존한다.
- Release base: `2145e2069b2904ccd554c1056325d4063d7e9d6c`, 병행 PR #238 요약 카드 개선도 보존.
- Branch: `feature/home-gender-matches-v1`.
- 범위: `index.html` 경기 일정·결과, 테스트, Quality Audit 검사 등록. 다른 페이지·공통 엔진·내비게이션·Hero·원본 경기·ID·선수명단·MASTER는 변경하지 않는다.

## 기준과 출처

AGENTS, PROJECT_RULES, DEVELOPMENT_WORKFLOW, DESIGN_SYSTEM, 최신 결정 로그, 홈 Hero 인수인계와 테마 정책을 확인했다. 오래된 Hero 인수인계의 “프로토타입만/실홈 수정 금지”는 당시 이미지 시안 범위다. 현재 운영 홈의 승인된 v02.1 구조 및 이번 홈 카드 요청을 따른다. 홈 글꼴과 이미지 자산을 유지한다.

Google Drive 운영원칙 MASTER v17 (`1iu1aWoTdSf2L7VCco5X7pCPxs9qVlM9rskZ8_hI76FY`)을 재조회했다. 2026-27 V-리그 경기일정 MASTER (`180no_j27R_uw2adWH2BiWbbZ6QUWKVblqymIqNvkBU8`)의 11/1 남녀 결과 및 11/3 남녀 예정 4행과 기존 공개 JSON의 일치를 확인했다. 원문 쓰기·경기 결과 재수집은 하지 않는다.

기존 U-리그·KOVO컵·V-리그 남자부 공개 데이터에 대응하는 여자부 3개를 추가 연결한다. 성별마다 최근 결과/다음 일정을 독립 선택하고 날짜·대회명을 표시한다. 홈의 명시적 scoreVerification 조건을 유지하며 부분 점수·취소·연기·진행 중·날짜 오류·미등록 팀을 제외한다. 시간 미정의 같은 KST 날짜 일정은 유지한다. 조회 실패와 결과/일정 없음을 구분한다.

## 표시 계약

- 최근 경기 결과 / 다음 경기 두 흰색 카드. 각 카드 남자부 → 여자부, 얇은 구분선 및 같은 행 높이.
- 남자 라벨 `#163A5F` / `#EEF4F8`, 여자 라벨 `#8E315E` / `#FFF1F6`: 기존 테마 정책. 점수 `#4B5563`: 운영원칙의 중립색.
- 모바일 세로 배치, 팀명14px·최종 스코어28px·날짜/세트12px. 이름은 말줄임하지 않고 세트 점수는 균등 칸에 표시한다.
- 경기 전체가 터치/키보드 링크이며 성별·대회·날짜가 일치하는 기존 schedule 경로로 이동한다.
- 실제 resources 제목/URL을 중복 제거해 표시한다. V-리그 출처를 “U-리그 공식 자료”로 표시하던 고정 문구를 제거한다.

## 검수·복구

`tests/home-gender-matches.test.cjs` 6개 PASS: 실제 6개 feed/4개 경기/로고·날짜 링크, 성별 독립 선택·5세트·제외 상태, KST 경계·시간 미정, 여자 조회 실패 격리/빈 상태, 시즌 종료, 기존 검색·대회 필터 및 데이터 불변성. Quality Audit core 목록에 등록했다.

실제 HTML 미리보기: PC1440 본문1180px, 모바일390/360px 가로 넘침·이미지 오류 없음. 모바일 팀명14px·스코어28px 확인. PC 남녀 행 높이 보정. 실물 휴대전화 검수와 구분한다. HTTP 미리보기에서 기존 production 엔진의 HTTPS 제한을 해제하지 않으며 경기 상세 이동의 운영 검수는 배포 후 수행한다.

배포 완료 증거는 PR의 병합 SHA, Pages 성공, 운영 홈페이지 4경기 및 여자부 링크 확인 기록이다. 복구는 이 PR의 홈 변경만 되돌리며 공시·선수 MASTER·대회 데이터의 병행 변경을 보존한다.
