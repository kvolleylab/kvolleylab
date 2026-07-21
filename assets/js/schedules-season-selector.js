(()=>{
  const host=document.getElementById('scheduleSeasonSelector');
  if(!host)return;

  const params=new URLSearchParams(location.search);
  const currentCompetition=params.get('competition')||'vnl';
  const currentSeason=params.get('season')||'2026';

  Promise.all([
    fetch('data/competitions/index.json',{cache:'no-store'}).then(r=>r.json()),
    fetch(`data/competitions/${currentCompetition}/seasons.json`,{cache:'no-store'}).then(r=>r.json())
  ]).then(([competitionData,seasonData])=>{
    const competitions=competitionData.competitions||[];
    const seasons=seasonData.seasons||[];

    host.innerHTML=`
      <div class="schedule-season-control">
        <label>대회
          <select id="competitionSelect">
            ${competitions.map(c=>`<option value="${c.id}" ${c.id===currentCompetition?'selected':''}>${c.name_ko}</option>`).join('')}
          </select>
        </label>
        <label>연도
          <select id="seasonSelect">
            ${seasons.map(s=>`<option value="${s.season}" ${s.season===currentSeason?'selected':''}>${s.label}</option>`).join('')}
          </select>
        </label>
      </div>`;

    const go=()=>{
      const competition=document.getElementById('competitionSelect').value;
      const season=document.getElementById('seasonSelect').value;
      location.href=`schedules.html?competition=${encodeURIComponent(competition)}&season=${encodeURIComponent(season)}`;
    };

    document.getElementById('competitionSelect').addEventListener('change',e=>{
      const competition=e.target.value;
      fetch(`data/competitions/${competition}/seasons.json`,{cache:'no-store'})
        .then(r=>r.json())
        .then(data=>{
          const season=(data.default_season||(data.seasons?.[0]?.season)||'2026');
          location.href=`schedules.html?competition=${encodeURIComponent(competition)}&season=${encodeURIComponent(season)}`;
        });
    });
    document.getElementById('seasonSelect').addEventListener('change',go);
  }).catch(()=>{
    host.innerHTML='<div class="schedule-season-error">대회·연도 목록을 불러오지 못했습니다.</div>';
  });
})();
