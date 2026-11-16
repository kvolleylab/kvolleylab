# KVL 국가대표 역사 로드맵 v1

Status: PROTOTYPE / READY FOR REVIEW / PRODUCTION NOT CHANGED

대한민국 남자 성인 대표팀의 2000–2028 주요 기록 62개를 읽기 전용 JSON으로 표시합니다. 모든 대회의 전수 기록이 아닙니다. 시작일·예선 세부 경위 등 미확인 항목은 공란으로 보존하며 화면에도 확인 중으로 표시합니다.

## 실행 및 검증

별도 패키지 설치가 필요 없습니다. 이 디렉터리를 정적 HTTP 서버의 루트로 제공하고 `index.html`을 엽니다. `file://` 직접 실행은 JSON fetch 제한 때문에 지원하지 않습니다. `verification.html`은 전체 출처와 미확인 목록입니다.

```sh
python3 scripts/build_data.py
node --test tests/model.test.mjs
```

`tests/viewport.html`은 360/390/640/1280px iframe CSS 뷰포트 검증용입니다. 실제 모바일 기기·OS 검증을 대체하지 않습니다.

## 데이터 갱신

1. `data/*_research.json`의 공식 원문 URL·확인 근거·필드별 상태를 검토합니다.
2. 확인된 값만 수정하고 `scripts/build_data.py`의 확인일을 갱신합니다.
3. 생성 명령과 테스트를 실행합니다. `data/roadmap_v1.json`은 생성 산출물이며 HTML에 결과를 직접 입력하지 않습니다.
4. 브라우저에서 전체/핵심/올림픽/진출 실패, 연도와 대회 펼침, 출처, 미래 일정, 모바일을 검수합니다.
5. 운영 반영은 별도 승인 후 수행합니다. 이번 브랜치는 운영 연결·자동화·Drive 수정이 없습니다.

## 데이터 계약

| 필드 | 의미 |
|---|---|
| id / competitionId | 국가별 기록 ID / 기존 KVL 대회 slug 또는 기록 ID. 선수·경기 ID를 새로 발급하지 않음 |
| country / gender / ageCategory | KOR / M / senior. 연령별 기록을 혼합하지 않음 |
| year / editionYear / heldYear | 타임라인 배치 연도 / 공식 대회 명칭 연도 / 실제 개최 연도 |
| nameKo / officialName | 한국어 표시명 / 해당 연도 공식 대회명 |
| startDate / endDate / dateScope | ISO 날짜 또는 null. 올림픽 전체 기간과 배구 경기 기간 구분 |
| eventStatus | completed 또는 scheduled_confirmed. 개최가 확인되지 않은 미래 대회는 events에 삽입하지 않음 |
| actualParticipation | 실제 본선·대회 참가 true/false, 미래 또는 배분 절차 null |
| participationConfirmed / participationStatus | 참가 확정과 실제 참가를 분리. 미정·해당 없음 구분 |
| finalRank / result / matches | 최종 순위, 표시 결과, 공식 경기. 미래 결과는 null |
| qualificationOutcomes[] | 한 대회의 여러 출전권 결과. qualified / not_qualified / not_qualified_via_this_route / pending |
| qualifierParticipation / eliminationStage / eliminationMatch | 실제 예선 참가 근거와 탈락 단계·경기. 미확인은 null |
| importance / displayStyle | key/major/normal 및 gate/neutral. 실패 색상은 결과에서 계산 |
| verificationStatus / verificationScope / fieldVerification | 참가·표시 결과의 confirmed/partial 및 날짜 등 필드별 confirmed/partial/unverified/pending |
| sourceIds / officialSourceUrls / verifiedAt / updatedAt | 공식 출처, 확인일, 수정일 |
| existingLinks | 기존 홈 projection, competition master, registry, KVL 경로 |

`not_qualified_via_this_route`는 해당 경로의 출전권 미획득입니다. 다른 경로가 남은 LA28 전체 본선 실패로 바꾸지 않습니다. 2025 세계선수권은 본선 참가와 16강 실패를 동시에 보존합니다. 2020 도쿄는 2021년 실제 개최를 별도로 보존합니다.

과거 기록에서 날짜를 모른다고 불참 처리하지 않습니다. `verificationStatus=confirmed`는 `verificationScope`에 명시한 참가·표시 결과만 의미하며, 날짜의 확정 여부는 `fieldVerification.dates`를 확인해야 합니다.

## 운영 연결 계획

기존 대표팀 홈에서 이 정적 projection을 읽는 어댑터를 연결하는 방식을 권장합니다. 2026 대회 slug와 AVC컵 MASTER ID를 유지합니다. 기존 2000–2019 `national_team_history_*`는 U18–U23 자료이므로 성인 데이터로 재사용하지 않습니다. 현재 코드에는 운영 DB 쓰기, API 키, 자동 갱신, 회원 정보가 없습니다.

올림픽 주기가 바뀔 때 `cycle`, `scope`, `displayPolicy`와 상단 제목을 갱신하되 기존 이벤트 ID와 출처는 보존합니다. 기본 펼침은 최근 3개 연도 및 현재 주기, 미래 확인 대회입니다. v1 기준 현재 연도는 확인 시점인 2026으로 고정되어 있습니다.
