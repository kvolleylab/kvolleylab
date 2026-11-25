# K-Volley Lab · Home/V-리그 오늘 경기 우선 및 KST 자정 전환 v1

**기준일:** 2026-11-26 (KST)
**상태:** USER-REPORTED DEFECT / FEATURE BRANCH IMPLEMENTED / CI PENDING / **NOT DEPLOYED**

## 사용자 요구 / 원인 분석
- 사용자는 "최근 결과보다 오늘경기가 먼저" 노출되고, 자정이 되면 자동으로 경기 날짜가 바뀌어야 한다는 기존 합의의 운영 준수를 지적했다.
- 2026-11-26 00:23 KST 기준 GitHub main `d843d4035c8412aa4a70b6abef4129d43da5544e` 직접 확인:
  - V-리그 남녀부 `assets/js/kvl-domestic-home-v2.js`는 `summaryGame(next) + summaryGame(recent)`로 **화면 순서 자체는 맞았음**.
  - 홈 `index.html`은 `[true,false]` 루프 때문에 **최근 결과가 첫 카드**였음. 서로 일관되지 않음.
  - 두 페이지는 최초 로딩 때 로컬 Date와 60초 주기에서 재선택하고, 5분마다 KOVO 출처의 저장 JSON을 조회함. **다음 한국시간 00:00을 직접 예약하지 않아 화면이 최대 1분 이상 늦게 전환될 수 있음**. 절전/백그라운드에서 timers가 지연되기도 함.
  - 경기가 아직 없으면 "오늘 경기"를 허위로 고정하면 안 됨. 첫 슬롯은 "오늘 경기" 또는 "다음 경기"를 KST와 공식 일정에 따라 자동 구분해야 함.

## 설계 및 변경
- 홈: `#home-matches`의 2개 카드 생성 순서를 `next, recent`로 전환. 화면에 `data-kst-day` 기록해 오늘 날짜를 검사 가능하게 함.
- 홈/남녀 V-리그: 다음 `Asia/Seoul` 00:00까지 남은 시간을 `(floor((Date.now() + 9h)/24h)+1)*24h - (Date.now()+9h)` 로 계산하고 여유 25ms를 둔 `setTimeout` 예약. 기존 60초 표시 재선택/5분 fetch는 그대로 유지하며, 자정에 **기존 다운로드된 이번 시즌 경기 기록으로 즉시 다시 선택한 후** 표시 중인 탭에서만 공식 저장 JSON을 재요청. 통신오류는 검증된 원래 경기·점수를 지우지 않는다.
- 비활성 탭/절전 및 브라우저 뒤로가기 복귀: `visibilitychange`, `pageshow`에서 날짜가 바뀌었는지 재검사하여 캐시된 공식 경기 기록부터 표시하고, 필요 시 비동기 재조회. 일반 페이지 최초 `pageshow`의 불필요한 중복 조회는 방지.
- V-리그 남녀부 카드 내부 순서 `today/next -> recent` 그대로 유지; `data-kst-day`로 UI 날짜 갱신 상태를 검증 가능하게 함.
- `competition-engine.html`의 `kvl-domestic-home-v2.js` 캐시 키만 `20261126-kst-midnight-v1`로 변경. 홈은 인라인 JS를 수정하므로 정적 HTML 자체 변경으로 배포. 경기·팀/선수 원본, 순위, 세트별 점수, 게시 자동화는 수정하지 않음.

## 테스트
- `tests/home-gender-matches.test.cjs`: 남녀 부문 오늘/다음 카드가 최근 결과보다 선행하는지; 공식 경기 스코어/링크/로고 유지; **11/25 23:59:59.900 KST → 11/26 00:00:00.025 KST**, 1개 예약 콜백을 즉시 실행해 제목 "다음 경기"→"오늘 경기", source id/완료경기/원본 무변경 검사. JSDOM `pretendToBeVisual`로 실제 보이는 탭을 모사.
- `tests/vleague-match-summary.test.cjs`: 2026-11-25/26 합성 남녀 공식 일정·완료 경기, 남녀 각 자정 예약 콜백의 **100~200ms 이내 예약**과 동일한 기간 전환 및 카드 `next,recent`, 최근 확정 점수 보존 검증. 기존 live/waiting/stale, cutoff 및 5세트 규칙 유지.
- 기존 품질감사 핵심 회귀·전체 소스 무결성 검증. **실제 재시작 없이 계속 열어둔 탭의 자정 전환은 시뮬레이션 검사이며, 자정 실측 장시간 운영 확인과 구별한다.**
- CI/PR/Pages 최종 결과는 실제 GitHub Actions 및 동일 운영 SHA 증거로 기록. 사용자 운영 반영 승인 전 PR 병합 금지.

## 안전/복구
- V-리그/홈 소개·세트스코어·KOVO 실경기/결과 JSON과 사용 중인 선수/구단·국가 데이터, Cloudflare worker/cron, Supabase 개인 추적/메모는 읽기 및 화면 재선택 이외 변경 없음.
- 최신 경기·선수 원본을 덮어쓰지 않으며 Live GET 실패 시 기존 데이터는 유지한다.
- 유사 결함 발견 시 본 PR만 revert; 독립 KOVO 원본/승인 선수·회원 데이터 롤백 불필요.
- Google Drive 원본 MASTER 재조회: **NOT VERIFIED** (표시/시간 트리거 변경으로 선수·경기 데이터 쓰기 없음).
