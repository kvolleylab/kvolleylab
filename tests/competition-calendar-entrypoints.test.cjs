'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM,ResourceLoader,VirtualConsole}=require(process.env.KVL_JSDOM_PATH||'jsdom');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');

// Load scripts from the real HTML, rather than injecting dependencies that a page may omit.
class LocalScripts extends ResourceLoader{
 fetch(url,options){
  const u=new URL(url);
  if(u.origin!=='https://kvl.test'||options.element?.localName!=='script')return null;
  return Promise.resolve(fs.readFileSync(path.join(root,u.pathname)));
 }
}
async function openPage(route){
 const errors=[],virtualConsole=new VirtualConsole();virtualConsole.on('jsdomError',e=>errors.push(e.message));virtualConsole.on('error',e=>errors.push(String(e)));
 const dom=new JSDOM(read(route.split('?')[0]),{url:'https://kvl.test/'+route,runScripts:'dangerously',resources:new LocalScripts(),pretendToBeVisual:true,virtualConsole,beforeParse(w){
  w.Date.now=()=>Date.parse('2026-11-02T00:00:00Z');w.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});w.HTMLElement.prototype.scrollIntoView=()=>{};
  w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};
  w.fetch=async input=>{const u=new URL(input,w.location.href);assert.equal(u.origin,'https://kvl.test');const p=path.join(root,u.pathname);return {ok:fs.existsSync(p),status:fs.existsSync(p)?200:404,json:async()=>JSON.parse(fs.readFileSync(p,'utf8'))};};
 }});
 for(let n=0;n<300;n++){if(['ready','error'].includes(dom.window.document.body?.dataset.kvlRenderState))break;await new Promise(resolve=>setTimeout(resolve,10));}
 return {dom,w:dom.window,doc:dom.window.document,errors};
}

test('every HTML consumer of the domestic presentation declares its calendar dependencies in order',()=>{
 const consumers=fs.readdirSync(root).filter(p=>p.endsWith('.html')&&read(p).includes('src="/assets/js/kvl-domestic-home-v2.js'));
 assert(consumers.includes('university-competition.html'));assert(consumers.includes('university-competition-danyang.html'));
 for(const file of consumers){
  const html=read(file),domestic=html.indexOf('src="/assets/js/kvl-domestic-home-v2.js'),display=html.indexOf('src="/assets/js/kvl-calendar-display-v1.js'),widget=html.indexOf('src="/assets/js/kvl-match-calendar-v1.js');
  assert(display>=0&&display<widget&&widget<domestic,file+' calendar scripts missing or out of order');
  assert(html.includes('href="/assets/css/kvl-match-calendar-v1.css'),file+' calendar CSS missing');
 }
});

const routes=[
 ['university-competition.html','university-goseong-men-2026'],
 ['university-competition.html?gender=women','university-goseong-women-2026'],
 ['university-competition-danyang.html','university-danyang-men-2026'],
 ['university-competition-danyang.html?gender=women','university-danyang-women-2026'],
 ['national-sports-festival-2026.html','national-sports-festival-men-general-2026'],
 ['national-youth-sports-festival-2026.html','national-youth-sports-festival-men-u12-2026'],
 ['kovo-cup-domestic-template-prototype.html','kovo-cup-men-2026']
];
for(const [route,slug] of routes)test(route+' renders its calendar through the actual entrypoint and opens every game on a selected day',async()=>{
 const {w,doc,errors}=await openPage(route);try{
  assert.deepEqual(errors,[]);assert.equal(doc.body.dataset.kvlRenderState,'ready');assert.equal(new URL(w.location.href).searchParams.get('competition'),slug);
  const d=w.KVL_COMPETITION_V2_DATA,before=JSON.stringify(d),calendar=doc.querySelector('[data-dv2-calendar]');
  assert(calendar?.classList.contains('kvl-match-calendar'),'shared calendar mounted');assert.equal(calendar.querySelectorAll('.dv2-week span').length,7);
  const day=calendar.querySelector('[data-dv2-date]');assert(day,'match dates rendered');
  const matches=d.matches.filter(m=>m.date===day.dataset.dv2Date&&!m.notRequired&&m.status!=='not_required');
  assert.equal(day.querySelectorAll('.dv2-calendar-game').length,matches.length===1?1:0);
  if(matches.length>1)assert.equal(day.querySelector('.kvl-calendar-count').textContent,matches.length+'경기');
  day.click();assert.equal(doc.querySelector('#dv2-day-dialog').open,true);
  assert.deepEqual([...doc.querySelectorAll('[data-calendar-match]')].map(e=>e.dataset.calendarMatch).sort(),Array.from(matches,m=>m.id).sort());
  doc.querySelector('[data-dv2-close]').click();assert.equal(doc.querySelector('#dv2-day-dialog').open,false);
  const previous=calendar.querySelector('[data-dv2-month="-1"]');if(!previous.disabled){const month=calendar.querySelector('h3').textContent;previous.click();assert.notEqual(calendar.querySelector('h3').textContent,month);calendar.querySelector('[data-dv2-month="1"]').click();assert.equal(calendar.querySelector('h3').textContent,month);}
  assert.equal(JSON.stringify(d),before);const views=new Set([...doc.querySelectorAll('.kvl1180-tabs [data-view]')].map(e=>e.dataset.view));for(const view of ['overview','schedule','knockout','rosters','resources'])assert(views.has(view));if(slug.startsWith('university-'))assert(views.has('groups'));
 }finally{w.close();}
});

test('Goseong team deep link keeps the scoped calendar and expanded full match list',async()=>{
 const {w,doc,errors}=await openPage('university-competition.html?gender=men&view=team&team=HYU');try{
  assert.deepEqual(errors,[]);assert.equal(doc.body.dataset.kvlRenderState,'ready');
  const calendar=doc.querySelector('[data-dv2-team-calendar="HYU"] .kvl-match-calendar');assert(calendar?.querySelector('[data-dv2-date]'));
  assert.match(calendar.textContent,/한양대/);assert.equal(doc.querySelector('.dv2-team-match-list').open,true);
 }finally{w.close();}
});
