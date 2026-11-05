# 회원가입 v1 검수 기록

제작·운영: K-Volley Lab · 2026-11-03 KST  
Base main: `56006570b078266470765b991fb81ade68abaa3d`  
범위: 회원가입 시안, 인증 어댑터, 회원/실명/본인확인 권한. 운영 홈페이지·선수/대회 데이터는 비변경.

## 로컬 검수

| 검사 | 결과 | 한계 |
|---|---|---|
| 로그인 클라이언트 | 14 passed | SDK 응답은 주입한 모의 응답 |
| PostgreSQL 권한·두 계정 분리 | 13 passed | PGlite 로컬 PostgreSQL, 실제 Supabase 세션 아님 |
| 본인확인 서버 경계 | 14 passed | Auth·PortOne HTTP 응답 모의 처리 |
| 실제 UI와 클라이언트 통합 | 2 passed | jsdom, 실제 메일/문자 발송 없음 |

합계 43 passed / 0 failed. 전체 로그: [local-tests.txt](local-tests.txt).

타 계정 private 실명 접근, 임의 user_id·관리자·verified 플래그, 미확인 이메일, 이메일 없는 Kakao, 만료/철회/익명/정지 세션, 인증건 다른 계정 재사용, 시간·채널 불일치, 중복 소비, 본인확인→프로필 순서, 로그인 콜백·지연 응답·실패한 logout 이후 노출을 검사했다. 동시 소비 검사는 단일 PGlite 연결의 요청 큐와 원자적 처리 검증이며 다중 호스팅 연결 부하 검증은 아니다.

독립 리뷰에서 발견한 hosted Auth 스키마 역할 위임 제약을 반영했다. 일반 회원 데이터 역할이 auth에 직접 접근하지 못하는 조건도 검사한다. 이 수정이 실제 호스팅에서 실행되었다고 표시하지 않는다.

## 브라우저

CUA의 실제 Chrome으로 관리형 preview를 열어 검사했다. 반응형 폭은 임시 iframe 검사 화면의 **1180 / 390 / 360 CSS px**에서 확인했다. 별도 모바일 기기·Safari의 검증은 아니다. 임시 검사 파일은 게시물에서 제외한다.

- 세 폭 모두 문서 가로 넘침 없음.
- 초기 이메일·카카오·본인확인 비활성 및 연결 준비 안내 확인.
- 미리보기 진입, 닉네임 입력, 실명 공개 선택/해제, 작성자 표시 전환, 반영 안내 확인.
- 실명 입력 후에도 본인확인 전 상태 유지, 실제 혜택 활성화 없음.
- 360px에서 종료 후 닉네임·실명 입력값 공란과 회원 패널 숨김 확인.
- 브라우저 로그의 `chrome-extension://` 메타데이터 오류는 브라우저 확장 메시지이며 앱 오류로 집계하지 않는다. 이 관측만으로 모든 브라우저 오류가 없다고 보증하지 않는다.

## 외부 연결 상태

- Supabase 플러그인: 연결 확인.
- 조직: K-Volley Lab's Org, plan free.
- 프로젝트: 0개. 새 프로젝트 조직 확인 전 생성하지 않음.
- 실제 이메일 수신·Kakao OAuth·휴대폰 본인확인: NOT VERIFIED.
- 실제 호스팅 RLS·security/performance advisors: NOT RUN — 프로젝트 없음.
- 실제 관리자 Supabase 역할 부여: NOT DONE.
- 운영 홈페이지 병합/배포: NOT DONE.

## 검토 Site 배포

Site ID: `appgprj_6ae8a9a118ec8191961e8be689d2c116`  
검토 URL: https://kvl-member-login-test-v1.daewook1029.chatgpt.site/  
Audience: owner-private.  
Native Sites terminal 결과: **succeeded** (2026-11-02 15:40:40 UTC / 2026-11-03 00:40:40 KST). 공개 회원 운영이 아닌 owner-private 검토 시안의 배포다.

- Source commit: `f0376e9c90a56c4c088bf0204c445c90dae2d6e0`
- Deployment: `appgdep_6ae8aee486f48191927e678297edbe5d`
- Version: `appgprj_6ae8a9a118ec8191961e8be689d2c116~appgver_e8b126cb35c4819194b6eab2d53fcd35`
- Native returned URL: `https://kvl-member-login-test-v1.daewook1029.chatgpt.site`
- [실명 선택 화면 캡처](preview-desktop.jpg). 캡처는 관리형 로컬 검수의 예시 상태이며 배포 성공 근거는 위 native 결과다.

## 재현·복구

`npm ci --prefix tools/member-onboarding`와 `npm test --prefix tools/member-onboarding`을 사용한다. SDK 재생성은 `npm run vendor --prefix tools/member-onboarding`이고 의존성과 lockfile을 고정한다. PortOne npm 패키지는 공식 브라우저 스크립트를 필요 시 불러오는 loader라는 점을 `vendor/source.json`에 기록했다.

실서비스 연결은 `docs/MEMBER_ONBOARDING_v1.md` 순서를 따른다. 장애 시 `enabled=false`로 UI 연결을 중단하고 이전 시안 버전으로 복구한다. 실제 회원 데이터가 생긴 이후의 rollback에 DROP TABLE을 사용하지 않는다.
