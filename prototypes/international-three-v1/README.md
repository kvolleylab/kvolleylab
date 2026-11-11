# International three-competition template prototype v1

Status: **READY FOR REVIEW — no production release authorized**.

Base: `c293deb68296a271694e8c09da50f4d6274f0160` (main, 2026-11-09).
Branch: `feature/international-three-template-v1`.

This isolated static build reuses the current Competition Engine V2 and 2026
VNL presentation. It does not edit production entry pages, common engine files,
competition data, Player MASTER, Drive MASTER, or automation. All generated
artifacts live in the chosen output directory; production inputs are read-only.

## Run

```sh
python prototypes/international-three-v1/build.py /absolute/output/dist
node prototypes/international-three-v1/validate.cjs /absolute/output/dist
```

Serve that directory as a static site. Open these routes:

- `/?competition=avc-men-cup-2026`
- `/?competition=asian-games-men-2026`
- `/?competition=asian-games-women-2026`
- `/?competition=avc-men-continental-2026`
- `/review.html` — review report and viewport comparison
- `/compare.html?competition=<slug>&width=390` — before/after screenshots

## Scope and data conservation

| Competition | Stable competition ID | Matches | Public roster rows |
| --- | --- | ---: | ---: |
| AVC men's cup | KVL-COMP-000003 | 32 | 154 |
| Asian Games men | KVL-COMP-ASIAN-GAMES-MEN-2026 | 48 | 191 |
| Asian Games women | KVL-COMP-ASIAN-GAMES-WOMEN-2026 | 37 | 168 |
| AVC men's continental | KVL-INT-2026-003 | 26 | 165 |

Rows reflect the existing published source, not invented full-team quotas.
The two existing V2 competitions retain complete match, participant, standing,
final-ranking and roster objects. Legacy adapters retain match/participant IDs,
scores, set points, player identities and existing profile links. Unassigned
Player IDs remain unassigned. Continental rosters use the current three split
files, Volleybox map and CONFIRMED/FREE_AGENT club projection, matching production.

AVC cup uses a four-team final bracket and three placement games. Its 11-team
A6/B5 structure is verified against the final official schedule. Continental
official ranks 5–12 are a prototype-only addition from Volleyball World and JVA;
they are not inferred from losing quarterfinal games.

## Presentation

`international-home-v2`, `heroPresentation: preserve`, and
`meaningPlacement: before-calendar` reuse the current VNL contract. The
prototype-only presentation module adds compact meaning blocks, the full final
ranking list, Cup coaching information, and mobile table/bracket layout options.
The engine itself is copied unchanged, with SHA-256 provenance generated.

- A / international qualification: original continental fragment, source-exact.
- B / season structure: existing VNL qualifications renderer, unchanged.
- C / competition structure or medals: two concise `meaning.items` blocks.

The protected continental HTML, SVG sprite, original styles (including styles
injected by shared navigation), and original Korea-results renderer are extracted
at build time. Shadow DOM prevents newer template CSS from overriding them.
Document-root selectors are scoped to the isolated root; declarations remain
unchanged. Original viewport units/media queries still use the real page viewport.
Ranking placeholders, result presentation and source footnote remain unchanged.
Only the outer layout position/vertical spacing is composed with the new template.

## Validation

`validate.cjs` verifies all four contracts, every source match ID/result/set point,
all original V2 arrays and roster objects, legacy roster identities/links,
competition/participant identities, bracket type, original fragment bytes and
unchanged shared engine hashes. It passes for all 143 matches and 678 public
roster rows.

Browser review covers 1440px desktop (1180px content), 390px and 360px mobile.
All six tabs were exercised for all four screens. Mobile pool/overall tables and
knockout rounds use a vertical layout instead of inner horizontal scrolling.
Date dialogs and schedule links retain set scores and the common navigation/Top
module. A separate preserved-card comparison checks source text and descendant
geometry/typography/colors against the main snapshot at each target viewport.
See the generated review report and captured evidence for the actual checks.

## Source checks and limitations

- Drive operating MASTER v18 was read; latest scoped template docs take precedence
  over older general design instructions. The new ordinary template uses Arial;
  the protected fragment retains its original font rules, including desktop
  Pretendard, as required by the preservation exception.
- Asian Games men's stale overview note is corrected only in the prototype.
- Combined preliminary rankings are labelled KVL comparisons, not official seeds.
  Event-specific Asian Games tie-break rule text was not obtained.
- KVA AVC cup pre-event 12-team plan is superseded by the actual 11-team schedule.
- Asian Games women's actual 14-team format supersedes a generic 16-team sentence.
- The continental Drive schedule MASTER read during review is stale relative to
  the completed published JSON. Neither source is overwritten.
- Asian Games Korea final-game set points are preserved from KVL; official final
  ranks were checked, but those individual set records were not independently
  reverified in this review.
- No unverified ranking numbers, qualifications, players or scores are added.

## Release handoff and recovery

After design approval, separately review the two legacy V2 data collections,
two Asian Games config/presentation edits, a reusable meaning/full-ranking module,
the protected fragment asset and the approved entry-page connections. Keep the
existing sources/IDs and all automation unchanged. The current prototype is not
a wholesale replacement for protected AVC production HTML.

Recovery for this review is to redeploy the preceding private Site version or
discard the isolated branch. Production has no rollback requirement because it
was not changed.
