'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require(process.env.KVL_JSDOM_PATH||'jsdom');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const html=read('national-team-history.html');
const script=read('assets/js/national-team-history.js');
const initialSources=new Map();

async function page(search='?scope=age'){
  const dom=new JSDOM(html,{url:'https://kvolleylab.com/national-team-history.html'+search,runScripts:'outside-only',pretendToBeVisual:true});
  const w=dom.window; const paths=[];
  w.HTMLElement.prototype.scrollIntoView=function(){};
  w.fetch=async target=>{
    const p=String(target).split('?')[0].replace(/^\//,'');
    paths.push(p);
    const full=path.resolve(root,p);
    if(!full.startsWith(root+path.sep)||!fs.existsSync(full))return {ok:false,status:404};
    const raw=read(p);
    if(!initialSources.has(p))initialSources.set(p,raw);
    return {ok:true,json:async()=>JSON.parse(raw)};
  };
  w.eval(script);
  for(let i=0;i<100;i++){
    if(w.document.querySelectorAll('.event-card').length||w.document.querySelector('#eventList .empty'))break;
    await new Promise(resolve=>setTimeout(resolve,10));
  }
  assert(!w.document.querySelector('#eventList .empty')?.textContent.includes('불러오지 못했습니다'),'History must fetch known local records successfully');
  return {w,doc:w.document,paths,close:()=>w.close()};
}
test('sidebar is only home, roadmap, age; existing senior links lead to built roadmap',()=>{
  const sidebar=read('assets/js/kvl-global-sidebar-v1.js');
  const nav=sidebar.slice(sidebar.indexOf("group('national'"),sidebar.indexOf("group('domestic'"));
  assert(nav.includes("national-team.html"));
  assert(nav.includes("olympic-roadmap.html"));
  assert(nav.includes("national-team-history.html?scope=age"));
  assert(!nav.includes("national-senior"));
  assert(!nav.includes("national-team-history.html?scope=senior"));
  const home=read('national-team.html');
  assert(home.includes('성인 대표팀 역대 기록'));
  assert(home.includes('href="olympic-roadmap.html"'));
  assert(read('assets/js/national-team-home-v2.js').includes('href="${origin}olympic-roadmap.html"'));
  assert(read('assets/js/unified-nav.js').includes('20261127-national-age-v1'));
});
test('age view loads existing history, maintains deep links, U23 and age gender selectors',async()=>{
  const s=await page('?scope=age');
  try{
    assert(s.doc.body.classList.contains('nt-age-mode'));
    assert(s.doc.querySelectorAll('.event-card').length>=20,'Historical records should not disappear');
    assert(s.doc.querySelector('#ageLevelTabs button[data-level="U23"]'));
    assert.equal(s.doc.querySelector('[data-age-gender="men"]').getAttribute('aria-pressed'),'true');
    assert.equal(s.doc.querySelector('[data-age-gender="women"]').getAttribute('aria-pressed'),'false');
    assert(!s.doc.querySelector('#ageGenderSwitch').hidden);
    assert([...s.doc.querySelectorAll('.event-card .eyebrow')].some(x=>x.textContent.includes('U23')));
    assert.equal(s.doc.querySelector('#historyBreadcrumbCurrent').textContent,'연령별 대표팀');
    assert(s.paths.includes('data/national/national_team_context_v1.json'),'Historical context must preserve cancelled and nonparticipation events');
    const roster=s.doc.querySelector('.nt-age-roster-details');
    assert(roster&&!roster.open,'Long rosters must be collapsed by default');
    roster.querySelector('summary').click();
    assert(roster.open,'Roster must open with keyboard/clickable summary');
    assert(roster.querySelector('th:nth-child(6)').textContent==='당시 소속');
  }finally{s.close();}
});
test('age tabs filter URL and do not duplicate player snapshots',async()=>{
  const s=await page('?scope=age');
  try{
    s.doc.querySelector('#ageLevelTabs [data-level="U23"]').click();
    const cards=[...s.doc.querySelectorAll('.event-card')];
    assert(cards.length>=1);
    assert(cards.every(x=>x.querySelector('.eyebrow').textContent.includes('U23')));
    assert.equal(new URL(s.w.location.href).searchParams.get('level'),'U23');
    s.doc.querySelector('#ageLevelTabs [data-level="all"]').click();
    const rows=[...s.doc.querySelectorAll('.event-card')];
    for(const card of rows){
      const seen=new Set();
      for(const row of card.querySelectorAll('tbody tr')){
        const cells=row.querySelectorAll('td');
        const k=cells[1].textContent.replace(/\s+C$/,'').trim()+'|'+cells[2].textContent.trim();
        assert(!seen.has(k),'Duplicate roster display for '+card.dataset.eventId+': '+k);
        seen.add(k);
      }
    }
    assert(s.doc.querySelectorAll('.event-card').length>=20);
  }finally{s.close();}
});
test('women tab shows unbuilt-data state and cannot expose men records; return restores men',async()=>{
  const s=await page('?scope=age');
  try{
    s.doc.querySelector('#ageLevelTabs [data-level="U23"]').click();
    s.doc.querySelector('[data-age-gender="women"]').click();
    assert.equal(s.doc.querySelector('#ageLevelTabs [data-level="all"]').getAttribute('aria-pressed'),'true');
    assert.equal(new URL(s.w.location.href).searchParams.has('level'),false);
    assert.equal(s.doc.querySelectorAll('.event-card').length,0);
    assert(s.doc.querySelector('#ageGenderNotice').hidden===false);
    assert(s.doc.querySelector('#eventList .empty').textContent.includes('미출전'));
    assert.equal(s.doc.querySelector('h1').textContent,'대한민국 연령별 대표팀');
    assert.equal(s.doc.querySelector('[data-age-gender="women"]').getAttribute('aria-pressed'),'true');
    assert.equal(new URL(s.w.location.href).searchParams.get('gender'),'women');
    assert(s.doc.querySelector('#cohortCta').hidden);
    s.doc.querySelector('[data-age-gender="men"]').click();
    assert(s.doc.querySelectorAll('.event-card').length>=20);
    assert.equal(new URL(s.w.location.href).searchParams.has('gender'),false);
    assert(s.doc.querySelector('#ageGenderNotice').hidden,'Return to men must hide the women-only notice');
    assert(s.doc.querySelector('#yearFilter').options.length>1);
  }finally{s.close();}
});
test('event deep link opens exact event, retains confirmed result, and data sources are never mutated',async()=>{
  const event='KVL-NT-KOR-M-U21-2025-FIVB';
  const s=await page('?scope=age&event='+event);
  try{
    const card=s.doc.querySelector('[data-event-id="'+event+'"]');
    assert(card,'Known event must render');
    assert(card.classList.contains('is-target'),'Deep linked event must be highlighted');
    assert(card.querySelector('details')?.open,'Deep linked roster must expand automatically');
    assert(card.querySelector('.result-badge').textContent.includes('12위'),'Official result must be preserved');
    assert.equal(s.doc.querySelector('#yearFilter').value,'2025');
    assert.equal(s.doc.querySelector('#ageLevelTabs [data-level="U21"]').getAttribute('aria-pressed'),'true');
    for(const [p,raw] of initialSources)assert.equal(read(p),raw,'Viewing page must not rewrite '+p);
  }finally{s.close();}
});
test('age CSS is scoped and mobile roster uses stacked view rather than 690px scrolling',()=>{
  const css=read('assets/css/national-age-history-v1.css');
  assert(css.includes('body.nt-age-mode'));
  assert(css.includes('@media(max-width:700px)'));
  assert(css.includes('grid-template-areas:"number player position"'));
  assert(css.includes('overflow:visible'));
  assert(html.includes('20261127-gender-parity-v1'));
});

test('national ID-link status observer is idempotent when roster DOM does not change',()=>{
  const status=read('assets/js/national-player-link-status-v1.js');
  assert(status.includes("if(row.querySelector('b')?.textContent!==String(queue.size)+'명')"));
  assert(status.includes('if(summary.textContent!==next)summary.textContent=next;'));
  assert(html.includes('20261127-observer-v1'));
  assert(read('player-cohort.html').includes('20261127-observer-v1'));
});

test('approved HERO is an accessible live link over the original reference image, using exact KVL media canvases',()=>{
 const html=read('national-team-history.html');
 const css=read('assets/css/national-age-history-v1.css');
 const pc=read('assets/img/national-team/age-hero-approved-pc-v1.svg');
 const mobile=read('assets/img/national-team/age-hero-approved-mobile-v1.svg');
 assert(html.includes('id="ageHero"'));
 assert(html.includes('href="#ageLevelTabs"'));
 assert(html.includes('class="kvl-age-hero-action"'));
 assert.match(pc,/width="2108" height="406"/);
 assert.match(pc,/<svg[^>]+preserveAspectRatio="none"/,'PC HERO must not letterbox inside actual card');
 assert.match(mobile,/width="1258" height="406"/);
 assert.match(mobile,/<svg[^>]+preserveAspectRatio="none"/);
 assert(pc.includes('data:image/webp;base64,'));
 assert(mobile.includes('data:image/webp;base64,'));
 assert(css.includes('aspect-ratio:1197 / 304'),'Desktop should use approved source ratio, without cropping title');
 assert(css.includes('object-fit:fill'),'Desktop should display the entire reference composition');
 assert(css.includes('object-position:right center'),'Mobile should prioritize Korean player/flag');
 assert(css.includes('body.nt-age-mode .age-level-tabs button.active'));
 assert(css.includes('kvl-age-hero-action:focus-visible'));
});

test('gender theme follows the same navy/rose tokens and flat switch as national-team home',async()=>{
  const homeCss=read('assets/css/national-team-home-v2.css');
  const ageCss=read('assets/css/national-age-history-v1.css');
  assert.match(homeCss,/--team:#234e83;--team-soft:#edf4fb/,'National home defines navy men');
  assert.match(homeCss,/--team:#8e315e;--team-soft:#fff1f6/,'National home defines rose women');
  assert(ageCss.includes('--team:#234e83;--team-soft:#edf4fb'));
  assert(ageCss.includes('--team:#8e315e;--team-soft:#fff1f6'));
  assert(ageCss.includes('background:var(--team)!important'));
  assert(ageCss.includes('content:none!important'),'Gender glyphs must not replace shared control');
  const s=await page('?scope=age&gender=women');
  try{
    assert.equal(s.doc.body.dataset.gender,'women');
    assert.equal(s.doc.querySelector('[data-age-gender=women]').getAttribute('aria-pressed'),'true');
    assert.equal(s.doc.querySelector('#ageGenderNotice').hidden,false);
    assert.equal(s.doc.querySelectorAll('.event-card').length,0,'Unbuilt women data stays empty');
    s.doc.querySelector('[data-age-gender=men]').click();
    assert.equal(s.doc.body.dataset.gender,'men');
    assert.equal(s.doc.querySelector('[data-age-gender=men]').getAttribute('aria-pressed'),'true');
    assert.equal(s.doc.querySelectorAll('.event-card').length>=20,true);
  } finally {s.close();}
});
