# K-Volley Lab Domestic Template v1

Status: FROZEN / APPROVED · UPDATED 2026-09-25  
Approved common state: `4c713eb83480a8526eb7922ca52171e93ec44d3d`  
Snapshot branch: `domestic-template-v1`

## Visual Source of Truth

Domestic Template v1의 최종 기준은 이제 **고성대회 production**입니다.

- Men: `/university-competition.html?gender=men&competition=university-goseong-men-2026`
- Women: `/university-competition.html?gender=women&competition=university-goseong-women-2026`

초기 prototype 기준점은 역사적 참고용이며, 현재 v1 판단 기준은 production 고성대회입니다.

## Purpose

Domestic Template v1은 K-Volley Lab 국내대회의 공통 visual/rendering baseline입니다.

새 국내대회는 대회별 HTML/CSS/JS를 새로 만드는 방식이 아니라, 공통 Competition Engine + Domestic Template v1에 대회별 data/config를 연결하는 방식으로 제작합니다.

## Scope

- Domestic competition hero/card system
- Men / women division theme handling
- Overview cards and monthly calendar
- Match schedule / results layout
- Team-specific match-results layout
- Pool standings layout
- Preliminary overall ranking (`예선 종합순위`)
- Final standings / knockout bracket
- Participating university/team cards
- Official resources
- Domestic regulation / competition-rule cards
- Domestic text-emblem fallback for teams without logo assets
- Initial render behavior
- Internal tab routing and men/women view synchronization

## Theme baseline

### Men
- Primary navy: `#163A5F`
- Text navy: `#17365D`
- Soft navy: `#EEF4F8`

### Women
- Primary pink: `#D2648F`
- Dark pink: `#A43F68`
- Soft pink: `#FFF2F7`
- Hero gold: `#FFE4A3`

## Confirmed v1 behavior

1. 경기일정과 팀명/팀로고 클릭 후 나오는 팀별 경기결과는 같은 match-row geometry를 사용합니다.
2. 국내대회 PC 경기행의 로고축·중앙 결과스코어축·세트스코어 영역은 공통으로 유지합니다.
3. 실제 4팀 결선은 `bracket-4`를 사용하며, 존재하지 않는 8강 칼럼을 만들지 않습니다.
4. 6강/8강이 필요한 대회는 기존 `bracket-8` 계열을 사용합니다.
5. 국내대회 최종순위의 사다리형 토너먼트에서 승자 팀명과 승자 팀의 획득 세트 수는 빨강 `#C62828`로 표시합니다.
6. 같은 토너먼트에서 패자 팀명은 기존 남색 계열을 유지하고, 패자 팀의 획득 세트 수는 Text navy `#17365D`로 표시합니다.
7. 토너먼트 카드 하단의 세트별 상세 스코어 라인은 기존 gold `#C9972E` 표현을 유지합니다.
8. 대회 내부 탭 이동은 같은 대회 안에서 페이지 전체 재로드 없이 전환합니다.
9. 남자부 ↔ 여자부 전환 시 현재 보고 있는 view를 유지합니다.
   - 경기일정 → 경기일정
   - 조별순위 → 조별순위
   - 최종순위 → 최종순위
   - 참가대학 → 참가대학
   - 공식자료 → 공식자료
10. 팀별 경기결과(`view=team`)에서 성별을 바꾸면 상대 성별의 경기일정으로 이동합니다.
11. 인위적인 page fade 전환은 사용하지 않습니다.
12. 고성 여대부처럼 준결승부터 시작하는 구조는 `bracket-4`로 표현합니다.
13. 국내대회 조별순위 페이지에는 조별순위 아래 `예선 종합순위`를 공통으로 표시합니다.
14. 예선 종합순위는 예선 경기의 실제 세트별 점수에서 자동 계산하며, 기준은 `승률 → 세트 득실비 → 점수 득실비`입니다.
15. 예선 종합순위는 공식 조별 진출 순위와 별개의 K-Volley Lab 산출 순위입니다.
16. 진출팀은 AVC 종합순위와 같은 의미 체계로 왼쪽 강조선과 맨 오른쪽 `진출` 배지를 표시합니다.
17. 조별순위 가독성 기준은 다음 값을 유지합니다.
    - PC: 헤더 12px / 팀명 17px / 순위 16px / 일반 수치 15px / 득실비 14px
    - Mobile: 헤더 13px / 팀명 17px / 순위 16px / 본문 16px / 득실비 14px
18. 예선 종합순위는 현재 확정된 확대 크기를 유지합니다.
    - PC: 헤더 13px / 팀명 17px / 순위 16px / 일반 수치 15px
    - Mobile: 본문 14px / 팀명 15px / 순위·수치 13px
