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
test('40 approved country cards use complete locally hosted SVG flag assets and retain safe emoji fallbacks',()=>{
 const codes=[...new Set(countries.countries.map(c=>c.flag_iso2))].sort();
 assert.equal(codes.length,40);
 const assets=fs.readdirSync(path.join(ROOT,'assets/images/flags/4x3')).filter(n=>n.endsWith('.svg')).sort();
 assert.deepEqual(assets,codes.map(c=>c+'.svg'),'all and only the approved country flag codes must exist');
 assert.match(fs.readFileSync(path.join(ROOT,'assets/images/flags/LICENSE.txt'),'utf8'),/MIT License/);
 for(const code of codes){
  assert.match(code,/^[a-z]{2}$/);
  const svg=fs.readFileSync(path.join(ROOT,'assets/images/flags/4x3',code+'.svg'),'utf8');
  assert.match(svg,new RegExp('^<svg[^>]+id="flag-icons-'+code+'"'));
  assert.match(svg,/viewBox="/);
  assert.doesNotMatch(svg,/<script\\b|<foreignObject\\b|onload\\s*=|<iframe\\b/i);
 }
 for(const gender of ['men','women']){
  const entries=api.cardEntries(countries,snapshots,gender);
  assert.equal(entries.length,40);
  for(const entry of entries){
   const orig=countries.countries.find(c=>c.code===entry.code);
   assert.equal(entry.flag_iso2,orig.flag_iso2);
   const html=dir.cardMarkup(entry);
   assert.match(html,new RegExp('assets/images/flags/4x3/'+entry.flag_iso2+'\\.svg'));
   assert.match(html,/ktd-country-flag-image/);
   assert.match(html,/ktd-country-flag-fallback/);
   assert.match(html,/loading="lazy"/);
   assert.ok(html.includes('alt="'+entry.name+' 국기"'));
   assert.doesNotMatch(html,/https?:\\/\\//,'flag images must not depend on an external live CDN');
  }
 }
 const invalid=dir.cardMarkup({action:'country',code:'TEST',name:'검증되지 않은 지역',flag_iso2:'../etc',flag:'🏐',en:'Test',sourceLabel:'No data'});
 assert.doesNotMatch(invalid,/<img/,'unvalidated country flag paths must not be interpolated');
 assert.match(invalid,/ktd-country-flag-fallback/);
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
  source_sha256:'a'.repeat(64),review_status:'VERIFIED',reviewed_at:'2026-08-04',published_at:'2026-08-03',
  players:[{name_ko:'선수 A',verified_player_id:'KVL-P-000340',identity_source_id:'SCOUT-VERIFIED'},
           {name_ko:'선수 B',verified_player_id:'KVL-P-000346',identity_source_id:'SCOUT-VERIFIED'},
           {name_ko:'선수 C'}]
 };
 assert.ok(api.validateSelection({schema_version:1,recorded_candidate_sets:1,sets:[candidate]}));
 // Hypothetical verified 2027 candidate-only source must show its year independently
 // of a finalized or registered tournament roster. This is test data, not published.
 const candidate2027={...candidate,snapshot_id:'test-candidate-2027',year:2027,
  source_id:'EXAMPLE-OFFICIAL-2027',published_at:'2027-01-01',reviewed_at:'2027-01-02'};
 const candidateSet={schema_version:1,recorded_candidate_sets:1,sets:[candidate2027]};
 assert.ok(api.validateSelection(candidateSet));
 assert.deepEqual(api.yearsFor(snapshots,candidateSet,'JPN','men'),[2027,2026]);
 const allCards=api.cardEntries(countries,snapshots,'men',candidateSet);
 assert.equal(allCards.length,40);
 assert.equal(allCards.find(c=>c.code==='JPN').snapshots,3,'candidate set does not masquerade as completed tournament');
 const alternateGender={...candidate2027,snapshot_id:'test-candidate-future-only',country_code:'NZL',gender:'women'};
 const femaleCandidateSet={schema_version:1,recorded_candidate_sets:1,sets:[alternateGender]};
 assert.deepEqual(api.yearsFor(snapshots,femaleCandidateSet,'NZL','women'),[2027]);
 assert.match(api.cardEntries(countries,snapshots,'women',femaleCandidateSet).find(c=>c.code==='NZL').sourceLabel,/후보·선발 자료 1건/);

 const complete={country_code:'JPN',gender:'men',year:2026,competition_slug:'avc-men-continental-2026',
  stage:'final',identities_complete:true,official_roster_complete:true,player_count:1,
  review_status:'VERIFIED',source_sha256:'b'.repeat(64),source_url:'https://example.org/volleyball/final',
  players:[{name_ko:'선수 A',verified_player_id:'KVL-P-000340',identity_source_id:'SCOUT-VERIFIED'}]};
 const compared=api.compareSelection(candidate,complete);
 assert.deepEqual(compared.map(x=>x.selection_state),['in_final','not_in_recorded_final','unresolved']);
 assert.match(api.outcomeLabel(compared[1].selection_state),/사유 미확인/);
 assert.deepEqual(api.compareSelection(candidate,{...complete,identities_complete:false}).map(x=>x.selection_state),['unresolved','unresolved','unresolved']);
 assert.deepEqual(api.compareSelection(candidate,{...complete,country_code:'THA'}).map(x=>x.selection_state),['unresolved','unresolved','unresolved']);
 assert.deepEqual(api.compareSelection(candidate,{...complete,source_sha256:null}).map(x=>x.selection_state),['unresolved','unresolved','unresolved']);
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
