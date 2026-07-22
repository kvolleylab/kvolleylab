(()=>{
  const currentId=()=>new URLSearchParams(location.search).get('id')||'';
  const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const timeOf=m=>new Date(m.datetime_kst||`${m.date_kst}T${m.time_kst}:00+09:00`).getTime();
  const teamNames=m=>new Set([m?.home?.name_en,m?.away?.name_en].filter(Boolean));
  const sharesTeam=(a,teams)=>teams.has(a?.home?.name_en)||teams.has(a?.away?.name_en);
  const sharedLabel=(candidate,current)=>{
    const teams=teamNames(current);
    const shared=[candidate?.home,candidate?.away].find(t=>teams.has(t?.name_en));
    return shared?.name_ko||'관련 팀';
  };
  const matchHref=id=>{
    const params=new URLSearchParams(location.search);
    params.set('id',id);
    return `match.html?${params.toString()}`;
  };
  const navCard=(m,dir,current)=>{
    if(!m)return '<span class="md-nav-disabled"></span>';
    const score=m.status==='completed'&&m.score?`${m.score.home_sets}-${m.score.away_sets}`:'vs';
    const label=sharedLabel(m,current);
    return `<a class="md-nav-btn" href="${matchHref(m.match_id)}"><small>${dir==='prev'?`${esc(label)} 직전 경기`:`${esc(label)} 다음 경기`}</small><strong>${esc(m.home.name_ko)} ${score} ${esc(m.away.name_ko)}</strong><time>${esc(m.date_kst)} ${esc(m.time_kst)}</time></a>`;
  };
  async function patch(){
    const nav=document.querySelector('.md-match-nav');
    if(!nav||nav.dataset.teamNavigation==='ready')return false;
    try{
      const data=await fetch('data/matches/vnl-2026-men.json?v=20260722-team-nav',{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('matches');return r.json()});
      const list=(data.matches||[]).slice().sort((a,b)=>timeOf(a)-timeOf(b));
      const current=list.find(m=>m.match_id===currentId());
      if(!current)return false;
      const teams=teamNames(current),now=timeOf(current);
      const related=list.filter(m=>m.match_id!==current.match_id&&sharesTeam(m,teams));
      const prev=related.filter(m=>timeOf(m)<now).sort((a,b)=>timeOf(b)-timeOf(a))[0];
      const next=related.filter(m=>timeOf(m)>now).sort((a,b)=>timeOf(a)-timeOf(b))[0];
      nav.innerHTML=`${navCard(prev,'prev',current)}${navCard(next,'next',current)}`;
      nav.dataset.teamNavigation='ready';
      nav.setAttribute('aria-label','양 팀 관련 경기 이동');
      return true;
    }catch{return false;}
  }
  const observer=new MutationObserver(()=>{patch().then(done=>{if(done)observer.disconnect()})});
  observer.observe(document.documentElement,{childList:true,subtree:true});
  patch();
})();
