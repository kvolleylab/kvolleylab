# International current-club registry batch 2 — 2026-11-23

Status: USER REQUESTED / IMPLEMENTED ON ISOLATED BRANCH / STATIC QA PASSED / NOT YET DEPLOYED

## Base
- main: `ceb4b7fa76fec66a73522f24d23ff7a22c7da8e8`
- branch: `fix/international-club-registry-batch2-20261123`

## Scope
The country-detail UX requested by the user is already deployed through PR #397:
- full country-card click
- integrated roster first
- year dropdown
- old explanatory sentence removed
- redundant event cards removed
- compact competition direct links including VNL
- simple `← 국가 목록`
- `VNL 예비` badge

This batch therefore changes club evidence only.

## Iran 2026 current-club second batch
Added reviewed/confirmed current-season club overlays:
- Mohammad Reza Hazratpour → Paykan Tehran · Iran · Iranian Super League
- Ali Haghparast → Panionios Betsson · Greece · Volley League
- Yousef Kazemi Poshtpari → Mes Rafsanjan · Iran · Iranian Super League
- Shayan Mehrabi → Mehregan Noor · Iran · Iranian Super League
- Seyed Matin Hosseini Tolouti → Sir Susa Scai Perugia · Italy · SuperLega
- Mohammadnima Bateni → PGE Projekt Warszawa · Poland · TAURON Liga

Identity cleanup:
- verified direct Volleybox identity links added for Bateni, Mehrabi and Hosseini in the VNL source;
- AVC Bateni DOB/height/Volleybox and Haghparast DOB were completed from verified player profiles so the same athlete is not split into duplicate unified rows.

## Result
Using the same DOB + direct Volleybox identity logic as the production unified renderer:
- before batch: 22 grouped rows, 8 unresolved rows in the quick audit
- after batch: 19 grouped rows, 18 with club, **1 unresolved**
- remaining unresolved: Mohsen Delavari
- Mohsen Delavari remains unknown because no reliable current 2026-27 club source was found; no inference was made.

## Display
New Korean aliases:
- Sir Susa Scai/Safety/Sicoma Perugia → 페루자
- Paykan Tehran → 파이칸
- Mehregan Noor → 메흐레간 누르
- Panionios Betsson/VC → 파니오니오스
- TAURON Liga → 타우론 리가
- TAURON Liga is classified as 1부 in the current Polish top-flight display.

## QA
- JSON parse: PASS
- Team roster standard JS syntax: PASS
- Iran grouped identity audit: 19 total / 18 club resolved / 1 unresolved
- Bateni VNL+AVC merge: PASS
- Haghparast VNL+AG+AVC merge: PASS
- historical tournament participation is not removed
- no club is inferred from nationality/name alone

## Release
User requested current-club verification and update. Production merge requires PR checks and Pages/live roster verification.
