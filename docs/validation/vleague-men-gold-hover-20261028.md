# V-리그 남자부 마우스 오버 — 2026-10-28

Status: APPROVED / IMPLEMENTED / VERIFIED. Merge, Pages and live confirmation are recorded in the release PR.

- Request: replace the pale gray hover shade with pale gold on the already approved V-League men's competition pages.
- Base: main `a0a0036062d35a8e94c4741a938a5fc74fb4370d` (#192). Isolated branch: `fix/vleague-men-gold-hover-20261028`.
- Sources: current main and project rules/decision log inspected. Google Drive operating MASTER v16 (modified 2026-10-27T16:24:09.216Z) verified; this CSS-only change uses no new competition/player data.

## Change

`assets/css/kvl-domestic-home-v2.css` adds scoped `:hover` overrides for V-League men's tabs, KPI links, team cards, roster rows/actions, standings, calendar match days and round filters. Background: `#FFF3D6`. Paired match cards use their own `data-summary-gender`, so the men's match remains gold from either division's entry page and the women's match remains pink.

The normal/selected background, text and neutral score colors, geometry, Hero, roster flags, IDs and data are unchanged. KOVO Cup and other competitions do not match the new selectors. `competition-engine.html` updates only the domestic CSS cache token; the existing cache-version smoke assertion accepts the new version.

## Verification

- Existing V-League roster/overview, paired matches, Cup roster and domestic interactions: **57/57 passed**.
- Existing Cup desktop geometry/cache smoke: **passed**. `git diff --check`: passed.
- Browser PC 1280: real mouse hover computed `rgb(255, 243, 214)` for the tab, participant card, overview standings cells, round filter and men's next-match link.
- Women's page: men's next-match hover remains gold; women's next-match hover remains `rgb(255, 242, 246)`.
- Team selection still opens 대한항공's 19-player roster. Male and female 360px iframe: body width/scrollWidth both 345px (15px browser scrollbar), zero horizontal overflow.
- Local HTTP preview disables only the production HTTPS canonical gate in an ignored preview copy. Operating HTML keeps `production:true`.
- Browser evidence: [participant hover screenshot](vleague-men-gold-hover-20261028/desktop-hover.jpg).

## Recovery

Revert this scoped release commit to restore the previous hover and CSS cache token. No data migration or restoration is needed. Previous reference: #192/main `a0a0036`.
