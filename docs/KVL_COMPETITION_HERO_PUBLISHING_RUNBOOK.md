# KVL Competition Hero 배포 운영지침

최종 실검증: 2026-10-14 KST / 2026-10-13 UTC. KOVO컵 v02 원본 WebP 4장, 실제 HTTPS 응답, PC·모바일 화면 검수를 완료했다. 이전의 “바이너리 전달 불가” 진단을 정정하고 실제 성공한 경로를 표준으로 확정한다.

## 1. 먼저 확인할 과거 성공 기록

최신 `main`과 Drive `KVL_COMPETITION_HERO_IMAGE_GUIDE_v1`을 읽고 다음 커밋의 파일 변경을 먼저 비교한다. 새 이미지 구조나 대회별 CSS를 먼저 만들지 않는다.

| 기록 | 커밋 | 확인된 방식 |
| --- | --- | --- |
| V-리그 v08 자산 | `ee992463b42b4819987d27958159d79dabfc6d0a` | 실제 WebP 4장을 `assets/img/competition-hero/`에 저장 |
| V-리그 남자부 연결 | `1ed4c89e5931702c7be29ee37b6b8a440fd74d1d` | `hero.pcImage`, `hero.mobileImage`, `mimeType: image/webp` |
| V-리그 여자부 연결 | `80341a2de6911893e9acf2c9150763840651345e` | 같은 공통 config 계약, 별도 성별·화면별 경로 |
| v08 CSS 캐시 | `afd9c1a03d064780067e4cec569359f3c8dbc3fe` | prototype CSS query를 `20261009-pro-hero-v08-2`로 변경 |
| 아시안게임 여자부 | `40ccd0facb3bef91672332fd7d0ec95c17423fe9` | `assets/images/competition-hero/`의 `.b64` 조각과 fixture의 `pcB64Chunks`/`mobileB64Chunks` |
| 아시안게임 남자부 | `b275587f9cf769c63b9d787b6db503e11a02b22d`, 자산 `72fff702752ad62f6a6c6d1a992200d5a6824682` | 당시 자산·연결 변경 확인 |
| AVC 여자부 | `9da4b044523050fd16f1adf90c12be11fc4debe2` | JPG 업로드 및 당시 Hero CSS 변경 |

이번 표준은 V-리그의 **실제 이미지 파일 + 공통 config 연결** 계약을 재사용한다. 아시안게임 조각 파일이나 AVC의 과거 CSS를 복사하지 않는다. Git 이력은 파일·설정·캐시 변경을 증명하지만 과거 작업자의 업로드 클라이언트까지 증명하지는 않는다.

## 2. 실패 원인과 검증된 해결

### 이미지 바이트가 GitHub에 도달하지 않음

이전 실행의 `git ls-remote`는 `Could not resolve host: github.com`으로 실패했다. ZIP은 실행 환경에 있었지만 실제 WebP는 GitHub에 전달되지 않았고 두 config는 SVG를 계속 참조했다. `create_blob`은 로컬 경로가 아니라 인코딩된 바이트 문자열을 요구한다. 이를 “두 환경 사이 바이너리 전달 자체가 불가능하다”고 일반화한 이전 문구는 잘못이었다.

이번 환경에서는 Git 읽기가 성공했지만 `git push --dry-run`은 `could not read Username ... terminal prompts disabled`로 실패했다. 읽기 연결과 쓰기 인증은 별개다. 실제 해결은 WORK `functions.exec` 안에서 `tools.exec_command`의 파일 바이트 출력을 메모리로 받아 GitHub 커넥터 `create_blob(encoding: "base64")`에 전달하는 것이다. base64 본문을 모델 응답에 출력하거나 다시 입력하지 않는다.

### 업로드 후 모바일 CSS가 config 값을 덮어씀

기존 photo 모바일 선택자는 `html body...`, 뒤의 PRO 공통 선택자는 `body...`였다. 앞 선택자의 우선순위가 더 높아 `background-size: auto 100% !important`가 `mobileSize: contain`을 덮어썼다. 390px에서 가로 약 201.64 CSS px가 잘리는 것을 실제 화면과 계산값으로 확인했다.

