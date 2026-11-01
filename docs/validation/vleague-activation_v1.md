# V-리그 자동 업데이트 운영 전환 v1

기록일: 2026-11-01 KST.

현재 상태: **USER APPROVED / RUNTIME AUTH VERIFIED / FIRST MANUAL MASTER WRITE VERIFIED / DEPLOYED VERIFIED**.

## 최초 실제 반영·게시 성공

2026-11-01 KST 21:19:58~21:22:02의 수동 실행
[Actions 41305975071](https://github.com/kvolleylab/kvolleylab/actions/runs/41305975071)이 성공했다.
workflow는 `V-League Auto Update v1`, 실행 #7, 시작 main은
`ff9cd11e4dfe22f9b51a36a1ac1190f5ad4e9a52`였다.

- `check`, `publish` 성공; `notify_failure`는 정상 생략.
- Python 139개, UI 32개, 실제 후보 UI 6개 검사 통과.
- 남녀 각126경기, 당시 종료 각2경기; MASTER 556셀 반영 후 재조회 일치.
- `master_readback_verified=true`이며 bot 공개 데이터 커밋은 `e9fa468eee6b327373ba4da68d802a6dad1f390b`.
- 공개 허용 파일3개만 변경했다. 예상 Pages SHA와 실제 빌드 SHA가 해당 커밋으로 일치했다.
- 남녀 실제 공개 JSON의 의미 비교까지 일치하여 `DEPLOYED_VERIFIED`로 확인했다.

Google 서비스 계정·WIF·기존 MASTER 공유 연결과 최초 반영은 이 실행에서 검증되었다.
증거는 [PR #215의 최초 실제 갱신·게시 성공 기록](https://github.com/kvolleylab/kvolleylab/pull/215)에 남아 있다.
수동 실행 성공은 아직 관측하지 않은 후속 예약 실행 성공을 대신하지 않는다.

아래는 **이 성공 이전의 초기 점검 이력**이다. 당시 미확인·중단 상태를 현재 상태로 해석하거나
이미 완료된 계정 설정을 반복하지 않는다. 추가 종료일/선수/기사 기능은
[별도 확장 검증 기록](competition-automation-extension-20261101.md)을 따른다.

## 초기 단계에서 완료한 작업

- 사용자가 PR #213 운영 반영과 Google MASTER 실행 권한 연결에 명시적으로 승인했다.
- [PR #213](https://github.com/kvolleylab/kvolleylab/pull/213)을 `444eff62474089029c6b5aacfae191d321585364`로 병합했다.
- 승인된 코드의 V-리그 Actions `41213686346`과 Quality Audit `41213686347`은 성공했다. 코드 변경이 없는 승인 기록 커밋을 추가한 뒤 병합했다.
- 후속 main의 `0f5dc8d06b3e8139e7809f31eba97e34e36314b0`(파비콘 PR #214)와 [Pages 실행](https://github.com/kvolleylab/kvolleylab/actions/runs/41216436496)의 성공을 확인했다. 이 확인은 코드 설치 증거이며 경기 결과 갱신 성공을 뜻하지 않는다.
- 11월 1일 01:55:02 KST에 공식 자료를 다시 수집했다. 252경기, 남녀 종료 각 1경기, 공식 순위 합계가 다시 일치했다.

## 실제 MASTER 입력 규칙 수정

쓰기 전 native CellData에서 확인한 strict dropdown 값:

| 열 | 허용 값 |
|---|---|
| M 상태 | 예정 / 진행중 / 종료 / 연기 / 취소 |
| R 검증상태 | 미검증 / 1차확인 / 교차검증 / 공식확정 |

기존 작성기의 R 값 `공식검증`은 허용 목록에 없었다. 이를 **`공식확정`**으로 수정했다. 시트의 유효성 검사 자체는 변경하지 않는다. M/R의 실제 허용 목록으로 5개 경기 상태 × 4개 기존 검증 상태, 20개 조합을 검사하는 회귀 테스트를 추가했다.

기존 대상 영역에 수식·smart chip은 없었다. 쓰기 계획은 기존과 동일한 548셀이다. 값만 변경하는 정밀 요청으로 준비했으며 서식·비고·경기 ID·도시·팀·행 구조는 대상이 아니다.

## 초기 단계의 미완료 사항 — 위 최초 성공 기록으로 해소

GitHub 코드 연결은 정상적으로 작동한다. 그러나 관리 설정을 위한 Cloud Browser 인증 과정에서 로그인 응답 및 새 페이지 확인이 시간 초과됐다. 로그인 성공/실패를 확정하지 않고 **미확인**으로 남긴다. 인증값은 코드·문서·artifact에 기록하지 않는다.

Google Cloud 프로젝트, 서비스 계정, WIF Provider 및 MASTER 공유 권한을 생성하거나 변경하지 않았다. GitHub의 Google 연결 변수와 활성화 변수도 이번 작업에서 설정하지 않았다. 예약 실행의 실제 MASTER 접근·쓰기·Pages 결과 갱신은 아직 검증하지 못했다.

기존 연결을 사용한 최초 MASTER 반영 요청도 중단됐다. 중단 후 `경기일정_MASTER!M2:R3`을 다시 읽었고 두 개막전은 여전히 `예정`, 점수 공란, 기존 출처와 `교차검증` 상태였다. **최초 경기 결과 쓰기는 적용되지 않았다.** 중단된 요청을 반복 제출하지 않았다. 운영 남녀 JSON이나 상태 파일도 변경하지 않았다.

## 당시 운영 전환 절차 — 최초 수동 실행까지 완료

1. 현재 main과 이 수정의 병합 결과를 확인한다. 새 작업이나 동시 변경을 보존한다.
2. GitHub 관리자 설정과 운영자가 선택한 Google Cloud 프로젝트의 로그인/권한 연결을 완료한다.
3. 전용 서비스 계정, 이 저장소·main·해당 workflow만 신뢰하는 WIF, 기존 MASTER 한 문서의 편집 권한을 연결한다. 상세 설정은 [운영 명세](../KVL_VLEAGUE_AUTO_UPDATE_v1.md)를 따른다.
4. 최신 공식 자료와 MASTER를 다시 읽는다. 이전 읽기 전용 스냅샷을 운영 게시에 재사용하지 않는다.
5. 실제 인증 상태로 MASTER 변경 계획을 검증한 뒤 승인된 최초 반영을 실행한다.
6. MASTER 재조회, 공개 JSON 커밋, Pages 배포 SHA와 실제 남녀 JSON까지 확인한 뒤 `ACTIVE`로 기록한다.

사용자의 운영 승인은 유효하다. 다시 포괄적인 운영 승인을 요청하지 않는다. 실제 계정 선택·로그인·서비스가 요구하는 권한 확인 등 사용자의 직접 조작이 필요한 지점만 구분해 안내한다.
