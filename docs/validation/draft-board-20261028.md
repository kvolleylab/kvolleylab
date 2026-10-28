# 신인선수 드래프트 검수 · 2026-10-28

상태: IMPLEMENTED / VERIFIED / READY FOR REVIEW. kvolleylab.com 운영 merge·배포는 수행하지 않았다.

## 기준과 결과

- 최초 기준 main: `8c2cb7446c1de6a0f6f3d9d9e004e2b444f6fe71` (#198 포스트시즌 수정 포함).
- 검수 중 최신 main: `d908c199eccefa698f6c7e610d7e12f14d723989`. 추가된 KOVO 공시 5파일은 기능 변경과 겹치지 않는다.
- 기능 브랜치: `feature/pro-vleague-draft`. 최초 원격 구현: `72d854dfd0b32a1a290f47230a2b85ef5e17bb81`. 최종 커밋/PR은 연결 PR 기록을 기준으로 한다.
- 입력 브랜치: `data/draft-board`. 실제 저장 검증 커밋: `fb5d633ea063b9848da627de416e518cc4ed2e31`.
- 비공개 검토 사이트: https://kvl-rookie-draft-review.daewook1029.chatgpt.site/ (소유자 ChatGPT 로그인 필요).
- 비공개 사이트의 배포 성공과 로그인 접근 제한을 확인했다. 본문 UI 검수는 동일 코드의 로컬 미리보기에서 진행했다. 비공개 링크의 로그인 이후 화면을 검증했다고 주장하지 않는다.

## 공식 자료 대조

- 제공된 엑셀의 추첨기록/지명결과 시트: 7팀 배분, 1·3R 정순/2·4R 역순, 수련선수 영역.
- KOVO 157978 공개 API 본문: 배분 설명 원문, 발표일 2026-10-22, 개최 일시·장소, 최초 확률 확인.
- 기존 남자부 신청자 59명 및 프로필 연결 JSON 재사용. 연결 테스트의 윤경은 기존 검증된 KVL-P-000008이다. 신규 Player ID를 만들지 않았다.
- 기존 Drive 드래프트 자료 보관 폴더의 공식 남자 명단 PDF도 대조했다. 별도 드래프트 결과 MASTER는 확인하지 못했다. 원본 XLSX/PDF나 인증된 Drive/Library 주소는 공개 코드에 넣지 않았다.
- 미확인 구슬 색상, 현장 추첨/선수 결과, 거래는 비워 두었다. 실제 지명 데이터와 가상 테스트 데이터를 혼합하지 않았다.

## 자동 검사

**총 90 passed / 0 failed**: 신규 36, 기존 관련 회귀 54. 새 완료 상태 검사는 수련선수 대기까지 거부한다.

```sh
node --test tests/draft-board.test.mjs tests/draft-board-store.test.mjs tests/draft-board-ui.test.mjs
node --test tests/draft-applicants.test.mjs tests/draft-lottery.test.mjs tests/draft-profile-routing.test.mjs tests/vleague-postseason.test.cjs tests/vleague-match-summary.test.cjs tests/kovo-cup-rosters.test.cjs tests/vleague-rosters.test.cjs
git diff --check
```

UI 테스트는 JSDOM이 필요하다. 설치되어 있지 않은 환경에서는 설치된 모듈 위치를 `KVL_JSDOM_PATH`로 지정할 수 있다. 테스트의 API와 선수·거래는 격리된 fixture이며 실제 저장소에 전송하지 않는다.

| 검사 | 확인 결과 |
|---|---|
| 메뉴/진입 | 프로 V-리그 → V-리그 홈, KOVO컵, 드래프트 순서. 기존 신청자 메뉴 유지 |
| 공식 배분 | 35/30/20/8/4/2/1, 100개·100%, 원문·발표일·출처 표시. 거래 후 불변 |
| 추첨 | 중복 로그 유지·새 순위 미부여, 미확정 표시, 순서/팀/삭제 정정 |
| 결과 입력 | 1R~4R, 명시적 패스, 직접 입력, 실제 신청자 검색·기존 프로필 연결 |
| 수련선수 | 복수 입력/수정/삭제, 팀별 패스, 제한·순서 설정 |
| A 2R → B | 추첨 전 양도 등록, A 원지명권 위치 유지, B 자체2R 유지, A 1/3/4R 불변 |
| 맞교환·재양도 | 다중 leg 원자성, 단일 보유팀, 전체28권리 유지 |
| 취소 | 마지막 거래 복원, 종속 거래 단독 취소 거부, 명시적 연쇄 취소/이력 |
| 과거 결과 | 거래 취소/소속 변경/추첨 정정에도 선수와 지명 당시 팀 보존 |
| 저장·충돌 | 재조회 복원, 읽기 전용/만료 권한 거부, SHA 충돌, 응답 유실 후 중복 저장 방지 |
| 보안 경계 | 기존 로컬 관리자 플래그로 쓰기 불가, 토큰 미직렬화, HTML 이스케이프 |
| 시즌 | 새 시즌 고유 ID·자료 독립, 미등록 시즌에 이전 자료 표시하지 않음 |

## 실제 저장과 화면

인증된 GitHub Contents API로 공식 안내일을 진행 설명에 명시한 변경 1건을 저장했다. revision1/audit1, content SHA `0ee8ab35339bfe4cf2ae8c4e86282ac406e93ff6`. 읽기 반환값과 브라우저 새로고침의 **저장소 확인 완료 · 버전 1** 및 날짜 설명을 대조했다. 저장 전후 가상 추첨·거래·선수는 0건이다.

초기 실제 브라우저에서 native fetch의 this 바인딩 때문에 원격 읽기가 실패한 문제를 발견했다. fetch를 globalThis에 바인딩하도록 수정했고 회귀 검사와 실제 새로고침으로 확인했다.

- PC: 1363px 브라우저, 문서 client/scroll 폭 1348px 일치. 7팀 결과표 한 화면 배치, 로고14개 정상 로딩.
- 모바일 폭 390px/360px iframe: 문서 폭375/345px와 scrollWidth 일치. 결과표만 가로 스크롤되고 라운드 열은 sticky/66px 유지. 실제 키보드 가로 이동 120px 후 라운드 left15px 유지. 모바일 앵커 상단 여백80px로 고정 메뉴와 섹션 제목 겹침을 방지했다.
- 접근성: 표 행/열 제목, 가로 스크롤 region tabindex, 상태 문구·배지, 모달 필드 레이블, 색상 원형과 이름 병기.
- 브라우저 캡처: [PC](draft-board-20261028/desktop.jpg) · [결과표](draft-board-20261028/results.jpg) · [360px 상단](draft-board-20261028/mobile-360.jpg) · [360px 결과표](draft-board-20261028/mobile-results.jpg). 가상 선수 없이 실제 초기 데이터 상태다.

## 검증 범위와 다음 단계

실제 사용자 토큰을 브라우저에 입력하는 인증·저장 전 과정은 **NOT VERIFIED**다. 관리자 UI는 실제 페이지 모듈+격리 API에서 검증했고, 영구 저장은 인증된 실제 API 저장+브라우저 공개 재조회로 나눠 확인했다. 물리적 모바일 기기 검사는 수행하지 않았다. GitHub API 제한/연결 실패 시 사전 자료로 내려가는 경고를 제공하며 자동 실시간 스트리밍 기능은 아니다.

공식 구슬 색상·추첨 로그·시행세칙·거래 공시/조건·결과가 확보되면 관리자 입력으로 보완한다. 다음 시즌은 별도 파일과 출처로 등록한다. 운영자는 자신의 저장소 관리자 권한으로 마지막 인증/저장 검사를 수행한 뒤 merge·운영 배포를 승인한다. 배포 승인 전 현재 운영사이트를 변경하지 않는다.

복구·데이터 운영 방법: [운영 명세](../DRAFT_BOARD_v1.md). 코드 PR과 입력 브랜치를 별도로 관리하며 코드 병합 시 입력 브랜치를 초기화하지 않는다.
