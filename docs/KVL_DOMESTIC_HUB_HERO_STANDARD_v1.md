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

## 2026-11-10 · 종합대회 v04 적용

종합대회 허브만 사용자 선택 원본으로 독립 제작한 PC2108×406/mobile1258×406 WebP를 사용한다. 기존 공통 외형·여백은 유지하며 단일 파노라마 배경의 자연 비율 cover/right center로 표시한다. v03용 중복 그라데이션 및 PR #281의 별도 오른쪽50% 사진 확대 방식을 중첩하지 않는다. 좁은 모바일 설명문은 왼쪽62%에서 줄바꿈한다. 나머지 허브·대회 상세·기존 데이터는 변경하지 않는다. [검수와 복구](validation/comprehensive-hero-v04-20261110.md).
