# Draft applicant prototype v1

Status: PROTOTYPE · 2026-10-22 KST · K-Volley Lab

Base: `7f5b90109c912ee1cdaa93c463a5d667a1a95bdb` (latest main checked before edits).
Branch: `feature/draft-applicants-2026-27`. No merge or production release authorized.

## Existing implementation

- `draft-hub.html` / `assets/js/draft-hub-v1.js` reads only the 229-player university MASTER and filters grade 4 OR `draft_eligible`. It does not establish official application.
- Production player search/detail additionally reads school compressed MASTER, international MASTER, women university snapshots and canonical national links. A draft link must resolve through this combined catalog, not merely a name in the 229-player file.
- `player-canonical-identity-v1.js` overlays verified name/DOB for an existing ID. `player-link-canonical-v1.js` preserves the canonical `player.html?id=` route.
- Work B prototype source `b2ff2942668554e4a748a975892caaf0fce868c5` has 1,842 public player records. All 21 exported input/shared asset paths match current main. Search, dependent schools, multigrade, gender colors, compact school line, profile backdrop closing and session-only A/B notes are retained.
- Chat history URL could not be retrieved (DisabledError). Actual Work source and browser were inspected instead.

## Sources and precedence

- Read `AGENTS.md`, project/workflow/design/decision log and both PLAYER standards.
- Newer approved 1,180px light home/B player design takes precedence over old generic dark/gold design notes. Scoped permanent KVL-P identity standard takes precedence over PROJECT_RULES' older initials display-code wording.
- Drive operating MASTER v14 and PUBLIC/PREMIUM/PRIVATE rules reviewed. Player MASTER `1CecA9AXRiAaQw44Cvgo8Xo2WQXwALAhV`, modified 2026-09-21, inspected read-only. Existing ID review sheet retained. Nothing in Drive MASTER is rewritten.
- Original official files belong in the existing Drive season archive; repository receives source metadata and permitted normalized facts, not a bulk original-file archive.

## Architecture and boundaries

Official captures → immutable source hashes/revisions → applicants (season records) → separate identity links/review queue → verified public export → prototype.

`applicant_id` is an event record, never a newly issued player ID. Only `matched` entries with an existing, resolvable permanent ID may produce profile or bookmark actions. `needs_review`, `unmatched`, `duplicate_review` open applicant facts only. No name-only profile fallback.

Application, eligibility and selection are independent fields. Missing application evidence is unknown, never confirmed nonapplication. Missing selection results are unverified, never undrafted. Unknown fields remain null.

Table default; gender tabs; compound filters; sort; optional cards; source/reconciliation information; applicant details; existing Work member workspace links. No new authentication or private database is introduced.

## Protection and acceptance

Before snapshot: `docs/validation/draft-applicants-v1/before.json` (304 operational data/player/shared paths, MASTER IDs and counts).
Protect production pages, every MASTER, national links, rosters, shared navigation, collector schedule and existing Work player files. Only new prototype files, isolated ingestion/test modules and scoped documentation may change.

Acceptance requires official count reconciliation, complete original evidence, duplicate and homonym controls, deterministic reingestion, revision retention, profile route checks, unchanged files/IDs/roster links, existing notes/search regressions and actual desktop/mobile screenshots. A missing official source is a failed completion gate and is reported explicitly.