`6e04d8b1389ae26e0c2f5f1d81644425190f9a1d`에서 **기존 PRO 공통 선택자에 `html`만 추가**해 기존 설정 계약이 동작하도록 고쳤다. 카드 높이·텍스트 위치·오버레이·대회별 선택자는 변경/추가하지 않았다. engine/prototype의 공통 CSS cache query만 함께 갱신했다. 이 수정은 다음 대회마다 반복할 작업이 아니다.

해당 커밋의 첫 Pages 실행 `38416100369`은 build 단계 실행 기록 없이 실패했다. 제공된 로그만으로 원인을 확정할 수 없다. 필요한 검증 스크립트 갱신 커밋 `ddceb94b310d49053f5d40980ce13e26c2cf63c1`의 Pages 실행 `38480720655`가 성공했고 수정 CSS가 실제 제공되는 것을 확인했다. 서버 배포 실패를 브라우저 캐시 문제로 단정하지 않는다.

## 3. 제작·최종 규격

| 항목 | 확정 기준 |
| --- | --- |
| 남자부 / 여자부 | Black·Gold / Rose |
| PC / 모바일 | 2108×406 / 1258×406 px, 불투명 WebP |
| 자산 수 | 남녀 각각 PC·모바일 한 장씩, 총 4장 |
| 이번 원본 | `kovo_cup_hero_final_v02.zip`, 재압축·색 변환·크롭 없이 그대로 |
| 왼쪽 영역 | 제작 단계에서 빛·입자·배경 효과와 제목 가독성 확보 |
| 텍스트 | 대회명·일정·장소·상태는 기존 HTML 유지 |

V-리그 v08 PC의 실제 규격 2050×406은 그 버전의 이력이다. 이번 KOVO컵의 명시적 2108×406 지시와 혼동하거나 v08 파일을 변경하지 않는다. 제작 MASTER 규격과 실배포 완성본 규격도 구분한다.

원본과 고정 Hero 박스의 비율이 다르면 **전체 보존과 여백 없는 채움을 동시에 만족할 수 없다.** 이번에는 기존 공통 `contain` 설정으로 전체 이미지를 비례 축소한다. 모바일 위아래 테마색 여백은 의도된 결과다. `cover`, `auto 100%`, `100% 100%`로 강제 확대·크롭·늘림하지 않는다. 기존 PRO 보조 오버레이(PC 시작점 12%, 모바일 28%)를 유지하므로 화면 픽셀은 원본과 완전히 같지 않지만, 제공 이미지의 바이트와 색 정보는 원본 그대로다.

## 4. 경로·파일명·config 연결

저장 경로: `assets/img/competition-hero/`

파일명: `kvl-hero-{asset-key}-{men|women}-{pc|mobile}-{vNN}.webp`

이번 asset-key는 `kovo-cup-2026`, 버전은 `v02`다. 같은 파일명에 다른 바이트를 덮어쓰지 말고 새 버전을 사용한다.

대상: `data/competitions/kovo-cup-men-2026/config.json`, `data/competitions/kovo-cup-women-2026/config.json`.

남자부 예시(여자부는 이미지 파일명만 women):

```json
{
  "hero": {
    "showImage": true,
    "mode": "photo",
    "mimeType": "image/webp",
    "pcImage": "/assets/img/competition-hero/kvl-hero-kovo-cup-2026-men-pc-v02.webp?v=20261013-kovo-hero-v02",
    "mobileImage": "/assets/img/competition-hero/kvl-hero-kovo-cup-2026-men-mobile-v02.webp?v=20261013-kovo-hero-v02",
    "position": "right center",
    "mobilePosition": "right center",
    "size": "contain",
    "mobileSize": "contain"
  }
}
```

