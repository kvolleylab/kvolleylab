'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const parse=name=>JSON.parse(read(name));
const configApi=require('../assets/js/kvl-competition-config-v2.js');
const dataApi=require('../assets/js/kvl-competition-data-v2.js');
const presenters=read('assets/js/kvl-domestic-home-v2.js');
const components=read('assets/js/kvl-competition-components-v2.js');
const theme=read('assets/js/kvl-competition-template-v2.js');
const css=read('assets/css/kvl-domestic-home-v2.css');
const engine=read('competition-engine.html');
const expected={
  men:{
    champion:'KAL',runner:'HDC',third:['WRC','KEP'],
    finalSets:[[26,24],[21,25],[25,23],[25,21]],
    semis:[
      ['KOVOCUP26-22','KAL','WRC',3,0,[[25,22],[37,35],[25,16]]],
      ['KOVOCUP26-23','KEP','HDC',1,3,[[25,18],[20,25],[15,25],[17,25]]]
    ]
  },
  women:{champion:'GSC',runner:'KEX',third:['HPS','IBK']}
};
assert.match(presenters,/\['domestic','pro'\]\.includes/,'domestic template should be opt-in for pro');
assert.match(presenters,/const singleVenue=arenas\.length===1/,'single arena should be detected from match venues');
assert.match(presenters,/const venueTitle=singleVenue\?\(d\.venueSecondary\|\|arenas\[0\]\)/,'single venue card must show arena');
assert.match(presenters,/rankText=r=>/,'tied placements must be labeled');
assert.match(presenters,/kvl-pro-cup-domestic-v2/,'Cup style should reuse shared presenter');
assert.match(components,/d\.structure\?\.roster\?\.allowPendingSelect===true/,'pending source must still allow roster card selection');
assert.match(components,/rosterPendingLabel\|\|/,'unverified player lists must be labeled');
assert.match(theme,/presentationThemeFamily==='domestic'/,'common UI theme may vary without changing canon family');
assert.match(css,/Shared PRO Cup presentation \(domestic-home-v2\)/);
assert.match(css,/grid-template-columns:minmax\(0,1fr\) 62px minmax\(0,1fr\)/,'score center must be fixed and symmetric');
assert.match(css,/color:#4b5563!important/,'score colors stay neutral');
assert.match(css,/--kvl-hero-image-mobile/,'original mobile Hero must be used');
assert.match(css,/background-size:100% 100%,contain!important/,'Hero must never crop');
assert.match(engine,/kvl-domestic-home-v2\.js/);
for(const gender of ['men','women']){
  const base='data/competitions/kovo-cup-'+gender+'-2026/';
  const conf=parse(base+'config.json'),data=parse(base+'data.json');
  assert.equal(conf.competition.competitionFamily,'pro','canonical competition family must remain pro');
  assert.equal(conf.structure.presentation,'domestic-home-v2');
  assert.equal(conf.structure.presentationThemeFamily,'domestic');
  assert.equal(conf.structure.presentationCategory,'pro-cup');
  assert.equal(conf.structure.roster.mode,'full');
  assert.equal(conf.structure.roster.layout,'domestic-snapshot');
  assert.equal(conf.structure.roster.allowPendingSelect,true);
  assert.equal(conf.structure.participants.linkMode,'team-roster');
  assert.equal(conf.structure.overviewTeamCount,7);
  assert.equal(data.status,'completed');
  assert.equal(data.matches.length,12);
  assert.equal(data.matches.filter(x=>x.score).length,12);
  assert.equal(data.participants.length,7);
  assert.match(data.rosterPendingLabel,/검수/);
  const assembled=configApi.assemble(conf,data,{
    slug:conf.slug,
    canonical:'https://kvolleylab.com/competition-engine.html?competition='+conf.slug
  });
  assert.deepEqual(dataApi.validate(assembled,{production:true}),[],gender+' production contract');
  for(const p of data.participants){
    assert(p.logo&&fs.existsSync(path.join(root,p.logo.slice(1))),gender+': logo for '+p.code);
  }
  for(const asset of ['pcImage','mobileImage']){
    assert(conf.hero[asset]&&fs.existsSync(path.join(root,conf.hero[asset].split('?')[0].slice(1))),
      gender+': original '+asset+' missing');
  }
  for(const match of data.matches){
    const scores=match.score.sets;
    assert.equal(scores.length,match.score.home+match.score.away,'missing final points '+match.id);
    assert.equal(scores.filter(s=>s.home>s.away).length,match.score.home,'home sets '+match.id);
    assert.equal(scores.filter(s=>s.away>s.home).length,match.score.away,'away sets '+match.id);
  }
  const ranks=data.finalRanking;
  assert.equal(ranks.find(r=>r.rank===1).code,expected[gender].champion);
  assert.equal(ranks.find(r=>r.rank===2).code,expected[gender].runner);
  assert.deepEqual(ranks.filter(r=>r.rank===3).map(r=>r.code),expected[gender].third);
  assert(ranks.filter(r=>r.rank===3).every(r=>r.result==='공동 3위'&&r.confirmed));
  if(gender==='men'){
    const f=data.matches.find(m=>m.id==='KOVOCUP26-24');
    assert.equal(f.home.code,'KAL');assert.equal(f.away.code,'HDC');
    assert.deepEqual(f.score.sets.map(s=>[s.home,s.away]),expected.men.finalSets);
    for(const [id,h,a,hs,as,sets] of expected.men.semis){
      const m=data.matches.find(x=>x.id===id);
      assert.equal(m.home.code,h);assert.equal(m.away.code,a);
      assert.equal(m.score.home,hs);assert.equal(m.score.away,as);
      assert.deepEqual(m.score.sets.map(s=>[s.home,s.away]),sets);
    }
  }
}
for(const gender of ['men','women']){
 const base='data/competitions/v-league-'+gender+'-2026-27/';
 const config=parse(base+'config.json'),data=parse(base+'data.json');
 assert.equal(config.structure.roster.mode,'full');
 assert.equal(config.structure.roster.layout,'domestic-snapshot');
 assert.equal(config.structure.roster.allowPendingSelect,true);
 assert.equal(config.structure.participants.linkMode,'team-roster');
 assert.match(data.rosterPendingLabel,/검수/);
 assert.equal(config.competition.competitionFamily,'pro');
 assert.equal(data.matches.length,126);
 assert(!data.rosters||Object.values(data.rosters).every(r=>!r.players||Array.isArray(r.players)),
   'unverified pro rosters must never be invented');
}
console.log('PASS: Cup women/men validated finals, tied 3rd, venue, shared domestic renderer, Hero, V-League roster gates');
