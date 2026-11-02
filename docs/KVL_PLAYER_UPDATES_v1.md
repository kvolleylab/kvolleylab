# KVL 선수 공시·기사 업데이트 운영 기준 v1

적용 기준: `KVL_운영원칙_MASTER_v17`의 **원문 → 검토 → MASTER → 홈페이지** 순서와 기존 Player_ID 유지 원칙. 이 문서는 선수 등록·이적 관련 수집·검토 흐름의 구현 범위를 정의한다. 대회 일정의 종료일과 기록 보관은 대회 생애주기 운영 기준에서 관리한다.

## 1. 이번 구현의 실제 범위

| 단계 | 동작 | 자동 반영 범위 |
|---|---|---|
| KOVO 공식 공시 | 기존 공개 공시 수집기를 재사용해 등록·해지·이적·임대·번호·포지션 변경 후보 추출 | 공시 후보와 원문 버전 기록 |
| 선수 식별 | 기존 `KVL-P-...` ID를 검토자가 명시 | 이름만으로 병합하거나 새 ID를 생성하지 않음 |
| 효력일 확인 | 원문의 적용일·등록일·임대 시작일과 게시일을 구분 | 게시일만 있으면 적용일은 미확정 |
| 검토 기록 | 정확한 후보 ID·원문 버전·추출 버전에 승인 연결 | 수정 원문이 나오면 기존 승인 재사용 불가 |
| 검토 완료 내보내기 | `reviewed_events.json` 생성 | MASTER에 적용할 수 있는 검토 완료 이벤트 목록 |
| 기사 발견 | 매일경제·뉴시스 공식 스포츠 RSS에서 배구 관련 제목 검색 | 제목·원문 링크·매체·피드 제공 시각만 수집 |
| 선수 MASTER 연결 1차 | 기존 남녀 MASTER 재조회, 남자부 전용 적용 이력 탭, 1건 한정 writer·재조회·현재 시즌 export 구현 | **IMPLEMENTED_NOT_ACTIVATED** — 효력일과 실행계정 접근권한 미확인으로 실제 선수값 쓰기 차단 |
| Google MASTER / 홈페이지 | 연결된 Drive에서 현재값 대조 완료, GitHub 자동 쓰기는 **NOT_CONNECTED** | 오재성의 기존 ID·등번호 5·원문 연결 일치. 번호를 다시 바꾸거나 적용 사건을 생성하지 않음 |

실제 MASTER의 대상 표와 헤더는 확인했다. 기존 선수 ID·현재 등록 판단·변동 이력의 원문 revision·실행 시점 읽기 검증 연결이 완료되기 전에는 `reviewed_events.json`을 “반영 완료”로 표시하지 않는다. 기존 경기 일정/결과 자동 업데이트와 선수 명단 반영은 서로 다른 권한·검토 단계다.

## 2. 자동 실행

기존 `.github/workflows/kovo-official-notices-collector.yml`에 통합했다. 실행 순서는 공식 공시 수집 → 기존 후보 명단 계산 → 버전별 선수 후보·검토 내보내기 → 별도 기사 후보 수집이다. 매일 한국시간 08:13에 실행하도록 정의되어 있으며, GitHub Actions의 예약 실행은 지연될 수 있다. `workflow_dispatch` 수동 실행도 가능하다.

선수의 이적·자유신분·재등록은 비시즌에도 발생할 수 있으므로 **운영기간 내에서는 비시즌에도 감시**한다. 한 대회의 경기 결과 수집 종료일 때문에 전체 선수 공시 감시를 끄지 않는다. 현재 KOVO 입력 인덱스 경로는 `2026-27`이며 다음 시즌으로 자동 전환하지 않는다.

