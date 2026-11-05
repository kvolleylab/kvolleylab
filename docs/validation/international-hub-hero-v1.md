# 국제대회 허브 HERO v1

- 승인: 사용자가 제공한 붉은 경기장 이미지를 국제대회 페이지 메인 카드에 운영 반영하도록 직접 요청.
- 시작 main: `ba981d65e56055fa185304794773ae5e40b14778`.
- 브랜치: `feature/international-hub-hero-v1`.
- 대상: `international-competition-senior-national-team.html` 및 `assets/css/international-hub-years-v1.css`.
- 자산: `assets/img/competition-hero/kvl-hero-international-hub-{pc,mobile}-v1.webp`.

## 출처 및 표시 결정

첨부 PNG 2048×682가 승인된 원본이다. PC WebP는 동일 크기, 모바일은 비례 축소한1258×419이며 색조 변경·새 장면 생성·텍스트 합성을 하지 않았다. 원본을 별도 대회 MASTER 데이터로 간주하지 않는다. 웹용 파일은 각각300314/145004바이트다.

GitHub AGENTS·PROJECT_RULES·DEVELOPMENT_WORKFLOW·DESIGN_SYSTEM·DECISION_LOG·Hero 배포 지침, 최근 허브 운영 PR #247, Drive 운영원칙 MASTER v18과 HERO_IMAGE_GUIDE를 확인했다. 일반 규격에 맞춰 사용자 선택 이미지를 재구성하는 대신 최신 사용자 선택과2026-11-02 cover 결정을 우선한다. 이미지 비율·HERO 크기를 유지하며 PC `center 75%`, 모바일 `72% center`로 코트를 보존한다. 기존 파란색 오버레이는 붉은 이미지에 맞춘 최소 보조 음영으로 대체한다.

## 사전 검수

실제 운영 HTML을 같은 origin iframe으로 열어 브라우저에서 검수했다. 검수 래퍼와 hosting 설정은 임시 파일이며 배포하지 않는다.

| 화면 폭 | HERO 크기 | 선택 이미지 | 가로 넘침 / 깨진 이미지 |
|---|---|---|---|
|1180|915×201|PC|없음 / 없음|
|390|351×220|모바일|없음 / 없음|
|360|321×220|모바일|없음 / 없음|

- 세 화면에서 금색 제목·설명과 코트가 읽히는 것을 스크린샷으로 확인.
- 6개 카테고리 표시 유지. 모바일 VNL 선택 →2026 전체대회보기에서 `category=vnl` 유지 및 기존 VNL 상세 경로 확인.
- `git diff --check` 통과. HTML 변경은 전용 CSS 캐시 버전 한 줄뿐이며 JavaScript·경기/선수 데이터·공통 내비게이션·공통 HERO CSS는 변경하지 않음.
- 물리적 모바일 기기 검수는 수행하지 않음. 배포 상태는 GitHub Pages 결과와 운영 HTTP/실화면 확인으로 별도 확인.

## 복구

이 변경의 merge commit을 revert한다. 기존 SVG 자산과 공유 스타일은 남아 있으므로 다른 대회·MASTER 복구는 필요하지 않다.
