# KVL 국제 국가별 대표팀 역사형 명단 v1 · 검증 기록

Date: 2026-11-18 KST
Status: USER APPROVED / VERIFIED / DEPLOYED ON MAIN / LIVE HTTPS QA PASS (2026-11-18 KST)

## 범위
선수·팀 → 팀 → 국제 분류를 40개 국가·지역의 실제 목록으로 변경하고 국가별 남녀/연도/대회 명단을 기존 KVL 공개 대회 기록에 연결한다. 국가의 페이지는 동일 teams.html 주소를 이용한 공유 가능한 country/gender/year 쿼리로 제공한다. 기존 teams.html 회원접근 보호와 다른 5개 팀 분류는 유지한다.

## 1단계 · 국가 색인
- data/master/country_master.json 원본 4개 영구 country_id는 변경하지 않는다. 신규 36개 가상 country_id는 발급하지 않고 국가 코드만 연결키로 사용한다.
- 2026 VNL 남18·여18, 아시안게임 남16·여14, AVC 남자 대륙선수권 12팀의 중복 제거 참가 국가·지역 40개. 아시아20, 유럽12, 북중미4, 남미2, 오세아니아2. 등록 소스 내 아프리카 국가 없음은 전체 아프리카 국가의 미출전을 의미하지 않는다.
- 국가명/국기 ISO2는 기존 대회 참가 원본에서 가져온다. 스포츠 국가대표팀의 전용 엠블럼과 표준 국기는 다를 수 있다.

## 2단계 · 대회/연도 고정 스냅샷
- data/international/country-roster-index-v1.json은 총 89개 source-only 명단 참조: 2026 VNL 남18 여18, 아시안게임 남16 여14, AVC 대륙선수권 남12, AVC 남자컵 11.
- 2026 대륙선수권에서 공식 FINAL 표기 11팀만 최종 명단으로 표시하며 바레인 13명은 공개 출국 명단으로 따로 표시한다. VNL Active/Reserve, 아시안게임 등록 12명, AVC 남자컵 검증본은 자동으로 FINAL로 변환하지 않는다.
- 원본 선수 배열을 다른 MASTER에 복사하지 않는다. 대회를 선택했을 때만 해당 source_path의 팀 로스터를 조회한다. data/original, 선수 영구 ID, 경기 스코어, 프로 구단 공시 수집기는 변경하지 않는다.
- 내부 KVL 선수 프로필은 기존 국제 MASTER의 정확한 영구 Player_ID와 성별·국적·생년월일·영문 또는 한글 이름이 모두 일치하고 역사 충돌 ID가 아닌 경우에만 링크. 근거 불충분 선수는 원본 공식프로필/Volleybox 확인 링크만 노출.
- 연도별 자료가 없다는 사실은 그 국가의 미출전이나 특정 선수 탈락을 뜻하지 않는다.

## 3단계 · 공식 후보/선발 이력
- data/international/country-selection-index-v1.json에는 source_id, 공식 HTTPS 원문, 게시일, 연도, 성별, 단계(candidate_pool, longlist, week, final, match), 검증된 Player_ID 등의 계약을 마련했다.
- 현재 공식 후보 명단 별도 검증 0건. 기존 VNL Active/Reserve 등 대회 공개 명단을 공식 후보 롱리스트로 재분류하거나 존재하지 않는 후보를 만들지 않는다.
- 후보↔최종 비교는 정확한 인물 ID와 완전한 최종 명단이 별도 검증된 경우에만 실행. 후보가 최종 자료에 없으면 최종 등록 명단에 없음·사유 미확인으로만 표시한다. 공식 탈락, 부상, 국가 미참가를 추정하지 않는다.

## 자동화 계약
- node scripts/build-international-country-index-v1.cjs --check
- node scripts/build-international-country-index-v1.cjs --write
- 생성기는 현재 GitHub에 공개된 기존 6개 대회 자료로부터 표시용 국가/명단 색인만 결정적으로 재생성한다. 새 국가, 새 시즌, 새로운 공식 후보/최종 원본은 검수 후 명시적으로 등록해야 한다.
- 외부 FIVB/AVC 원문을 주기적으로 수집하는 신규 어댑터는 이번 작업에 포함되지 않는다. 정기수집 활성화/MASTER 쓰기가 구현됐다고 주장하지 않는다.
- GitHub Actions에서 Node 테스트와 실제 PC/모바일 Chromium 스크린샷을 검증하고, 통과 후 별도 PR로 인계한다.
- Google Drive MASTER/원본은 이 세션에서 link_id 연결 오류로 NOT VERIFIED. 기존 GitHub 공개 자료를 근거로만 사용했다.

## 복구 및 승인
원본 6개 대회 데이터, 회원 개인 메모, 로그인·권한, 기존 KOVO 로스터 자동화, 기존 네비게이션 및 KVL 영구 Player_ID는 수정하지 않는다. 사용자의 운영 반영 지시(2026-11-18) 후 PR #361 병합·Pages 배포·실제 HTTPS 검증을 마쳤다. 후속 수정은 별도 검수·승인과 PR로 진행한다. 문제 발생 시 신규 국제 UI·색인 PR만 되돌린다.


## 확장·운영 규칙 및 브라우저 검수

