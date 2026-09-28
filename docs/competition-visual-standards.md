# K-Volley Lab Competition Visual Standards

Status: ACTIVE · UPDATED 2026-09-28

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
