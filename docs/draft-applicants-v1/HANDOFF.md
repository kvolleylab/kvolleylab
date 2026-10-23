# KOVO 공식 드래프트 신청자 프로토타입 인계

검수일: 2026-10-23 · 명단 기준: KOVO 2026-10-22 공식 PDF · 상태: **PROTOTYPE / READY FOR REVIEW**

운영 홈페이지 반영 승인은 받지 않았으며, 이 변경은 별도 feature 브랜치와 기존 비공개 Work Site의 새 경로에서만 검토한다.

## 확인 경로

- 프로토타입: https://kvl-player-workspace-prototype-v1.blackisle17.chatgpt.site/draft-applicants-prototype.html
- PC·모바일 폭 선택: https://kvl-player-workspace-prototype-v1.blackisle17.chatgpt.site/draft-applicants-review.html
- 기존 B안: https://kvl-player-workspace-prototype-v1.blackisle17.chatgpt.site/players.html
- GitHub base: `7f5b90109c912ee1cdaa93c463a5d667a1a95bdb`
- 작업 브랜치: `feature/draft-applicants-2026-27` (main 병합 금지)
- 기존 B안 복구 기준 Site source: `b2ff2942668554e4a748a975892caaf0fce868c5`

## 공식 인원과 연결 결과

| 부문 | 공식 PDF | 수록 | 기존 프로필 연결 | 추가 검수 | 미연결 | 중복 검토 |
|---|---:|---:|---:|---:|---:|---:|
| 남자 | 59 | 59 | 48 | 4 | 7 | 0 |
| 여자 | 58 | 58 | 51 | 0 | 7 | 0 |
| 합계 | 117 | 117 | 99 | 4 | 14 | 0 |

남자 대학 48명(4학년 30명·하위 학년 18명), 고교 5명, 실업 6명. 여자 고교 50명, 대학 6명, 외국국적동포 2명. 소속·학년별 집계는 프로토타입의 ‘소속·학년별 현황’에서 전체 확인할 수 있다.

전체 공개 명단: [남자 59명 CSV](men-official-applicants.csv), [여자 58명 CSV](women-official-applicants.csv), [전체 117명 CSV](all-official-applicants.csv).

공식 출처:

- 남자: https://kovo.co.kr/news/kovo/press/157978
- 여자: https://kovo.co.kr/news/kovo/press/157977
- 두 원문 모두 API 등록일 2026-10-22. 최초 보도일(남자 10-21, 여자 10-12)과 구분했다.
- 공식 CDN PDF를 내려받아 표 추출 후 원본 렌더링으로 전수 대조했다. 10-23 재수집에서도 PDF SHA256·행 수가 같았다.
- 원본 남자 PDF 보관: https://drive.google.com/file/d/1sGnKB0K3Fj7HanEOWLPAcBW_nmGIzm9I/view
- 원본 여자 PDF 보관: https://drive.google.com/file/d/1oWuUuHk0p6MonAt6XQJiE2XI_dL5cOws/view
- 기존 Drive `01_프로 / 2026-27 V-리그 / 01_공식자료`에 원본을 보존했다. 공유 권한은 변경하지 않았다.

이전에 업로드된 남자 60명 Excel과 공식 59명 PDF는 명지대 박세민 1명의 수록 여부가 다르다. 나머지 59명의 학교·학년·신장·체중·출신학교·포지션은 같다. 빠진 사유가 명시되어 있지 않아 철회·제외·미신청으로 판정하지 않았다. 공개 화면은 최신 공식 59명을 사용한다.

## 연결 검수 대기 18명

| 부문 | 선수 | 신청 당시 소속 | 상태·이유 |
|---|---|---|---|
| 남 | 옹민혁 | 경일대 | 추가 검수: 기존 ID의 공개 이름과 MASTER 표기 불일치 |
| 남 | 김도현 | 인하대 | 추가 검수: 공식 명단과 기존 DB의 생년월일 불일치 |
| 남 | 전유석 | 중부대 | 추가 검수: 기존 ID의 공개 이름과 MASTER 표기 불일치 |
| 남 | 송건환 | 홍익대 | 추가 검수: 기존 ID의 공개 이름과 MASTER 표기 불일치 |
| 남 | 염시원 | 경희대 | 미연결 |
| 남 | 장승호 | 충남대 | 미연결 |
| 남 | 변혜민 | 부산시체육회 | 미연결 |
| 남 | 안창호 | 비오신코리아 | 미연결 |
| 남 | 이율리 | 국군체육부대 | 미연결 |
| 남 | 홍지원 | 영천시체육회 | 미연결 |
| 남 | 박규환 | 화성특례시청 | 미연결 |
| 여 | 김예서 | 선명여고 | 미연결 |
| 여 | 오해솔 | 선명여고 | 미연결 |
| 여 | 김아란 | 제천여고 | 미연결 |
| 여 | 김아중 | 청수고 | 미연결 |
| 여 | 이소민 | 광주여대 | 미연결: 기존 동명 선수는 생년·소속이 다른 사람 |
| 여 | Audrey Pak | 외국국적동포선수 | 미연결, 공식 영문명 유지 |
| 여 | Ju Eun Anabel Park | 외국국적동포선수 | 미연결, 공식 영문명 유지 |

