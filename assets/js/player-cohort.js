(() => {
  const DATA_URL='data/national/national_team_history_v1.json';
  const LEGACY_URLS=['data/national/national_team_history_2018_2019.json','data/national/national_team_history_2016_2017.json','data/national/national_team_history_2014_2015.json','data/national/national_team_roster_2014_u18.json','data/national/national_team_history_2012_2013.json','data/national/national_team_roster_2012_u20.json','data/national/national_team_history_2010_2011.json','data/national/national_team_world_u23_2015.json','data/national/national_team_roster_2010_u18.json','data/national/national_team_roster_2019_u19.json'];
  const LINK_URL='data/national/player_id_links_v1.json';
  const params=new URLSearchParams(location.search),initialYear=Number(params.get('birth_year'))||2005,levels=['U16','U17','U18','U19','U20','U21','U23'];
  const grid=document.getElementById('cohortGrid'),title=document.getElementById('cohortTitle'),summary=document.getElementById('cohortSummary'),filter=document.getElementById('birthYearFilter');
  let db;
  const esc=v=>String(v??'').replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const by=r=>Number(String(r.birth_date||'').slice(0,4));
  const key=r=>`${r.name_ko}|${r.birth_date}`;
  const isAgeLevel=level=>/^U\d+$/i.test(String(level||'').trim());
  const eventOrder=e=>`${String(e?.year||'9999').padStart(4,'0')}-${e?.start_date||'99-99'}`;
  const historyHref=(e,senior=false)=>`national-team-history.html?scope=${senior?'senior':'age'}&event=${encodeURIComponent(e.event_id)}`;
  function merge(x){if(!x)return;db.events=[...(x.events||[]),...db.events];db.rosters=[...(x.rosters||[]),...db.rosters];}
  function years(){return [...new Set(db.rosters.map(by).filter(Boolean))].sort((a,b)=>b-a);}
  function render(year){
    title.textContent=`${year}년생 세대 보기`;
    document.title=`${year}년생 세대 | K-Volley Lab`;
    const rows=db.rosters.filter(r=>by(r)===year),players=new Map();
    rows.forEach(r=>{
      const k=key(r);
      if(!players.has(k))players.set(k,{base:r,player_id:r.player_id||null,levels:new Map(),senior:[]});
      const p=players.get(k);
      if(r.player_id&&!p.player_id)p.player_id=r.player_id;
      const e=db.events.find(x=>x.event_id===r.event_id);
      if(!e)return;
      if(isAgeLevel(e.level))p.levels.set(String(e.level).toUpperCase(),e);
      else p.senior.push(e);
    });
    let seniorEntered=0;
    players.forEach(p=>{p.senior.sort((a,b)=>eventOrder(a).localeCompare(eventOrder(b)));if(p.senior.length)seniorEntered+=1;});
    summary.textContent=`대한민국 남자 ${year}년생 · 현재 확인된 대표선수 ${players.size}명 · 성인대표 진입 ${seniorEntered}명 · 구축된 공식/검증 자료 기반`;
    const head=`<div class="cohort-card header"><div>선수</div>${levels.map(l=>`<div class="stage-cell">${l}</div>`).join('')}<div class="stage-cell senior-stage-head">성인</div></div>`;
    const body=[...players.values()].sort((a,b)=>a.base.name_ko.localeCompare(b.base.name_ko,'ko')).map(p=>{
      const r=p.base;
      const n=p.player_id?`<a class="cohort-link" href="player-profile.html?id=${encodeURIComponent(p.player_id)}">${esc(r.name_ko)}</a>`:esc(r.name_ko);
      const ageCells=levels.map(l=>{const e=p.levels.get(l);return e?`<div class="stage-cell" title="${esc(e.competition_name_ko)}"><a class="stage-dot" href="${historyHref(e)}" aria-label="${esc(e.competition_name_ko)} 히스토리에서 보기">● ${esc(e.year)}</a></div>`:'<div class="stage-cell stage-empty">—</div>';}).join('');
      const firstSenior=p.senior[0];
      const seniorCell=firstSenior?`<div class="stage-cell" title="성인 첫 선발 · ${esc(firstSenior.competition_name_ko)}"><a class="stage-dot is-senior" href="${historyHref(firstSenior,true)}" aria-label="${esc(firstSenior.competition_name_ko)} 히스토리에서 보기">● ${esc(firstSenior.year)}</a></div>`:'<div class="stage-cell stage-empty">—</div>';
      return `<div class="cohort-card"><div><div class="player-name">${n}</div><div class="player-meta">${esc(r.position||'-')} · ${r.height_cm?`${esc(r.height_cm)}cm`:'키 확인 중'} · ${esc(r.birth_date||'생년월일 확인 중')}</div></div>${ageCells}${seniorCell}</div>`;
    }).join('');
    grid.innerHTML=players.size?head+body:'<div class="empty">이 출생연도의 대표팀 기록이 아직 없습니다.</div>';
    const u=new URL(location.href);u.searchParams.set('birth_year',year);history.replaceState(null,'',u);
  }
  async function init(){
    try{
      const [base,links,...legacy]=await Promise.all([fetch(DATA_URL),fetch(LINK_URL).catch(()=>null),...LEGACY_URLS.map(u=>fetch(u).catch(()=>null))]);
      if(!base.ok)throw new Error(`HTTP ${base.status}`);
      db=await base.json();
      for(const r of legacy)if(r&&r.ok)merge(await r.json());
      db.events=db.events.filter((e,i,a)=>a.findIndex(x=>x.event_id===e.event_id)===i);
      if(links&&links.ok){const m=new Map((await links.json()).links.map(x=>[`${x.name_ko}|${x.birth_date}`,x.player_id]));db.rosters.forEach(r=>{if(!r.player_id&&m.has(key(r)))r.player_id=m.get(key(r));});}
      const ys=years();filter.innerHTML=ys.map(y=>`<option value="${y}">${y}</option>`).join('');const start=ys.includes(initialYear)?initialYear:ys[0];filter.value=start;render(start);filter.addEventListener('change',()=>render(Number(filter.value)));
    }catch(err){grid.innerHTML=`<div class="empty">세대 DB를 불러오지 못했습니다. ${esc(err.message)}</div>`;}
  }
  init();
})();
