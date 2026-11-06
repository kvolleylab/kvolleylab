
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
let comps=[],loaded=false;
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
  return {id:item.competitionId,type,typeName:C[type].title,status:item.status==='active'?'진행 중':'대회 종료',title:item.name||item.shortName,date:[item.startDate,item.endDate].map(x=>String(x||'일정 미정').replaceAll('-','.')).join(' ~ '),location:item.location||'개최지 확인 중',url:item.pagePath,image,pos,mobile:pos,men:panelFor(item,'men'),women:panelFor(item,'women')};
}
const params=new URLSearchParams(location.search);let selected=Object.hasOwn(C,params.get('type'))?params.get('type'):'all',year=['2026','2025','2024','2023'].includes(params.get('year'))?params.get('year'):'2026';
const trophy=n=>n===4?'<span class="fourth">4</span>':`<svg aria-hidden="true" viewBox="0 0 28 30"><path d="M7 5H3v4c0 4 2 6 6 6M21 5h4v4c0 4-2 6-6 6" fill="none" stroke="${n===1?'#b28a31':n===2?'#8c9cab':'#a87548'}" stroke-width="2"/><path d="M7 3h14v8c0 5-3.1 8-7 8s-7-3-7-8V3Z" fill="${n===1?'#e5b83b':n===2?'#bbc7d1':'#cc9566'}"/><path d="M12 18h4v6h-4zM9 24h10l2 3H7z" fill="${n===1?'#c49c38':n===2?'#9cabb8':'#ab774c'}"/><path d="M10 6v5c0 2 .7 3.6 2 4.5" fill="none" stroke="#fff" stroke-width="1.8" opacity=".65"/></svg>`;
function ranking(panel,sex){const joint=panel.r.filter(x=>x[0]===3).length>1;return `<section class="rank-card ${sex}" aria-label="${escapeHtml(panel.label)}"><div class="rank-head"><strong>${escapeHtml(panel.label)}</strong>${panel.note?`<small>${escapeHtml(panel.note)}</small>`:''}</div><div class="rank-body">${panel.r.map(([n,team])=>`<div class="rank-row"><span class="trophy">${trophy(n)}</span><span class="rank-label">${n===3&&joint?'공동 3위':n+'위'}</span><span class="team" title="${escapeHtml(team)}">${escapeHtml(team)}</span></div>`).join('')||'<div class="rank-empty">순위 데이터 준비 중</div>'}</div></section>`;}
function titleMarkup(title){const match=String(title).match(/^(2026 대한항공배) (전국대학배구 (?:고성|단양)대회)$/);return match?match.slice(1).map(line=>`<span class="tourney-title-line">${escapeHtml(line)}</span>`).join(''):escapeHtml(title);}
function row(c){return `<article id="featured-${escapeHtml(c.id)}" class="tournament" data-type="${c.type}" style="--photo:${c.image?`url('${escapeHtml(c.image)}')`:'none'};--photo-pos:${c.pos};--mobile-pos:${c.mobile}"><div class="tourney-info"><div class="tourney-labels"><span class="type-badge">${escapeHtml(c.typeName)}</span><span class="status-badge">${c.status}</span></div><h3>${titleMarkup(c.title)}</h3><p class="meta"><svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18"/></svg>${escapeHtml(c.date)}</p><p class="meta"><svg viewBox="0 0 24 24"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg>${escapeHtml(c.location)}</p><a class="cta" href="${escapeHtml(c.url)}">대회 보기 <span aria-hidden="true">↗</span></a></div>${ranking(c.men,'men')}${ranking(c.women,'women')}</article>`;}
function render(){E('#yearSelect').value=year;E('#categories').innerHTML=Object.entries(C).map(([key,c])=>`<button type="button" class="category ${selected===key?'active':''}" data-cat="${key}" aria-pressed="${selected===key}"><span class="cat-symbol"><svg viewBox="0 0 24 24" aria-hidden="true">${c.icon}</svg></span><strong>${c.title}</strong><small>${c.sub}</small></button>`).join('');
const data=year==='2026'?(selected==='all'?comps:comps.filter(c=>c.type===selected)):[];
E('#yearHeading').textContent=year+'년'; E('#count').textContent=loaded?data.length+'개 대회':'불러오는 중';E('#resultDesc').textContent=selected==='all'?'대회 일정과 남녀 최종순위를 함께 확인하세요.':C[selected].title+'에 해당하는 대회만 표시합니다.';
E('#tournaments').innerHTML=!loaded?'<div class="empty">대회 기록을 불러오는 중입니다.</div>':data.length?data.map(row).join(''):`<div class="empty"><strong>${year}년 ${selected==='all'?'대회 기록':C[selected].title+' 기록'} 준비 중</strong>확인된 대회 기록이 연결되면 이 위치에 표시됩니다.</div>`;
E('#categories').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{selected=selected===b.dataset.cat?'all':b.dataset.cat;const key=b.dataset.cat;render();E('[data-cat="'+key+'"]').focus({preventScroll:true});}));}
E('#reset').addEventListener('click',()=>{selected='all';year='2026';E('#yearSelect').value=year;render();E('#categoryHeading').scrollIntoView({behavior:'smooth',block:'start'});});
E('#yearSelect').addEventListener('change',e=>{year=e.target.value;render();});
E('#archiveRows').innerHTML=[2025,2024,2023].map(y=>`<div class="archive-row"><button class="archive-toggle" type="button" aria-expanded="false"><span>${y}년 대회 기록</span><span>＋</span></button><div class="archive-body hide">검수 완료된 과거 대회 데이터부터 순차적으로 연결합니다.</div></div>`).join('');
E('#archiveRows').querySelectorAll('.archive-toggle').forEach(b=>b.addEventListener('click',()=>{const open=b.getAttribute('aria-expanded')!=='true';b.setAttribute('aria-expanded',String(open));b.querySelector('span:last-child').textContent=open?'−':'＋';b.nextElementSibling.classList.toggle('hide',!open)}));
async function load(){
  try{const response=await fetch(INDEX_URL,{cache:'no-cache'});if(!response.ok)throw new Error('University index '+response.status);const data=await response.json();comps=await Promise.all((data.competitions||[]).slice().sort((a,b)=>(a.featuredOrder||99)-(b.featuredOrder||99)).map(fromIndex));
    loaded=true;Object.entries(C).forEach(([key,c])=>{const count=comps.filter(item=>item.type===key).length;c.sub=count?'2026 · '+count+'개 대회':'대회 추가 예정';});render();
    const anchor=location.hash&&document.getElementById(location.hash.slice(1));if(anchor)anchor.scrollIntoView();
  }catch(error){console.error(error);E('#count').textContent='';E('#tournaments').innerHTML='<div class="empty"><strong>대회 기록을 불러오지 못했습니다.</strong><button type="button" class="year-select" id="retry">다시 시도</button></div>';E('#retry').addEventListener('click',load);}
}
render();load();
})();
