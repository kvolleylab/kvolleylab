# 올림픽 출전권·대표팀 역사 로드맵 운영 v1

2026-11-16 · 남자 성인대표팀 · 사용자 운영 연결 승인

## 운영 경로

- `national-team.html`의 남자대표팀 ROAD TO LA28 하단 → `olympic-roadmap.html`.
- 여자대표팀의 같은 링크 → 기존 `la28-volleyball-qualification.html`.
- 기존 LA28 URL과 내용은 변경하거나 리다이렉트하지 않는다. 기존 북마크, 규정·대회 링크를 보존한다.
- `national-team-history-verification.html`에서 공식 출처, 미확인 항목, 개별 기록으로 이동할 수 있다.
- 공통 국가대표팀 메뉴의 `올림픽·대표팀 로드맵` 및 대표팀 홈 상단 LA28 현황에서도 접근한다.
- 홈페이지의 기존 `unified-nav.js`로 PC 사이드바·모바일 브랜드 바·로그인·메뉴 활성 상태를 공유한다. 로드맵 내부 CSS·글꼴·행 높이·필터는 별도 범위로 보호한다. 프로토타입 전용 헤더는 운영에 사용하지 않는다. 2026-11-17 연결 보정으로 이전 소형 전용 헤더 방침을 대체한다.

## 요약 배경과 총 출전권

국제대회 허브의 승인된 `kvl-hero-international-hub-{pc,mobile}-v1.webp`를 그대로 재사용한다. 페이지 전용 상단 경로줄은 제거하고 공통 메뉴에서 이동한다. 배정 카드·한국 현황까지 이미지 영역이며 긴 규정 펼침은 흰 바탕을 유지한다. 총수 배지는 주기 데이터의 `totalPerGender`에서 읽으며, LA28은 ‘남녀 각각 총 12장’, 미발표 주기는 ‘규정 발표 전’으로 표시한다. 12를 HTML 상수나 차기 주기 기본값으로 사용하지 않는다.

## 요약 카드와 대회 연결

요약 카드 전체를 실제 링크로 제공한다. `rules.allocation[].link`는 선택 항목이며 `label`, `url`, `checkedAt`을 해당 올림픽 주기에 보관한다. 내부 KVL 대회는 같은 탭에서 열고 외부 공식 페이지는 새 탭으로 구분한다. 대회 페이지 상단의 돌아가기 링크는 해당 주기 `olympic-roadmap.html?cycle=la2028`을 가리킨다. 상세 규정의 기존 대회·공식 출처 링크도 유지한다.

| LA28 요약 카드 | 연결 목적지 |
| --- | --- |
| 개최국 | LA28 공식 실내배구 대회 안내 |
| 2026 대륙선수권 | `continental-championships-2026.html` → 기존 대륙별 대회 |
| 2027 FIVB 월드컵 | `fivb-world-cup-2027.html` |
| 2028 FIVB 세계랭킹 | `fivb-world-ranking-la28-2028.html` |

2032는 규정이 미발표되어 배정 배열이 비어 있으므로 숫자나 LA28 대회 링크를 가져오지 않는다. 차기 주기는 확인된 대회 URL을 자기 설정에 별도로 등록한다. 링크 확인일은 경기 결과/규정 사실 확인일과 구분한다.

## 독립 데이터 계약

| 영역 | 운영 파일 | 수정 기준 |
| --- | --- | --- |
| 대표팀 역사 | `data/national/men-senior-history-v1.json` | 대회별 실제 참가, 출전권, 본선 실패, 예선 탈락, 출처를 각각 검증 |
| 활성 올림픽 | `data/olympics/cycles_v1.json` | 공식 최종 결과 및 관리자 검증 후 명시적으로 전환 |
| LA28 규정 | `data/olympics/la2028_v1.json` | 공식 출처별 규정/배정/대한민국 상태 관리 |
| 2032 대기 설정 | `data/olympics/brisbane2032_v1.json` | 규정 미발표 동안 배정 배열은 비우고 총수는 null |
| 과거 올림픽 | `data/olympics/archives/` | 전환 시 기존 주기의 전체 자료를 보관 |

상단 요약은 역사 JSON을 수정하지 않는다. 날짜만으로 활성 주기가 바뀌지 않는다. `?cycle=brisbane2032`는 확인용 보기이며 활성 설정을 변경하지 않는다. 미확정 규정에는 LA28 숫자를 대입하지 않는다.

