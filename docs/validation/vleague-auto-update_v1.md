# V-리그 자동 업데이트 v1 검증

검증일: 2026-10-31. 기준 main: `757f0d2e668ed79a529e2f9554f5f02e9828253d`.

상태: **IMPLEMENTED / VERIFIED LOCALLY AND ON GITHUB / READY FOR REVIEW / NOT ACTIVE**.

## 실제 공식 자료 + 기존 MASTER의 읽기 전용 대조

KOVO 공개 API를 2026-10-31 08:55:11 UTC(17:55:11 KST)에 수집했다. 남녀 정규리그 각 126경기를 기존 일정과 연결했으며 누락·중복·팀 충돌은 없었다. 기존 MASTER 252행은 읽기만 했다. 아래 결과는 해당 관측 시각의 검증 증거이며 운영 배포 증거는 아니다.

| 부문 | 기존 경기 ID | 종료 결과 | 세트별 점수 | 공식 순위 합계 대조 |
|---|---|---|---|---|
| 남자 | `VL2627-M-001` | 대한항공 3–0 현대캐피탈 | 25–22, 25–23, 25–22 | PASS |
| 여자 | `VL2627-W-001` | GS칼텍스 3–0 한국도로공사 | 25–18, 25–21, 25–22 | PASS |

공식 전체 경기번호 1·2가 각각 남자부·여자부의 첫 KVL ID에 연결된다. 번호 suffix를 그대로 결합하지 않는다. 득실점 합계는 남자 75/67, 여자 75/61이며 공식 순위의 승점·승패·세트·득실점과 일치한다. 미경기 팀의 공식 순위는 추정하지 않는다.

초기 MASTER 계획은 **548셀**이다. SourceURL 252셀 + 검증 상태 252셀 + 경기장 표기 36셀 + 종료된 2경기의 상태·홈세트·원정세트·세트스코어 8셀이다. 날짜·시각·MatchID·팀·비고 변경은 없다. 경기장 차이는 `SOOP 스타디움(염주체육관)`→`숲 스타디움`, `평택 이충문화체육센터`→`평택이충문화체육관`의 공식 응답 표기다. 실제 쓰기는 수행하지 않았다.

후보 공개 파일은 남녀 `data.json` 2개와 ID 연결 `state_v1.json`이다. 첫 연결에서는 252경기에 공식 출처/식별 정보가 추가되며, 252경기의 점수가 변경된다는 의미가 아니다. 실제 종료 결과는 위 2경기다.

기존 Quality Audit의 후보 검사도 모두 통과했다.

| 검사 | 결과 | 검사 수 |
|---|---|---:|
| 남자 경기 | PASS | 126 |
| 남자 순위 | PASS | 21 |
| 여자 경기 | PASS | 126 |
| 여자 순위 | PASS | 21 |

## 자동 검사

```bash
python -B -m unittest discover -s tests -p 'test_kovo_vleague_*.py'
```

**138개 PASS**: 공식 응답 18, 순위 29, MASTER 29, 게시·배포·알림 32, 통합 업데이터 30. 최초 GitHub 실행의 136개에 공개 export 회귀 2개를 추가한 최종 로컬 결과다.

주요 회귀 범위는 전체 일정 검증, 합법적 세트 점수, 공식 순위 합계 및 팀명 일치, ID 연결 보존, 수동 잠금, 기존 종료 점수 보호, 정확한 셀 반영과 재조회, 반복 실행의 무변경, 읽기 전용 기본값, 허용 경로, main 동시 변경, MASTER 실패 시 사이트 쓰기 차단, 배포 실패 복구, 정제한 실패 알림의 중복 방지다. 네트워크/쓰기 단위 테스트는 가짜 transport를 사용한다. 최초 CI 후에는 기존 공개 export 검사를 세 후보 JSON의 실제 해시·공식 출처 영수증과 연결하고, 비공개 중첩 필드 차단 및 반복 실행 해시 일치를 추가 검증했다.

```bash
KVL_JSDOM_PATH=/path/to/jsdom \
KVL_VLEAGUE_CANDIDATE_ROOT=/tmp/vleague-preview/candidate \
node --test tests/vleague-rosters.test.cjs tests/vleague-match-summary.test.cjs \
  tests/vleague-postseason.test.cjs tests/vleague-auto-update-ui.test.cjs
```

4개 테스트 파일 모두 PASS. 기존 로스터 17개, 경기 요약 9개, 포스트시즌 6개, 실제 후보 UI 6개 조건을 검사한다. 후보 UI는 남녀부 × 1180/390/360px 조건에서 최종 스코어·세트, 7개 순위 행, 최근/다음 경기, 14팀 명단과 프로필 경로를 대조한다. 기존 로스터·요약 테스트도 후보 JSON을 읽도록 임시 로더를 연결해 추가 확인했다. 운영 파일을 후보로 교체하지 않았다.

