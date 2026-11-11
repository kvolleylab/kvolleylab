# KVL 기존 대회 편집기 · 고성대회 실제 Engine 검증 v2

작성일: 2026-11-11 KST  
상태: **격리 실행 코드 준비 / 자동 브라우저 QA 실행 결과는 별도 확인 / NOT DEPLOYED**  
실제 대회: 2026 대한항공배 전국대학배구 고성대회 남자부  
시작 시 확인한 GitHub main: `99d4fc29ffe50b37c09e95ed6c05eb97efce847f`  
이전 격리 비교: PR #316. 기존 편집기: PR #287. 관리자 드래프트: PR #288.

## 목표

종료된 대회 데이터를 새로 만들거나 Excel/CSV로 다시 입력하지 않습니다. **기존 데이터 전체를 읽기 전용으로 불러온 상태**에서 로고, 팀명, 승패 열 간격만 바꾸고 **실제 Competition Engine V2의 DOM/CSS**에서 원본과 조정 후 화면을 비교합니다.

기존 원본 정보 확인:

- `status: completed`, 남자부, 2026
- 15팀, 35경기, A/B/C조 각 5팀
- 최종순위 인하대 우승, 한양대 준우승, 중부대·조선대 공동 3위
- 모든 기존 match ID/team code/score/standings/official sources/HERO/roster links 보존
- 사용자 요청은 **디자인 편집**이며 공개 데이터 재계산/정정이 아닙니다.

## 실제 Engine을 사용하는 격리 테스트

`scripts/build-goseong-local-engine-preview-v2.py`는 현재 체크아웃된 저장소에서 실제 Engine HTML·JS·CSS·선수 로고 runtime·공식 완료 대회 config/data 및 대학 로고를 **복사**하여 저장소 외부 새 디렉터리에 별도 생성합니다.

- 렌더러와 데이터 파일을 수정하지 않고 원본 SHA256을 기록합니다.
- localhost용 엔진 HTML의 검증용 플래그 `production:true`만 `production:false`로 바꿉니다. 데이터/렌더링 로직은 그대로입니다.
- 실제 KVL 원본 화면과 같은 코드/데이터가 독립 HTTP 서버에서 돌아갑니다.
- 관리자 Supabase 세션, private scout notes, 토큰/비밀번호, 원본 Google Drive MASTER는 복사하지 않습니다.
- `index.html`에서 기존 `prototypes/kvl-goseong-engine-compare-v1.html`을 엽니다.

로컬 실행 예시(격리 빌드/검증 환경에서만):

```bash
python scripts/build-goseong-local-engine-preview-v2.py /tmp/kvl-goseong-preview-v2
python scripts/qa-goseong-local-engine-v2.py /tmp/kvl-goseong-preview-v2 --output /tmp/kvl-goseong-qa-v2
python -m http.server 8765 --bind 127.0.0.1 --directory /tmp/kvl-goseong-preview-v2
```

로컬 검수 주소: `http://127.0.0.1:8765/` — **이는 사용자의 PC/검수 환경에서 직접 실행할 때만 열리는 주소**입니다. ChatGPT/공식 KVL 공개 URL이 아닙니다. UI 테스트에 Playwright/Chromium/Pillow가 필요합니다.

## UI 연결

- 관리자 v3의 `고성대회 실제 화면 비교` 버튼은 현재 편집기에서 선택한 **화이트리스트 디자인 수정값만** same-origin 새 창으로 전달합니다.
- 사용자 본인의 관리자 계정이 인증된 경우에만 v3 관리자 화면에 접근하도록 기존 인증/서버 검증 코드를 유지합니다(아직 해당 백엔드 배포 안 됨).
- 미리보기는 원본 Engine의 2개 iframe에서 작동합니다. 우측 프레임에만 `style#kvl-goseong-compare-v1`을 주입합니다.
- iframe이 `body[data-kvl-render-state=ready]`가 될 때까지 기다린 뒤 비교합니다. 로딩 실패 시 성공으로 표시하지 않습니다.
- 현재 구현은 **읽기 전용·미게시**입니다. 비교 화면 수정값을 운영 데이터에 쓰거나 실서버에 자동 게시하는 기능은 없습니다.

## 1차 비교 설정 (시안)

- 팀명: 두 줄 공간 확보, 13px PC / 11.2px 모바일
- 참가팀/학교 로고: 46px PC / 36px 모바일, 위로 2px, 아래 간격 9px
- 조별순위 승 머리글+값 오른쪽 3px, 패 머리글+값 왼쪽 3px
- 순위행 상하 10px 여백
- HERO 이미지/성별 색상/공식 경기 수치 및 출처는 변경하지 않습니다.

## 자동 브라우저 검증

