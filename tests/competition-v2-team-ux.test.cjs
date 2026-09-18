'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),api=require('../assets/js/kvl-competition-data-v2.js'),scaffold=require('../scripts/scaffold-competition-v2.cjs'),dummy=require('./fixtures/competition-v2-dummy.js');
const d=scaffold.check(require('node:path').join(__dirname,'../data/competitions/vnl-men-2026'));
assert.equal(d.matches.length,116);assert.equal(d.participants.length,18);
for(const m of d.matches)for(const t of [m.home,m.away])assert(api.participant(d,t));
for(const r of [...d.standings.rows,...d.finalRanking])assert(api.participant(d,r.team?.code?r.team:r));
assert.equal(api.participant(d,{name:'일본'}),null,'names never route a team');
assert.equal(api.participant(d,'UNKNOWN'),null);
assert.equal(d.matches.filter(m=>api.localTimeLabel(m)).length,116,'every VNL match supplies a venue local time');
assert.equal(api.localTimeLabel({time:'19:30',timezone:'Asia/Shanghai'}),'','no inferred local time');
assert.equal(api.localTimeLabel({time_local:'00:00'}),'현지 00:00');
assert.equal(api.localTimeLabel({localTimeLabel:'일본 현지 19:30 JST'}),'일본 현지 19:30 JST');
assert.equal(api.localTimeLabel({date:'2031-07-02',date_local:'2031-07-01',time_local:'19:30',timezone:'Asia/Seoul'}),'2031-07-01 현지 19:30');
for(const p of d.participants){assert(api.rosterTarget(d,p).available);assert(fs.existsSync(require('node:path').join(__dirname,'..',p.rosterUrl)));}
const f=dummy();assert(api.rosterTarget(f,'NEP').available);f.structure.roster.mode='none';assert(!api.rosterTarget(f,'NEP').available);
f.structure.roster.mode='link-only';f.participants[0].url='/generic-team.html';assert(!api.rosterTarget(f,'NEP').available,'generic team URL is not a roster');
for(const bad of ['javascript:alert(1)','data:text/html,hi','ftp://example.org','']){f.participants[0].rosterUrl=bad;assert(!api.rosterTarget(f,'NEP').available);}
assert(!api.rosterTarget(f,'UNKNOWN').available);
const before=JSON.stringify(d.standings.rows.map(r=>[r.setRatio,r.pointRatio]));api.normalize(d);assert.equal(JSON.stringify(d.standings.rows.map(r=>[r.setRatio,r.pointRatio])),before);
console.log('PASS team identity, 116 match references, 116 supplied local times, 18 roster destinations, full/link-only/none and unchanged ratios');