이는 관련 필드 예시이며 config 전체 대체 파일이 아니다. `themeVariant`, 대회 데이터, 모듈 등 기존 필드는 보존한다. PC·모바일 URL을 하나로 합치지 않는다.

## 5. 실제 성공한 배포 절차

사용 도구: Git CLI(읽기·이력), Python 3 + Pillow(규격·해시·원본 복사), WORK `functions.exec` + `tools.exec_command`(바이트 전달), GitHub 커넥터 Git Data API(인증된 쓰기), Cloud Browser `cua_repl`(실제 화면), Google Drive 커넥터(문서 저장).

### A. 준비

독립 checkout의 최신 main에서 시작한다. 다른 작업자의 미완료 변경을 덮어쓰지 않는다. Pillow가 설치된 환경에서 실행한다.

```bash
git fetch origin main
git merge --ff-only origin/main
python scripts/publish-competition-hero.py /absolute/path/kovo_cup_hero_final_v02.zip \
  --manifest /absolute/scratch/hero-publish-manifest.json
git diff --stat
git diff -- data/competitions/kovo-cup-men-2026/config.json data/competitions/kovo-cup-women-2026/config.json
```

스크립트는 정확한 4개 파일명·WebP 디코딩·픽셀·불투명성·성별/config 식별자·PRO family·기존 버전 충돌을 모두 검사한 후 원본을 복사한다. 이 단계는 **PREPARED**이며 배포 완료가 아니다. manifest는 scratch에 둔다. 로컬 경로가 포함되므로 공개 검수 기록에 그대로 올리지 않는다.

### B. WORK 인증 업로드

`scripts/publish-competition-hero.mcp.js`는 현재 인증된 `tools`를 전달받는 WORK helper다. 셸/일반 Node용 단독 업로더가 아니다.

```javascript
// functions.exec 안에서 실행. 절대 경로는 현재 checkout으로 치환한다.
const reads = await Promise.allSettled([
  tools.exec_command({cmd: "cat /absolute/scratch/hero-publish-manifest.json", max_output_tokens: 8000}),
  tools.exec_command({cmd: "cat /absolute/checkout/scripts/publish-competition-hero.mcp.js", max_output_tokens: 8000})
]);
for (const r of reads) {
  if (r.status !== "fulfilled" || r.value.exit_code !== 0) throw Error("Read failed");
}
const manifest = JSON.parse(reads[0].value.output);
const publish = eval(reads[1].value.output); // 최신 main에서 검토한 저장소 helper만 실행
const result = await publish(tools, manifest, "Publish competition complete Hero images");
text(result); // SHA·경로만 출력; base64 본문 출력 금지
```

helper의 실제 성공 경로:

1. 원격 main SHA/tree가 manifest 기준과 같은지 확인한다.
2. 원본을 12,288바이트 단위로 읽어 base64를 코드 도구 메모리에 조립한다. 각 조각 길이·형식을 검사한다.
3. `github_create_blob`에 `encoding: base64`로 전달하고 반환 Git blob SHA를 로컬 계산값과 비교한다.
4. 기존 tree 기반 `github_create_tree`에 허용 파일만 추가한다. 이미지 4장과 config 2장을 한 tree/commit에 묶는다.
5. `github_create_commit` 후 `github_update_ref`를 `force: false`, `expected_sha: 이전 main`으로 실행한다.
6. main을 다시 읽어 commit SHA를 비교한다. 동일 tree면 중복 커밋을 만들지 않는다.

성공한 이미지 배포 SHA: `0b074df5d76940d791ef05c8e2be365a20934822`.

`--push`는 로컬 Git 쓰기 인증이 따로 준비된 환경용이다. 이번 환경에서는 인증 실패했으므로 성공 표준 경로로 제시하지 않는다. GitHub UI 업로드도 이번에 실행하지 않았으므로 성공했다고 기록하지 않는다.

### C. 캐시·배포·HTTP 검사