`scripts/qa-goseong-local-engine-v2.py`는 실제 복사한 Engine 웹 앱을 127.0.0.1 HTTP 서버로 실행한 뒤 Chromium으로 1180/390/360px × 참가팀·조별순위·경기일정·한눈에 4개 화면의 **원본/조정 후** 24회 렌더링을 비교합니다.

측정:

1. 원본과 수정 시안의 15팀/35경기/3조, Team ID, Match ID, 세트 스코어와 최종순위 불변성
2. 참가팀 로고 46/36px, 팀명 13/11.2px
3. 조별순위 `승 +3px / 패 -3px` 머리글/값 동시 이동
4. 변경으로 새롭게 발생하는 페이지 가로 오버플로
5. 각 경우 full-page PNG와 side-by-side JPG 및 computed style JSON
6. JS 오류와 일부 기존 오버플로는 JSON에 별도 기록

GitHub Actions 검증 작업: `.github/workflows/kvl-goseong-layout-compare-v2.yml`. Workflow는 **branch/PR 검수용**으로 `contents:read`만 사용하며 Pages·Supabase·Cloudflare 배포 작업이 없습니다. 결과는 `kvl-goseong-layout-qa-<run id>` artifact로 14일 보관합니다.

**GitHub Actions 완료 로그와 산출물 확인 전에는 '브라우저 검수 완료'로 표현하면 안 됩니다.** 기존 제한된 실행 환경에서 kvolleylab.com URL로 직접 브라우저 이동하면 `ERR_BLOCKED_BY_ADMINISTRATOR` 오류가 발생합니다. 이는 원본 운영 사이트 오류라는 뜻이 아닙니다.

## 안전/승인 게이트

- 지금은 새 기능의 격리 feature PR만 작업. **main, 실제 Supabase DB, 경기 데이터, MASTER, V-리그 15분 자동화 미변경**
- 대상 대회 1개 외에 일괄 CSS 적용 금지. 국내/국제 공통 템플릿 변경은 별도 교차 검수 후 확장
- 정상적인 참가팀 클릭/명단 연결, 조별순위/결선, 경기일정/달력·날짜 팝업, 남녀 전환, 모바일 가로스크롤과 인쇄 동작은 별도 UI QA 필요
- 승인 전 서버 인증 기능 배포, 데이터 저장 활성화, GitHub Pages 병합/배포 금지
- 롤백: 이 Draft PR을 병합하지 않으면 운영 영향 없음. 저장소 밖 생성 preview 폴더는 삭제하면 됨

## 다음 작업

1. GitHub PR의 Actions 실행 완료 여부와 브라우저 스크린샷 및 수치를 확인하고 실패 시 수정
2. 실제 렌더링과 기존 운영 기준 간 차이, 특히 긴 팀명/모바일 360px을 검토
3. 관리자 v3 draft-only 저장과 실 Engine 비교를 같은 환경에서 실제 로그인 테스트
4. 사용자의 시안 확정/게시 승인 이후에만 서비스 반영을 별도 PR로 수행

## 2026-11-11 실제 브라우저 실행 기록

- 검증 성공: [GitHub Actions run #43035358864](https://github.com/kvolleylab/kvolleylab/actions/runs/43035358864) (`success`, 실제 local Engine V2)
- 원본/변경 후 12개 조합 × 2회 = **24회 렌더링**. `browser-qa.json`: `status: PASS`, `caseCount: 12`, `pageErrors: []`
- 1180px 참가팀 로고 **48 → 46px**, 글씨 **14 → 13px**
- 390px/360px 참가팀 로고 **38 → 36px**, 글씨 **12 → 11.2px**
- 세 가지 화면 폭의 조별순위 승 `transform: matrix(1,0,0,1,3,0)`, 패 `matrix(1,0,0,1,-3,0)`; 머리글도 같은 기준으로 검사 통과
- 실제 DOM 참가학교 15개 / 조별순위 15행 / 경기 35개 유지. 모든 대회 ID/팀 ID/경기 ID/최종순위 원본과 동일
- 12개 case에서 변경으로 인한 신규 페이지 가로 overflow 없음
- 아티팩트: `kvl-goseong-layout-qa-43035358864` (원본/변경 전체 스크린샷과 계산 스타일 JSON)
- 주의: GitHub 최초 CI의 한글 fallback 글꼴 부족으로 일부 모바일 제목이 □로 나타남. 이는 CI 스크린샷 글꼴 문제이며 운영 실제 사이트 문제로 단정하지 않는다. 한글 글꼴 설치를 보완한 후속 run은 별도 검증 상태로 취급해야 한다.
- 이번 'actual Engine'은 **GitHub 체크아웃의 원본 렌더링 파일과 대회 데이터로 localhost에서 구동**한 것이다. `kvolleylab.com` 도메인을 직접 캡처하거나 관리자 Supabase DB에서 실제 게시한 것은 아니다.

