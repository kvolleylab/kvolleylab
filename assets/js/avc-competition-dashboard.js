(()=>{
  const ISO2={AUS:'au',BRN:'bh',TPE:'tw',IND:'in',INA:'id',KAZ:'kz',KOR:'kr',NZL:'nz',OMA:'om',QAT:'qa',THA:'th'};
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const flagUrl=code=>`https://flagcdn.com/w80/${ISO2[code]||'un'}.png`;
  const params=new URLSearchParams(location.search);
  const requestedView=params.get('view')||'overview';
  const viewParam=requestedView==='pool-results'?'results':requestedView;
  let stageFilter=params.get('stage')||(requestedView==='pool-results'?'예선':'전체');
  let poolFilter=params.get('pool')||'전체';
  const views=[...document.querySelectorAll('.cd-view')],nav=[...document.querySelectorAll('.cd-jump [data-view]')];
  function activate(view){const target=views.some(x=>x.id===view)?view:'overview';views.forEach(x=>x.classList.toggle('is-active',x.id===target));nav.forEach(x=>x.classList.toggle('is-active',x.dataset.view===target));}
  activate(viewParam);
  if(requestedView==='pool-results')history.replaceState(null,'','?view=results&stage=%EC%98%88%EC%84%A0');
  nav.forEach(a=>a.addEventListener('click',e=>{e.preventDefault();const v=a.dataset.view;history.replaceState(null,'',`?view=${encodeURIComponent(v)}`);activate(v);window.scrollTo({top:document.querySelector('.cd-jump').offsetTop-16,behavior:'smooth'});}));
  const matchLink=id=>`https://en.volleyballworld.com/volleyball/competitions/avc-men-cup/schedule/${id}/`;
  const weekday=date=>['일','월','화','수','목','금','토'][new Date(`${date}T00:00:00+09:00`).getDay()];
  const displayStage=m=>m.official_match_id<=28212?'예선':m.official_match_id===28214||m.official_match_id===28215?'준결승':m.official_match_id===28218?'3·4위 결정전':m.official_match_id===28219?'결승':'순위 결정전';
  const filterStage=m=>m.official_match_id<=28212?'예선':m.official_match_id===28214||m.official_match_id===28215?'준결승':m.official_match_id===28219?'결승':'순위 결정전';

  Promise.all([
    fetch('data/competition/avc-men-cup-2026-men-participants.json',{cache:'no-store'}).then(r=>r.json()),
    fetch('data/competition/avc-men-cup-2026-men-rosters.json',{cache:'no-store'}).then(r=>r.json()),
    fetch('data/matches/avc-2026-calendar.json',{cache:'no-store'}).then(r=>r.json()),
    fetch('data/competition/avc-men-cup-2026-results-detail.json',{cache:'no-store'}).then(r=>r.json())
  ]).then(([participantsData,rosterData,matchData,detail])=>{
    const participants=participantsData.participants||[],teams=rosterData.teams||[],matches=matchData.matches||[],byId=new Map(participants.map(x=>[x.participant_id,x])),rosterById=new Map(teams.map(x=>[x.participant_id,x]));
    const setMap=detail.set_scores||{},poolMembers=detail.pool_members||{};
    const poolOf=m=>Object.entries(poolMembers).find(([,ids])=>ids.includes(m.home_participant_id)&&ids.includes(m.away_participant_id))?.[0]||'';
    document.getElementById('avcCountryCount').textContent=participants.length;
    document.getElementById('avcPlayerCount').textContent=teams.reduce((n,t)=>n+(t.players||[]).length,0);
    document.getElementById('avcMatchCount').textContent=matches.length;
    document.getElementById('avcCompletedCount').textContent=matches.filter(m=>m.status==='completed').length;

    document.getElementById('avcCountries').innerHTML=participants.map(p=>{const c=(rosterById.get(p.participant_id)?.players||[]).length;return `<a class="avc-country-card" href="national-team-tournament-roster.html?competition=avc-men-cup-2026&country=${encodeURIComponent(p.country_ko)}"><img class="avc-country-flag" src="${flagUrl(p.code)}" alt="${esc(p.country_ko)} 국기"><strong>${esc(p.country_ko)}</strong><small>${esc(p.country)} · Team ${esc(p.volleyball_world_team_id)}</small><em>${c}명 반영 완료</em></a>`;}).join('');

    const flagHtml=(p,name)=>`<span class="cd-inline-logo avc-inline-flag"><img src="${flagUrl(p?.code)}" alt="${esc(name)} 국기" loading="lazy"></span>`;
    const renderStandardMatch=m=>{
      const h=byId.get(m.home_participant_id),a=byId.get(m.away_participant_id),sets=setMap[m.official_match_id]||[];
      const homeSets=m.result?.home_sets,awaySets=m.result?.away_sets,homeWon=homeSets>awaySets,awayWon=awaySets>homeSets;
      const pool=poolOf(m),stage=`${displayStage(m)}${pool&&m.official_match_id<=28212?` · ${pool}조`:''}`;
      return `<article class="cd-match"><div class="cd-match-meta"><time>${esc(m.time)}</time><span>${esc(stage)}</span></div><div class="cd-match-board"><a class="cd-side is-left" href="${matchLink(m.official_match_id)}" target="_blank" rel="noopener noreferrer"><strong class="${homeWon?'cd-winner':''}">${esc(m.home)}</strong>${flagHtml(h,m.home)}</a><b class="cd-score">${homeSets??'-'}-${awaySets??'-'}</b><a class="cd-side is-right" href="${matchLink(m.official_match_id)}" target="_blank" rel="noopener noreferrer">${flagHtml(a,m.away)}<strong class="${awayWon?'cd-winner':''}">${esc(m.away)}</strong></a></div><div class="cd-set-scores">${sets.map(s=>`<span>${esc(s)}</span>`).join('')}</div></article>`;
    };
    const renderDateGroups=list=>{
      const groups=list.reduce((acc,m)=>{(acc[m.date]??=[]).push(m);return acc;},{});
      return Object.entries(groups).map(([date,games])=>`<section class="cd-date-group"><div class="cd-date-head"><span>${esc(date)}(${weekday(date)})</span><span>${games.length}경기</span></div>${games.map(renderStandardMatch).join('')}</section>`).join('')||'<div class="cd-empty">선택한 조건의 경기결과가 없습니다.</div>';
    };

    const standard=window.KVLCompetitionResultsStandard;
    const stages=['전체','예선','준결승','결승','순위 결정전'];
    const pools=Object.keys(poolMembers).sort();
    function syncResultUrl(){const q=new URLSearchParams({view:'results'});if(stageFilter!=='전체')q.set('stage',stageFilter);if(stageFilter==='예선'&&poolFilter!=='전체')q.set('pool',poolFilter);history.replaceState(null,'',`?${q.toString()}`);}
    function renderResults(){
      if(!stages.includes(stageFilter))stageFilter='전체';
      if(!['전체',...pools].includes(poolFilter))poolFilter='전체';
      const list=standard?standard.filterMatches(matches,{stage:stageFilter,pool:poolFilter,getStage:filterStage,getPool:poolOf}):matches;
      document.getElementById('avcResultSummary').textContent=`남자부 ${list.length}경기 · ${stageFilter==='전체'?'전체 단계':stageFilter}${stageFilter==='예선'&&poolFilter!=='전체'?` · ${poolFilter}조`:''}`;
      document.getElementById('avcResults').innerHTML=renderDateGroups(list);
      standard?.renderStageFilters({container:document.getElementById('avcStageFilters'),stages,stage:stageFilter,pools,pool:poolFilter,onChange:next=>{stageFilter=next.stage;poolFilter=next.pool;syncResultUrl();renderResults();}});
    }
    renderResults();

    document.getElementById('avcPoolStandings').innerHTML=['A','B'].map(pool=>`<section class="avc-standing-card"><h3>${pool}조</h3><div class="avc-standing-head"><span>순위</span><span>팀</span><span>경기</span><span>승</span><span>패</span><span>승점</span><span>세트</span></div>${(detail.pools?.[pool]||[]).map(r=>{const p=byId.get(r.participant_id);return `<div class="avc-standing-row ${r.rank<=2?'is-qualified':''}"><span>${r.rank}</span><span class="avc-standing-team"><img src="${flagUrl(p?.code)}" alt="">${esc(p?.country_ko)}</span><span>${r.played}</span><span>${r.won}</span><span>${r.lost}</span><strong>${r.points}</strong><span>${r.sets_won}-${r.sets_lost}</span></div>`;}).join('')}</section>`).join('');
    document.getElementById('avcFinalStandings').innerHTML=(matchData.final_standings||[]).map((id,i)=>{const p=byId.get(id);return p?`<div class="avc-final-row"><span class="avc-final-rank">${i+1}</span><img src="${flagUrl(p.code)}" alt=""><strong>${esc(p.country_ko)}</strong><span>${esc(p.country)}</span></div>`:'';}).join('');

    const byOfficial=id=>matches.find(m=>m.official_match_id===id);
    const bracketTeam=(p,name,score,won)=>`<div class="avc-bracket-team ${won?'is-winner':''}"><img src="${flagUrl(p?.code)}" alt="${esc(name)} 국기" loading="lazy"><strong>${esc(name)}</strong><b>${score??'-'}</b></div>`;
    const bracketMatch=(id,label)=>{
      const m=byOfficial(id);if(!m)return `<article class="avc-bracket-match"><div class="avc-bracket-match-head"><strong>${esc(label)}</strong><span>일정 미정</span></div><div class="avc-bracket-team is-tbd"><span>?</span><strong>TBD</strong></div><div class="avc-bracket-team is-tbd"><span>?</span><strong>TBD</strong></div></article>`;
      const h=byId.get(m.home_participant_id),a=byId.get(m.away_participant_id),hs=m.result?.home_sets,as=m.result?.away_sets,homeWon=hs>as,awayWon=as>hs;
      return `<a class="avc-bracket-match" href="${matchLink(id)}" target="_blank" rel="noopener noreferrer"><div class="avc-bracket-match-head"><strong>${esc(label)}</strong><span>${esc(m.date?.slice(5)||'')} · ${esc(m.time||'')}</span></div>${bracketTeam(h,m.home,hs,homeWon)}${bracketTeam(a,m.away,as,awayWon)}</a>`;
    };
    document.getElementById('avcBracket').innerHTML=`<div class="avc-bracket-ladder is-two-round"><section class="avc-round avc-round-sf"><h3 class="avc-round-title">준결승 · Semifinals</h3><div class="avc-round-body">${bracketMatch(28214,'SF1')}${bracketMatch(28215,'SF2')}</div></section><span class="avc-bracket-gap"></span><section class="avc-round avc-round-final"><h3 class="avc-round-title">결승 · Final</h3><div class="avc-round-body">${bracketMatch(28219,'FINAL')}</div></section></div><div class="avc-bronze-wrap"><h3 class="avc-bronze-title">3위 결정전 · Bronze Medal Match</h3>${bracketMatch(28218,'3RD')}</div>`;
    document.getElementById('avcPlacementMatches').innerHTML=`<h3>순위 결정전</h3><div class="avc-placement-grid">${bracketMatch(28217,'5-6위')}${bracketMatch(28216,'7-8위')}${bracketMatch(28213,'9-10위')}</div>`;
  }).catch(err=>{console.error(err);document.querySelectorAll('.cd-empty').forEach(el=>el.textContent='데이터를 불러오지 못했습니다.');});
})();