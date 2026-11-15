# KVL V-리그 2026-27 신인 등록 연동 자동화 검증 및 운영 인수인계

작성: 2026-11-14 KST. 상태: **별도 브랜치 구현·출처기반 CI PASS / 운영 main 미반영 / Pages 배포 미검증 / Drive MASTER 자동쓰기 미연결**.

- 기준 main: `6d3ba0ddc7334c54095e779955c6e76c2b62a6f3`.
- 개발 브랜치: `feature/draft-profile-affiliation-20261114`.
- PR #332: https://github.com/kvolleylab/kvolleylab/pull/332
- 종합 요구/후속 비신인 이적·해지·복귀: Issue #331 https://github.com/kvolleylab/kvolleylab/issues/331

## 사용자 요청과 운영 구조

신인 드래프트에서 지명된 선수에게 지명 구단을 표시하고, KOVO가 별도 등록 공시를 올렸을 때 팀별 선수명단과 기존 선수 프로필의 현재 프로 소속을 일관되게 갱신한다. GPT 예약 작업을 실행 엔진으로 사용하지 않고 **GitHub Actions Python 수집·정규화 + 소스 검증 + 정적 JSON + KVL 브라우저 렌더러**를 사용한다. 정상 작동에 ChatGPT 접속이나 특정 GPT 요금제가 필요하지 않다. GitHub Actions·Pages 서비스와 공개 KOVO API 접근은 별개의 실행조건이다.

## 현행 확정 자료 및 분리 원칙

- 드래프트: `data/draft-applicants/2026-27/results.json`에 남18/여16=34명 VERIFIED/PUBLIC 지명 결과. 기존 `player-links.json`은 30명에 Player_ID를 매핑하고 4명(이율리, 김아중, Audrey Pak, 오해솔)은 미연결.
- KOVO: `scripts/kovo_official_notices.py` 수집, `scripts/kovo_verify_roster_contracts.py` 보조 현재등록 projection. 날짜·등록명·현역 상태는 2026-27 공시 범위로만 해석한다.
- 현 홈페이지: `data/competitions/v-league-{men,women}-2026-27/rosters.json`의 2026-10-27 검수 스냅샷 252명. 특정 대회 당시 명단은 변경하지 않는다.
- Python `scripts/kvl_vleague_draft_sync.py`는 공식 지명 34명과 KOVO 등록 공시를 대조한다. 원문 SHA, 선수·성별·팀·등번호·등록 유형 및 등록 이벤트 중복 여부를 검사하고 등록명 약칭·동명이인·기존 KVL ID 충돌은 보류한다.
- 검증된 경우에만 `draft_registration_bridge.json`의 등록 항목으로 만든다. 이 원장은 별도 검증된 **공개 표시용 파생 데이터**로, Google Drive MASTER를 덮어쓰지 않는다. 공시 게시일은 확정 선수등록 효력일이 아니다.
- 학교 출신 이력은 `previous_school`에 남기고, 기존 Player_ID는 절대 신규 발급·재할당하지 않는다. 기존 Google Drive MASTER의 선수 ID·수식·메모·접근권한은 변경하지 않는다.
- `assets/js/kvl-vleague-draft-bridge-v1.js`는 V-리그 참가팀의 7개 구단씩 팀별 명단만 별도 오버레이한다. 대학·국제·KOVO컵 명단은 건드리지 않는다. 프로필은 등록 + 검증 KVL ID 일치한 경우에만 프로 소속으로 렌더링한다. 원본 저장파일은 불변이다.

## 실제 2026-11-14 CI 입력 결과

독립 CI: https://github.com/kvolleylab/kvolleylab/actions/runs/43608114078

| 집계 항목 | 검증 결과 |
|---|---:|
| 공식 지명 | 34 |
| 등록 공시의 성별·구단·이름·등번호·원문 이벤트 검증 완료 | 32 |
| 프로필 ID까지 안전하게 연결된 프로필 파생 레코드 | 28 |
| 드래프트 관련 보류 사유(일부는 등록 가능하나 ID 연결 보류) | 6 |
| 기타 현재등록 명단 변동·약칭 등 수동 검토 후보 | 27 |
| Python 소스 대조·충돌 테스트 | 8/8 통과 |
| Pages 배포 승인/실행 문맥 차단 테스트 | 3/3 통과 |
| JS 실제 시즌 데이터 연결·명단 보존·중복 방지 테스트 | 7/7 통과 |

