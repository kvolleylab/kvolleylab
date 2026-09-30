# K-Volley Lab Competition Visual Standards

Status: ACTIVE · UPDATED 2026-09-30

## Competition family colors

- FIVB men: Purple
- AVC men: Green
- GAMES men (Olympics / Asian Games): Deep Red
  - Primary: `#9E2F2F`
  - Strong: `#7D2026`
  - Accent: `#C44A3D`
  - Soft: `#FFF2EF`
  - Border: `#E7B5AD`
  - Hero gradient: `#641B20 → #A83232`
- Domestic men: Navy
- Women: Rose override takes precedence over competition family.

## Main-card / hero image standard

The image asset is background artwork, not a poster. Event title, dates and venues are rendered by HTML/CSS and must not be baked into the image.

### PC

- Target display geometry: approximately 1140px wide × 184–218px high inside the 1180px competition shell.
- Master artwork should be a very wide banner, approximately 5.2:1–6.2:1. Recommended working master: about 2400×460px.
- Left 45–55% is the text-safe zone: competition-family color/gradient and only subtle texture.
- Right 45–55% contains the key action image.
- Main subject should sit around 65–78% of total width, not on the extreme right edge.
- No event title, dates, venue, badges, logos or sponsor text inside the artwork.

### Mobile

- Mobile may use a dedicated crop/asset through `hero.mobileImage`, or the same master with `mobilePosition` when composition permits.
- Preserve the main subject in the right-center crop; do not rely on content at the far edges.
- Mobile composition should remain readable behind the HTML title/date/venue overlay.

### Reuse rule

Every new competition main card should follow this same asset contract. Only the family palette and right-side event imagery change.

## Main-card replacement procedure

Use this as the default procedure whenever the user says “메인카드 바꿔줘” or asks to replace a competition Hero image.

1. Do not regenerate the artwork unless the user explicitly asks for a new image. Reuse the approved artwork.
2. Treat “메인카드” as the full competition Hero card. The image is the Hero background asset, not a standalone poster.
3. Prepare separate PC and mobile assets when needed:
   - PC: wide banner preserving the left text-safe zone and right-side action image.
   - Mobile: dedicated mobile crop/composition so the subject remains visible without forced cover zoom.
4. Prefer direct hero.pcImage / hero.mobileImage only when the binary image upload is verified intact.
5. If GitHub binary upload is unreliable, use the common chunk loader instead of retrying broken binaries:
   - hero.pcB64Chunks
   - hero.mobileB64Chunks
   - hero.mimeType: image/webp
   - Store small .b64 text chunks under the competition Hero asset directory.
6. After uploading chunk assets, verify the reconstructed image before considering the replacement complete:
   - decoded header starts with RIFF
   - bytes 8–11 are WEBP
   - decoded byte length equals RIFF declared payload + 8
   - verify PC and mobile independently
7. Update the Competition Engine script cache-bust when the Hero loader logic changes.
8. Update the competition config cache-bust / asset query version when Hero assets change.
9. Verify the final Hero on both PC and mobile. Do not accept black fallback, forced zoom, or unintended cropping.
10. Do not add tournament-specific Hero CSS patches. Fix shared Engine / Template / Components behavior, then connect the competition through config/data.

### Current reliable fallback pattern

When a direct binary WebP becomes truncated in the repository, keep the image content as base64 text chunks and let the shared Competition Engine reconstruct the data URL at runtime. This is the validated fallback used for the 2026 Asian Games men's prototype and should be reused for future competitions if the same upload symptom appears.

### Completion rule

A main-card change is complete only when all of the following are true:

- approved artwork is the one actually shown
- PC Hero is correct
- mobile Hero is correct
- family palette remains correct
- no text is baked into the artwork
- image integrity is verified
- no production page outside the requested scope was modified

### International women interaction and calendar parity (2026-09-30)

For shared V2 international women competitions (gender=women, non-domestic):

- Participant-country cards and roster surfaces use the AVC Women Rose palette; inherited green hover/active/profile accents are not allowed.
- Schedule stage-filter hover uses AVC Women production values: border #d59ab1, background #fff1f6, text #9a3561; active uses #a53d68.
- Overview KPI hover uses Rose border/shadow and a Rose-white surface, never the legacy green hover.
- Monthly calendar month-title typography is shared with Goseong: 20px desktop and 18px mobile.
- The international women calendar month-title card uses the current Goseong Women Rose #D2648F.
- These rules belong to the common Competition Engine/Components layer, never tournament-specific CSS.


### International women roster and resources parity (2026-09-30)

For shared V2 international women competitions:
- roster POS badges use Rose surface `#fff1f6`, text `#a43f68`, border `#e6b6c9`; legacy green POS badges are not allowed.
- official-resource cards use neutral white + Rose border, and action buttons use AVC Women Rose `#fff1f6 / #a13c67`; green resource buttons/hover states are not allowed.


### International women eliminated-result badge parity (2026-09-30)

For shared V2 international women competitions, eliminated-result badges in preliminary combined standings are neutral grey, matching AVC Women production:
- desktop: background #f1f2f3, text #6f7379
- mobile: background #f3f4f6, text #6b7280, border #e5e7eb
- green is not allowed for an eliminated status.


### GAMES men full-page palette rule (2026-09-30)

For shared V2 international men's competitions with `competitionFamily=games` (Asian Games / Olympics), the Deep Red family palette must cover every competition view, not only Hero/tabs.

Canonical GAMES men palette:
- dark: `#641B20`
- strong: `#7D2026`
- primary: `#9E2F2F`
- accent: `#C44A3D`
- soft: `#FFF2EF`
- border: `#E7B5AD`

The shared Components layer must remap inherited AVC green accents in:
- overview KPI hover, roster shortcut, status note and calendar QF markers
- schedule toolbar/filter hover/active and Korea-row highlight
- pool standings, combined standings, qualified/cutline/Korea highlights and ranking-rule card
- final standings, bracket winners, Korea path, connectors/path placeholders and knockout note
- participants, roster POS badges, print/Volleybox controls and team-profile surfaces
- official-resource cards and buttons

Eliminated-status badges stay neutral grey, not red or green. Gold medal/champion accents stay gold. Tournament-specific CSS is not allowed for this palette sweep.
