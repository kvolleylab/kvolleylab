# 국가대표팀 연령별 성별 버튼 디자인 통일 v1 — QA 및 운영 인계

- 기준 `main`: `c69b1e72e1be3946a5f9a8a84114afbc9c01e6dc`
- 범위: 연령별 대표팀 `national-team-history.html?scope=age`의 성별 버튼·연령대 필터·색상 (원본 PR #443 HERO 불변)
- 상태: FEATURE BRANCH IMPLEMENTED / QA PENDING / NOT DEPLOYED
- 사용자 지시 (2026-11-27): "남자대표팀, 여자대표팀의 버튼 양식이 다른 페이지와 달라 ... 비교해서 ... 고쳐, 여자의 색상도 있다는거 잊지말고"

## 동일 기준 확인
- 국가대표팀 홈 `assets/css/national-team-home-v2.css`: 2버튼 segmented, 컨테이너 `#e7edf3`, 둥근 10px, 버튼 7px, 14px 800, 높이 최소 42px (모바일 39px/12px), 선택 배경 `var(--team)`. 남자 `#234e83` / `#edf4fb`, 여자 `#8e315e` / `#fff1f6`.
- 연령별 페이지 PR #443에서는 성별 버튼에 2px 골드 외곽선, 어두운 그라데이션, ♂/♀ 장식글리프, 고정 네이비 선택 배경이 중복 적용됨. 여자부 선택 시에도 age-level 및 요약 강조색이 네이비에서 바뀌지 않는 불일치.

## 변경
1. `assets/css/national-age-history-v1.css`: 성별 세그먼트 버튼의 크기, 배경, border radius, 폰트와 모바일 규격을 대표팀 홈과 동일 규칙으로 맞춤. 선택된 여자부는 로즈 `#8e315e`; 남자부는 `#234e83`. 골드 그라데이션·테두리·아이콘 삭제.
2. `assets/js/national-team-history.js`: `document.body.dataset.gender`를 실제 선택값과 동기화. `aria-pressed`·URL 검색 파라미터·데이터 범위는 기존 방식 유지.
3. U16~U23 칩, 숫자 KPI, 오류/미구축 안내, 링크 및 상세명단 강조에 같은 `--team` 사용. 그림·대회 정보·선수 기록·원장·히스토리 딥링크 변경 없음.
4. `national-team-history.html`: CSS 버전 키 교체로 배포 후 이전 장식 버튼 캐시를 방지.
5. 테스트: node/jsdom 기존 회귀 + 실제 PC/모바일 Chromium에서 국가대표팀 홈 버튼의 computed style과 연령별 버튼의 선택 배경·폰트·radius·padding·높이·컨테이너 배경 직접 비교. 여자부에서는 로즈 KPI/연령대/안내 색상을 확인하고 스크린샷 추가.


- 성별 변경 시 대표팀 홈의 포지션 필터 초기화와 같은 원칙으로 연령대 선택을 `전체`로 되돌리고 URL의 `level` 파라미터를 제거함. 특히 모바일에서 U23까지 가로로 이동한 뒤 성별을 바꾸면 전체 버튼이 보이도록 연령대 스크롤 위치도 맨 앞으로 초기화함. 공유/직접 방문 시 명시된 `gender`/`level` 딥링크는 초기 로드에서 그대로 지원.
- CSS뿐 아니라 JS도 새로운 쿼리 버전으로 갱신해 캐시된 스크립트 때문에 여자부 색상이 네이비로 남는 문제를 차단함.

## 배포 보호
- 변경 대상: CSS, 연령별 JS, HTML 캐시 버전, 테스트, 문서에 한정. HERO SVG/가로세로 비율 및 CTA, 연령별 데이터·선수 ID, 국가대표 홈, 로드맵, 경기 점수, 사용자 메모, Supabase 불변.
- 공식 MASTER 직접 대조: NOT VERIFIED (원본 읽기/쓰기 변경이 없는 스타일 변경).
- CI 및 실제 배포 증거는 PR 코멘트로 이어서 기록.
- 복구: 본 PR 단독 revert, 선수/시즌 결과/회원 데이터 되돌리지 않음.
