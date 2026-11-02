# 선수 MASTER 편집자 공유 및 읽기 전용 진단 — 2026-11-02

## 실제 확인

사용자가 기존 남자부 선수 MASTER에 자동화 계정을 편집자로 추가했다고 알렸다. 2026-11-02 20:30:50 KST 연결된 KVL 팀 계정으로 Drive 파일 권한을 재조회해 `kvl-v-league-updater@kvl-automation.iam.gserviceaccount.com`의 `writer` 권한을 확인했다. 대상은 기존 문서 `1WD2odv51xNDx9BqRfAjkkLVu0p_DX2EX_GEbqR-G4og` 한 개이며 새 공유 변경을 실행하지 않았다.

최신 metadata와 두 헤더 행을 읽었다. `현재등록_공시기반`(710020121)의 A3:M3 13열, `KVL_자동반영이력`(710020128)의 A1:V1 22열이 운영 설정과 정확히 일치한다. 선수값·헤더·기존 이력·권한 추가 변경은 0이다. 현재 공유 관측은 `data/player-updates/access_verification.json`이며 앞선 17시 관측 기록은 덮어쓰지 않는다.

## 진단 도입 시점의 확인 범위

기존 비활성 pilot은 Google 인증 전에 중단되므로 native 공유 확인만으로 GitHub 서비스 계정의 실제 읽기를 성공 처리할 수 없다. 기존 신뢰 workflow `vleague-auto-update-v1.yml`에 명시적 수동 접근 진단을 추가한다. 정확한 저장소/main/수동 실행 문맥과 기존 계정, 고정된 문서·탭·헤더를 확인한다. 인증 범위는 `spreadsheets.readonly`, 외부 요청은 metadata 및 두 헤더 행의 GET뿐이다. 문서 ID 입력, 임의 URL, 선수 행 읽기, 쓰기, 승인 사건 생성, Git 커밋·push, Pages 게시 기능은 없다.

진단 입력이 true이면 기존 lifecycle/check/publish/player_master_pilot/notify_failure를 모두 제외한다. 진단과 publish를 함께 선택해도 다른 작업이 실행되지 않는다. 진단은 새 WIF 신뢰·키·IAM 역할을 만들지 않으며 기존 승인된 실행계정을 사용한다. OAuth scope는 기존 Sheets 쓰기보다 좁다.

`pilot.enabled=false`, `event_scope=null`, 공식 효력일 미확정은 유지한다. 공유 권한 확인, 실제 서비스계정 읽기, 실제 쓰기, 공개 게시를 서로 다른 상태로 기록한다. 이 PR에서 runtime 읽기 성공을 미리 기록하지 않는다.

## 수동 실행

1. GitHub Actions에서 `V-League Auto Update v1`을 연다.
2. `Run workflow`를 누르고 branch `main`을 선택한다.
3. `Publish approved match data...`는 선택 해제하고 `선수 MASTER 접근만 확인 (수정·게시 없음)`만 선택한다.
4. 실행 후 `player_master_access_check` job, Google 인증 단계, 실제 GET 단계, 정제된 `report.json`을 확인한다.
5. 실제 실행 URL·SHA·조회 결과를 release PR에 기록한다. 읽기 성공은 자동 쓰기 활성화를 뜻하지 않는다.

현재 연결된 GitHub 도구에는 새 workflow dispatch 기능이 없고, 접근한 브라우저의 GitHub 화면도 로그인되어 있지 않았다. 이 제한을 우회하기 위해 토큰을 추출하거나 새 자격증명을 만들지 않는다. 사용자에게 기존 로그인 상태에서 위의 읽기 전용 실행을 요청할 수 있다.

## 검증과 복구

기준 main은 `0f02f6b35d939c7a7e63d8ea375031a11baf091a`이며 PR236의 HERO 경로·모바일 달력 변경을 보존한다. 기존 다섯 job은 진단 제외 조건 외에 동일함을 YAML 구조로 비교했다. 실제 표준 상태에서 비활성 pilot은 그대로 인증 전 중단된다. 최종 회귀·PR·배포·runtime 실행 근거는 release PR에 기록한다.

