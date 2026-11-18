# KVL 국제 국가별 대표팀 역사형 명단 v1 · 검증 기록

Date: 2026-11-18 KST
Status: USER DIRECTED / IMPLEMENTED ON FEATURE BRANCH / SOURCE AND BROWSER QA IN PROGRESS / NOT DEPLOYED

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
원본 6개 대회 데이터, 회원 개인 메모, 로그인·권한, 기존 KOVO 로스터 자동화, 기존 네비게이션 및 KVL 영구 Player_ID는 수정하지 않는다. 운영 반영은 최종 CI와 사용자 명시적 승인 후 진행하며 배포 전에 DEPLOYED 판정하지 않는다. 문제 발생 시 신규 국제 UI·색인 PR만 되돌린다.
