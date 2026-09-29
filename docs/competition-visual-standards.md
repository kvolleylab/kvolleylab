# K-Volley Lab Competition Visual Standards

Status: ACTIVE · UPDATED 2026-09-29

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
