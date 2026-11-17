# V-리그 선수명단 v2 · 신인 프로필·출신학교 운영 통합 검증 (2026-11-18)

Status: **IMPLEMENTED ON FEATURE BRANCH / SCOPED CI PASS / LIVE DEPLOYMENT NOT YET VERIFIED**.

## 목적과 범위
- 2026-27 V-리그 남녀 참가팀 14개 구단의 기존 `참가팀 → 선수명단`에 사용자 검수 v2 디자인(명단표 + 선수 상세 패널)을 직접 연결.
- 남녀부 전환·구단 선택·검색·정규리그 승점 조견표·인쇄·기존 관리자 추적선수/개인 메모·기존 로테이션/공통 메뉴를 유지. 다른 대회 공통 명단은 변경하지 않는다.
- [기준 main `69d4651a7331ac4d5f10e5034b1118e4da05799a`](https://github.com/kvolleylab/kvolleylab/commit/69d4651a7331ac4d5f10e5034b1118e4da05799a). 검수 PR [#355](https://github.com/kvolleylab/kvolleylab/pull/355). 충돌하는 오래된 PR #332를 병합하지 않고 검수된 데이터·구성만 추출했다.

## 데이터 연결과 무결성
- 최신 KOVO 공식 공시 게시 GitHub 자동화의 현재 명단 **남 149 + 여 138 = 287**을 보존한다. 신규 선수 추가/삭제/원본 `rosters.json` 쓰기는 하지 않는다.
- 검증된 공식 드래프트 34건, 공식 등록 32건, 기존 KVL Player ID 안전 연결 28건. 명단의 선수 이름·등번호·구단·`registrationSource`가 모두 일치하고 기존 번호와 충돌하지 않는 경우에만 브라우저에서 `playerId`를 연결한다.
- 사용자 승인에 따라 고등학교·대학교 별도 표기: 2026-27 드래프트 신청 PDF 남녀 117건 중 116명에서 적어도 하나의 학교 확인(고교 111·대학 59·모두 54). 등록된 32명 중 정확히 같은 applicant_id·이름·성별과 연결될 때만 보인다. 모르는 대학교를 공란·미확인 표로 채우지 않는다.
- 선수 프로필은 공식 등록이 현재 구단의 시즌 선수명단에 그대로 존재할 때만 등록팀으로 변경한다. 이전 대학/고등학교 이력, 원본 DOB, Player ID, 기존 소속 역사 보존. 이적/퇴단을 출처 없이 유추하지 않는다.
- 과거 대표팀 ID와 프로 MASTER에 서로 다른 선수가 동일 ID를 가진 26건 `KVL-P-001620`~`KVL-P-001645`은 명시적 `scope=pro|national`로 구분. 아무 문맥 없는 직접 URL은 두 사람 중 한 명을 선택하도록 하며, 충돌 선수는 개인 메모·즐겨찾기·비교 링크에서 잘못 섞이지 않도록 차단. **원장 중복 해결/프로필 ID 재할당은 하지 않음**.
- 자료 출처 공개 원장 `scripts/quality_audit/public-review-manifest.json`에 승인된 bridge, education 두 JSON SHA-256을 기존 파일과 병합해 보존. 민감 정보/Google Drive MASTER 쓰기 없음.

## 실제 검사
- `tests/vleague-roster-profile-integration.test.cjs`: 32/28 매칭, 현재 287명 및 경기/순위 보존, 윤경 남성고·인하대, 김아중 청수고(대학교 공란), 출처 변경 시 프로필 차단, 동일 ID 충돌 확인 및 **공통 프로덕션 대회 JSON 스키마 검증**.
- `tests/vleague-roster-v2-ui.test.cjs`: DOM 기반 로스터 선수 선택·구단 동적 인원·신인 필터·검색·학교 표시·28명 프로필 링크·문맥 선택·비 V-리그 화면 보존.
- `Player and Draft Integration`: 2026-10의 1,842명 고정/오래된 웹 쿼리 경로를 읽던 역사 검사를 최신 영구 ID/현행 프로 MASTER 검사로 교체. 원래 10월 이력 증거는 삭제하지 않고 보존. 관리자 회원 UI·드래프트 진입 경로 유지.
- `V-League Roster v2 Chromium Screenshots`: Ubuntu 24.04의 실 Chromium에서 PC1440/태블릿768/모바일390·360px, 윤경/김아중 신인 프로필·이력과 KVL-P ID 충돌 두 선수 스코프 확인; 브라우저 검수 실행의 상태·캡처 링크는 관련 Actions 실행에 기록한다. HTTP 로컬 주소가 프로덕션 HTTPS canonical 검증을 실패하게 한 테스트 설정 문제는 HTTPS origin 가상 라우팅으로 교정했다. **실제 PASS 및 화면 결과 확인 전에는 브라우저 QA 완료로 표시하지 않는다.**

## 영향받은 파일
- 추가: `assets/js/kvl-vleague-roster-v2.js`, `assets/css/kvl-vleague-roster-v2.css`, `assets/js/kvl-vleague-draft-bridge-v1.js`, `assets/js/player-id-collision-quarantine-v1.js`, data bridge 및 education 원장, 관련 테스트·CI.
- 수정: `competition-engine.html`, 공통 renderer/loader 단 조건부 삽입, `player.html`/`players.html`, player-detail/search/workspace, 국가대표 alias·히스토리, 비교함 및 관리자 프로필 메모 표시 보호.
- 불변: KOVO 기존 시간대별 팀 명단 수집 워크플로우, 게시 퍼블리셔/로스터 원본, 경기 DB, 점수/승점, Google Sheets MASTER, 기존 선수 영구 ID, Supabase 저장 메모.

## 배포와 복구 경계
본 문서 작성 시점에서 PR #355는 검수용 Draft이며 `main` 배포·공개 Pages 실제 확인은 별도 증거가 필요하다. 변경된 코드가 운영 반영된 이후 공홈 URL의 **남녀 구단 명단 → 신인 선택 → 프로필 → 두 학교** 경로를 PC/모바일에서 실증해야 한다. 운영 자료 또는 새로운 경기 자동화 자체는 건드리지 않는다.

원복: PR #355의 변경 파일만 revert. 생성된 원본 KOVO 최신 선수명단/경기 점수/선수 ID를 이전 시즌 파일로 덮어쓰지 않는다. 추가 확장: Issue #331 비신인 이적·학적 표기, #334 26개 영구 ID 원장 이관.