| 설정 | 현재 값 | 의미 |
|---|---|---|
| 운영기간 | 2026-11-01~2027-10-31, 한국시간 | KVL 내부 운영기간이며 공식 대회 종료일이 아님 |
| 다음 검토일 | 2027-06-01 | 다음 시즌 공시 인덱스·선수 MASTER·소스 조건을 검토하는 **내부 운영상 기한** |
| 검토기한 도달 | 자동 일시정지 | 검토를 마치고 설정을 갱신하기 전까지 수집·공개 commit 중단 |
| 운영 종료일 경과 | 자동 중단 | 예약 워크플로 자체는 기동할 수 있으나 네트워크 수집과 공개 commit은 건너뜀 |
| 새 시즌 | 명시적 검토 후 설정 | 대회/선수 스냅샷과 입력·MASTER 연결을 함께 확인 |

기간 guard는 기존 공시 API 다운로드보다 먼저 실행된다. 작업은 신뢰 저장소 `kvolleylab/kvolleylab`의 `main`에서만 실행한다. 유효한 시작일·종료일·검토일이 없으면 진행하지 않으며 운영기간은 한 번의 설정으로 366일을 초과할 수 없다.

이 수집기는 Python 표준 라이브러리와 GitHub Actions로 실행된다. 실행 시 ChatGPT·LLM·OpenAI API를 호출하지 않는다. RSS 연결에는 API 키가 필요 없다. GitHub 계정·저장소의 Actions 사용량 정책은 별도로 적용된다.

```bash
# 네트워크 없이 현재 저장된 공시로 후보/검토 완료 이벤트 생성
python scripts/kvl_player_updates.py

# 공식 언론사 RSS 메타데이터 발견 포함
python scripts/kvl_player_updates.py --collect-news
```

기사 피드 한 곳의 장애가 공식 공시 작업을 중단하지 않도록 했다. 이전 기사 후보를 유지하고 실행 보고서·Actions 경고에 실패한 소스를 남긴다. 제목 검색에서 결과가 0건이어도 “오늘 관련 기사가 없다”는 뜻은 아니다. RSS는 최근 일부 기사만 제공하며 제목에 검색어가 없는 기사는 빠진다.

## 3. 원문·정정·선수 ID 규칙

- 공시 ID를 영구 `source_id`로 사용하고 본문 해시·제목·게시 시각을 묶어 `source_version`을 만든다. 추출된 이벤트 내용은 별도 `revision_id`로 식별한다.
- 순서가 바뀌어도 같은 선수 후보의 식별자는 유지한다. 동일 공시에서 같은 식별 정보가 중복되면 승인 대상에서 차단한다.
- 원문이 정정되거나 파서가 내용 해석을 바꾸면 이전 후보를 `superseded_requires_new_review`로 보관하고 재검토한다.
- `event_id`는 기존 Player_ID·공시 source_id·명단/변동 구분으로 고정하고 `revision_id`는 별도로 관리한다. 같은 사건의 원문 정정으로 새 사건 ID를 만들지 않는다. 이미 적용한 원문 revision이 바뀌면 로컬 MASTER 계획도 자동 재적용을 차단한다.
- 최근 페이지 조회에서 공시가 보이지 않는 것, 새 명단에서 선수가 빠진 것만으로 이적·방출·은퇴 이벤트를 만들지 않는다.
- 선수명·팀명·번호는 식별의 참고 정보다. 기존 Player_ID와 생년월일 또는 공식 등록 식별 정보를 확인한 검토 기록이 있어야 한다. 동명이인, 등록명, 수련선수 표기, 여러 선수가 한 줄에 있는 공시는 확인 없이 합치지 않는다.
- `roster_snapshot`은 특정 시점의 명단 관측이다. 최초 입단일이나 등록 시작일을 의미하지 않는다. 컵대회·대학대회·고교대회 당시 명단도 현재 소속 변경으로 덮어쓰지 않는다.
- 임대 종료일 도래는 복귀 공시가 아니다. 기존 후보 명단 계산에서도 종료일만으로 최초 등록 명단의 소속을 되살리던 동작을 수정했다. 별도의 재등록 근거가 있어야 다시 포함한다. `roster_projection.json`은 보조 계산 자료이며 최종 현역 등록부나 자동 MASTER 입력이 아니다.

