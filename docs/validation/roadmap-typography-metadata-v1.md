# 로드맵 글씨 크기·기간·장소 표시 v1

검증일: 2026-11-23 (KST). 기준 main: `b6e6fa1c9115c82a9bd69dfe20272d1d7242da11`.

사용자가 운영 중인 로드맵의 출전권 카드 제목 4개를 2px 확대하고, 펼친 대회의 기간·장소를 요일 포함 형식과 ‘준결승’ 항목 크기로 표시하도록 요청했다.

## 변경

- 출전권 카드 제목: PC 14→16px, 640px 이하 모바일 11→13px. 초기 h3와 각 카드 펼침 모듈이 만든 `.oq-quota-title` 모두 적용한다.
- 펼친 대회 기간·장소: 12→14px, 남색 `#193b60`, 굵기 500. ‘준결승’ 등 상세 항목과 동일한 크기를 상속한다.
- 예시: `2026.09.04(금)~09.13(일) 일본 후쿠오카`. 좁은 화면에서는 기간과 장소 사이에서 줄바꿈한다.
- UTC 기준 날짜 파싱과 유효 날짜 확인으로 요일을 표시한다. 연도가 다르면 양쪽 연도를 표시하고, 시작·종료일만 알려진 경우 그 범위를 명시한다. 미확인 날짜를 만들지 않는다. 올림픽 전체 기간 표시는 유지한다.
- 개최지는 기존 대회 ID와 공식 출처를 대조한 별도 표시 메타데이터로 연결한다. 원본 역사 기록 62개, 결과·참가·출전권 상태, 기존 16개 요약 결과와 근거 대조 필드는 보존한다.
- 아시아선수권 개최지 출처 1개를 기존 ‘세부 기록·출처’에 추가한다. 기존 출처와 상세를 삭제하지 않는다.

## 개최지 근거

| 기록 | 표시 | 공식 자료 |
| --- | --- | --- |
| 2026 AVC 남자컵 | 인도 아마다바드 | [Volleyball World](https://en.volleyballworld.com/volleyball/competitions/avc-men-cup/news/indonesia-triumph-in-ahmedabad-for-first-ever-avc-cup-honors) |
| 2026 남자 동아시아선수권 | 몽골 울란바토르 | [JVA](https://www.jva.or.jp/international2026/menasianeastern/) |
| 2026 AVC 남자 아시아선수권 | 일본 후쿠오카 | [JVA](https://www.jva.or.jp/international/2026/asianchampionship_men/) |
| 2026 아이치·나고야 아시안게임 | 일본 아이치 | [JVA](https://www.jva.or.jp/international/2026/asia_men/) |

아시아선수권은 후쿠오카현 기타큐슈시립 종합체육관, 9월 4일(금)~13일(일)로 확인했다. 아시안게임 배구장은 아이치현 오카자키·고마키이며 종합대회 개최지 명칭을 경기장 도시로 추정하지 않았다. 나머지 장소는 기존 확인 필드만 사용하며 미확인 장소는 공란으로 둔다. Drive MASTER `한국_진행현황!A1:L12`도 읽기 대조했으나 2026-07-25의 이전 상태여서 최신 공식 자료를 덮어쓰지 않았다. Drive·MASTER·대회 DB 쓰기는 없다.

## 검증

- Node 55/55 통과: 역사 상세 9, 기존 역사·올림픽 주기·대륙·월드컵·개최국·세계랭킹 회귀 검사 46. 날짜 오류·윤년·연도 경계·단일 날짜·미확인 날짜·공식 출처 누락·대회 ID 불일치 검사 포함.
- 실제 브라우저 PC: 4개 카드 제목 모두 16px, 상세 기간과 ‘준결승’ 모두 14px, 기간 색상 `rgb(25, 59, 96)` 확인.
- 실제 브라우저 모바일 iframe 390/360px: 카드 제목 13px, 상세 기간 14px. 390px에서 기간·장소 한 줄, 360px에서 장소가 다음 줄로 자연스럽게 배치됨. 문서 폭/스크롤 폭 각각 375/375, 345/345로 가로 넘침 없음.
- 상단 4개 카드 펼침, 아시아선수권 상세 및 출처 7개, 실패 필터 17개와 전체 62개 복귀 확인.
- 원본 역사 JSON·렌더러·모델·CSS 바이트 보존 검사 통과. 기존 연도·필터·실패 구분·출전권 데이터는 변경하지 않는다.
- 운영 병합과 Pages 배포 결과는 해당 PR에 후속 기록한다. 이 문서 작성 시점은 로컬 검증 완료 단계다.

## 변경 파일·복구

`olympic-roadmap.html`, `assets/css/olympic-qualification-v1.css`, `assets/css/national-history-detail-v1.css`, `assets/js/national-history-detail-model-v1.mjs`, `assets/js/national-history-detail-v1.js`, `data/national/men-senior-history-summaries-v1.json`, `tests/national-history-detail-v1.test.mjs`, `scripts/quality_audit/public-review-manifest.json`, `docs/KVL_DECISION_LOG.md`, 본 문서.

QA용 iframe 페이지는 커밋에 포함하지 않는다. 복구는 이 변경 커밋만 revert하고 Pages 배포를 확인한다. 원본 역사 데이터와 상단 출전권 규칙은 복구 대상 변경에 포함되지 않는다.