19. 경기일정에서 팀명/팀로고를 클릭해 들어가는 팀별 경기결과 화면은 상단에 `전체 경기 / 승 / 패 / 승률` 4개 성적 요약을 크게 표시합니다.
    - PC: 4칸 가로 배열
    - Mobile: 2×2 배열
    - 진행 중인 대회는 완료 경기와 예정 경기 수를 보조 문구로 표시합니다.
20. 국내대회 팀별 경기결과 화면의 `등록 선수명단 보기`는 기존 대학 팀 상세의 선수명단 화면(`university-team.html?school=...&view=roster`)으로 연결합니다.
21. `참가대학` 페이지는 별도의 `등록선수명단 보기` CTA를 추가하지 않고, 기존 대학 카드 전체 클릭 방식과 기존 카드 디자인을 유지합니다.
22. 남대부 결선이 `6강 승자 + 준결승 직행팀` 구조인 경우, 준결승 직행팀은 일반 경기카드와 구분되는 공통 직행 카드로 표시합니다.
    - 상단: `조 1위 추첨 배정 (가)/(나)`
    - 중앙: 팀 로고 + 팀명
    - 하단: `★ 준결승 자동 진출`
    - 카드 외곽은 Gold `#C9A24A` 점선, 기본 경기카드와 동일한 12px 라운드를 사용합니다.
23. 같은 구조의 토너먼트 연결선 의미는 다음과 같이 고정합니다.
    - 6강 승리팀 → 합류점: 기존 navy 계열 실선
    - 준결승 직행팀 → 합류점: Gold `#C9A24A` 점선
    - 합류점 → 준결승, 준결승 → 결승: 기존 navy 계열 실선
    - 직행 표현을 위해 다른 공용 사다리선의 굵기·색상을 변경하지 않습니다.

## Production compatibility

`university-competition.html`은 Domestic Template v1 production wrapper입니다.

기존 고성 링크와의 호환을 위해 legacy view 값은 새 view로 변환합니다.

- `results` → `schedule`
- `group-standings` → `groups`
- `standings` → `knockout`
- `teams` → `rosters`
- `sources` → `resources`

## Freeze rules

1. 기존 국제대회 production과 국제대회 템플릿은 독립적으로 보호합니다.
2. Domestic Template v1에는 특정 대회만을 위한 CSS/JS 땜질을 추가하지 않습니다.
3. 새 국내대회는 가능한 한 data/config만 변경해서 생성합니다.
4. 여러 국내대회에 공통으로 필요한 개선만 v1 공통 템플릿 변경으로 인정합니다.
5. 구조나 디자인 방향이 크게 달라지면 v1을 덮어쓰지 않고 `Domestic Template v2`를 만듭니다.
6. `domestic-template-v1` 브랜치는 승인된 공통 템플릿 + 고성 production 기준의 rollback/reference snapshot입니다.
7. 단양대회 prototype의 대회별 data/config/hero assets는 v1 snapshot에 포함하지 않습니다.

## Reuse validation

**2026 단양대회 재사용 검증을 완료했고 production으로 승격했습니다.**

- Production route: `/university-competition-danyang.html`
- 기존 단양 legacy 전용 dashboard/bracket JS는 production route에서 제거하고 Domestic Template v1 공통 엔진을 사용합니다.
- 기존 legacy 페이지는 rollback/reference 용도로 `archive/university-competition-danyang-legacy-20260925.html`에 보관합니다.
- 이후 국내대회에서도 먼저 data/config 차이를 확인하고, 여러 대회에 공통되는 결함일 때만 Domestic Template v1 공통 엔진을 수정합니다.

## History

- Initial v1 baseline: `1d9e8dcdc9bc782c0b637a0ef5db9d6011db74aa`
- Production-approved Goseong state: `624a543bdd0df9b18cb38c801dcf17d0472f701c`
- 2026-09-23: 고성 production 승격 이후 공통 동작을 비교 검수하여 v1 기준 갱신
- 2026-09-25: 고성·단양 재사용 검증을 통해 예선 종합순위, 진출 표시, 조별순위/종합순위 가독성 기준을 v1 공통 규칙으로 승격
- 2026-09-25: 최종순위 사다리형 토너먼트의 승자 팀명·승자 세트 수 빨강, 패자 세트 수 남색 규칙을 v1 공통 규칙으로 승격
- 2026-09-25: 팀별 경기결과의 4칸 성적 요약과 선수명단 링크 동작을 v1 공통 규칙으로 승격. 참가대학 카드 디자인은 기존 상태 유지
- 2026-09-25: 고성·단양 공통 6강 구조의 준결승 직행 카드·금색 점선 진출 경로를 Domestic Template v1 공통 규칙으로 승격
- 2026-09-25: 단양대회 prototype 검증 완료 후 실제 production route를 Domestic Template v1 공통 엔진으로 승격
