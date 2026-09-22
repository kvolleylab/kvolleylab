# K-Volley Lab Domestic Template v1

Status: FROZEN / APPROVED  
Visual Source of Truth: 2026 대한항공배 전국대학배구 고성대회 prototype  
Baseline commit: `1d9e8dcdc9bc782c0b637a0ef5db9d6011db74aa`  
Snapshot branch: `domestic-template-v1`

## Purpose

Domestic Template v1 is the fixed visual/rendering baseline for Korean domestic competitions in K-Volley Lab.

New domestic competitions should reuse this template through shared Competition Engine data/config, not by creating tournament-specific HTML/CSS/JS.

## Scope

- Domestic competition hero/card system
- Men / women division theme handling
- Overview cards and monthly calendar
- Match schedule / results layout
- Pool standings layout
- Final standings / knockout bracket
- Participating university/team cards
- Official resources
- Domestic regulation / competition-rule cards
- Domestic text-emblem fallback for teams without logo assets
- Initial render / transition behavior

## Theme baseline

### Men
- Primary navy: `#163A5F`
- Text navy: `#17365D`
- Soft navy: `#EEF4F8`

### Women
- Primary pink: `#D2648F`
- Dark pink: `#A43F68`
- Soft pink: `#FFF2F7`
- Hero gold: `#FFE4A3`

## Freeze rules

1. Existing international production pages remain independent and protected.
2. Domestic Template v1 must not receive tournament-specific CSS hacks.
3. New domestic events should be created by changing competition data/config only where possible.
4. A change to Domestic Template v1 is allowed only when it improves the common domestic template for all domestic competitions.
5. If a future design direction materially changes the baseline, create `Domestic Template v2` rather than silently redefining v1.
6. The `domestic-template-v1` branch is the rollback/reference snapshot for this approved baseline.

## Visual Source of Truth

- Men: `/competition-engine.html?competition=university-goseong-men-2026`
- Women: `/competition-engine.html?competition=university-goseong-women-2026`

This document records the approved Domestic Template v1 baseline and should be treated as the reference before adding the next domestic competition.
