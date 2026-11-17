# LA28 요약 카드 대회 연결 복원 v1

2026-11-17 · Base `816f963e4856e5f96f4bf76bd66ccfb9f07f81c9`

## 확인한 문제와 수정

기존 `la28-volleyball-qualification.html`의 대륙선수권·월드컵·세계랭킹은 대회 링크 카드였다. 통합 상단 요약은 일반 article로 바뀌고 링크가 접힌 상세 영역에만 남아 대회 접근성이 저하됐다.

| 카드 | 목적지 | 동작 |
| --- | --- | --- |
| 개최국 | https://la28.org/en/games-plan/olympics/volleyball.html | 공식 실내배구 대회 안내, 새 탭 |
| 2026 대륙선수권 | `continental-championships-2026.html` | 같은 탭, 기존 대륙별 대회 연결 유지 |
| 2027 FIVB 월드컵 | `fivb-world-cup-2027.html` | 같은 탭 |
| 2028 FIVB 세계랭킹 | `fivb-world-ranking-la28-2028.html` | 같은 탭 |

카드 전체를 native anchor로 제공하고 바로가기 문구와 hover/focus 금색 강조를 추가했다. 키보드 Enter로 이동 가능하다. 내부 KVL 링크는 미리보기에서도 같은 사이트의 상대 주소로 동작한다. 세 관련 페이지의 상단 돌아가기만 해당 LA28 통합 로드맵으로 변경했다. 공식 출처는 새 탭으로 유지한다. LA28 공식 배구 URL의 제목과 내용을 공식 사이트에서 확인했다.

## 보존 및 데이터 검토

- 역사 원본 62개, historical CSS·모델·렌더러, 필터, 연도별 열기, 상세 출처 불변.
- `rules.allocation[].link`를 주기별 선택 항목으로 추가했다. 기존 1/5/3/3 배정과 대한민국 상태·공식 근거 ID 불변.
- 사실 확인일 `checkedAt: 2026-11-16`은 그대로 두고 링크별 확인일과 파일 수정일만 2026-11-17로 기록했다.
- 기존 관련 대회 링크 5개와 공식 출처 6개 모두 보존. 공식 LA28 배구 안내 1개만 추가.
- `la28-volleyball-qualification.html`은 변경하지 않았다. 기존 북마크 유효.
- 공개 검토 manifest의 LA28 JSON SHA-256만 해당 파일에 맞게 갱신했다. 확인 범위는 링크 복원이며 결과 재검증을 뜻하지 않는다.
- 관련 월드컵·랭킹 페이지의 오래된 상태 설명은 기존 내용이다. 이번 수정은 대회 연결과 돌아가기이며 해당 페이지의 경기·규정 내용을 새로 검증했다고 주장하지 않는다.

## 로컬 검증

`node --test tests/national-history-model-v1.test.mjs tests/olympic-cycle-v1.test.mjs`: 18/18 통과.

- PC에서 대륙선수권·월드컵·랭킹 카드 → 실제 관련 페이지 제목 → 로드맵 돌아오기 확인.
- 월드컵 카드 키보드 Enter 이동 확인.
- 네 링크의 href, 내부 동일 탭/외부 새 탭 구분 확인.
- 모바일 390px에서 대륙선수권 카드 왕복 이동, 360px에서도 카드 4개와 가로 넘침 없음 확인.
- 실패 필터 17개 → 전체 62개, 2026년 접기/펼치기 확인.
- 상세 규정의 원래 대회·공식 출처 링크 보존 확인.
- 2032 보기: 공식 출전 규정 발표 전, 배정 숫자 0개/카드 링크 0개, 역사 62개 유지.

모바일 검증은 Chromium CSS 뷰포트이며 실제 휴대전화 터치 검증은 아니다. 운영 배포 후 실사이트 화면과 링크를 다시 확인하고 PR에 Pages run과 merge SHA를 남긴다.

## 변경 파일

- `olympic-roadmap.html`: 요약 CSS/JS 캐시 버전.
- `assets/js/olympic-qualification-summary-v1.js`: 데이터 기반 카드 링크, 내외부 이동 구분, JSON 재검증 로딩.
- `assets/css/olympic-qualification-v1.css`: 카드 링크·focus/hover·안내 문구만 추가.
- `data/olympics/la2028_v1.json`: 주기별 대회 URL.
- `continental-championships-2026.html`, `fivb-world-cup-2027.html`, `fivb-world-ranking-la28-2028.html`: 돌아가기 링크만.
- `scripts/quality_audit/public-review-manifest.json`: 변경 JSON 공개 검토 해시와 확인 범위.
- 운영 문서·결정 로그·본 검증 문서.

## 릴리스와 복구

사용자의 운영 연결 승인이 지속되는 보정 작업. 독립 PR에서 변경된 공개 데이터 게이트와 관련 검사 통과를 확인하고 병합한다. 전역 QA의 기존 실패가 있으면 기준 main 보고서와 비교하여 새 finding이 없는지 확인한다. 전역 QA 전체 통과로 표현하지 않는다. 복구는 본 링크 복원 커밋만 revert하며 앞서 완료된 공통 메뉴 연결과 다른 작업은 되돌리지 않는다.
