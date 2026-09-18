'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),api=require('../assets/js/kvl-competition-data-v2.js'),scaffold=require('../scripts/scaffold-competition-v2.cjs'),dummy=require('./fixtures/competition-v2-dummy.js');
const d=scaffold.check(require('node:path').join(__dirname,'../data/competitions/vnl-men-2026'));
assert.equal(d.matches.length,116);assert.equal(d.participants.length,18);
for(const m of d.matches)for(const t of [m.home,m.away])assert(api.participant(d,t));
for(const r of [...d.standings.rows,...d.finalRanking])assert(api.participant(d,r.team?.code?r.team:r));
assert.equal(api.participant(d,{name:'일본'}),null,'names never route a team');
assert.equal(api.participant(d,'UNKNOWN'),null);
assert.equal(d.matches.filter(m=>api.localTimeLabel(m)).length,116,'every VNL match supplies a venue local time');
assert(d.matches.every(m=>/^(중국|캐나다|브라질|폴란드|슬로베니아|프랑스|일본|세르비아|미국) 현지 \d{2}:\d{2} (CST|EDT|BRT|CEST|JST|CDT)$/.test(api.localTimeLabel(m))),'VNL local times include host country and timezone abbreviation');
assert.equal(api.localTimeLabel({time:'19:30',timezone:'Asia/Shanghai'}),'','no inferred local time');
assert.equal(api.localTimeLabel({time_local:'00:00'}),'현지 00:00');
assert.equal(api.localTimeLabel({time_local:'17:00',venueCountryKo:'일본',timezoneAbbr:'JST'}),'일본 현지 17:00 JST');
assert.equal(api.localTimeLabel({localTimeLabel:'일본 현지 19:30 JST'}),'일본 현지 19:30 JST');
assert.equal(api.localTimeLabel({date:'2031-07-02',date_local:'2031-07-01',time_local:'19:30',timezone:'Asia/Seoul'}),'2031-07-01 현지 19:30');
assert.equal(d.structure.roster.mode,'full');
assert.equal(Object.values(d.rosters).reduce((n,r)=>n+(r.players||[]).length,0),284,'all 18 VNL rosters are embedded');
for(const p of d.participants){assert(api.rosterTarget(d,p).available);assert(d.rosters[p.code]?.players?.length);assert(fs.existsSync(require('node:path').join(__dirname,'..',p.rosterUrl)));}
const f=dummy();assert(api.rosterTarget(f,'NEP').available);f.structure.roster.mode='none';assert(!api.rosterTarget(f,'NEP').available);
f.structure.roster.mode='link-only';f.participants[0].url='/generic-team.html';assert(!api.rosterTarget(f,'NEP').available,'generic team URL is not a roster');
for(const bad of ['javascript:alert(1)','data:text/html,hi','ftp://example.org','']){f.participants[0].rosterUrl=bad;assert(!api.rosterTarget(f,'NEP').available);}
assert(!api.rosterTarget(f,'UNKNOWN').available);
const before=JSON.stringify(d.standings.rows.map(r=>[r.setRatio,r.pointRatio]));api.normalize(d);assert.equal(JSON.stringify(d.standings.rows.map(r=>[r.setRatio,r.pointRatio])),before);
console.log('PASS team identity, 116 country+timezone local times, 284 embedded roster players, 18 roster destinations, full/link-only/none and unchanged ratios');
