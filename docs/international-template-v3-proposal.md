# 국제대회 기본 템플릿 개정안 v3

2026-10-31 · **PROTOTYPE / READY FOR REVIEW** · 운영 반영 미승인

2026 VNL 남자부는 첫 적용 사례다. 이 페이지 자체를 새 기본 템플릿으로 지정하지 않는다. 공통 Competition Engine V2와 기존 config/data를 유지하고 국제 표시 계층을 선택적으로 추가하는 안이다.

## 확인한 기준과 우선순위

- 기준 main: `757f0d2e668ed79a529e2f9554f5f02e9828253d` (2026-10-31 02:19 UTC). 작업 후 원격 main 재확인 결과 동일. 브랜치 `feature/international-template-v3`.
- Google Drive `KVL_운영원칙_MASTER_v16`: 10/28판, Drive 수정 시각 10/27 16:24 UTC. 공식 MASTER·ID·보라색/로즈·Arial·일반 점수 중립색 기준을 확인했다.
- `docs/domestic-template-v2.md`와 참조 v1, 10/25 가독성·트로피, 10/26 달력·예선 집계·모바일 사다리, 10/27 명단 변경을 범위별로 확인했다. 완료된 국내 작업은 재구현하거나 변경하지 않았다.
- `docs/KVL_COMPETITION_PAGE_TEMPLATE_V2.md`, `docs/KVL_COMPETITION_THEME_POLICY_V1.md`, `docs/DEVELOPMENT_WORKFLOW_v1.md`, `AGENTS.md`, `PROJECT_RULES.md`, `DESIGN_SYSTEM.md`, `docs/KVL_DECISION_LOG.md`를 대조했다.
- `KVL_COMPETITION_HERO_IMAGE_GUIDE_v1`: 최신 추가 기준 PC 2108×406 / 모바일 1258×406를 우선한다. 앞부분의 2050px 표기는 새 자산 제작 기준으로 사용하지 않는다. 이번에는 기존 승인 VNL 이미지와 텍스트를 재사용한다.
- 기존 `docs/KVL_COMPETITION_PRODUCTION_GATE_V2.md`의 `VALIDATED_PENDING_PRINT_PDF`와 과거 SHA는 당시 범위의 기록이다. 이번 시안이나 현재 모든 운영 페이지의 상태로 확대 해석하지 않는다. 기존 144/42-case 검증을 재실행하지 않고 변경 영역을 검증했다.
- Drive VNL `01_MASTER`의 일정결과 파일 수정일은 2026-07-21이다. 종료 결과가 있는 현재 JSON보다 이른 스냅샷이므로 이 파일을 현재 최종 결과로 덮어쓰지 않았다. Drive는 읽기만 수행했다. `data/entries/vnl-2026-men-v25-status.json`도 대조했다.

최신 사용자 지시와 해당 범위의 승인 이력이 오래된 일반 문서보다 우선한다. 예: 국내 특정 범위의 금색 점수 지시를 국제 일반 점수에 복사하지 않는다. GAMES 남자부 deep red는 현재 공통 테마 구현에 존재하지만 예전 테마 정책 v1의 목록에는 없다. 승인 후 정책 문서에 이를 명시하는 변경을 별도로 검토한다.

## 세 계층의 소유권

| 계층 | 소유 항목 | 구현 원칙 |
| --- | --- | --- |
| KVL 공통 | 본문 1180px, Arial, 카드·탭·표·경기행·반응형, 기본 Hero/트로피 | 기존 V2 엔진과 토큰 재사용. 국제/국내 엔진 복제 금지 |
| 국내·국제 표시 | 메뉴, 설명 순서, 국기/팀 로고, 참가국 검색, 모바일 밀도 | `structure.presentation`으로 선택. 국제 모듈은 국제 설정만 사용 |
| 개별 시즌 | ID·연도·성별·계열·참가국·규정·단계·명단·공식 근거 | 기존 config/data 및 MASTER 연결을 유일한 원본으로 유지 |

## 이번 코드·설정의 위치

| 경로 | 역할 |
| --- | --- |
| `previews/international-v1/index.html` | 운영과 분리된 검토 진입점; 기존 V2 로더/셸/컴포넌트 사용 |
| `previews/international-v1/model.js` | 설명 참조, 근거 상태, 대회 상태, 공동순위, 달력 기본 월의 국제 공통 계약 |
| `previews/international-v1/presentation.js` | 국제 설명·탭·달력·트로피·전체순위·참가국 검색·선수 링크 표시 확장 |
| `previews/international-v1/presentation.css` | 검토 body ID 아래에만 적용하는 국제 공통 시안 스타일 |
| `previews/international-v1/bootstrap.js` | 검토 전용 adapter; VNL만 허용하고 동일 ID/시즌을 검증 |
| `previews/international-v1/vnl-men-2026.json` | VNL 전용 명칭·단계·근거·집계 범위; 기존 설명을 ID로 참조 |
| `templates/international-presentation-v1.starter.json` | VNL 규칙을 포함하지 않은 재사용 설정 시작점 |
| `previews/international-v1/qa.html` | PC/390/360과 6개 화면을 선택하는 검수 도구 |
| `scripts/verify-international-review-v1.cjs` | 보존·집계·상태·다른 계열 최소 설정 검증 |
| `scripts/build-international-review-v1.py` | 기존 파일과 시안 추가분을 별도 검토 호스트에 패키징 |

