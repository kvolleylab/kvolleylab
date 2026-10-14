# HOME Hero 배포 — 동일 대화 일반 채팅/WORK 연결 절차

작성: 2026-10-14. 상태: **홈 v01 이미지 업로드 미완료**. 이 문서는 일반 채팅에 없는 도구를 있다고 가정하지 않는다.

## 성공 경로와 현재 제약
- 검증된 성공 경로: [KVL_COMPETITION_HERO_PUBLISHING_RUNBOOK.md](KVL_COMPETITION_HERO_PUBLISHING_RUNBOOK.md) §5, WORK `tools.exec_command`로 이미지 바이트를 읽고 **같은 `functions.exec` 실행 안에서** GitHub `create_blob(base64)`로 넘기는 방법.
- 일반 채팅에는 GitHub `create_blob`이 있지만 이 세션의 `functions.exec`에는 **`tools.exec_command`가 없다**. 일반 `container.exec`는 `/mnt/data` 파일을 읽을 수 있지만 `github.com` DNS 접근에 실패한다. 그러므로 현재 일반 채팅에서 로컬 WebP를 같은 코드 호출 안에 전달하는 방법은 **검증되지 않았다**. GitHub blob 인터페이스가 존재한다는 이유만으로 업로드 성공을 주장하지 않는다.
- 동일 대화에서 WORK 모드를 사용할 수 있을 때 그 모드로 전환하여 **대화의 첨부 ZIP과 전체 지시 맥락을 그대로 전달**한다. 별도 채팅에서 다시 설계/이미지 생성 금지. 전환/도구 접근은 사용자 UI 및 계정 가용성에 따름.

## 준비된 정확한 원본
이 대화의 `kvl-home-hero-ready-v01.zip`:
- `kvl-home-hero-pc-v01.webp`: **2108×406**, RGB, SHA-256 `af03b7f7ceadf7c1bac8c319e49591e58ff497e00dfac20ae86c871b4348f1db`.
- `kvl-home-hero-mobile-v01.webp`: **1258×406**, RGB, SHA-256 `e56f48c39db642c2ba08b86f0f5ebd11ab363d7eaa51a2aeab1d90dd1a27e913`.
- ZIP의 `kvl-home-hero-preview-v01.html`은 설명용 미리보기이며 배포 자산이 아님.

## 목표: 홈 v02.1 프로토타입만
1. 최신 `main`과 본 지침 및 공통 대회 Hero runbook을 먼저 확인한다.
2. 이미지 원본 두 개를 `assets/img/home-hero/`에 WebP로 업로드한다. 임의 재생성, 이미지 덮어쓰기/강제 크롭/재압축 금지.
3. `home-prototype-v021.html`의 `.home-hero`에 두 WebP를 PC/모바일 미디어 쿼리로 적용한다. 기존 *v02.1* HTML 콘텐츠·섹션·일체형 직각 Hero + 연결형 하단 바 디자인은 보존한다. `index.html` 변경 금지.
4. GitHub Pages 성공, 두 이미지 HTTP 200/Content-Type, PC 폭 1180/모바일 390·360 화면, 검색·분류·남녀부 전환을 검수한다. 배경이 일부 화면에서 잘리거나 과도하게 확대되면 실제 화면을 보고 구조적 대안을 판단하며 단순 확대/늘림으로 무마하지 않는다.
5. 실제 성공한 업로드 경로 및 검수 결과를 이 문서/운영지침에 반영하고 최종 커밋 SHA와 프로토타입 URL을 보고한다.

## 다음부터 한 문장으로
`최신 GitHub main과 Hero 운영지침을 확인해. 첨부된 완성형 이미지를 WORK의 검증된 바이너리 전송 방식으로 원본 그대로 업로드하고 지정된 대회/홈 프로토타입에 연결한 뒤 PC·모바일 실검수해. 실홈 수정 금지.`

**완료 판정:** 두 이미지가 GitHub에 존재하고, 프로토타입 참조와 Pages HTTP 응답/시각 검수가 일치할 때만 완료. 현재 상태는 `PREPARED / DEPLOY PENDING`.
