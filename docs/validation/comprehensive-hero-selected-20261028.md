# 종합대회 선택 Hero 적용 · 2026-10-28 KST

Status: APPROVED / IMPLEMENTED / VERIFIED / RELEASE AUTHORIZED. Merge, Pages and live evidence are recorded in the release PR.

Initial base: `b157b31816d8e21fbb922c4605b22e7110c68d59`. Rebased release base: `a90881e3d8ffbbb87859389f34220950e5d5f362` (PR #187 preserved). Branch: `feature/comprehensive-hero-selected-20261028`.

## Approved selection

| Page / gender | Selection | Scene |
| --- | --- | --- |
| 종합대회 배구 | 02 | Stadium, crowd and festival torch |
| 전국체전 남자부 | 04 | Attack and block |
| 전국체전 여자부 | 07 | Serve receive |
| 소년체전 남자부 | 09 | Team high-five |
| 소년체전 여자부 | 12 | End-line serve |

The user explicitly selected these designs after requesting actual homepage integration in the continuing workflow. All five pairs are the selected v03 package; no image was regenerated or recolored. Original selection numbers are recorded here because v03 filenames alone do not identify the comparison-board choice.

## Implementation

- Ten opaque WebP files: PC 2108 × 406 and mobile 1258 × 406. SHA-256 values match the approved package. See the asset manifest alongside this report.
- Hub Hero and nine canonical division configs use the selected images. National festival: three men's and two women's divisions; youth festival: two men's and two women's divisions.
- Recent-event cards inherit the Hero of their linked default division through the existing renderer. The existing test now asserts against that linked division rather than incorrectly requiring every gender to share one image.
- The shared engine's existing `hero.themeVariant` opt-in selects `finished-artwork`. Scoped domestic CSS uses configured contain sizing, preserves geometry, removes the previous dark image overlay and uses standard navy #163A5F / rose #8E315E behind the image. No event-slug CSS or duplicated renderer was added.
- At 680px and below, detail Heroes align the completed mobile artwork to the bottom so the title remains above the bright action scene. A small theme-colored text shadow supports description/meta readability. The image itself stays unchanged; PC remains right-center. Existing 242px PC / 218px mobile minimum heights remain.
- Four entry-point CSS cache versions are refreshed. Data, participants, rosters, scores, rankings, regions and source IDs are unchanged. Existing university, school and PRO Cup artwork treatments remain opt-out.

## Standards and archive

Google Drive operating MASTER v15 and KVL_COMPETITION_HERO_IMAGE_GUIDE_v1 were read in this task. Current approved dimensions and rose palette were verified. Earlier reuse of the same scene for men/women is superseded by the user's explicit different-scene request and final selection. Original generated PNG masters and all ten WebP versions were archived under the existing domestic Hero archive; no official match photography is claimed.

## QA

- Existing comprehensive hub, national festival, domestic-home-v2 and school domestic suites: **79/79 pass**, no skips.
- Browser preview: five selected Heroes × widths 1180, 390, 360, 680 and 681 = **25 checks**. All images load at their specified natural dimensions; computed fit is contain; no background dark overlay or page horizontal overflow; correct mobile/PC selection at the 680px boundary.
- Representative PC/mobile screenshots were inspected. Titles, medal/region rows, recent-event cards and image scenes remain visible. Female rose artwork is no longer covered by the old #301C30 dark overlay. Mobile image is intentionally letterboxed to preserve the full composition.
- Actual youth division-link click changes women → men and switches to the men's image while preserving the destination division.
- Preview only changes `production:true` to `false` to allow the local HTTP host; production HTML retains its canonical validation.
- Browser screenshot files did not synchronize back to the main workspace within the documented five-second limit. Do not claim downloadable screenshots are attached. Browser UI observations and computed reports are the visual evidence.
- After rebasing onto PR #187: all six suites, including KOVO Cup rosters and desktop alignment, pass **90/90**. Existing Cup CSS rules remain byte-identical; only its cache-key assertion accepts the new shared CSS version. Final diff check passes. Post-merge live HTTP/hash verification is recorded in the release PR.

## Release and recovery

Use an isolated branch and reviewed PR under the user's continuing production authorization. Verify the exact merge SHA's Pages deployment and live asset bytes before marking DEPLOYED. Recover by reverting this scoped merge commit; no data rollback is needed. Preserve concurrent KOVO Cup roster/flag changes from PR #187.