기존 수집기에서 `아시아쿼터 선수 등록 해지`가 쿼터 선수 등록으로 분류되던 우선순위 오류를 수정했다. `registration_termination`을 비활성 사건으로 처리하며, 외국인/쿼터라는 단어보다 해지·번호·포지션 변경 유형을 먼저 판정한다. `신인선수 등록`도 공백과 무관하게 등록으로 분류한다. 이미 저장된 예전 파서 결과는 공시를 재수집해 갱신해야 한다. 새 검토기는 제목 분류와 저장 이벤트 유형이 다르면 승인을 차단한다.

## 4. 검토 완료 이벤트 만드는 절차

1. `data/player-updates/official_candidates.json`에서 `needs_review` 항목을 고른다.
2. 연결된 KOVO 원문과 기존 선수 MASTER를 확인한다. 선수 ID, 팀, 변경 유형, 적용일을 확인하고 원문의 수정 여부도 확인한다.
3. `data/player-updates/reviewed_mappings.json`의 `reviews`에 해당 후보와 정확히 일치하는 검토 기록을 추가한다. 아래는 구조 설명용이며 실제 승인 값이 아니다.
4. 스크립트를 다시 실행한다. 유효한 검토만 `reviewed_events.json`으로 나간다. 잘못된 ID, 과거 원문 버전, 불명확한 적용일은 `review_issues`에 남는다.
5. 연결된 MASTER 반영 단계에서 `event_id`로 중복을 방지하고, 해당 선수의 이력 행을 추가하거나 정정한다. 기존 대회 스냅샷은 유지한다. 이 5단계의 Google MASTER 쓰기 연결은 이번 스크립트에 포함되어 있지 않다.

```json
{
  "candidate_id": "official_candidates.json의 candidate_id",
  "revision_id": "official_candidates.json의 revision_id",
  "source_version": "official_candidates.json의 source_version",
  "source_url": "해당 KOVO 공식 공시의 정확한 URL",
  "decision": "approve",
  "player_id": "확인한 기존 KVL-P-번호",
  "identity_basis": "name_birth_date_review",
  "effective_date": "원문에서 확인한 YYYY-MM-DD",
  "effective_date_basis": "official_notice_text",
  "effective_date_evidence": {
    "source_url": "위와 동일한 KOVO 공시 URL",
    "locator": "paragraph:2",
    "asserted_date": "위와 동일한 YYYY-MM-DD"
  },
  "reviewer": "KVL-OP-EDITOR",
  "reviewed_at": "검토한 YYYY-MM-DD"
}
```

선수 식별 근거 값은 `canonical_id_review`, `name_birth_date_review`, `official_registration_id_review` 중 하나다. 적용일 근거는 `official_notice_text`이며 별도의 규정 해석이 필요한 경우는 승인 전에 해당 공식 근거를 추가로 정리한다. `reviewer`는 `KVL-OP-...` 형식의 공개 담당 역할 ID만 사용하고 이메일·실명 메모를 넣지 않는다. 적용일 증거에는 자유 서술 대신 공식 URL·원문 위치·확인한 날짜를 기록한다. 위치는 `paragraph:2`, `table:1`, `page:3`, `field:registered_on`처럼 제한된 형식이다. 반려는 `decision: reject`로 기록하며 후보·원문 버전·검토자·검토일이 필요하다. 승인 사실 자체는 원문 정확성의 자동 검증이 아니므로 검토자가 원문을 직접 확인해야 한다.

공개 후보·기사·검토 export는 과거 기록에도 엄격한 허용 필드 검증을 적용한다. 비공개 필드·개인 연락처·인증 파라미터가 발견되면 원본 입력을 덮어쓰지 않고 공개를 오류로 중단한다. 기사 URL의 token/key/auth/signature류 query는 보관하지 않는다. 공개 commit 직전에 `--validate-public` 검사를 다시 실행한다.

## 5. 기사 수집의 경계

