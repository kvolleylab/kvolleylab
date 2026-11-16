# Draft Hub 목록 기본값 · 대표팀 AVC 카드 색상 범위 · 2026-11-16

Status: USER REQUESTED / IMPLEMENTED IN ISOLATED BRANCH / STATIC QA VERIFIED / NOT DEPLOYED.

- Base: `811f270f3dddc04bb0df0e5ed14ddb9ba1b11c07` (main 2026-11-16).
- Branch: `fix/draft-list-national-tournament-tint-20261116`.
- Scope: `draft-hub.html`, `assets/js/draft-hub-v2.mjs`, `national-team.html`, `assets/css/national-team-home-v2.css`. The data projection, team roster, competitions, identity/MASTER, public notices, V-League, and automation workflows are not changed.

## 1. Draft Hub

Default absent/invalid `layout` URL parameter: `cards` → `table` for first arrival from 선수·팀 and homepage links. Valid explicit `layout=cards`, `layout=compact`, and `layout=table` continue to override the default. Existing 3-way controls, filters, male/female switching, search, official source ordering, links, and mobile listing remain intact.

The module cache-busting query in `draft-hub.html` is updated so the revised initial layout is fetched after deployment.

## 2. 2026 national-team competition cards

The existing `avc` family cards receive a pale green wash from the competition header through the venue/date and final placing (`.tournament-top` + `.tournament-main`). The background fades downward, with the result information readable. Gold replaces the green tint on `:hover` or `:focus-within`. The existing gold border hover is unchanged. The separate `.qualification-note`, including 'LA28·월드컵 직접 출전권 배정 대회 아님', and `.tournament-links` are **not tinted**. Asian Games family stays as it was; no result or competition metadata changes. The same selectors serve men/women and PC/mobile; only the national-team stylesheet is changed. The HTML CSS query is bumped to invalidate old browser cache.

## Static source checks

- Draft absent/invalid layout defaults to `table`; explicit cards/compact selectors and click-to-update state preserved.
- Existing table renderer and list button selected state preserved.
- Cache query changes present in both entry HTML files.
- AVC header/main tint, gold hover/focus, separate qualification-note sibling, and stable competition rendering selectors present.
- CSS open/close brace balance unchanged.
- Git comparison must show only the scoped UI files plus documentation.

Not verified: pixel screenshots on real desktop/mobile browsers; GitHub Pages production rendering or navigation after deployment; live cache after merge. Do not mark DEPLOYED before user production approval, a merged PR, Pages success, and live verification.

## Release and rollback

Review the PR file list and checks, then obtain separate owner approval before merging into `main`. Following approval, check desktop and mobile at `/draft-hub.html` (without `layout`, plus explicit cards and compact) and `/national-team.html?gender=men` / `?gender=women` (AVC top/main, qualifier note white, hover gold, roster and links). Roll back this isolated PR if any regression; do not revert other data/automation commits.
