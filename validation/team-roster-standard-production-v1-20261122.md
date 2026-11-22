# Team Finder roster standard v1 — production release validation (2026-11-22)

Status: USER APPROVED / IMPLEMENTED ON ISOLATED BRANCH / STATIC QA PASSED / NOT YET DEPLOYED

## Base
- main: `2022d21e8ff5e4a0d235bbc8a286de4c361462bc`
- branch: `feature/team-roster-standard-v1-20261122`

## User-approved direction
Keep the current production Team Finder design, category controls, team cards and roster data sources.
Standardize only the expanded roster area.

### Common roster summary
- 선수 인원
- 평균 신장
- 관심선수
- 메모선수

On the live origin, the existing Supabase private workspace is read-only queried for `list_bookmarks` and `list_notes`.
Logged-out users see `— / 로그인 후`; signed-in users see team-roster-specific counts from linked KVL Player IDs.
No bookmark/note write path is added to Team Finder.

### Professional roster
- Keep current KOVO/GitHub-published current roster source.
- Quick list becomes `NO. / 선수명 / POS / 생년월일 / 신장`.
- Existing selected-player detail, source links and profile route remain intact.
- Mobile quick list is two lines: `NO. / name / POS` then `DOB / height`.

### International roster
The quick list is Korean-first:
- player list: Korean name only
- club: verified Korean display alias where mapped; otherwise source name is preserved
- country: Korean display label
- league: Korean display alias where mapped
- verified division tier: `(1부)` / `(2부)` only for recognized league patterns
- country flag appears beside club name
- second line uses `국가 · 리그 (등급)`; semantic chunks do not split mid-word
- `VB→` and tournament-history dots remain visible

The existing international player detail is not modified:
- English player name remains visible there.
- Original club/league strings remain in the model/detail.
- Volleybox and official/KVL profile links remain.

### International competition cards
Internal repository paths such as `원본: data/competitions/...` are hidden from the Team Finder UI.
The source path remains in the data/index for verification.

## Scope protection
Changed production files:
- `teams.html`
- new `assets/js/kvl-team-roster-standard-v1.js`
- new `assets/css/kvl-team-roster-standard-v1.css`
- new `assets/js/team-roster-member-summary-v1.mjs`

No changes:
- KOVO roster publisher/data
- V-League score automation
- international source JSON
- player IDs
- competition page renderers outside Team Finder
- bookmark/note write behavior

## QA
- classic Team Finder roster enhancer syntax: PASS
- member summary ES module syntax (`node --check`): PASS
- standard enhancer loads before international country controller: PASS
- four KPI labels present: PASS
- pro DOB list injection: PASS
- international Korean-first list: PASS
- English detail untouched: PASS
- Padova example alias: `파도바 🇮🇹 / 이탈리아 · 슈퍼레가 (1부)`: PASS
- country-name and ISO2 flag mapping: PASS
- safe no-mid-word league wrapping: PASS
- VB column preserved: PASS
- internal source-path card line hidden: PASS
- private summary is read-only: PASS

## Release
User explicitly approved production application on 2026-11-22.
Merge, GitHub Pages build and live-page verification are the remaining deployment gates.
