# K-Volley Lab 국내대회 메인 HERO 외형 규격 v1

기준: `university-competitions.html`의 승인된 대학대회 메인 HERO.

| 항목 | 적용값 |
| --- | --- |
| 메인 페이지 최대 폭 | 1180px |
| PC HERO 최소 높이 | 225px |
| 모바일(680px 이하) HERO 최소 높이 | 215px |
| PC 내부 여백 | 24px 30px |
| 모바일 내부 여백 | 20px 18px |
| 텍스트 | 넘치면 자동으로 높이 확장, 내용 생략 금지 |
| 배경 | 대회별 기존 이미지와 고유 색상 유지 |

적용 범위: 대학대회 허브, 종합대회 허브, 중·고배구 허브(`?division=school`), 구형 국내대회 통합 페이지(`domestic-competitions.html`).

메인 HERO 규격은 `assets/css/kvl-domestic-hub-hero-v1.css`에서 관리한다. 종합대회 전용 CSS의 강제 `aspect-ratio: 3 / 1` 및 높이 재정의는 제거했다. 각 페이지의 개별 이미지 및 콘텐츠 구성은 유지했다.

**제외:** 대회별 상세화면(Competition Engine V2), V-리그/KOVO컵 운영 페이지, 국제대회 Production, 선수/경기 데이터, MASTER. 위 페이지에 메인 허브 규격을 전파하지 않는다.

검증: `node --test tests/domestic-hub-hero-parity.test.cjs`. 실제 PC·모바일 브라우저에서 제목 줄바꿈, 이미지 오른쪽 50% 배치, 잘림·가로 스크롤이 없는지 배포 후 검수한다.
