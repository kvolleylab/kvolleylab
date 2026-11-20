# K-Volley Lab · 팀찾기 HERO 홈 이미지 동기화 v1

**검증 상태:** 사용자 요청 반영용 브랜치 코드 작성. CI와 실제 운영 HTTPS 결과는 각각 확인 후 기록.

## 적용 기준
- 홈 `index.html`의 현재 HERO 이미지를 그대로 공유: PC `/assets/img/home-hero/kvl-home-hero-pc-v01.webp?v=20261015-home-hero-v01` 및 모바일 680px 이하 `/assets/img/home-hero/kvl-home-hero-mobile-v01.webp?v=20261015-home-hero-v01`.
- 두 파일은 GitHub `main`에 실제 존재한다. 새 이미지 파일을 생성하거나 홈 이미지를 수정하지 않는다.
- `teams.html` `.ktd-hero`는 원래 이미지 없는 텍스트 영역이었다. 해당 상단 HERO만 홈의 `right center/cover` 배경, PC 최소높이 318px·모바일 264px, 어두운 배경의 흰 제목 및 밝은 설명을 따르도록 한다. 기존 카드 컨테이너 안의 둥근 모서리와 팀찾기 제목·문구는 그대로 유지한다.
- `index.html` / 홈페이지 다른 카드 및 전역 메뉴 / `teams.html` 본문 필터·명단·로고·클럽·국가대표 선수 데이터·KOVO/회원 로그인은 수정하지 않는다.
- `teams.html` CSS 참조만 `20261120-home-hero-v1`로 갱신해 이전 캐시가 남지 않도록 한다.

## 소스와 영향 범위
- 검증 전 기준 운영 main: `2929efbf1149d914acd017cb5f0be0c057d5c7e3`.
- 참조: `AGENTS.md`, `PROJECT_RULES.md`, `DESIGN_SYSTEM.md`, `docs/DEVELOPMENT_WORKFLOW_v1.md`, `docs/KVL_DECISION_LOG.md`, 운영 홈 `index.html`, `assets/css/kvl-teams-directory-v1.css`.
- 수정 파일: `assets/css/kvl-teams-directory-v1.css`, `teams.html`, `tests/teams-directory-v1.test.cjs`, `tests/teams-directory-browser-qa-v1.cjs`, `tests/teams-directory-live-qa-v1.cjs`, `docs/KVL_DECISION_LOG.md`, 본 문서.
- 공식 선수·대회 원본/Google Drive MASTER **재대조 NOT VERIFIED**. 이번 변경은 기존 홈 이미지를 참조하는 CSS만 변경하며 원본 자료 내용 변경은 없다.

## 테스트 계획
- `node --test tests/teams-directory-v1.test.cjs`: 홈 CSS와 팀찾기 CSS에서 두 WebP 자산 경로 동일, 자산 실제 존재, 캐시, 필터·팀 본문 유지.
- `tests/teams-directory-browser-qa-v1.cjs`: 실제 Chromium 1440px/390px/360px에서 CSS backgroundImage가 홈의 PC/모바일 이미지 각각을 가리키는지 및 `Image.decode()` 성공, `background-size:cover`, 흰색 제목, overflow=0. 이후 기존 남녀 KOVO 7개 구단/선수명단·대학·중고·대표팀·국제 40개국 이동 및 로그인 보존 회귀.
- `tests/teams-directory-live-qa-v1.cjs`에 **배포된 CSS에서 홈 WebP 두 자산 경로 확인 후** live QA를 실행하는 준비 게이트 추가. 운영 https://kvolleylab.com/teams.html 의 PC1440·모바일390에서 실제 background CSS 이미지 URL과 WebP `Image.decode()`, cover, 흰색 제목, 가로 넘침 없음 확인. 현재 회원 오버레이는 QA 내에서만 격리하고 운영 설정은 변경하지 않는다.
- 배포가 실행된 경우 GitHub Pages 동일 commit SHA SUCCESS와 위 실운영 브라우저 검사 결과를 각각 확인한다.
- 복구: 이 PR의 Team Finder HERO CSS와 캐시 및 QA/문서 변경만 revert. 홈 WebP 원본·KOVO 경기·선수 MASTER·회원 접근은 되돌리지 않는다.
