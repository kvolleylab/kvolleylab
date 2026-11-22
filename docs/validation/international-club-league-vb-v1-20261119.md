# 국제 국가별 선수명단 소속리그 국가 / VB 단축링크 검증 v1 (2026-11-19)

Status: USER REQUESTED REVIEW / IMPLEMENTED IN FEATURE BRANCH / CI AND PRODUCTION NOT VERIFIED.

## 사용자 요청과 비교 기준
- 사용자 지정 표기는 **소속팀 바로 옆에 해당 소속 리그의 국가명**, Volleybox 링크는 **`VB->`**.
- 실제 기존 2026 AVC 남자 대륙선수권 명단: `assets/js/avc-men-roster-runtime.js`의 `clubInfo`가 `leagueCountry`/`leagueName` 확인 출처를 사용해 소속팀과 `🇮🇹 Italy · SuperLega`를 표시하고, 직접 Volleybox 링크는 `VB↗`이다.
- 국제대회 공통 컴포넌트 `assets/js/kvl-competition-roster-v1.js`는 PC `Volleybox ↗` / 모바일 `VB↗`임을 별도 확인했다. **기존 공통 컴포넌트의 일반 규칙과 이번 사용자 지정 `VB->` 표현이 다르다.** 이번 수정은 `teams.html`의 국제 국가별 통합·개별명단만 대상으로 하며 다른 대회 템플릿은 변경하지 않는다.
- 배포되어 있던 `assets/js/kvl-international-unified-roster-v1.js`는 `club` 이름만 보존하고 `club.country`/registry `leagueCountry`/`leagueName`을 모델로 전달하지 않음. 화면도 `Volleybox` 전체 단어 표시.
- 배포되어 있던 국가별 대회 `명단 보기`는 원본 `club`을 제거한 5컬럼 명단이며 Volleybox를 전체 단어로 표시.

## 기존 출처 커버리지 (메타데이터 / 선수 임의 재확인 아님)
- `data/competitions/avc-men-continental-2026-clubs-2026-27.json`: 87개 소속 등록 중 `CONFIRMED` 70개가 리그 국가·리그명을 보유, `REPORTED` 17개는 공개하지 않음.
- `data/competitions/asian-games-men-2026/rosters.json`: 191 선수 중 `club.confirmed===true` 및 `club.country`가 모두 있는 66명.
- `data/competitions/asian-games-women-2026/rosters.json`: 168명 중 동일 검증조건 24명.
- `data/competitions/vnl-men-2026/data.json` 일본 등 `club.confirmed=false`인 기록과 여자 VNL 소속 정보 미확인 기록은 국가·리그를 추정해서 채우지 않음.

## 리뷰 변경 내용
1. 통합명단 `identify`/build: 확인된 club과 같은 근거의 국가·리그명을 한 묶음으로 보존. AVC 2026-27 스냅샷을 선택하면 **club+country+league**를 함께 교체해 서로 다른 시점의 소속/국가 혼합 방지.
2. PC/모바일: 기존 8개 컬럼과 **선수명 22px·기본 정보 19px**, 원형 참가이력 및 내부 스크롤 보존. `소속팀` 셀 안에서 구단 이름 바로 옆에 국가·리그를 표시; 내용이 길면 셀 안에서 줄바꿈.
3. 국가별 개별 대회명단: 확정된 원본 `club.country` 재사용, AVC 대륙선수권 2026 남자부 한정 기존 `CONFIRMED` registry 로드. 확인된 선수에게만 이름 영역에 구단+국가·리그 정보 추가. 원래 5컬럼과 원본 인원·상태는 그대로 유지.
4. **직접 선수 프로필** URL만 `VB->`로 표시, 검색 URL은 `VB 검색`으로 명확히 구분, 미확인은 대시/숨김을 유지. 외부 새탭·noopener/noreferrer·URL 검증 기존 정책 보호.
5. `teams.html`에서 국가·통합 JS 및 CSS 4개 캐시 키만 갱신. 기존 KOVO·회원·국제 대회 원본·Player MASTER 및 출처 정책 무변경.

## QA 계획과 릴리스
- `node --test tests/international-unified-roster-live-v1.test.cjs`: 동일인 통합 26명, 일본 이시카와 유키의 Türkiye·리그명, 아라이 유다이의 Japan, 소속 미확인 후카츠의 국가 미노출, 원본 불변.
- `tests/international-unified-roster-browser-v1.cjs`: PC 1440/900, 모바일 390/360, 표 22/19px, 8컬럼/내부 스크롤, 직접 `VB->`, AVC 별도 명단의 club+country+league, VNL 검색 링크 구분, 기존 팀/남녀/필터 회귀.
- Google Drive MASTER 원문을 별도로 다운로드해 대조하지 않았음: **NOT VERIFIED**. GitHub에 이미 등록된 검수 자료만 화면에 재사용.
- 기준 main: `a7769a705ef14d353bd136bb0666ee3ef7db1bb2`.
- 복구: 본 PR의 8개 UI/테스트/문서 파일만 revert. 운영 승인 전 **main 병합 금지**, 운영 HTTPS 검증은 배포 후 별도 완료 판정.
