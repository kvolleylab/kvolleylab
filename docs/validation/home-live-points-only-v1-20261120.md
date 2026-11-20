# 홈 오늘 경기 득점 숫자 표시 v1 — 2026-11-20

## 범위와 상태

- 기준 main: `d3b6b8b87d2229f0b7f2d718c23ebc52f07ae073`.
- 사용자 요청: 홈 오늘 경기의 `1세트 20–25`, `2세트 25–21`을 `20–25`, `25–21`로 표시. 오늘 실제 자동화도 별도로 확인.
- 상태: REVIEW BRANCH / NOT DEPLOYED. 새 UI 변경의 병합·배포 승인은 별도이며 기존 PR379 승인과 혼동하지 않는다.
- 근본 원인: 홈 inline `matchCard`와 공유 V-리그 summary가 `finished`가 아닌 경우에만 보이는 세트 번호를 붙였다. 기존 최근 경기와 일정표는 숫자만 표시하므로 같은 득점의 표기가 달랐다. 데이터 수집/파싱 오류가 아니다.

## 변경

- `index.html`: 모든 상태에서 세트 득점의 보이는 텍스트는 숫자쌍만 사용. 기존 title과 새 aria-label로 세트 번호를 보존.
- `assets/js/kvl-domestic-home-v2.js`: 동일 요약 화면도 숫자쌍만 사용하고 title/aria-label을 유지.
- `competition-engine.html`: 변경된 공유 JS의 캐시 버전 갱신.
- `tests/vleague-live-recovery.test.cjs`: 기존 두 관측/자동 polling 검사에 숫자 표시·접근성 검증 추가. 0–2, 부분득점, 종료 확인 중, 5개 종료세트, 정확히30분 지연/과거점수 구분 유지.
- 수집기, 원본 JSON, MASTER, 선수/경기ID, 명단, 순위, 국제/Cup 및 Worker 설정 변경 없음.

## 화면과 테스트 증거

- 21:28~21:32 KST 실제1363×936 브라우저 홈·여자 한눈에·여자 일정에서21:14관측 남1–3/4세트, 여2–1/3세트가 공개JSON과 일치했다. 홈/한눈에의 세트번호 문제 재현. 일정표는 이미 숫자만 표시.
- 홈 Console의 유일한 관측 오류는 브라우저 확장 `chrome-extension://...` 메타데이터 오류이며 홈페이지 렌더링 오류로 세지 않는다.
- 로컬 focused DOM 회귀23개 및 기존 V-리그/Cup/달력/명단/스케줄러 전체 Node 회귀104개 통과(실패·건너뜀0). 이는 합성 DOM 테스트이며 실제 새 UI의 브라우저 배포 증거가 아니다.
- 실제1440/390/360 viewport는 현재 브라우저 도구에서 크기 변경 기능을 제공하지 않아 미검증. 모바일 통과로 기록하지 않는다.
- 배포 후 실제 홈/남녀 한눈에 보기의 숫자만 표시, 툴팁 및 관측시각 유지 확인 필요. 되돌림은 이 PR의 표시/캐시 변경만 revert하고 데이터/수집기를 보존한다.

## 오늘 자동화 — 코드 테스트와 분리한 실제 실행 증거


확인 범위: 09:17 일일점검과 경기 중 19:02~21:12 자연 publisher. 코드를 실행하거나 MASTER를 직접 쓰지 않고 실제 GitHub 로그·artifact·공개 commit을 읽었다. 모든 시각은 KST.

