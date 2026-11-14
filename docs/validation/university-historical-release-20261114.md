# University verified archive — production release (2026-11-14 KST)

Status: **USER APPROVED / RELEASE CANDIDATE / LIVE DEPLOY NOT YET VERIFIED**.

## Scope and authority

Owner instruction: “확정된 부분에서는 홈페이지에 반영해” (2026-11-14).
Base main `6d3ba0ddc7334c54095e779955c6e76c2b62a6f3` (branch created against that base). Draft PR #327 was not merged wholesale; this release is separately scoped.

### Included
- Historical archive: **27** competition summaries and **147** ranked teams, including unchanged 2024/25 six competitions and 48 entries.
- 2013–2023 KUSF U-League men's winner/runner-up; 2020–2023 women's winner/runner-up (official KUSF historical table).
- Verified federation results: 2018 Cheongyang; 2019 Inje/Haenam; 2020 Goseong/Muan; 2021 Goseong; 2022 Goseong/Muan; 2023 Goseong/Jecheon.
- 2020 Muan women's completed podium only; men's final rankings deliberately omitted because KUVF match listing contains unfinished entries.
- Existing blank/unknown 3rd/4th ranks are not invented; women's round-robin distinct 3/4 and tournament shared third positions remain differentiated.
- Native 2026 hub links, HERO, men's/women's detail pages and existing 2024/25 result cards retain their implementation.

### Withheld
- **2018 Haenam** (only partial independent supporting records for full results): retained in PR #327 for further independent source checking, *not deployed*.
- 2017 and earlier federation cups, not verified as full historical results.
- Any unverified third/fourth, unmatched team/player identities, unconfirmed cancelled 2021 Jecheon final ranking.

## Source hierarchy

1. KUSF official university volleyball league history: https://www.kusf.or.kr/league/league_info.html
2. KUVF officially published schedule/results and KUVF journalist reports, including 2023 Goseong https://www.kuvf.co.kr/430 ; 2021 Goseong https://kuvf.goosisoft.com/328 ; 2020 Muan unfinished source https://kuvf.goosisoft.com/273 ; 2019 Inje https://kuvf.goosisoft.com/164 ; 2019 Haenam https://kuvf.goosisoft.com/184.
3. School and local-government reports: 2019 Inje university championship report https://m.dhnews.co.kr/news/view/179519715454675 ; 2018 Cheongyang municipal results https://www.ccnnews.co.kr/news/articleView.html?idxno=119876 .
4. Other contemporary scoring records only as supporting/cross-check evidence. Never treat their presence alone as official KUVF certification.

Each historical result has source IDs, source URL, publisher and verified date. Drive search found no independently confirmed historical results MASTER for 2018/2020/2021; existing v19 operations MASTER and existing source archive remain untouched.

## Updated files
- `university-competitions.html`
- `assets/js/university-hub-years-v1.js`
- `assets/css/university-hub-years-v1.css`
- `data/archive/university-results-v1.json`
- `scripts/quality_audit/public-review-manifest.json`
- `tests/university-hub-years.test.cjs`
- `docs/KVL_DECISION_LOG.md`
- `docs/validation/university-historical-release-20261114.md`
- `.github/workflows/university-historical-archive-qa.yml`

## QA / operations
- JS syntax, 27 unique event IDs, 147 recorded rankings, all source IDs and HTTPS links, official-only KUSF top two and 2020 Muan women's-only rendering: dedicated CI.
- Public JSON SHA-256 `feb4fa3f2cfa0a825efa6a9bd269a8510508cbca9237acf02469f6d19aa20f07`.
- Existing 2024/25 six event objects unchanged and 2026 three current cards untouched.
- More general KVL Quality Audit failures from prototype branch are NOT evidence that this dedicated scoped release passed or failed; compare actual release checks separately.
- GitHub Pages build/deploy and HTTPS website readback are required to claim deployed. PC1440/mobile390/mobile360 browser click QA, if not available, must be clearly reported as not independently verified.
- No changes to Player Master, Match Master, Competition Engine, V-league live data, automation or tokens.

## Rollback
Revert the release PR merge commit only. Original main before this release is `6d3ba0ddc7334c54095e779955c6e76c2b62a6f3` (after future concurrent main commits, do not reset full main). PR #327 remains Draft for withheld entries.
