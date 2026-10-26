const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require(process.env.KVL_JSDOM_PATH||'jsdom'),root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const contract=require('../assets/js/kvl-competition-config-v2.js');
function setup(slug,{now}={}){const config=JSON.parse(read(`data/competitions/${slug}/config.json`)),source=JSON.parse(read(`data/competitions/${slug}/data.json`));const raw=contract.assemble(config,source,{slug,canonical:`https://kvolleylab.com/competition-engine.html?competition=${slug}`});const dom=new JSDOM('<body class="kvl1180-prototype kvl-competition-template-v2"><main data-kvl-shell></main></body>',{url:`https://kvolleylab.com/competition-engine.html?competition=${slug}`,runScripts:'outside-only',pretendToBeVisual:true});const w=dom.window;if(now)w.Date.now=()=>Date.parse(now);w.KVL_COMPETITION_PAGE_V2={deferRender:true};w.matchMedia=()=>({matches:false});w.HTMLElement.prototype.scrollIntoView=()=>{};for(const name of ['data','shell','template','components'])w.eval(read(`assets/js/kvl-competition-${name}-v2.js`));assert.deepEqual([...w.KVLCompetitionDataV2.validate(raw,{production:true})],[]);w.KVL_COMPETITION_V2_DATA=w.KVLCompetitionDataV2.normalize(raw);w.KVLCompetitionShellV2.ensureShell();w.KVLCompetitionTemplateV2.apply();w.KVLCompetitionComponentsV2.render();w.eval(read('assets/js/kvl-domestic-home-v2.js'));return {dom,w,d:w.KVL_COMPETITION_V2_DATA};}
for(const slug of ['university-goseong-men-2026','university-goseong-women-2026','university-danyang-men-2026','university-danyang-women-2026','university-league-men-2026','university-league-women-2026'])test(slug+' keeps canonical data, pool membership, roster routes and knockout structure',()=>{const {dom,w,d}=setup(slug);try{const doc=w.document,old=JSON.stringify(d),bracket=doc.querySelector('[data-kvl-component=knockout]').innerHTML,standings=doc.querySelector('[data-kvl-component=standings]').innerHTML,links=[...doc.querySelectorAll('[data-kvl-component=participants] a')].map(a=>a.href);assert.equal(w.KVLDomesticHomeV2.apply(d),true);assert.equal(JSON.stringify(d),old);assert.equal(doc.querySelector('[data-kvl-component=knockout]').innerHTML,bracket);assert.equal(doc.querySelector('[data-kvl-component=standings]').innerHTML,standings);assert.deepEqual([...doc.querySelectorAll('[data-kvl-component=participants] a')].map(a=>a.href),links);assert.equal(doc.querySelectorAll('.dv2-metric[href]').length,3);assert.equal(doc.querySelector('.dv2-metric').href.includes('view=rosters'),true);assert.equal(doc.querySelector('[data-dv2-date]')!==null,true);const input=doc.querySelector('.dv2-participant-search input');input.value='없는학교';input.dispatchEvent(new w.Event('input'));assert.equal([...doc.querySelectorAll('.kvl1180-participant-group')].every(g=>g.hidden),true);input.value='';input.dispatchEvent(new w.Event('input'));assert.equal(doc.querySelectorAll('[data-kvl-component=participants] [data-team-code]:not([hidden])').length,d.participants.length);w.KVLDomesticHomeV2.apply(d);assert.equal(doc.querySelectorAll('#dv2-day-dialog').length,1);}finally{w.close();}});
test('non-opted-in international engine is untouched',()=>{const {w,dom,d}=setup('vnl-men-2026');try{const before=w.document.body.innerHTML;assert.equal(w.KVLDomesticHomeV2.apply(d),false);assert.equal(w.document.body.innerHTML,before);}finally{w.close();}});

