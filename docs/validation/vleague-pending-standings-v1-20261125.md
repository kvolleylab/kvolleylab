# V-리그 종료 확인 대기·Pages 확인 보완 — 2026-11-25

상태: **구현 / 로컬 검증 통과 / 새 운영 반영 승인 대기**.
기준 main: `b2ba5e56326b7ac772ceb98887a48725e0e3c5fa`.
브랜치: `fix/vleague-pending-result-resilience-20261125`.
최종 커밋·PR·원격 CI는 이 문서를 포함하는 PR에 누적한다.

## 실제 장애와 판단의 한계

기존 증거는 [PR #262의 21:38 기록](https://github.com/kvolleylab/kvolleylab/pull/262#issuecomment-7162653551)을 따른다.
아래 시각은 모두 2026-11-25 KST다.

| 관측 | 실제 확인 |
|---|---|
| 20:22 publisher [45603816202](https://github.com/kvolleylab/kvolleylab/actions/runs/45603816202) | 배포 확인 단계 `BUILD_RESPONSE_INVALID`. 별도 Pages [45604283181](https://github.com/kvolleylab/kvolleylab/actions/runs/45604283181)은 데이터 `6438cad10c16775a2bdbde2a004f118035ea7d11` 성공. |
| 20:42 publisher [45606906526](https://github.com/kvolleylab/kvolleylab/actions/runs/45606906526) | 같은 확인 오류. Pages [45607286228](https://github.com/kvolleylab/kvolleylab/actions/runs/45607286228)은 데이터 `7eb55b46d196a35f30a66cae51aa8fa0dd02f070` 성공. |
| 21:22 publisher [45613114834](https://github.com/kvolleylab/kvolleylab/actions/runs/45613114834) | 공식 관측 21:24:40 남자 2–2, 4종료세트. 데이터 `b2ba5e56`, Pages [45613557314](https://github.com/kvolleylab/kvolleylab/actions/runs/45613557314), 21:25:39 `DEPLOYED_VERIFIED`. |
| 21:33 publisher [45614876292](https://github.com/kvolleylab/kvolleylab/actions/runs/45614876292) | 21:35:39 남자 공식 일정 2–3이나 종료시각 없음. 같은 경기 문자중계에서 5종료세트 확인. `StandingsError`로 남자 후보 보류, 여자만 검증. MASTER 0셀, 변경 파일 없음. 기존 커밋 배포 확인은 새 남자 최종 결과 게시가 아님. |
| 21:43 독립 공식 읽기 | 일정에 종료시각 21:25가 들어왔고 2–3·5세트와 순위 합계가 기존 코드에서도 일치함. |

남자 한국전력–현대캐피탈 `VL2627-M-022` / `023:001:MALE:43`:
**16–25 / 25–20 / 25–23 / 16–25 / 13–15**, 승수 **2–3**.
여자 IBK기업은행–한국도로공사 `VL2627-W-022` / `023:001:FEMALE:44`:
**23–25 / 16–25 / 22–25**, 승수 **0–3**.

21:33 실행은 원시 순위 응답/상세 불일치 필드를 보관하지 않아 당시 어느 합계가
최초로 어긋났는지 확정할 수 없다. 보존된 종료 대기 조건과 실제 21:43 순위
응답을 조합한 **명시적 혼합시점 재현**에서는 기존 코드가
`official standings mismatch for KEP played`로 중단했다(공식 7, 확정 결과 계산 6).
이 재현은 실제 당시 스냅샷 전체나 실제 라이브 복구 성공으로 표현하지 않는다.

Pages 실패 역시 원시 응답이 없어 당시 URL 변형이 직접 원인이라고 단정하지
않는다. 성공한 별도 Pages 실행과 실패한 확인 단계를 분리하고, 확인 코드의
엄격한 단일 응답 형식 및 재조회 부재를 보완한다.

## 변경과 차단 경계

1. `scripts/kovo_vleague_standings.py`: 공식 합계 불일치에 한해 코드·팀·합계
   필드·공식값·계산값의 제한된 진단을 제공한다. 예외 원문/HTTP 본문/비밀키를
   공개 진단에 복사하지 않는다.
2. `scripts/kovo_vleague_update.py`: 다음 조건이 모두 맞는 경우만 점수 갱신을
   계속한다. 기존 영구 경기 연결과 참가팀이 동일하고, 당일 정규리그 한 경기만
   `finalPending`이며, 모든 종료세트가 새로 관측되고 합법적인 3–5세트 결과와
   승수를 이룬다. 다른 경기·일정·확정 결과에는 변경이 없어야 한다. 기존 순위를
   확정 경기들로 다시 검증하고, 대기 경기를 포함한 임시 계산의 공식 순위 전체
   합계가 모두 맞아야 한다. 임시 계산은 공개 결과/MASTER로 복사하지 않는다.
3. 실제 후보는 `live` / `finalPending`과 검증된 모든 세트 득점을 유지한다.
   기존 순위 객체와 순위 검증 시각은 그대로 보존하고 ‘순위 갱신 대기’를 표시한다.
   종료 확정 표시가 들어온 다음 정상 실행에서만 final/순위/MASTER 확정으로 전환한다.
4. `scripts/kovo_vleague_ops.py`: 최신 Pages build의 고정 GET만 일시 통신/
   응답/5xx 오류 시 최대 3회 제한 재조회한다. 같은 SHA의 진행 중 빌드를 POST
   직전 재확인하며 POST 자체는 재시도하지 않는다. acknowledgement의 같은
   GitHub API 저장소 `latest`/양의 정수 build ID만 허용하고 그 URL을 따라가지
   않는다. 전체 시간 제한과 정확한 커밋·main·남녀 공개 JSON 대조를 유지한다.
5. workflow/알림: 순위 대기 실행은 검증된 점수 게시 후에도
   `STANDINGS_RECONCILIATION_PENDING` 실패와 기존 알림을 남긴다. MASTER·인증·
   보안·main 충돌·실제 Pages 실패는 기존 우선순위로 차단한다.
6. `scripts/kvl_competition_lifecycle.py`: 순위 대기/잘못된 진단이 있는 영수증을
   정상 시즌 보관 증거로 받지 않는다. 정상 빈 목록은 내부에서 허용하되 공개
   보관 자료로 진단을 복사하지 않는다.

선수 MASTER/명단/ID, 경기 ID, 순위 값, 국제대회/Cup 데이터, 화면 CSS/JS,
Worker/cron/승인 변수/비밀키는 이 변경에 포함하지 않는다. 약 20분 허용 주기와
30분 이상 미관측 표시 기준도 변경하지 않는다.

## 검증

| 검사 | 결과 |
|---|---|
| Python `test_kovo_vleague_*.py` | 306 통과: 새 pending 7개, ops 52개, workflow 17개 포함 |
| lifecycle | 53 통과 |
| 선수 현재값 workflow / job 격리 | 9 / 4 통과 |
| 기존 Node 경기·달력·Cup·로스터·라이브·스케줄러 회귀 | 111 통과 |
| 실제 21:43 수집 후보 DOM | 28 통과(공통 계약 22 + 남녀 1440/390/360 DOM 6) |
| 명시적 혼합시점 pending 후보 DOM | 28 통과(동일 공통 계약 포함) |
| 두 후보 quality audit | 통과 |
| 독립 경기일정 MASTER | 21:48:51 FORMULA 읽기; 실제 쓰기 없음 |

실제 21:43 수집 후보는 `READY`, 남자 최종 2–3/5세트, 공식 순위 대조 통과,
MASTER 계획 M44:P44 4셀이다. 혼합시점 후보는 `PARTIAL_READY`, 2–3/5세트
종료 확인 대기, 기존 순위 전체/21:24 검증문구 보존, MASTER 계획 **0셀**이다.
개인 MASTER 전체 스냅샷은 비공개 임시 검증 입력이며 저장소·댓글에 첨부하지 않는다.

새 pending 회귀는 남녀 각 3–0/0–3/3–1/1–3/3–2/2–3, 득점/승수/관측시각
불일치, 공식 8개 합계 오류, 팀/순위 중복·누락, 기존 순위 변조, 경기 신원 연결
초기화/변경, 다른 경기 변경, 확정 결과 수정, 정상 최종 확정 전환/반복 실행을
포함한다. 형식이 맞지 않는 오류를 이 경로로 우회하지 않는다.

DOM 검사는 실제 브라우저 픽셀 검증이 아니다. 코드가 운영에 반영되지 않았으므로
새 코드의 실제 PC1440/모바일390/360·전체 운영 경로·연속 라이브 갱신은 미통과다.

## 승인 후 확인 / 복구

- PR 코드 CI와 읽기 전용 공식 후보 검사를 확인한 후 사용자 승인으로 병합한다.
- 코드 Pages 성공과 첫 자연 publisher의 실제 점수 게시 성공을 별도 기록한다.
- 다음 실제 경기에서 최소 2회 연속 source → 자동 MASTER write/readback →
  JSON → Pages → 실제 홈/남녀 한눈에/일정 표시를 비교한다. 종료 대기 구간의
  5세트 점수, 최종 전환, 기존 순위 보존/해제, 약 20분 간격과 30분 지연 표시도 확인한다.
- 합계 충돌/불완전 종료세트/MASTER·인증 오류가 계속 차단되고, 게시 후에도
  대기 알림이 남았다가 실제 정상 후속 실행에서 회복되는지 확인한다.
- 복구는 이 PR의 코드 변경만 되돌린다. 경기 MASTER나 이미 검증된 공식 결과를
  수동 역수정하지 않는다. Worker와 스케줄은 그대로 둔다.
- Worker 자체 외부 감시, Cloudflare 실패 알림 및 GitHub 메일·푸시 실제 수신은
  별도 미검증이다. 새 실제 관측 없는 반복 운영 알림은 작성하지 않는다.
