# 올림픽 출전권 + 대표팀 역사 로드맵 통합 v1

상태: PROTOTYPE / READY FOR REVIEW. kvolleylab.com 운영 반영·main 병합·URL 변경·Drive MASTER 쓰기 없음.

완성된 원본 소스에서 `main.roadmap`, roadmap.css, roadmap.js, model.mjs, data/roadmap_v1.json을 그대로 유지한다. 필터·행 치수·색상·데이터 62개를 변경하지 않는다. 이 문서는 기존 README의 역사 데이터 갱신 방법을 대체하지 않으며, 새 상단 주기 모듈의 독립 운영 방법을 추가한다.

## 실행과 재검증

정적 HTTP 서버에서 index.html을 제공한다. 외부 패키지나 빌드 의존성은 없다.

```sh
node --test tests/model.test.mjs tests/integration.test.mjs
```

- `integration-verification.html`: 통합 비교 보고서, 공식 근거, URL 정책, 미확인 목록.
- `verification.html`: 기존 62개 역사 기록의 상세 검증 목록.
- `tests/baseline.html`: 원본 HTML을 같은 CSS·JS·JSON으로 제공.
- `tests/viewport.html?page=baseline` 및 `?page=integrated`: 동일 CSS 뷰포트 비교.
- `index.html?cycle=brisbane2032`: 2032 미확정 화면. 조회만 바꾸며 활성 주기를 쓰지 않는다.
- `tests/integration_qa_v1.json`: 1280/390px 원본·통합 치수와 실제 브라우저 결과.

## 데이터 계약과 분리

`qualification/cycles_v1.json`의 activeCycleId만 상단 활성 주기를 결정한다. 날짜 자동 전환은 없다.

주기 JSON은 id/year/name/hostCity, rules.status/version/totalPerGender/genders/allocation/details/rankingCutoff, korea의 월드컵·올림픽 상태, sources, checkedAt/updatedAt, progressStatus, archiveStatus, finalOutcome, adminVerification을 가진다. 배분·규정·한국 현황은 같은 파일의 sourceIds로 공식 근거에 연결한다.

공식 규정이 미확정이면 `rules.status=not_yet_verified`, `totalPerGender=null`, `allocation=[]`를 지킨다. 기존 2028 숫자를 fallback하지 않는다. 코드 검증도 이를 강제한다. 상단 로딩 실패는 상단 안내로만 처리되며 역사 모듈의 로딩에 영향을 주지 않는다.

역사 모듈의 cycle/displayPolicy는 기존 v1 표시 정책을 보존한다. 현재 연도와 기간은 원본의 2026 검증 시점을 유지한다. 향후 역사 표시 연도 갱신은 별도 데이터 검토이며, 상단 올림픽 전환이 이 값을 자동 덮어쓰거나 이벤트를 삭제하지 않는다.

## 2028 이후 관리자 전환

1. LA28 실제 최종 결과를 공식 자료로 확인한다. 같은 LA28 파일에 공식 source를 추가하고 finalOutcome의 qualification(qualified/not_qualified), gamesResult, officialSourceIds, verifiedAt을 채운다. 실제 올림픽 종료를 확인한 뒤 progressStatus=games_completed로 변경한다. 지금 데이터는 미확정이므로 전환 함수가 거부한다.
2. 차기 주기의 실제 공식 규정을 별도 JSON에 넣고 Source ID를 연결한다. 공식 규정 미발표이면 빈 배분과 발표 전 상태를 유지한다.
3. 관리자 검토 JSON을 작성한다. targetId, status=approved, checkedAt(YYYY-MM-DD), officialBasisIds를 필수로 기록한다. 미발표 화면을 활성화할 때만 approveAwaitingRulesNotice=true를 명시한다. 승인 상태는 실제 검토 후에만 기록한다.
4. `node scripts/plan_cycle_transition.mjs /absolute/review.json /absolute/new-plan-directory`를 실행한다. 존재하지 않는 출력 폴더에 새 cycles_v1.json과 archives/LA28 스냅샷을 생성한다. 원본 활성 설정과 역사 파일을 쓰지 않는다.
5. 출력 내용을 검수한 뒤 별도 브랜치에서 qualification/에 반영한다. 단위 검증과 브라우저의 과거 올림픽 보기를 확인하고 사용자 승인 후 운영 절차를 진행한다.

전환 함수는 이전 올림픽 종료·공식 최종 결과·Source ID 연결·관리자 검토를 요구한다. 보관본은 기존 모든 필드를 유지하고 archiveStatus/archivedAt만 추가·변경한다. 조회 시 archiveIndex를 우선하여 과거 LA28 기록을 현재 설정으로 덮어쓰지 않는다. 보관 화면에는 공식 최종 결과가 표시된다. 시험용 결과는 테스트 파일 내부에만 있으며 실제 주기 JSON에는 없다.

## 기존 데이터 연결과 최신 공식 상태

기존 Drive MASTER를 읽기 전용으로 조사했다. 해당 표의 2026-07-25 대회 전 상태를 운영 DB에 덮어쓰지 않았으며, 최신 공식 발표를 상단 독립 JSON에 저장했다. 원본 역사 데이터는 기존 KVL 대회 ID·링크·검증 출처를 모두 보존한다. 상단 대회 연결 4개와 기존 공식 출처 3개를 상세 영역에 보존했다. 정식 연동은 승인 후 MASTER의 상태를 검토하고 projection을 생성하는 별도 작업이다.

## 공통 스타일과 URL

현재 운영의 공통 스크립트는 PC 사이드바와 전역 스타일을 주입한다. 이번 사용자 요구의 새 사이드바 금지 및 기존 로드맵 보존을 위해 남색·금색·Arial·메뉴 명칭을 scoped 헤더에 적용했다. 기존 공통 CSS의 h1/필터 강제 규칙은 가져오지 않았다. 상단과 로드맵의 본문 폭은 일치한다.

운영 권장안: `/olympic-roadmap.html`을 현재 주기+역사 고정 진입점으로 추가하고, `/la28-volleyball-qualification.html`은 보존 자료 주소로 유지한다. 기존 주소를 삭제·강제 리다이렉트하지 않는다. 이번 브랜치에는 실제 운영 주소·메뉴 변경이 없다.

## 검증과 제한

18개 자동 검증 통과. 실제 Chrome PC 마우스 필터·규정 펼침, 1280px/390px 원본 치수 동일성, 모바일 CSS 뷰포트 360px/390px 가로 넘침, 모바일 키보드 연도·대회·과거·현재 이동, 2032 카드 0개 및 역사 62개 보존을 확인했다. 물리 Android/iOS 터치 검증은 미수행이다.

기존 미확인 16개를 유지한다. 2032 규정은 미확인, 여자 랭킹 기준일은 잠정, 공식 PDF의 개최국 확인 기한은 문서 내 불일치로 확정 표기하지 않는다. 모든 한계는 integration-verification.html에 포함한다.

## 원본·복구 기준

- main base: 811f270f3dddc04bb0df0e5ed14ddb9ba1b11c07
- original roadmap GitHub: 6cedb89b517e977309416fafd71597692f82cfb8
- original private Site source: b97275e939489a22976c212eb0453e9a389db0cb
- new branch: feature/olympic-roadmap-integration-v1

운영 변경이 없으므로 운영 롤백은 필요 없다. 프로토타입만 직전 Site 버전 또는 원본 소스로 복구한다. 원본 hash 기준은 baseline/manifest_v1.json이다.
