# 종합대회 배구 HERO v04 · 제작 및 검증

Status: USER APPROVED / IMPLEMENTED / PREVIEW VERIFIED / RELEASE AUTHORIZED.
병합 커밋, Pages 실행 및 실제 HTTPS 검증은 이 변경의 PR에서 별도 기록한다.

## 범위와 출처

- 최초 main: `5da8fedbd29b0777a722e5a9b2da629d6773dc3a`.
- 릴리스 기준: `54bb76ca43be9d0bca6c53ce86b699a374f26948`. 동시 V-리그 데이터 업데이트를 그대로 보존했다.
- 승인 원본: `KVL_Comprehensive_HERO_Selected_Source_v1.png`, 2172×724, SHA-256 `e7646ef3e2d4ba7fb39f278dcb6fe863d45fcede38e426fd7df53e901e9724ca`.
- AGENTS.md, PROJECT_RULES.md, DEVELOPMENT_WORKFLOW_v1, DESIGN_SYSTEM.md, 최신 결정 로그 및 국내 HUB HERO 규격 확인.
- Google Drive 운영원칙 MASTER v19 및 HERO IMAGE GUIDE v1의 현재 내용 확인. 오래된 PC 오른쪽 35% 예시보다 이번 승인된 약 50% 구도를 우선한다.
- PR #281은 작업 시작 시 OPEN / NOT MERGED. 그 브랜치의 오른쪽 50% 별도 사진 레이어를 가져오지 않았다.

## 이미지 제작

선택 원본을 기준으로 이미지 편집 도구에서 PC와 모바일을 각각 재구성했다. 네이비·블루, 리본, 관중석, 배구 장면과 성화탑을 유지하며 실제 인물·대회 로고·문자를 추가하지 않았다. PC는 긴 파노라마, 모바일은 좁은 화면에서도 식별 가능한 가까운 경기 장면이다.

PC 생성 MASTER의 위아래 제작 여백을 제외한 2172×418 영역(x=0,y=150)을 비례 축소하여 2108×406 WebP로 인코딩했다. 원본 2172×724를 세로 압축하지 않았다. 모바일은 별도 MASTER를 비례 축소하고 조용한 왼쪽 네이비 여백만 확장하여 1258×406으로 맞췄다. WebP quality 84, 불투명 RGB.

| 파일 | 크기 | 바이트 | SHA-256 |
| --- | --- | ---: | --- |
| kvl-hero-comprehensive-hub-all-pc-v04.webp | 2108×406 | 150264 | f3125b252356184c5716facb2c023edefd4299d9ffbd9946368a8f27401cc02b |
| kvl-hero-comprehensive-hub-all-mobile-v04.webp | 1258×406 | 26764 | 3170e75cf9c442f89dee6d0ee44d2e96f1de59cbb5d25478ee1a3b4498b7bb4f |

기존 comprehensive-hub의 이미지 MASTER/WEB 폴더에 v04 새 파일을 저장하고 이름·MIME·용량·상위 폴더를 재조회했다. v03은 이동하거나 덮어쓰지 않았다.

## 표시 계약

공통 카드 외형을 유지한다: 콘텐츠 최대1180px, PC 최소225px, 모바일 최소215px, 기존 내부 여백과 골드 제목. HTML 문구와 기록 링크는 변경하지 않았다.

이미지는 단일 배경의 `cover / right center`로 표시하며 680px 이하에서 독립 모바일 이미지를 사용한다. 100%×100% 늘림, 추가 명암 그라데이션, 오른쪽 반쪽의 별도 사진 레이어, 고정 배율 확대를 사용하지 않는다. 화면 비율에 따른 자연스러운 cover는 왼쪽 여백 일부를 잘라내므로 모바일 원화의 주요 피사체를 오른쪽 안전영역에 배치했다. 전체 파일의 모든 픽셀이 항상 보인다는 뜻은 아니다. 모바일 설명문은 왼쪽62% 안에서 줄바꿈하고 작은 글자 그림자만 적용했다.

## 브라우저 검증

Chrome에서 실제 페이지를 지정 너비 iframe으로 렌더링했다. 1440px 검수 이미지는 바깥 화면에 맞춘 표시 배율이지만 내부 viewport는1440px다. 물리 기기 검수는 아니다. 일반 스크롤바15px를 포함한 측정이다.

| viewport | HERO 실제 크기 | 가로 넘침 | 배경 |
| ---: | --- | ---: | --- |
| 1440 | 1140×225 | 0 | PC v04 |
| 1180 | 915×225 | 0 | PC v04 |
| 680 | 641×215 | 0 | mobile v04 |
| 390 | 351×215 | 0 | mobile v04 |
| 360 | 321×215 | 0 | mobile v04 |

1180px 화면에서는 기존 왼쪽 메뉴210px 때문에 카드가1140px로 표시되지 않는다. 대학 허브도 같은 계약이다. 대학1440px의1140×225 및360px의321×215와 일치했다. 중고 허브360px에서는 기존 너비345px·높이215px, 가로 넘침0을 확인했다. 공통 크기 선언·대학/중고용 규칙·상세 Engine의CSS와 이미지는 변경하지 않았다.

지정한 모든 폭에서 제목·설명·링크·성화 전체·주요 선수·코트를 직접 확인했다. 모바일 설명은 왼쪽에서 줄바꿈하며680px에서는 경기의 세로 구도와 주변의 어두운 관중석을 유지한다. 이미지 왜곡이나 빈 배경 영역은 없다. 기록 보기 링크가 기존 연도별 기록으로 이동하는 것도 확인했다.

[PC 화면](comprehensive-hero-v04-pc.jpg) · [모바일 화면](comprehensive-hero-v04-mobile.jpg) · [브라우저 측정값](comprehensive-hero-v04-metrics.json)

## 자동 검증과 불변 조건

- `node --test tests/domestic-hub-hero-parity.test.cjs tests/comprehensive-hub.test.cjs tests/university-hub-years.test.cjs`: 14/14 PASS. jsdom26은 checkout 밖 QA 의존성으로 사용했다.
- 중고 허브 추가 검사는1PASS / 2FAIL. 미변경main의 별도 worktree에서 같은2FAIL을 재현했다: 경기 수의 오래된 기대값486/실제600, 필터 기대값2/실제3. 이번 이미지 변경으로 발생한 실패가 아니므로 데이터와 기대값은 수정하지 않았다.
- `git diff --check` PASS. 데이터·JS·순위·선수·MASTER 변경0, v03 바이트 변경0.
- 최초 jsdom 미설치 실행 오류는 checkout 밖에 의존성을 설치한 뒤 해소했다.

## 복구

이 PR의 squash commit만 revert한다. 이미지 경로와 함께 v03용CSS 및 캐시 키도 복원한다. 기존 v03 PC/mobile WebP는 보존돼 있어 재생성할 필요가 없다. 복구 PR의 Pages 성공 및 실제 HTTPS의 v03 참조를 확인한다. 다른 V-리그 업데이트나 다른 PR을 되돌리지 않는다. 미병합#281을 복구 수단으로 병합하지 않는다.
