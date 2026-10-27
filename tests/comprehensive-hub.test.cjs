const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require(process.env.KVL_JSDOM_PATH||'jsdom');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8'),json=p=>JSON.parse(read(p));
const contract=require('../assets/js/kvl-competition-config-v2.js'),api=require('../assets/js/kvl-competition-data-v2.js');
const index=json('data/competitions/comprehensive-index.json');
async function hub(fail=''){
 const dom=new JSDOM(read('comprehensive-competitions.html'),{url:'https://kvl.test/comprehensive-competitions.html',runScripts:'outside-only'}),w=dom.window;
 w.console.error=()=>{};w.fetch=async url=>({ok:!String(url).includes(fail||'__never__'),json:async()=>json(String(url).split('?')[0])});
 w.eval(read('assets/js/comprehensive-competitions-hub.js'));
 for(let i=0;i<20&&!w.document.querySelector('.univ-year-head')&&!w.document.querySelector('[role=alert]');i++)await new Promise(r=>setImmediate(r));
 return dom;
}
test('two event cards use all nine canonical division routes and the same podium source as detail pages',async()=>{
 const dom=await hub(),doc=dom.window.document;try{
 assert.equal(doc.querySelectorAll('.univ-record-card').length,2);assert.equal(doc.querySelectorAll('.univ-ranking-panel').length,9);assert.equal(doc.querySelectorAll('.univ-featured-card').length,2);
 assert.equal(doc.querySelectorAll('.dv2-trophy').length,36);assert.equal(doc.querySelectorAll('.trophy-3').length,18);
 for(const event of index.competitions){
  assert.ok(fs.existsSync(path.join(root,event.pagePath)));
  for(const slug of event.divisions){
   const config=json(`data/competitions/${slug}/config.json`),data=json(`data/competitions/${slug}/data.json`);
   const panel=[...doc.querySelectorAll('.univ-ranking-panel')].find(a=>new URL(a.href).searchParams.get('competition')===slug);assert.ok(panel);assert.equal(new URL(panel.href).pathname,'/'+event.pagePath);
   assert.deepEqual([...panel.querySelectorAll('.univ-rank-row strong')].map(n=>n.textContent),data.finalRanking.map(r=>r.team));
   assert.deepEqual([...panel.querySelectorAll('.comprehensive-region')].map(n=>n.textContent),data.finalRanking.map(r=>data.participants.find(t=>t.code===r.code).region));
   assert.ok(panel.classList.contains('is-'+config.competition.gender));assert.equal(config.structure.hubUrl,'comprehensive-competitions.html');
  }
  const featured=[...doc.querySelectorAll('.univ-featured-card')].find(a=>a.href.includes(event.pagePath));
  const selected=new URL(featured.href).searchParams.get('competition');
  assert.ok(featured.style.cssText.includes(json(`data/competitions/${selected}/config.json`).hero.mobileImage));
 }
 }finally{dom.window.close();}
});
test('year accordion opens and closes with matching accessible state; historical years have no invented results',async()=>{
 const dom=await hub(),doc=dom.window.document;try{
 for(const button of doc.querySelectorAll('.univ-year-head')){
  const target=doc.getElementById(button.getAttribute('aria-controls')),before=button.getAttribute('aria-expanded')==='true';assert.equal(target.hidden,!before);button.click();assert.equal(target.hidden,before);assert.equal(button.getAttribute('aria-expanded'),String(!before));button.click();
 }
 assert.equal(doc.querySelector('#records-2025 .univ-record-card'),null);assert.equal(doc.querySelector('#records-2024 .univ-record-card'),null);
 }finally{dom.window.close();}
});
test('a failed division fetch preserves other divisions and index failure has an explicit error',async()=>{
 const partial=await hub(index.competitions[1].divisions[0]);try{assert.equal(partial.window.document.querySelectorAll('a.univ-ranking-panel').length,8);assert.match(partial.window.document.querySelector('.univ-rank-empty').textContent,/불러오지 못했습니다/);}finally{partial.window.close();}
 const failed=await hub('comprehensive-index.json');try{assert.match(failed.window.document.querySelector('[role=alert]').textContent,/불러오지 못했습니다/);}finally{failed.window.close();}
});
for(const [key,count,champion] of [['men-u12',14,'금명초등학교'],['men-u15',15,'태릉중학교'],['women-u12',15,'수정초등학교'],['women-u15',15,'강릉해람중학교']])test(key+' official results, medal teams and every knockout progression agree',()=>{
 const slug=`national-youth-sports-festival-${key}-2026`,c=json(`data/competitions/${slug}/config.json`),s=json(`data/competitions/${slug}/data.json`),d=contract.assemble(c,s,{slug,canonical:`https://kvolleylab.com/national-youth-sports-festival-2026.html?competition=${slug}`});
 assert.deepEqual(api.validate(d,{production:true}),[]);assert.equal(s.participants.length,count);assert.equal(s.matches.length,count-1);assert.equal(s.champion,champion);assert.deepEqual(s.finalRanking.map(r=>r.rank),[1,2,3,3]);assert.equal(c.structure.presentation,'domestic-home-v2');assert.equal(c.structure.standings.mode,'none');
 const byCode=new Map(s.participants.map(t=>[t.code,t]));
 for(const m of s.matches){assert.ok(byCode.has(m.home.code)&&byCode.has(m.away.code));assert.equal(Math.max(m.score.home,m.score.away),2);assert.equal(m.score.sets.length,m.score.home+m.score.away);assert.match(m.sourceUrl,/meet.sports.or.kr\/junior/);m.score.sets.forEach((p,i)=>{const h=Math.max(p.home,p.away),l=Math.min(p.home,p.away),target=i===2?15:25;assert.ok(h===target&&l<=target-2||h>target&&h-l===2);});}
 const win=m=>m.score.home>m.score.away?m.home.code:m.away.code,lose=m=>m.score.home>m.score.away?m.away.code:m.home.code,final=s.matches.find(m=>m.round==='FINAL');
 assert.equal(s.finalRanking[0].code,win(final));assert.equal(s.finalRanking[1].code,lose(final));assert.deepEqual(s.finalRanking.filter(r=>r.rank===3).map(r=>r.code).sort(),s.matches.filter(m=>m.round==='SF').map(lose).sort());
 assert.equal(s.bracketRounds[0].slots.filter(s=>s.byeTeam).length,16-count);
});
test('comprehensive menu is active for hub and both detail routes while university navigation stays intact',()=>{
 for(const p of ['comprehensive-competitions.html','national-sports-festival-2026.html','national-youth-sports-festival-2026.html']){
  const dom=new JSDOM('<body></body>',{url:'https://kvl.test/'+p,runScripts:'outside-only'});try{const w=dom.window;w.matchMedia=()=>({matches:false,addEventListener(){}});w.eval(read('assets/js/kvl-global-sidebar-v1.js'));const a=w.document.querySelector('[href="comprehensive-competitions.html"]');assert.equal(a.getAttribute('aria-current'),'page');assert.ok(w.document.querySelector('[href="university-competitions.html"]'));}finally{dom.window.close();}
 }
});
