(()=>{
  const ISO2={AUS:'au',BRN:'bh',TPE:'tw',IND:'in',INA:'id',KAZ:'kz',KOR:'kr',NZL:'nz',OMA:'om',QAT:'qa',THA:'th'};
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const flagUrl=code=>`https://flagcdn.com/w80/${ISO2[code]||'un'}.png`;
  const viewParam=new URLSearchParams(location.search).get('view')||'overview';
  const views=[...document.querySelectorAll('.cd-view')];
  const nav=[...document.querySelectorAll('.cd-jump [data-view]')];
  function activate(view){
    const target=views.some(x=>x.id===view)?view:'overview';
    views.forEach(x=>x.classList.toggle('is-active',x.id===target));
    nav.forEach(x=>x.classList.toggle('is-active',x.dataset.view===target));
  }
  activate(viewParam);
  nav.forEach(a=>a.addEventListener('click',e=>{e.preventDefault();const view=a.dataset.view;history.replaceState(null,'',`?view=${encodeURIComponent(view)}`);activate(view);window.scrollTo({top:document.querySelector('.cd-jump').offsetTop-16,behavior:'smooth'});}));

  Promise.all([
    fetch('data/competition/avc-men-cup-2026-men-participants.json',{cache:'no-store'}).then(r=>r.json()),
    fetch('data/competition/avc-men-cup-2026-men-rosters.json',{cache:'no-store'}).then(r=>r.json()),
    fetch('data/matches/avc-2026-calendar.json',{cache:'no-store'}).then(r=>r.json())
  ]).then(([participantsData,rosterData,matchData])=>{
    const participants=participantsData.participants||[];
    const teams=rosterData.teams||[];
    const matches=matchData.matches||[];
    const byId=new Map(participants.map(x=>[x.participant_id,x]));
    const rosterById=new Map(teams.map(x=>[x.participant_id,x]));
    const totalPlayers=teams.reduce((n,t)=>n+(t.players||[]).length,0);
    document.getElementById('avcCountryCount').textContent=participants.length;
    document.getElementById('avcPlayerCount').textContent=totalPlayers;
    document.getElementById('avcMatchCount').textContent=matches.length;
    document.getElementById('avcCompletedCount').textContent=matches.filter(m=>m.status==='completed').length;

    const grid=document.getElementById('avcCountries');
    grid.innerHTML=participants.map(p=>{
      const roster=rosterById.get(p.participant_id);
      const count=(roster?.players||[]).length;
      return `<a class="avc-country-card" href="national-team-tournament-roster.html?competition=avc-men-cup-2026&country=${encodeURIComponent(p.country_ko)}"><img class="avc-country-flag" src="${flagUrl(p.code)}" alt="${esc(p.country_ko)} 국기" width="64" height="43"><strong>${esc(p.country_ko)}</strong><small>${esc(p.country)} · Team ${esc(p.volleyball_world_team_id)}</small><em>${count}명 반영 완료</em></a>`;
    }).join('');

    const results=document.getElementById('avcResults');
    results.innerHTML=matches.map(m=>{
      const home=byId.get(m.home_participant_id),away=byId.get(m.away_participant_id);
      const score=m.result?`${m.result.home_sets}-${m.result.away_sets}`:'vs';
      const official=m.official_match_id?`https://en.volleyballworld.com/volleyball/competitions/avc-men-cup/schedule/${m.official_match_id}/`:'#';
      return `<a class="avc-result-row" href="${official}" target="_blank" rel="noopener noreferrer"><time>${esc(m.date.slice(5))}<br>${esc(m.time)} KST</time><span class="avc-result-team is-home"><strong>${esc(m.home)}</strong><img src="${flagUrl(home?.code)}" alt="${esc(m.home)} 국기"></span><b class="avc-result-score">${score}</b><span class="avc-result-team"><img src="${flagUrl(away?.code)}" alt="${esc(m.away)} 국기"><strong>${esc(m.away)}</strong></span></a>`;
    }).join('');

    const standings=document.getElementById('avcFinalStandings');
    standings.innerHTML=(matchData.final_standings||[]).map((id,i)=>{
      const p=byId.get(id); if(!p)return '';
      return `<div class="avc-final-row"><span class="avc-final-rank">${i+1}</span><img src="${flagUrl(p.code)}" alt="${esc(p.country_ko)} 국기"><strong>${esc(p.country_ko)}</strong><span>${esc(p.country)}</span></div>`;
    }).join('');
  }).catch(err=>{
    console.error(err);
    ['avcCountries','avcResults','avcFinalStandings'].forEach(id=>{const el=document.getElementById(id);if(el)el.innerHTML='<div class="cd-empty">데이터를 불러오지 못했습니다.</div>';});
  });
})();