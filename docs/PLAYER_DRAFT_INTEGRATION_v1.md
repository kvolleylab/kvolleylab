# 선수 페이지·공식 Draft Hub 통합 v1

작성일: 2026-10-23. 이 문서는 PR 전 검수 스냅샷이다. 실제 merge/배포 결과는 해당 PR의 마지막 release 확인 기록과 GitHub Pages workflow에서 확인한다.

상태: **사용자 운영 반영 승인 / 구현·로컬 검증 완료 / PR·CI 검토 대상**.

사용자의 이번 요청 “작업 완료 후 Pull Request와 검증 결과를 확인하고, 문제없는 변경만 운영 홈페이지에 반영해”에 따라 검증된 변경만 release한다. 기존 MASTER의 신원 정정과 미확정 연결은 이 승인 범위에 포함시키지 않았다.

## 기준과 복구

- GitHub 최신 main: `7f5b90109c912ee1cdaa93c463a5d667a1a95bdb`.
- 작업 브랜치: `feature/player-draft-integration-20261023`.
- 변경 전 전체 저장소 백업: [`backup/player-integration-before-20261023`](https://github.com/kvolleylab/kvolleylab/tree/backup/player-integration-before-20261023), 위 SHA와 동일.
- 최근 기존 Stable Release: `vnl-stable-2026-06-24`. 현재 데이터 복구에는 오래된 Release 대신 위 최신 main 백업을 우선 사용한다.
- 기존 추적 파일 1,149개 SHA256: [before.json](validation/player-integration-v1/before.json). 배포 전 비교: [after.json](validation/player-integration-v1/after.json).
- 복구는 본 PR의 merge commit을 revert하는 새 PR로 수행한다. MASTER를 이전 JSON으로 덮어쓰거나 현재 main을 강제로 reset하지 않는다.

## 확인한 원본

- `AGENTS.md`, 프로젝트 규칙, 디자인 시스템, 결정 로그, `PLAYER_STANDARD.md`, `PLAYER_DATA_MAPPING_RULE_v1.md`, `DEVELOPMENT_WORKFLOW_v1.md`.
- Drive `KVL_운영원칙_MASTER_v14`, 선수 관리 기준, `03_공통DB`, 작업용 `KVL_선수마스터.xlsx`를 읽기 전용으로 확인했다. `03_공통DB/선수_MASTER` 폴더는 비어 있으며, 기존 작업용 MASTER 파일을 대조 기준으로 사용했다.
- Drive MASTER 1,462행, 중복 ID 0. 이번 다운로드와 이전 검수본의 SHA256이 같다. [source-reverification.json](validation/player-integration-v1/source-reverification.json).
- Work 선수 B안의 최신 source `f22b51b`와 Draft 프로토타입 PR #151의 source `19e044a5257cc5ee7d5c5ae1517fd325f519871c`를 확인했다. 공유 대화 URL은 열리지 않아 실제 소스와 Site 버전으로 완료 상태를 확인했다.
- 옛 일반 dark/gold 규칙보다 최신 승인된 홈/B안의 1180px light UI를 적용했다. 영구 KVL-P 규칙은 오래된 initials 표시 코드 규칙보다 우선한다.

## 실제 변경 범위

| 페이지/코드 | 변경 | 보존 |
|---|---|---|
| `players.html` | B안 상세 카드·간편 그리드, 학교 종속 필터, 복수 학년, 연도별 공식 신청 필터, 남자 파랑/여자 로즈핑크 | 기존 1,842명, ID, 검색, 비교함, 공통 메뉴 |
| `assets/js/player-search-v2.js` | 기존 로더 결과를 읽는 Promise bridge와 출처 필드 추가 | 기존 데이터 우선순위·중복 해소·대표팀 identity overlay |
| `player.html` | 기존 상세 renderer를 모달/전체 화면으로 열고, 안전한 복귀 URL과 연도별 공식 신청 이력 추가 | 영구 URL, 학교·소속·대표팀·대회·성장 이력, 기존 출처 |
| `draft-hub.html` | 연도별 공식 명단, 목록/카드/간편 보기, 필터·CSV·출처·검수 상태 | 기존 대학 대상자 44명의 별도 참고명단과 학교/포지션/신장/정렬/비교 기능 |
| 새 `data/draft-applicants/` | 공식 신청 사실, 검수 연결, 지명 결과를 분리 | 선수 MASTER를 새로 만들거나 복사하지 않음 |

기존 runtime 파일 수정은 위 HTML 3개와 검색 bridge 1개뿐이다. 홈, 공통 사이드바, 대회 페이지, 기존 프로필 renderer와 canonical 연결 모듈은 바이트 단위로 같다. 원래 데이터 파일 283개도 모두 동일하다. 새 JS/CSS는 대상 3페이지에만 연결했다.

B안의 공개 선수 snapshot `public-players.json`은 운영에 복사하지 않았다. 기존 로더가 계속 MASTER·학교 압축 자료·여자 대학 스냅샷·대표팀 연결을 읽는다. 기존 compare-tray 저장소도 그대로 사용한다.

## ID·연결 검수

| 항목 | 변경 전 | 변경 후 |
|---|---:|---:|
| 실제 검색 선수 | 1,842 | 1,842 |
| 실제 검색 고유 ID | 1,842 | 1,842 |
| 기존 ID 변경/삭제/신규 할당 | — | 0 / 0 / 0 |
| 기존 검색값 변경 | — | 0 |
| 전체 기존 ID의 상세 renderer 실행 | — | 1,842 성공 / 실패 0 |

[검색 비교](validation/player-integration-v1/catalog-comparison.json), [전체 프로필 검사](validation/player-integration-v1/profile-coverage.json), [MASTER ID 감사](validation/player-integration-v1/master-id-audit.json).

**기존 원본의 주의사항:** 국제 MASTER 원본의 KVL-P 값 217개가 학교 압축 MASTER와 겹친다. 기존 `player-school-master-compat-v2.js`가 국제 항목을 기존 KVL-I 공개 경로로 구분한다. 이 오래된 호환 규칙과 모든 ID는 이번에 변경하지 않았다. 운영 검색의 중복은 0이지만 원본 ID 구조를 정리하려면 별도 개별 검수가 필요하다. fallback 학교 파일 6건은 현재 학교 MASTER와 동일 신원의 중복 수록이며 정상 환경에서는 fallback을 병합하지 않는다.

새 신청 기록은 MASTER의 검수값을 덮어쓰지 않는다. 이름만 같은 선수, DOB 미확인·충돌, 알려진 소속·학년 충돌, 복수 ID 후보는 자동 연결하지 않는다. 학교 약칭/정식명은 확인된 alias만 정규화한다. 신원 일치하지만 학교·학년 자체가 없는 대표팀 연결 전용 프로필 2건은 기존 이름+DOB 검증 연결을 유지한다.

## KOVO 공식 신청 명단

원문은 남자 [157978](https://kovo.co.kr/news/kovo/press/157978), 여자 [157977](https://kovo.co.kr/news/kovo/press/157977)의 2026-10-22 첨부 PDF다. 2026-10-23 재수집에서 해시·전체 행·연결표가 같았다. 원본은 기존 Drive 공식자료 폴더에 보존되어 있다.

| 부문 | 공식 신청 | 연결 성공 | 신원 충돌 검수 | 미연결 | 중복 의심 |
|---|---:|---:|---:|---:|---:|
| 남자 | 59 | 48 | 4 | 7 | 0 |
| 여자 | 58 | 51 | 0 | 7 | 0 |
| 합계 | 117 | 99 | 4 | 14 | 0 |

남자 대학 48명(4학년 30·3학년 11·2학년 7), 고교 5명, 실업 6명을 전부 수록했다. 여자 고교 50·대학 6·외국국적동포 2명도 수록했다. 공식 순번·이름·학교·학년·포지션·신장을 원문 전체와 대조했다.

추가 검수 4건은 옹민혁(KVL-P-000083), 김도현(KVL-P-000003), 전유석(KVL-P-000107), 송건환(KVL-P-000034)이다. 기존 공개 이름 또는 DOB와 충돌하므로 후보 ID를 공개 프로필 링크로 사용하지 않는다. 나머지 14명도 ID를 발급하지 않았다. [18명 검토 목록](draft-applicants-v1/connection-review.json).

이전 참고 Excel의 남자 60명과 공식 PDF 59명의 차이는 명지대 박세민 1명이다. 사유는 확인되지 않았으며 미신청·철회로 판정하지 않는다. 명단에 없는 선수도 기존 선수 검색에는 계속 표시된다.

## 연도별 구조와 확장

- `index.json`: 공개된 KOVO 시즌과 파일 경로. 시즌+성별을 하나의 드래프트 행사 범위로 사용한다.
- `{season}/applicants.json`: 공식 신청 사실과 신청 당시 학교/팀·학년·구분·포지션, 원문 source_id/URL, 발표·확인·수정일. PUBLIC/VERIFIED만 공개.
- `{season}/player-links.json`: 신청 기록 ID → 검증된 기존 player_id. 미연결은 null이며 후보 ID는 운영 UI에 공개하지 않는다.
- `{season}/results.json`: 공식 지명 결과 전용 별도 기록. 현재 빈 배열이며 모든 결과는 미확인이다. 향후 applicant_id/season/status/team/round/pick/source_url/verified_at/record_status/access_level을 검수해 추가한다.
- [revision-history.json](draft-applicants-v1/revision-history.json): 정정 전후 공개값과 원본 해시. 재수집은 동일하면 변경하지 않는다. 명단에서 사라짐을 철회로 자동 바꾸지 않는다.

신청자 ID는 행사 기록의 키이며 공통 Player ID를 대체하지 않는다. 지명 결과를 붙여도 신청 당시 소속·학교 이력과 공통 ID는 남는다. 소스 오류나 identity 충돌 시 연결은 닫히고 검수 상태가 된다. 드래프트 소스만 실패하면 전체 선수 검색은 계속 작동한다.

## 회원 기능과 개인정보

실제 인증·회원 서버·DB 권한 검증은 이 저장소에 없다. 로그인/로그아웃, 실제 회원 간 소유권 검사는 **미구현/미검증**이며 완료로 표시하지 않는다.

운영 관심선수·메모 UI는 준비 중 안내만 제공하고 읽기·쓰기·삭제 기능을 열지 않는다. prototype A/B 계정, 로컬 체험 메모, URL mode 값으로 활성화되지 않는다. 이전 Work prototype과 저장소는 변경하거나 삭제하지 않았다. 공개 JSON/MASTER/Draft Hub에 개인 메모나 운영자 분석을 복사하지 않았다.

후속 구현은 인증된 서버 user_id + 기존 player_id를 키로 삼고, 매 요청의 세션 검증·행 소유권/RLS·타인 읽기/수정/삭제 거부를 서버에서 테스트한 뒤 연결한다. 브라우저의 사용자 선택이나 localStorage를 권한 검증으로 사용하지 않는다.

## 검증

- Python 신원 연결·정정 이력 14개 통과.
- JS 데이터·검색·보안 차단·왕복 경로·기존 참고명단 23개 통과.
- 기존 renderer + canonical overlay로 전 선수 1,842명 상세 출력 성공(별도 테스트 1개). 1,842 URL을 네트워크로 각각 방문한 검사는 아니다.
- JS의 신청자 전수 프로필 검사에 99개 ID/실명 대조 포함.
- PC/태블릿/모바일 실제 iframe 뷰포트 1440·1180·768·390·360px: 선수 간편 6/4/4/2/2열, 안정된 레이아웃에서 가로 넘침 없음. Draft Hub의 PC 카드/간편과 모바일 목록/카드, 프로필 360px 확인.
- 실제 브라우저에서 홈 공통 메뉴 → 선수, 선수명 검색, 대학 명단 → 기존 프로필, 프로필 → 공식 신청 이력 → 해당 Draft Hub 신청 정보, 여성 테마, 기존 대상자 신장 필터, 비교 UI, 모달 닫기를 확인했다.
- 대표팀·학교·대회 데이터/코드는 해시 보존, 모든 검색 프로필은 renderer 전수 검사로 보장한다. 대표팀 이력 페이지의 수동 브라우저 검수는 도구 frame-tree timeout으로 제한되어 별도 기록한다. 기존 일부 고교/대회 화면에 프로필 링크가 없는 경우 새로 연결했다고 주장하지 않는다.
- GitHub CI `Player and Draft Integration`도 동일 테스트를 실행한다. PR 마지막 commit의 CI 결과를 확인한 뒤 병합한다.

재현 명령(Node 24, Python 3.12, jsdom 26.1.0):

```sh
python -m unittest discover -s tests -p test_draft_applicants.py
KVL_JSDOM_PATH=/path/to/node_modules/jsdom node --experimental-vm-modules --test tests/player-integration.test.mjs tests/draft-applicants.test.mjs tests/draft-profile-routing.test.mjs tests/player-profile-coverage.test.mjs
```

원본 수집/생성 스크립트는 `scripts/draft_applicants/`에 있다. 원본 PDF·Drive identity 입력은 저장소 밖의 검수 경로에서 읽고, 공개 출력만 review한다. 재생성 결과가 달라지면 자동 MASTER 병합이나 main 갱신 없이 검수한다.

화면 증빙: [PC 선수 검색](validation/player-integration-v1/players-desktop.jpg), [모바일 여자 그리드](validation/player-integration-v1/players-women-mobile.jpg), [모바일 신청 명단](validation/player-integration-v1/draft-mobile-table.jpg).
