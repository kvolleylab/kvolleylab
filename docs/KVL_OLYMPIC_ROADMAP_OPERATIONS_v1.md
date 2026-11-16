# 올림픽 출전권·대표팀 역사 로드맵 운영 v1

2026-11-16 · 남자 성인대표팀 · 사용자 운영 연결 승인

## 운영 경로

- `national-team.html`의 남자대표팀 ROAD TO LA28 하단 → `olympic-roadmap.html`.
- 여자대표팀의 같은 링크 → 기존 `la28-volleyball-qualification.html`.
- 기존 LA28 URL과 내용은 변경하거나 리다이렉트하지 않는다. 기존 북마크, 규정·대회 링크를 보존한다.
- `national-team-history-verification.html`에서 공식 출처, 미확인 항목, 개별 기록으로 이동할 수 있다.
- 기존 승인 시안의 작은 KVL 헤더를 사용한다. 전역 내비게이션 스크립트의 사이드바/폰트 강제 규칙을 주입해 승인된 로드맵 레이아웃을 바꾸지 않는다. 공통 홈페이지 헤더·사이드바는 변경하지 않는다.

## 독립 데이터 계약

| 영역 | 운영 파일 | 수정 기준 |
| --- | --- | --- |
| 대표팀 역사 | `data/national/men-senior-history-v1.json` | 대회별 실제 참가, 출전권, 본선 실패, 예선 탈락, 출처를 각각 검증 |
| 활성 올림픽 | `data/olympics/cycles_v1.json` | 공식 최종 결과 및 관리자 검증 후 명시적으로 전환 |
| LA28 규정 | `data/olympics/la2028_v1.json` | 공식 출처별 규정/배정/대한민국 상태 관리 |
| 2032 대기 설정 | `data/olympics/brisbane2032_v1.json` | 규정 미발표 동안 배정 배열은 비우고 총수는 null |
| 과거 올림픽 | `data/olympics/archives/` | 전환 시 기존 주기의 전체 자료를 보관 |

상단 요약은 역사 JSON을 수정하지 않는다. 날짜만으로 활성 주기가 바뀌지 않는다. `?cycle=brisbane2032`는 확인용 보기이며 활성 설정을 변경하지 않는다. 미확정 규정에는 LA28 숫자를 대입하지 않는다.

역사 데이터는 기존 MASTER ID/대회 연결 URL을 보유하는 검증된 조회용 데이터다. 기존 경기/선수 MASTER를 덮어쓰거나 자동 동기화하지 않는다. 새 기록 추가 시 출처와 확인 날짜를 함께 갱신하고, 기존 DB와 충돌하면 공식 결과를 재검증한다. v1의 현재 연도 강조는 승인 데이터의 `displayPolicy.currentYear`(2026)를 사용하므로 새해에는 관리자 확인 후 이를 갱신한다.

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
