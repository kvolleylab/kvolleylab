# HOME Hero 배포 — 동일 대화 일반 채팅/WORK 연결 절차

작성: 2026-10-14. 최종 실검수: **2026-10-15 KST**. 상태: **홈 v01 원본 업로드 및 v02.1 프로토타입 배포·PC/모바일 검수 완료**. 운영 홈 `index.html`은 변경하지 않았다.

## 성공 경로와 현재 제약
- 검증된 성공 경로: [KVL_COMPETITION_HERO_PUBLISHING_RUNBOOK.md](KVL_COMPETITION_HERO_PUBLISHING_RUNBOOK.md) §5, WORK `tools.exec_command`로 이미지 바이트를 읽고 **같은 `functions.exec` 실행 안에서** GitHub `create_blob(base64)`로 넘기는 방법.
- 2026-10-14 일반 채팅의 제약 기록: GitHub `create_blob`은 있었지만 해당 `functions.exec`에는 **`tools.exec_command`가 없었다**. 일반 `container.exec`의 `github.com` DNS 접근도 실패했다. 그 실행에서 업로드는 미완료였으며, GitHub blob 인터페이스가 존재한다는 이유만으로 성공을 주장하지 않았다.
- 2026-10-15 WORK에서는 `tools.exec_command`로 원본 바이트를 12,288바이트씩 읽고 같은 `functions.exec` 메모리에서 base64를 조립한 뒤 GitHub 커넥터로 전달하여 성공했다. 본문을 채팅으로 출력하거나 다시 입력하지 않았다.
- 동일 대화에서 WORK 모드를 사용할 수 있을 때 그 모드로 전환하여 **대화의 첨부 ZIP과 전체 지시 맥락을 그대로 전달**한다. 별도 채팅에서 다시 설계/이미지 생성 금지. 전환/도구 접근은 사용자 UI 및 계정 가용성에 따름.

## 준비된 정확한 원본
이 대화의 `kvl-home-hero-ready-v01.zip`:
- `kvl-home-hero-pc-v01.webp`: **2108×406**, RGB, SHA-256 `af03b7f7ceadf7c1bac8c319e49591e58ff497e00dfac20ae86c871b4348f1db`.
- `kvl-home-hero-mobile-v01.webp`: **1258×406**, RGB, SHA-256 `e56f48c39db642c2ba08b86f0f5ebd11ab363d7eaa51a2aeab1d90dd1a27e913`.
- ZIP의 `kvl-home-hero-preview-v01.html`은 설명용 미리보기이며 배포 자산이 아님.

## 목표: 홈 v02.1 프로토타입만
1. 최신 `main`과 본 지침 및 공통 대회 Hero runbook을 먼저 확인한다.
2. 이미지 원본 두 개를 `assets/img/home-hero/`에 WebP로 업로드한다. 임의 재생성, 이미지 덮어쓰기/강제 크롭/재압축 금지.
3. `home-prototype-v021.html`의 `.home-hero`에 두 WebP를 PC/모바일 미디어 쿼리로 적용한다. 기존 *v02.1* HTML 콘텐츠·섹션·일체형 직각 Hero + 연결형 하단 바 디자인은 보존한다. `index.html` 변경 금지.
4. GitHub Pages 성공, 두 이미지 HTTP 200/Content-Type, PC 폭 1180/모바일 390·360 화면, 검색·분류·남녀부 전환을 검수한다. 배경이 일부 화면에서 잘리거나 과도하게 확대되면 실제 화면을 보고 구조적 대안을 판단하며 단순 확대/늘림으로 무마하지 않는다.
5. 실제 성공한 업로드 경로 및 검수 결과를 이 문서/운영지침에 반영하고 최종 커밋 SHA와 프로토타입 URL을 보고한다.

## 다음부터 한 문장으로
`최신 GitHub main과 Hero 운영지침을 확인해. 첨부된 완성형 이미지를 WORK의 검증된 바이너리 전송 방식으로 원본 그대로 업로드하고 지정된 대회/홈 프로토타입에 연결한 뒤 PC·모바일 실검수해. 실홈 수정 금지.`

