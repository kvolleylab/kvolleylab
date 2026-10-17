# K-Volley Lab — Match-only live-data pipeline (Phase A, 2026-10-17)

## Scope and boundaries
- Current scope ONLY match schedule, scheduled/live/final/postponed/cancelled, current set, sets won, set-by-set points, timestamp and revision.
- No player names, individual statistics, lineups, detailed analytics or roster work. That phase is deferred.
- No current homepage, Competition Engine, competition JSON, KOVO official notice collector, or Google Drive MASTER updates from the match collector.

## Verified vs unknown
- GitHub Actions has accessed and parsed an existing KOVO DB BANK **final** match page without logging in.
- Match-only collector: scripts/kovo_match_feed.py; it calls only match parser and public page fetcher from the prior module, never any player parser.
- Pilot: 2026-01-22 한국도로공사 3:1 IBK기업은행 (2025-26 league, NOT 2026 Cup):
  https://dbbank.kovo.co.kr/game/11110_pop_result.asp?PID=gUjNxoTMwIjOyIDM
- The KOVO app advertises updated match schedules/results. This does NOT verify a publicly callable point-by-point in-progress feed.
- Naver live text commentary also has no verified permitted automated data endpoint. Do not treat it as an API.
- It remains unknown whether rights, terms, rate limits and commercial redistribution permit any KOVO public endpoint to be polled for live display.

## Files
- scripts/kovo_match_feed.py — staged match-only normalization/revision validation and final-result adapter
- tests/test_kovo_match_feed.py — offline synthetic state transitions, regression and identity safety, no player data
- data/kovo/match-feed/pilot_manifest.json — single historical verified DB BANK URL
- .github/workflows/kovo-match-feed-pilot.yml — offline tests plus real historic final-game probe, artifact only
- docs/KVL_KOVO_MATCH_LIVE_PIPELINE.md — this status and gate document

## Match-state schema
status: scheduled | live | final | postponed | cancelled
sets_won: home/away cumulative sets won
sets: array of up to 5 entries, each with home points, away points and complete true/false
current_set: 1..5 when live, otherwise null
match identity: match_id, competition_slug, date, home_code and away_code

Synthetic state example (NOT sourced from a real KOVO match):
    status=live
    sets_won={home:1,away:0}
    sets=[{home:25,away:19,complete:true},{home:12,away:10,complete:false}]
    current_set=2

Valid full sets require 25 points (fifth 15), 2-point winning margin. Set winners and cumulative wins must agree. No silent final-score rewrites, match identity changes, completed-set regression, live point reduction or live-to-scheduled regression. Explicit source corrections require a separate review path. Unchanged states keep revision, changed states increment it.

## Safety of output
- Output is a GitHub Actions review artifact containing status, source URL, revision and game score ONLY.
- mode=STAGING_ONLY and review_status=SOURCE_REVIEW_REQUIRED in real final-game probes.
- mode=SIMULATION_ONLY for synthetic tests; simulated scores are rejected in non-test mode.
- No cron polling. No commit of results. No direct public website update. No secrets or authentication.
- Final DB BANK pages are NOT evidence of real-time feed availability.

## Actual live-scoring release gates
1. Confirm KOVO authorized in-progress match data endpoint (or licensed provider) including URL/game IDs, status, sets and point score. Never guess opaque IDs or bypass login.
2. During a genuine game collect multiple independent time-stamped snapshots to verify set progression, point values, corrections, freshness and end state. Check use terms and allowed rate.
3. Run a server-side worker with approved intervals, per-game only around kickoff, rate limits/backoff, durable snapshot/revision storage, conflict alerts and outage handling. GitHub Actions periodic commit workflows are NOT true real time.
4. Serve official/provisional state through a read-only JSON API or approved hosting layer with updated_at, freshness and cache controls. GitHub Pages alone is static and cannot provide a persistent, low-latency writable backend.
5. Connect a common Competition Engine adapter, not a page-specific hack. Match by canonical match_id/date/teams. Display LIVE + provisional status and last observed time; reserve FINAL official status for verified final-game data.
6. Test production with real matches, correct status transition, stale-feed fallback, amendments and permission review, then enable unattended updates.

