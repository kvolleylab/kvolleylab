# 드래프트 실시간 기록 반영 · 2026-10-29

상태: IMPLEMENTED / VERIFIED / READY FOR REVIEW. 기존 비공개 검토 Site를 갱신했다. kvolleylab.com 운영 main merge·배포는 하지 않았다.

## 기준·출처

- main 기준: `d908c199eccefa698f6c7e610d7e12f14d723989`; 기능 브랜치 `feature/pro-vleague-draft`, [PR #199](https://github.com/kvolleylab/kvolleylab/pull/199).
- 사용자 제공 `2026-27_남자신인드래프트_실시간기록_v1(2).xlsx`를 읽기 전용으로 대조했다. 원본 SHA256: `f70d5fd59e34d9bc51446aaaacc404da6122e52b3a28a15d232aa802a338c9ca`. 원본 파일은 수정하지 않았다.
- 정규화 기록: `data/drafts/2026-27/imports/20261028-men-observed.json`. 셀 주소·원문·해시·정정 근거를 보존하며, 사용자 제공 관찰 기록과 공식 사전 안내를 구분한다. 인증된 Library/Drive 주소는 공개 코드에 넣지 않는다.
- 기존 공식 신청자 명단과 프로필 연결 자료를 재사용했다. 18명 모두 이름+소속으로 단일 신청자 확인, 검증된 기존 프로필 17개 연결. 이율리는 신규 Player ID를 만들지 않고 이름만 표시한다.
- [KOVO 사전 안내](https://kovo.co.kr/news/kovo/press/157978), 발표 2026-10-22: 개최 정보·최초 확률·배분 원문 유지.
- [연합뉴스 현장 보도](https://www.yna.co.kr/view/AKR20261028131351007), 2026-10-28: 1R 7명 및 총18명 대조.
- [뉴스1 현장 사진 설명](https://www.news1.kr/photos/8184298), 2026-10-28: 대한항공 2R 1순위 송정민의 소속은 수성고. 신청자 명단과 함께 대조해 원본의 순천제일고를 화면·정규화 결과에서 수성고로 정정했다. 원문과 정정 사유는 출처 상세에 남긴다.
- 최신 KOVO 보도자료 목록에서 공식 최종 결과표는 찾지 못했다. 공식 시행세칙·구슬 배정 원본·지명권 거래 공시와 최종 결과표는 계속 확인 필요하다.

## 반영 결과

- 구슬 10회: OK저축은행 → 현대캐피탈 → 우리카드 → KB손해보험 → 한국전력 → 한국전력(중복) → KB손해보험(중복) → 한국전력(중복) → 삼성화재 → 대한항공. 첫 출현 7팀만 순위를 부여한다.
- 7팀 색상 이름을 반영했다. 원형 색은 화면용 대표색이며 실물의 측정 색상으로 주장하지 않는다.
- 최초 구슬 수/확률 35·30·20·8·4·2·1은 그대로다. 원본의 상위3팀 제외 후 재계산 메모는 추첨 기록에 보존하되 최초 확률을 변경하지 않는다.
- 일반 지명13명·명시적 패스15개·수련선수5명, 진행 상태 완료. KB손해보험/한국전력의 수련선수 각2명을 보존한다. 빈 셀을 패스로 변환하지 않는다.
- 입력은 열 번호가 아닌 28개 고유 원지명권에 연결했다. 모든 현재 보유팀과 지명 당시 팀을 분리해 보존한다.
- 파일에 거래 근거가 없으므로 거래를 만들지 않았다. `trade_review=pending`을 유지하며 ‘확인된 거래 없음’으로 바꾸지 않는다.

## 실제 저장·검증

- 기존 runtime revision1/audit1에 감사 명령55건을 추가했다. 현재 revision56/audit56. 반영 시각은 수입 작업 시각이며 실제 현장 지명 시각으로 해석하지 않는다.
- `data/draft-board` 저장 커밋: `0e5a3130de872889c663343092e0ab5f3aa099a4`. men.json과 출처·정규화 기록을 하나의 커밋으로 저장했다.
- GitHub 재조회 men.json blob `89608c356ec71b35718f9205ec865a6e71bb6e01`과 로컬 `git hash-object`가 일치한다. 브라우저 첫 조회 및 새로고침 버튼 재조회에서 ‘저장소 확인 완료 · 버전56’을 확인했다.
- 연결 지연 시 최신 배포 자료와 경고가 유지되는 fallback도 확인했다. 이는 연결 실패 시 실시간 업데이트까지 보장한다는 의미가 아니다.
- 관련 자동 검사 **45 passed / 0 failed**: 권리 양도·맞교환·재양도·취소, 28권리 보존, 과거 지명팀 보존, 중복 추첨, 저장 충돌/권한, 관리자 입력, 원본 반영9개 검사 포함. `node --check assets/js/draft-board-render.mjs`, `git diff --check` 통과.
- 기존 빈 상태 검사는 별도 fixture로 옮겨 실제 결과 데이터와 가상 검증 데이터를 분리했다. 동일 출처 중복 수입, 이미 입력된 현황 덮어쓰기, 신원 모호성, 보유팀 불일치, 최초 배분 변경을 거부한다.
- PC: 문서 clientWidth/scrollWidth 1348px 일치, 7팀 열 표시, 프로필 링크17개, 로고 로딩 오류0개.
- 모바일 iframe 360px/390px: 문서345/375px에서 페이지 가로 넘침 없음. 결과표 내부1060px 가로 스크롤, 40px 이동 후 라운드 left15px/width66px/sticky 유지. 물리 기기 검수는 하지 않았다.
- [PC 결과표](draft-board-20261029/results.jpg) · [360px 결과표](draft-board-20261029/mobile-results.jpg).

```sh
node --test tests/draft-board.test.mjs tests/draft-board-store.test.mjs tests/draft-board-ui.test.mjs tests/draft-board-observed.test.mjs
```

JSDOM 경로는 필요 시 `KVL_JSDOM_PATH`로 지정한다. 이전 구현 검수의 관련 회귀54개와 기존 CI 실패4건은 [2026-10-28 기록](draft-board-20261028.md) 및 PR Checks를 참조한다. 전체 CI 성공으로 보고하지 않는다. 실제 사용자 토큰을 입력한 브라우저 인증→저장 전체 과정은 이전과 같이 NOT VERIFIED다.

## 미리보기·복구

- [비공개 검토 화면](https://kvl-rookie-draft-review.daewook1029.chatgpt.site/), 소유자 로그인 필요. Site source `3ef466ec3fc9792fca2481d95bf5d39ed621e552`, deployment `appgdep_6ae28ceac144819185f164800dd75535` 성공. 본문 UI는 동일 코드의 로컬 미리보기에서 확인했다.
- 입력 이전 runtime commit `fb5d633ea063b9848da627de416e518cc4ed2e31`은 복구 기준으로 보존한다. 이후 변경이 있으면 과거 파일을 통째로 덮어쓰지 말고 관리자 정정 명령과 사유를 사용한다. 기록이 없는 상태에만 일괄 importer를 적용하며 동일 출처를 재수입하지 않는다.
- 운영 merge·배포는 프로젝트 AGENTS.md의 별도 사용자 승인 규칙을 따른다. 원본 근거가 없는 거래를 추정 입력하지 않는다.
