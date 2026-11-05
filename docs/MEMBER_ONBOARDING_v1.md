# KVL 회원 가입·본인확인 v1 — 구현과 연결 인계

제작·운영: K-Volley Lab  
작성: 2026-11-03 KST (2026-11-02 UTC)  
기준 main: `56006570b078266470765b991fb81ade68abaa3d`  
상태: **PROTOTYPE / LOCAL VERIFIED / HOSTED AUTH NOT ACTIVATED**

## 이번에 준비한 결과

사용자는 GitHub 관리자 확인 이후 일반 회원의 이메일·카카오 로그인과 휴대폰 본인확인을 진행하도록 요청했다. 기존 PR #155의 Supabase PKCE·서버 소유권 검사 원칙을 재사용하되, 현재 main에서 독립된 가입 시안을 준비했다. PR #155의 오래된 선수 페이지나 데이터 변경을 병합하지 않는다.

회원 화면은 `prototypes/member-onboarding-v1/index.html`이다. 이메일 링크와 카카오 OAuth 어댑터, 휴대폰 본인확인 요청·서버 재조회 경로, 닉네임과 실명 공개 선택, 정보 저장·로그아웃을 연결할 수 있게 구현했다. 현재 설정 파일은 모든 인증 공급자가 비활성이고 URL·공개키가 비어 있다. 연결 전에는 별도의 **가입 화면 미리보기**만 작동한다. 미리보기는 예시 데이터만 메모리에 보관하며 이메일·문자를 보내거나 실제 회원·인증 결과를 만들지 않는다.

검토 Site: https://kvl-member-login-test-v1.daewook1029.chatgpt.site/  
Site 프로젝트: `appgprj_6ae8a9a118ec8191961e8be689d2c116`  
실제 배포 상태·커밋·버전은 [검수 기록](validation/member-onboarding-v1/README.md)에 기록한다.

## 확인한 기준과 연결 상태

- Google Drive `KVL_운영원칙_MASTER_v17`의 기존 문서 ID `1iu1aWoTdSf2L7VCco5X7pCPxs9qVlM9rskZ8_hI76FY`와 7/7-1항을 직접 확인했다. 닉네임 기본, 회원 선택 실명 공개, 공개 회원에게만 추가 혜택이라는 원칙을 유지한다.
- 실명 공개와 본인확인을 구분한다. 입력한 이름을 인증된 이름으로 표시하지 않는다. 구체적인 혜택은 정해지지 않았으므로 `benefits_active`는 항상 false다. 게시물별 공개·기존 글 반영·공개 철회 후 혜택·관리자 조회 범위의 운영 정책은 확정 전이다.
- 이전 관리자 v1.1 화면의 실제 `kvolleylab` 인증 성공은 사용자가 제공한 스크린샷에서 관찰했다. 재확인·새로고침·로그아웃·다른 실제 계정 거부까지 통과한 것으로 확대하지 않는다. GitHub PAT를 일반 회원 인증에 사용하지 않는다.
- **Supabase 플러그인은 연결 완료**다. 실제 도구 조회 결과 조직은 `K-Volley Lab's Org`, 요금제는 `free`, 프로젝트 목록은 0개였다. 플러그인 미설치 상태로 기록하거나 다시 설치를 요청하지 않는다.
- 새 프로젝트 생성 도구는 사용할 조직을 사용자에게 확인하도록 요구한다. 제안 대상은 위 조직의 `kvl-members-test-v1`, 서울 `ap-northeast-2`이다. 조직 선택 확인과 프로젝트별 비용 조회 후 진행한다. 아직 생성·유료 계약·데이터베이스 변경·실제 메일 또는 문자 발송은 하지 않았다.

## 화면·인증 동작

1. 이메일은 비밀번호를 받지 않는 로그인 링크 방식이다. 링크 발송 요청 성공은 로그인 성공이 아니다. PKCE `code`는 SDK의 `exchangeCodeForSession`, 명시적 이메일 `token_hash` 콜백은 `verifyOtp(type: email)`로 처리한다. 콜백 값은 URL에서 제거한다.
2. 카카오는 Supabase `signInWithOAuth(provider: kakao)`를 사용한다. 회원 식별은 Supabase user ID이고, 이메일·전화번호를 같은 계정의 증거로 자동 병합하지 않는다.
3. 로그인 후 휴대폰 본인확인을 진행하고 회원정보를 설정하는 흐름이다. 미리보기에서는 설정 화면을 먼저 살펴볼 수 있다. 서버의 `onboarding_ready`는 프로필과 실제 본인확인 기록이 모두 있어야 true다.
4. 닉네임 2~40자, 실명 최대 80자이며 실명 공개 기본값은 false다. 공개를 선택하면 이름이 필요하다. 인증된 이름은 공급자 결과로만 저장하고 일반 회원이 바꿀 수 없다.
5. 인증된 이름이 이전 입력 이름과 다르면 공개 선택을 해제해 새 이름이 자동 공개되지 않게 한다. 인증을 프로필 작성보다 먼저 마쳐도 검증명을 불러와 최초 프로필을 저장할 수 있다.
6. 계정 변경·로그아웃은 private 화면을 즉시 비운다. 이전 요청의 늦은 응답과 늦게 열린 인증창을 차단한다. 로그아웃 통신 실패 시에는 개인정보 없는 로그아웃 의도 표시만 남겨 새 로그인 콜백 전까지 자동 복원을 막는다. 서버 세션 철회 실패를 성공으로 표시하지 않는다.

