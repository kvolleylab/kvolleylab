/* Owned browser harness: tests the actual shared route, never a substitute renderer. */
(()=>{'use strict';
const $=id=>document.getElementById(id),views=['overview','schedule','groups','knockout','rosters','resources','team'],pause=ms=>new Promise(r=>setTimeout(r,ms));
async function inspect(o){
 const f=$('candidate');f.width=o.width;const u=new URL(o.fixture?'/tests/competition-page-v2-structure-engine-smoke.html':'/competition-engine.html',location.href);
 for(const [k,v] of Object.entries(o))if(!['width','fixture'].includes(k))u.searchParams.set(k,v);
 if(!o.fixture)u.searchParams.set('competition','vnl-men-2026');u.searchParams.set('ux','20260918-1');
 await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('load timeout')),20000);f.onload=()=>{clearTimeout(timer);resolve();};f.src=u.href;});
 const doc=f.contentDocument,win=doc.defaultView;
 for(let n=0;n<100;n++){if(doc.body.dataset.kvlRenderState==='ready'&&doc.querySelector('.kvl-global-sidebar'))break;await pause(100);}await doc.fonts.ready;await pause(100);
 const d=win.KVL_COMPETITION_V2_DATA,errors=[],visible=e=>e.getBoundingClientRect().height>0&&e.getBoundingClientRect().width>0;
 if(doc.body.dataset.kvlRenderState!=='ready')errors.push('render');
 const overflow=[...doc.querySelectorAll('main *')].filter(e=>{if(!visible(e)||e.closest('.kvl-shared-combined-mobile,.kvl1180-combined-table,.kvl1180-roster-table'))return false;const r=e.getBoundingClientRect();return r.left< -1||r.right>win.innerWidth+1;}).map(e=>e.className).slice(0,12);
 if(overflow.length||doc.documentElement.scrollWidth>win.innerWidth+1)errors.push('overflow');
 const cards=[...doc.querySelectorAll('.kvl1180-match-row')].filter(visible),setErrors=[],localErrors=[];
 for(const card of cards){const m=d.matches.find(m=>m.id===card.dataset.matchId),box=card.querySelector('.kvl1180-set-scores'),spans=[...box.children],expected=(m.score?.sets||[]).map(s=>s.home+'-'+s.away),rect=box.getBoundingClientRect();
  if(JSON.stringify(spans.map(e=>e.textContent))!==JSON.stringify(expected))setErrors.push(m.id+' missing points');
  if(spans.length&&spans.some(e=>Math.abs(e.getBoundingClientRect().top-spans[0].getBoundingClientRect().top)>1||e.getBoundingClientRect().right>rect.right+1||e.getBoundingClientRect().left<rect.left-1))setErrors.push(m.id+' wrap/clip');
  const label=win.KVLCompetitionDataV2.localTimeLabel(m),detail=card.querySelector('.kvl1180-match-detail').textContent;
  if(label&&!detail.includes(label)||!label&&detail.includes('현지'))localErrors.push(m.id);
  if(!m.score&&card.querySelector('.kvl1180-score').textContent!=='VS')errors.push('invented result');
 }
 if(setErrors.length)errors.push('set line');if(localErrors.length)errors.push('local time');
 const linkErrors=[];
 for(const a of [...doc.querySelectorAll('[data-team-results]')].filter(visible)){const url=new URL(a.href);if(url.searchParams.get('view')!=='team'||url.searchParams.get('team')!==a.dataset.teamResults||(!o.fixture&&url.searchParams.get('competition')!=='vnl-men-2026'))linkErrors.push(a.textContent);}
 if(['schedule','groups','knockout'].includes(o.view)&&d.status==='completed'&&!doc.querySelector(`[data-view="${o.view}"] [data-team-results]`))linkErrors.push('missing team links');
 if(linkErrors.length)errors.push('team links');
 if(o.view==='groups'&&(!doc.querySelector('[data-kvl-component="standings"]').textContent.includes('세트 득실비')||!doc.querySelector('[data-kvl-component="standings"]').textContent.includes('점수 득실비')))errors.push('ratio labels');
 const expectedTeam=d.participants.find(t=>t.code===o.team);
 if(o.view==='team'){
  const expected=d.matches.filter(m=>[m.home.code,m.away.code].includes(o.team));if(cards.length!==expected.length)errors.push('team match selection');
  if(!expectedTeam){if(!doc.querySelector('#team-results').textContent.includes('찾을 수 없습니다'))errors.push('unknown team');}
  else{const target=win.KVLCompetitionDataV2.rosterTarget(d,expectedTeam),cta=doc.querySelector('#team-results .kvl-team-roster-link');if(!cta||target.available!==cta.hasAttribute('href'))errors.push('roster CTA availability');}
 }
 for(const card of [...doc.querySelectorAll('.kvl1180-participant-button')].filter(visible)){
  const target=win.KVLCompetitionDataV2.rosterTarget(d,card.dataset.teamCode);if(target.available!==card.hasAttribute('href'))errors.push('participant roster availability');
  if(target.available&&target.mode==='full'){const url=new URL(card.href);if(url.searchParams.get('view')!=='rosters'||url.searchParams.get('team')!==card.dataset.teamCode||url.hash!=='#team-roster')errors.push('participant roster route');}
  if(target.available&&target.mode==='link-only'&&new URL(card.href).href!==new URL(target.url,win.location.href).href)errors.push('participant external roster');
 }
 const tabLinks=[...doc.querySelectorAll('.kvl1180-tabs a')];if(tabLinks.length!==6||tabLinks.some(a=>new URL(a.href).searchParams.has('team')||(!o.fixture&&new URL(a.href).searchParams.get('competition')!=='vnl-men-2026')))errors.push('tab context');
 if(doc.querySelectorAll('.kvl1180-tabs .is-active').length!==1)errors.push('active tab');
 const hero=doc.querySelector('.kvl1180-hero'),cs=win.getComputedStyle(hero),metrics={heroHeight:hero.getBoundingClientRect().height,heroBackground:cs.backgroundImage,theme:win.getComputedStyle(doc.body).getPropertyValue('--kvl-theme-hero-a').trim(),rowHeights:[...new Set(cards.map(e=>Math.round(e.getBoundingClientRect().height)))]};
 return {...o,pass:!errors.length,errors:[...new Set(errors)],overflow,setErrors,localErrors,linkErrors,matchCards:cards.length,setLengths:[...new Set(cards.map(e=>e.querySelector('.kvl1180-set-scores').children.length))],localTimes:cards.filter(e=>e.querySelector('.kvl1180-match-detail').textContent.includes('현지')).length,metrics};
}
async function run(cases){const results=[];try{for(const c of cases){$('status').textContent=`검사 ${results.length}/${cases.length}`;results.push(await inspect(c));$('report').textContent=JSON.stringify(results,null,2);}$('status').textContent=`완료 ${results.length} · PASS ${results.filter(r=>r.pass).length} · FAIL ${results.filter(r=>!r.pass).length}`;}catch(e){$('status').textContent=e.stack;}}
$('show').onclick=()=>run([{width:Number($('width').value),view:$('view').value,...($('view').value==='team'?{team:'JPN'}:{})}]);
$('vnl').onclick=()=>{const cases=[];for(const width of [1180,390,360]){for(const view of views)cases.push({width,view,...(view==='team'?{team:'JPN'}:{})});cases.push({width,view:'team',team:'POL'});cases.push({width,view:'team',team:'UNKNOWN'});}run(cases);};
$('regression').onclick=()=>{const cases=[];for(const width of [1180,390,360])for(const gender of ['men','women'])for(const status of ['upcoming','active','completed'])cases.push({fixture:true,width,gender,status,view:'team',team:'NEP'});for(const width of [1180,390,360])for(const roster of ['full','link-only','none'])for(const view of ['team','rosters'])cases.push({fixture:true,width,gender:'women',status:'completed',roster,view,team:'NEP',participants:'flat'});run(cases);};
})();
