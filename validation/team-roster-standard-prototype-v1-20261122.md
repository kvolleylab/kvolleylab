# Team Roster Standard Prototype v1 — 2026-11-22

Status: PROTOTYPE / BRANCH ONLY / NOT DEPLOYED

## Base
- main: 36ed818f833dce723afa890e5c353cf98d053b4f
- branch: prototype/team-roster-standard-v1-20261122
- review page: prototype-team-roster-standard-v1.html

## User direction preserved
- Keep the current production Team Finder page/card design.
- Prototype only the roster area.
- Common roster summary: 선수 인원 / 평균 신장 / 관심선수 / 메모선수.
- Common core list: NO. / 이름 / POS / 생년월일 / 신장.
- International roster keeps current Korean + English name display, club/league, VB→ and tournament-history markers.
- Interest/memo values are visually reserved but shown as — on the branch preview because private member APIs do not permit writes/reads from the preview origin.

## Prototype behavior
### Professional
- Reuses current production V-League roster renderer and current GitHub-published roster data.
- Adds 4 KPI cards.
- Adds DOB to the quick roster list.
- Keeps the selected-player detail pane and current profile/source links.
- Mobile quick list becomes two-line:
  - line 1: NO. / name / POS
  - line 2: DOB / height

### International
- Reuses current unified international roster.
- Adds the same 4 KPI cards.
- Preserves:
  - Korean name + English name
  - DOB
  - POS
  - height
  - club + league-country label
  - VB→ / VB search
  - tournament participation history

## Static QA
- Prototype JS syntax: PASS.
- Prototype CSS + JS referenced from prototype page: PASS.
- Current Team Finder grid/roster/country mounts retained: PASS.
- KPI labels 4/4 present: PASS.
- Professional DOB decoration present: PASS.
- Mobile two-line professional layout present: PASS.
- Production teams.html / production roster assets untouched: PASS.

## Release rule
Do not merge prototype assets into production. If approved, implement the chosen roster standard in the current production renderers from latest main and run PC/mobile browser QA.
