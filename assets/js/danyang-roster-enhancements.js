(()=>{
  const ROSTER_URL='data/competition/danyang-2026-men-roster-index.json';
  const PLAYER_URL='data/master/player_master_229_v2.json';
  const shortName=n=>String(n||'').replace('국립목포대학교','목포대').replace('경상국립대학교','경상국립대').replace('대학교','대').replace(' 남자배구부','');
  const schoolName=p=>p.current_roster?.school_name||String(p.current_roster?.team_name||'').replace(' 남자배구부','');
  const schoolCode=p=>p.current_roster?.school_code||schoolName(p);
  async function init(){
    try{
      const [roster,players]=await Promise.all([
        fetch(`${ROSTER_URL}?v=20260819-1`,{cache:'no-store'}).then(r=>r.json()),
        fetch(PLAYER_URL,{cache:'no-store'}).then(r=>r.json())
      ]);
      const rosterIds=new Set((roster.teams||[]).flatMap(t=>t.player_ids||[]));
      const rosterPlayers=(players||[]).filter(p=>rosterIds.has(p.system?.player_id));
      const heights=rosterPlayers.map(p=>Number(p.physical?.height_cm)).filter(Number.isFinite);
      const playerCount=document.getElementById('cdPlayerCount');
      const avgHeight=document.getElementById('cdAvgHeight');
      const note=document.getElementById('cdSnapshotNote');
      if(playerCount)playerCount.textContent=String(roster.total_players||rosterPlayers.length);
      if(avgHeight)avgHeight.textContent=heights.length?(heights.reduce((a,b)=>a+b,0)/heights.length).toFixed(1):'-';
      if(note)note.textContent=`단양대회 팸플릿 남대부 ${roster.total_players||rosterPlayers.length}명 명단 반영`;
      const byShort=new Map((roster.teams||[]).map(t=>[shortName(t.school_name),t]));
      const codeBySchool=new Map((players||[]).map(p=>[shortName(schoolName(p)),schoolCode(p)]));
      const applyCards=()=>{
        document.querySelectorAll('#cdTeams .cd-team-card').forEach(card=>{
          const label=card.querySelector('strong')?.textContent?.trim();
          const team=byShort.get(shortName(label));
          if(!team)return;
          const small=card.querySelector('small');
          if(small)small.textContent=`단양대회 ${team.player_count}명 · 팸플릿 p.${team.source_page}`;
          const code=codeBySchool.get(shortName(team.school_name))||team.school_name;
          card.href=`university-team.html?school=${encodeURIComponent(code)}&competition=danyang-2026`;
        });
      };
      applyCards();
      const root=document.getElementById('cdTeams');
      if(root)new MutationObserver(applyCards).observe(root,{childList:true,subtree:true});
    }catch(err){console.error('Danyang roster enhancement failed',err);}
  }
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init,{once:true}):init();
})();
