# 대표팀 로드맵 빈 상세 보완 v1

- 날짜: 2026-11-23 (KST)
- Base: `15b1faf33d01b646ff1ac5001da1ef2a9066e3b4`
- Branch: `fix/roadmap-detail-completion-v1`
- 상태: USER REQUESTED / RELEASE AUTHORIZED / IMPLEMENTED / LOCAL QA VERIFIED. 병합·Pages·운영 화면 확인은 릴리스 PR에서 기록한다.
- 승인 범위: 앞선 운영 반영 지시와 빈 상세 전수 점검에 이은 사용자 “보완 진행해”. 기존 디자인과 올림픽 모듈은 보존한다.

## 문제와 해결

기본 펼침은 matches·출전 경로·일부 규정만 읽었다. 종료된 대회에 finalRank/result가 있어도 경기 배열이 비어 있으면 요약이 비었다. 점검 당시 전체 62개 중 종료 59개, 그 중 40개의 간단 요약 행이 0개였다. 원본 결과와 출처가 삭제된 문제는 아니었다.

- 5개 대회에 공식 한국 경기 15개를 구조화하고 핵심 요약을 추가했다.
- 경기 자료가 없는 완료 기록은 검증된 result를 읽어 최종 성적을 표시하고 ‘세부 경기 기록 미수록’을 명시한다. 순위만으로 결과를 생성하거나 미확인 result를 확정 표시하지 않는다.
- 결과가 미확인이라면 확인된 실제 참가 여부만 표시한다. 미래 대회에는 완료 결과용 처리를 적용하지 않는다.
- 승인된 요약은 원본 basis가 일치할 때만 사용한다. 변경된 원본에는 현재 구조화된 값으로 돌아간다.
- 원본 전체 기록과 출처, 선수/대회 MASTER ID, 기존 대회 링크는 보존한다. 자동 수집 신규 활성화는 이번 범위가 아니다.

## 추가 경기와 검증 범위

| 대회 | 추가 경기 | 검증 범위 |
| --- | --- | --- |
| 2026 AVC 남자컵 | 태국 2–3, 인도네시아 3–0, 오만 3–2, 카타르 3–1, 바레인 3–1, 인도네시아 0–3 | 한국 전체 6경기 날짜·세트 승수·세트별 득점. 기존 KVL 경기 ID 연결 |
| 2014 AVC 남자컵 | 결승 인도 3–0 | OCA 공식 소개의 결승 승수만. 날짜·세트 득점 미수록 |
| 2018 아시안게임 | 16강 파키스탄 3–0, 8강 인도네시아 3–0, 준결승 타이베이 3–2, 결승 이란 0–3 | OCA의 16강 이후 4경기 승수. 조별리그·날짜·세트 득점 미수록 |
| 2022 AVC 남자컵 | 준결승 중국 2–3, 3위전 바레인 0–3 | 결선 2경기 날짜·승수·세트 득점. 전체 경기 전적은 아님 |
| 2023 AVC 챌린지컵 | 준결승 바레인 0–3, 3위전 베트남 3–1 | 결선 2경기 승수·세트 득점. 개별 날짜·전체 전적 미수록 |

2014/2018/2022/2023은 `matchCoverage: selected_matches` 및 `fieldVerification.matches: partial`로 전체 경기 수록과 구분한다. 확인하지 않은 날짜는 null로 유지했다. 2026 AVC컵의 오만·카타르전 홈/어웨이 점수는 한국 기준으로 뒤집어 표시한다.

### 2018 AVC컵 순위 정정

기존 4위 → **8위**. 기존 AVC `avc-cup-for-men-2`의 2018 행에는 2022 나콘빠톰 대회 순위(중국·일본·바레인·한국)가 들어 있다. AVC 별도 역대 순위표와 공식 연감 printed page 45, §2.1.7(2018 타이베이 제6회 남자컵)은 한국 8위를 일치해 제시한다. 기존 잘못된 값과 URL, 정정 근거를 `conflicts[avc-cup-2018-mislabeled-history-row]`로 보존했다. 2022의 한국 4위는 유지한다.