역사 데이터는 기존 MASTER ID/대회 연결 URL을 보유하는 검증된 조회용 데이터다. 기존 경기/선수 MASTER를 덮어쓰거나 자동 동기화하지 않는다. 새 기록 추가 시 출처와 확인 날짜 및 `scripts/quality_audit/public-review-manifest.json`의 공개 검토 SHA-256을 함께 갱신하고, 기존 DB와 충돌하면 공식 결과를 재검증한다. v1의 현재 연도 강조는 승인 데이터의 `displayPolicy.currentYear`(2026)를 사용하므로 새해에는 관리자 확인 후 이를 갱신한다.

## 주기 전환 절차

1. LA28 출전권 최종 결과 및 올림픽 종료를 공식 자료로 확인한다.
2. LA28 데이터의 `progressStatus`, `finalOutcome`과 실제 공식 근거를 갱신한다. 테스트용 결과를 운영에 복사하지 않는다.
3. 다음 주기 규정과 한국 상태를 검증한다. 미발표라면 빈 배정/발표 전 안내를 유지한다.
4. 검토 JSON에 `targetId`, `status: approved`, `checkedAt`, `officialBasisIds`를 기록한다. 미발표 안내로 전환할 때만 `approveAwaitingRulesNotice: true`를 명시한다.
5. `node scripts/plan-olympic-cycle-transition-v1.mjs review.json new-plan-directory`로 별도 폴더에 변경안을 생성한다. 이 명령은 운영 설정과 역사 파일을 수정하지 않는다.
6. 변경안의 활성 설정과 아카이브, 필요한 다음 주기 데이터 수정만 별도 PR로 검토한다. 테스트와 PC/모바일 확인 후 승인된 배포 절차를 수행한다.
7. 상단의 과거 올림픽 보기에서 이전 LA28 자료 접근 및 하단 역사 유지 여부를 확인한다.

## 검증 및 복구

```sh
node --test tests/national-history-model-v1.test.mjs tests/olympic-cycle-v1.test.mjs
```

18개 검증은 원본 보존, 참가/출전권 분리, 동시 결과, 미확정 규정의 숫자 차단, 관리자 검증 없는 전환 차단, 전체 LA28 아카이브 보존을 포함한다. PC 및 390/360px CSS 뷰포트에서 필터·연도·상세·출처·수평 넘침을 확인한다. 실제 휴대전화 터치 검증은 별도다.

배포 후 Pages 성공과 실제 홈페이지 링크를 확인하고 PR에 merge SHA, Pages run, 실화면 결과를 기록한다. 복구는 이 운영 연결 커밋만 되돌린다. 다른 작업의 대표팀 카드 색상, Draft Hub, MASTER·자동화 변경은 되돌리지 않는다.


## 2026-11-23 · 대회 상세 표시 기준

사용자가 승인한 간소화 시안은 펼친 대회 영역에만 적용한다. 접힌 대회 행·타임라인·연도·필터·원본 역사 DB와 출전권 모듈은 유지한다. 확인된 일정·핵심 경기·출전 경로를 최대 3행으로 표시하고 영문명·검증 정보·세트 점수·공식 근거는 ‘세부 기록·출처’ 안에 원본 그대로 보존한다. 예선 미참가와 실제 탈락, 월드컵 참가 확정과 올림픽 출전권을 구분한다. 미확인 경위는 핵심 요약에서도 드러내고 불필요한 빈 항목은 만들지 않는다.

표현 전용 `data/national/men-senior-history-summaries-v1.json`은 새로운 결과 DB가 아니다. `basis`의 참조 원본 필드가 현재 역사와 일치할 때만 승인된 요약을 쓴다. 원본 변경 시 요약을 검토하여 갱신하며 일치하지 않으면 현재 구조화된 경기/경로 및 전체 원본 상세로 돌아간다. 원본 데이터의 사실 확인일을 표현 검토일로 바꾸지 않는다. `national-history-detail-v1.js`는 기존 렌더러의 원본 상세 노드를 닫힌 하위 영역으로 옮기며 필터 재렌더링도 처리한다.

표시 모듈 회귀 검증: `node --test tests/national-history-detail-v1.test.mjs`. 기존 역사·주기 보존 테스트와 함께 실행한다. 모바일 390/360px에서 출처를 펼친 상태까지 확인하고 기록 원본과 출처를 임의로 삭제하지 않는다. [검증과 전체 변경 범위](validation/national-history-simple-detail-v1.md).
