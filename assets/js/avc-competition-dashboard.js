(()=>{
  const ISO2={AUS:'au',BRN:'bh',TPE:'tw',IND:'in',INA:'id',KAZ:'kz',KOR:'kr',NZL:'nz',OMA:'om',QAT:'qa',THA:'th'};
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const flagUrl=code=>`https://flagcdn.com/w80/${ISO2[code]||'un'}.png`;
  const viewParam=new URLSearchParams(location.search).get('view')||'overview';
  const views=[...document.querySelectorAll('.cd-view')],nav=[...document.querySelectorAll('.cd-jump [data-view]')];
  function activate(view){const target=views.some(x=>x.id===view)?view:'overview';views.forEach(x=>x.classList.toggle('is-active',x.id===target));nav.forEach(x=>x.classList.toggle('is-active',x.dataset.view===target));}
  activate(viewParam);nav.forEach(a=>a.addEventListener('click',e=>{e.preventDefault();const v=a.dataset.view;history.replaceState(null,'',`?view=${encodeURIComponent(v)}`);activate(v);window.scrollTo({top:document.querySelector('.cd-jump').offsetTop-16,behavior:'smooth'});}));
  const matchLink=id=>`https://en.volleyballworld.com/volleyball/competitions/avc-men-cup/schedule/${id}/`;
  Promise.all([
    fetch('data/competition/avc-men-cup-2026-men-participants.json',{cache:'no-store'}).then(r=>r.json()),
    fetch('data/competition/avc-men-cup-2026-men-rosters.json',{cache:'no-store'}).then(r=>r.json()),
    fetch('data/matches/avc-2026-calendar.json',{cache:'no-store'}).then(r=>r.json()),
    fetch('data/competition/avc-men-cup-2026-results-detail.json',{cache:'no-store'}).then(r=>r.json())
  ]).then(([participantsData,rosterData,matchData,detail])=>{
    const participants=participantsData.participants||[],teams=rosterData.teams||[],matches=matchData.matches||[],byId=new Map(participants.map(x=>[x.participant_id,x])),rosterById=new Map(teams.map(x=>[x.participant_id,x]));
    const setMap=detail.set_scores||{},poolMembers=detail.pool_members||{};
    document.getElementById('avcCountryCount').textContent=participants.length;document.getElementById('avcPlayerCount').textContent=teams.reduce((n,t)=>n+(t.players||[]).length,0);document.getElementById('avcMatchCount').textContent=matches.length;document.getElementById('avcCompletedCount').textContent=matches.filter(m=>m.status==='completed').length;
    document.getElementById('avcCountries').innerHTML=participants.map(p=>{const c=(rosterById.get(p.participant_id)?.players||[]).length;return `<a class="avc-country-card" href="national-team-tournament-roster.html?competition=avc-men-cup-2026&country=${encodeURIComponent(p.country_ko)}"><img class="avc-country-flag" src="${flagUrl(p.code)}" alt="${esc(p.country_ko)} 국기"><strong>${esc(p.country_ko)}</strong><small>${esc(p.country)} · Team ${esc(p.volleyball_world_team_id)}</small><em>${c}명 반영 완료</em></a>`;}).join('');
    const renderMatch=m=>{const h=byId.get(m.home_participant_id),a=byId.get(m.away_participant_id),sets=setMap[m.official_match_id]||[],score=m.result?`${m.result.home_sets}-${m.result.away_sets}`:'vs';return `<a class="avc-result-row" href="${matchLink(m.official_match_id)}" target="_blank" rel="noopener noreferrer"><time>${esc(m.date.slice(5))}<br>${esc(m.time)} KST</time><span class="avc-result-team is-home"><strong>${esc(m.home)}</strong><img src="${flagUrl(h?.code)}" alt=""></span><b class="avc-result-score">${score}</b><span class="avc-result-team"><img src="${flagUrl(a?.code)}" alt=""><strong>${esc(m.away)}</strong></span><span class="avc-set-scores">${sets.map((s,i)=>`<em>${i+1}세트 ${esc(s)}</em>`).join('')}</span></a>`;};
    document.getElementById('avcResults').innerHTML=matches.map(renderMatch).join('');
    const prelim=matches.filter(m=>m.official_match_id<=28212);
    const poolOf=m=>Object.entries(poolMembers).find(([,ids])=>ids.includes(m.home_participant_id)&&ids.includes(m.away_participant_id))?.[0];
    document.getElementById('avcPoolResults').innerHTML=['A','B'].map(pool=>`<section class="avc-pool-card"><h3>${pool}조</h3><div class="avc-result-list">${prelim.filter(m=>poolOf(m)===pool).map(renderMatch).join('')}</div></section>`).join('');
    document.getElementById('avcPoolStandings').innerHTML=['A','B'].map(pool=>`<section class="avc-standing-card"><h3>${pool}조</h3><div class="avc-standing-head"><span>순위</span><span>팀</span><span>경기</span><span>승</span><span>패</span><span>승점</span><span>세트</span></div>${(detail.pools?.[pool]||[]).map(r=>{const p=byId.get(r.participant_id);return `<div class="avc-standing-row ${r.rank<=2?'is-qualified':''}"><span>${r.rank}</span><span class="avc-standing-team"><img src="${flagUrl(p?.code)}" alt="">${esc(p?.country_ko)}</span><span>${r.played}</span><span>${r.won}</span><span>${r.lost}</span><strong>${r.points}</strong><span>${r.sets_won}-${r.sets_lost}</span></div>`;}).join('')}</section>`).join('');
    document.getElementById('avcFinalStandings').innerHTML=(matchData.final_standings||[]).map((id,i)=>{const p=byId.get(id);return p?`<div class="avc-final-row"><span class="avc-final-rank">${i+1}</span><img src="${flagUrl(p.code)}" alt=""><strong>${esc(p.country_ko)}</strong><span>${esc(p.country)}</span></div>`:'';}).join('');
    const byOfficial=id=>matches.find(m=>m.official_match_id===id);
    const bracketMatch=(id,label)=>{const m=byOfficial(id),h=byId.get(m.home_participant_id),a=byId.get(m.away_participant_id),homeWon=m.result.home_sets>m.result.away_sets,awayWon=m.result.away_sets>m.result.home_sets;return `<a class="avc-bracket-match" href="${matchLink(id)}" target="_blank" rel="noopener noreferrer"><small>${label}</small><span class="${homeWon?'is-winner':''}"><img src="${flagUrl(h?.code)}" alt=""><strong>${esc(m.home)}</strong><b>${m.result.home_sets}</b></span><span class="${awayWon?'is-winner':''}"><img src="${flagUrl(a?.code)}" alt=""><strong>${esc(m.away)}</strong><b>${m.result.away_sets}</b></span></a>`;};
    document.getElementById('avcBracket').innerHTML=`
      <div class="avc-ladder-final"><div class="avc-ladder-label">결승</div>${bracketMatch(28219,'결승')}</div>
      <div class="avc-ladder-third"><div class="avc-ladder-label">3·4위 결정전</div>${bracketMatch(28218,'3·4위 결정전')}</div>
      <span class="avc-ladder-line v-final"></span><span class="avc-ladder-line h-merge"></span><span class="avc-ladder-line v-left"></span><span class="avc-ladder-line v-right"></span>
      <div class="avc-ladder-semi avc-ladder-semi-1"><div class="avc-ladder-label">준결승 1</div>${bracketMatch(28214,'준결승 1')}</div>
      <div class="avc-ladder-semi avc-ladder-semi-2"><div class="avc-ladder-label">준결승 2</div>${bracketMatch(28215,'준결승 2')}</div>`;
    document.getElementById('avcPlacementMatches').innerHTML=`<h3>순위 결정전</h3><div class="avc-placement-grid">${bracketMatch(28217,'5-6위')}${bracketMatch(28216,'7-8위')}${bracketMatch(28213,'9-10위')}</div>`;
  }).catch(err=>{console.error(err);document.querySelectorAll('.cd-empty').forEach(el=>el.textContent='데이터를 불러오지 못했습니다.');});
})();