복구는 새 수동 진단 입력을 사용하지 않는 것으로 즉시 가능하다. 코드 복원 시에도 기존 자동화·선수값·ID·과거 대회 명단은 유지된다. 선수 실제 반영은 별도 사건 검토와 승인 후 진행한다.

## 실제 GitHub 실행 확인 — 2026-11-02 21:26 KST

사용자가 수동 진단을 실행한 뒤 [V-League Auto Update v1 #26](https://github.com/kvolleylab/kvolleylab/actions/runs/41444659754)의 job 로그와 다운로드한 정제 `report.json`을 직접 확인했다. 이 관측은 위 도입 시점의 runtime 미확인 상태만 대체한다.

| 증거 | 확인값 |
|---|---|
| 실행 | `41444659754`, attempt `1`, `workflow_dispatch`, `main` |
| 실행 코드 SHA | `e97256be78f77de3e3e60e671d3caaa601825ea2` |
| 진단 job | `player_master_access_check`, ID `125274678025`, `success` |
| 보고서 checked_at | `2026-11-02T12:26:13.862776+00:00` = 21:26:13.862776 KST |
| 실제 GET 완료 로그 | 21:26:14.3339372 KST, `READ_ACCESS_VERIFIED` |
| 전체 실행 완료 | 21:26:17 KST, `success` |
| 읽기 검증 | `read_access_verified=true`, `metadata_valid=true`, `headers_valid=true` |
| 쓰기 구분 | `no_data_written=true`, `write_access_tested=false` |
| 나머지 작업 | lifecycle / check / publish / notify_failure / player_master_pilot 모두 `skipped` |
| 보고서 artifact | `player-master-access-41444659754`, ID `13142175720` |
| artifact ZIP SHA-256 | `34c6b464f8dbaea44088d6255adc49d42354af142f246aa76184585fff9a3c0e` |
| 원본 report.json SHA-256 | `ec9364812157cbe7430fdc90976fcb8b9fa13b28671f61573fe8e3de847ebe18` |

Artifact ZIP은 API metadata의 digest와 실제 다운로드 바이트가 일치했고, 내부 파일은 `report.json` 한 개다. 보고서 내용은 `access_verification.json`에 보존한다. artifact 자체의 보관 종료는 2026-11-09 21:26:14 KST다. 만료되는 다운로드 URL·토큰·원격 선수 행·비공개 메모는 저장하지 않는다.

실제 Google 요청은 고정된 남자 MASTER의 metadata GET과 `현재등록_공시기반!A3:M3`·`KVL_자동반영이력!A1:V1`의 batchGet이다. `spreadsheets.readonly` 범위이며 선수 행, 여자 MASTER, 쓰기·쓰기 후 재조회 또는 자동 게시를 검사한 것으로 확대하지 않는다. native 공유 권한을 재조회한 시각은 기존 20:30:50 KST로 별도 보존한다.

운영 기록은 `EDITOR_SHARING_AND_RUNTIME_READ_VERIFIED`로 갱신하고 pilot의 해결된 접근 차단 사유만 제거한다. `enabled=false`, `event_scope=null`, `BLOCKED_EFFECTIVE_DATE`와 공식 효력일 미확정은 유지한다. 실제 선수값 변경·승인 사건 추가는 0이다. 일반 반영 경로의 connector/writeback/readback 상태는 활성화하지 않는다.

이번 후속 기록의 기준 main은 실행 코드와 같은 `e97256be78f77de3e3e60e671d3caaa601825ea2`다. PR #238의 순위 요약 카드와 PR #239의 홈 남녀 경기 표시를 보존하며 코드·workflow·페이지·경기/선수 원본은 변경하지 않는다. 기록 갱신의 병합·Pages·공개 파일 대조는 후속 PR에 별도 남긴다. 롤백하더라도 이미 관측한 진단 성공을 선수 쓰기 실패나 미실행으로 재해석하지 않는다.
