# 대륙선수권 우승국·LA28 출전국 연결 v1

- 확인일: 2026-11-18 (KST)
- 상태: 사용자 운영 반영 승인 / 구현 및 로컬 검증 완료. 배포 상태는 PR의 최종 증거로 확정.
- Base: `6f1d6bf6cd2975ac6d9fa68912e8318b36cc5cd3`
- Branch: `feature/continental-winners-inline-v1`
- 승인 시안: https://kvl-roadmap-continental-v1.daewook1029.chatgpt.site (commit `9235092ecc63a704c5354f753ef36a45954ac1e2`)
- 운영 진입: `/olympic-roadmap.html` → `2026 대륙선수권 5장`

## 동작과 보존

요약 카드에서 바로 펼치는 남녀 5대륙 결과와 기존 대회 링크를 추가했다. 우승과 출전권은 별도 필드이며 검증되지 않은 출전권은 우승국으로 대신 채우지 않는다. 기존 `continental-championships-2026.html` 및 `continental-championship-2026.html?id=…`도 같은 결과 JSON을 참조한다. 상세 복귀 링크에 `continental=men|women`을 보존하며 국가대표팀 메뉴 활성 상태를 유지한다. 선수·경기 DB는 변경하지 않는다.

62개 역사 기록, 역사 CSS/모델/렌더러, 기존 로드맵 `<main>`은 변경하지 않았다. 필터·연도·대회 상세를 유지한다. 기존 LA28 외부/대회 연결과 1/5/3/3 배정을 유지한다. 2032 미발표 주기는 숫자나 LA28 대륙 결과를 재사용하지 않는다. QA용 iframe, 미리보기 index, 링크 어댑터 및 Sites 설정은 운영에 넣지 않는다.

## 결과 검증

| 대륙 | 남자 우승 | 남자 LA28 대륙 출전권 | 여자 우승 | 여자 LA28 대륙 출전권 |
|---|---|---|---|---|
| AVC | 일본 | 일본 | 태국 | 태국 |
| CEV | 폴란드 | 폴란드 | 튀르키예 | 튀르키예 |
| CAVB | 튀니지 | 튀니지 | 이집트 | 이집트 |
| CSV | 브라질 | 브라질 | 브라질 | 브라질 |
| NORCECA | 미국 | 쿠바 | 캐나다 | 캐나다 |

미국은 개최국이며 NORCECA 대륙 배정과 중복되지 않는다. NORCECA는 미국을 제외한 상위 4팀의 별도 결정전으로 대륙 출전권을 배정한다. 여자 캐나다도 두 결과에 독립 출처를 둔다.

결과별 FIVB 공식 원문 URL, 발표일, 검증일과 12개 Source ID는 `data/olympics/la2028-continentals-v1.json`의 `sources`에 보존한다. `championship.sourceIds`와 `qualification.sourceIds`가 각각 근거를 가리킨다. 전체 기사나 비공개 자료는 저장하지 않았다.

대회 기간·개최지는 [FIVB 대륙선수권 안내](https://www.fivb.com/continental-championships-set-the-course-for-la28-and-world-cup-qualification/)로 대조했다. 기존 CAVB 남자 개최지/일정과 여자 일정, 미확인으로 남아 있던 NORCECA/CSV 정보를 정정했다. 변경 전 값과 근거는 `data/national/continental-championships-2026.json`의 `revision_note`에 보존했다. AVC 남자 장소는 기존 정식 대회 페이지의 후쿠오카현 기타큐슈와 일치시켰다. 이전 참가국/World Cup 관계 필드는 승격하거나 새로 추정하지 않았다.

## 검증

- `node --test tests/national-history-model-v1.test.mjs tests/olympic-cycle-v1.test.mjs tests/continental-results-v1.test.mjs`: 25/25 통과.
- 10대회 ID·성별·대륙 일대일 연결, 공식 근거, NORCECA 예외, 미확인 출전권 대체 금지, LA28/2032 분리와 역사 보존을 검사했다.
- PC 실제 브라우저: 기본 접힘/펼침, 남녀 전환, NORCECA 남녀 상세 이동과 같은 성별 복귀, 기존 허브의 10개 결과/공식 링크, 공통 메뉴 활성 확인.
- 모바일 390px iframe 실제 브라우저: 가로 넘침 없음, 5개 행, 남녀 전환/대회 이동/성별 복귀 확인. 승인 시안에서 360/390/900/901/1280px와 키보드 Enter/Escape, 역사 필터 62/37/16/17, 연도·대회 상세를 검증했다.
- 변경 공개 JSON 3건은 정확한 SHA-256·검증 근거를 `public-review-manifest.json`에 기록한다. PR CI와 최종 Pages/운영 화면 결과는 PR에 추가한다.

## 한계와 관리

아시아는 기존 정식 대회 페이지를 연결한다. 나머지 8개 기존 안내 페이지에는 전체 경기별 스코어·조별 순위·최종 로스터가 아직 수록되지 않았다. 이를 공식 발표 대기 또는 국가 불참으로 표현하지 않는다. 원문 내 모순된 부수 문장(여자 브라질 기사의 차기 월드컵 개최국, 쿠바 기사의 준결승 요일)은 결과 데이터에 넣지 않았다. 이 작업은 자동 수집기나 Drive 원문 아카이빙을 새로 실행한 작업이 아니다.

Google Drive 운영 MASTER v19와 최신 저장소 운영 기준을 확인했다. 최신 승인된 밝은 배경·Pretendard·공통 사이드바를 유지하며 과거 일반 Dark/Arial 문서로 되돌리지 않는다.

## 변경 범위와 복구

요약 진입 HTML/렌더러, 대륙 selector CSS/JS/모델/JSON, 기존 대륙 허브·상세 HTML/렌더러/메타데이터, 공동 결과 표현 CSS/JS, 회귀 테스트, 공개 검수 manifest와 이력 문서가 범위다. V-리그 자동화, 선수·팀·회원, 국제대회 경기 DB, 글로벌 내비게이션은 변경하지 않는다.

문제 시 이 PR의 squash merge commit을 되돌리는 별도 fix PR로 복구한다. 기존 URL을 삭제하지 않으며 unrelated main 변경을 덮어쓰지 않는다. 새 펼침만 중지하려면 `la2028_v1.json`의 `continentalOverview`를 제거하고 export hash 검수 후 배포하면 기존 대륙선수권 안내 링크로 돌아간다. 과거 역사 자료와 주기 데이터는 유지한다.