test('U-league keeps the single-league label, flat participants and full season calendar',()=>{const {w,d}=setup('university-league-women-2026');try{const doc=w.document;w.KVLDomesticHomeV2.apply(d);assert.equal(doc.querySelector('.kvl1180-tabs [data-view=groups] span').textContent,'리그순위');const metric=doc.querySelectorAll('.dv2-metric[href]')[2];assert.equal(new URL(metric.href).searchParams.get('view'),'groups');assert.match(metric.textContent,/리그순위6팀/);assert.equal(doc.querySelectorAll('.dv2-flat-participants').length,1);assert.equal([...doc.querySelectorAll('.dv2-team-tile small')].some(e=>e.textContent==='여대부조'),false);assert.match(doc.querySelector('.dv2-calendar-month').textContent,/09/);for(let i=0;i<6;i++)doc.querySelector('[data-dv2-month="-1"]').click();assert.match(doc.querySelector('.dv2-calendar-month').textContent,/03/);for(let i=0;i<6;i++)doc.querySelector('[data-dv2-month="1"]').click();assert.ok(doc.querySelector('[data-dv2-date="2026-09-17"]'));assert.equal(doc.querySelector('[data-dv2-month="1"]').disabled,true);assert.equal(doc.querySelector('.kvl1180-bracket-ladder').classList.contains('is-bracket-4'),true);}finally{w.close();}});

for(const [label,now,status,expected,extendEnd] of [
 ['before the season','2026-02-15T12:00:00Z','active','03',false],
 ['during the season including an off month','2026-07-15T12:00:00Z','active','07',false],
 ['KST month rollover','2026-06-30T15:30:00Z','active','07',false],
 ['final month in KST','2026-09-30T15:30:00Z','active','10',false],
 ['ended despite stale active status','2026-11-01T00:00:00Z','active','10',false],
 ['completed uses last match, not planned end','2026-11-01T00:00:00Z','completed','10',true]
])test('calendar opens the relevant month: '+label,()=>{
 const {w,d}=setup('university-league-men-2026',{now});
 try{d.status=status;if(extendEnd)d.dateLabel='2026-03-25 ~ 2026-11-30';w.KVLDomesticHomeV2.apply(d);assert.equal(w.document.querySelector('.dv2-calendar-month').textContent,expected+'월');}finally{w.close();}
});
function overallSnapshot(doc){return [...doc.querySelectorAll('.is-domestic-overall>.kvl1180-combined-table>.kvl1180-combined-row')].map(row=>({team:row.querySelector('[data-team-results]').dataset.teamResults,rank:row.querySelector('.kvl1180-combined-rank').textContent,stats:[...row.querySelectorAll('.kvl1180-combined-stat')].map(e=>e.textContent)}));}
test('U-league preliminary overall counts only 49 A/B games',()=>{
 const {w}=setup('university-league-men-2026');try{
  const rows=overallSnapshot(w.document);assert.equal(rows.length,15);assert.equal(rows.reduce((n,r)=>n+Number(r.stats[0]),0),98);
  assert.deepEqual(rows.slice(0,6).map(r=>r.team),['INHA','HANYANG','JOONGBU','SKKU','KYONGGI','HONGIK']);
  assert.deepEqual(rows[0].stats,['6','6','0','100.0%','9.000','1.333']);assert.deepEqual(rows[1].stats,['7','7','0','100.0%','7.000','1.263']);
  const a=new Set(['INHA','SKKU','HONGIK','KYUNGHEE','MYONGJI','KYUNGIL','HONAM']);for(const r of rows)assert.equal(Number(r.stats[0]),a.has(r.team)?6:7);
 }finally{w.close();}
});
test('later league and knockout results cannot change preliminary overall',()=>{
 const {w,d}=setup('university-league-men-2026');try{
  const before=w.document.querySelector('.is-domestic-overall').innerHTML;
  for(const m of d.matches.filter(m=>m.stage!=='예선'))m.score={home:0,away:3,sets:[{home:1,away:25},{home:2,away:25},{home:3,away:25}]};
  d.matches.push({id:'later-stage-test',date:'2026-10-06',stage:'6강리그',pool:'6강',home:{code:'INHA'},away:{code:'UNLISTED'},score:{home:3,away:0,sets:[]}});
  w.KVLCompetitionComponentsV2.render();assert.equal(w.document.querySelector('.is-domestic-overall').innerHTML,before);
 }finally{w.close();}
});
