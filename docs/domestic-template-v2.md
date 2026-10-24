# Domestic Template v2 — Home presentation

2026-10-24 사용자 운영 반영 요청에 따라 홈 디자인과 승인된 국내대회 시안을 공통 Competition Engine v2 위에 적용한다.

## 적용 범위

- 고성·단양 2026 남대부/여대부, 총 4개 config만 `structure.presentation: domestic-home-v2`로 선택 적용한다.
- 기존 wrapper URL, competition ID, 원본 data.json, 경기/순위 계산, 팀 상세/선수명단 링크는 변경하지 않는다.
- 공통 loader의 선택적 후처리 훅과 독립 CSS/JS를 사용한다. 기존 domestic v1 엔진을 복제하지 않는다.
- 국제·프로·U리그·종합대회 및 CBS의 데이터와 표시 설정은 변경하지 않는다.

## 화면 규칙

- 홈과 이어지는 밝은 배경, 남자 네이비/여자 로즈, 기존 성별 메인 이미지.
- 한눈에 보기: 참가대학/등록 경기/예선 조 편성 카드는 기존 해당 view로 이동하는 전체 영역 링크. 경기일 달력, 최종순위, 참가팀 요약.
- 달력 경기일 선택: 실제 경기와 세트별 점수, 일정 페이지 링크. 키보드/네이티브 dialog 지원.
- 참가대학: 실제 조편성이 있으면 조별 묶음 + 조 내 가나다순. 조편성 없는 대회는 전체 가나다순. 기존 대학 상세 경로 유지.
- 최종순위: 공통 엔진의 사다리, 부전승, 최종순위/예선 종합순위 계산 유지. 좁은 화면에서도 사다리를 유지하고 대진표 영역만 가로 스크롤.
- 인쇄는 기존 렌더러를 사용한다.

## 운영 및 롤백

기존 domestic-template-v1.md의 데이터/진출/색상 의미/선수명단 계약은 계속 적용한다. 여기서 명시한 홈형 화면 배치와 모바일 사다리만 v2 규칙이 우선한다.

롤백은 4개 config의 presentation 속성을 제거하면 된다. 미선택 대회에는 훅이 아무 DOM 변경도 하지 않는다.

원본 시안: https://kvl-domestic-home-v1.blackisle17.chatgpt.site
검수: docs/validation/domestic-home-v2-20261024.md
