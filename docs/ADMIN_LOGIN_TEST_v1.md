# K-Volley Lab 관리자 로그인 테스트 v1

검증일: 2026-11-02 (Asia/Seoul)

상태: **PROTOTYPE / IMPLEMENTED / 모의 응답·화면 검증 완료 / 비공개 테스트 Site 게시 완료**.
실제 관리자 GitHub 계정 로그인과 다른 실계정의 인증 거부는 **NOT VERIFIED**.
K-Volley Lab 운영 홈페이지 반영은 **NOT DEPLOYED**.

## 목적과 범위

사용자가 전체 회원 기능보다 관리자 로그인부터 만들어 테스트할 수 있는지 요청했다.
현재 운영 드래프트의 GitHub 계정·권한 확인 방식을 참고하여 인증만 시험하는 독립 화면을 준비했다.
일반 회원 가입 방식, Supabase 도입 여부, 비공개 메모 저장 방식은 이번 시안에서 확정하지 않는다.

테스트 주소: <https://kvl-admin-login-test-v1.daewook1029.chatgpt.site>

이 주소는 소유자 전용 Site이므로 먼저 ChatGPT 접근 확인이 나타날 수 있다.
그 접근 확인과 화면 안의 GitHub 관리자 인증은 별개의 단계다.
공개 KVL 사이트, 공개 선수·대회 데이터, 기존 관리자 메뉴, 드래프트 저장 기능은 수정하지 않았다.

## 확인한 현재 상태

- 기준 main: `fe99c1c0bbe403d55ec3c1d2db497cf84b798a8e`.
- 작업 브랜치: `feature/admin-login-test-v1`.
- `AGENTS.md`, `PROJECT_RULES.md`, `docs/DEVELOPMENT_WORKFLOW_v1.md`, `DESIGN_SYSTEM.md`, `docs/KVL_DECISION_LOG.md` 및 드래프트 관리자 코드를 확인했다.
- Google Drive `KVL_운영원칙_MASTER_v17`의 회원·PRIVATE 데이터·실명 선택 공개 원칙을 읽기 전용으로 확인했다. MASTER는 수정하지 않았다.
- `assets/js/admin-access.js`는 고정 테스트 비밀번호와 브라우저 저장값으로 메뉴를 여는 기존 데모다. 실제 인증으로 보지 않는다.
- `assets/js/draft-board-store.mjs`는 GitHub 계정과 저장소 쓰기 권한을 확인하고, 실제 저장 요청도 GitHub에서 권한 검사를 받는다. 이번 독립 시안은 그 요청 방식과 메모리 보관 원칙을 참고하되 쓰기 기능을 가져오지 않았다.
- Supabase 회원 구현 PR #155는 미병합 Draft이며 공급자 URL·키가 비어 있다. 이 PR 전체를 합치거나 회원 기능을 활성화하지 않았다.

## 구현

| 파일 | 역할 |
| --- | --- |
| `previews/admin-login-v1/index.html` | 한국어 관리자 인증 화면·토큰 준비 안내 |
| `previews/admin-login-v1/admin-login.css` | 기존 밝은 KVL 스타일·네이비·골드·Arial·모바일 레이아웃 |
| `previews/admin-login-v1/admin-auth.mjs` | GitHub 계정·대상 저장소·관리자 역할 확인, 메모리 인증상태 |
| `previews/admin-login-v1/admin-login.mjs` | 입력값 비우기, 성공·실패·재확인·로그아웃·이동 후 초기화 |
| `tests/admin-auth-v1.test.mjs` | 인증·권한·만료·실패·경쟁조건 모의 검사 12개 |
| `tests/admin-login-ui-v1.test.mjs` | 화면·입력 제거·저장값 위조 거부·페이지 복귀 모의 검사 3개 |

허용 기준은 인증된 GitHub 사용자 ID `293255989`, 저장소 ID `1267923840`, 저장소 소유자 ID와 경로의 일치다.
이어 GitHub의 사용자별 저장소 권한 API가 `permission: admin`을 반환해야 한다.
공개 저장소가 조회되거나 쓰기 권한이 있다는 이유만으로 관리자로 판정하지 않는다.

모든 요청은 고정 `https://api.github.com`의 GET이다. 사용자 조회, 저장소 조회, 해당 사용자의 역할 조회만 한다.
응답의 임의 URL로 인증정보를 전송하지 않으며 리디렉션은 거부한다.
토큰은 이 탭의 모듈 비공개 메모리에만 보관한다. 입력 즉시 필드를 비우고 토큰을 URL·로그·반환 데이터·localStorage·sessionStorage에 기록하지 않는다.
로그아웃·새로고침·페이지 이동·15분 만료·권한 재확인 실패 시 인증상태를 제거한다.
로그아웃 후 늦은 요청이 성공하더라도 인증상태는 복원되지 않는다.
페이지 뒤로 가기로 돌아왔을 때 이전 성공 메시지를 남기지 않는다.