- data/international/country-source-config-v1.json에 승인된 대회별 원본 경로, 연도, 성별, 포맷, 공식 KVL 대회 링크를 명시한다. 새 연도는 기존 파일/명단을 교체하는 대신 이 설정에 새 source 항목을 추가한다.
- 결정적 생성기는 해당 설정을 읽어 등록 연도를 자동 계산한다. 새로운 국가 코드는 국가별 지역 분류 및 기존 MASTER ID 재사용 검증을 받아야 하므로 이름이 비슷하다는 이유로 자동 합치거나 신규 country_id를 발급하지 않는다.
- .github/workflows/international-country-index-review-v1.yml은 운영 승인 후 기존 승인 소스 JSON이 변경될 때마다 파생 국가/명단 색인만 재생성하여 GitHub **검수용 PR**을 생성하는 형태다. 원본 명단, 후보 원장 또는 선수 영구 ID 자동 변경은 금지된다. 별도의 공식 웹사이트 수집기가 구현됐다는 뜻은 아니다. 이 workflow의 실제 트리거/PR 생성 성공은 본 PR 운영 반영 후 검증해야 한다.
- 사용자가 나라를 선택하면 40개국 전체를 긴 페이지 아래에 반복해서 보여주지 않고, 목록 자리에 해당 국가의 연도·대회별 상세 화면을 표시한다. 목록으로 돌아가기, 필터 및 공유 가능한 URL을 유지한다.
- 후보/최종 명단 등록은 공식 URL뿐 아니라 공개 원문 파일 버전 SHA-256, source_id, 게시일, reviewed_at, review_status=VERIFIED가 있어야 한다. 독립적인 완전성 검증(identities_complete, official_roster_complete, player_count 동일)이 없는 경우 최종 엔트리의 누락 선수에 대한 선발 비교를 비활성화한다.
- 기존 팀 페이지 회원 로그인 차단은 그대로 유지한다. Chromium은 로컬 파일을 HTTPS origin으로 라우팅하고 테스트 브라우저에서만 로그인 오버레이를 격리하여 GUI를 검사한다. 이는 관리자 계정의 실제 로그인·비공개 데이터 조회 검증이 아니다.
- 공식 자료 미확보 2027년 및 이후 시즌을 자동 생성/참가 확정하지 않는다. 대회 운영별 승인·원본 출처 연동과 실제 데이터 수집 주기 검증이 다음 작업이다.


## 운영 릴리스 증거 (2026-11-18 KST)

- 사용자 승인으로 [PR #361](https://github.com/kvolleylab/kvolleylab/pull/361) squash merge 성공. **배포된 기능 SHA**: `8d1fbae5fb237b2be43b02a4c6fec242c8ead919`.
- **GitHub Pages LIVE**: https://github.com/kvolleylab/kvolleylab/actions/runs/44296156330 → `SUCCESS` (동일 기능 SHA).
- **국제 국가별 운영 홈페이지 Chromium QA**: https://github.com/kvolleylab/kvolleylab/actions/runs/44296161095 → `SUCCESS` (동일 기능 SHA). GitHub artifact `#14424681452`; 화면 캡처 5장과 JSON report. 검사 기준: 실제 `https://kvolleylab.com` HTTP·JSON.
- LIVE 검증: 40개 국가·지역, 89개 대회 명단 포인터, 아시아 20·유럽 12개 필터, 일본 남자 VNL 16명(Reserve 구분), 일본 남자 AVC 최종 14명, 일본 여자 VNL 14명, 바레인 출국명단 13명, 기존 V-리그 여자 7개 구단과 퍼블리셔 소유 현행 등록 인원 수, PC 1440·모바일 390/360에서 가로 넘침 0px. `report.status=PASS`.
- **기존 팀 페이지 운영 회귀 QA**: https://github.com/kvolleylab/kvolleylab/actions/runs/44296161098 → `SUCCESS`.
- **파생 색인 검수 워크플로 첫 실행**: https://github.com/kvolleylab/kvolleylab/actions/runs/44296161131 → `SUCCESS`. 이는 해당 시점 자료로 인덱스 재계산 검사가 성공했다는 의미이며 신규 공식 후보 자료 자동 수집이나 실제 갱신 PR 발행이 검증됐다는 뜻이 아니다.
- **기존 페이지 접근 제한 유지**: `data/member-access-v1.json`에는 `teams.html` 보호가 남아 있다. 운영 Chromium QA는 UI 테스트 전용 컨텍스트에서만 로그인 오버레이 모듈을 가로채 검수했다. **실제 관리자 계정 인증 성공/일반회원 권한 검증은 이번 범위 밖**이다.
- **자료 한계**: 공식 후보/롱리스트 독립 검증·등록 0건. 새로운 공식 후보 원문을 자동으로 수집·등록하는 기능은 아직 없다. 최초 4개 국가 MASTER 영구 ID 외 신규 36개 ID는 생성하지 않았다. Google Drive 원본 별도 대조는 링크 계정 접근 문제로 `NOT VERIFIED`이며 기존 KVL GitHub 대회 스냅샷 자료만 재사용했다.
- **보호 범위**: 기존 국제대회 원본, Player_ID, V-리그 KOVO 공시 자동화, 경기·순위 데이터, Supabase 회원 정보·메모 코드는 수정하지 않았다. 실제 인증 정책도 미변경.
- **복구**: PR #361의 기능 변경만 되돌리면 기존 국제 카드 연결 화면으로 복구되며 원본 데이터/자동수집기/회원 계정은 그대로 유지. 문서 릴리스 상태 기록은 별도 docs-only 후속 PR로 반영했다.
