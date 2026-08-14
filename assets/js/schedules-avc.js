(()=>{
const area=document.getElementById('calendarArea');if(!area)return;
const FLAGS={대한민국:'kr',호주:'au',바레인:'bh',대만:'tw',인도:'in',인도네시아:'id',카자흐스탄:'kz',뉴질랜드:'nz',오만:'om',카타르:'qa',태국:'th'};
const VENUE={country:'인도',city:'아메다바드',tz:'Asia/Kolkata',cls:'venue-india'};
let matches=[],allTeams=[],refs=[];
let state={stage:0,teams:new Set(),selectedDay:null,timeMode:'kst',mobilePanelOpen:false,teamsOpen:true};
const month={year:2026,month:6,days:30};
const flagImg=t=>FLAGS[t]?`<img class="sv3-flag-img" src="https://flagcdn.com/w40/${FLAGS[t]}.png" alt="${t} 국기">`:'<span class="sv3-flag-img"></span>';
const venueLabel=()=>`${VENUE.country} (${VENUE.city})`;
const officialUrl=g=>g.ref?`https://en.volleyballworld.com/volleyball/competitions/avc-men-cup/schedule/${g.ref}/`:'#';
function localParts(g){
  if(state.timeMode!=='local')return{date:g.date,time:g.time};
  const[y,mo,d]=g.date.split('-').map(Number),[h,min]=g.time.split(':').map(Number);
  const utc=new Date(Date.UTC(y,mo-1,d,h-9,min));
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:VENUE.tz,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).formatToParts(utc);
  const get=t=>parts.find(p=>p.type===t)?.value||'';
  return{date:`${get('year')}-${get('month')}-${get('day')}`,time:`${get('hour')}:${get('minute')}`};
}
const displayDate=g=>localParts(g).date,displayTime=g=>localParts(g).time;
const teamAllowed=g=>!state.teams.size||state.teams.has(g.home)||state.teams.has(g.away);
const stageAllowed=g=>!state.stage||g.stage===state.stage;
function filteredGames(day){const date=`${month.year}-${String(month.month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;return matches.filter(g=>displayDate(g)===date&&stageAllowed(g)&&teamAllowed(g));}
const sectionTitle=(label,key,isOpen)=>`<button class="sv3-section-toggle" data-section="${key}" aria-expanded="${isOpen}"><span>${label}</span><span aria-hidden="true">${isOpen?'▲':'▼'}</span></button>`;
function summaryText(selected,total){if(selected===total)return'✓ 전체 국가';if(selected===0)return'전체 국가';return`국가 ${selected}개 선택`;}
function render(){area.innerHTML=`<button class="sv3-mobile-filter" id="sv3FilterToggle">☰ 필터 열기</button><div class="schedule-v3"><aside class="sv3-panel ${state.mobilePanelOpen?'open':''}" id="sv3Panel">${filtersHtml()}</aside><section><div class="sv3-main">${calendarHtml()}</div><div class="sv3-detail">${detailHtml()}</div></section></div>`;bind();}
function filtersHtml(){
  const stageBtns=[
    [0,'전체'],[1,'예선·순위전'],[4,'파이널 라운드']
  ].map(([v,l])=>`<button class="sv3-btn ${state.stage===v?'active':''}" data-stage="${v}">${l}</button>`).join('');
  const teamRows=allTeams.map(t=>`<label class="sv3-place-row sv3-team-row"><input class="sv3-check" type="checkbox" data-team="${t}" ${state.teams.has(t)?'checked':''}>${flagImg(t)}<span class="sv3-place-label">${t}</span></label>`).join('');
  return `<div class="sv3-filter-title">단계 선택</div><div class="sv3-week-buttons">${stageBtns}</div>
    <div class="sv3-filter-title">개최 지역</div><div class="sv3-places"><div class="sv3-place-row ${VENUE.cls}"><span class="sv3-dot"></span><span class="sv3-place-label">${venueLabel()}</span></div></div>
    ${sectionTitle('출전 국가','teams',state.teamsOpen)}<div class="sv3-collapsible ${state.teamsOpen?'open':''}"><button class="sv3-select-all ${state.teams.size===allTeams.length?'active':''}" data-toggle-teams>${summaryText(state.teams.size,allTeams.length)}</button><div class="sv3-places sv3-team-list">${teamRows}</div></div>
    <div class="sv3-filter-title">시간 기준</div><div class="sv3-time-row"><button class="sv3-btn ${state.timeMode==='kst'?'active':''}" data-time="kst">한국시간</button><button class="sv3-btn ${state.timeMode==='local'?'active':''}" data-time="local">인도 현지시간</button></div><div class="sv3-time-note">아메다바드 현지시간은 한국시간보다 3시간 30분 느립니다.</div>
    <div class="sv3-filter-actions"><button class="sv3-done" id="sv3Done">완료</button><button class="sv3-reset" id="sv3Reset">필터 초기화</button></div>`;
}
function calendarHtml(){
  const first=new Date(month.year,month.month-1,1).getDay(),offset=first===0?6:first-1;let cells='';
  for(let i=0;i<offset;i++)cells+='<div class="sv3-day empty"></div>';
  for(let d=1;d<=month.days;d++){
    const games=filteredGames(d),sun=(offset+d-1)%7===6,selected=state.selectedDay===d;
    cells+=`<div class="sv3-day ${sun?'sun':''} ${selected?'selected':''}" data-day="${d}"><div class="sv3-daynum">${d}</div><div class="sv3-games">${games.map(gameMini).join('')}</div>${games.length?`<div class="sv3-count">총 ${games.length}경기</div>`:''}</div>`;
  }
  return `<div class="sv3-head"><div class="sv3-month-nav"><button disabled>‹</button><div class="sv3-month-title">2026년 6월</div><button disabled>›</button></div><div class="sv3-mode">${state.timeMode==='local'?'인도 아메다바드 현지시간':'한국시간(KST) 기준'}</div></div><div class="sv3-calendar">${['월','화','수','목','금','토','일'].map(x=>`<div class="sv3-weekday">${x}</div>`).join('')}${cells}</div><div class="sv3-scroll-hint">경기를 누르면 Volleyball World 공식 경기 페이지가 새 창에서 열립니다.</div>`;
}
function gameMini(g){const middle=g.score||'vs';return `<a class="sv3-game ${VENUE.cls}" href="${officialUrl(g)}" target="_blank" rel="noopener noreferrer" aria-label="${g.home} ${middle} ${g.away} 공식 경기"><div class="sv3-game-line"><span class="sv3-game-time">${displayTime(g)}</span><span class="sv3-game-match">${g.home} ${middle} ${g.away}</span></div><span class="sv3-game-place">${venueLabel()}</span></a>`;}
function detailHtml(){
  let day=state.selectedDay;if(!day){day=Array.from({length:month.days},(_,i)=>i+1).find(d=>filteredGames(d).length)||20;state.selectedDay=day;}
  const games=filteredGames(day);
  return `<div class="sv3-detail-head"><h3>2026-06-${String(day).padStart(2,'0')} 경기 일정</h3><strong>총 ${games.length}경기</strong></div>${games.length?venueCard(games):'<div>선택 조건에 맞는 경기가 없습니다.</div>'}`;
}
function venueCard(gs){return `<section class="sv3-venue-card ${VENUE.cls}"><div class="sv3-venue-title">${venueLabel()}</div>${gs.map(g=>`<a class="sv3-match-row" href="${officialUrl(g)}" target="_blank" rel="noopener noreferrer"><time>${displayTime(g)}</time><div class="sv3-result-line"><div class="sv3-team-block">${flagImg(g.home)}<span class="sv3-team-name">${g.home}</span></div><strong class="sv3-result-score">${g.score||'vs'}</strong><div class="sv3-team-block"><span class="sv3-team-name">${g.away}</span>${flagImg(g.away)}</div></div></a>`).join('')}</section>`;}
function bind(){
  document.getElementById('sv3FilterToggle')?.addEventListener('click',()=>{state.mobilePanelOpen=true;render();});
  document.getElementById('sv3Done')?.addEventListener('click',()=>{state.mobilePanelOpen=false;render();});
  document.querySelectorAll('[data-section]').forEach(b=>b.onclick=()=>{if(b.dataset.section==='teams')state.teamsOpen=!state.teamsOpen;render();});
  document.querySelectorAll('[data-stage]').forEach(b=>b.onclick=()=>{state.stage=Number(b.dataset.stage);state.selectedDay=null;render();});
  document.querySelector('[data-toggle-teams]')?.addEventListener('click',()=>{state.teams=state.teams.size===allTeams.length?new Set():new Set(allTeams);state.selectedDay=null;render();});
  document.querySelectorAll('[data-team]').forEach(i=>i.addEventListener('change',()=>{const t=i.dataset.team;i.checked?state.teams.add(t):state.teams.delete(t);state.selectedDay=null;render();}));
  document.querySelectorAll('[data-time]').forEach(b=>b.onclick=()=>{state.timeMode=b.dataset.time;state.selectedDay=null;render();});
  document.querySelectorAll('.sv3-day[data-day]').forEach(d=>d.onclick=e=>{if(e.target.closest('a'))return;state.selectedDay=Number(d.dataset.day);render();});
  document.getElementById('sv3Reset')?.addEventListener('click',()=>{state={stage:0,teams:new Set(allTeams),selectedDay:null,timeMode:'kst',mobilePanelOpen:true,teamsOpen:true};render();});
}
fetch('data/matches/avc-2026-calendar.json?v=20260814-1',{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('schedule load failed');return r.json();}).then(data=>{
  refs=data.match_refs||[];
  matches=(data.matches||[]).map((x,i)=>({id:`KVL-M-2026-AVC-${String(i+1).padStart(2,'0')}`,date:x[0],time:x[1],stage:x[2],home:x[3],away:x[4],score:x[5],place:x[6],ref:refs[i]||null}));
  allTeams=[...new Set(matches.flatMap(g=>[g.home,g.away]))].sort((a,b)=>a.localeCompare(b,'ko'));
  const queryTeam=new URLSearchParams(location.search).get('team');
  state.teams=queryTeam&&allTeams.includes(queryTeam)?new Set([queryTeam]):new Set(allTeams);
  render();
}).catch(err=>{console.error(err);area.innerHTML='<div class="schedule-season-error">AVC Men\'s Cup 경기 일정을 불러오지 못했습니다.</div>';});
})();
