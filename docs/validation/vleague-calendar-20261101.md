# V-리그 경기 달력 — 2026-11-01

Status: REQUESTED / IMPLEMENTED / VERIFIED / RELEASE AUTHORIZED. Merge, deployment and live evidence are recorded in the release PR, not inferred from local screenshots.

## Scope and sources

- Request: change the operating V-리그 홈 calendars for both divisions to red public-holiday date numbers, calendar-only team aliases and two plain-text fixture lines. The earlier school hub request remains prototype-only and is not part of this release.
- Base main: `e9fa468eee6b327373ba4da68d802a6dad1f390b`; branch: `feature/vleague-calendar-labels-v1`. Latest main was fetched again before publication.
- Read project instructions, development workflow, design system, current decision log and current shared competition implementation. Current light-theme and scoped V-League decisions take precedence over older general design instructions.
- Drive operating MASTER v16 (modified 2026-10-27T16:24:09.216Z) and `2026-27_V리그_경기일정_MASTER` (modified 2026-11-01T12:21:12.152Z) were checked read-only. Source records include KB손해보험–삼성화재 on November 1 at 14:00 in 평택이충문화체육관. No MASTER writes.
- Naver calendar: **NOT VERIFIED**. The requested Naver search/calendar URL could not be retrieved. This limitation was disclosed; no Naver comparison is claimed.
- Holiday evidence: [KASA 2026 almanac announcement](https://www.kasa.go.kr/prog/bbsArticle/BBSMSTR_000000000010/view.do?bbsId=B000000000010&nttId=B000000001860Pe2zT3), [KASA 2027 almanac announcement](https://www.kasa.go.kr/prog/plcyBrf/brief/kor/sub01_01_04/view.do?plcyBrfNo=431), and [KASI 2027 date table](https://astro.kasi.re.kr/kor/life/post/calendarData?year=2027). The older 2026 annual totals are not used as current totals.

## Display contract

`structure.calendarDisplay.mode = vleague-compact` opts in through the existing renderer. Both overview and selected-team calendars use the same presentation. Other competitions retain their count/team-score calendars.

```text
1R KB vs 삼성
(평택, 14시)
```

- Round comes from each registered match's stage/round; time retains minutes when present, e.g. `19시30분`.
- City comes from an explicit exact venue mapping or matching venue metadata. An unrecognized/relocated venue retains its original label; it is never inferred solely from the home team. Missing values remain 장소 미정/시간 미정.
- Team alias is display-only; stable team IDs, full names, links, results, rosters and Player IDs are unchanged. Full names/venue appear in accessible labels, hover titles and the existing date dialog. `S∞P` is the requested compact label for SOOP, not a canonical name replacement. 남녀 ‘현대’ remains separated by the division page.

| Division | Calendar aliases |
| --- | --- |
| Men | 항공 · 삼성 · KB · 현대 · 우카 · 한전 · OK |
| Women | GS · 흥국 · S∞P · 도공 · 현대 · IBK · 정관장 |

The game wrapper has no white background, border, left stripe or shadow. Existing match-day shading remains. Red `#C53040` applies to Sunday/public/substitute holiday date numbers; matchup text is neutral `#294259`, location/time `#61758A`. Existing family/gender colors and fonts remain.

The season-specific KR holiday coverage is explicitly bounded to 2026-09-27 through 2027-05-08, covering the visible season and neighboring calendar cells. Verified special dates: 2026-10-03/05/09, 12-25; 2027-01-01, 02-06/07/08/09, 03-01, 05-01/03/05. Sundays remain red; future years' lunar/temporary holidays are not guessed. New seasons and newly announced temporary holidays require a source-backed coverage update.

## Files and isolation

- `assets/js/kvl-calendar-display-v1.js`: pure date/round/alias/venue/time formatter; no source mutation.
- `assets/js/kvl-domestic-home-v2.js`: optional calendar markup through the existing renderer and date dialog.
- `assets/css/kvl-domestic-home-v2.css`: `.dv2-vleague-calendar`-scoped rules, wider PC calendar column, single-column overview at <=1299px and local calendar scrolling below its 644px readable width. Same two lines at 390px/360px.
- Both `data/competitions/v-league-*-2026-27/config.json`: aliases and venue-city display mappings only.
- `competition-engine.html`: helper before renderer; domestic JS/CSS cache token `20261101-vleague-calendar-1`. Production validation stays enabled.
- `scripts/quality_audit/public-review-manifest.json`: exact reviewed hashes for the two public display configs, linked to this evidence.
- New focused tests and existing workflow registration; existing CSS cache assertion accepts the new token.
- No match/roster/MASTER data, global navigation, Hero assets, VNL/AVC config, international template or school prototype changes.

## Verification

- Focused calendar, team calendar, paired match summary and VNL production regressions: **32/32 passed**. All 252 season fixtures match requested alias/round/city/time format; read-only rendering preserves records.
- Additional config, domestic, roster, Cup geometry and postseason checks: **47/49 passed** after updating the cache-token assertion. The two pending-postseason assertions fail identically on a clean archive of base main; they are pre-existing and remain unchanged. Four other postseason scenarios pass. No claim that all repository tests pass.
- Changed-public-export gate: passed after reviewing and registering the two display configs; no gate rules or access controls changed.
- `git diff --check`: passed. No data.json/rosters.json changes.
- Browser PC viewport1440: main1180, calendar738.66, inner width/scrollWidth717/717; all seven weekdays fit. Ordinary viewport1363 also fits the full week.
- Browser mobile390/360: body375/345 (15px scrollbar), no document overflow; calendar alone scrolls. All matchup/location spans fit their cells. Horizontal movement reaches the final weekday.
- Men November1: `1R KB vs 삼성` / `(평택, 14시)`; date dialog retains full names, 1:3 and four set scores. Women: `1R 흥국 vs S∞P` / `(인천, 16시)`.
- Month navigation through February2027 retains red6/7/8/9 and Sundays14/21/28, including holidays without a game. Women/men navigation works; full-name accessible labels are retained.
- Local HTTP QA copy changes only `production:true` to false to bypass HTTPS canonical validation. This QA-only switch is not committed. Production uses the original HTTPS validation.

Screenshots: [men PC](vleague-calendar-20261101/men-pc.jpg), [men390](vleague-calendar-20261101/men-390.jpg), [women PC / February holidays](vleague-calendar-20261101/women-pc.jpg), [women360](vleague-calendar-20261101/women-360.jpg).

## Recovery

Revert this scoped release commit/PR to remove the two display settings, helper connection, scoped CSS/renderer extension and cache token. No data rollback is needed. Preserve any subsequent match-result automation commits when reverting.
