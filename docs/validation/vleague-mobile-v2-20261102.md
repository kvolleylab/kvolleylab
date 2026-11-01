# V-리그 모바일 간격·국적·달력 결과 — 2026-11-02

Status: REQUESTED / IMPLEMENTED / VERIFIED / RELEASE AUTHORIZED. Merge, Pages and live evidence are recorded in the release PR.

Base main: `56c86c0bbabd7b5fb1183729935607ec093af6b8` (PR #228). Branch: `fix/vleague-mobile-rosters-calendar-v2`.

## Requested behavior

- Mobile detailed standings use five equal columns: 순위 / 팀·결과 / 승 / 패 / 승점. Existing result stays below the team name; logo/name/result are vertically grouped. Full names retain wrapping and links. The team-name text box may use12px of adjacent free space on each side while column centers remain equal and numeric cells remain clear.
- V-League mobile rosters show 등번호 / 선수명 / 국적 / POS / 키. The nationality column uses the existing registered flag; country text remains available to assistive technology and the existing details disclosure. Unmapped flags retain the original text fallback instead of inventing a flag. Jersey numbers increase from12px to20px.
- PC roster and print columns are unchanged. Cup/international/school/university rosters do not opt into this V-League CSS scope.
- The compact V-League overview and selected-team calendars show the registered set score only when `status` is `final` and the score has nonnegative, unequal integer values. Scheduled/live/postponed/cancelled matches and missing/invalid scores keep `vs`.
- The second calendar line keeps the exact existing venue-city and time mapping. The example does not overwrite home/away order, city or score. Visible text, hover label and accessible match label use the same result. Holiday shading, All-Star annotation and match dialog behavior remain unchanged.

## Files and protection

- `assets/css/kvl-competition-components-v2.css`: optional mobile record layout only.
- `assets/css/kvl-domestic-home-v2.css`: V-League mobile roster scope only.
- `assets/js/kvl-calendar-display-v1.js` and `assets/js/kvl-domestic-home-v2.js`: compact calendar result label.
- `competition-engine.html`: only changed CSS/JS assets get `20261102-vleague-mobile-2`; shared component JS retains its existing version. Production validation remains enabled.
- Existing cache assertions, calendar regressions, template contract, decision log and this QA record.
- No config/data/roster/MASTER/ID/source/standing calculation/player or nationality edits. `git diff BASE -- data/` is empty. Existing fonts, theme colors, navigation and other competitions are preserved.

## Verification

- Related standings/rosters/calendars, VNL preservation, selected-team behavior, Cup geometry and cache regressions: **56/56 PASS**.
- Calendar regression covers registered results and full-name labels, no score for non-final states, invalid/missing scores, source immutability,252 league fixtures, both divisions, team calendars, modal details, holidays and All-Star annotation.
- Browser360: five standings header center gaps64.40px (subpixel rounding below0.01px); browser390 gaps70.40px. Full document fits viewport, no clipped team names, original wins/losses/points values retained.
- Browser mobile roster: visible headers sorted by x-position are 등번호 / 선수명 / 국적 / POS / 키. Number font20px. Women's18 and men's19 sample roster flags present; women's18 flags loaded. Width/scroll at360:293/293px; at390:323/323px. No name overflow.
- Browser PC1440: original seven roster columns and14px jersey numbers, unclipped nationality names; table1076/1076px.
- Browser calendar: men's `1R KB 1-3 삼성` / `(평택, 14시)`, women's `1R 흥국 3-0 SOOP` / `(인천, 16시)`; next games keep `vs`. Mobile and PC matchup/location text has no overflow. Date activation still opens full-team-name result and set details (25-20,25-20,25-22 for the sampled women's match).
- JS syntax, diff whitespace and data/config immutability checks: PASS. Local HTTP QA alone disables production validation; this switch is not committed.
- Existing pending-postseason failures from clean main remain outside scope. Current CI and deployment outcomes are recorded in the release PR; no claim that all repository workflows are green.

Screenshots: [standings390](vleague-mobile-v2-20261102/standings-390.jpg), [roster360](vleague-mobile-v2-20261102/roster-360.jpg).

## Recovery

Revert this PR only to restore PR #228 spacing, hidden mobile nationality, previous jersey sizing and `vs` calendar labels. Keep subsequent automatic data updates; no MASTER or source-data rollback is required.