**명확히 구분:** 32명은 전체 드래프트 34명 중 공시 등록 사실을 자동 대조한 수, 28명은 ID까지 검증해 프로필 연결을 허용하는 수다. 과거 2026-10-27 사이트 선수명단에는 이미 일부 선수와 외국인 약칭이 들어 있으므로 **이 수치를 사이트 신규 추가 인원으로 곧바로 해석하면 안 된다.** 그 외 27건을 자동 소속 변경·퇴단으로 판단하지 않는다.

대표 차단:
- `여광우`의 기존 학교 MASTER 표기가 `이관우`로 남아 ID 충돌 발생. 공식 등록 자체는 보존하고 잘못된 프로필 링크는 만들지 않는다.
- `Audrey Pak`은 기존 등록명과 영문 이름이 달라 같은 선수라고 자동 단정하지 않는다.
- `이율리`, `김아중`, `오해솔` 등 기존 ID가 없는 지명자는 프로필 ID를 추측하지 않는다.
- `백창진 (수런선수)`처럼 공시 명칭에 오타 또는 접미사 불일치가 있으면 사람이 원문 확인하기 전에는 자동 병합하지 않는다.

## 실행 파이프라인 및 활성화 조건

1. GitHub Actions `.github/workflows/kovo-official-notices-collector.yml`: 일 08:13 KST 기존 수집 및 후보 계산.
2. 같은 예약 실행에서 `python -B scripts/kvl_vleague_draft_sync.py --write`로 시즌별 새 공식 등록 여부를 대조.
3. 기존 공식 공시 인덱스·후보와 함께 `data/kovo/official-notices/2026-27/draft_registration_bridge.json`만 main에 커밋(브랜치 PR 병합 이후부터 작동). 컴파일 실패 시 기존 공식 공시 수집을 중단하지 않고 새 브리지 게시를 건너뛴다.
4. `vars.KVL_DRAFT_ROSTER_PUBLISH_APPROVED` 값이 `true`인 경우에만 새로운 브리지 커밋 또는 수동 publish 재실행에 대해 `scripts/kvl_vleague_draft_deploy.py`가 기존 main Pages 빌드를 요청하고 정확한 JSON 바이트와 SHA를 검증한다.
5. 기존 `competition-engine.html`, `players.html`, `player.html`은 하나의 공개 브리지를 읽는다. 오류 발생 시 기존 명단·프로필을 유지한다.
6. Google Drive MASTER 자동 쓰기는 **별도 작업**: 기존 `kvl_player_master_apply.py`의 실증 pilot은 등번호/포지션 한 건만 지원하며 신규 선수 등록/경력 전환을 지원하지 않는다. 시즌·구단 탭, Player_ID, 셀 메타데이터, 검수·권한·재조회, 적용 이력과 Sheets Writer가 추가 검증되기 전에는 기존 MASTER 쓰기를 켜면 안 된다.

**미완료:** PR 병합, 실제 예약 실행, 서비스 승인 변수 설정, 실제 Pages 빌드·PC/모바일 HTTP 화면 검증, Drive MASTER 양방향 동기화, 다른 비신인 등록/이적/해지/임대·군 복귀 전체 자동화.

기존 저장소의 별도 `Player and Draft Integration` 전체 회귀검사에는 1,842명 고정 건수, 기존 파일경로의 `?v=` 처리 오류 및 과거 해시 스냅샷 차이로 인한 실패 이력이 있다. **브리지 전용 성공을 전체 저장소 CI의 성공으로 주장하지 않는다.** 테스트 PASS가 곧 배포라는 주장은 하지 않는다.

## 실행·검증 명령

```bash
# 이미 저장된 공식 자료로만 새 대조 결과 확인(원본/MASTER 수정 없음)
python -B scripts/kvl_vleague_draft_sync.py

# 별도 브랜치/작업 공간에서 공개 브리지 검증 생성
python -B scripts/kvl_vleague_draft_sync.py --write
python -B scripts/kvl_vleague_draft_sync.py --check

# 독립 검증, 원본 선수 MASTER 불변
python -B -m unittest discover -s tests -p 'test_kvl_vleague_draft_sync.py' -v
python -B -m unittest discover -s tests -p 'test_kvl_vleague_draft_deploy.py' -v
node --test tests/vleague-draft-bridge-ui.test.cjs
```

## 복구와 장기 운영