## 데이터베이스와 접근 권한

공식 CLI `supabase@3.0.0 migration new member_onboarding`으로 생성한 `supabase/migrations/20261102152208_member_onboarding.sql`을 사용한다. 현재는 PGlite의 PostgreSQL에서만 실행했다.

| 영역 | 내용 | 허용 범위 |
|---|---|---|
| `kvl_members_private.member_profiles` | 닉네임, 입력/검증 실명, 공개 선택 | 본인 조회·수정, 서버에서 지정된 관리자 조회 |
| `member_identities` | 검증명·공급자·인증건 ID·시각 | 서버만 생성, 본인·허용 관리자만 조회 |
| `identity_requests` | 회원/세션과 인증건 연결·만료·사용상태 | 서버 전용 |
| `member_admin_roles` | 서버가 부여한 관리자 ID | 일반 회원의 부여·변경 불가 |
| `admin_read_audit` | 관리자·조회 대상·시각 | 성공한 관리자 조회를 서버에서 기록 |

모든 private 테이블에 RLS를 적용하고 강제한다. 일반 API 역할과 공개 표시 역할, 본인확인 쓰기 역할은 NOLOGIN/NOBYPASSRLS로 분리한다. public RPC는 SECURITY INVOKER이고, private 진입 함수의 기본 PUBLIC 실행권한은 회수한다. 관리자 권한에 user_metadata를 사용하지 않는다.

호스팅 Supabase에서는 새 역할에 `auth` 스키마 사용 권한을 위임할 수 없는 제약을 반영했다. Auth 테이블 조회만 postgres 소유의 좁은 private helper에 두어 boolean으로 반환하고 내부 두 역할만 호출하게 한다. 일반 회원 데이터 작업에는 이 권한을 사용하지 않는다. 새 역할이 `auth`를 직접 읽지 못하는 조건에서도 로컬 회귀 검사를 수행했다.

일반 회원은 다른 회원의 private 실명을 읽을 수 없다. `kvl_member_public_author`는 닉네임 또는 공개 선택한 이름과 표시 출처만 반환한다. 이 투영 규칙은 이번 시안의 계약이며 실제 게시판 전체에 적용된 상태가 아니다. 전화번호·생년월일·CI·DI·주민번호는 이 스키마에 저장하지 않는다. 운영자 개인 메모와 PR #155의 회원 선수 메모 테이블도 변경하지 않는다.

## 휴대폰 본인확인 서버

`supabase/functions/member-identity/`는 다음 순서로 동작하도록 준비했다.

1. 회원 bearer token을 Auth 서버에서 검증하고 활성 세션을 DB에서 다시 확인한다.
2. 서버가 영숫자 32자의 인증건 ID와 고객 ID를 만들고 현재 회원·세션·상점·채널에 연결한다.
3. 공식 PortOne 브라우저 SDK가 인증창을 연다. 완료 시 브라우저의 이름이나 성공 플래그는 신뢰하지 않는다.
4. 서버가 본인 소유의 미사용 요청을 읽은 뒤 PortOne API에서 결과를 조회한다. `VERIFIED`, 정확한 ID·채널·고객 ID·요청/완료 시각을 검사한다.
5. DB의 동일 회원별 잠금과 단일 트랜잭션으로 한 번만 반영하고 현재 세션을 재확인한다. 다른 계정·만료·재사용·소유권 변경은 거절한다.

PortOne의 일반 응답에서 `verifiedCustomer.id`와 `channel.key`는 선택 필드다. 현재 구현은 두 값의 반환을 확인한 채널에만 쓰는 `customer-id-and-channel-v1` 계약으로 제한했다. 실제 계약 채널이 이 값을 반환하지 않으면 **활성화하지 말고** 공식 지원 방식에 맞춰 계약과 검증 코드를 별도 검토한다. 모의 응답 통과는 실제 PG 지원 증거가 아니다.

서버 환경에 필요한 값은 `KVL_ALLOWED_ORIGINS`, `SUPABASE_URL`, 공개 API 키, `SUPABASE_SERVICE_ROLE_KEY`, `PORTONE_API_SECRET`, `PORTONE_STORE_ID`, `PORTONE_CHANNEL_KEY`이다. 비밀값은 Edge Function의 비밀 환경에만 둔다. 실제 채널 검증 전에는 `KVL_IDENTITY_ENABLED=false`를 유지한다. 활성화에는 이 값과 `KVL_IDENTITY_CONTRACT=customer-id-and-channel-v1`이 모두 필요하다.

