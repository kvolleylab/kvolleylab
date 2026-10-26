const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {JSDOM}=require(process.env.KVL_JSDOM_PATH||'jsdom'),root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8'),json=p=>JSON.parse(read(p));
const contract=require('../assets/js/kvl-competition-config-v2.js'),api=require('../assets/js/kvl-competition-data-v2.js'),migration=require('../scripts/migrate-school-competitions-v2.cjs');
const catalog=json('data/competitions/school-index-2026.json').competitions;
function setup(slug,view='overview'){
 const config=json(`data/competitions/${slug}/config.json`),source=json(`data/competitions/${slug}/data.json`),url=`https://kvolleylab.com/competition-engine.html?competition=${slug}&view=${view}`;
 const d=contract.assemble(config,source,{slug,canonical:url});assert.deepEqual(api.validate(d,{production:true}),[]);
 const dom=new JSDOM('<body class="kvl1180-prototype kvl-competition-template-v2"><main data-kvl-shell></main></body>',{url,runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window;
 w.KVL_COMPETITION_PAGE_V2={deferRender:true};w.matchMedia=()=>({matches:false});w.CSS={escape:v=>String(v)};w.HTMLElement.prototype.scrollIntoView=()=>{};
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};
 for(const name of ['data','shell','template','components'])w.eval(read(`assets/js/kvl-competition-${name}-v2.js`));
 w.KVL_COMPETITION_V2_DATA=w.KVLCompetitionDataV2.normalize(d);w.KVLCompetitionShellV2.ensureShell();w.KVLCompetitionTemplateV2.apply();w.KVLCompetitionComponentsV2.render();w.eval(read('assets/js/kvl-domestic-home-v2.js'));w.KVLDomesticHomeV2.apply(w.KVL_COMPETITION_V2_DATA);
 return {w,doc:w.document,d:w.KVL_COMPETITION_V2_DATA};
}
for(const c of catalog)for(const [key,label] of migration.divisions)test(c.enginePrefix+' '+key+' renders the common template and preserves division through tab/record navigation',()=>{
 const slug=c.enginePrefix+'-'+key,{w,doc,d}=setup(slug);try{
  assert.ok(doc.body.classList.contains('kvl-domestic-home-v2'));assert.equal(doc.body.dataset.kvlGender,key.endsWith('women')?'women':'men');
  assert.equal(doc.querySelector('.kvl1180-gender .is-active').textContent,label);assert.equal(doc.querySelectorAll('[data-division-link]').length,4);
  assert.match(doc.querySelector('.dv2-utility').textContent,/중·고/);assert.equal(doc.querySelector('.dv2-calendar-month').textContent,d.matches.map(m=>m.date).sort().at(-1).slice(5,7)+'월');
  doc.querySelector('[data-view=knockout][href]').click();assert.equal(new URL(w.location.href).searchParams.get('view'),'knockout');
  for(const a of doc.querySelectorAll('[data-division-link]'))assert.equal(new URL(a.href).searchParams.get('view'),'knockout');
  doc.querySelector('[data-view=rosters][href]').click();assert.equal(doc.querySelectorAll('.kvl1180-participant-button').length,d.participants.length);
  for(const group of doc.querySelectorAll('.kvl1180-participant-buttons')){const names=[...group.querySelectorAll('strong')].map(e=>e.textContent);assert.deepEqual(names,[...names].sort((a,b)=>a.localeCompare(b,'ko')));}
  const input=doc.querySelector('.dv2-participant-search input');input.value='없는학교';input.dispatchEvent(new w.Event('input'));assert.ok([...doc.querySelectorAll('.kvl1180-participant-group')].every(g=>g.hidden));input.value='';input.dispatchEvent(new w.Event('input'));
  const teamURL=doc.querySelector('.kvl1180-participant-button').href;assert.equal(new URL(teamURL).searchParams.get('view'),'team');w.history.replaceState(null,'',teamURL);w.dispatchEvent(new w.PopStateEvent('popstate'));w.KVLDomesticHomeV2.apply(d);assert.equal(new URL(w.location.href).searchParams.get('view'),'team');assert.ok(doc.querySelector('[data-kvl-component=team-results] h2').textContent.includes('경기결과'));
  assert.equal(doc.querySelectorAll('a[href*="university-team"]').length,0);
  doc.querySelector('[data-view=overview][href]').click();doc.querySelector('[data-dv2-date]').click();assert.equal(doc.querySelector('dialog').open,true);assert.ok(doc.querySelectorAll('.dv2-day-match').length>0);doc.querySelector('[data-dv2-close]').click();assert.equal(doc.querySelector('dialog').open,false);
  if(c.enginePrefix==='cbs-2026'){assert.match(doc.querySelector('.dv2-record-note').textContent,/검수 중/);assert.equal(doc.querySelectorAll('.kvl1180-bracket-ladder').length,0);}
  else{assert.equal(doc.querySelectorAll('.kvl1180-bracket-ladder').length,1);assert.equal(doc.querySelectorAll('#knockout .dv2-trophy').length,4);assert.equal(doc.querySelectorAll('.kvl1180-combined-block.is-domestic-overall').length,1);
   const overall=doc.querySelector('.is-domestic-overall');assert.equal(overall.querySelector('h3').textContent,label+' 예선 종합순위');assert.match(overall.textContent,/조별 진출 순위와 별개인 K-Volley Lab 산출 순위/);
   const prelim=d.matches.filter(m=>['예선','사전경기'].includes(m.stage)),rows=[...overall.querySelectorAll('.is-domestic-overall-row')];assert.equal(rows.length,d.standings.pools.flatMap(p=>p.rows).length);
   for(const row of rows){const code=new URL(row.querySelector('a').href).searchParams.get('team'),games=prelim.filter(m=>[m.home.code,m.away.code].includes(code)),cells=[...row.children];assert.equal(Number(cells[3].textContent),games.length,slug+' '+code+' preliminary games');const wins=games.filter(m=>m.score&&(m.score.home>m.score.away?m.home.code:m.away.code)===code).length;assert.equal(Number(cells[4].textContent),wins);assert.equal(Number(cells[5].textContent),games.length-wins);}
   const before=overall.outerHTML;d.matches=prelim;w.KVLCompetitionComponentsV2.render();assert.equal(doc.querySelector('.is-domestic-overall').outerHTML,before,'Removing knockout matches must not change preliminary standings');}
 }finally{w.close();}
});
for(const [name,id] of migration.definitions)test(name+' preserves all deployed match identities, scores, set points and connected knockout participants',()=>{
 const old=migration.legacy(name),all=migration.divisions.flatMap(([key])=>json(`data/competitions/school-${name}-2026-${key}/data.json`).matches);assert.equal(all.length,old.G.length);
 for(const g of old.G){const m=all.find(m=>m.id===g.id);assert.ok(m,g.id);assert.equal(`${m.score.home}-${m.score.away}`,g.score);assert.deepEqual((m.reportedSets||m.score.sets).map(s=>[s.home,s.away]),JSON.parse(JSON.stringify(g.sets.map(s=>s.split(/[:-]/).map(Number)))));assert.equal(m.stage,g.stage);assert.equal(m.date,g.date);if(m.reportedSets)assert.ok(m.scoreNote);}
 for(const [key] of migration.divisions){const d=json(`data/competitions/school-${name}-2026-${key}/data.json`),byId=new Map(d.matches.map(m=>[m.id,m]));for(const m of d.matches.filter(m=>['QF','SF'].includes(m.round))){const next=byId.get(m.nextMatchId),winner=m.score.home>m.score.away?m.home.code:m.away.code;assert.ok(next,`${m.id} next match`);assert.ok([next.home.code,next.away.code].includes(winner));}for(const p of d.standings.pools)for(const r of p.rows)assert.equal(d.participants.find(t=>t.code===r.team.code).group,p.id);}
});
test('old tournament routes preserve all four divisions and legacy tabs',()=>{
 const script=read('assets/js/kvl-school-competition-route-v2.js');for(const c of catalog)for(const [key,,division] of migration.divisions)for(const [view,target] of Object.entries({overview:'overview',results:'schedule',groups:'groups',standings:'knockout',teams:'rosters',sources:'resources'})){
  let redirected;const context={document:{currentScript:{dataset:{competition:c.enginePrefix}}},URL,URLSearchParams,location:{href:'https://kvolleylab.com/'+c.pagePath,search:'?'+new URLSearchParams({division,view}),replace:url=>redirected=new URL(url)},sessionStorage:{getItem:()=>null}};vm.runInNewContext(script,context);assert.equal(redirected.searchParams.get('competition'),c.enginePrefix+'-'+key);assert.equal(redirected.searchParams.get('view'),target);
 }
});
test('source-score conflicts remain visible without weakening the production validator',()=>{
 const {w,doc,d}=setup('school-spring-2026-middle-men','schedule');try{assert.equal(d.matches.filter(m=>m.reportedSets).length,2);assert.equal(doc.querySelectorAll('#schedule .kvl-score-note').length,2);const m=d.matches.find(m=>m.reportedSets);assert.ok(doc.querySelector(`[data-match-id="${m.id}"] .kvl1180-set-scores`).textContent.includes('25-13'));const invalid=JSON.parse(JSON.stringify(d));invalid.matches[0].score={home:0,away:2,sets:[{home:25,away:10}]};assert.ok(api.validate(invalid,{production:true}).some(x=>x.includes('disagree')));}finally{w.close();}
});
test('Samcheok retains the deployed A/B/C/D group order, not display-date sort order',()=>{
 const d=json('data/competitions/school-samcheok-2026-high-men/data.json');
 assert.deepEqual(d.participants.filter(t=>t.group==='A').map(t=>t.name),['경북사대부고','광주전자공고','울산스포츠과학고','제천산업고']);
 assert.deepEqual(d.participants.filter(t=>t.group==='D').map(t=>t.name),['남성고','송림고','영생고','천안고','현일고']);
});
test('hub summaries use the same records as all 24 detail views, with CBS partial status',()=>{
 let total=0;for(const c of catalog){let count=0;for(const [key] of migration.divisions){const d=json(`data/competitions/${c.enginePrefix}-${key}/data.json`);count+=d.matches.length;assert.deepEqual(c.divisionResults[key],d.finalRanking.map(r=>({rank:r.rank,team:r.team})));}assert.equal(c.gameCount,count);total+=count;}
 assert.equal(total,600);assert.equal(catalog.find(c=>c.enginePrefix==='cbs-2026').recordStatus,'partial');
});
