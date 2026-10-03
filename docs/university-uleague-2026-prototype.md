# 2026 KUSF 대학배구 U-리그 — Competition Engine V2 프로토타입

작성: 2026-10-02 · 2026-10-03 정식 승격 · 기존 테스트 프로토타입은 회귀검증용으로 유지

## 정식 승격 경로 (2026-10-03)

- 남대부: `/competition-engine.html?competition=university-league-men-2026`
- 여대부: `/competition-engine.html?competition=university-league-women-2026`
- 두 정식 경로는 `data/competitions/`의 새 데이터로 작동합니다. 아래 테스트 프로토타입은 보존합니다.
- 여대부 검증 완료 18경기 / 남대부 검증 완료 예선 49경기. 남대부 남은 18경기 결과와 여자부 개별 세트별 점수는 계속 검수 대상입니다.
- 승인한 남녀부 PC/모바일 Hero를 각각 유지합니다. 대학대회 상단 U-리그 featured 소형 카드는 남자부 모바일 Hero를 정식 config에서 동적으로 가져옵니다.
- 국내 304명 선수 Snapshot은 정식 데이터 폴더에 보존하지만 대회 페이지 자체에서 중복 게시하지 않고 국내 선수 페이지 정비 후 연결할 예정입니다.
- 공개 공식자료에서는 개인 Drive 링크를 제거하고 KUSF·KUVF 공식 게시물/일정 링크만 사용합니다.

## 프로토타입 URL

- 남대부: `/tests/competition-page-v2-config-smoke.html?competition=university-league-men-2026-prototype`
- 여대부: `/tests/competition-page-v2-config-smoke.html?competition=university-league-women-2026-prototype`
- 동일한 테스트용 Competition Engine V2 로더를 사용한다. 대회별 HTML/CSS/JS를 새로 만들지 않는다.

## 데이터 및 화면 기준

- Visual Source of Truth: 고성·단양 국내대회 Production이 검증한 Domestic Template v1, Competition Engine V2.
- 경기 총 85경기 = 남대부 67경기(예선 49·6강리그 15·준결승 2·결승 1) + 여대부 18경기(예선 15·준결승 2·결승 1).
- 남대부는 GitHub에 저장된 검수 완료 예선 49경기의 세트별 결과를 사용한다. 공식 8월 18일 6강 대진 공지로 15경기의 상대/장소/시간을 정정했다(77번 11시). 6강·준결승의 경기별 최종 스코어는 아직 이 프로토타입에서 **검수 중**, 미확인 점수를 임의로 채우지 않는다.
- 여자부 예선 15경기와 결선 3경기는 KUSF 공식 일정·결과에서 실제 매치 승패와 세트스코어를 확인했다. 61번은 6월 13일 15:00 목포대, 68번은 9월 5일 15:00 단국대, 준결승 75·76번은 9월 12일, 결승 82번은 **9월 17일 15:00 인하대**로 정정했다(당초 대회 일정표의 9월 19일 결승은 변경 전 날짜). 세트별 개별 득점은 추가 검수 전까지 공개 데이터에 넣지 않는다.
- 여자부 공식 예선 승점 14/10/9/6/6/0, 우승 광주여대·준우승 우석대·공동 3위 경일대/목포과학대.
- 선수명단 Snapshot: 기존 Drive `2026_KUSF_U리그_선수명단_MASTER_검수중.xlsx`를 변경 없이 읽어 남대부 229명(15팀)·여대부 75명(6팀)을 각각 `rosters.json`에 생성했다. v3에서 누락된 남대부 1명은 v2 근거로 복원했으나 재검수가 필요하다. 6건의 검수 충돌은 Drive 검수충돌 시트와 비교 후 확정해야 한다.
- 남자부 전용 메인카드는 승인된 **네트·상대선수 없는 리시브 장면**을 PC 2108×406, Mobile 1258×406 WebP로 사용한다. 여자부 전용 메인카드는 승인된 **핑크 유니폼 12번 선수의 두 팔 다이빙 디그 + 핑크 경기장**을 PC 2108×406, Mobile 1258×406의 별도 WebP로 사용한다. 각 성별은 별도 `hero.pcImage` / `hero.mobileImage`에 연결하고 원본 인물의 동작·색감을 유지한 채 메인카드 비율로 구성한다. 기존 대학배구 허브 메인카드와 Production featured 소형 카드는 변경하지 않는다. 프로토타입이 Production으로 승인·이관될 때만 featured 소형 카드는 해당 성별 대회의 모바일 히어로 소스를 참조하도록 연결한다.

