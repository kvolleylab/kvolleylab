'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const calendar=JSON.parse(fs.readFileSync(path.join(root,'data/calendar/2026-competition-periods.json'),'utf8'));
const genders=JSON.parse(fs.readFileSync(path.join(root,'data/calendar/2026-competition-genders.json'),'utf8'));
const engine=fs.readFileSync(path.join(root,'assets/js/competition-calendar-gender-v1.js'),'utf8');

function idsFromRendered(html){
  return calendar.events.filter(e=>html.includes('aria-label="'+e.title+' ')).map(e=>e.id);
}
async function mount(query='',mapReady=true){
  const node={innerHTML:''};
  let contents='',cache=new Map();
  const controls={
    get innerHTML(){return contents},
    set innerHTML(value){contents=value;cache=new Map()},
    querySelectorAll(selector){
      const key=selector==='[data-gender]'?'gender':selector==='[data-filter]'?'filter':null;
      if(!key)return[];
      return [...contents.matchAll(new RegExp('data-'+key+'="([^"]+)"','g'))].map(match=>{
        const id=key+':'+match[1];
        if(!cache.has(id))cache.set(id,{dataset:{[key]:match[1]},onclick:null});
        return cache.get(id);
      });
    },
    querySelector(){return null}
  };
  const document={
    getElementById(id){return id==='competitionCalendar'?node:id==='competitionCalendarControls'?controls:null},
    querySelectorAll(){return[]},
    querySelector(){return null}
  };
  let currentUrl='https://kvolleylab.com/competition-calendar-gender-prototype.html?view=year&year=2026'+query;
  const location={href:currentUrl,pathname:'/competition-calendar-gender-prototype.html',search:new URL(currentUrl).search};
  const history={replaceState(a,b,url){currentUrl=String(url);location.href=currentUrl}};
  const window={matchMedia:()=>({matches:false}),addEventListener(){},scrollTo(){}};
  const fetch=async url=>url.includes('competition-periods.json')
    ?{ok:true,json:async()=>calendar}
    :url.includes('competition-genders.json')
      ?{ok:mapReady,json:async()=>genders}
      :Promise.reject(new Error('Unexpected request: '+url));
  vm.runInNewContext(engine,{document,location,window,fetch,history,URL,URLSearchParams,
    navigator:{clipboard:{writeText:async()=>{}}},requestAnimationFrame:()=>{},setTimeout:()=>{},
    clearTimeout:()=>{},prompt:()=>{},console});
  for(let i=0;i<40;i++)await Promise.resolve();
  assert.ok(node.innerHTML.includes('cc-year-grid')||node.innerHTML.includes('cc-month-layout'),'calendar rendered');
  return{
    node,controls,location,
    ids:()=>idsFromRendered(node.innerHTML),
    click(type,value){
      const b=controls.querySelectorAll('[data-'+type+']').find(x=>x.dataset[type]===value);
      assert.ok(b&&typeof b.onclick==='function',type+':'+value+' is bound');
      b.onclick();
    }
  };
}

test('classification covers every registered 2026 competition exactly once',()=>{
  assert.equal(calendar.events.length,26);
  assert.deepEqual(Object.keys(genders.events).sort(),calendar.events.map(e=>e.id).sort());
  const rows=Object.values(genders.events);
  for(const x of rows){
    assert.ok(x.genders.length>0&&x.genders.length<=2);
    assert.equal(new Set(x.genders).size,x.genders.length);
    assert.ok(x.genders.every(g=>['men','women'].includes(g)));
  }
  assert.equal(rows.filter(x=>x.genders.includes('men')).length,18);
  assert.equal(rows.filter(x=>x.genders.includes('women')).length,16);
  assert.equal(rows.filter(x=>x.genders.length===2).length,8);
});

test('all / men / women filters preserve mixed university and school events without duplicating All',async()=>{
  const page=await mount();
  assert.equal(page.ids().length,26);
  page.click('gender','men');
  assert.equal(page.ids().length,18);
  assert.ok(page.ids().includes('goseong-university-2026'));
  assert.ok(page.ids().includes('ibk-middle-high-2026'));
  assert.ok(!page.ids().includes('vnl-women-2026'));
  page.click('filter','domestic');
  assert.equal(page.ids().length,8);
  assert.match(page.location.href,/gender=men/);
  assert.match(page.location.href,/category=domestic/);
  page.click('gender','women');
  assert.equal(page.ids().length,8);
  page.click('filter','all');
  assert.equal(page.ids().length,16);
  assert.ok(page.ids().includes('danyang-university-2026'));
  assert.ok(!page.ids().includes('vnl-men-2026'));
  page.click('gender','all');
  assert.equal(page.ids().length,26);
});

test('yearly and monthly navigation carries gender in URL',async()=>{
  const annual=await mount('&gender=men');
  assert.match(annual.node.innerHTML,/gender=men/);
  assert.match(annual.node.innerHTML,/competition-calendar-gender-prototype\.html/);
  const month=await mount('&view=month&month=8&gender=women');
  assert.match(month.node.innerHTML,/cc-month-layout/);
  assert.match(month.node.innerHTML,/남녀부 공동 개최/);
  assert.match(month.node.innerHTML,/gender=women/);
});

test('missing metadata fails safe: full calendar and visible warning',async()=>{
  const page=await mount('&gender=men',false);
  assert.equal(page.ids().length,26);
  assert.match(page.controls.innerHTML,/성별 분류 자료를 불러오지 못해/);
  assert.doesNotMatch(page.controls.innerHTML,/data-gender="men"/);
});

test('production file remains Home-width with real data-driven renderer import',()=>{
  const prod=fs.readFileSync(path.join(root,'competition-calendar.html'),'utf8');
  assert.match(prod,/max-width:1180px/);
  assert.match(prod,/id="competitionCalendarControls"/);
  assert.match(prod,/id="competitionCalendar"/);
});
