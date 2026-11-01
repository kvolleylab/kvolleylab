# V-리그 달력·성별 경기 카드 후속 수정 v3 — 2026-11-01

Status: REQUESTED / IMPLEMENTED / VERIFIED / RELEASE AUTHORIZED. Merge, Pages and live evidence are recorded in the release PR.

Base main: `e95126d65a346407f5128477750c1f328f148198` (PR #225). Branch: `fix/vleague-calendar-allstar-v3`.

## Latest requested behavior

- Both divisions display red **올스타전** on **2027-01-17**. The season-specific date/label/source ID live in each division's `structure.calendarDisplay.events` settings and use one shared renderer; no date is hardcoded in rendering logic.
- This is a calendar annotation, not an invented regular-season fixture. No fake teams, times, scores or match IDs; each division still has126 league fixtures. Overview and selected-team calendars show the same annotation. An annotation-only cell does not open an empty match dialog or add match shading.
- The current division comes first in **최근 결과 · 다음 경기**: women→men on the women's page, men→women on the men's page. DOM and visual order agree: left first on PC, top first on mobile. Async peer loading cannot reorder the cards.
- Shading means an actual registered match in that calendar's scope. Normal match day retains the division shading; Sunday/public/substitute-holiday match day uses pale red. A day without a match has a transparent background, including public holidays and Sundays. Red date numbers remain. This supersedes PR #225's all-holiday shading.

## Source record

Source ID: `KVL-VLEAGUE-2026-27-ALLSTAR-MASTER`.

The current [2026-27_V리그_경기일정_MASTER](https://docs.google.com/spreadsheets/d/180no_j27R_uw2adWH2BiWbbZ6QUWKVblqymIqNvkBU8/edit?usp=drivesdk), modified2026-11-01T12:21:12.152Z, was read through Drive. Its season summary contains **올스타전 / 2027-01-17 / 여수 진남체육관 예정**. The existing parent folder was inspected; no new archive or duplicate MASTER was created. MASTER is unchanged.

The date agrees with the August18 KOVO schedule announcement reported by [이투데이](https://www.etoday.co.kr/news/view/2615597?trc=main_culturelife_news). Direct KOVO press-page retrieval is NOT VERIFIED in this task; this is a MASTER-backed scheduled-date annotation with corroborating reporting, not a claim of direct official-page verification. No unverified start time or venue is added to the calendar. Future changes must be checked against the current MASTER/official announcement before updating this setting.

The previously verified holiday list and coverage remain unchanged; see [v1 sources](vleague-calendar-20261101.md). Previous SOOP alias, neutral weekdays, full seven-column mobile calendar and detailed match dialogs remain in effect; see [v2](vleague-calendar-v2-20261101.md).

## Scope and colors

- `assets/js/kvl-domestic-home-v2.js`: current division first; escaped optional event labels; holiday shading class only on actual matches.
- `assets/css/kvl-domestic-home-v2.css`: `.dv2-vleague-calendar` event label and holiday+match selector. Event and holiday number `#C53040`; holiday match background `#FFE9E9`; ordinary date `#20252B`. Other colors/fonts unchanged.
- Both V-League configs: source-linked All-Star annotation only. `competition-engine.html`: cache token `20261101-vleague-calendar-3`, production validation remains enabled.
- Public-review manifest: exact reviewed hashes for both display configs. Tests and this record cover the user request.
- Match/roster files are byte-identical to base main. No MASTER, ID, result, match-time, roster, standings calculation, Hero, navigation, VNL/AVC or other competition config changes.
- Shared calendar and summary code are reused; no forked engine or duplicate screen.

## Validation

- Focused calendar, selected-team, recent/next, VNL and Cup geometry regressions: **35/35 PASS**.
- Covers both division orderings, source immutability, all252 fixtures, annotation month changes/selected-team view, no false fixture counts, holiday numbers without games, full-name result dialog and university opt-out.
- Browser PC1440: calendar clientWidth/scrollWidth717/717, women card left252 / men828 at the same top position.
- Browser men390: calendar331/331, red All-Star text, zero shaded empty cells, holiday match background `rgb(255,233,233)`.
- Browser women360: calendar301/301, document345 within viewport360, no event/team/location clipping. Red All-Star label on17, no shaded empty dates. Women card top1993 precedes men2548.
- PC/mobile screenshots visually show the January All-Star break as unshaded dates and current-division-first summaries.
- JS syntax, `git diff --check`, unchanged source bytes, reviewed-public-config hash gate: PASS before publication.
- Prior clean-main evidence for two unrelated pending-postseason assertion failures is retained. This task does not claim that the entire repository CI is green; the release PR records current workflow outcomes.
- Local HTTP QA changes production validation only in the preview copy. That preview-only switch is not committed.

Screenshots: [women360](vleague-calendar-v3-20261101/women-360.jpg), [women PC](vleague-calendar-v3-20261101/women-pc.jpg).

## Recovery

Revert only this follow-up PR to restore PR #225 display behavior. No match/roster/MASTER rollback is needed. Preserve subsequent automated result updates.
