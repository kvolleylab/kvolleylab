'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
async function capture(file,gender,transform=x=>x){
 let resolve,reject;const done=new Promise((a,b)=>{resolve=a;reject=b});
 const window={KVL_COMPETITION_V2_DATA:{},KVL_AVC_SHARED_VALIDATION:{gender,source:`data/competitions/avc-${gender}-continental-2026.json`},KVLCompetitionTemplateV2:{apply(){resolve(window.KVL_COMPETITION_V2_DATA)}}};
 const sandbox={window,document:{readyState:'complete',body:{dataset:{}},querySelector(){return null}},location:{pathname:'/validation-competition-v2-cross-vnl-men.html'},console:{error:reject},fetch:async url=>({ok:true,json:async()=>transform(JSON.parse(fs.readFileSync(path.join(root,url.split('?')[0]),'utf8')),url)})};
 vm.runInNewContext(fs.readFileSync(path.join(root,file),'utf8'),sandbox,{filename:file});
 return done;
}
(async()=>{
 for(const gender of ['men','women']){
  const d=await capture('assets/js/kvl-avc-continental-2026-v2-adapter.js',gender);
  assert.equal(d.matches.length,26);assert.equal(d.participants.length,12);assert.equal(d.standings.combinedRows.length,12);
  assert.equal(d.matches.filter(m=>m.round==='QF').length,4);
  assert.equal(d.champion,gender==='men'?'일본':'태국');
  assert.equal(d.finalRanking[1].result,'준우승');
  assert.equal(d.standings.combinedRows[0].rank,1);
  if(gender==='men'){assert.equal(Object.keys(d.rosters).length,12);assert.ok(d.rosters.KOR.players.length>0);assert.ok(d.rosters.KOR.players.every(p=>p.en&&p.name));}
  else assert.equal(Object.keys(d.rosters).length,0);
  assert.ok(d.resources.length>0);assert.ok(d.resources.every(r=>/^https:\/\//.test(r.url)));
  console.log(gender, d.matches.length,'matches',d.participants.length,'teams',Object.values(d.rosters).reduce((n,r)=>n+r.players.length,0),'players');
 }
 const blank=await capture('assets/js/kvl-avc-continental-2026-v2-adapter.js','women',(d,url)=>{
  if(d.matches)d.matches=d.matches.map(m=>({...m,setsA:null,setsB:null,sets:[]}));return d;
 });
 assert.ok(blank.matches.every(m=>m.score===null));assert.equal(blank.finalRanking.length,0);
 const vnl=await capture('assets/js/kvl-vnl-men-2026-v2.js');
 assert.equal(vnl.matches.length,116);assert.equal(vnl.participants.length,18);assert.equal(vnl.standings.rows.length,18);assert.equal(vnl.structure.standings.mode,'single-league');
 assert.ok(!vnl.matches.some(m=>m.score&&(!Number.isFinite(m.score.home)||!Number.isFinite(m.score.away))));
 assert.equal(vnl.genderLinks.men,'/validation-competition-v2-cross-vnl-men.html?view=overview');
 console.log('VNL',vnl.matches.length,'matches',vnl.participants.length,'teams');
 console.log('Data contract tests passed');
})().catch(e=>{console.error(e);process.exitCode=1});
