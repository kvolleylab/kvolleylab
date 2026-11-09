/* Data conservation checks for the two adapters and two unchanged V2 inputs. */
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),crypto=require('crypto');
const repo=path.resolve(__dirname,'../..'),out=process.argv[2]||path.join(__dirname,'dist');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8')),src=p=>read(path.join(repo,p));
const C=require(path.join(repo,'assets/js/kvl-competition-config-v2.js')),D=require(path.join(repo,'assets/js/kvl-competition-data-v2.js'));
const result=[];
for(const slug of fs.readdirSync(path.join(out,'prototype-data'))){
 const base=path.join(out,'prototype-data',slug),c=read(base+'/config.json'),d=read(base+'/data.json'),r=read(base+'/rosters.json');
 assert.deepEqual(C.validate(c),[]);const assembled=C.assemble(c,d,{slug,canonical:'https://preview.invalid/?competition='+slug});assembled.rosters=r;assert.deepEqual(D.validate(assembled),[]);
 assert.equal(new Set(d.matches.map(m=>m.id)).size,d.matches.length);
 assert.equal(d.finalRanking.length,d.participants.length);assert.equal(d.matchCount,d.matches.length);
 for(const m of d.matches){assert(d.participants.some(p=>p.code===m.home.code));assert(d.participants.some(p=>p.code===m.away.code));assert.equal(m.score.sets.length,m.score.home+m.score.away);}
 if(slug.startsWith('asian-games')){
  const old=src('data/competitions/'+slug+'/data.json');for(const k of ['matches','participants','standings','finalRanking'])assert.deepEqual(d[k],old[k],slug+' '+k);assert.deepEqual(r,src('data/competitions/'+slug+'/rosters.json'));
 }else if(slug==='avc-men-cup-2026'){
  const old=src('data/matches/avc-2026-calendar.json'),detail=src('data/competition/avc-men-cup-2026-results-detail.json'),players=src('data/competition/avc-men-cup-2026-men-rosters.json');
  assert.equal(c.competition.competitionId,old.competition_id);
  old.matches.forEach((m,i)=>{const n=d.matches[i];assert.equal(n.id,m.match_id);assert.equal(n.home.participantId,m.home_participant_id);assert.equal(n.away.participantId,m.away_participant_id);assert.equal(n.date,m.date);assert.equal(n.time,m.time);assert.equal(n.score.home,m.result.home_sets);assert.equal(n.score.away,m.result.away_sets);assert.deepEqual(n.score.sets.map(s=>s.home+'-'+s.away),detail.set_scores[m.official_match_id]);});
  players.teams.forEach(t=>{const p=d.participants.find(x=>x.participantId===t.participant_id);assert.equal(r[p.code].coach,t.coach);assert.equal(r[p.code].players.length,t.players.length);t.players.forEach((x,i)=>{const y=r[p.code].players[i];assert.equal(y.number,x.number);assert.equal(y.en,x.name);assert.equal(y.dob,x.dob);assert.equal(y.volleybox,x.volleybox_url);});});
  assert.equal(d.matches.filter(m=>m.round==='QF').length,0);assert.equal(d.matches.filter(m=>m.round==='SF').length,2);assert.equal(d.matches.filter(m=>m.placement).length,3);
 }else{
  const old=src('data/competitions/'+slug+'.json');assert.equal(c.competition.competitionId,old.competitionId);
  old.matches.forEach((m,i)=>{const n=d.matches[i];assert.equal(n.id,m.id);assert.equal(n.date,m.date);assert.equal(n.time,m.time);assert.equal(n.score.home,m.setsA);assert.equal(n.score.away,m.setsB);assert.deepEqual(n.score.sets.map(s=>[s.home,s.away]),m.sets);assert.equal(d.participants.find(p=>p.code===n.home.code).name,m.teamA);assert.equal(d.participants.find(p=>p.code===n.away.code).name,m.teamB);});
  for(const g of ['a','b','c'])for(const t of src('data/competitions/'+slug+'-rosters-'+g+'.json').teams){assert.equal(r[t.code].players.length,t.players.length);t.players.forEach((p,i)=>{const x=r[t.code].players[i];assert.equal(x.number,p.number);assert.equal(x.dob,p.birthDate);assert.equal(x.position,p.position);assert.equal(x.playerId,p.playerId);});}
 }
 result.push({slug,matches:d.matches.length,participants:d.participants.length,players:Object.values(r).reduce((n,x)=>n+x.players.length,0),status:'PASS'});
}
const original=fs.readFileSync(path.join(repo,'international-competition-avc-men-continental-2026.html'),'utf8'),fragment=read(path.join(out,'prototype-assets/continental-stakes.json'));assert(original.includes(fragment.html));assert.equal(crypto.createHash('sha256').update(fragment.html).digest('hex'),fragment.sourceSha256);
const provenance=read(path.join(out,'prototype-assets/provenance.json'));for(const [f,hash] of Object.entries(provenance.sharedEngineFiles)){assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(out,f))).digest('hex'),hash);}
console.log(JSON.stringify({status:'PASS',competitions:result,protectedFragment:'exact source HTML',sharedEngine:'unchanged'},null,2));