| 실행 / 생성 → 공식관측 | 남자 현대캐피탈–한국전력 | 여자 한국도로공사–IBK | source 판정 (남/여) | MASTER 변경셀 / readback | 데이터 commit / Pages / 공개검증 |
|---|---|---|---|---|---|
| [44715778270](https://github.com/kvolleylab/kvolleylab/actions/runs/44715778270) / 19:02:23 → 19:04:13 | 0–0 / 0개: 종료세트 없음 | 0–0 / 0개: 종료세트 없음 | SCHEDULE_COMPLETE / SCHEDULE_COMPLETE | 2 / true | `410be4e0` / [44716094539](https://github.com/kvolleylab/kvolleylab/actions/runs/44716094539) success / 19:05:08 |
| [44718666495](https://github.com/kvolleylab/kvolleylab/actions/runs/44718666495) / 19:22:22 → 19:24:21 | 0–0 / 0개: 종료세트 없음 | 0–0 / 0개: 종료세트 없음 | SCHEDULE_COMPLETE / SCHEDULE_COMPLETE | 0 / true | `336a7641` / [44719003862](https://github.com/kvolleylab/kvolleylab/actions/runs/44719003862) success / 19:25:16 |
| [44721481830](https://github.com/kvolleylab/kvolleylab/actions/runs/44721481830) / 19:42:23 → 19:44:31 | 0–1 / 1개: 20–25 | 1–0 / 1개: 25–23 | SCHEDULE_COMPLETE / SCHEDULE_COMPLETE | 0 / true | `7215e9cd` / [44721826341](https://github.com/kvolleylab/kvolleylab/actions/runs/44721826341) success / 19:45:26 |
| [44724242353](https://github.com/kvolleylab/kvolleylab/actions/runs/44724242353) / 20:02:22 → 20:04:18 | 1–1 / 2개: 20–25, 25–21 | 1–0 / 1개: 25–23 | SUPPLEMENTED / SCHEDULE_COMPLETE | 0 / true | `dfab8339` / [44724568058](https://github.com/kvolleylab/kvolleylab/actions/runs/44724568058) success / 20:05:14 |
| [44726255545](https://github.com/kvolleylab/kvolleylab/actions/runs/44726255545) / 20:16:33 → 20:18:23 | 1–1 / 2개: 20–25, 25–21 | 1–1 / 2개: 25–23, 21–25 | SUPPLEMENTED / SUPPLEMENTED | 0 / true | `7c06c9bb` / [44726567370](https://github.com/kvolleylab/kvolleylab/actions/runs/44726567370) success / 20:19:22 |
| [44728426824](https://github.com/kvolleylab/kvolleylab/actions/runs/44728426824) / 20:32:22 → 20:34:10 | 1–1 / 2개: 20–25, 25–21 | 1–1 / 2개: 25–23, 21–25 | SUPPLEMENTED / SUPPLEMENTED | 0 / true | `2a0c49cb` / [44728719565](https://github.com/kvolleylab/kvolleylab/actions/runs/44728719565) success / 20:35:05 |
| [44731104878](https://github.com/kvolleylab/kvolleylab/actions/runs/44731104878) / 20:52:22 → 20:54:34 | 1–2 / 3개: 20–25, 25–21, 24–26 | 2–1 / 3개: 25–23, 21–25, 25–20 | SUPPLEMENTED / SUPPLEMENTED | 0 / true | `402443ea` / [44731451630](https://github.com/kvolleylab/kvolleylab/actions/runs/44731451630) success / 20:55:29 |
| [44733832938](https://github.com/kvolleylab/kvolleylab/actions/runs/44733832938) / 21:12:22 → 21:14:23 | 1–3 / 4개: 20–25, 25–21, 24–26, 22–25 | 2–1 / 3개: 25–23, 21–25, 25–20 | SUPPLEMENTED / SUPPLEMENTED | 0 / true | `d3b6b8b8` / [44734165771](https://github.com/kvolleylab/kvolleylab/actions/runs/44734165771) success / 21:15:19 |

- 09:17:22 일일점검44644650170 success → 공식09:19:32 / MASTER 변경0셀·readback=true /09:19:53 기존배포 검증. PR379 merge742edae4는 당시 head8f7de0a3의 조상임을 확인.
- 별도로04:35:45 GitHub schedule44599952853도 성공. 공식04:37:31·MASTER 변경0셀/readback=true·04:37:52 기존공개검증. Worker 운영창과 별개 기존 GitHub cron 실행.
- 09:17~21:12 총31회(29 workflow_dispatch +2 schedule) 모두 success. 경기8회는 모두 운영JSON 쓰기 및 DEPLOYED_VERIFIED.
- 경기중8회 모두 공식 승수합과 선택 종료세트 수가 일치. 20:34:10→20:54:34는20분24초 간격의 연속 실제 관측이며 남녀 모두2→3개 종료세트로 증가.
- 대표3회(20:34/20:54/21:14)의 commit 남녀JSON6개를 직접 다운로드하여 배포영수증 SHA256과 일치 확인. 실제 publish job로그의 MASTER readback/commit/배포검증도 일치.
- 경기 진행중 승수/득점은 최종 MASTER 칸에 쓰지 않는 계약. 19:04 상태2셀만 실제쓰기/readback=true; 나머지0셀을 실제쓰기 성공으로 세지 않는다.
- 21:14 남자1–3은 공식 종료시각 공란으로 finalPending=true. 여자4세트24–20은 진행중이므로3개 종료세트에 포함하지 않았다.
- 이번8회 문자중계 counter_state는 모두 CURRENT. PR379의 BETWEEN_SETS 및 FINAL_SUPPLEMENTED 특정 경계분기는 아직 실제 발생/검증되지 않음. 최종결과 MASTER 쓰기는 다음 자연 관측에서 확인해야 한다.
- 과거 두 시점 실제 브라우저화면 및1440/390/360은 이 감사에서 검증하지 않음. 워커 외부감시·Cloudflare 실패알림·GitHub 메일/푸시 수신 역시 별도 미검증.
