# 2026 KUSF 대학배구 U-리그 — Competition Engine V2 프로토타입

작성: 2026-10-02 · **PROTOTYPE ONLY** · 홈페이지 production 자동 반영 금지

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
- U-리그 전용 메인카드는 사용자 승인 **네트·상대 선수 없는 리시브 장면**을 PC 2108×406, Mobile 1258×406의 별도 WebP 파일로 제작하여 남녀부 프로토타입의 `hero.pcImage` / `hero.mobileImage`에 연결했다. 승인받은 원본 장면의 구성·색감을 유지하고 이미지 위치만 메인카드 비율에 맞춰 구성했다. 기존 대학배구 허브 메인카드와 Production featured 소형 카드는 건드리지 않는다. U-리그의 프로토타입을 Production으로 승인·이관할 때만 featured 소형 카드도 새 U-리그 모바일 히어로 소스를 참조하도록 연결한다.

## 중요: 공통엔진 선수명단 UI 후속 작업

현재 Domestic 공통 컴포넌트는 `roster.mode=none`인 고성·단양 기준으로 참가대학 클릭 시 `university-team.html`로 이동하고, 국내대회의 자체 `roster.mode=full` 데이터가 존재해도 내부 로스터 컴포넌트를 표시하지 않는다.

본 프로토타입은 두 성별의 **304명 실제 Snapshot을 로더의 `rosters` 모듈로 준비**했지만 참가대학 화면에서 이 Snapshot을 직접 보여주는 기능은 공통 UI 개선 전까지 미완료다. 추후 Domestic `roster.mode=full`을 공통엔진의 선택적 기능으로 개발하고, 고성·단양/AVC/VNL 회귀검증을 거쳐야 한다. 임시 대회 전용 JS나 별도 HTML로 땜질하지 않는다. 검수되지 않은 충돌 선수 정보를 Production 선수 MASTER에 덮어쓰지 않는다.

## 근거

- KUSF 공식 여대부 예선·플레이오프 경기결과: `https://kusf.or.kr/league/league_schedule.html?e_code=18&l_code=261&l_year=2026` 및 `https://kusf.or.kr/league/league_schedule.html?e_code=18&l_code=280&l_year=2026`.
- KUVF 2026 U-리그 개최 공지: `https://kuvf.co.kr/31/?bmode=view&idx=170268484`.
- KUVF 2026 남대부 6강 확정 대진: `https://kuvf.co.kr/31/?bmode=view&idx=173194129`.
- U-리그 공식 경기일정표 및 대회요강: 기존 Google Drive 2026 KUSF 대회 폴더.

## Production 보호

- 이 작업 범위는 `tests/fixtures/competitions/university-league-*-2026-prototype/`에 한정한다. 이 문서 외 Production 페이지/공통 엔진/메인 허브 파일을 바꾸지 않는다.
- 두 Prototype의 PC/모바일 화면, 남녀 전환, 85경기 수, 현재 순위, 그룹·달력·결선 구조, 선수명단 UX는 실제 브라우저에서 사용자가 직접 승인하기 전까지 **배포 완료로 선언하지 않는다**.
