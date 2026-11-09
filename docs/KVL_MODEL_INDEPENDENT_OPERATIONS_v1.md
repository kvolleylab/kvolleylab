# KVL 모델·요금제 독립 운영 안내 v1

작성: 2026-11-10(KST). 문서·정책 정리이며 신규 코드 배포나 자동화 활성화 작업이 아니다.
확인한 main: `713617e8e043bdf7f7ee61c21b12b0138dc38981`.
상위 기준: [KVL 운영원칙 MASTER v19](https://docs.google.com/document/d/1iu1aWoTdSf2L7VCco5X7pCPxs9qVlM9rskZ8_hI76FY/edit), 11-7~11-9.

## 1. 목표와 실행 주체

확정된 양식과 자동화를 다음 시즌·다른 모델·다른 요금제에서도 재사용한다.
AI가 매번 디자인이나 연결 구조를 새로 추론하는 대신, 검증된 코드에 확인된 입력을 넣는다.
GitHub Actions와 Cloudflare가 실행하는 정기 작업은 ChatGPT 대화의 상시 접속이나 Pro 구독을
실행 조건으로 두지 않는다. 각 서비스의 인증, 사용 한도와 장애는 별도로 관리한다.

ChatGPT의 도구·연결·사용량은 플랜과 환경에 따라 다를 수 있다.
기본 요금제에서도 동일한 자료로 작업을 이어갈 수 있게 준비하되, 모든 플랜에서 직접 저장소
수정·Drive 접근·배포까지 가능하다고 보장하지 않는다. 직접 실행 권한이 없으면 아래 입력 묶음과
명령을 사람이 실행하고 결과를 검토한다. 참고: [OpenAI 사용 안내](https://learn.chatgpt.com/docs/use-chatgpt).

시작 순서는 [AGENTS.md](../AGENTS.md) → 최신 main·승인 기록 → MASTER → 해당 양식 명세다.
오래된 일반 문서와 최신 승인된 범위별 변경이 충돌하면 최신 결정을 확인한다.
현재 코드가 존재하는 것, 생성기 지원, 실제 검수 완료는 서로 다른 상태다.

## 2. 양식별 시작 위치

다음은 확인한 파일 목록이다. 모든 화면의 재검수 완료 또는 모든 종류의 자동 생성 지원을 뜻하지 않는다.

| 대상 | 재사용할 파일·기준 | 현재 재사용 범위 |
|---|---|---|
| 대회 상세 | `competition-engine.html`, `assets/js/kvl-competition-config-v2.js`, `assets/js/kvl-competition-data-v2.js`, `assets/js/kvl-competition-template-v2.js`, `assets/css/kvl-competition-template-v2.css` | 공통 Engine V2 + 대회별 config/data. `docs/KVL_COMPETITION_PAGE_TEMPLATE_V2.md`, `docs/KVL_COMPETITION_PRODUCTION_STARTER_V2.md` 확인 |
| 국내·국제 상세 차이 | `docs/domestic-template-v2.md`, `docs/international-template-v2.md`, `assets/js/kvl-domestic-home-v2.js`, `assets/css/kvl-domestic-home-v2.css` | 대회 규정·성별·순위·진출 조건은 개별 입력/검증. 다른 대회 규칙을 그대로 복사하지 않음 |
| 국내 대회 메인·목록 | `university-competitions.html`, `assets/js/university-hub-years-v1.js`, `assets/css/kvl-domestic-hub-hero-v1.css`, `docs/KVL_DOMESTIC_HUB_HERO_STANDARD_v1.md` | 승인된 허브 코드와 공통 HERO 재사용. 목록까지 만드는 범용 생성기는 이번 작업에서 검증하지 않음 |
| 국제대회 메인·목록 | `international-competition-senior-national-team.html`, `assets/js/international-hub-years-v1.js`, `assets/css/international-hub-years-v1.css` | 현재 연도·종류·카드 구조를 기준으로 수정. 보호된 개별 국제대회 Production과 구분 |
| 선수 목록 | `players.html`, `assets/js/player-workspace-v1.mjs`, `assets/css/player-workspace-v1.css`, `docs/PLAYER_STANDARD.md` | 현재 검색·필터·프로필 연결 재사용. 선수 ID 신규 생성/재매칭은 별도 검수 |
| 선수 프로필 | `player.html`, `assets/js/player-detail-v2.js`, `assets/js/player-canonical-identity-v1.js`, `assets/js/player-profile-integration-v1.mjs` | 기존 ID·MASTER·소속 이력·관리자 메모 접근 제어 유지. 범용 프로필 생성기는 이번 작업의 산출물이 아님 |
| HERO 게시 | `docs/KVL_HOME_HERO_PUBLISH_HANDOFF.md`, `docs/KVL_COMPETITION_HERO_PUBLISHING_RUNBOOK.md` | 자산·경로·해시·프리뷰·승인·게시 확인 절차 재사용 |
| 대회 자동화 | `templates/competition-operations-v1.starter.json`, `scripts/scaffold-competition-v2.cjs`, `docs/KVL_COMPETITION_AUTOMATION_OPERATING_STANDARD_v1.md` | 운영 묶음 생성/검사 가능. 수집기·권한·예약 작업을 자동 개통하는 명령은 아님 |
| 현 V-리그 실행 | `.github/workflows/vleague-auto-update-v1.yml`, `config/automation/vleague-2026-27_v1.json`, `scripts/kovo_vleague_source.py`, `infra/vleague-scheduler/README.md` | 2026–27 시즌에 고정된 부분 존재. 다음 시즌은 공식 소스와 어댑터 지원부터 재검증 |

종합대회 HERO처럼 최근 승인된 특정 페이지의 이미지 배치 변경은 허브 일반 규칙으로 덮어쓰지 않는다.
적용 범위와 최신 PR을 먼저 확인한다. 기존 선수·팀·경기 ID, MASTER 연결, Competition Engine V2,
국제대회 및 KOVO컵 Production을 양식 정리 명목으로 일괄 변경하지 않는다.

## 3. 작업마다 함께 넘길 입력 묶음

아래는 사람이 채우는 요청 양식이다. 그대로 실행하는 JSON 스키마가 아니다.
실제 config/data/operations의 키는 기존 starter와 검증기를 따른다.

```text
작업 목적 / 적용할 페이지 주소:
재사용할 양식과 버전 / 기준 PR 또는 commit:
대회·시즌·성별·단계 / 공식 출처:
기존 Competition_ID·Team_ID·Player_ID·Match_ID 연결:
MASTER 문서·탭·헤더 / 읽기·쓰기 허용 범위:
이번에 바꿀 값 / 보호할 파일·값:
시작·종료 시각(시간대 포함) / 인증 만료일(확인 근거):
실행 환경·버전 / 준비·검사·실행 명령:
예상 결과 / PC·모바일 검수 / 복구 방법:
현재 승인 상태 / 미확인 항목 / 다음 단계:
```

미확인 값은 `NOT VERIFIED`로 남기며 추정한 ID·결과·시각으로 채우지 않는다.
비밀값은 입력 묶음에 넣지 않는다. Secret 이름, 저장 서비스, 최소 권한, 확인된 만료일만 기록한다.
배포 전 PR에는 대상 파일, 입력 변경, 예상 결과, 검증·미실행 항목과 복구 범위를 남긴다.

## 4. 이미 있는 생성·검사 절차

저장소 루트에서 실행한다. 아래 `actual-event-slug`는 확인한 새 대회 slug로 바꾼다.
첫 명령은 새 디렉터리의 초안 파일을 생성한다. 기존 대회 경로에 실행하지 않는다.

```sh
node scripts/scaffold-competition-v2.cjs --slug actual-event-slug
node scripts/scaffold-competition-v2.cjs --check data/competitions/actual-event-slug
node scripts/scaffold-competition-v2.cjs --check-operations data/competitions/actual-event-slug
node scripts/scaffold-competition-v2.cjs --ready-to-activate data/competitions/actual-event-slug
```

생성물은 `config.json`, `data.json`, `operations.json`이며 초기 상태는 DRAFT/비활성이다.
필수 입력·증거를 채우기 전의 준비 검사는 실패할 수 있다. 검사를 통과시킬 목적으로 승인이나
증거를 허위 입력하지 않는다. `--ready-to-activate`는 읽기 전용 검사이며 활성화 명령이 아니다.

현재 계약 CI는 Node 24와 Python 3.12를 사용한다. Cloudflare 운영 안내의 검증 버전은
Wrangler 4.158.0이다. 다음 시즌에는 최신 공식 문서·호환성과 사용 중인 workflow를 다시 확인한다.
외부 쓰기와 배포 명령은 대상·권한·승인 확인 후 실행한다. AI 연결이 없어도 사람이 저장소를
받아 같은 명령을 실행할 수 있으며, 기존 GitHub Actions 입력도 해당 workflow 설명대로 사용한다.

## 5. 다음 시즌 재개 순서

1. 이전 시즌의 공식 최종 결과·MASTER·공개 데이터·보관 manifest를 확인한다. 종료일 도달만으로 보관 완료 처리하지 않는다.
2. 공식 시즌 코드, 일정, 참가팀, 정규리그·준PO·PO·챔피언결정전 등 지원 단계를 새로 확인한다. 기존 어댑터의 시즌 상수를 연도 문자열 치환만으로 갱신하지 않는다.
3. 새 시즌 운영 묶음을 만든다. 기존 선수 ID는 유지하고 새 시즌의 경기·대회 연결은 충돌 없이 검증한다. 이전 시즌 결과·명단 스냅샷을 덮어쓰지 않는다.
4. MASTER 문서·탭·헤더·쓰기 범위·수식·잠금과 인증 접근을 확인한다. 실제 쓰기는 승인된 범위에 한정하고 재조회 증거를 남긴다.
5. 인증 만료일과 실행 종료 경계를 각각 확인한다. 인증이 운영·최종 확인 기간을 포함하도록 준비하고 만료 전 교체와 실패 통지 담당/경로를 기록한다. 만료된 토큰이 자동 갱신된다고 가정하지 않는다.
6. dry-run·계약/회귀 검사·PR 검토 후 승인된 운영 범위를 활성화한다. 기존 중복 방지, MASTER 게시 gate, 알림 중복 방지와 마감 후 쓰기 차단을 유지한다.
7. 실제 publisher → 공식 API → MASTER write/readback → 남녀 운영 JSON → Pages → 공개 화면을 대조한다. 라이브는 경기 중 최소 2회 연속 갱신을 확인한다.
8. 마지막 관측 KST, 30분 이상 갱신 지연, 남녀 동시 표시와 확인된 종료세트 득점을 PC 1440px·모바일 390px/360px에서 검수한다. 단계별 성공/실패/접근 불가를 나누어 기록한다.

## 6. 검수 증거와 남은 확장

문서 정리, 코드 테스트, 배포, 실제 점수 표시 성공을 따로 보고한다.
`tests/competition-v2-config.test.cjs`, `tests/competition-v2-production-starter.test.cjs`,
`tests/competition-operations-v1.test.cjs`는 대회 계약의 기존 검사다.
허브 변경에는 `tests/domestic-hub-hero-parity.test.cjs` 등 해당 범위의 검사와 실제 화면 검수가 필요하다.
합성 fixture는 실제 경기 증거가 아니다. 이번 문서 정리는 새 시즌 실행이나 라이브 검증 통과를 뜻하지 않는다.

향후 개발 우선순위는 양식별 입력 계약 보강 → 미지원 허브/선수 작업의 재사용 도구 → 운영자 입력 폼이다.
입력 폼을 만들더라도 기존 생성·검증·PR·승인 경로를 호출하도록 한다.
현재 모든 양식에 통용되는 원클릭 생성기나 다음 시즌 자동 개통 기능이 완성된 것은 아니다.

## 7. 새 대화 시작 요청 예시

> kvolleylab/kvolleylab 최신 main의 AGENTS.md와 docs/KVL_MODEL_INDEPENDENT_OPERATIONS_v1.md,
> Google Drive 운영원칙 MASTER 및 이번 대상 양식의 승인 기록을 먼저 읽어라.
> 기존 양식을 재사용해 [대회/시즌/페이지]의 확인된 입력만 적용하라.
> 선수·팀·경기 ID와 MASTER 연결을 보존하고, 독립 브랜치에서 검증 후 PR로 제시하라.
> 접근하지 못한 자료와 실행하지 못한 단계는 명시하고, 운영 코드·데이터 배포는 승인 후 수행하라.

직접 저장소·Drive를 읽을 도구가 없으면 위 파일과 필요한 대상 설정을 사용자가 제공한다.
필요한 파일만 전달하며 인증값이나 비공개 선수 메모는 포함하지 않는다.
