# Draft refinement release evidence — 2026-10-30

- Source PR: https://github.com/kvolleylab/kvolleylab/pull/203
- Source head: `7a20741f0751013a9600ba4d9c4cffd66d04c115`
- Production merge: `91318b984c4e8587c95ae5c84d5ef440f827b14e`
- Production tree: `3e64ce6ac9bf4394677fdf99963b19990dc46cf9`
- Pages run: https://github.com/kvolleylab/kvolleylab/actions/runs/41056786746
- Runtime data branch: `7a04c5813e666c59c126dec8fc6b1e5fb74afbb4`; women revision45 read back identical to reviewed static JSON. SHA256 `f65be047c1cbc51e088cb47ea0e735aa40eaa6b8d0e20bbe7dd12513e5a4a07b`. All28 rights and completed player/actual-team records unchanged. Men revision60 untouched.
- Private review Site: https://kvl-rookie-draft-review.daewook1029.chatgpt.site ; owner-only audience preserved; source `15ee9026e6635a2f4c0dcf10d5289783e976256d`; successful deployment `appgdep_6ae48f366f9c8191886e2fde6d7a4f93`.

## Checks

- Local core/store/admin/UI/observed/women tests:59/59. Final cache-busted module UI smoke:13/13.
- PR draft-board job124064875102:64/64, success.
- PR Quality Audit job124064874984:success; changed public JSON review gate passed.
- PR identity-and-routing job124064874925:29/30. Only pre-existing unrelated `kvl-competition-components-v2.css` fixed-hash expectation failed (actual760e4259… vs expected7d099226…). All original profile identities/routing checks retained. Existing unrelated registration/build workflows were not changed.
- Desktop and360/390px QA: approved Rose Hero, 100/46 stage cards, no document overflow, original-right result placement and trade dialog. Local QA harness used reviewed snapshots and was removed before Site publication. Actual runtime reload confirmed revision45 and displayed exchange summary. Men59/18/30.5%,9draws/3duplicates/automatic7 unchanged.

## Known limits

User-confirmed reset procedure is marked user_record, not official video verification. Provided CHZZK15897933 player displays a region restriction. Raw draws, colors, duplicates and seventh-rank method remain unknown for women. No credential entry in browser or physical handset test.

## Deployment and live verification

DEPLOYED: Pages build124066223065, report124066302479 and deploy124066302485 all succeeded for production merge91318b984c4e8587c95ae5c84d5ef440f827b14e.

Opened https://kvolleylab.com/v-league-draft.html?season=2026-27&gender=W in the browser. Computed Hero gradient matches RGB142/49/94 →111/35/74. Stage pools100/46 and all7 probabilities verified; public rows1R/2R/3R plus trainees; IBK2R trade dialog shows 고의정(OH) and 정솔민(L), original-right ownership and official source. Reload again displayed persisted revision45 and same pool/hidden4R. Screenshot: production.jpg.