배포물에 포함되는 기존 CSS/JS는 같은 원본의 빌드 사본이다. 유지보수용 엔진 복제본이 아니다. 운영 HTML·공통 자산·대회 config/data는 한 파일도 수정하지 않았다.

## 화면과 설명 보존

정보 순서는 **Hero/6개 탭 → 기본 정보·요약 카드 → 대회 의미·시즌 구조 → 월간 달력**이다. PC와 모바일의 순서는 동일하다. 설명 영역은 기본적으로 모두 열린 상태이며 `<details>`로 숨기지 않는다.

| 기존 원문 | 새 표시 위치 | 저장 방식 |
| --- | --- | --- |
| `meaning.title`, `meaning.note` | 설명 제목과 첫 핵심 요약 | 기존 data.json 직접 참조 |
| `qualifications[id=finals]` | 파이널 진출 카드: 제목·설명·각주·확정 8개국 | ref만 새 설정에 저장 |
| `qualifications[id=champion]` | 시즌 최종 성적 카드: 폴란드 우승 원문·확정 결과 | ref만 저장; 종료 상태일 때 표시 |
| `qualifications[id=ranking]` | FIVB 세계랭킹 카드: 설명·각주 | ref만 저장; 2026 공식 근거 연결 |

`brand`, `pill`, `title`, `description`, `foot`, `resultTeams`를 모두 유지한다. 설정에 선언하지 않은 기존 qualifications도 누락시키지 않는다. 원문은 재작성하거나 새 JSON에 복사하지 않았다. 추가한 소개·단계 요약·출전권 관계는 presentation 설정에서 한 번만 관리하며, 승인 시 기존 설명 계약 안으로 연결하는 방식도 가능하다.

국제 공통 설명은 성격/의미, 참가 대상/자격, 진행 구조, 다음 단계 진출, 우승/최종 성적, 랭킹/다른 대회 관계를 담는다. `facts[]`, `flow[]`, 기존 `qualifications[]`의 참조, `relations[]`로 구성한다. 모든 대회에 예선→8강이라는 규칙을 넣지 않는다. 단계 수·명칭·링크는 시즌별 설정이다.

근거 상태는 `verified`(공식 확인), `unverified`(미확인), `not_applicable`(해당 없음)로 구분한다. 공식 확인과 해당 없음은 `sources`가 필수다. 실제로 없는 출전권을 추론하거나, 미확인을 해당 없음으로 바꾸지 않는다. 결과 항목은 예정/진행 중에는 확정 전 안내, 종료 후에는 기존 확정 내용을 표시한다. 진행 중 부분 확정 순위는 기존 `confirmed`만 인정한다.

## 공통 개선과 VNL 전용 설정

| 국제 공통 개선 | VNL 2026에만 해당 |
| --- | --- |
| 6개 기능의 명칭 설정, 국내 기준의 카드·탭·여백·정보 위계 | 메뉴 `예선순위`; 기존 `single-league` 유지 |
| 원문을 보존하는 설명+요약+흐름, 근거 상태 | 18개국·3주·팀당 12경기, 상위 7개국+중국 |
| 결과/규정 구분, 실제 순위 기반 트로피·공동 순위 | 8강→준결승→결승/3위전; 공동 3위 아님 |
| 종료 시 마지막 경기 월, 진행 중 KST 현재 월 | 2026년 8월 기본 달력 |
| 동일한 국기·이름·스코어 축, 중립 점수 | 예선 108경기와 결선 8경기를 분리 |
| 긴 이름 줄바꿈, 내부 표/대진표 스크롤 | 기존 18개국·284명·116경기·Player ID 유지 |
| 참가국 검색/선택 및 기존 국가 경기·선수 프로필 연결 | 기존 VNL Hero와 FIVB 보라색 |

## 색상·Hero·글꼴

