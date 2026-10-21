# K-Volley Lab — Persistent Development Instructions

**Status:** Active · **Adopted:** 2026-10-21 · **Scope:** GitHub, Codex, ChatGPT Work, and any new development session.

This file is the entrypoint for K-Volley Lab development. Do not rely solely on chat memory or summaries. For project-specific decisions and what has actually shipped, read [docs/KVL_DECISION_LOG.md](docs/KVL_DECISION_LOG.md). Existing specifications remain authoritative within their scope.

## Mandatory startup checklist (every new session)

1. Read this file, `PROJECT_RULES.md`, `docs/DEVELOPMENT_WORKFLOW_v1.md`, `DESIGN_SYSTEM.md`, and `docs/KVL_DECISION_LOG.md`.
2. Read task-relevant specifications and the latest target files from GitHub **main**; record the base commit SHA. Inspect relevant commit history and previously successful implementations before designing a new method.
3. When the task involves content, assets, source documents, or data, inspect the relevant **Google Drive MASTER** and source archive (when access is available). If inaccessible, explicitly mark it `NOT VERIFIED` and do not invent its contents.
4. Reconcile the latest approved decisions with the live code; distinguish `APPROVED`, `PROTOTYPE`, `IMPLEMENTED`, `VERIFIED`, and `DEPLOYED`. A screenshot or old chat summary is not proof of deployment.
5. Report any conflict between older general documentation and newer approved decisions. Do not silently overwrite a newer decision with an older template.

## Seven mandatory development rules

1. **Check sources first.** Verify current GitHub main, relevant Google Drive MASTER, and applicable operation/design standards before editing.
2. **Protect current functionality.** List affected pages, scripts, data dependencies, and critical regressions; retain existing search, navigation, comparisons, filters, routing, and responsive behavior unless explicitly authorized to remove them.
3. **Reuse proven solutions.** Inspect previous working commits/PRs, assets, data pipelines, and prototypes before inventing new approaches. Prefer smallest compatible change.
4. **Work in isolation.** Make changes in `feature/*` or `fix/*` branches and prototypes. Use purpose-specific commits and a Pull Request; do not modify operating homepage or protected pages as a shortcut.
5. **Verify before suggesting release.** Check desktop/mobile UI, search and navigation, data integrity/source linkage, user interactions, regression results, and relevant automated checks. Clearly label tests not performed.
6. **Provide a handoff report.** Summarize changes, modified files, test outcomes, unresolved issues, base and resulting commit/PR, preview link when real, recovery procedure, and the next action.
7. **No production deployment without user approval.** Prototype completion, a successful test, or an open PR does not authorize merging changes to the operating website. Obtain explicit user approval before merging or deploying code or data affecting production.

## Continuity and decision recording

- Record every approved material design, behavior, data, or operational decision in `docs/KVL_DECISION_LOG.md` with date, scope, status, implementation reference, and superseded decision where applicable.
- Do not call a proposal `APPROVED`; do not call a completed prototype `DEPLOYED`.
- If an issue spans sessions, document the last known good version, remaining work, blockers, and next concrete action in the PR description and/or decision log.
- Preserve the shared navigation, design consistency, existing routes, and verified data model; do not change protected production files while merely preparing documentation.
- Keep official source documents in the existing Google Drive structure and publish only permitted, source-validated data. Never commit secrets, session cookies, private user notes, or sensitive personal information to the public repository.
- Authenticated bookmarks and personal scouting notes require server-side access control; client-side visibility alone is not privacy.
- If a tool lacks access, stop at a truthful `not verified / not changed` status rather than claim success.

## Documentation precedence

Explicit **latest user approval** > dated and approved decision log for that scope > scoped project standards and official MASTER > current implementation for actual runtime behavior. The implementation may reveal differences, but must not silently override the intended design. Ask or report when a conflict cannot be resolved without an approval.

## Completion gate

Work may be marked `READY FOR REVIEW` only after an evidence-backed QA summary. Mark `DEPLOYED` only after verified merge/deployment and live check. The project owner approves the final production change.