- [AVC 역대 순위표](https://asianvolleyball.net/new/avc-cup-for-men/)
- [AVC 공식 연감, printed page 45](https://asianvolleyball.net/new/wp-content/uploads/2021/02/Completed-with-appendices.pdf)
- [오기를 가진 원래 표](https://asianvolleyball.net/new/avc-cup-for-men-2/)

## 공식 출처와 접근 한계

- [Volleyball World 2026 결승](https://en.volleyballworld.com/volleyball/competitions/avc-men-cup/schedule/28219/) 및 개별 ID 28190, 28195, 28205, 28210, 28214: 공식 페이지 본문 직접 열람, 날짜·상대·세트 점수 대조.
- [OCA 한국 남자팀 공식 소개](https://www.ocagames.com/HZ_Info/AG2022-/en/results/volleyball/athlete-profile-nvvomteam6-kor1-republic-of-korea.htm): 2014 컵 결승, 2018 아시안게임 결선과 역사 최종 순위 직접 열람.
- [FIVB 2023 챌린지컵](https://www.fivb.com/thailand-qualifies-for-fivb-volleyball-challenger-cup-by-winning-the-2023-avc-challenge-cup/): 한국–베트남 3위전 직접 열람.
- [AVC 2023 준결승](https://asianvolleyball.net/new/thailand-bahrain-one-step-closer-to-winning-avc-challenge-cup-and-the-final-berth-in-fivb-volleyball-challenger-cup/), [AVC 2022 준결승](https://asianvolleyball.net/new/unbeaten-china-japan-set-up-final-clash-of-titans-in-2022-avc-cup-for-men-in-nakhon-pathom/): 공식 원문의 검색 색인 본문을 확인했다. 직접 HTTP 열람은 502/시간 초과. `indexed_official_text_reviewed`와 retrievalNote로 한계를 기록했다.
- [AVC 2022 3위전](https://asianvolleyball.net/new/debutants-bahrain-shut-out-korea-in-stunning-three-sets-to-pick-up-bronze-in-2022-avc-cup-for-men/): 공식 페이지 직접 열람으로 바레인전 0–3 및 세트별 점수 확인.
- 2018 정정용 AVC 역대표와 연감도 공식 검색 색인 본문을 교차 확인했다. PDF 화면/원본 파일 직접 열람 완료로 표시하지 않는다.
- [대한배구협회 월드리그 역대성적](https://www.kva.or.kr/user/template.do?fileNm=bsns4_10): 수록 중인 2006~2014 순위를 재대조했다. 과거 전체 경기 점수 재검증은 아니다.

Drive 대상 출전권 MASTER는 2026-07-25 상태의 규정/출전 경로 표이며 경기 결과 MASTER가 아니다. AVC컵 공식원본의 결과·기록 폴더는 비어 있었다. 따라서 이미 배포된 경기 DB와 공식 경기 페이지를 대조하고 기존 ID를 재사용했다. Drive 파일·폴더/원본은 수정하지 않았다.

## 보존 및 테스트

- 62개 이벤트 ID·순서 유지. 6개 이벤트만 변경, 나머지 **56개 이벤트 객체 동일**.
- 기존 **17개 curated summary 객체 동일**, 5개 추가 → 22개.
- 상단 올림픽 데이터·주기 모델·타임라인 CSS·필터 판정 모델 동일. 전체/핵심/올림픽/실패 = **62/37/16/17**.
- 2026 전체 4개, 올림픽 출전 경로 1개 유지.
- baseline hash 변경 이력과 이전 hash를 reviewedAmendments에 보존했다. 공개 검토 manifest는 두 JSON의 정확한 SHA-256으로 갱신했다.
- Node **60/60 PASS**: 참가/출전권 분리, 최신 원본과 요약 basis, 홈/어웨이 점수, 과거 일부 수록 구분, 미확정 결과 보호, 전환/아카이브 보존.
- 실제 브라우저 PC 1363px: 62개 DOM 전수 확인, 기본 요약 0개는 미래 LA28만. AVC컵 전체 6경기·공식 링크, 4개 필터·연도 접기/펼치기 확인.
- 모바일 iframe CSS viewport 390/360/320px: 레이아웃과 텍스트 확인, 각 document 가로 넘침 없음. 390px에서 세부 출처 펼침·6경기·필터 재렌더링 확인. 물리적 휴대전화 테스트는 아니다.
- 2032 미발표 보기: 숫자/배정 카드 없음, ‘공식 출전 규정 발표 전’, 하단 62개 유지.
- 시드니 2000: 본선 참가·9위 + 세부 경기 미수록 표시. 2018 컵: 8위 표시.
- 외부 공식 출처의 지속 접근과 전체 과거 경기 백필은 완료 조건으로 주장하지 않는다.

```sh
node --test tests/national-history-detail-v1.test.mjs tests/national-history-model-v1.test.mjs tests/olympic-cycle-v1.test.mjs tests/continental-results-v1.test.mjs tests/world-cup-v1.test.mjs tests/olympic-host-v1.test.mjs tests/world-ranking-v1.test.mjs
```

## 변경 파일

- data/national/men-senior-history-v1.json
- data/national/men-senior-history-summaries-v1.json
- assets/js/national-history-detail-model-v1.mjs
- assets/js/national-history-detail-v1.js (모듈 캐시 버전)
- assets/js/national-history-roadmap-v1.js (국가명만)
- olympic-roadmap.html (캐시 버전)
- tests/national-history-detail-v1.test.mjs
- tests/fixtures/olympic-roadmap-baseline-v1.json
- scripts/quality_audit/public-review-manifest.json
- docs/KVL_DECISION_LOG.md
- docs/validation/roadmap-detail-completion-v1.md

## 잔여 범위와 복구

종료 기록의 기본 펼침이 비는 문제는 40 → 0개다. 이는 과거 모든 경기가 완성됐다는 의미가 아니다. 35개는 확인된 최종 성적과 ‘세부 경기 기록 미수록’을 표시한다. 추가한 과거 4개 대회도 선별 경기만 수록했다. 나머지 과거 일정·개별 점수·올림픽 탈락 확정 경기의 기존 unresolved 항목은 유지한다.

운영 확인은 PR의 merge SHA, Pages run, 공개 화면 증거로 기록한다. 복구 시 이 보완 PR만 revert하며 상단 출전권 모듈, 다른 페이지, MASTER나 자동화를 되돌리지 않는다.

## 세부 경기가 미수록인 35개 기록

| 연도 | 대회 | 표시 성적 |
| --- | --- | --- |
| 2000 | 시드니 올림픽 | 본선 참가 · 9위 |
| 2001 | 아시아 남자배구선수권 | 우승 |
| 2002 | 부산 아시안게임 | 금메달 |
| 2003 | 아시아 남자배구선수권 | 우승 |
| 2005 | 아시아 남자배구선수권 | 3위 |
| 2006 | 도하 아시안게임 | 금메달 |
| 2006 | FIVB 남자 세계선수권 | 본선 참가 · 공동 17위 |
| 2006 | FIVB 월드리그 | 10위 |
| 2007 | 아시아 남자배구선수권 | 3위 |
| 2007 | FIVB 월드리그 | 9위 |
| 2008 | 올림픽 세계예선 겸 아시아예선 | 3위 · 출전권 미획득 |
| 2008 | AVC 남자컵 | 준우승 |
| 2008 | FIVB 월드리그 | 13위 |
| 2009 | 아시아 남자배구선수권 | 3위 |
| 2009 | FIVB 월드리그 | 14위 |
| 2010 | 광저우 아시안게임 | 동메달 |
| 2010 | AVC 남자컵 | 6위 |
| 2010 | FIVB 월드리그 | 16위 |
| 2011 | 아시아 남자배구선수권 | 3위 |
| 2011 | FIVB 월드리그 | 13위 |
| 2012 | 올림픽 세계최종예선 겸 아시아예선 | 6위 · 출전권 미획득 |
| 2012 | AVC 남자컵 | 5위 |
| 2012 | FIVB 월드리그 | 14위 |
| 2013 | 아시아 남자배구선수권 | 준우승 |
| 2013 | FIVB 월드리그 | 15위 |
| 2014 | 인천 아시안게임 | 동메달 |
| 2014 | FIVB 남자 세계선수권 | 본선 참가 · 공동 17위 |
| 2014 | FIVB 월드리그 | 19위 |
| 2015 | 아시아 남자배구선수권 | 7위 |
| 2016 | AVC 남자컵 | 8위 |
| 2017 | 아시아 남자배구선수권 | 3위 |
| 2018 | AVC 남자컵 | 8위 |
| 2019 | 아시아 남자배구선수권 | 4위 |
| 2021 | 아시아 남자배구선수권 | 8위 |
| 2023 | 아시아 남자배구선수권 | 5위 |
