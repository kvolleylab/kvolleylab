# 국내대회 기본 템플릿 가독성·트로피 수정 — 2026-10-25

Status: APPROVED / IMPLEMENTED / VERIFIED. 배포 결과는 release PR에 기록한다.

## 기준과 범위

- Base main: `3a187f09f0d4f8a8bf72d6abc48367208cdb03e4` (최신 main 확인).
- 고성·단양 남녀부는 이미 동일 `domestic-home-v2` 공통 presentation을 사용한다. 이번 사용자 요청은 운영 적용된 기본 템플릿의 가독성 수정이다.
- 기존 국내대회 템플릿 Site의 동일 source/project를 업데이트한다. 새 시안을 만들거나 대회 JSON을 변경하지 않는다.
- 경기/학교 원장 재수집·교차검수는 이번 UI 작업 범위 밖이다. 기존 source 값과 팀 링크를 유지했다.

## 변경

- 달력 연도는 첫 날짜 열의 텍스트 시작점에 맞추고, 월은 날짜 격자 정중앙에 고정한다. 이전·다음 버튼은 오른쪽이다.
- 상단 메뉴 PC 16px / 모바일 12px, 남녀 전환 PC 15px / 모바일 14px. 모바일 긴 메뉴는 가운데 정렬로 줄바꿈한다.
- overview 참가대학 로고/이름을 participants와 동일하게 PC 48px/14px, 모바일 38px/12px로 맞춘다.
- 경기일 hover/focus는 2px/3px 내부 테두리로 표시해 인접 날짜에 가려지지 않는다.
- overview 순위와 최종 1~4위 카드에 학교/대학 허브와 동일한 금·은·동 SVG 트로피를 사용한다. PC의 기존 CSS 메달 원형/리본/가상 순번 장식도 제거한다. 공동 3위는 두 개의 동색 트로피로 유지한다.
- 공통 JS/CSS만 수정하고 세 진입 HTML의 해당 asset 버전만 갱신한다. 공통 데이터 엔진·사다리·순위 계산·조편성·학교 상세 경로는 그대로다.

## 검수

- 기존 `tests/domestic-home-v2.test.cjs` 5/5 통과: 고성/단양 남녀 데이터, 조 편성, 학교 링크, 대진표 HTML 보존 및 미적용 국제대회 영향 없음.
- production/preview JavaScript 구문 검사, git diff whitespace 검사 통과.
- PC 1363px, 모바일 iframe 390px/360px/680px: 가로 넘침 없음(문서 1348/375/345/665px와 scrollWidth 동일), 모바일 6개 탭 글씨 잘림 없음.
- PC/모바일 달력 월 중심과 날짜 격자 중심 오차 0.02px 미만. 연도 텍스트 시작과 첫 날짜 숫자 시작 오차 1px 미만.
- 참가대학 로고/이름 computed size가 overview/participants 두 화면에서 일치한다.
- 6/25 클릭 → 6경기 상세 및 세트 점수 확인 → Escape 복귀. hover/focus에 outline 0px, inset shadow 3px 확인.
- 최종순위 실제 SVG 4개, 순위 1/2/3/3 확인. PC 가상 메달 before/after content:none 및 투명 배경 확인. 사다리 경로는 기존 DOM integration 검사로 보존 확인.
- Local HTTP 검수용 `dist` 복사본에만 production:false를 사용한다. 원본/커밋 HTML은 production:true이며 기존 HTTPS 계약 검증을 유지한다. 검수 harness/dist는 운영 커밋에서 제외한다.

## 화면

- [PC overview](domestic-template-pc-20261025.jpg)
- [모바일 메뉴·달력·최종순위](domestic-template-mobile-20261025.jpg)
- [PC 최종순위](domestic-template-pc-final-20261025.jpg)

## 복구

이번 presentation PR을 revert하면 이전 v2 디자인으로 돌아간다. 데이터/설정 migration은 없다. 기존 structure.presentation opt-in 4개는 변경하지 않았다.
