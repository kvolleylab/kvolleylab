# VNL 남녀 운영 적용 · 2026-11-01

상태: **APPROVED / IMPLEMENTED / VERIFIED / RELEASE AUTHORIZED**. 사용자의 “여자부도 동일하게 만들어주고 이 페이지를 실제 홈페이지에 반영해줘” 지시로 PR #216의 운영 승인 대기 상태를 대체한다. 병합·Pages·실제 사이트 확인 결과는 PR #216에 별도로 기록한다. 이 문서만으로 DEPLOYED를 뜻하지 않는다.

기준 main: `2791e93f730a13c7f64e209d802b7e1df43b4758`. 승인된 시안 HEAD: `fd43af5f9ddf8db7a816d0ece01061a9247294e9`.

## 적용 범위

- 남녀 `competition-engine.html?competition=vnl-{men|women}-2026`에 `structure.presentation: international-home-v2`를 선택한다. 국내의 같은 표시 모듈과 Engine V2를 사용하며 엔진 복제·운영 브리지·미리보기 전용 변환은 사용하지 않는다.
- 공통 CSS의 기존 국내 선택자는 명시적 국제 opt-in을 추가한다. 기존 선언·국내 선택자 specificity는 유지한다. `:where()`로 Hero 보존 분기의 specificity를 늘리지 않는다. 새 `kvl-international-home-v2.css`는 opt-in 페이지에만 적용한다.
- 국내 기본 템플릿에 승인된 Hero 글자 크기, 5세트 기준 경기행/보조정보 정렬, 실선 대진, 팀 성적·달력·펼친 목록, 배경 없는 VNL 크기 요약 아이콘을 반영한다.
- 남자 보라 `#5B3A8E`, 여자 로즈 `#8E315E`/연한 배경 `#FFF1F6`, 일반 점수 `#4B5563`. Theme Policy v1 및 최신 Drive Hero guide의 여자부 우선순위 적용.
- 홈페이지 대회 선택의 VNL 여자부와 국제대회 목록 남녀 링크를 활성화한다. 전역 메뉴 구조는 유지한다.
- 남자 config는 표시 선택만 추가한다. `data.json`은 기준 main과 바이트 단위 동일: 의미/시즌 구조 원문·116경기·18개국·명단·모든 기존 ID 보존. 중국 상태 문구는 normalization 시 표시 설정으로만 ‘개최국’으로 바꾼다.
- AVC 남녀의 운영 wrapper/config/data는 변경하지 않는다. CSS 기존 선언을 변경하지 않은 것은 selector 변환 역산으로 확인한다.

## 여자부 근거와 경계

KVL Drive 전체 이름 검색 및 기존 국제대회 폴더에는 VNL 남자부만 존재했다. 여자부 기존 MASTER/ID를 임의로 만들거나 남자부 ID·명단을 재사용하지 않는다. 공개 공식 자료를 별도 시즌 snapshot으로 연결했다.

- 공식 tournament `1662` / `WVNL2026`, 18개국, 예선108 + 파이널8 =116경기.
- 경기 API: `https://en.volleyballworld.com/api/v1/volley-tournament/2026-06-01/2026-08-03/1661;1662`에서 여자1662만 선택.
- 순위: `https://en.volleyballworld.com/volleyball/competitions/volleyball-nations-league/standings/women/`의 예선18행/최종18행.
- 방식: `https://en.volleyballworld.com/volleyball/competitions/volleyball-nations-league/competition/formula` 및 같은 사이트 `competition/pools-and-host-cities`.
- 세계랭킹: 같은 공식 경기 API의 여자부 `pastWorldRanking`, 공식 경기/세계랭킹 링크. 별도 출전권은 확정하지 않는다.
- 명단: 공식 `teams/women/{officialTeamId}/players/` 18페이지, 총252명. 등번호·공식 표기명·포지션과 공식 선수 프로필 링크. 신체정보·한글명·소속·KVL Player ID는 미확인으로 유지한다. 기존 KVL 선수 MASTER에 매칭하지 않았다.
- 경기 ID `VBW-M-2026-VNL-W-{officialMatchId}`, 대회 ID `VBW-TOURNAMENT-1662`는 출처별 식별자다. KVL MASTER 등록 완료를 주장하지 않는다. 향후 승인된 MASTER 매핑 시 기존 공개 source ID를 alias로 보존해야 한다.
- 시간: 공식 UTC → KST. 현지 시각과 UTC offset은 공식 local timestamp에서 계산. 공식 API에 체육관 이름이 비어 있으면 개최도시를 표시하며 빈 세부명을 임의 보충하지 않는다.
- 최초 결과: 튀르키예 우승(결승 브라질3-1), 브라질2위, 이탈리아3위, 중국4위. 경기별 세트 수/승리 세트와 스코어 일치. 18개국 예선 경기 수·승·패·승점이 독립 공식 순위표와 모두 일치한다. 파이널은 예선 집계에 포함하지 않는다.

