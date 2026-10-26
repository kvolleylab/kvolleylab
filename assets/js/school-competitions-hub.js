(()=>{'use strict';
const route=new URLSearchParams(location.search);
if(route.get('division')!=='school')return;
const main=document.querySelector('main.dc-main');
if(!main)return;
document.body.classList.add('school-competitions-hub-page');
document.title='중·고 배구대회 | K-Volley Lab';
const css=document.createElement('link');css.rel='stylesheet';css.href='assets/css/school-competitions-hub-v2.css?v=20261024-1';document.head.appendChild(css);
main.id='app';main.className='school-hub-v2';
main.innerHTML="\n<div class=\"utility\"><div><a href=\"index.html\">홈</a><span>›</span><span>국내대회</span><span>›</span><b>중·고</b></div><a href=\"university-competitions.html\">대학대회 보기 ↗</a></div>\n\n<header class=\"school-hero\"><div class=\"hero-copy\"><p class=\"eyebrow\">KVL DOMESTIC · SCHOOL VOLLEYBALL</p><h1>한국 배구의 내일,<br><em>중·고 배구</em></h1><p class=\"hero-note\">전국의 코트에서 시작되는 다음 세대의 이야기.<br>대회 일정부터 부문별 최종순위까지 한눈에 만나보세요.</p><a class=\"hero-link\" href=\"#archive\"><span id=\"hero-year-label\">2026 대회 기록 보기</span> <span>↗</span></a></div><div class=\"hero-stamp\" aria-hidden=\"true\"><img src=\"assets/images/brand/kvl-ball-domestic-navywhite.webp\" alt=\"\"><b>K-Volley Lab</b><span>THE NEXT GENERATION</span></div></header>\n<div class=\"season-bar\"><div><b id=\"season-year\">2026</b><span>SEASON ARCHIVE</span></div><dl><div><dt>등록 대회</dt><dd id=\"stat-tournaments\">6<small>개</small></dd></div><div><dt>참가 부문</dt><dd>4<small>개</small></dd></div><div><dt>등록 경기</dt><dd id=\"stat-matches\">486<small>경기</small></dd></div></dl><span class=\"season-note\">CBS배 경기 기록 확인 중</span></div>\n<div id=\"content\" tabindex=\"-1\">\n<section class=\"browse-controls\" aria-label=\"대회 찾기\"><div class=\"division-filter\" role=\"group\" aria-label=\"참가 부문\"><button data-division=\"all\" aria-pressed=\"true\">전체 부문</button><button data-division=\"high-men\" aria-pressed=\"false\">남고부 <small>18U</small></button><button data-division=\"high-women\" class=\"women-choice\" aria-pressed=\"false\">여고부 <small>18U</small></button><button data-division=\"middle-men\" aria-pressed=\"false\">남중부 <small>15U</small></button><button data-division=\"middle-women\" class=\"women-choice\" aria-pressed=\"false\">여중부 <small>15U</small></button></div><label class=\"search\"><svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><circle cx=\"10\" cy=\"10\" r=\"6.5\"/><path d=\"m15 15 6 6\"/></svg><input id=\"search\" type=\"search\" placeholder=\"대회·지역·입상학교 검색\" aria-label=\"대회, 지역, 입상학교 검색\"></label></section>\n<section class=\"recent-section\" aria-labelledby=\"recent-title\"><div class=\"section-heading\"><div><span class=\"eyebrow\">TOURNAMENT SPOTLIGHT</span><h2 id=\"recent-title\">최근 열린 대회</h2></div><a href=\"#archive\" class=\"text-link\">전체 대회 보기 ↓</a></div><div class=\"featured-grid\" id=\"featured\"></div></section>\n<section id=\"archive\" aria-labelledby=\"archive-title\"><div class=\"section-heading archive-heading\"><div><span class=\"eyebrow\">SEASON RECORDS</span><h2 id=\"archive-title\">연도별 대회 기록 <span id=\"result-count\">6</span></h2><p id=\"archive-note\">한 대회의 네 부문, 입상팀을 함께 비교해 보세요.</p></div><div class=\"archive-tools\"><label>정렬 <select id=\"sort\" aria-label=\"대회 정렬\"><option value=\"recent\">최근 대회순</option><option value=\"oldest\">개최일순</option><option value=\"name\">대회명순</option></select></label><label class=\"status-select\"><select id=\"status\" aria-label=\"대회 상태\"><option value=\"all\">전체 상태</option><option value=\"completed\">대회 종료</option><option value=\"upcoming\">개최 예정</option></select></label></div></div><div id=\"archive-list\" aria-live=\"polite\"><p class=\"loading\">대회 기록을 불러오고 있습니다.</p></div><div class=\"record-note\"><span>기록 안내</span><p>경기 수와 입상팀은 현재 등록된 대회 기록을 기준으로 표시합니다. 확인되지 않은 결과는 확정된 순위처럼 표시하지 않습니다.</p></div></section>\n</div><footer class=\"page-footer\"><b>K-Volley Lab</b><span>한국 배구의 기록을 연결합니다.</span><small>중·고 배구대회 기록</small></footer>\n";
document.querySelector('body>.site-footer')?.remove();
const skip=document.createElement('a');skip.className='skip';skip.href='#content';skip.textContent='본문 바로가기';main.before(skip);

const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const paths={trophy:'<path d="M7 3h10v7a5 5 0 0 1-10 0V3ZM7 5H3v3a5 5 0 0 0 5 5M17 5h4v3a5 5 0 0 1-5 5M12 15v5M8 21h8"/>',date:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/>',pin:'<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',clock:'<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 3"/>',search:'<circle cx="10" cy="10" r="7"/><path d="m15 15 6 6"/>'};
const icon=k=>`<svg viewBox="0 0 24 24" aria-hidden="true">${paths[k]}</svg>`;
const openYears=new Set([2026]);
let DB,state={division:'all',query:'',sort:'recent',status:'all'};
function fromURL(){const p=new URLSearchParams(location.search),d=p.get('category');state.division=DB.divisions.some(v=>v[0]===d)?d:'all';state.query=p.get('q')||'';state.sort=['recent','oldest','name'].includes(p.get('sort'))?p.get('sort'):'recent';state.status=['all','completed','upcoming'].includes(p.get('status'))?p.get('status'):'all';}
function urlState(){const p=new URLSearchParams({division:'school'});if(state.division!=='all')p.set('category',state.division);if(state.query)p.set('q',state.query);if(state.sort!=='recent')p.set('sort',state.sort);if(state.status!=='all')p.set('status',state.status);const query=p.toString();history.replaceState(null,'',location.pathname+(query?'?'+query:'')+location.hash);}
const divInfo=key=>DB.divisions.find(v=>v[0]===key);
const date=s=>s.slice(5).replace('-','.');
const status=c=>c.startDate>new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Seoul'})?'upcoming':c.endDate<new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Seoul'})?'completed':'live';
function link(c,view='overview',div=state.division){const info=divInfo(div),u=new URL(c.enginePrefix?'competition-engine.html':c.pagePath,location.href);u.searchParams.set('view',c.enginePrefix?({standings:'knockout',results:'schedule',teams:'rosters',sources:'resources'}[view]||view):view);if(c.enginePrefix)u.searchParams.set('competition',c.enginePrefix+'-'+(info?.[0]||'high-men'));else if(info)u.searchParams.set('division',info[2]);return u.pathname+u.search+u.hash;}
function short(c){if(c.series==='연맹 1차전')return['삼척 연맹 1차전','전국남녀중고배구대회'];if(c.series==='연맹 2차전')return['익산보석배','전국남녀중고배구대회'];if(c.series==='대통령배')return['대통령배','제59회 전국중고배구대회'];return[c.series,'전국중고배구대회'];}
function badge(c){return status(c)==='completed'?'대회 종료':status(c)==='upcoming'?'개최 예정':'진행 중';}
function trophy(rank){return `<span class="medal medal-${rank}" aria-hidden="true"><svg viewBox="0 0 28 30"><path class="trophy-handles" d="M7 5H3v4c0 4 2 6 6 6M21 5h4v4c0 4-2 6-6 6"/><path class="trophy-cup" d="M7 3h14v8c0 5-3.1 8-7 8s-7-3-7-8V3Z"/><path class="trophy-shine" d="M10 6v5c0 2 .7 3.6 2 4.5"/><path class="trophy-stem" d="M12 18h4v6h-4z"/><path class="trophy-base" d="M9 24h10l2 3H7z"/></svg></span>`;}
function podium(c,key){
 const info=divInfo(key),rows=c.podiums[key]||[],women=key.endsWith('women');
 return `<section class="podium ${women?'women':'men'}" aria-label="${esc(info[1])} 최종순위"><div class="podium-head"><b>${info[1]}</b><small>${key.startsWith('high')?'18세 이하':'15세 이하'}</small></div>${rows.length?`<div class="ranks">${rows.map(r=>`<div class="rank ${r.rank===1?'champion':''}">${trophy(r.rank)}<span class="rank-copy"><small class="rank-label">${r.rank===3?'공동 ':''}${r.rank}위</small><b>${esc(r.team)}</b></span></div>`).join('')}</div>${rows.some(r=>r.rank===3)?'':'<p class="third-pending">공동 3위 기록 확인 중</p>'}<a class="podium-link" href="${esc(link(c,'standings',key))}">최종순위 보기 ›</a>`:`<div class="empty-podium">${icon('clock')}${status(c)==='upcoming'?'대회 시작 전':'결과 확인 중'}<br><small>${status(c)==='upcoming'?'공식 일정 안내를 확인하세요.':'확인된 결과부터 표시합니다.'}</small></div>`}</section>`;
}
function feature(c){
 const title=short(c),champ=c.podiums[state.division]?.find(r=>r.rank===1),n=state.division==='all'?'남고 · 여고 · 남중 · 여중':divInfo(state.division)[1];
 // Same policy as the university hub: featured cards use the competition's mobile Hero crop.
 const hero=c.cardHero||{},image=hero.mobileImage||hero.pcImage,position=/^(?:left|center|right|[0-9]{1,3}%)(?:\s+(?:top|center|bottom|[0-9]{1,3}%))?$/.test(hero.mobilePosition||'')?hero.mobilePosition:'center center';
 return `<a class="feature" href="${esc(link(c))}" aria-label="${esc(c.name)} 대회 보기" data-hero-source="${esc(hero.source||'competition-hero')}"><div class="feature-top">${image?`<img class="feature-hero-img" src="${esc(image)}" alt="" style="object-position:${esc(position)}" decoding="async">`:''}<span class="feature-label">${esc(c.startDate.slice(0,4))} · SCHOOL VOLLEYBALL</span><span class="feature-status">${badge(c)}</span><h3>${esc(title[0])}<span>${esc(title[1])}</span></h3></div><div class="feature-bottom"><p>${date(c.startDate)} — ${date(c.endDate)}<br>${esc(c.location)} · ${c.gameCount?c.gameCount+'경기':'경기 기록 확인 중'}</p><span>↗</span></div><div class="feature-champ">${icon(champ?'trophy':'date')}${champ?`<small>${esc(n)} 우승</small><b>${esc(champ.team)}</b>`:`<span>${esc(n)}</span>`}</div></a>`;
}
function archive(c){const title=short(c),keys=state.division==='all'?DB.divisions.map(d=>d[0]):[state.division];return`<article class="tournament ${state.division!=='all'?'single-division':''}"><div class="tournament-info"><div class="record-meta"><span class="series">${esc(c.series)}</span><span class="status">${badge(c)}</span></div><h3>${esc(title[0])}<small>${esc(title[1])}</small></h3><div class="record-date"><p>${icon('date')}${date(c.startDate)} — ${date(c.endDate)}</p><p>${icon('pin')}${esc(c.location)}</p></div><span class="game-count">${c.gameCount?'등록 '+c.gameCount+'경기':'경기 기록 확인 중'}</span><a class="tournament-link" aria-label="${esc(c.name)} 대회 한눈에 보기" href="${esc(link(c))}">대회 한눈에 보기 <span>↗</span></a></div><div class="podiums" aria-label="${esc(c.series)} 부문별 최종순위">${keys.map(k=>podium(c,k)).join('')}</div></article>`;}
function yearBlock(year,content,count){
 const hasRecords=count!=null;
 return `<details class="year-block" data-year="${year}" ${openYears.has(year)?'open':''}><summary class="year-heading"><span><strong>${year}</strong><small>SEASON</small><b>${hasRecords?count+'개 대회':'기록 준비 중'}</b></span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></summary><div class="year-content">${content}</div></details>`;
}
function renderArchive(result){
 const years=DB.archiveYears||[{year:2026,state:'available'}],empty=`<div class="empty-results">${icon('search')}<h3>조건에 맞는 대회가 없습니다.</h3><p>${state.status==='upcoming'?'등록된 대회 중 개최 예정인 대회가 없습니다.':'대회명, 지역 또는 입상한 학교 이름으로 검색해 보세요.'}</p><button class="reset" id="reset">전체 대회 다시 보기</button></div>`;
 return years.map(({year,state:availability})=>{
  const rows=result.filter(c=>Number(c.startDate.slice(0,4))===year);
  return yearBlock(year,availability==='available'?(rows.length?rows.map(archive).join(''):empty):`<div class="year-pending">${icon('date')}<strong>${year}년 대회 기록을 준비하고 있습니다.</strong><p>확인된 대회와 경기 결과부터 차례로 추가합니다.</p></div>`,availability==='available'?rows.length:null);
 }).join('');
}
document.addEventListener('toggle',e=>{if(e.target.matches?.('.year-block')&&e.target.isConnected){const year=Number(e.target.dataset.year);e.target.open?openYears.add(year):openYears.delete(year);}},true);
function render(){document.body.classList.toggle('women',state.division.endsWith('women'));document.querySelectorAll('[data-division]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.division===state.division)));$('#search').value=state.query;$('#sort').value=state.sort;$('#status').value=state.status;$('#featured').innerHTML=[...DB.competitions].sort((a,b)=>b.endDate.localeCompare(a.endDate)).slice(0,3).map(feature).join('');const q=state.query.trim().replace(/\s+/g,'').toLocaleLowerCase('ko');let result=DB.competitions.filter(c=>{const names=Object.entries(c.podiums).filter(([key])=>state.division==='all'||key===state.division).flatMap(([,rows])=>rows.map(r=>r.team));return(!q||[c.name,c.series,c.location,...names].join('').replace(/\s+/g,'').toLocaleLowerCase('ko').includes(q))&&(state.status==='all'||state.status===status(c));});result.sort((a,b)=>state.sort==='name'?a.name.localeCompare(b.name,'ko'):state.sort==='oldest'?a.startDate.localeCompare(b.startDate):b.endDate.localeCompare(a.endDate));$('.recent-section').hidden=Boolean(q)||state.status!=='all';$('#result-count').textContent=result.length;$('#archive-note').textContent=state.division==='all'?'한 대회의 네 부문, 입상팀을 함께 비교해 보세요.':divInfo(state.division)[1]+'의 우승·준우승·공동 3위 기록을 모았습니다.';$('#archive-list').innerHTML=renderArchive(result);urlState();}
document.addEventListener('click',e=>{const b=e.target.closest('[data-division]');if(b&&DB){state.division=b.dataset.division;render();}if(e.target.closest('#reset')){state={division:'all',query:'',sort:'recent',status:'all'};render();$('#search').focus();}});
$('#search').addEventListener('input',e=>{if(!DB)return;state.query=e.target.value;openYears.add(DB.latestYear);render();});$('#sort').addEventListener('change',e=>{if(!DB)return;state.sort=e.target.value;render();});$('#status').addEventListener('change',e=>{if(!DB)return;state.status=e.target.value;openYears.add(DB.latestYear);render();});window.addEventListener('popstate',()=>{if(DB){fromURL();render();}});

// Keep the existing school archive and domestic match JSON as the only result sources.
const divisions=[['high-men','남고부','18세이하 남자부'],['high-women','여고부','18세이하 여자부'],['middle-men','남중부','15세이하 남자부'],['middle-women','여중부','15세이하 여자부']];
const aliases={'울산스포츠과하고':'울산스포츠과학고','순천팦마중':'순천팔마중','인하부고':'인하사대부고','인하부중':'인하사대부중','찬안고':'천안고','경북사대부설고':'경북사대부고','인하사대부속중':'인하사대부중'};
const team=n=>aliases[n]||n;
const unpack=(data,row)=>Array.isArray(row)?{date:row[0],court_order:Number(row[2])||0,division:data.divisions?.[row[3]],stage:data.stages?.[row[4]],team_a:team(row[5]),team_b:team(row[6]),set_score:row[7]}:{...row,team_a:team(row.team_a),team_b:team(row.team_b)};
const score=m=>String(m.set_score||'').match(/^(\d+)-(\d+)$/)?.slice(1).map(Number)||[];
const winner=m=>{const[a,b]=score(m);return Number.isFinite(a)&&Number.isFinite(b)?a>b?m.team_a:b>a?m.team_b:'':'';};
const loser=m=>{const w=winner(m);return w?w===m.team_a?m.team_b:m.team_a:'';};
const stage=m=>String(m.stage||'').replace(/\s+/g,'').replace(/전$/,'');
const json=async path=>{const r=await fetch(path,{cache:'no-store'});if(!r.ok)throw Error('HTTP '+r.status);return r.json();};
const rankingCache=new Map();
function resultsFor(item){
 if(item.divisionResults)return Promise.resolve(item.divisionResults);
 if(!item.rankingSource)return Promise.resolve({});
 if(!rankingCache.has(item.rankingSource))rankingCache.set(item.rankingSource,json('data/domestic/'+encodeURIComponent(item.rankingSource)+'.json').then(data=>{
  const matches=(data.matches||[]).map(row=>unpack(data,row)),out={};
  for(const[key,,official]of divisions){
   const rows=matches.filter(m=>m.division===official&&winner(m)).sort((a,b)=>String(a.date).localeCompare(String(b.date))||Number(a.court_order||0)-Number(b.court_order||0));
   const final=rows.filter(m=>stage(m)==='결승').at(-1);
   out[key]=final?[{rank:1,team:winner(final)},{rank:2,team:loser(final)},...[...new Set(rows.filter(m=>stage(m)==='준결승').map(loser).filter(Boolean))].map(team=>({rank:3,team}))]:[];
  }
  return out;
 }).catch(()=>({})));
 return rankingCache.get(item.rankingSource);
}
// Individual school Hero bitmaps are not registered yet. Reuse the approved shared Hero.
// A future catalog cardHero.mobileImage/pcImage replaces this fallback without changing results.
const sharedHero={pcImage:'assets/img/home-hero/kvl-home-hero-pc-v01.webp',mobileImage:'assets/img/home-hero/kvl-home-hero-mobile-v01.webp',mobilePosition:'72% center',source:'approved-domestic-template-shared-hero',isSharedFallback:true};
async function loadArchive(){
 const manifest=await json('data/competitions/school-years.json');
 const catalogs=await Promise.all(manifest.years.map(meta=>json(meta.dataPath)));
 const competitions=await Promise.all(catalogs.flatMap(d=>d.competitions||[]).map(async c=>({...c,cardHero:c.cardHero||sharedHero,podiums:await resultsFor(c)})));
 const latestYear=Number(manifest.latestYear)||Math.max(...manifest.years.map(m=>Number(m.year)));
 const years=[...new Set([...manifest.years.map(m=>Number(m.year)),...Array.from({length:4},(_,i)=>latestYear-i)])].sort((a,b)=>b-a);
 DB={divisions,competitions,latestYear,archiveYears:years.map(year=>({year,state:manifest.years.some(m=>Number(m.year)===year)?'available':'pending'}))};
 openYears.clear();openYears.add(latestYear);fromURL();
 $('#season-year').textContent=latestYear;$('#hero-year-label').textContent=latestYear+' 대회 기록 보기';
 $('#stat-tournaments').innerHTML=competitions.length+'<small>개</small>';
 $('#stat-matches').innerHTML=competitions.reduce((n,c)=>n+(c.gameCount||0),0)+'<small>경기</small>';
 const pending=competitions.filter(c=>!c.gameCount||c.recordStatus==='partial').map(c=>c.series+(c.recordStatus==='partial'?' 일부':''));$('.season-note').textContent=pending.length?pending.join(' · ')+' 경기 기록 확인 중':'';
 render();document.body.dataset.ready='true';
}
loadArchive().catch(()=>{$('#archive-list').innerHTML='<div class="empty-results"><h3>기록을 불러오지 못했습니다.</h3><p>페이지를 새로고침해 다시 시도해 주세요.</p></div>';});
})();