- 이미지 변경 시 파일명 버전과 query 버전을 함께 올린다. 이번 값: `v02`, `?v=20261013-kovo-hero-v02`.
- 자산과 config를 원자적으로 배포한다. 존재하지 않는 파일 경로만 먼저 등록하지 않는다.
- 공통 CSS 자체를 수정한 경우에만 engine/prototype CSS query를 갱신한다. 이번 값: `20261013-hero-fit-contract-1`. 다음 이미지 교체 때 CSS를 불필요하게 수정하지 않는다.
- GitHub Pages의 **해당 SHA 성공**과 실제 HTTP 내용 갱신을 따로 확인한다. 강력 새로고침은 실패한 Pages 빌드를 고치지 않는다.

```bash
python scripts/publish-competition-hero.py \
  --manifest /absolute/scratch/hero-publish-manifest.json \
  --verify-live https://kvolleylab.com
```

두 live config의 SHA-256과 네 이미지의 HTTP 200·image/webp·디코딩·원본 SHA-256 일치를 확인하고 `.live.json`을 기록한다. HTTP 성공은 화면 검수의 대체물이 아니다.

## 6. PC·모바일 검수

- [남자부 실제 페이지](https://kvolleylab.com/competition-engine.html?competition=kovo-cup-men-2026)
- [여자부 실제 페이지](https://kvolleylab.com/competition-engine.html?competition=kovo-cup-women-2026)
- [실제 페이지 반응형 검수 도구](https://kvolleylab.com/tests/competition-hero-preview.html?competition=kovo-cup-men-2026&width=390)

검수 도구는 실제 운영 URL을 같은 origin iframe으로 표시한다. production DOM을 재구성하거나 Hero CSS를 주입하지 않는다. 대회와 폭을 선택하고 확인을 누른 뒤 JSON 표시를 기다린다. 남녀 각각 PC 1180px, 모바일 390px·360px에서 확인한다. 680px에는 모바일 자산, 681px에는 PC 자산을 사용한다.

| 실제 검수 | 남자부 | 여자부 |
| --- | --- | --- |
| 1180px / PC | 2108×406, contain, crop x/y=0 | 2108×406, contain, crop x/y=0 |
| 390px / 모바일 | 1258×406, contain, crop x/y=0 | 1258×406, contain, crop x/y=0 |
| 360px / 모바일 | 1258×406, contain, crop x/y=0 | 1258×406, contain, crop x/y=0 |
| 색감·왼쪽 효과 | Black/Gold와 빛 효과 확인 | Rose와 빛 효과 확인 |
| 가로 페이지 overflow | 없음 | 없음 |

390px Hero 외곽은 355×182.47 CSS px, 내부 배경 영역 기준 위아래 여백 합계는 약 65.07px다. 360px에서는 약 74.76px다. 전체 보존의 결과이며 확대해서 숨기지 않는다. 화면 캡처로 피사체, 왼쪽 효과, 제목·일정·상태 가독성을 직접 확인한다.

공통 selector 수정의 회귀 검사: V-리그 남자부 390px에서 이미지 URL, Hero 크기, 배율 0.4408867, 오버레이가 유지됐다. fit 표현은 auto 100%에서 config의 cover로 정상화됐지만 그 폭의 배율/잘림 수치는 동일하다. 다른 대회의 config·이미지·Production 전용 파일은 수정하지 않았다. 공통 CSS가 모든 폭에서 전혀 영향 없다고 확대 해석하지 않는다.

기계 판독 증거: [docs/validation/kovo-cup-hero-v02.json](validation/kovo-cup-hero-v02.json). 검수 범위는 Hero다. 기존 모바일 한눈에 보기 제목/설명 겹침은 별도 문제로 남기고 이 배포에서 수정하지 않았다.

완료 조건: 원본 4장 저장 → config 연결 → Pages 성공 → 실제 HTTP 검사 → 남녀 PC·모바일 화면 검사 → GitHub·Drive 운영지침 저장을 모두 충족한다.

## 7. 실패 시 해결 순서

| 증상 | 확인 및 조치 |
| --- | --- |
| DNS/연결 실패 | 해당 실행 환경의 오류로 기록한다. 권한 오류로 바꿔 설명하지 않는다. 인증된 GitHub 커넥터 경로를 확인한다. |
| Git 읽기 성공, push 인증 실패 | 로컬 쓰기 인증이 없다는 뜻이다. 검증된 WORK helper를 사용한다. 토큰을 추출하거나 채팅에 요구하지 않는다. |
| base64 길이/blob SHA 불일치 | 중단하고 원본 크기·조각 출력 잘림을 확인한다. 잘못된 tree/ref를 배포하지 않는다. |
| main SHA 변경 | 최신 main과 diff를 다시 읽고 manifest 기준을 갱신한다. 강제 push하지 않는다. |
| 이미지 404/SVG 응답 | GitHub tree, config 경로·대소문자, Pages SHA, Content-Type 순서로 확인한다. |
| GitHub 성공·사이트 구버전 | Pages 실행과 실제 HTML/CSS/자산 응답을 확인한다. commit 성공과 배포 성공을 구분한다. |
| 모바일에 PC 자산 | viewport, 680px 경계, mobileImage와 computed background를 확인한다. |
| contain인데 잘림 | computed background-size와 selector 우선순위를 확인한다. 대회 slug 전용 CSS를 만들지 않는다. |
| 색감/왼쪽 효과 소실 | 원본 해시와 기존 오버레이를 비교한다. 재생성하거나 오버레이를 임의로 진하게 하지 않는다. |

롤백은 최신 main 위에서 이 배포가 변경한 파일만 검토하여 되돌리고 정상 Pages 배포 후 재검수한다. 다른 대회의 최신 변경까지 과거 tree 전체로 강제 되돌리지 않는다.

## 8. 다음 대회 자동화 재사용

현재 검증 범위는 공통 PRO family, PC 2108×406·모바일 1258×406, 남녀 한 쌍이다. 다음 PRO 대회에는 아래 인자만 바꾼다. 다른 family/규격은 먼저 검수한 후 확장하며 미검증 상태를 표준으로 선언하지 않는다.

```bash
python scripts/publish-competition-hero.py /absolute/path/next-hero.zip \
  --asset-key NEXT-ASSET-KEY \
  --men-slug NEXT-MEN-SLUG --women-slug NEXT-WOMEN-SLUG \
  --version v01 --cache-version YYYYMMDD-next-hero-v01 \
  --manifest /absolute/scratch/next-hero-manifest.json
```

대문자 placeholder는 실제 소문자·숫자·하이픈 식별자로 치환한다. B의 동일 helper, C의 verify-live, 6절 화면 검수를 반복한다. config의 대회 자체 생성은 이미지 배포 스크립트 범위가 아니다.

## 9. 저장 위치

- GitHub: `docs/KVL_COMPETITION_HERO_PUBLISHING_RUNBOOK.md`
- 자동화: `scripts/publish-competition-hero.py`, `scripts/publish-competition-hero.mcp.js`
- 검수 UI: `tests/competition-hero-preview.html`
- Google Drive: [00_GUIDE](https://drive.google.com/drive/folders/15oHVPOdXxHWmhGCyrGT9K-dxSUW7GQ3a), `K-Volley Lab Data/00_KVL_Data_Center/05_BRAND_ASSETS/02_COMPETITION_HERO/00_GUIDE`
- Drive에는 이 Markdown 동일본과 `KVL_HERO_PUBLISHING_TOOLKIT_v02.zip`(자동화·검수 도구·검증 JSON)을 보관한다. 기존 native `KVL_COMPETITION_HERO_IMAGE_GUIDE_v1` 상단에 이번 확정 규격·배포 절차를 우선 기준으로 반영한다.

문서 자체를 포함하는 최종 SHA는 자기참조로 문서에 넣지 않는다. 최신 main/이 파일 Git 이력에서 확인하며 완료 보고에 전체 SHA를 별도 기록한다.