Drive 원본: [2026 VNL 여자부](https://drive.google.com/drive/folders/1jeoVOwY3m4QWIM0SyXqGyUtjrmZ5bTbG). [공식 자료 ZIP](https://drive.google.com/file/d/1RRGRqNFHywSVpWl5RrGNWkUK63IVneCc/view), [Hero 원본](https://drive.google.com/file/d/1eFgpu331Pye3RISXqBEebFs08kp1OqD9/view). 원본 공유 권한은 확대하지 않았다. 공개 저장소에는 웹용 데이터·이미지와 원본 메타데이터만 둔다.

재생성: ZIP을 푼 뒤 `KVL_JSDOM_PATH=<jsdom> node scripts/extract-vnl-women-2026.cjs <archive> <output>` → `python scripts/import-vnl-women-2026.py <archive>/vnl-official-2026.json <output>/women-standings-parsed.json <output>/women-rosters-parsed.json`. 가져오기 도구는 기존 MASTER를 수정하지 않으며 시즌/성별/공식 경기 수·점수·독립 순위를 검증한다.

## Hero

남자 Hero 자산/텍스트/원형은 보존. 여자 Hero는 내장 imagegen으로 새로 제작, 기존 VNL의 왼쪽 지도·빛 효과와 오른쪽 여자 배구 동작을 사용한다. 실존 선수/대회 사진으로 표시하지 않는다. 국기·브랜드·문자를 제거했고 HTML 제목/날짜/장소를 유지했다. 원본2172×724를 자르거나 늘리지 않고 WebP85로 변환(각163,020 bytes), PC/mobile 경로 분리. PC는 right top으로 선수 머리를 보존하고 모바일은 기존 VNL 배치 계약을 사용한다.

생성 프롬프트 요지: 기존 남자 VNL Hero의 3:1 구도·선명도·왼쪽 55% 지도/빛/텍스트 공간 유지, 오른쪽 성인 여자 배구 공격·블로킹, navy+KVL Rose 광원, 비식별 가상 선수, no text/logo/flag/watermark. 후속 편집: 배경 국기와 유니폼 브랜드 제거, 나머지 구도·색감 보존. 최종 WebP: `assets/images/competitions/vnl-women-2026-hero-{pc|mobile}-v01.webp`.

## 검수

- Node DOM/데이터 회귀73건 PASS: 국내 대학/학교/컵, 팀 성적·달력, config/data 계약, 남녀 국제 opt-in·6개 탭·명단·의미 위치·ID 보호.
- 운영 workflow에 지정된 PRO 컵·V-리그 보호 검사46건도 PASS(위 배치와 중복 포함). 운영 starter의 별도10개 계약 검사 PASS. 오래된 cache query/실행 gate를 고정한 테스트는 새 승인 버전/선택자에 맞춰 갱신했고 보호 조건은 유지했다.
- Chrome 실제 렌더: PC viewport1600/본문1180, 모바일390/360, 남녀6개 탭. 본문 가로 넘침 없음, 탭 전환 및 국가 가나다순.
- 여자 팀 국기 → 성적5칸 + 팀 달력 + 펼친 전체12경기, 실제 대진/스코어 날짜 클릭 →5세트 팝업 확인. 공식 명단14행/14개 공식 선수 링크 확인.
- 남자 원문은 기본요약 바로 아래/달력 위, 파이널 연한 파랑·세계랭킹 연한 초록 유지. 요약 아이콘 PC36px/모바일31px, 여자 로즈 확인.
- 운영 전 최종 screenshot/measurement 증거는 `vnl-production-20261101-browser.json` 및 [PC](vnl-women-production-pc.jpg) · [모바일390](vnl-women-production-mobile.jpg)을 참조한다. 기존 시안 R1–R6 검증은 `vnl-domestic-template-v1.md`에 보존한다.

## 배포·복구

PR #216 head를 재확인하고 사용자 승인에 따라 merge. Pages의 해당 commit 성공과 실제 홈페이지 남녀 config/새 Hero·화면을 각각 확인해야 DEPLOYED다. 복구는 최신 main에서 이 PR의 운영 변경을 revert하는 별도 PR로 처리한다. 후속 타 작업을 덮는 reset/force push는 하지 않는다. 여자 원본 Drive 보관물과 기존 ID는 삭제하지 않는다. 다른 국제대회 일괄 전환은 이번 범위가 아니다.