## 경기일정 점수 / 여대부 순위 카드 개선 (2026-10-03)

- 별도 U-리그 화면 템플릿은 만들지 않았다. 국내대회 기본 템플릿 v1 + Competition Engine V2의 `single-league` 구조 옵션을 사용한다.
- 여대부 18경기는 KUSF 공식 자료의 최종 세트스코어(`3-0`, `3-2` 등)를 보유하고 있다. 공통 경기행에서 이를 중앙 Gold로 항상 렌더링한다. `score.sets=[]`인 경기는 검증되지 않은 세트별 득점을 임의 생성하지 않고 `세트별 득점 확인 중`을 함께 표시한다.
- 남대부는 예선 49경기의 개별 세트 득점이 검증돼 있으며, 6강 이후 18경기의 공식 개별 경기 결과는 여전히 추가 검수 항목이다. 미확인 결과를 `3-0` 등으로 채우지 않는다.
- 여대부 예선 순위의 모든 6개 학교는 학교명/학교 전체명을 순위 데이터 자체에도 넣었다. 공통 `is-text-only` 렌더 방식으로, 엠블럼이 없는 팀은 PC/모바일에서 빈 엠블럼 칸 대신 팀명에 전체 공간을 할당한다.
- 공통 `single-league` 순위 카드의 폰트 크기는 아시안게임 `예선 종합순위`와 PC·모바일에서 동일하게 적용한다. 기존 AVC/VNL 프로덕션과 고성·단양의 완성된 대회별 HTML은 수정하지 않는다.
- 순위 변동/동률 처리는 공식 KUSF 순위 데이터를 우선한다. 여자부 5·6위는 결선 진출 배지가 아니라 `예선 종료`로 명시한다.

## 중요: 공통엔진 선수명단 UI 후속 작업

현재 Domestic 공통 컴포넌트는 `roster.mode=none`인 고성·단양 기준으로 참가대학 클릭 시 `university-team.html`로 이동하고, 국내대회의 자체 `roster.mode=full` 데이터가 존재해도 내부 로스터 컴포넌트를 표시하지 않는다.

본 프로토타입은 두 성별의 **304명 실제 Snapshot을 로더의 `rosters` 모듈로 준비**했지만 참가대학 화면에서 이 Snapshot을 직접 보여주는 기능은 공통 UI 개선 전까지 미완료다. 추후 Domestic `roster.mode=full`을 공통엔진의 선택적 기능으로 개발하고, 고성·단양/AVC/VNL 회귀검증을 거쳐야 한다. 임시 대회 전용 JS나 별도 HTML로 땜질하지 않는다. 검수되지 않은 충돌 선수 정보를 Production 선수 MASTER에 덮어쓰지 않는다.

## 근거

- KUSF 공식 여대부 예선·플레이오프 경기결과: `https://kusf.or.kr/league/league_schedule.html?e_code=18&l_code=261&l_year=2026` 및 `https://kusf.or.kr/league/league_schedule.html?e_code=18&l_code=280&l_year=2026`.
- KUVF 2026 U-리그 개최 공지: `https://kuvf.co.kr/31/?bmode=view&idx=170268484`.
- KUVF 2026 남대부 6강 확정 대진: `https://kuvf.co.kr/31/?bmode=view&idx=173194129`.
- U-리그 공식 경기일정표 및 대회요강: 기존 Google Drive 2026 KUSF 대회 폴더.

## Production 보호

- 위 제한은 초기 프로토타입 제작 시점의 원칙이었습니다. 2026-10-03 사용자 승인에 따라 정식 Competition Engine 라우트와 국내대회 허브에 승격했습니다. 기존 AVC·VNL Production은 보호합니다.
- 두 Prototype의 PC/모바일 화면, 남녀 전환, 85경기 수, 현재 순위, 그룹·달력·결선 구조, 선수명단 UX는 실제 브라우저에서 사용자가 직접 승인하기 전까지 **배포 완료로 선언하지 않는다**.