기사는 `news_candidates.json`에 `unverified_report`로 저장한다. 제목·매체·원문 URL·피드가 제공한 게시 시각·최초 발견 시각만 보관한다. 본문·요약문·사진은 내려받거나 저장하지 않으며, 제목을 해석해 이적 사실이나 현재 소속으로 자동 반영하지 않는다. 기사 페이지가 제공하는 접근 제한을 우회하지 않는다.

공시가 아직 없을 때 기사는 원문 확인을 위한 발견 단서다. 이후 공식 공시가 확인되면 그 공시를 별도 근거로 검토한다. 기사만으로 이적을 확정하거나 선수 MASTER를 갱신하는 경로는 없다. 홈페이지 뉴스 링크 노출은 별도 편집·이용 조건 확인 단계이며 이 구현은 자동 기사 재게시를 하지 않는다.

연결 근거:

- 매일경제 공식 RSS 안내: <https://www.mk.co.kr/rss> → 스포츠 <https://www.mk.co.kr/rss/71000001/>
- 뉴시스 공식 RSS 안내: <https://www.newsis.com/RSS/index.php> → 스포츠 <https://www.newsis.com/RSS/sports.xml>
- 2026-11-01 읽기 전용 확인에서 두 피드가 HTTP 200과 XML을 반환했다. 매일경제 50개, 뉴시스 100개 항목을 파싱했다. 당시 제목 검색의 배구 관련 결과는 0건이었으며 배구 기사 전체 수집을 검증한 결과는 아니다.
- NAVER 공식 이전 공지: <https://developers.naver.com/notice/article/32530>. 기존 개발자센터 검색 API 신규 신청은 2026-07-31 중단, 기존 키는 2027-06-30까지 사용 가능하다는 공지가 있으므로 신규 계정에 과거 신청 절차를 안내하지 않는다. 새 API HUB 연결은 필요성이 확인된 뒤 별도 설정한다. 이번 구현은 NAVER 계정·키·유료 서비스를 만들지 않는다.

## 6. 실제 선수 MASTER 연결 준비

2026-11-01 읽기 전용 확인으로 아래 대상과 헤더를 `data/player-updates/master_targets.json`에 기록했다.

| 대상 | 기존 문서 | 확인한 탭 | sheet ID |
|---|---|---|---|
| 남자부 | `2026-27_V리그_남자부_선수명단_MASTER_검수중` | `현재등록_공시기반` | 710020121 |
| 여자부 | `2026-27_V리그_여자부_선수명단_MASTER_검수중` | `현재등록_공시기반` | 710030121 |

두 탭의 3행 A:M 헤더는 `구단 / 등번호 / 선수명 / 풀네임 / 포지션 / 생년월일 / 키(cm) / 국적 / 등록 상태 / 원문 공시 / Player_ID / 비고 / 현재등록 판단`이다. 확인한 상위 데이터 행에는 Player_ID 공란이 있었으며 시즌 안내·현재 등록 판단도 검수 중이다. 기존 `KOVO_선수별변동이력`은 3행에 19개 헤더가 있지만 Player_ID·효력일·원문 revision 열이 없어 그대로 append하면 정정·중복 관리가 불가능하다.

`scripts/kvl_player_master_plan.py`는 외부 연결 없이 **로컬 읽기 전용 스냅샷**과 검토 완료 이벤트로 계획만 만든다. 문서/tab ID·제목·헤더가 모두 일치하고 24시간 이내 스냅샷, 수식/보호/수동잠금 정보, 완전한 적용 revision 이력이 있어야 한다. K열의 기존 Player_ID가 정확히 한 행과 일치해야 하며 공란·중복이면 차단한다. 이름이 같아도 ID를 채우거나 새 행을 만들지 않는다.

현재 허용된 구체적 셀 계획은 번호(B열)·포지션(E열)와 해당 공식 공시(J열)이다. 등록·이적·해지 등 멤버십 사건은 I/M열의 상태값 규약 및 이력 연결 검증 전까지 차단한다. 미래 효력일, 과거 대회 스냅샷, 수식 행, 수동잠금/보호 행, 현재 소속 충돌, 이미 적용된 원문의 revision 정정, 여러 사건이 같은 셀을 바꾸는 경우도 차단한다. 원문 revision까지 같은 적용 완료 사건은 건너뛴다. 계획에는 적용 전 행/스냅샷 해시가 남아 이후 원격 쓰기 직전 재조회 비교에 사용할 수 있지만 그 writer와 readback 활성화는 구현하지 않았다.

