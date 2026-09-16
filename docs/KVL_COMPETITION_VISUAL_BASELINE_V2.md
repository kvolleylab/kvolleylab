# K-Volley Lab Competition V2 공통 렌더링 엔진 · Visual Baseline Rule

## 2026-09-16 기준
공통 엔진의 시각 기준은 새로 설계하지 않는다.

**Visual Source of Truth는 사용자가 이미 PC 1180px / 모바일 390px·360px에서 검증 완료한 AVC 남자·여자 production 페이지다.**

- `international-competition-avc-men-continental-2026.html`
- `international-competition-avc-women-continental-2026.html`

공통 Shell / Component Renderer는 위 production에서 검증된 DOM/class geometry를 재사용해야 한다.
대회별 adapter는 데이터 normalize만 수행하며 카드 HTML·순위표 HTML·토너먼트 HTML·참가국 HTML·공식자료 HTML 또는 대회별 geometry CSS를 만들지 않는다.

## 공통 컴포넌트 시각 기준
- 월간달력: AVC production calendar class/geometry
- 경기일정: `kvl1180-schedule-*`, `kvl1180-date-*`, `kvl1180-match-*`
- 순위: `kvl1180-pool-*`, `kvl1180-combined-*`, 모바일 `kvl-shared-combined-*`
- 최종순위: `kvl1180-final-*`
- 토너먼트: `kvl1180-bracket-*`, `kvl1180-round-*`, `kvl1180-match`
- 참가국: `kvl1180-participant-*`
- 공식자료: `kvl1180-source*`

## 대회 차이 처리
대회 차이는 geometry가 아니라 data/schema와 theme으로만 처리한다.
- AVC 남자: Green
- 모든 여자대회: Rose
- FIVB 남자: Purple
- 국내 남자: Navy
- standings: `pools-combined | single-league | none`
- knockout: `bracket-8 | none`
- participants: `groups | flat`
- roster: `full | link-only | none`

## 검증 원칙
1. AVC 남자 Shared Engine 검증페이지가 기존 AVC 남자 production과 동일한지 먼저 확인한다.
2. AVC 여자 Shared Engine 검증페이지가 기존 AVC 여자 production과 동일한지 확인한다.
3. 이후 VNL 남자에 동일 geometry가 유지되고 데이터/테마만 달라지는지 확인한다.
4. 차이가 발견되면 대회별 파일을 수정하지 않고 공통 Shell / Renderer / CSS에서만 수정한다.
5. 교차검증 완료 전 production 페이지는 교체하지 않는다.
