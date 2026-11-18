'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const ROOT=path.resolve(__dirname,'..'),read=p=>JSON.parse(fs.readFileSync(path.join(ROOT,p),'utf8'));
const api=require('../assets/js/kvl-international-countries-v1.js');
const dir=require('../assets/js/kvl-teams-directory-v1.js');
const generator=require('../scripts/build-international-country-index-v1.cjs');
const countries=read('data/international/country-directory-v1.json');
const snapshots=read('data/international/country-roster-index-v1.json');
const nominations=read('data/international/country-selection-index-v1.json');
const originalMaster=read('data/master/country_master.json');
const source=snap=>read(snap.source_path);
const rows=(code,gender)=>snapshots.snapshots.filter(s=>s.country_code===code&&s.gender===gender);
test('40 country/region entries retain the four canonical Master IDs and no invented identity keys',()=>{
 assert.equal(countries.country_count,40);
 assert.ok(api.validateDirectory(countries));
 assert.equal(new Set(countries.countries.map(c=>c.code)).size,40);
 assert.equal(originalMaster.length,4);
 for(const canonical of originalMaster){
  assert.equal(countries.countries.find(x=>x.code===canonical.iso3)?.country_id,canonical.country_id);
 }
 assert.equal(countries.countries.filter(x=>x.country_id).length,4);
 assert.deepEqual(countries.data_years,[2026]);
 assert.equal(countries.countries.filter(x=>x.region==='asia').length,20);
 assert.equal(countries.countries.filter(x=>x.region==='europe').length,12);
 assert.equal(countries.countries.filter(x=>x.region==='north_america').length,4);
 assert.equal(countries.countries.filter(x=>x.region==='south_america').length,2);
 assert.equal(countries.countries.filter(x=>x.region==='oceania').length,2);
});
test('reproducible builder matches both checked-in indexes without rewriting any original snapshots',()=>{
 const generated=generator.build();
 assert.deepEqual(generated.countriesOut,countries);
 assert.deepEqual(generated.rosterOut,snapshots);
 assert.equal(snapshots.snapshot_count,89);
 assert.equal(new Set(snapshots.snapshots.map(s=>s.snapshot_id)).size,89);
 assert.ok(api.validateIndex(snapshots,countries));
});
test('every event points to an existing participant and original historical roster, with an exact record count',()=>{
 const refs=new Map();
 for(const s of snapshots.snapshots){
  const team=api.sourceTeam(s,source(s));
  assert.ok(team,s.snapshot_id);
  assert.ok(Array.isArray(team.players),s.snapshot_id);
  assert.equal(team.players.length,s.player_count,s.snapshot_id);
  refs.set(s.source_format,(refs.get(s.source_format)||0)+1);
  assert.equal(s.year,2026);
  assert.ok(countries.countries.some(c=>c.code===s.country_code));
  assert.ok(['men','women'].includes(s.gender));
  assert.ok(s.competition_url);
 }
 assert.equal(refs.get('embedded'),36);
 assert.equal(refs.get('separate'),30);
 assert.equal(refs.get('team-array'),12);
 assert.equal(refs.get('cup'),11);
});
test('final and departure labels are source-specified, without upgrading every registration to final',()=>{
 const finals=snapshots.snapshots.filter(s=>s.stage==='final');
 const departed=snapshots.snapshots.filter(s=>s.stage==='departure');
 assert.equal(finals.length,11);
 assert.equal(departed.length,1);
 assert.equal(departed[0].country_code,'BRN');
 assert.equal(departed[0].player_count,13);
 assert.ok(finals.every(s=>s.competition_slug==='avc-men-continental-2026'));
 const vn=snapshots.snapshots.filter(s=>s.competition_slug.startsWith('vnl-'));
 assert.ok(vn.every(s=>s.stage==='tournament_registration'));
 const jpn=rows('JPN','men');
 assert.ok(jpn.some(s=>s.competition_slug==='vnl-men-2026'));
 assert.ok(jpn.some(s=>s.competition_slug==='asian-games-men-2026'));
 assert.ok(jpn.some(s=>s.stage==='final'));
});
test('filtering and gender availability provide grounded country cards',()=>{
 for(const gender of ['men','women']){
  const cards=api.cardEntries(countries,snapshots,gender);
  assert.equal(cards.length,40);
  assert.equal(api.filterCountries(cards,'asia','').length,20);
  assert.equal(api.filterCountries(cards,'europe','').length,12);
  assert.equal(api.filterCountries(cards,'africa','').length,0);
  assert.equal(api.filterCountries(cards,'all','Japan').length,1);
  assert.equal(api.filterCountries(cards,'all','일본').length,1);
  const jp=cards.find(c=>c.code==='JPN');
  assert.equal(jp.flag,'🇯🇵');
  assert.match(dir.cardMarkup(jp),/data-ktd-country="JPN"/);
  assert.match(dir.cardMarkup(jp),/연도·대회별 명단 보기/);
 }
 const women=api.cardEntries(countries,snapshots,'women');
 assert.equal(women.find(c=>c.code==='NZL').snapshots,0,'no published 2026 womens record is not absence of a team');
});
test('existing VNL and AVC player schemas show raw status without invented candidate or profile labels',()=>{
 const male=snapshots.snapshots.find(s=>s.snapshot_id==='vnl-men-2026:JPN');
 const women=snapshots.snapshots.find(s=>s.snapshot_id==='vnl-women-2026:JPN');
 const avc=snapshots.snapshots.find(s=>s.snapshot_id==='avc-men-continental-2026:JPN');
 const cup=snapshots.snapshots.find(s=>s.snapshot_id==='avc-men-cup-2026:AUS');
 const m=api.sourceTeam(male,source(male)).players.map(api.normalizePlayer);
 const w=api.sourceTeam(women,source(women)).players.map(api.normalizePlayer);
 const a=api.sourceTeam(avc,source(avc)).players.map(api.normalizePlayer);
 const c=api.sourceTeam(cup,source(cup)).players.map(api.normalizePlayer);
 assert.equal(m.length,16);
 assert.ok(m.some(x=>x.source_entry_status==='Reserve'));
 assert.ok(m.some(x=>x.official_profile.startsWith('https://')));
 assert.equal(w.length,14);
 assert.ok(w.every(x=>x.official_profile.startsWith('https://')));
 assert.equal(a.length,14);
 assert.ok(a.some(x=>x.name.includes('니시다')));
 assert.equal(c.length,14);
 assert.ok(c.some(x=>x.volleybox));
 assert.ok(!m.some(x=>x.selection_state==='cut'));
});
test('only verified KVL permanent identity resolves to an internal player profile',()=>{
 const master=read('data/master/player_master_international_v1.json');
 const jp=countries.countries.find(x=>x.code==='JPN');
 const snap=snapshots.snapshots.find(s=>s.snapshot_id==='vnl-men-2026:JPN');
 const roster=api.sourceTeam(snap,source(snap)).players.map(api.normalizePlayer);
 const p=roster.find(x=>x.source_player_id==='KVL-P-000340');
 assert.ok(p);
 const good=api.verifiedProfileLink(p,'men',jp,master,{isConflict:()=>false});
 assert.equal(good,'player.html?id=KVL-P-000340');
 assert.equal(api.verifiedProfileLink({...p,dob:'1990-01-01'},'men',jp,master,{}),'');
 assert.equal(api.verifiedProfileLink(p,'women',jp,master,{}),'');
 assert.equal(api.verifiedProfileLink(p,'men',jp,master,{isConflict:()=>true}),'');
 assert.equal(api.verifiedProfileLink({...p,source_player_id:'AG26-JPN-01'},'men',jp,master,{}),'');
});
test('candidate registry starts empty; comparisons require immutable IDs and final roster completeness',()=>{
 assert.ok(api.validateSelection(nominations));
 assert.equal(nominations.recorded_candidate_sets,0);
 const candidate={
  snapshot_id:'test-candidate',country_code:'JPN',gender:'men',year:2026,competition_slug:'avc-men-continental-2026',
  stage:'candidate_pool',source_id:'EXAMPLE-OFFICIAL-01',source_url:'https://example.org/volleyball/teams/roster',
  published_at:'2026-08-03',
  players:[{name_ko:'선수 A',verified_player_id:'KVL-P-000340',identity_source_id:'SCOUT-VERIFIED'},
           {name_ko:'선수 B',verified_player_id:'KVL-P-000346',identity_source_id:'SCOUT-VERIFIED'},
           {name_ko:'선수 C'}]
 };
 assert.ok(api.validateSelection({schema_version:1,recorded_candidate_sets:1,sets:[candidate]}));
 const complete={stage:'final',identities_complete:true,source_url:'https://example.org/volleyball/final',
  players:[{name_ko:'선수 A',verified_player_id:'KVL-P-000340',identity_source_id:'SCOUT-VERIFIED'}]};
 const compared=api.compareSelection(candidate,complete);
 assert.deepEqual(compared.map(x=>x.selection_state),['in_final','not_in_recorded_final','unresolved']);
 assert.match(api.outcomeLabel(compared[1].selection_state),/사유 미확인/);
 assert.deepEqual(api.compareSelection(candidate,{...complete,identities_complete:false}).map(x=>x.selection_state),['unresolved','unresolved','unresolved']);
 const invalid={...candidate,source_url:'javascript:alert(1)'};
 assert.equal(api.validateSelection({schema_version:1,recorded_candidate_sets:1,sets:[invalid]}),false);
 const noSource={...candidate,players:[{name_ko:'선수 A',verified_player_id:'KVL-P-000340'}]};
 assert.equal(api.validateSelection({schema_version:1,recorded_candidate_sets:1,sets:[noSource]}),false);
});
test('integration routes preserve the protected teams page and original V-League modules',()=>{
 const html=fs.readFileSync(path.join(ROOT,'teams.html'),'utf8');
 const js=fs.readFileSync(path.join(ROOT,'assets/js/kvl-teams-directory-v1.js'),'utf8');
 const access=read('data/member-access-v1.json');
 assert.ok(access.protectedPaths.includes('teams.html'));
 assert.equal(access.enabled,true);
 assert.match(html,/data-ktd-category="international"/);
 assert.match(html,/kvl-international-countries-v1\.js/);
 assert.match(html,/ktdCountryArea/);
 assert.match(html,/data-ktd-region="africa"/);
 assert.match(js,/KVLInternationalCountriesV1/);
 assert.match(js,/KVLVLeagueDraftBridgeV1/);
 assert.match(js,/KVLVLeagueRosterV2/);
 assert.match(js,/sourceIndex\.snapshots/);
});