```bash
# 실제 데이터 없이 확인된 target과 미연결 이유만 보고
python scripts/kvl_player_master_plan.py

# 별도 읽기 전용 조회로 준비한 로컬 스냅샷을 사용. 어떤 외부 쓰기도 없음.
python scripts/kvl_player_master_plan.py --snapshots /tmp/roster-readback.json --journal /tmp/applied-revisions.json
```

스냅샷 입력은 `snapshots` 배열이며 각 항목에 config와 같은 `spreadsheet_id`, `spreadsheet_title`, `sheet_id`, `sheet_title`, `snapshot_kind: current_roster`, `header_row`, `headers`, `fetched_at`, `formula_metadata_complete`, `lock_metadata_complete`가 필요하다. 각 `rows` 항목은 `row_number`, 13개 `values`, 13개 `formulas`, 확인된 `manual_locked` 상태를 포함한다. 적용 이력은 `complete: true`와 `events` 배열에 `event_id`, `player_id`, `source_id`, `revision_id`를 기록한다. 확인하지 않은 메타데이터를 완료로 표시하면 안 된다. 원본 스냅샷과 비공개 메모를 저장소에 커밋하지 않는다.

2026-11-02 1차 연결 후 상태는 **대상 schema·남자부 전용 저널 확인 완료 / runtime_connector: NOT_CONNECTED / writeback: IMPLEMENTED_NOT_ACTIVATED / readback_activation: NOT_CONNECTED**다. 별도 writer는 구현되었으나 현재 승인된 선수 이벤트는 0건이다. 실제 활성화 상태는 `pilot.json`과 아래 8절을 따른다.

## 7. 검증과 남은 연결

오프라인 회귀 검증은 등록 해지 분류, 동명이인/다중 선수 차단, 원문 정정 시 승인 무효화, 게시일/적용일 구분, 부분 조회 시 과거 데이터 유지, 미등록 Player_ID 거부, RSS/Atom 메타데이터 범위, 반복 실행 중복 방지, 개별 피드 장애 보존을 포함한다.

선택한 기존 Player_ID의 현재값은 대조했고, 별도 적용 저널과 쓰기·재조회·공개 명단 생성 경로를 구현했다. 남은 활성화 조건은 **명시된 효력일의 공식 근거 → 실행계정의 대상 MASTER 접근 → 승인된 단일 사건의 실제 실행·읽기 검증·게시 검증**이다. 이 실제 운영 성공을 확인하기 전에는 선수 명단까지 완전 자동 갱신 중이라고 표시하지 않는다. 후보 수집·검토 완료 내보내기·로컬 변경 계획·운영 반영 상태를 각각 구분해 보고한다.

## 8. 선수 MASTER 연결 1차 — 2026-11-02

사용자가 1차 연결을 진행하도록 요청했다. 승인 범위는 기존 선수 ID 1명에 대한 번호 또는 포지션 변경의 검증·저장·재조회·현재 시즌 명단 연결이다. 전체 후보나 등록·이적·해지 사건의 일괄 적용 승인이 아니다.

실제 점검 대상은 우리카드 오재성 `KVL-P-001585`, 공식 공시 `157018`이다. 이름·생년월일을 기존 canonical registry, 남자 MASTER `현재등록_공시기반!A57:M57`, 기존 신원 검수 행, 운영 홈페이지 명단과 대조했다. MASTER와 홈페이지에는 이미 5번이 있다. 공개 공시는 3→5 변경과 **공시일**만 명시하며 실제 효력일은 확인되지 않았다. 공시일을 효력일로 채우거나 이미 맞는 번호를 되돌려 변경 검증을 만들지 않는다.

