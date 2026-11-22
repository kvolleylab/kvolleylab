# 국제 국가대표팀 선수명단 PC 글씨 -2px v2 · 2026-11-19

**상태:** 사용자 요청 / 작업 브랜치 검증 후 운영 배포 대상. 코드·QA 결과와 배포 사실은 각각 별도로 기록한다.

## 요청·기준
- 직전 운영 반영 PR #368 사용자 실제 화면 검수 후 "2px씩 낮춰" 요청.
- 기존 PC 통합 선수명단 및 개별 대회명단의 **이름 24px → 22px**, **영문 이름·번호·생년월일·POS·신장·소속팀·Volleybox·표 헤더 21px → 19px**.
- PC 구분 `min-width:821px` 유지. 대회 카드 레이아웃/색점 참가 이력/8개 표 필드/내부 가로 스크롤/기존 높이와 카드 크기, 820px 이하 모바일 스타일 변경 없음.
- `teams.html` CSS 캐시 키 두 개만 `20261119-2` → `20261119-3`. 선수 원본, KOVO 수집·발행, 회원 인증·개인 정보, 국제/프로 명단 JS 변경 없음.

## 운영·출처
- 기준 main `eb43ed1f6cacf2507076547c6aa9d04c2a5e4f91` (PR #368 배포 완료).
- `AGENTS.md`, `PROJECT_RULES.md`, `DESIGN_SYSTEM.md`, 개발 워크플로, `docs/KVL_DECISION_LOG.md`, 최신 PC 컴포넌트, 기존 Chromium QA 확인.
- 현재 게시 명단 및 선수 identity는 이전 출처 검증 결과만 재사용. 이번 스타일 변경에서 Google Drive 원문 대조 **NOT VERIFIED**; 데이터 변경 자체 없음.

## 검증 절차
- `tests/international-unified-roster-browser-v1.cjs`: PC 1440과 900에서 computed CSS 글씨 정확히 22/19px 및 900px 내부 표 스크롤/전체 문서 overflow0; 대회별 원본명단도 22/19px; 일본 2026 남자 26명/대회별 16·12·14/원형 참가 이력/Volleybox/내부 프로필/검색·필터; 모바일 390/360 기존 구조. 기존 프로팀 회귀.
- 국가별 명단·팀 디렉터리 CI, 품질 감사 공개 JSON 검증 gate 확인.
- 브랜치 QA → PR → 사용자 최근 운영 검수 요청에 따른 병합 → GitHub Pages 동일 SHA 성공 → 실제 https://kvolleylab.com/teams.html?category=international&gender=men&country=JPN&year=2026 운영 QA 순으로 확인.
- 기존 정상 배포 `eb43ed1f6cacf2507076547c6aa9d04c2a5e4f91` 복구 기준. 이 수정만 문제 발생 시 신규 PR의 변경 파일만 revert. 인증과 수집 데이터는 롤백하지 않음.

## 변경 파일
- `assets/css/kvl-international-unified-roster-v1.css`
- `assets/css/kvl-international-countries-v1.css`
- `teams.html`
- `tests/international-unified-roster-browser-v1.cjs`
- `docs/KVL_DECISION_LOG.md`
- 이 인계 문서.