## 다음 연결 순서

1. **프로젝트 생성 대상 조직을 확인한다.** 비용을 조회하고 0원인 신규 테스트 프로젝트 범위에서 생성한다. 0원이 아니면 별도 비용 동의 전 진행하지 않는다. 현재 Free 요금제라는 사실만으로 최종 생성 견적을 확정하지 않는다.
2. 생성된 프로젝트의 기존 테이블·API 노출 스키마·Auth 설정을 먼저 읽고, 준비한 migration을 적용한다. `kvl_members_private`를 API 노출 스키마에 추가하지 않는다. security/performance advisors를 실행하고 실제 권한 검사를 재수행한다.
3. 테스트 Site의 정확한 callback `https://kvl-member-login-test-v1.daewook1029.chatgpt.site/index.html`을 Supabase redirect 허용 목록에 등록한다. 공개 프로젝트 URL과 publishable key만 config에 넣는다.
4. 허용된 운영자 테스트 이메일로 실제 수신·로그인·새로고침·로그아웃을 확인한다. 일반 회원에게 제공하기 전에는 별도 발신자/SMTP를 설정한다. Supabase 기본 메일은 팀의 사전 허용 주소로 제한된다. 받는 사람과 발송을 확인한 뒤 실제 메일을 요청한다.
5. Kakao Developers 앱과 Supabase Kakao 공급자를 연결한다. Kakao callback은 Supabase의 `/auth/v1/callback`, Supabase의 최종 callback은 위 Site 주소다. `account_email`을 받지 않는 경우 Allow users without an email을 설정하고 실제 이메일 없는 계정도 검사한다.
6. 휴대폰 본인확인 공급자·계약·상점·채널을 확정한 뒤 Edge Function을 배포하고 실제 채널 응답·모바일 복귀·취소·재요청을 검증한다. 설치만으로 자동 계약되지 않는다.
7. 두 실제 테스트 계정으로 API를 직접 호출해 타 계정 실명 읽기·수정과 인증건 재사용이 차단되는지 검사한다. 관리자 승격은 확인된 운영자의 Supabase user ID에 서버에서 별도 부여하고 조회 감사를 확인한다. 테스트 자체를 위해 권한을 끄지 않는다.
8. 세부 공개·혜택 운영 규칙과 홈페이지 연결 범위를 확정하고 운영 반영 승인을 받은 뒤 회원 기능을 활성화한다. PR #155의 선수 저장/메모를 합칠 때에는 새로운 가입 상태 정책과 기존 서버 세션 검사를 함께 검토한다.

## 검수와 복구

재현: `npm ci --prefix tools/member-onboarding` 후 `npm test --prefix tools/member-onboarding`.

로컬 결과와 PC/모바일 증거는 [검수 기록](validation/member-onboarding-v1/README.md)에 있다. 실제 이메일·카카오 로그인, 실제 휴대폰 본인확인, 호스팅 DB의 두 계정 접근 차단, 실제 서버 logout 철회는 아직 검증하지 않았다. 본문과 CI의 통과 수치를 해당 실서비스 검증으로 확대하지 않는다.

복구는 config의 `enabled=false`로 회원 연결을 멈추고 시안 진입점을 이전 버전으로 되돌리는 방식이다. 데이터가 생긴 뒤 복구한다고 회원/인증 테이블을 삭제하지 않는다. 운영 홈페이지·선수/대회 데이터·기존 관리자 Site는 이번 변경 대상이 아니다.

## 공식 구현 근거

2026-11-02에 공식 문서와 changelog를 확인했다. 11월 10일 예정인 구형 TLS CBC cipher 제거는 현대 브라우저와 이번 SDK 방식의 변경을 요구하지 않으며, 실제 배포 환경 검사는 별도다.

- [Supabase 이메일 링크](https://supabase.com/docs/guides/auth/auth-email-passwordless)
- [PKCE](https://supabase.com/docs/guides/auth/sessions/pkce-flow)
- [Kakao](https://supabase.com/docs/guides/auth/social-sign-in/auth-kakao)
- [메일 발송 제한·SMTP](https://supabase.com/docs/guides/auth/auth-smtp)
- [API keys](https://supabase.com/docs/guides/getting-started/api-keys)
- [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Hosted auth 스키마 custom role 제약](https://supabase.com/kb/troubleshooting/permission-errors-when-granting-custom-roles-access-to-the-auth-schema)
- [PortOne V2 본인인증](https://developers.portone.io/opi/ko/extra/identity-verification/readme-v2)
- [PortOne SDK 요청](https://developers.portone.io/sdk/ko/v2-sdk/identity-verification-request?v=v2)
