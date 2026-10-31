/* Focused prototype checks: source preservation, standings scope, evidence and state transitions. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..'),read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const model=require('../previews/international-v1/model.js');
const config=read('data/competitions/vnl-men-2026/config.json'),data=read('data/competitions/vnl-men-2026/data.json');
const p=read('previews/international-v1/vnl-men-2026.json');
const d={...config.competition,...data,structure:config.structure},before=JSON.stringify(d),checks=[],warnings=[];
function test(name,fn){try{fn();checks.push({name,pass:true});}catch(e){checks.push({name,pass:false,error:e.message});}}
test('VNL presentation contract matches canonical competition and season',()=>assert.deepEqual(model.validate(p,d),[]));
test('All original meaning and qualification text remains present',()=>{
 const result=model.explanation(d,p);assert.equal(result.title,d.meaning.title);assert.equal(result.note,d.meaning.note);
 for(const q of d.qualifications){const actual=result.cards.find(x=>x.id===q.id);for(const key of ['brand','title','description','foot','pill','resultTeams'])assert.deepEqual(actual[key],q[key]);}
});
test('Unmapped explanation is preserved',()=>{const extra={id:'extra',description:'기존 추가 설명'};assert.equal(model.explanation({...d,qualifications:[...d.qualifications,extra]},p).cards.at(-1).description,extra.description);});
test('Upcoming and active seasons do not expose completed result claims',()=>{
 for(const status of ['upcoming','active']){const state={...d,status},out=model.explanation(state,p);assert.equal(out.cards.find(c=>c.id==='champion').resultTeams.length,0);assert(!out.cards.find(c=>c.id==='champion').description.includes('폴란드'));assert.equal(model.visibleRanking(state).length,0);}
 assert.equal(model.visibleRanking({...d,status:'active',finalRanking:[{rank:3,confirmed:true},{rank:1}]}).length,1);
});
test('Evidence states distinguish unverified from not applicable; verified requires sources',()=>{
 assert.deepEqual(p.explanation.relations.map(r=>r.state),['not_applicable','unverified']);
 const bad=structuredClone(p);bad.explanation.relations[0].sources=[];assert(model.validate(bad,d).includes('evidence required'));
});
test('Preliminary scope contains 108 matches; finals excluded',()=>{
 const prelim=data.matches.filter(m=>p.standingsScope.stages.includes(m.stage));assert.equal(prelim.length,108);assert.equal(data.matches.length-prelim.length,8);
 for(const row of data.standings.rows){const ms=prelim.filter(m=>[m.home.code,m.away.code].includes(row.team.code));assert.equal(ms.length,12);assert.equal(row.played,12);let wins=0,pts=0;for(const m of ms){const h=m.home.code===row.team.code,own=h?m.score.home:m.score.away,opp=h?m.score.away:m.score.home;if(own>opp)wins++;pts+=own>opp?(opp===2?2:3):(own===2?1:0);}assert.equal(wins,row.wins,row.team.code+' wins');assert.equal(pts,row.points,row.team.code+' points');}
});
test('Competition/match/team/player identifiers remain canonical and unique per record',()=>{
 assert.equal(d.competitionId,'KVL-COMP-000001');assert.equal(new Set(d.matches.map(m=>m.id)).size,116);
 const codes=new Set(d.participants.map(t=>t.code));assert.equal(codes.size,18);for(const m of d.matches)for(const t of [m.home,m.away])assert(codes.has(t.code));
 for(const [team,r]of Object.entries(d.rosters)){assert(codes.has(team));assert.equal(new Set(r.players.map(p=>p.playerId)).size,r.players.length,team);}
});
test('Completed ranking retains all 18 ranks; ties are driven by actual data',()=>{assert.equal(d.finalRankingFull.length,18);assert.deepEqual(d.finalRanking.slice(0,4).map(x=>x.rank),[1,2,3,4]);assert.equal(model.rankLabel({rank:3},[{rank:3},{rank:3}]),'공동 3위');assert.equal(model.rankLabel({rank:3},d.finalRanking),'3위');});
test('Calendar initial month follows state and KST month boundary',()=>{const months=['2026-06','2026-07','2026-08'];assert.equal(model.initialMonth(d,months),'2026-08');assert.equal(model.initialMonth({...d,status:'upcoming'},months),'2026-06');assert.equal(model.initialMonth({...d,status:'active'},months,new Date('2026-06-30T15:01:00Z')),'2026-07');});
test('Non-VNL international settings validate without importing VNL phases',()=>{
 for(const family of ['avc','fivb','games'])for(const gender of ['men','women']){
  const fixture={competitionId:'TEST-'+family,season:'2030',competitionFamily:family,gender,status:'upcoming',meaning:{title:'대회 의미 · 진행 구조',note:'시즌별 설명'},qualifications:[{id:'advance',description:'해당 대회 공식 진출 기준'}]};
  const settings={version:1,presentation:'international-home-v1',competitionId:fixture.competitionId,season:fixture.season,labels:{groups:'본선순위'},explanation:{facts:[],flow:[{title:'조별 예선'},{title:'순위결정전'}],cards:[{ref:'advance',kind:'rule'}],relations:[{label:'세계랭킹',state:'unverified',sources:[]}]},sources:{}};
  assert.deepEqual(model.validate(settings,fixture),[]);assert.equal(model.explanation(fixture,settings).flow.length,2);assert(!JSON.stringify(settings).includes('VNL'));
 }
});
test('Wrong competition/family is rejected',()=>{assert(model.validate(p,{...d,competitionId:'OTHER'}).length);assert(model.validate(p,{...d,competitionFamily:'domestic'}).length);});
test('Presentation functions do not mutate canonical data',()=>assert.equal(JSON.stringify(d),before));
test('Existing production/shared/data files are unchanged against the recorded main SHA',()=>{
 const changed=cp.execFileSync('git',['diff','--name-only',p.sourceCommit],{cwd:root,encoding:'utf8'}).trim().split('\n').filter(Boolean);
 const permitted=f=>f.startsWith('previews/international-v1/')||f.startsWith('docs/validation/international-vnl-')||f==='docs/international-template-v3-proposal.md'||f==='templates/international-presentation-v1.starter.json'||f==='scripts/build-international-review-v1.py'||f==='scripts/verify-international-review-v1.cjs';
 assert.deepEqual(changed.filter(f=>!permitted(f)),[]);
});
warnings.push('Drive schedule MASTER is dated 2026-07-21; later web results were preserved, not synchronized into MASTER.');
warnings.push('Historical V2 production/print gates are not a release approval for this prototype. Print/PDF was not tested.');
warnings.push('The canonical VNL config currently uses the same approved image for PC and mobile. No new Hero asset was generated.');
const result={status:checks.every(x=>x.pass)?'PASS':'FAIL',baseCommit:p.sourceCommit,checkedAt:'2026-10-31',checks,counts:{matches:d.matches.length,preliminary:108,finals:8,teams:d.participants.length,rosterPlayers:Object.values(d.rosters).reduce((n,r)=>n+r.players.length,0)},warnings};
fs.mkdirSync(path.join(root,'docs/validation'),{recursive:true});fs.writeFileSync(path.join(root,'docs/validation/international-vnl-checks-v1.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));if(result.status!=='PASS')process.exitCode=1;
