# Women draft observed colors and draw log — 2026-10-30

Status: IMPLEMENTED / VERIFIED / RELEASE AUTHORIZED. Merge, runtime and live evidence will be recorded in the release PR.

- Base main: `7d0f44b7d96c16defe46ca082d68e7d2783c743a`; branch `fix/women-draft-observed-colors`.
- Existing user authorization to apply the men's/women's draft to the operating homepage continues for this supplied missing data. Current AGENTS, project workflow, approved decisions and unchanged Drive MASTER v16 were checked. Concurrent audit activation remains intact.

## Evidence and changes

- User watched the supplied CHZZK video and transcribed fourteen observations. The attached allocation frame was directly inspected: IBK 초록20, SOOP 파랑30, 현대건설 노랑4, 도로공사 흰색2, 정관장 빨강35, 흥국생명 보라8, GS칼텍스 검정1. Hex values are representative UI colors, not sampled broadcast measurements.
- Original screenshot retained in existing Drive official-source archive: `1ID3LsN8TUisSDwId0ym7uCnHSxGSeX5C`; SHA256 `e7e750c1cad8d41fbd942b22cd0ea2c8b10d901ce2d65080d4169dea4e80b82e`. No sharing change or public image redistribution. Public import stores the factual sequence, normalized team mapping and provenance.
- Observations: IBK, SOO, HHC, KEX, RSP, RSP, RSP, KEX, RSP, RSP, RSP, RSP, RSP, HPS. Duplicate occurrences total8: RSP7 + KEX1. The first occurrence assigns ranks1–6, duplicates never assign another rank.
- GS seventh remains from the existing official final result. The supplied raw sequence ends after HPS sixth. Seventh determination is unknown; no fictitious fifteenth draw or automatic assertion is added. Log remains partial and the public summary now says `확인된 추첨 14회 · 중복 8회`.
- Preserve staged100/46 pool shares, all28 right IDs/current owners/completed actual-team snapshots, all selections/trainees/trades, and men's data. Seven colors, fourteen draws, log coverage and rules provenance use23 audited commands, revision45→68. Existing45 audit entries preserved.
- Original direct video playback remains unverified because of the previously observed region restriction. User transcription and inspected attachment are separately attributed, not upgraded to direct full-video verification.

## Verification

-65 relevant core/store/admin/UI/observed/women/applicant-list tests pass; zero failures. Regression tests retain unknown-log behavior using an explicitly unobserved fixture, reject false complete logs, assert all14 rows and8 duplicates and all7 color/ball mappings.
- Browser QA on the actual page/module with a temporary local snapshot: staged cards100/46, Rose UI, seven colors, fourteen draw rows, eight duplicate rows and visible summary correct. At390px and360px iframe widths body scroll width equals client width (375/345 after scrollbar); table retains its own horizontal scroll and round label is sticky.
- Reviewed public JSON export manifest uses exact hashes and distinguishes review suitability from official-source status. Temporary snapshot is removed before private Site publication.

## Recovery

Revert this application PR only. Runtime previous head `7a04c5813e666c59c126dec8fc6b1e5fb74afbb4`, women revision45. Restore observed fields using audited commands while preserving any newer admin changes; never reset the complete data branch or completed player results. Source/image original remains archived.
