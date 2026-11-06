# 대학배구 허브 개편 검수 · 2026-11-06

## 범위와 승인

- 기존 주소: `https://kvolleylab.com/university-competitions.html`
- 기준: `prototype/university-international-hub-v1-20261106`의 대학 프로토타입과 후속 승인된 좌측 HERO / 우측 네이비 최종순위 배치.
- 사용자 최신 지시: 고성·단양 제목 두 줄, U-리그 남자부 제목 단순화, 준결승 결과·결승 안내 제거 후 실제 홈페이지 반영.
- 최신 main base: `cbedc3ea03864e9ca264fdcba9cd3ab614f8c777`.
- Google Drive `KVL_운영원칙_MASTER_v18` 확인. 이번 작업은 표시 개편이며 결과 데이터의 공식 출처를 재수집/변경하는 작업이 아니다.

## 구현

- `university-competitions.html`: 기존 공통 메뉴, main HERO, 주소와 하단 유지. 6종류 → 연도별 대회 → 과거 기록 구조 연결.
- `assets/css/university-hub-years-v1.css`: 대학 허브 내부에만 적용. PC 좌측 이미지와 우측 남녀 순위, 네이비 바탕, 모바일 세로 배치. 공통 밝은 테마가 날짜/개최지 글자를 어둡게 바꾸지 않도록 범위를 좁혀 보정.
- `assets/js/university-hub-years-v1.js`: 기존 `university-index-2026.json`와 각 대회 config를 읽는 표시 어댑터. 기존 링크/이미지/순위값 재사용. 문구 변경은 U-리그 남자 카드 표시에서만 수행한다.
- 기존 대회 JSON, Engine V2, 공유 메뉴/스타일, 다른 허브 및 자동화는 변경하지 않는다.
- 기존 미등록 연도는 준비 중으로 표시한다. 기존 registry의 U-리그 `active` 상태도 그대로 읽는다. 순위/상태 데이터 최신성 검수나 수정은 이 릴리스 범위가 아니다.

## 검수 결과

- `node --check assets/js/university-hub-years-v1.js`: PASS.
- `node tests/university-hub-years.test.cjs`: PASS. 3개 대회 공식 자산/실제 경로, 남녀 순위 24건 동일, 원본 객체 불변, 요청 문구/제목 2줄, 빈 순위/HTML escaping 확인.
- `git diff --check`: PASS.
- 실제 운영 공통 CSS/JS와 함께 로컬 브라우저 검수: PC 콘텐츠 viewport 1348px, 모바일 frame 390px/360px(스크롤바 제외 375px/345px). 가로 넘침 0.
- PC 3개 카드 높이 238px, 오른쪽 배경 `rgb(27,34,58)` 확인. 고성·단양 제목 정확히 두 줄. U-리그 남자 제목/불필요 안내 제거 확인.
- 모바일 이미지 상단과 남녀 순위 세로 배치, 360px에서도 제목 두 줄 확인.
- 대회종류 선택 → 해당 1개 대회, 연도 2025 전환 → 준비 중, 전체 대회 보기 → 2026 3개 복원, 모바일 메뉴 열기/닫기, PC 과거 기록 펼치기 확인.
- 보호 대상 데이터/Engine 파일 변경 없음. 신규 데이터 검수는 수행하지 않음.

## 배포와 복구

작업은 `feature/university-hub-publish-20261106` PR로 병합한다. 로컬 검수는 배포 완료의 증거가 아니며, 병합 후 해당 커밋의 GitHub Pages 실행 성공과 운영 URL을 확인한다.

복구: 이 릴리스의 squash commit을 revert하여 기존 HTML 참조와 허브를 복구한다. 데이터/config/Engine은 변경하지 않았으므로 데이터 복구는 필요하지 않다. 기존 대학 허브 CSS/JS는 삭제하지 않는다.