실제 원격 작업은 기존 `선수ID_신원검수!L57`의 연결 검증 메모 1셀과 신규 `KVL_자동반영이력`의 22열 헤더 준비다. 새 탭 sheet ID는 `710020128`이고 적용 이력은 **0행**이다. 기존 19열 변동 이력과 현재등록 선수값은 원격 재조회에서 동일했다. 이 점검은 적용 사건이 아닌 관측 기록 `pilot_verification.json`으로 공개한다.

### 실행 경로

- `kvl_player_master_pilot.py`: 로컬 활성화 검사 → 실제 공식 공시 재조회 → 새 파싱 결과와 승인 원문 revision 일치 → 원격 writer → 검증된 공개 export. 비활성 상태에서는 인증·공시 요청·쓰기 모두 0이다.
- `kvl_player_master_apply.py`: 정확히 1건의 기존 K열 ID, 공시의 명시적 효력일, 최근 5분 원문 근거, 전체 현재표의 수식·메모·검증 규칙·보호 상태, 별도 적용 저널을 검사한다. B/E 및 J와 적용 저널 한 행만 같은 Sheets 요청에 기록하고 다시 조회한다.
- `kvl_player_master_export.py`: 실제 재조회 성공 영수증만 받아 해당 시즌 명단의 번호/포지션과 관련 원문 연결을 갱신한다. 선수 ID·최초 등록 근거/날짜·명단 Source ID 및 다른 선수·과거 대회는 보존한다. 값이 이미 일치하면 불필요한 값 변경을 만들지 않는다.
- `kvl_player_master_publish.py`: 선수 감시기간·정확한 main·검증 영수증을 다시 확인한 뒤 Pages 빌드 SHA와 허용된 공개 JSON 바이트를 대조한다. 경기 자동화의 종료일을 선수 감시 종료일로 재사용하지 않는다.

동일 `event_id + revision_id`를 반복하면 추가 적용 이력·선수값·공개 파일 변경은 0이다. 원문 정정, 효력일 미확정, 동명이인, ID 공란, 최신값 충돌, 수식/보호/수동잠금, 지원하지 않는 셀 검증 규칙, 중간 사용자 수정, 재조회 불일치는 자동 덮어쓰기 없이 차단한다. 서버 응답을 잃어도 먼저 재조회하고 동일 쓰기를 무조건 반복하지 않는다. Sheets의 원자적 batch는 해당 요청 내 변경에만 적용되며, 공동 편집자와의 전역 잠금을 제공한다고 주장하지 않는다.

### 활성화 상태와 남은 설정

`data/player-updates/pilot.json`은 `enabled: false`, `event_scope: null`이다. 공식 효력일과 실행계정 접근권한이 해결되기 전에는 이 값을 켜지 않는다. 번호/포지션 후보 12건의 원문 5개에는 명시적 효력일이 없었으며, 날짜가 있는 군복무 만료 등록 공시를 이번 제한 범위에 대신 적용하지 않는다.

GitHub 실행계정은 기존 `kvl-v-league-updater@kvl-automation.iam.gserviceaccount.com`을 그대로 사용한다. 남자 선수 MASTER에는 현재 소유자만 표시되어 있다. 이 파일에 실행계정 편집권한을 연결하고 실제 서비스계정 읽기를 확인해야 한다. WIF 신뢰범위·키 파일·프로젝트 IAM 권한을 확장하지 않는다. Google 로그인으로 공유 설정을 진행하려던 단계는 자동 승인 검토가 특정 계정 인증 권한 부족으로 거부했으며 우회하지 않았다.

런타임은 기존 신뢰 workflow의 별도 선수 job에서 09:17 KST 일일 실행 또는 명시적 수동 실행으로 제한한다. 활성화 검사에 실패하면 Google 인증 전에 건너뛴다. 실제 예약 성공은 해당 run 영수증으로 별도 기록한다. 현재 구현·단위검사·수동 Drive 관측을 예약 자동 쓰기 성공으로 표시하지 않는다.

상세 증거·복구: [1차 연결 검수 기록](validation/player-master-pilot-20261102.md).
