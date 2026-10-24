# Domestic Home v2 — 2026-10-24 QA

- Base main: 8237ba5ae5d2f901fdb69c6ca6723d3828ec2d90.
- Scope: Goseong/Danyang men/women presentation only. No data.json changes.
- Shared config, team UX, data contract, production starter and pro pool-column tests: 5 suites passed.
- New DOM integration tests: 5 passed (four selected competitions + untouched VNL). They validate production contracts and verify data/standings/bracket HTML/canonical participant hrefs are unchanged by the extension. Search and idempotence checked.
- Browser: desktop overview, all 3 metric routes, June→July calendar, July 3 final (한양대 1:3 인하대, four set scores), dialog/Escape, grouped participant search, preliminary combined ranking, true knockout and bye structure checked.
- Browser: 390px men, 360px women, 680px Danyang women; document width equals scroll width (375/345/665 usable px). The women's mobile bracket retains the actual semifinal→final ladder in its own horizontal scroll area.
- Existing campus detail and team-result/roster links remain intact; core team UX contract passed.
- Local HTTP preview copies alone use production:false to allow HTTP canonical validation; committed wrappers remain production:true and production contracts are validated with HTTPS URLs.
- Proof images in docs/validation: domestic-home-v2-mobile.jpg and domestic-home-v2-desktop.jpg.
- Rollback: remove structure.presentation from the 4 configs.

This record describes pre-deployment verification. The merged PR and GitHub Pages action are the deployment source of truth.
