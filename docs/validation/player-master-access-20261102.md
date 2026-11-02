# 선수 MASTER 편집자 공유 및 읽기 전용 진단 — 2026-11-02

## 실제 확인

사용자가 기존 남자부 선수 MASTER에 자동화 계정을 편집자로 추가했다고 알렸다. 2026-11-02 20:30:50 KST 연결된 KVL 팀 계정으로 Drive 파일 권한을 재조회해 `kvl-v-league-updater@kvl-automation.iam.gserviceaccount.com`의 `writer` 권한을 확인했다. 대상은 기존 문서 `1WD2odv51xNDx9BqRfAjkkLVu0p_DX2EX_GEbqR-G4og` 한 개이며 새 공유 변경을 실행하지 않았다.

최신 metadata와 두 헤더 행을 읽었다. `현재등록_공시기반`(710020121)의 A3:M3 13열, `KVL_자동반영이력`(710020128)의 A1:V1 22열이 운영 설정과 정확히 일치한다. 선수값·헤더·기존 이력·권한 추가 변경은 0이다. 현재 공유 관측은 `data/player-updates/access_verification.json`이며 앞선 17시 관측 기록은 덮어쓰지 않는다.

## 남은 확인과 진단 범위

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