**완료 판정:** 두 이미지가 GitHub에 존재하고, 프로토타입 참조와 Pages HTTP 응답/시각 검수가 일치할 때만 완료. 현재 상태는 `DEPLOYED / VERIFIED`.

## 2026-10-15 실제 배포 결과

- 기준 main: `96463681c021b3b2729dfafd785e1de0491d6ce3`.
- 이미지·연결 배포 SHA: `635688c6e6f67faf5e95c24b14d0578f6e9fde22`.
- [해당 SHA의 Pages 실행 38604024429](https://github.com/kvolleylab/kvolleylab/actions/runs/38604024429): `completed / success`.
- [실제 홈 v02.1 프로토타입](https://kvolleylab.com/home-prototype-v021.html).
- [PC 1180px 검수 화면](https://kvolleylab.com/tests/home-hero-preview.html?width=1180), [모바일 390px](https://kvolleylab.com/tests/home-hero-preview.html?width=390), [모바일 360px](https://kvolleylab.com/tests/home-hero-preview.html?width=360).

### 업로드와 연결

1. 최신 main을 독립 checkout으로 읽고 GitHub/Drive Hero 운영지침 및 과거 성공 커밋 `0b074df5d76940d791ef05c8e2be365a20934822`의 파일 변경을 확인했다.
2. 첨부 ZIP의 PC/모바일 두 WebP를 `assets/img/home-hero/`에 원본 바이트 그대로 복사했다. 규격·RGB 모드·SHA-256은 위 원본 기록과 일치한다. ZIP의 설명용 HTML은 배포하지 않았다.
3. 기존 runbook §5와 동일하게 `create_blob(encoding: base64)`의 Git blob SHA를 로컬 계산값과 비교했다. PC blob은 `6d4ccc6cf5db4cd9e72b5c8787905488f275c85a`, 모바일은 `b599a7bd159f13c3f0a054f9fce38fe3e049dbbf`다.
4. 기존 tree 기반 `create_tree` → `create_commit` → `update_ref(force:false, expected_sha:기준 main)`으로 두 이미지·홈 연결·반응형 검수 페이지를 함께 반영했다. 대회 전용 helper 파일의 경로 제한을 변경하지 않고, 홈 작업의 명시적인 파일 목록에 같은 바이트 전달 절차를 적용했다.
5. `.home-hero`의 배경에 PC WebP를 직접 연결하고 `max-width:680px`에서 모바일 WebP로 전환한다. 이미지 URL 캐시는 `?v=20261015-home-hero-v01`이다. 기존 그라데이션·원형 장식 배경만 완성형 이미지로 교체했으며, 추가 오버레이는 없다.

`background-size:contain`, `right center`, `no-repeat`로 원본 비율과 전체 구도를 보존한다. 기존 카드 높이와 이미지 비율 차이에 따른 위아래 `#07182d` 배경 여백을 허용하며, cover·강제 크롭·늘림으로 숨기지 않는다.

### 검수 결과와 보존 범위

| 화면 폭 | 실제 Hero 크기 (CSS px) | 선택 이미지 | 잘림 / 가로 넘침 |
| --- | --- | --- | --- |
| 1180 | 915 × 204.875 | PC 2108×406 | 없음 / 없음 |
| 390 | 355 × 188 | 모바일 1258×406 | 없음 / 없음 |
| 360 | 325 × 188 | 모바일 1258×406 | 없음 / 없음 |
| 680 | 641 × 200 | 모바일 1258×406 | 없음 / 없음 |
| 681 | 642 × 200 | PC 2108×406 | 없음 / 없음 |

- PC 1180px의 Hero 폭은 기존 사이드바·페이지 여백·스크롤바를 제외한 실제 값이다. 검수 페이지는 배포된 홈 URL을 같은 origin iframe으로 표시하며 홈 DOM 재구성이나 CSS 주입을 하지 않는다.
- PC 1180px·모바일 390px/360px 화면에서 원본 이미지, 제목·설명·검색창 가독성, 직각 상단과 연결된 하단 메뉴를 직접 확인했다. 680/681px에서는 계산 스타일과 이미지 전환을 확인했다.
- 홈 HTML의 `<style>` 밖 콘텐츠와 JavaScript는 변경 전후 바이트가 동일하다. 같은 1363px 브라우저에서 Hero는 변경 전후 모두 1098×210.59375, 하단 메뉴는 1098×65였다.
- 하단 4개 링크, 기존 섹션과 대회 카드, 전역 메뉴를 유지했다. `index.html` blob은 변경 전후 `478e280566482f6c02e0c20410bccea7f98f7dbd`로 동일하다. 공통 CSS/JS 및 다른 대회 production 파일은 수정하지 않았다.
- 검색 결과 표시, 검색 버튼의 실제 KOVO컵 남자부 페이지 이동, PC·모바일 분류와 남녀부 전환을 확인했다.
- 두 WebP는 실제 HTTPS에서 `200 / image/webp`이고 원본 SHA-256과 일치한다. 프로토타입 HTML 및 검수 페이지도 `200`과 배포 바이트 일치를 확인했다.

기계 판독 기록: [validation/home-hero-v01.json](validation/home-hero-v01.json).
실화면 캡처: [PC 1180](validation/home-hero-v01-pc-1180.jpg), [모바일 390](validation/home-hero-v01-mobile-390.jpg), [모바일 360](validation/home-hero-v01-mobile-360.jpg).
위 화면 검수는 클라우드 브라우저 반응형 검수이며 물리적 휴대전화 기기 인증을 뜻하지 않는다. 문서·검수 기록을 포함하는 최종 SHA는 자기참조를 피하기 위해 완료 보고와 Git 이력에서 확인한다.


## 2026-10-15 홈 v02.1 참고 디자인 정밀 조정

이번 작업은 사용자 첨부 `K-Volley Lab 배구 데이터 플랫폼.png`를 기준으로 **기존 `home-prototype-v021.html`의 오버레이 UI와 하단 카드만** 조정했다. 운영 홈 전환은 승인되지 않았으며 `index.html`은 변경하지 않았다.

- 시작 main: `27f40c337e67617820fb5983ad08230bd5d2c674`. 기존 Hero 업로드·검수 커밋 `4ee7f68f68ab3649235153ca158dcd3487b20c3f`와 본 문서·Shell Template·Competition Hero Runbook·공통 내비게이션을 검토했다.
- UI 최종 커밋: `8b0c7a8b0a2931699cfa22b36993d282c4ae8a66`. [Pages 실행 38656439376](https://github.com/kvolleylab/kvolleylab/actions/runs/38656439376)은 `completed / success`다.
- 작업 중 추가된 KOVO 공시 수집기 변경은 보존했다. 최종 검수 기록은 반영 시점의 최신 main에 추가한다.

### 반영한 디자인

- Pretendard, 흰색·라이트그레이 카드, 네이비 라인 아이콘과 시안 제목. PC 타이틀 44px, 모바일 390px 30px / 360px 28px.
- 긴 흰색 라운드 검색창, 해시태그, Hero에 빈틈 없이 연결되는 4개 바로가기 바. Hero 위쪽 직각과 하단만 라운드를 유지했다.
- 대회 기본 화면은 V-리그·국내대회·국가대표팀·국제대회 2×2. 기존 프로/국제/국내 및 남녀부 필터는 실제 대회 상세 경로를 유지한다.
- 선수·팀·국가대표 카드 3개와 분석 도구 2×2를 정렬했다. 기존 일러스트의 선수 장면이 보이도록 카드 안의 이미지 위치만 조정했다. 특정 실존 선수 사진으로 표시하지 않는다.
- 모바일 상단은 기존 공통 메뉴 버튼과 공식 브랜드 자산을 사용한다. 새로운 사이드바나 하단 모바일 내비게이션은 만들지 않았다.

### 경기 데이터와 검색 범위

`data/competitions/{university-league-men-2026,kovo-cup-men-2026,v-league-men-2026-27}/data.json`을 읽어 날짜에 따라 확정된 다음 경기와 검증 표시가 있는 최근 결과를 선택한다. 검수 시 U-리그 결승 `KVL-M-2026-U085`와 KOVO컵 `KOVOCUP26-13`이 표시되었다. 원천 자료 링크·조회 시각·실시간 중계가 아니라는 안내를 표시한다. 데이터 조회 실패 및 결과 미확인은 별도 상태로 처리하며 예시 점수나 임의 대진을 넣지 않았다.

홈 검색은 대회·사이트 메뉴 검색이다. 선수 DB 전체 검색, 실시간 점수, 로그인·회원가입 기능은 구현하거나 작동하는 것처럼 표시하지 않았다.

### 최종 실브라우저 검수

| 뷰포트 | 콘텐츠 폭 | Hero 크기 | 바로가기 바 높이 | 가로 넘침 / 이미지 오류 / 메뉴 중복 |
| --- | --- | --- | --- | --- |
| PC 1440px | 최대 1180px | 1180 × 318.4375px | 91px | 없음 / 없음 / 없음 |
| 모바일 390px | 390px | 390 × 264px | 79px | 없음 / 없음 / 없음 |
| 모바일 360px | 360px | 360 × 264px | 79px | 없음 / 없음 / 없음 |

배포된 실제 페이지를 기존 `tests/home-hero-preview.html`의 동일 origin iframe에서 열어 확인했다. 페이지에 CSS를 주입하거나 화면을 재구성하지 않았다. 검수 도구에 1440px 및 전체 높이 캡처 모드를 추가했다. PC·모바일 전체 카드 배치와 제목·검색창·아이콘·이미지 위치를 실제 캡처로 확인했고, 모바일 설명의 어색한 줄바꿈을 한 차례 더 수정했다. 물리적 휴대전화 기기 검수는 아니다.

검색 Enter 제출의 KOVO컵 이동, 검색 버튼의 국가대표팀 이동, 미일치 안내·Escape 닫기, 프로/국제/국내 여자부 필터, 모바일 메뉴 열기·닫기를 확인했다. JavaScript 구문과 로컬 링크 대상도 확인했다.

- [PC 1440px 전체 화면](validation/home-ui-v021-pc-1440.jpg)
- [모바일 390px 상단 뷰포트](validation/home-ui-v021-mobile-390.jpg)
- [모바일 360px 전체 화면](validation/home-ui-v021-mobile-360.jpg)
- [기계 판독 검수 기록](validation/home-ui-v021.json)

### 유지한 범위와 남은 시각 차이

PC·모바일 Hero WebP는 이전 기록과 SHA-256이 동일하며 `contain`으로 원본 전체를 유지한다. 이미지 비율과 Hero 카드 높이의 차이에서 생기는 네이비 여백도 유지하므로 참고 이미지의 배경 구도와 완전히 같지는 않다. 참고 이미지의 실사 선수·국가대표 유니폼은 식별·사용 근거가 확인되지 않아 기존 일러스트·구단 엠블럼·국가대표 추상 이미지를 사용했다. 공통 사이드바의 기존 폭·메뉴 구조를 보존했다.

`index.html`, 공통 메뉴 CSS/JS, Competition Engine, AVC·VNL·아시안게임 등 완성된 대회 페이지 및 기존 Hero 이미지 파일은 이 홈 UI 작업에서 수정하지 않았다. 새로운 홈 HTML이나 CSS 파일도 만들지 않았다. UI 변경 파일은 기존 홈 프로토타입과 기존 검수 HTML 두 개이며, 나머지는 본 인수인계 문서와 검수 증거다.
