(()=>{
'use strict';
const body=document.body;
if(!body?.classList.contains('school-comp-page')||body.dataset.kvlSchoolTemplate!=='president-standard')return;
const D=['18세이하 남자부','18세이하 여자부','15세이하 남자부','15세이하 여자부'];
const globals={
  'iksan-2026':'KVL_IKSAN_2026_GAMES',
  'samcheok-2026':'KVL_SAMCHEOK_2026_GAMES',
  'spring-2026':'KVL_SPRING_2026_GAMES'
};
const games=(window[globals[body.dataset.competition]]||[]).slice();
if(!games.length)return;
const state=window.KVL_SCHOOL_DIVISION_STATE;
const initial=()=>{const v=state?.get?.();return D.includes(v)?v:D[0]};
let groupDivision=initial(),standingDivision=initial();
const $=s=>document.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ratio=(a,b)=>b===0?(a>0?Infinity:0):a/b;
const ratioText=v=>v===Infinity?'MAX':Number(v||0).toFixed(3);
const initials=n=>String(n).replace(/고등학교|중학교|여자|사범대학부속|스포츠과학|산업|메디텍|체육/g,'').slice(0,2)||'팀';
const logo=n=>`<span class="sc-team-logo" aria-label="${esc(n)} 로고 자리">${esc(initials(n))}</span>`;
const choose=v=>{if(!D.includes(v))return;state?.set?.(v)};
const score=g=>String(g?.score||'0-0').split('-').map(Number);
const winner=g=>{const [a,b]=score(g);return a>b?g.teamA:b>a?g.teamB:''};

function tagLegacyDivisionButtons(){
  document.querySelectorAll('.sc-tabs button,.sc-calendar-division-tabs button').forEach(btn=>{
    const v=btn.dataset.kvlDivision||btn.dataset.calendarDivision||btn.textContent.trim();
    if(D.includes(v))btn.dataset.kvlDivision=v;
  });
}
function selectLegacy(containerSelector,value){
  const root=$(containerSelector);if(!root)return;
  const target=[...root.querySelectorAll('button')].find(b=>(b.dataset.kvlDivision||b.dataset.calendarDivision||b.textContent.trim())===value);
  if(target&&!target.classList.contains('is-active'))target.click();
}
function syncCurrentDivision(){
  const v=initial();
  tagLegacyDivisionButtons();
  selectLegacy('#scDivisionTabs',v);
  selectLegacy('#scTeamTabs',v);
  selectLegacy('#scCalendar',v);
}

function groupStageGames(division){return games.filter(g=>g.division===division&&['사전경기','예선'].includes(g.stage));}
function deriveGroups(division){
  const list=groupStageGames(division),adj=new Map(),firstSeen=new Map();
  list.forEach((g,i)=>{
    [g.teamA,g.teamB].forEach(t=>{if(!adj.has(t))adj.set(t,new Set());if(!firstSeen.has(t))firstSeen.set(t,i)});
    adj.get(g.teamA).add(g.teamB);adj.get(g.teamB).add(g.teamA);
  });
  const seen=new Set(),groups=[];
  [...adj.keys()].forEach(team=>{
    if(seen.has(team))return;
    const stack=[team],members=[];seen.add(team);
    while(stack.length){const cur=stack.pop();members.push(cur);(adj.get(cur)||[]).forEach(n=>{if(!seen.has(n)){seen.add(n);stack.push(n)}})}
    members.sort((a,b)=>(firstSeen.get(a)||0)-(firstSeen.get(b)||0)||a.localeCompare(b,'ko'));
    groups.push({teams:members,order:Math.min(...members.map(t=>firstSeen.get(t)||0))});
  });
  return groups.sort((a,b)=>a.order-b.order).map((g,i)=>({name:String.fromCharCode(65+i),teams:g.teams}));
}
function calculateGroup(division,teams){
  const set=new Set(teams),stats=Object.fromEntries(teams.map(team=>[team,{team,gp:0,w:0,l:0,sf:0,sa:0,pf:0,pa:0}]));
  const list=groupStageGames(division).filter(g=>set.has(g.teamA)&&set.has(g.teamB));
  list.forEach(g=>{
    const a=stats[g.teamA],b=stats[g.teamB],[sa,sb]=score(g);if(!a||!b)return;
    a.gp++;b.gp++;a.sf+=sa||0;a.sa+=sb||0;b.sf+=sb||0;b.sa+=sa||0;
    if(sa>sb){a.w++;b.l++}else if(sb>sa){b.w++;a.l++}
    (g.sets||[]).forEach(s=>{const [pa,pb]=String(s).split('-').map(Number);if(Number.isFinite(pa)&&Number.isFinite(pb)){a.pf+=pa;a.pa+=pb;b.pf+=pb;b.pa+=pa}});
  });
  const direct=(ta,tb)=>{const g=list.find(x=>(x.teamA===ta&&x.teamB===tb)||(x.teamA===tb&&x.teamB===ta));return g?winner(g):''};
  return Object.values(stats).map(s=>({...s,pointRatio:ratio(s.pf,s.pa),setRatio:ratio(s.sf,s.sa)})).sort((a,b)=>{
    if(b.w!==a.w)return b.w-a.w;if(b.pointRatio!==a.pointRatio)return b.pointRatio-a.pointRatio;if(b.setRatio!==a.setRatio)return b.setRatio-a.setRatio;
    const w=direct(a.team,b.team);if(w===a.team)return -1;if(w===b.team)return 1;return a.team.localeCompare(b.team,'ko');
  });
}
function renderGroups(){
  const tabs=$('#scGroupDivisionTabs'),root=$('#scGroupStandings');if(!tabs||!root)return;
  tabs.innerHTML=D.map(d=>`<button type="button" class="${d===groupDivision?'is-active':''}" data-kvl-division="${esc(d)}">${esc(d)}</button>`).join('');
  [...tabs.children].forEach(btn=>btn.onclick=()=>{groupDivision=btn.dataset.kvlDivision;choose(groupDivision);renderGroups()});
  const groups=deriveGroups(groupDivision);
  root.innerHTML=groups.map(group=>{
    const rows=calculateGroup(groupDivision,group.teams);
    return `<article class="sc-group-card"><h3>${group.name}조</h3><div class="sc-group-table"><div class="sc-group-row sc-group-head"><span>순위</span><span>팀</span><span>경기</span><span>승</span><span>패</span><span>점수비율</span><span>세트비율</span></div>${rows.map((s,i)=>`<div class="sc-group-row ${i<2?'is-qualified':''}"><span class="sc-group-rank">${i+1}</span><strong>${esc(s.team)}</strong><span>${s.gp}</span><span>${s.w}</span><span>${s.l}</span><span>${ratioText(s.pointRatio)}</span><span>${ratioText(s.setRatio)}</span></div>`).join('')}</div></article>`;
  }).join('')||'<div class="sc-empty">조별 경기 데이터가 없습니다.</div>';
}

function gameCard(g,i){
  const [a,b]=score(g),wa=a>b,wb=b>a;
  return `<div class="sc-bracket-game"><div class="sc-bracket-title">${esc(g.stage)} ${i+1}경기</div><div class="sc-bracket-meta"><span>${esc(g.date)} ${esc(g.start||'')}</span><span>${esc(g.venue||'')}</span></div><div class="sc-horizontal-match"><div class="sc-horizontal-side ${wa?'is-winner':''}">${logo(g.teamA)}<strong>${esc(g.teamA)}</strong></div><b class="sc-horizontal-score"><span class="${wa?'is-winner':''}">${a}</span><i>-</i><span class="${wb?'is-winner':''}">${b}</span></b><div class="sc-horizontal-side is-right ${wb?'is-winner':''}"><strong>${esc(g.teamB)}</strong>${logo(g.teamB)}</div></div></div>`;
}
function decoratePodium(root){
  root?.querySelectorAll('.sc-rank').forEach(row=>{
    const label=row.querySelector('b');if(!label)return;const text=label.textContent.replace(/[🏆🥈]/gu,'').trim();const icon=text==='우승'?'🏆':text==='준우승'?'🥈':'';if(!icon)return;
    label.innerHTML=`<span class="sc-rank-trophy" aria-hidden="true">${icon}</span>${esc(text)}`;
  });
}
function renderStandingTabs(){
  const tabs=$('#scStandingTabs');if(!tabs)return;
  tabs.innerHTML=D.map(d=>`<button type="button" class="${d===standingDivision?'is-active':''}" data-kvl-division="${esc(d)}">${esc(d)}</button>`).join('');
  [...tabs.children].forEach(btn=>btn.onclick=()=>{standingDivision=btn.dataset.kvlDivision;choose(standingDivision);renderStandings()});
}
function renderStandings(){
  renderStandingTabs();
  const podiums=$('#scPodiums');
  if(podiums){
    [...podiums.querySelectorAll('.sc-podium')].forEach(card=>{card.hidden=(card.querySelector('h3')?.textContent.trim()!==standingDivision)});
    decoratePodium(podiums);
  }
  const root=$('#scBrackets');if(!root)return;
  const d=standingDivision,q=games.filter(g=>g.division===d&&['8강','7강','6강'].includes(g.stage)),s=games.filter(g=>g.division===d&&g.stage==='준결승'),f=games.filter(g=>g.division===d&&g.stage==='결승');
  if(!f.length){root.innerHTML='<div class="sc-empty">결선 결과 데이터가 없습니다.</div>';return}
  const champ=winner(f[0]),round=(label,list)=>`<div class="sc-bracket-round"><strong>${label}</strong>${list.map(gameCard).join('')}</div>`;
  root.innerHTML=`<article class="sc-bracket"><h3>${esc(d)}</h3><div class="sc-bracket-champion"><div class="sc-champion"><span class="sc-champion-trophy">🏆</span>${logo(champ)}<strong>우승 ${esc(champ)}</strong></div></div><div class="sc-bracket-grid">${round(q.length?(q.some(g=>g.stage==='6강')?'6강':q.some(g=>g.stage==='7강')?'7강':'8강'):'본선',q)}${round('준결승',s)}${round('결승',f)}</div><div class="sc-bracket-legend"><span>승리 팀과 승리 점수 · 준결승 직행팀 자동 표시</span></div></article>`;
}

function polishResults(){
  const root=$('#scResults');if(!root)return;
  root.querySelectorAll('.sc-match').forEach(match=>{
    if(match.dataset.kvlPresidentStandard==='1')return;match.dataset.kvlPresidentStandard='1';
    const meta=match.querySelector('.sc-meta');
    if(meta){const parts=meta.textContent.split('·').map(v=>v.trim()).filter(Boolean),start=parts.shift()||'',stage=parts.pop()||'',venue=parts.join(' · ');meta.innerHTML=`<div class="sc-meta-top">${esc(start)}</div><div class="sc-meta-detail"><span class="sc-stage">${esc(stage)}</span>${venue?`<span class="sc-venue" title="${esc(venue)}">${esc(venue)}</span>`:''}</div>`}
    const sides=[...match.querySelectorAll('.sc-board .sc-team')];
    sides.forEach((side,index)=>{const l=side.querySelector('.sc-team-logo'),lh=l?l.outerHTML:'';if(l)l.remove();const name=side.textContent.trim(),win=side.classList.contains('sc-winner');side.className=`sc-team ${index===0?'is-left':'is-right'}${win?' sc-winner':''}`;side.innerHTML=index===0?`${lh}<strong>${esc(name)}</strong>`:`<strong>${esc(name)}</strong>${lh}`});
  });
}
function start(){
  syncCurrentDivision();renderGroups();renderStandings();polishResults();tagLegacyDivisionButtons();
  const results=$('#scResults');if(results)new MutationObserver(()=>requestAnimationFrame(()=>{polishResults();tagLegacyDivisionButtons()})).observe(results,{childList:true,subtree:true});
  const tabsRoot=$('.sc-main');if(tabsRoot)new MutationObserver(()=>tagLegacyDivisionButtons()).observe(tabsRoot,{childList:true,subtree:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
