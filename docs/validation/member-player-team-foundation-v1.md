# KVL Member + Player/Team Foundation v1

## 방향
분석 기능 확장은 보류하고, 로그인 기반의 선수·팀 서비스와 관리자 선수 메모 추적을 우선한다.

현재 핵심 사용자 흐름:
1. 선수 검색
2. 선수 프로필 확인
3. 관심선수 등록
4. 개인 메모 작성
5. 프로필에서 작성일/수정일과 과거 메모를 계속 확인
6. 프로필에서 새 메모 작성 또는 기존 메모 수정으로 바로 이동

관리자 분석 기능의 데이터와 서버 기능은 삭제하지 않았지만 관리자 UI의 분석 탭은 숨겨 보류 상태로 둔다.

## 프로 V-리그 선수 MASTER
새 파일:
- `data/master/player_master_pro_vleague_2026_27_v1.json`

구성:
- 남자부 7팀 131명
- 여자부 7팀 121명
- 합계 252명
- Player ID 252개 모두 고유
- 기존 시즌 명단에 이미 연결된 ID 55개 보존
- 신규 197명은 `KVL-P-001620` ~ `KVL-P-001816` 발급
- 남녀 V-리그 rosters.json의 모든 선수에 Player ID 연결
- Player link index에도 충돌하지 않는 이름만 추가
- 동명이인은 생년월일 기준으로 분리하며 이름 키 충돌은 덮어쓰지 않음

선수 카탈로그/프로필:
- 선수 검색과 선수 상세 프로필이 프로 MASTER를 읽음
- 분류에 `프로` 추가
- 빠른 탐색에 `#프로배구` 추가
- 학교·팀 필터에서 프로팀 선택 지원

## 관리자 메모 타임라인
- 기존 Supabase private notes 구조를 유지
- 프로필 관리자 모드에서 해당 선수 메모를 작성일 내림차순으로 표시
- 작성일과 최근 수정일을 구분
- `새 메모 작성`으로 해당 선수 메모 작성창 바로 열기
- 각 과거 메모의 `수정`으로 해당 메모 편집창 바로 열기
- Player ID는 화면에 노출하지 않고 내부 연결키로만 사용

## 회원 로그인 준비
Supabase:
- 기존 `kvl_members_private.member_accounts` 사용
- `member-access` Edge Function ACTIVE
- Auth bearer token을 Supabase Auth 서버에서 확인
- active admin은 member_accounts 레코드가 없어도 접근 허용
- 일반회원은 member_accounts가 존재하고 active/status=active일 때만 접근 허용
- 테이블은 private schema + RLS, anon/authenticated 직접 권한 없음

웹:
- `member-login.html`: 기존 계정 이메일/비밀번호 로그인
- 일반 회원가입 UI 없음
- `data/member-access-v1.json`을 단일 운영 스위치로 사용
- 현재 `enabled=false`
- `?member-gate-preview=1`로 관리자 계정 검수 가능
- 게이트 보호 대상: 선수, 선수 상세, 팀, 팀 상세, Draft Hub, 선수 비교, 대표팀 세대추적, 기록 및 관련 선수·팀 페이지
- 운영 승인 시 config의 enabled만 true로 바꾸면 실제 로그인 게이트 활성화

## 일반회원 후속 준비
현재는 회원가입을 열지 않는다.
다음 활성화 단계에서:
- 이메일 가입
- Kakao 로그인
- 닉네임
- 휴대폰 본인확인
- 실명 공개 선택
을 별도 검수 후 순차 연결한다.
기존 Draft PR #242는 참고 설계로 유지하며 그대로 병합하지 않는다.

## 검증 기준
- 프로 MASTER 252명 / 고유 ID 252
- 남자 roster Player ID 누락 0
- 여자 roster Player ID 누락 0
- roster Player ID가 프로 MASTER에 없는 선수 0
- 관리자 JS syntax PASS
- 회원 gate/login JS syntax PASS
- 관리자 JS DOM 참조 누락 0
- 분석 탭 hidden
- gate enabled=false
- signupEnabled=false
- KakaoEnabled=false
- Supabase member-access ACTIVE
- 기존 관심선수/메모 데이터 보존

## 운영 검수
1. 관리자 페이지 로그인 후 `프로` 선수 검색.
2. 프로선수 한 명 프로필 열기.
3. `새 메모 작성` → 저장.
4. 프로필 재진입 → 작성 날짜와 내용 확인.
5. 해당 메모 `수정` → 내용 변경 → 최근 수정일 확인.
6. `players.html?member-gate-preview=1`을 관리자 로그인 상태에서 열어 접근 허용 확인.
7. 로그아웃 후 같은 preview URL에서 로그인 필요 화면 확인.
8. 다시 관리자 로그인 후 기존 관심선수·메모 유지 확인.
