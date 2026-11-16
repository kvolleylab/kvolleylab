# 국가대표팀 홈 동아시아선수권대회 대회명 링크 검증 및 수정 — 2026-11-16

**Status: USER-REPORTED / SOURCE VERIFIED / ISOLATED FIX / NOT DEPLOYED.**

## 증상과 원인

- 위치: `national-team.html` → 2026 대한민국 대표팀 출전대회 → ‘동아시아 남자/여자배구선수권대회’ 카드의 제목.
- Source: `data/national/national-team-home-v2.json` 양쪽 `east-asian-*` 기록의 `kvlHref: null`.
- 기존 `assets/js/national-team-home-v2.js`는 모든 카드에서 `kvlHref`가 없으면 제목을 `officialResult.url`에 자동 연결하므로, KVL에서 제목 클릭 시 JVA라는 외부 사이트로 이동했다.
- GitHub 2026-11-16 main의 등록 대회·페이지·시니어 국제대회 허브를 조회한 결과, **2026 동아시아선수권 전용 KVL 결과 페이지가 별도 등록되어 있지 않았다**. 링크가 존재한다고 가정하거나 다른 대회/범용 허브에 잘못 연결하지 않는다.
- 검증한 JVA 결과 경로는 각각 실제 대회와 성적이 맞음:
  - 남: https://www.jva.or.jp/international2026/menasianeastern/?entry=result (한국 1위, 결승 한국 3-1 일본)
  - 여: https://www.jva.or.jp/international2026/womenasianeastern/?entry=results (한국 3위)
- 따라서 공식 URL 자체의 404나 다른 대회 오연결이 아니라 **KVL 제목 이동과 외부 공식 출처 이동의 역할이 섞인 UI 내비게이션 결함**.

## 수정

- `east-asian-` 대회이며 `kvlHref`가 미설정일 때만 `<h3>`에 제목 텍스트 표시(제목 자체는 클릭 대상 아님).
- 카드 하단의 기존 `KVL 상세 준비 중` 표시와 별도 `공식 결과 ↗` 외부 링크는 그대로 유지.
- 나중에 공식 검수된 KVL 내부 상세페이지가 추가되어 `kvlHref`가 설정되면 기존 내부 링크 경로로 제목 클릭 자동 복구.
- 남녀 동아시아 외의 카드 내부/외부 링크, 모든 JSON 데이터·공식 출처·순위·선수/대회 MASTER·자동화는 변경하지 않음.
- `national-team.html`의 renderer script query version 갱신으로 구 JS 캐시 방지.

## 검수

- 최신 기존 코드와 실제 JVA 두 결과 웹 확인.
- V8 컴파일 구문 검사 PASS.
- 실제 `data/national/national-team-home-v2.json` 8개 카드에 맞춘 제목 링크 로직 평가 **8/8 PASS**: 동아시아 남녀는 제목 비링크, 남녀 다른 6개 카드는 기존 링크 유지.
- 두 외부 `공식 결과` URL과 `KVL 상세 준비 중` 문구가 변경되지 않았음.
- script cache-buster 적용 확인.
- 테스트 환경에서 외부 raw.githubusercontent.com DNS 접근 실패로 Node 파일 실행, 브라우저 1440/390/360 픽셀 검사 및 실제 KVL 라이브 클릭은 **NOT VERIFIED**.
- Drive MASTER 직접 접근 NOT VERIFIED (이번 범위는 표시 스크립트만 바꾸고 데이터에는 쓰기 없음).

## 릴리스

Base main: `51740df91032cd881e3c02fa49b6e2da25acd065`.
Branch: `fix/national-team-east-asian-title-link-v1`.

운영 반영에는 사용자 별도 승인 필요 (AGENTS.md 기준). PR merge/Pages 배포/라이브 표시 확인 전에는 DEPLOYED로 표기하지 않는다. 리뷰 후 배포 시 PC/모바일에서 남녀 카드 대회명 미이동, 공식 결과 별도 이동, 다른 대회 카드 이동, Draft Hub 목록 및 국대 카드 색상 회귀를 확인한다.

롤백 시 이 PR의 UI 코드와 JS 버전 갱신만 되돌리고 2026-11-16 PR #339/#340 및 추후 다른 커밋은 보호.
