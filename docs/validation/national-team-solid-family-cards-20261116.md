# 대표팀 출전대회 카드 대회별 단색 강조 — 2026-11-16

Status: USER CORRECTION / IMPLEMENTED IN ISOLATED BRANCH / SOURCE QA VERIFIED / NOT DEPLOYED.

## 사용자가 바로잡은 디자인 의도

2026-11-16 PR #339에서 운영에 적용한 '얕은 연녹색 그라데이션' 해석은 사용자 의도가 아니었다. 사용자 최신 지시대로 **기존 카드의 맨 위에 보였던 대회군 고유 색상으로 카드의 대회 정보 영역 전체를 단색으로 채우고, 별도의 굵은 상단 색 띠를 없앤다.**

- `AVC` 카드 (AVC 컵, 동아시아선수권, AVC 대륙선수권): 기존 `--family: #176638` 진녹색.
- `ASIAN GAMES` 카드 (아이치·나고야): 기존 `--family: #8c2934` 붉은색.
- 색 채우는 영역: `.tournament-top`과 `.tournament-main` 전체, 즉 대회군·종료 상태·대회명·기간·장소·최종 순위를 포함한다.
- 기존 `border-top:3px solid var(--family)` 제거. 1px 중립 카드 테두리만 유지한다.
- 단색 배경에는 흰색 제목·날짜·장소·성적 글씨 및 흰색 반투명 상태 배지·성적 구분선으로 명도 대비를 유지한다.
- 마우스 올림 및 키보드 초점 시 정보 영역 전체가 브랜드 골드 `#d6b25e`로 변하고 글자는 진한 남색 `#1b3047`이 된다. 기존 금색 카드 테두리 hover도 보존한다.
- **아래 `.qualification-note`/ `.tournament-links`는 흰 배경을 유지한다.** 아시아선수권의 기존 연노랑 출전권 메시지(`.gold`)도 유지한다.
- 남녀·PC·모바일에 같은 조건부 스타일. 기존 2026 대회 데이터, 성적, 순위, 링크, 전환, 명단 및 데이터 소스 불변.

## 변경 범위

Base `0cc1e348d06cca495b6593b111e9a9ad4ac0b7fd` (PR #339 2026-11-16 운영 병합 및 Pages 배포 성공).
Branch `fix/national-team-solid-family-cards-20261116`.

- `assets/css/national-team-home-v2.css`: 기존 3px 상단 고유색 테두리 제거, PR #339의 녹색 그라데이션 교체, 두 대회군 단색·텍스트 대비·hover/focus 적용.
- `national-team.html`: CSS 캐시 무효화를 위한 쿼리 버전 변경.
- 검증 보고서 및 `docs/KVL_DECISION_LOG.md` 업데이트.

JS 렌더러, `data/national/national-team-home-v2.json`, 전체 선수 DB, MASTER, 경기 결과, 공통 헤더, Draft Hub, KOVO 공시 및 V-리그 자동화는 변경하지 않는다.

## 정적 검증

관련 코드·원본 데이터 정적 체크 **18/18 PASS**:
1. 기존 AVC/Asian Games family 색 유지, 상단 3px accent 제거.
2. 연한 그라데이션 CSS 제거 및 동일한 단색을 정보 영역 두 구역에 적용.
3. 제목·기간·개최지·순위의 흰색 텍스트 대비, 결과 구분선 및 종료 배지.
4. gold hover 및 focus-within, 골드 상태의 진남색 텍스트.
5. 출전권 안내·아래 링크의 분리된 흰색 영역.
6. `avc/games` 대상 한정, 남녀부 공통 렌더러, HTML CSS 캐시 갱신.
7. 기존 실제 남자 AVC컵 장소 '인도 · 아마다바드'·2위, 남자 아시안게임 7위, 여자부 아시안게임 존재 확인.
8. CSS brace count 및 글로벌 테마에서 직접 충돌하는 `.tournament-*` 규칙이 없음을 확인.

WCAG 계산 참고: 흰 글자/AVC green `7.01:1`, 흰 글자/Asian Games red `8.46:1`, 진남색/골드 hover `6.66:1` (본문 일반 크기 기준으로 4.5:1 이상).

미실시: 실제 1440/390/360 픽셀 브라우저 스크린샷, 실기기 키보드/hover 실행, 운영 실시간 HTTP read-back, 배포. 실행하지 않은 항목은 VERIFIED로 표현하지 않는다.

## 릴리스/복구

AGENTS.md에 따라 사용자의 **별도 운영 반영 승인 후** PR 병합한다. GitHub Pages 배포 성공 및 운영 페이지에서 AVC 단색 green, Games 단색 red, gold hover, 하단 출전권 안내 및 PC·모바일 표시를 확인한 뒤 DEPLOYED로 갱신한다.

회귀 시 이 PR만 되돌리는 새 PR을 사용한다. 선행 PR #339의 Draft Hub 목록 기본값과 나머지 기능은 계속 유지한다.
