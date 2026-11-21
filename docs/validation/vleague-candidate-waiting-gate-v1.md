# 경기 시작 직후 후보 검사 보완 v1 — 2026-11-21

## 상태와 범위

- USER REQUESTED REPAIR / LOCAL QA PASSED / NOT DEPLOYED.
- 기준 main: `26842dd922c96219d4f90e0671a62becc05f7709`.
- 브랜치: `fix/vleague-candidate-waiting-state`.
- 사용자 요청: 오늘 확인한 자동 검사 오류 보완. 새 PR의 운영 병합·배포 승인은 별도다.
- 변경은 후보 UI 검사·회귀 검사·이 기록 및 결정 로그뿐이다. 실제 화면, 수집기, 점수, 경기/선수 ID, MASTER, 명단, 순위, 국제/Cup, Worker/cron, workflow와 승인 조건은 변경하지 않는다.
- 선행 PR382는 승인 병합 `2929efbf1149d914acd017cb5f0be0c057d5c7e3`, Pages44748088777로 배포됐다. 이전 검증 문서의 DEPLOYMENT PENDING은 그 이후 PR의 실제 배포 증거로 대체된다. 이번 검증기 변경까지 승인한 것은 아니다.

## 실제 실패와 원인

[publisher44878079575](https://github.com/kvolleylab/kvolleylab/actions/runs/44878079575)는 2026-11-21 **15:59:10 KST** 생성됐다. 공식 후보 수집 **16:00:13**에는 성공했다. 남자 삼성화재–OK저축은행은 **2–1 / 종료 3세트**, 여자 SOOP–정관장은 **16:00 시작 이후 아직 미관측**이었다.

실제 UI는 시작 이후 미관측 경기를 `waiting / 상태 확인 중 / —`로 표시한다. 그러나 `tests/vleague-auto-update-ui.test.cjs`의 기존136행은 liveScore가 없으면 항상 `VS`를 기대했다. 후보 시각을 고정한 테스트에서도 발생하는 상태 계약 누락이다. 남녀 두 카드를 함께 확인하는 6개 검사가 모두 실패해 publish가 생략됐다. 공식 점수 수집 실패나 PR382의 숫자 표시 오류가 아니다.

공개 성공 관측 **15:44:07→16:19:19 = 35분12초** 공백이 있었고 다음 자연 실행에서 회복됐다. Issue257의 [실패 알림](https://github.com/kvolleylab/kvolleylab/issues/257#issuecomment-7058991721)과 [복구 알림](https://github.com/kvolleylab/kvolleylab/issues/257#issuecomment-7059212194)은 기존 기록이며 중복 발송하지 않았다. [오늘 전체 읽기 검증](https://github.com/kvolleylab/kvolleylab/pull/262#issuecomment-7061330535)과 이 수정의 검증 상태는 구분한다.

## 수정 계약

후보 검사 기대값은 production `matchSummaryState` 반환값을 그대로 가져오지 않고 독립적으로 판정한다. `VS`와 `—`를 둘 다 허용하거나, 후보 시각을 경기 전으로 돌리거나, 검사 실패를 무시하지 않는다.

| 후보 상태 | 중앙 승수 | 상태 안내 |
|---|---|---|
| 시작 전 미관측 | VS | 예정 |
| 시작 정각부터 30분 미만 미관측 | — | 상태 확인 중 |
| 시작 후 정확히30분 이상 미관측 | — | 갱신 지연 / 최종 관측 없음 |
| 유효한 관측 후30분 미만 | 실제 승수(0–1, 0–2 포함) | 진행 중 / KST 관측시각 |
| 3승이나 공식 종료 미확정 | 실제 승수 | 종료 확인 중 / 최종 결과 미확정 |
| 유효한 관측 후 정확히30분 이상 | — | 갱신 지연 / 당시 승수·KST / 과거 득점 |
| 최종 확정 | 최종 승수 | 종료 / 최종 득점 |

잘못된 경기 key, 출처 origin/endpoint, 관측시각, 관측일, 승수, finalPending 계약 위반은 계속 실패한다. 득점은 후보의 종료세트와 정확히 비교하며, 숫자만 표시·세트 번호 title/aria·과거 득점 라벨도 검사한다. 후보 남녀 JSON의 불변성 검사와 기존 순위·명단·링크 검사는 유지한다.

## 검증 결과

1. **실제 실패 artifact 재현:** run44878079575의 후보 남녀 JSON을 변경하지 않고 사용했다. 수정 전 실제 후보 DOM **0/6 통과**, 모두 `— !== VS`. 수정 후 같은 후보 **6/6 통과**. 이는 당시 공식 후보의 로컬 재실행이며 새로운 실경기/배포 증거는 아니다.
2. **현재 최종 공개 데이터 재실행:** 위 기준 main의 남녀 JSON으로 후보 DOM **6/6 통과**. 남3–1/4세트, 여2–3/5세트를 보존했다.
3. **새 독립 후보 계약:** 합성 경계/잘못된 입력 **22/22 통과**. 실제 후보 검사와 구분한다.
4. **기존 workflow Python 검사:** 수집·파싱·MASTER·게시·종료 기간·선수 작업 분리 **292/292 통과**, 실패/건너뜀0.
5. **기존 workflow Node 검사:** 경기·Cup·달력·명단·요약·스케줄러와 새 실제 renderer 경계 검사 포함 **110/110 통과**, 실패/건너뜀0. 새 renderer6개는 시작 −1ms/정각/+13초/+29분59.999초/+30분 및 남live/여waiting 혼합 상태를 남녀 양쪽 진입에서 확인한다.
6. **독립 코드 리뷰:** 상태 기대값과 production 분리, 잘못된 입력 차단, 변경 범위 검토에서 차단 사항 없음.

재실행 예시(jsdom26.1.0을 checkout 밖에 설치):

```sh
KVL_JSDOM_PATH=/path/to/node_modules/jsdom \
KVL_VLEAGUE_CANDIDATE_ROOT=/path/to/actual-artifact/candidate \
node --test tests/vleague-auto-update-ui.test.cjs

KVL_JSDOM_PATH=/path/to/node_modules/jsdom \
node --test tests/vleague-match-summary.test.cjs tests/vleague-live-recovery.test.cjs
```

후보 파일과 비밀키는 이 PR에 커밋하지 않는다. DOM 검사의1180/390/360 조건은 브라우저 픽셀 검증이 아니다. 앞선 읽기 감사에서 독립 MASTER FORMULA와 현재 공개JSON·실제1363px 최종 화면은 일치했지만, 이 변경의 라이브 검증으로 계산하지 않는다.

## 승인 후 확인·복구

- PR CI 성공 확인 후 별도 사용자 승인으로 병합한다. 이번 변경에는 Worker 재배포가 필요하지 않다.
- 다음 자연 publisher가 새 main의 검사를 사용하는지 확인한다. 수동 dispatch, 직접 MASTER 쓰기로 대체하지 않는다.
- 다음 경기 시작 직후 미관측 상태에서도 검사가 통과하고, 남녀 실제 승수·종료세트가 약20분 간격으로 최소2회 연속 게시되는지 확인한다. MASTER readback, 실제 쓰기 여부, JSON, Pages, 실제 PC·모바일 화면을 각각 기록한다.
- 30분 지연 표시/알림, 실제1440/390/360, Worker 외부감시·Cloudflare 실패알림·메일/푸시 수신은 검증하지 못한 항목을 통과로 기록하지 않는다.
- 되돌림은 이 PR의 검사 변경을 revert한다. 경기 데이터나 MASTER를 되돌리지 않는다. revert 시 기존 waiting 오판이 재발할 수 있으므로 원인 증거를 함께 유지한다.