- 문제가 생기면 `KVL_DRAFT_ROSTER_PUBLISH_APPROVED`를 비활성화하고 마지막 검증된 main의 파일을 유지한다.
- 기존 팀 스냅샷·과거 대회 명단·선수 ID나 Drive MASTER를 강제로 초기화하지 않는다. 잘못된 공시는 source revision, Player_ID와 화면 이전 값 대조 후 별도 정정으로 처리한다.
- 신규 시즌은 날짜·성별·구단 ID·공식 API 스키마·워크플로 실행 기간·원본 MASTER 연결을 검토한 뒤 별도의 브리지/구단 스냅샷을 생성한다. 2026-27 파일을 2027-28로 자동 덮어쓰지 않는다.
- 공시가 없는 실행은 별도 알림을 보내지 않는다. 장애·검수 대기만 관리자 검증 대상으로 남기며, 별도 GPT 공시 알림 자동화의 새 공시만 알림 원칙과 충돌시키지 않는다.
- 공식 자료의 사실·출처 링크만 게시하고 원문 PDF·사진을 대량 재배포하지 않는다. 상업적 이용 시 KOVO 원문 이용조건을 별도 확인한다.

## 재시도 결과 및 신규 P1 신원 보호 (2026-11-15 KST)

- [Player and Draft Integration 최신 유효 CI run 43611950516](https://github.com/kvolleylab/kvolleylab/actions/runs/43611950516): 과거 1,842명 하드코딩 테스트 대신 최신 전체 선수 검색 및 2026-27 프로 MASTER 영구 ID·프로필 경로를 검증하도록 정비한 뒤 두 잡 성공. 과거 2026-10-24 여섯 이름 정정 스냅샷은 변경 없이 보존하며 매 PR마다 재사용하지 않는다.
- [KVL Quality Audit run 43608431473](https://github.com/kvolleylab/kvolleylab/actions/runs/43608431473)의 실제 보고서 확인: READ_ONLY 검사 113 PASS/7 FAIL/8 NOT VERIFIED/3 NOT RUN. 특히 프로 로스터 대비 국가대표 링크의 `PLAYER_DOB_CONFLICT` P1 25건, 기존 workflow YAML 파싱 실패 2건, 기존 레거시 JSON parse 실패 1건 및 일부 구형 회귀검사가 포함된다. 전용 브리지 CI의 통과가 전체 품질감사 완료를 의미하지 않는다.
- 교차 원장 직접 대조: `data/national/player_id_links_v1.json`과 `data/master/player_master_pro_vleague_2026_27_v1.json` 사이에 **서로 다른 선수에게 동일 KVL-P 번호가 사용된 충돌 26건** 확인. Quality Audit와 건수 차이는 기준과 비교 대상 차이이며 해소 완료가 아니다. 추적: [Issue #334](https://github.com/kvolleylab/kvolleylab/issues/334).
- 구단/프로 선수의 검증된 공식 이름·DOB를 기존 대표팀 링크가 무조건 덮어쓰지 않도록 `player-search-v2.js`, `player-canonical-identity-v1.js`, `player-detail-v2.js`에 **표시단 보호** 적용. 기존 검증된 대학 선수 국가대표 이름 정정은 유지하고, 영구 ID 원장 수정·삭제·재발급은 하지 않는다.
- 추가 `tests/player-current-integrity.test.mjs`에 프로 MASTER 252명 이름/DOB 직접 비교, `tests/player-national-pro-identity-collision.test.mjs`에 프로 3명/대학 1명 상세 UI 보호 검사를 추가하여 CI에 연결.
- 신규 신원 보호 CI 최종 결과, 실제 PC·모바일 브라우저 화면, Pages build 및 Google Sheets MASTER writer 성공은 각 단계별로 별도 확인해야 한다. 현재 PR Draft/운영 미배포 유지.



## 2026-11-15 · 프로·대표팀 동일 Player_ID 26건의 안전한 조회 구분 및 예약 게시 권한 분리

**추가 구현 (PR #332 미병합):**

1. `assets/js/player-id-collision-quarantine-v1.js`: 기존 국대 링크/프로 MASTER의 이름 또는 생년월일이 다른 영구 ID 26건(`KVL-P-001620` ~ `KVL-P-001645`)을 검수 대상으로 격리. 소스 파일은 불변. `tests/player-id-collision-quarantine.test.mjs`가 정확한 실제 충돌 집합을 전수 비교한다. 이후 원본 추가 충돌·해소가 생기면 검사를 실패시켜 재검토한다.
2. `player.html?id=...`로 충돌 ID만 단독 열면 두 선수의 원본 실명과 조회 대상 선택 화면을 보여준다. 검증된 프로 구단·선수 검색 링크는 `&scope=pro`, 같은 ID의 기존 대표팀 조회는 `&scope=national`로 안전하게 분리한다. 기존 ID 자체는 삭제·재할당하지 않는다. 타 선수 이력, 국가대표 경기 목록, 공개 메모 또는 개인 메모를 섞지 않는다.
3. 기존 비교함/선수 비교/관리자 프로필 메모는 이 26개 번호가 정식 분리될 때까지 신규 표시·연결을 중지한다. 노트 원본/DB에 쓰거나 기존 내용을 지우지 않는다. 비충돌 선수 검색·비교·드래프트 기존 경로는 유지한다. 임시 경로 분리는 **영구 Player_ID registry 정합성 해결이나 Supabase 서버 메모 키 마이그레이션이 아님**.
4. 기존 `.github/workflows/kovo-official-notices-collector.yml`에서 전체 작업에 `pages:write`를 주던 방식을 제거. `collect` job은 `contents:write`로 공식 공시·검증 브리지 JSON만 커밋, 별도 `publish_bridge` job만 `contents:read,pages:write` 사용. `KVL_DRAFT_ROSTER_PUBLISH_APPROVED=true`(별도 운영 승인 변수), 정상 수집, main 한정, 변경이 실제 확인된 경우 또는 명시적 수동 재검증 요청일 때만 Pages 빌드 호출한다. 저장할 자료가 없거나 승인 없이 예약 게시하지 않는다.
5. 정기 수집기 자체에서 Python 원본 대조 8개 검사와 `--write`/ `--check` 재생성 검증을 수행한다. 공시 후보 수집과 홈페이지 게시를 분리하고, 검증 오류 시 기존 사이트 파일을 유지하며 Actions 경고에 남긴다.
6. Sheets read-only 현황: 남자 `현재등록_공시기반` 2026-10-16, 여자 2026-10-15 표기가 유지된다. 각 구단 시트와 `선수ID_신원검수`, `KVL_자동반영이력`의 schema 존재를 직접 확인했다. 최신 draft 변경이 Google Sheets MASTER에 자동 적용된 상태라고 주장하지 않는다. 새로운 등록 writer는 공식효력일/원본 ID/실행계정 공유 권한·보호 셀/저널/재조회 검증이 필요하다.

**잔여 운영 경계:**

- 실제 예약 실행·신규 공시 발생 후 자동 GitHub commit / GitHub Pages HTTPS 실증은 **아직 수행·검증하지 않음**. PR의 CI 성공은 운영 완료와 다르다.
- `main` 병합·사이트 활성화는 PR 검사·사용자 운영 승인·게시 변수 설정 후 별도 검증.
- 글로벌 Quality Audit은 확인 시점 115 PASS/5 FAIL/8 NOT VERIFIED/3 NOT RUN. 운영 원장 ID 충돌, 다른 레거시 테스트·보안 검수 이슈는 [Issue #334](https://github.com/kvolleylab/kvolleylab/issues/334) 및 독립 Quality Audit 과제로 남긴다. `Quality Audit` workflow 결과가 success여도 보고서 안의 FAIL이 0임을 뜻하지 않는다.


## 검수 브랜치 초기 데이터 생성 완료 (2026-11-15)

`feature/draft-profile-affiliation-20261114`에서 소스 검증 CI 성공 후 **격리된 push job**으로 `data/kovo/official-notices/2026-27/draft_registration_bridge.json`과 공개 출처 검수 원장 `scripts/quality_audit/public-review-manifest.json`을 생성했다.

- GitHub commit: `8ab55fe100319fee9290dcfc56a3bc7ddc4a6487`. (운영 `main` 아님.)
- 공개 JSON SHA-256: `00174e9b007701e6aed2a09ec9ba2e63a9b6584551c5911d610a12513a78e84b`; 검수 원장의 `sha256`과 일치.
- 공식 신인 지명 34명, KOVO 등록 공시 확인 32명, 정확 ID 연결 프로필 28명, 드래프트 신원 보류 6건, 기타 후보27건. 실제 신규 등록 인원과 기존 공시명단 전체를 혼동하지 않는다.
- 이 파일은 코드가 운영에 반영될 경우 최초 예약 수집 전에도 안전한 등록 정보를 표시하기 위한 **시드**이며, 미확인 등록·이적을 공개 MASTER 값으로 승격시키거나 실제 Google Sheets에 기록하지 않는다.
- 자동 시드 job은 PR 전용 브랜치에서만 `contents:write`를 사용하고, 원본이 바뀌면 `SOURCE_CHANGED_REVIEW_REQUIRED`로 새 검수를 요구한다. 무인으로 추가 ID를 발급하지 않는다.
- 메인에 반영된 운영 설정/Pages 배포/모바일 브라우저 검수는 별도 사실이며, 이 commit의 성공만으로 `DEPLOYED`라 하지 않는다.