이 검증은 jsdom의 DOM·데이터·화면 폭 조건 검사다. 실제 Chromium 실행 파일이 없어 브라우저 픽셀 배치·가로 넘침·브라우저 콘솔·스크린샷 검증은 수행하지 못했다. 제품 JS/CSS는 변경하지 않았다.

## 변경 범위

새 Python 모듈 5개, 해당 테스트와 공개 응답 발췌 fixture, workflow, 후보 UI 테스트, 개막 전 상태를 가정하던 기존 테스트 2개, 운영/검수 문서와 결정 기록을 추가·수정한다. 운영 JSON, Google MASTER, 선수·명단, 공통 UI, 기존 공시/감사 workflow는 변경하지 않았다. 비공개 MASTER 스냅샷과 인증값은 커밋 대상이 아니다.

## GitHub 확인 및 남은 운영 전환

초안 [PR #213](https://github.com/kvolleylab/kvolleylab/pull/213)을 생성했다. 코드 커밋 `61b75724aa24dd9c739896b63b703bb6fcd262f0`의 [최초 V-리그 Actions 실행](https://github.com/kvolleylab/kvolleylab/actions/runs/41213045896)은 **SUCCESS**다.

- Python 136개, 기존 화면 검사, 실제 공식 수집, 후보 UI 검사 모두 성공했다.
- 2026-10-31 15:04:36 UTC에 GitHub runner가 공식 전체 252경기와 남녀 종료 각 1경기를 재확인했다. 후보 Quality Audit 4개 모두 PASS다.
- Pages 읽기 전용 확인 결과는 `PAGES_CONFIG_VERIFIED`: `legacy`, `main`, `/`, `https://kvolleylab.com`이다. 기존 배포 설정을 변경하지 않았다.
- Google 인증을 제공하지 않은 PR 실행은 `MASTER_NOT_CHECKED`로 정확히 표시했으며, 게시·실패 Issue job은 실행하지 않았다. 로컬의 실제 MASTER 대조와 GitHub 실행 권한 검증을 혼동하지 않는다.
- 별도 기존 KOVO Cup/국내 템플릿 회귀 실행과 reviewed batches 실행도 성공했다. 기존 선수 등록 workflow의 별도 실패 원인은 아래에 구분해 기록한다.
- [기존 Quality Audit 실행](https://github.com/kvolleylab/kvolleylab/actions/runs/41213045794)도 SUCCESS다. 공개 변경 gate와 P0/P1 gate를 통과했다. 전체 감사 요약은 PASS 116 / FAIL 3 / NOT VERIFIED 7 / NOT RUN 3이므로 모든 기존 데이터 문제가 해결됐다는 의미는 아니다.

### 기존 PR 검사 3개 실패: 이번 변경과 분리

PR의 모든 검사가 성공한 것은 아니다. 다음 legacy workflow는 경로 필터 없는 `pull_request` 이벤트 때문에 함께 실행됐다.

| 기존 workflow | 실패 원인 | 실행 |
|---|---|---|
| Kyungil 등록 | 기존 MASTER가 78명이라고 가정하는 assertion; 실제 main은 이미 127명 | [41213045854](https://github.com/kvolleylab/kvolleylab/actions/runs/41213045854) |
| SKKU 등록 | 기존 MASTER 16명을 기대하지만 실제 127명 | [41213045744](https://github.com/kvolleylab/kvolleylab/actions/runs/41213045744) |
| University batch 생성 | 이미 존재하는 seed 파일을 Contents API로 갱신하며 현재 `sha`를 보내지 않아 HTTP 422 | [41213045727](https://github.com/kvolleylab/kvolleylab/actions/runs/41213045727) |

세 workflow, 관련 등록/생성 스크립트, Player MASTER 및 seed 파일은 base·PR head·당시 최신 main에서 Git blob SHA가 모두 동일했다. base의 Player MASTER도 127행이고 seed 파일도 이미 존재한다. 두 등록 workflow는 commit 단계에 도달하지 않았고 batch 쓰기는 API에서 거부됐다. 이번 PR에서는 이 파일이나 기존 workflow를 수정하지 않는다.

Google Cloud 서비스 계정/WIF, 해당 MASTER 편집 권한, GitHub 실행 변수, 실제 MASTER 쓰기와 Pages 배포는 아직 연결·검증하지 않았다. `KVL_VLEAGUE_UPDATE_APPROVED`는 설정하지 않았다. 실제 운영은 [운영 명세](../KVL_VLEAGUE_AUTO_UPDATE_v1.md)의 승인·연결·최초 반영 단계 후 별도로 확인해야 한다.

## 복구

운영 전에는 PR을 수정하거나 닫으면 된다. 운영 후 이상이 발견되면 활성화 변수를 false로 설정하고 현재 실행을 취소한 뒤, MASTER·커밋·공개 JSON을 대조한다. MASTER가 먼저 반영된 경우 올바른 확정 결과를 지우지 않고 재실행으로 사이트 반영을 마무리한다. 출처 정정·수동 잠금 충돌은 자동 해제하지 않는다.
