# V-리그 조견표 v3 검수 — 2026-11-14 KST

**READY FOR REVIEW / NOT DEPLOYED**. 기준 main `774c1ef2504ab891cef9e33611ef80961cc824f0`.
소스와 재현 명령: [프로토타입 README](../../prototypes/vleague-matrix-v3/README.md).

## 출처 및 데이터 대조

- 기존 `data/competitions/v-league-{men,women}-2026-27/data.json`과 `config.json`.
- [2026-27_V리그_경기일정_MASTER](https://docs.google.com/spreadsheets/d/180no_j27R_uw2adWH2BiWbbZ6QUWKVblqymIqNvkBU8/edit), `경기일정_MASTER!A1:S253` 읽기 전용 확인.
- 남녀 각 126경기, 총 252경기의 날짜·팀·라운드·상태·종료 스코어·세트별 점수 대조: 불일치 0건.
- 각 부 종료 12경기. JSON 마지막 결과 갱신: 남자 2026-11-13 20:48:50 KST, 여자 21:09:17 KST.
- KOVO 2026~2027 운영요강 제22조·인쇄쪽 270을 PDF로 직접 확인. 승점과 전체 동률 규칙을 새 모듈에 반영했다.

현재 1라운드 누적(행·열은 아래 순서로 고정):

| 남자 팀 | 순위 | 총승점=R승점 | 여자 팀 | 순위 | 총승점=R승점 |
| --- | ---: | ---: | --- | ---: | ---: |
| 대한항공 | 4 | 4 | GS칼텍스 | 3 | 6 |
| 현대캐피탈 | 2 | 9 | 한국도로공사 | 2 | 9 |
| 우리카드 | 3 | 8 | 현대건설 | 7 | 0 |
| KB손해보험 | 7 | 0 | 흥국생명 | 4 | 6 |
| 한국전력 | 1 | 9 | IBK기업은행 | 1 | 12 |
| OK저축은행 | 6 | 3 | SOOP | 6 | 0 |
| 삼성화재 | 5 | 3 | 정관장 | 5 | 3 |

## 자동화 증거와 한계

기존 [GitHub Actions 실행 43533177053](https://github.com/kvolleylab/kvolleylab/actions/runs/43533177053), publisher job `132256271379`를 읽었다.
2026-11-14 09:19 KST 기록은 `MASTER_VERIFIED_LOCAL_DATA_READY`, 양쪽 126경기 일치·12경기 종료, `standings_verified: true` 및 `master_readback_verified: true`다.
이어 기존 배포 데이터 `DEPLOYED_VERIFIED`, expected/built SHA가 기준 main과 일치한다.
이 실행에서 변경 경기는 0, `changed_files: []`, `build_requested: false`였다. 이 상태는 기존 배포 데이터 확인이며 새 프로토타입 배포를 뜻하지 않는다.

페이지는 기존 자동화가 갱신하는 main JSON을 60초마다 다시 읽는다. 실제 브라우저에서 남자부의 최신 확인 시각이 **11:34 → 11:35 KST**로 자동 변경되었다.
HTTP 실패/복구, 과거 실제 여자부 종료 11경기 → 현재 12경기 재생, 늦은 이전 성별 응답 차단은 자동 검사로 검증했다.
기존 수집 주기(Worker 5분 트리거/약 20분 중복 억제 및 Actions fallback)는 그대로다. 화면 1분 재조회가 KOVO 수집 주기를 1분으로 바꾸지는 않는다.

**새 실경기 발생 이후의 전체 경로는 이 세션에서 관측하지 못했다.** 사용자의 승인 후 운영 연결 및 실제 경기 종료 시 추가 확인이 필요하다.

## 요구사항별 검수

| 항목 | 결과 | 근거 |
| --- | --- | --- |
| PC 6라운드 2×3 | 통과 | 1180px, 남녀 모두 동일 x 2개 / y 3개 |
| 모바일 세로 6라운드 | 통과 | 360·390px, 단일 열 |
| 남녀 팀 순서 고정 | 통과 | previousSeasonRanking과 모든 행/열 일치 |
| 라운드별 세트 스코어 | 통과 | 실제 24개 종료 경기 + MASTER 대조 |
| 0과 미진행 공란 | 통과 | 현대–항공 0 및 미진행 상대 공란, 자기 팀 대각선 |
| 누적/라운드 승점 | 통과 | 현재 공식 8개 지표+순위 일치, 전체 126경기 확장 검사 |
| 3라운드 진행 중 누적 | 통과(합성 검사) | 1~2R 42경기 + 3R 2경기, 총 132점 / 3R 6점 |
| 126경기·6라운드 확장 | 통과(합성 검사) | 각 라운드 21경기·63승점, 시즌 378승점, 팀당 36경기 |
| 360/390/768/1180px | 통과 | 남녀 8조건, 페이지/표 가로 넘침 0px |
| 기존 기능·자동화 보호 | 통과 범위 명시 | 운영 실행 파일/데이터 diff 없음, 기존 검사 55개 통과 |

브라우저 검수는 Chromium 안에서 정확한 폭의 iframe viewport를 사용했다. 터치 기기 실물 및 Safari 검수는 하지 않았다.
성별 클릭은 top-level 실제 페이지에서 확인했고 iframe은 화면 폭 검증에 사용했다.

| viewport | 열 수 | 표 폭 | 팀명 글꼴 | 페이지/표 가로 넘침 |
| ---: | ---: | ---: | ---: | ---: |
| 360px | 1 | 340px | 12px | 0px |
| 390px | 1 | 370px | 12px | 0px |
| 768px | 1 | 717px* | 14px | 0px |
| 1180px | 2 | 448px | 13px | 0px |

*768px에서는 세로 scrollbar 15px를 제외한 내용 viewport 753px. PC는 공통 sidebar 영역을 유지하며 본문 max-width 1180px이다.

## 자동 검사

- 신규 20개 통과, 실패 0. 순위·집계·중복·충돌·누락·결과 정정·미완료 제외·타이머·통신 복구·성별 경쟁 상태·실제 생성 HTML 포함.
- 기존 `vleague-calendar`, `vleague-match-summary`, `vleague-roster-ui`, `vleague-postseason`, `vleague-auto-update-ui`: 총 56개 중 55개 통과, 실패 0, 1개 건너뜀.
- 건너뛴 검사: `KVL_VLEAGUE_CANDIDATE_ROOT`가 없어 신규 수집 후보 UI 통합 검사를 실행하지 않음. 기존 데이터 및 자동화 기록의 실제 읽기 확인으로 대체했다고 간주하지 않는다.

## 변경·복구·다음 단계

변경 범위는 `prototypes/vleague-matrix-v3/`, `tests/matrix-v3/`, 이 검수 문서와 결정 로그다.
생성 `index.html`은 gitignore 처리하며 빌드로 재현한다. 스크린샷·독립 실행 HTML·사용자용 검수 보고서를 별도로 전달한다.
운영 `competition-engine.html`, 공통 JS/CSS, 시즌 data/config, MASTER, 자동화에는 쓰기를 하지 않았다.
승인 전 main 병합/운영 배포 없음. 복구는 프로토타입 브랜치 사용 중단으로 충분하다.
향후 운영 변경 파일과 정확한 순위 아래 연결 지점은 README에 기록했다.
