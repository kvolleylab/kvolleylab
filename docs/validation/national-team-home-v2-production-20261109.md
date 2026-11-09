# 국가대표팀 홈 v2 운영 반영

Status: USER APPROVED / IMPLEMENTED / PREVIEW VERIFIED / RELEASE AUTHORIZED. 최종 병합·Pages·운영 검수 결과는 이 변경의 운영 PR에 기록한다.

사용자가 2026-11-09 KST에 v2 검토 후 “실제 홈페이지에 반영해”라고 승인했다. 별도 운영 브랜치를 최신 main `2190b137d9e2682005ec922333b2ecbb2d38ae8f`에서 만들고, 시안 PR #274의 `8ca3d58893e0869c65c0f20d78ae6f2098bc35ed`를 선택적으로 적용한다. 시안 PR 자체는 운영 파일을 변경하지 않으므로 병합 대상으로 사용하지 않는다.

## 범위

- `national-team.html`: 기존 주소에 승인된 정보 구조·디자인 연결. 프로토타입 표기 제거, 운영 asset 경로 적용, canonical/설명 추가. 데이터 요청 실패 및 JavaScript 비활성 시에도 기존 기록 링크를 제공한다.
- `assets/css/national-team-home-v2.css`, `assets/js/national-team-home-v2.js`: 시안의 전용 표시 파일. 미리보기 호스트용 링크 rewrite/MutationObserver 제거. 운영 상대 링크와 공통 nav 사용.
- `data/national/national-team-home-v2.json`: 승인된 공개 projection을 바이트 그대로 승격. 원본 MASTER·경기 DB·등록 명단을 대체하지 않는다.
- 이 검수 문서와 `docs/KVL_DECISION_LOG.md`.
- `scripts/quality_audit/public-review-manifest.json`: 새 공개 projection의 출처·검수일·SHA256 등록. 검증 코드와 규칙은 변경하지 않는다.

기존 공통 nav/CSS/HERO 이미지, 국제대회 페이지, 선수 ID, Player MASTER, 명단, 경기 DB, 자동화 workflow/계정/스케줄은 변경하지 않는다. 공식 출처는 projection 각 competition.sources 및 qualificationSources/ranking.sourcePage/sourceApi에 유지한다. 자료 확인일 2026-11-09 KST, 랭킹 기준일 2026-10-15 KST. 직전 기준일 미제공에 따른 순위 변동 ‘확인 불가’와 미구축 안내를 유지한다.

Projection SHA256: `b17396f8c5082359b5bc3490f829582744c36f28ad5116e09602b90c04296a6d`.

## 사전 검증

- 최신 GitHub main 및 Drive 운영원칙 MASTER v18 재확인. 승인된 v2에서 사용한 최신 공통 디자인 유지.
- 운영 JS 문법 검사 통과.
- 승인 snapshot과 배포 projection 바이트 동일.
- 남녀 각 4개 종료 대회·최종 성적·날짜 및 KVL 상세 경로 확인.
- 명단·경기 연결 경로 파일 존재, 연결 선수 ID와 한국 이름이 기존 `player_id_links_v1.json`에 있는지 확인. ID 생성/수정 없음.
- 필수 5개 기록/대회 링크 및 HTML의 모든 로컬 asset 경로 확인.
- 브라우저 CSS viewport 1440: main 1180px, 대회 4개·2열, 명단 12명 로딩, 가로 넘침 없음.
- viewport 390·360: scrollWidth=clientWidth, main 자식의 가로 넘침 0.
- 여자 전환: 대회 우승/3위/6위/4위, 세계 28위 156.00점·아시아4위, 세계랭킹 경로 월드컵 진출 표시 확인.
- 원래 v2에서 검수한 연도선택·명단선택·포지션 필터·모바일 메뉴는 같은 코드를 사용하며 운영 링크만 변경했다. 배포 후 다시 확인한다.
- 실제 휴대폰 기기 테스트가 아닌 클라우드 브라우저 CSS 폭 검수다.

## 배포 확인과 복구

운영 PR의 승인된 head SHA와 변경 파일 목록을 다시 확인한 뒤 병합한다. 기존 GitHub Pages 성공, 공개 HTML/CSS/JS/JSON의 HTTP 응답·바이트 해시, 실제 남녀 전환·메뉴·연결을 확인한다. 기존 상시 PR workflow의 오래된 선수 MASTER 검증 실패는 이번 홈 변경과 분리하여 판단하고, 보호 DB가 PR에 섞이지 않았는지 병합 전에 확인한다.

복구는 이 운영 연결 커밋을 revert해 기존 `national-team.html`을 복원하는 범위다. 다른 작업의 main 커밋을 되돌리지 않는다. 기존 대회/MASTER/자동화는 변경하지 않아 별도 데이터 복구가 필요 없다. 독립 v2 미리보기는 보존한다.

## CI 확인

최초 공개 export 검사는 새 projection의 검증 기록 1건 누락을 발견했다. 공식 출처와 승인된 파일의 SHA256을 manifest에 등록해 동일한 검증 규칙으로 재검사한다.

기존 전체 PR 작업의 별도 실패: Kyungil/SKKU 선수 등록 작업은 현재 127명 MASTER에 과거 78명/16명 고정 조건을 적용하며 실패한다. build-batch는 기존 GitHub API Invalid request로 실패한다. identity-and-routing의 동결 파일 검사는 이번 변경에 포함되지 않은 `.github/workflows/kovo-official-notices-collector.yml`의 과거 기준 비교에서 실패한다. 관련 MASTER·workflow·검사를 변경하거나 우회하지 않는다. 최종 CI와 배포 결과는 운영 PR #275에 기록한다.