## Official public schedule API successfully verified — 2026-10-17
- Public KOVO Vite app: `https://kovo.co.kr/game/v-league` and `https://kovo.co.kr/game/kovo-cup` both load `/assets/index-DueEbBs9.js`. The public JS config sets Axios base to `https://user-api.kovo.co.kr` and includes the schedule request paths.
- Official anonymous GET endpoints returned HTTP 200 / JSON envelope result.status=200 from GitHub Actions (no cookies, Authorization, or login):
  - `/mains/games/schedules` — recent/upcoming games
  - `/mains/games/schedules?gender=FEMALE` — recent/upcoming filtered games
  - `/mains/games/schedules/ended?gender=FEMALE` — five recently ended games
- Live evidence: https://github.com/kvolleylab/kvolleylab/actions/runs/39038848044 and https://github.com/kvolleylab/kvolleylab/actions/runs/39038914517
- Official season ID for the 2026 Yeosu KOVO Cup is `824`; official `match` value `002`, gender `FEMALE` or `MALE`, game number as assigned by KOVO. CUP phase codes: `212` group, `213` semifinals, `214` final. Verified from actual public API response.
- 2026-27 women's V-League upcoming season code observed as `023` and match value `001`; not yet assigned a publishing mapping.
- The schedule endpoint returns `homeTeam.score`, `awayTeam.score` (sets won), `currentSet`, `startTime`, `endTime`, team IDs and official game number. It does NOT expose within-set point scores in the verified response. A completed game has `endTime` and final sets won; an upcoming game has `currentSet=0` and score 0:0. Actual in-play examples have not been captured.
- `scripts/kovo_match_schedule_bridge.py` now reads only those verified public endpoints, normalizes a match-only source key (season:match:gender:number), matches against existing K-Volley Lab competition JSON using date, team names, round and number, and writes **review artifact only**. No site updates.
- Verified live bridge: https://github.com/kvolleylab/kvolleylab/actions/runs/39039178288 — 13 observations deduplicated to 8 matches, 7 successfully matched to site Cup IDs including women #7-12 and men #13. Unknown V-League entry stayed unmapped.
- The expected next gate is a **genuine in-progress** sample showing score changes at multiple timestamps, plus discovery of a first-party officially permitted per-set-point endpoint. Until then `LIVE` support is a tested model, not deployed live scoring.

## 2026-10-17 further public-game detail investigation
- KOVO official public JS additionally defines a match-detail GET call at `/stat/game-schedule/{gnum}` with parameters `gcode`, `seasonCode`, `leagueCode`, `gender`, `round`, `tcode`, `acode`, `gdate`. This is a discovered source-code callsite, not proof of live point scoring.
- A single one-shot request for the previously verified official women's semifinal game #10, using official schedule-provided values, reached the API (HTTP 200), but its JSON envelope reported `result.status=404`. The detailed game API contract is **NOT VERIFIED** and no scores were collected from that endpoint.
- This result was not worked around by trying guessed identifiers, modified dates, credentials or other undocumented routes. Source/policy review is required before a future detailed score experiment.
- Diagnostic source: https://github.com/kvolleylab/kvolleylab/actions/runs/39039566660
- The independently verified public schedule API and match-only Cup identity bridge remain operational; no false per-set-point or in-play score data were written.

## Current blockers
- Genuine KOVO live per-point feed: NOT VERIFIED
- Public source automatic match ID discovery: NOT VERIFIED
- Persisted recurring match worker: NOT DEPLOYED
- Live homepage and competition UI: NOT DEPLOYED
- All production competition data and home UI remain unchanged by this work
