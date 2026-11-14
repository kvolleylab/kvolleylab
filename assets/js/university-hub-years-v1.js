
(()=>{
const hub=document.querySelector('.university-years-hub');if(!hub)return;
const E=s=>hub.querySelector(s), escapeHtml=t=>String(t??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const C={
 uleague:{title:'U-리그',sub:'2026 · 1개 대회',icon:'<path d="M5 7v10a7 7 0 0 0 14 0V7"/><path d="M4 3h16M5 11h14M5 15h14"/>'},
 first:{title:'연맹1차전',sub:'2026 · 1개 대회',icon:'<circle cx="12" cy="11" r="8"/><path d="m7 18-1 4 6-3 6 3-1-4"/><text x="12" y="15" text-anchor="middle" font-size="11" font-weight="800" fill="currentColor" stroke="none">1</text>'},
 second:{title:'연맹2차전',sub:'2026 · 1개 대회',icon:'<circle cx="12" cy="11" r="8"/><path d="m7 18-1 4 6-3 6 3-1-4"/><text x="12" y="15" text-anchor="middle" font-size="11" font-weight="800" fill="currentColor" stroke="none">2</text>'},
 overall:{title:'종합대회',sub:'대회 추가 예정',icon:'<path d="M7 3h10v6a5 5 0 0 1-10 0V3ZM7 5H3v4a4 4 0 0 0 4 4m10-8h4v4a4 4 0 0 1-4 4M12 14v5m-5 2h10m-8-2h6"/>'},
 intl:{title:'국제 대학대회',sub:'대회 추가 예정',icon:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c-5 6-5 12 0 18M12 3c5 6 5 12 0 18M5 7h14M5 17h14"/>'},
 other:{title:'기타 참가대회',sub:'대회 추가 예정',icon:'<rect x="4" y="5" width="16" height="14" rx="2"/><path d="M8 5v14M12 8h5M12 12h5M12 16h3"/>'}
};
const INDEX_URL='data/competitions/university-index-2026.json';
const ARCHIVE_URL='data/archive/university-results-v1.json';
const WOMEN_PAGES={
  'kusf-u-league-2026':'competition-engine.html?competition=university-league-women-2026',
  'gosung-2026':'university-competition.html?gender=women',
  'danyang-2026':'university-competition-danyang.html?gender=women'
};
let comps=[],archives=[],loaded=false,currentFailed=false,archiveLoaded=false,archiveFailed=false;
const openYears=new Set();
const dates=(start,end)=>start&&end?[start,end].map(x=>String(x).replaceAll('-','.')).join(' ~ '):'대회 기간 자료 확인 중';
function fromArchive(item,sources){
  const panel=sex=>item[sex]?({label:item[sex].label,note:item[sex].note||'',r:(item[sex].rankings||[]).map(r=>[r.rank,r.team])}):null;
  const references=['men','women'].flatMap(sex=>(item[sex]?.sourceIds||[]).slice(0,1).map(id=>({sex,url:sources[id]?.url,publisher:sources[id]?.publisher||'공식자료'}))).filter(source=>/^https:\/\//.test(source.url||''));
  return {id:item.id,year:String(item.year),type:item.type,typeName:C[item.type].title,status:'대회 종료',title:item.title,date:dates(item.startDate,item.endDate),location:item.location,resultsOnly:true,men:panel('men'),women:panel('women'),sources:references};
}

const typeFor=item=>item.category==='uleague'?'uleague':/1차/.test(item.series||'')?'first':/2차/.test(item.series||'')?'second':item.category==='international'?'intl':item.category==='overall'?'overall':'other';
function panelFor(item,sex){
  const key=sex==='men'?'남':'여';
  const panel=(item.recordPanels||[]).find(p=>String(p.division||'').includes(key))||(item.podiums||[]).find(p=>String(p.division||'').includes(key));
  if(!panel)return {label:(sex==='men'?'남자부':'여자부')+' 최종순위',r:[]};
  const simple=item.competitionId==='kusf-u-league-2026'&&sex==='men';
  return {label:simple?'남자부 최종순위':panel.label||(sex==='men'?'남대부':'여대부')+' 최종순위',note:simple?'':panel.note,r:(panel.rankings||[]).slice(0,4).map(r=>[Number(r.rank),r.team])};
}
async function fromIndex(item){
  let image=item.cardImage||'',pos='center center';
  try{
    if(item.cardHero?.config){const response=await fetch(item.cardHero.config,{cache:'no-cache'});if(!response.ok)throw new Error('Hero config '+response.status);const {hero={}}=await response.json();image=hero.mobileImage||hero.pcImage||image;pos=hero.mobilePosition||hero.position||pos;}
  }catch(error){console.error('University HERO:',item.competitionId,error);}
  if(!/^(?:\/|assets\/)/.test(image)||/["'<>\\]/.test(image))image='';
  if(!/^(?:left|center|right|[0-9]{1,3}%)(?:\s+(?:top|center|bottom|[0-9]{1,3}%))?$/.test(pos))pos='center center';
  const type=typeFor(item);
  return {id:item.competitionId,year:'2026',womenUrl:WOMEN_PAGES[item.competitionId],type,typeName:C[type].title,status:item.status==='active'?'진행 중':'대회 종료',title:item.name||item.shortName,date:[item.startDate,item.endDate].map(x=>String(x||'일정 미정').replaceAll('-','.')).join(' ~ '),location:item.location||'개최지 확인 중',url:item.pagePath,image,pos,mobile:pos,men:panelFor(item,'men'),women:panelFor(item,'women')};
}
const params=new URLSearchParams(location.search);
let selected=Object.hasOwn(C,params.get('type'))?params.get('type'):'all';
let year=/^(?:19|20)\d{2}$/.test(params.get('year')||'')?params.get('year'):'2026';
const yearOptions=()=>[...new Set(['2026',...archives.map(c=>c.year)])].sort((a,b)=>Number(b)-Number(a));
const archiveYears=()=>yearOptions().filter(y=>y!=='2026');
const trophy=n=>n===4?'<span class="fourth">4</span>':`<span class="dv2-trophy trophy-${n}" aria-hidden="true"><svg viewBox="0 0 28 30"><path class="trophy-handles" d="M7 5H3v4c0 4 2 6 6 6M21 5h4v4c0 4-2 6-6 6"/><path class="trophy-cup" d="M7 3h14v8c0 5-3.1 8-7 8s-7-3-7-8V3Z"/><path class="trophy-shine" d="M10 6v5c0 2 .7 3.6 2 4.5"/><path class="trophy-stem" d="M12 18h4v6h-4z"/><path class="trophy-base" d="M9 24h10l2 3H7z"/></svg></span>`;
function ranking(panel,sex){const joint=panel.r.filter(x=>x[0]===3).length>1;return `<section class="rank-card ${sex}" aria-label="${escapeHtml(panel.label)}"><div class="rank-head"><strong>${escapeHtml(panel.label)}</strong>${panel.note?`<small>${escapeHtml(panel.note)}</small>`:''}</div><div class="rank-body">${panel.r.map(([n,team])=>`<div class="rank-row"><span class="trophy">${trophy(n)}</span><span class="rank-label">${n===3&&joint?'공동 3위':n+'위'}</span><span class="team" title="${escapeHtml(team)}">${escapeHtml(team)}</span></div>`).join('')||'<div class="rank-empty">순위 데이터 준비 중</div>'}</div></section>`;}
function titleMarkup(title){const match=String(title).match(/^(20\d{2} (?:대한항공배|현대캐피탈배)) (전국대학배구 (?:고성|단양)대회)$/);return match?match.slice(1).map(line=>`<span class="tourney-title-line">${escapeHtml(line)}</span>`).join(''):escapeHtml(title);}
function row(c,prefix='featured'){
  const official=c.resultsOnly;
  const actions=official
    ? `<div class="record-sources"><span>출처: ${escapeHtml([...new Set(c.sources.map(source=>source.publisher))].join(' · '))}</span>${c.sources.map(source=>`<a href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">${source.sex==='men'?'남자부':'여자부'} 공식 기록 ↗</a>`).join('')}</div>`
    : `<div class="gender-links"><a class="cta men" href="${escapeHtml(c.url)}" aria-label="${escapeHtml(c.title)} 남자부 보기">남자부 <span aria-hidden="true">↗</span></a>${c.womenUrl?`<a class="cta women" href="${escapeHtml(c.womenUrl)}" aria-label="${escapeHtml(c.title)} 여자부 보기">여자부 <span aria-hidden="true">↗</span></a>`:''}</div>`;
  const imageStyle=official?'':` style="--photo:${c.image?`url('${escapeHtml(c.image)}')`:'none'};--mobile-pos:${c.mobile}"`;
  return `<article id="${prefix}-${escapeHtml(c.id)}" class="tournament ${official?'results-only':'is-clickable'}${official&&!c.women?' single-division':''}" data-type="${c.type}"${imageStyle}>
    ${!official&&c.url?`<a class="tournament-link" href="${escapeHtml(c.url)}" aria-label="${escapeHtml(c.title)} 대회 보기"></a>`:''}
    <div class="tourney-info"><div class="tourney-labels"><span class="type-badge">${escapeHtml(c.typeName)}</span><span class="status-badge">${c.status}</span></div><h3>${titleMarkup(c.title)}</h3><p class="meta"><svg aria-hidden="true" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18"/></svg>${escapeHtml(c.date)}</p><p class="meta"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg>${escapeHtml(c.location)}</p>${actions}</div>${c.men?ranking(c.men,'men'):''}${c.women?ranking(c.women,'women'):''}</article>`;
}
function render(){
  const options=yearOptions();
  if(archiveLoaded&&!archiveFailed&&!options.includes(year))year='2026';
  E('#yearSelect').innerHTML=options.map(y=>`<option value="${y}">${y}년</option>`).join('');
  E('#yearSelect').value=year;
  const available=year==='2026'?comps:archives.filter(c=>c.year===year);
  const ready=year==='2026'?loaded:archiveLoaded;
  E('#categories').innerHTML=Object.entries(C).map(([key,c])=>{const count=available.filter(item=>item.type===key).length;return `<button type="button" class="category ${selected===key?'active':''}" data-cat="${key}" aria-pressed="${selected===key}"><span class="cat-symbol"><svg viewBox="0 0 24 24" aria-hidden="true">${c.icon}</svg></span><strong>${c.title}</strong><small>${count?year+' · '+count+'개 대회':ready?'등록된 기록 없음':'불러오는 중'}</small></button>`;}).join('');
  const data=selected==='all'?available:available.filter(c=>c.type===selected);
  E('#yearHeading').textContent=year+'년'; E('#count').textContent=ready?data.length+'개 대회':'불러오는 중';
  E('#resultDesc').textContent=year==='2026'?(selected==='all'?'대회 일정과 남녀 최종순위를 함께 확인하세요.':C[selected].title+'에 해당하는 대회만 표시합니다.'):'공식 확인된 순위만 표시하며 미확인 순위는 비워 둡니다.';
  E('#tournaments').innerHTML=year==='2026'&&currentFailed?'<div class="empty"><strong>대회 기록을 불러오지 못했습니다.</strong><button type="button" class="year-select" id="retry">다시 시도</button></div>':!ready?'<div class="empty">대회 기록을 불러오는 중입니다.</div>':data.length?data.map(c=>row(c)).join(''):`<div class="empty"><strong>${year}년 ${selected==='all'?'대회 기록':C[selected].title+' 기록'} ${archiveFailed&&year!=='2026'?'연결 실패':'준비 중'}</strong>${archiveFailed&&year!=='2026'?'잠시 후 새로고침해 주세요.':'확인된 대회 기록이 연결되면 이 위치에 표시됩니다.'}</div>`;
  if(E('#retry')){E('#count').textContent='';E('#retry').addEventListener('click',load);}
  E('#categories').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{selected=selected===b.dataset.cat?'all':b.dataset.cat;const key=b.dataset.cat;render();E('[data-cat="'+key+'"]').focus({preventScroll:true});}));
}
function renderArchives(){
  if(!archiveLoaded){E('#archiveRows').innerHTML='<p class="archive-note">과거 대회 기록을 불러오는 중입니다.</p>';return;}
  if(archiveFailed){E('#archiveRows').innerHTML='<p class="archive-note">과거 대회 기록을 불러오지 못했습니다. 잠시 후 새로고침해 주세요.</p>';return;}
  E('#archiveRows').innerHTML=archiveYears().map(y=>{
    const data=archives.filter(c=>c.year===y);
    const note=data.some(c=>c.type==='first'||c.type==='second')?'연맹전 남자부는 A그룹 최종순위입니다.':'공식 확인된 순위만 표시하며 미확인 순위는 비워 둡니다.';
    const body=`<p class="archive-note">${note}</p><div class="tournaments">${data.map(c=>row(c,'archive')).join('')}</div>`;
    return `<div class="archive-row"><button class="archive-toggle" type="button" data-year="${y}" aria-controls="archive-${y}" aria-expanded="${openYears.has(y)}"><span>${y}년 대회 기록${data.length?' · '+data.length+'개 대회':''}</span><span aria-hidden="true">${openYears.has(y)?'−':'＋'}</span></button><div id="archive-${y}" class="archive-body${openYears.has(y)?'':' hide'}">${body}</div></div>`;
  }).join('');
  E('#archiveRows').querySelectorAll('.archive-toggle').forEach(b=>b.addEventListener('click',()=>{const y=Number(b.dataset.year),open=b.getAttribute('aria-expanded')!=='true';open?openYears.add(y):openYears.delete(y);b.setAttribute('aria-expanded',String(open));b.querySelector('span:last-child').textContent=open?'−':'＋';b.nextElementSibling.classList.toggle('hide',!open);}));
}
E('#reset').addEventListener('click',()=>{selected='all';year='2026';render();E('#categoryHeading').scrollIntoView({behavior:'smooth',block:'start'});});
E('#yearSelect').addEventListener('change',e=>{year=e.target.value;render();});
async function load(){
  currentFailed=false;render();
  try{const response=await fetch(INDEX_URL,{cache:'no-cache'});if(!response.ok)throw new Error('University index '+response.status);const data=await response.json();comps=await Promise.all((data.competitions||[]).slice().sort((a,b)=>(a.featuredOrder||99)-(b.featuredOrder||99)).map(fromIndex));
    loaded=true;render();
    const anchor=location.hash&&document.getElementById(location.hash.slice(1));if(anchor)anchor.scrollIntoView();
  }catch(error){currentFailed=true;console.error(error);render();}
}
async function loadArchives(){
  try{const response=await fetch(ARCHIVE_URL,{cache:'no-cache'});if(!response.ok)throw new Error('University archive '+response.status);const data=await response.json();archives=data.competitions.map(item=>fromArchive(item,data.sources));}
  catch(error){archiveFailed=true;console.error('University archive:',error);}
  archiveLoaded=true;renderArchives();render();
}
render();renderArchives();load();loadArchives();
})();