상세 연결 검토 레코드: [connection-review.json](connection-review.json). 미연결 신청자에게는 KVL 영구 ID를 생성하지 않았고, 다른 선수의 프로필·관심선수·메모에 연결하지 않았다.

## 디자인과 동작

승인된 홈/B안의 1180px 본문, 기존 Hero 자산, 공통 내비게이션, 네이비·블루·로즈핑크 카드 규칙을 재사용했다. 기본은 전체 신청자를 빠르게 훑는 표이며, 카드 보기로 전환할 수 있다. 사진·수상·실적을 새로 추정하지 않았다.

성별, 이름, 학교·소속, 참가 구분, 복수 학년, 포지션, 신장 범위, 신청 상태, 연결 상태, 지명 결과를 조합한다. 참가 구분에 맞는 학교만 남고, 사용할 수 없는 학년은 숨긴다. 이름·학교·신장 정렬과 현재 검색 결과 CSV 다운로드를 제공한다. 카드의 고유번호는 숨긴다.

검증된 99명은 기존 `player.html?id=KVL-P-...`로 연결한다. ‘신청 정보’에는 신청 당시 정보·공식 출처·해당 연도 이력이 따로 표시된다. 운영 프로필은 수정하지 않았다. 관심선수는 기존 B안과 동일한 체험 저장소를 사용하며, 메모 화면도 기존 B안으로 연결한다.

## 검증 결과와 범위

| 요구 검사 | 결과·근거 |
|---|---|
| 공식 남녀 인원과 수집 인원 | 59/59, 58/58 일치 |
| 신청자 중복 | 0건, 이름+생년월일·공식 순번·레코드 ID 대조 |
| 기존 KVL ID 변경 | 0건 |
| 기존 프로필 연결 | 검증 연결 99건 모두 변경하지 않은 운영 renderer+canonical overlay에서 올바른 이름 출력 |
| MASTER 삭제 | 0건, 229 MASTER 및 158 national links의 ID 목록 유지 |
| 로스터·대표팀 연결 | 보호 파일 304개의 SHA256 동일 |
| 동명이인 오연결 | 검증 대상 99건에서 0건; 중복·DOB 충돌·이름 단독 매칭 차단 테스트 통과 |
| 관심선수·메모 보존 | 기존 B안 파일 24개 동일. 기존 14개 테스트와 신규 저장소 보존 테스트 통과 |
| 검색·학교·학년 | 실제 브라우저 및 DOM 조합 필터 테스트 통과 |
| PC·모바일 | 1440·1180·768·390·360px 실제 iframe 렌더링과 스크린샷 확인. 가로 넘침 없음 |
| 동일 공시 재수집 | 원본 SHA256 동일, 신청자·연결·수정 이력 출력 바이트 동일 |
| 신청/지명 상태 분리 | 신청 확인 117명. 지명 결과는 전원 `unverified`로 독립 보관 |
| 미연결 잘못된 프로필 이동 | 18명 모두 프로필 링크·관심선수 버튼 없음. 별도 신청 정보만 표시 |

자동 테스트 총 35개 통과: 매칭/정정 이력 Python 10, 공개 데이터/검색 7, 신규 DOM 3, 실제 운영 프로필 renderer 1, 기존 B안 회귀 14. 상세 근거는 [data-validation.json](data-validation.json), [after.json](../validation/draft-applicants-v1/after.json), [qa-results.txt](../validation/draft-applicants-v1/qa-results.txt)를 참고한다.

브라우저에서는 성별·목록/카드·학교 종속·학년 복수 선택·이름 검색·미연결 상세·바깥 클릭 닫기·관심선수 저장·기존 B안의 추적 상태 연동을 확인했다. 여자부 활성 책갈피는 `#A43F68`, 남자부는 `#1D4ED8`이다.

**검증 제한:** 내부 HTTP 미리보기에서 기존 B안의 `crypto.randomUUID()`가 제공되지 않아 메모 신규 저장을 끝까지 실행하지 못했다. 기존 코드 변경은 하지 않았다. 메모 추가·복수 기록·수정·삭제·복구·A/B 분리는 DOM/단위 테스트로 검증했으며, HTTPS 호스팅 환경에서의 수동 메모 검수는 남아 있다. 99개 프로필은 실제 운영 소스에 대한 DOM 실행 검증이며, 99개 URL 모두를 네트워크로 개별 방문한 검사는 아니다.

실제 캡처: [PC 1440](../validation/draft-applicants-v1/pc-1440.jpg), [PC 목록](../validation/draft-applicants-v1/pc-list.jpg), [PC 1180](../validation/draft-applicants-v1/pc-1180.jpg), [태블릿](../validation/draft-applicants-v1/tablet-768.jpg), [모바일 카드](../validation/draft-applicants-v1/mobile-390.jpg), [모바일 목록](../validation/draft-applicants-v1/mobile-360-table.jpg). 전체 페이지를 이어 붙인 이미지가 아닌 실제 브라우저 화면 캡처다.