| 용도 | 값/근거 |
| --- | --- |
| FIVB 남자 주색/강조/연한 배경 | `#5B3A8E` / `#442A70` / `#F3EFFA` — Theme Policy v1 및 기존 V2 토큰 |
| 일반 스코어·세트 점수 | `#4B5563` — 운영 원칙/Theme Policy. 기존 공통 CSS 금색 충돌은 시안 범위에서만 보정 |
| 본문/보조/배경 | `#1B2B43` / `#64748B` / `#F5F7FB` — 밝은 홈/국내 카드 정보 위계 |
| 우승 트로피/특수 성취 | `#BD912D`; Hero 제목 `#E7C472` — 기존 금색 자산/성취 표현 계열 |
| AVC/GAMES/여자부 | 기존 공통 토큰 재사용. AVC green, GAMES deep red, 모든 여자부 Rose `#8E315E` 우선 |

Arial 및 한글 대체 글꼴을 유지한다. Hero 대회명·날짜·장소는 HTML 텍스트다. 기존 승인 `vnl-men-2026-hero.webp`와 연결된 b64Chunks를 그대로 사용한다. 현재 config는 PC·모바일에 같은 이미지를 지정하고 있으므로 별도 모바일 자산 승인은 이번 범위에 포함하지 않는다.

## 공식 근거와 수정 제안

확인일: 2026-10-31. 공식 사이트는 다음 시즌으로 바뀔 수 있으므로 `verifiedAt`, 시즌, URL을 함께 관리한다.

- [VNL 대회 방식](https://en.volleyballworld.com/volleyball/competitions/volleyball-nations-league/competition/formula): 18팀/팀당 12경기/8강 파이널, 개최국 진출, 최종순위 체계.
- [남자부 순위](https://en.volleyballworld.com/volleyball/competitions/volleyball-nations-league/standings/men/): 예선·최종 결과.
- [FIVB 결승 보도](https://www.fivb.com/poland-defend-vnl-title-outlasting-usa-in-spectacular-five-set-final/): 폴란드 3–2 미국 우승 원문과 부합.
- [2026 VNL 세계랭킹 보도](https://en.volleyballworld.com/volleyball/competitions/volleyball-nations-league/news/ran-takahashi-on-fire-as-japan-strip-poland-of-world-s-number-one-status): 해당 시즌 경기의 랭킹 반영 확인.
- [LA28 출전 체계](https://www.fivb.com/volleyball-and-beach-volleyball-qualification-systems-for-la28-olympic-games-confirmed/): 2026 VNL 직접 출전권과 2028 VNL 예선 종료 시점 세계랭킹 경로를 구분. 2026 직행권은 해당 없음으로 표시.

원문의 파이널·우승·랭킹 설명에서 덮어써야 할 오류는 확인하지 못했다. 순위 비율은 현재 JSON의 반올림 표시(예: 폴란드 2.267)와 공식 사이트의 절사 표시(2.266)가 다를 수 있다. 원본 수치 변경 없이 표시 규칙 통일 여부를 별도 데이터 검토 사항으로 남긴다. 오래된 Drive MASTER와 최신 종료 JSON의 동기화도 디자인 변경과 분리한다.

## 다른 국제대회 적용 절차와 승인 후 범위

1. 해당 시즌의 MASTER·STATUS·공식 규정·승인 Hero와 최신 config 연결 경로를 확인한다.
2. starter에서 기존 ID/시즌/slug를 지정한다. 메뉴 명칭, 단계, 집계 포함 범위, 설명 ref, 근거 상태와 확인일을 입력한다. VNL 설정을 그대로 복사하지 않는다.
3. 기존 standings/knockout/participants/roster 모드를 선택한다. 지원하지 않는 대진 방식은 공통 선택 모듈로 확장·검증한 뒤 연결한다. 규정을 표시 모듈에 구현하지 않는다.
4. 명단·국가·Player ID를 변경하지 않고 검토 전용 adapter에서 계약과 화면을 확인한다. 이번에는 AVC/FIVB/GAMES 남녀 6개 비운영 fixture로 계약 재사용성만 검증했다. 모든 대진 방식의 UI 검증을 뜻하지 않는다.
5. 사용자 시안 승인 후 별도 release PR에서 국제 JS/CSS를 공통 자산으로 승격하고 기존 loader의 선택 후처리 훅에 연결한다. 운영 파일 교체를 이 prototype PR에 포함하지 않는다.
6. 승인된 대회의 config만 `international-home-v1`을 선택하도록 하고 해당 범위의 PC/모바일·데이터 회귀 검증을 수행한다. 국내·AVC Production 및 미선택 국제대회에는 적용하지 않는다.
7. 롤백은 대상 config의 presentation 선택을 제거하고 승인 직전 공통 자산으로 복구한다. 이번 시안은 별도 URL/브랜치만 폐기하면 운영 복구 작업이 필요 없다.

상태: 구현·검토 배포 완료 후 **READY FOR REVIEW**, KVL 운영 **NOT DEPLOYED**. 사용자의 시안 승인과 대상 대회 지정이 다음 단계다. 상세 증거는 [검수 보고서](validation/international-vnl-review-v1.md), [자동 검증 결과](validation/international-vnl-checks-v1.json)를 참조한다.