**보호 범위:** 이 화면은 GitHub에서 확인한 계정·권한을 표시하는 읽기 전용 인증 실험이다.
공개 HTML의 숨김 상태 자체가 보안 경계는 아니다. 보호된 KVL 서버 API, 편집 권한, 회원 개인 데이터 접근을 구현한 상태가 아니다.
후속 기능은 실제 작업 API에서 권한을 매번 검사해야 하며 회원 개인 메모는 서버 DB의 소유권 검증이 필요하다.
로그아웃은 이 탭의 인증정보 제거이며 GitHub 토큰 자체의 폐기는 GitHub 설정에서 별도로 수행한다.

## 사용자 직접 테스트

1. 비공개 테스트 주소를 열고 필요한 경우 소유자의 ChatGPT 계정으로 접근한다.
2. `처음이라면, 인증 토큰 준비하기` 안내를 연다.
3. GitHub `kvolleylab` 계정에서 짧은 유효기간의 fine-grained PAT를 발급한다. 저장소는 `kvolleylab/kvolleylab`만 선택하고 기본 Metadata 읽기 권한만 사용한다. Contents 쓰기 권한은 요구하지 않는다.
4. 발급값을 채팅으로 보내지 않고 테스트 화면의 입력칸에 직접 넣는다.
5. `관리자로 로그인` 후 계정·권한·확인 시각이 표시되는지 확인한다.
6. `관리자 권한 다시 확인`, `로그아웃`, 새로고침을 순서대로 확인한다.

토큰을 발급하거나 실제 계정으로 로그인하는 단계는 이번 자동 작업에서 수행하지 않았다.
다른 사람의 계정이나 토큰을 수집하여 검증하지 않는다.

## 검증 결과

| 항목 | 결과 |
| --- | --- |
| 인증 모듈 검사 | 모의 응답 12개 통과 |
| 화면 통합 검사 | jsdom 모의 응답 3개 통과 |
| 잘못된 계정·쓰기 역할·누락된 역할·다른 저장소 거부 | 모의 검사 통과 |
| 만료·로그아웃·네트워크 실패·요청 취소·늦은 성공 응답 | 모의 검사 통과 |
| 과거 `kvlAdminAccess=1` 저장값으로 화면 열기 | 모의 검사에서 거부 |
| PC 브라우저 화면·필수 입력·토큰 안내 펼침 | 확인 |
| 390px·360px 폭 iframe의 모바일 화면 | 확인, 가로 넘침 없음. 브라우저 세로 스크롤바를 제외한 본문 폭은 375px·345px |
| 실제 GitHub 관리자 계정 성공 | NOT VERIFIED — 소유자의 직접 인증 필요 |
| 실제 다른 GitHub 계정의 인증 거부·실제 브라우저 API/CORS | NOT VERIFIED |
| 이메일 발송·일반 회원 가입·회원 간 비공개 메모 격리 | 이번 범위에 없음 |

검수 화면: [PC](validation/admin-login-v1/desktop.jpg), [모바일](validation/admin-login-v1/mobile.jpg).

재현 명령:

```sh
node tests/admin-auth-v1.test.mjs
KVL_JSDOM_PATH=/path/to/node_modules/jsdom node --experimental-vm-modules tests/admin-login-ui-v1.test.mjs
```

Node 24.22.1, jsdom 26.1.0으로 실행했다. 브라우저 검수에는 실제 사용자 인증정보를 입력하지 않았다.
브라우저 확장 자체의 메시지 전송 오류 로그가 있었으며, 테스트 화면 자체의 JS 오류는 관찰되지 않았다.

## 비공개 Site 게시와 복구

- Site ID: `appgprj_6ae7cdad7ad08191907dee8640f92194`.
- 게시 소스 commit: `77a6c2cf94e285a6099eafcfcd74b72cf27ef3ee`.
- 배포 ID: `appgdep_6ae7cea899ec819194d0495a38a4d114`, native 결과 `succeeded`.
- 게시된 주소를 열어 소유자용 ChatGPT 로그인 게이트를 확인했다. 게이트 뒤의 실제 사용자 인증은 미검증이다.
- 원본 테스트 HTML을 정적 배포 루트로 복사할 때 브랜드·favicon 상대경로만 조정했다. 임시 모바일 QA wrapper는 배포에서 제외했다.
- 코드 변경은 새 시안과 검사·문서에 한정된다. 실제 홈페이지 배포는 소유자의 별도 승인을 거친다.
- 시안 철회 시 해당 feature PR을 닫으면 된다. 이후 운영 반영을 승인받아 병합한 경우에는 해당 merge의 revert PR로 복구하고 다른 데이터 변경을 되돌리지 않는다.

## 공식 API 근거

- [인증된 사용자 조회](https://docs.github.com/en/rest/users/users#get-the-authenticated-user): fine-grained PAT 추가 권한 불필요.
- [저장소 조회](https://docs.github.com/en/rest/repos/repos#get-a-repository): Metadata 읽기.
- [사용자의 저장소 권한 조회](https://docs.github.com/en/rest/collaborators/collaborators#get-repository-permissions-for-a-user): Metadata 읽기, 서버가 계산한 `permission` 확인.
- [GitHub REST CORS](https://docs.github.com/en/rest/using-the-rest-api/using-cors-and-jsonp-to-make-cross-origin-requests): 브라우저 교차 출처 요청 지원.