## 데이터 구조와 수집 운영

`applicants.json`은 연도별 신청 사실이고, `player-links.json`은 기존 영구 신원과의 검증된 연결이다. 신청자 ID는 `KVL-DA-{season}-{gender}-{digest}`로 선수 ID와 구분한다. 동일 선수가 다른 해에 신청하면 신청 기록은 새로 생기고 기존 KVL 선수 ID는 유지된다.

`collect.py`는 기존 KOVO 수집기의 공개 API 전송 함수만 재사용한다. 선수 등록 parser는 재사용하지 않는다. 공식 API와 첨부 PDF를 먼저 보존하고, 검수된 SHA256/병합 셀 범위/표 헤더/행 수가 일치할 때만 정규화한다. 정정 원본은 새 해시 파일로 보존하고 자동 출력을 중단한다. 새 형식/시즌은 검토된 source config를 추가한 뒤 진행한다.

`build.py`는 정규화 데이터를 원본 PDF에서 다시 추출한 값과 비교한 뒤 기존 공개 선수 스냅샷 및 읽기 전용 Drive 신원 기준으로 대조한다. 공식 명단에는 KVL ID가 없으므로 이번 연결 99건은 모두 이름+생년월일 일치다. 동일 이름만으로 연결하거나 상충하는 생년월일을 약한 소속/포지션 조건으로 우회하지 않는다. 약한 조건이 불충분하면 미연결/검수 대기다.

PUBLIC·VERIFIED 신청 데이터만 출력한다. 공개 파일에는 전체 생년월일·체중·Drive 내부 검수 행·개인 메모를 복사하지 않는다. 후보 검토 기록은 별도 문서이며, 클라이언트에는 후보 ID를 싣지 않는다. 원본 PDF는 Drive에 보관한다.

실행 예:

```sh
python scripts/draft_applicants/collect.py --config scripts/draft_applicants/sources-2026-27.json --archive /path/to/official-archive --fetch
python scripts/draft_applicants/build.py --input-dir /path/to/official-archive --catalog /path/to/existing-public-players.json --drive-identities /path/to/read-only-identity-check.json --out data/draft-applicants/2026-27 --report-dir docs/draft-applicants-v1
python -m unittest discover -s tests -p test_draft_applicants.py
node --test tests/draft-applicants.test.mjs
```

PDF 추출에는 `pdfplumber`, DOM 테스트에는 `jsdom`이 필요하다. `KVL_JSDOM_PATH`로 기존 설치 경로를 지정할 수 있다. 예제 경로는 비공개 원본/신원 자료를 저장소 밖에 두기 위한 자리표시자다. 공개 스냅샷의 입력 파일/압축 데이터 25개는 최신 main과 동일한지 [catalog-source-lock.json](catalog-source-lock.json)으로 검증했다.

## 파일별 정식 이식 계획 — 별도 승인 후

| 파일·영역 | 승인 후 작업 | 롤백 |
|---|---|---|
| 새 prototype HTML/CSS/JS | 디자인 승인 후 기존 `draft-hub.html`의 콘텐츠 어댑터로 이식. 공통 메뉴·1180px 규칙 유지 | 운영 PR을 revert하고 기존 Draft Hub 복원 |
| `data/draft-applicants/{season}/` | 공식 신청 사실과 연결을 독립 파일로 공개. 시즌별 source config·검수 기록 유지 | 직전 검증 스냅샷/연결표로 되돌림 |
| `player.html`과 프로필 JS | 별도 PR에서 검증된 KVL ID의 드래프트 이력을 읽기 전용 섹션으로 추가 | 해당 모듈 연결만 제거 |
| 선수 MASTER·국가대표·로스터 | 이번 이식에서 일괄 변경하지 않음. 검수 대기 18명은 기존 규칙에 따른 개별 신원 검수 | 기존 ID/연결을 보존, 정식 개별 수정은 수정 전 스냅샷으로 복구 |
| 회원 관심선수·메모 | 실제 인증·회원 소유권·서버 ACL/RLS·감사 이력 구축 후 연결. 체험 저장소를 운영 보안으로 사용하지 않음 | 이전 회원 API 버전 유지/기능 플래그 해제 |
| 공시 수집 자동화 | 별도 PR에서 수집→검수→공개 export 단계를 연결. 수집만으로 main에 쓰지 않음 | 새 스케줄/승격 단계 중지, 마지막 검증 스냅샷 유지 |

현재 feature 브랜치 폐기/PR 닫기만으로 운영 홈페이지에는 영향이 없다. Work prototype을 되돌릴 때는 새 draft 경로 7개를 제거하거나 이전 private Site source `b2ff294...`를 재게시한다. 기존 B안 파일은 변경되지 않았다.

남은 작업은 18명 신원 검수, 지명 결과의 별도 공식 수집, HTTPS 메모 수동 검수, 실제 회원 백엔드 구축, 사용자 디자인 승인이다. 60명 참고 파일의 차이를 임의 신청 철회로 처리하지 않으며, 검수 전 선수 신원을 운영 DB에 편입하지 않는다.
