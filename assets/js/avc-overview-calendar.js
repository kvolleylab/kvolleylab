(()=>{
  const root=document.getElementById('avcOverviewCalendar');
  if(!root)return;
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const weekdays=['일','월','화','수','목','금','토'];
  const stageOf=m=>m.official_match_id<=28212?'예선':m.official_match_id===28214||m.official_match_id===28215?'준결승':m.official_match_id===28218?'순위 결정전':m.official_match_id===28219?'결승':'순위 결정전';
  const monthLabel=ym=>{const [y,m]=ym.split('-');return `${y}년 ${Number(m)}월`;};
  function renderMonth(ym,matches){
    const [year,month]=ym.split('-').map(Number);
    const first=new Date(year,month-1,1).getDay();
    const days=new Date(year,month,0).getDate();
    const byDate=new Map();
    matches.filter(m=>m.date?.startsWith(ym)).forEach(m=>{if(!byDate.has(m.date))byDate.set(m.date,[]);byDate.get(m.date).push(m)});
    const cells=[];
    for(let i=0;i<first;i++)cells.push('<div class="cd-cal-cell is-empty"></div>');
    for(let day=1;day<=days;day++){
      const date=`${ym}-${String(day).padStart(2,'0')}`;
      const games=(byDate.get(date)||[]).sort((a,b)=>(a.time||'').localeCompare(b.time||''));
      const gamesHtml=games.map(m=>{
        const hs=m.result?.home_sets,as=m.result?.away_sets,score=Number.isFinite(hs)&&Number.isFinite(as)?`${hs}-${as}`:'VS';
        const stage=stageOf(m);
        return `<a class="cd-cal-game" href="avc-men-cup.html?view=results&stage=${encodeURIComponent(stage)}" title="${esc(stage)} · ${esc(m.home)} vs ${esc(m.away)}"><time>${esc(m.time||'')}</time><span>${esc(m.home||'')}</span><b>${esc(score)}</b><span>${esc(m.away||'')}</span></a>`;
      }).join('');
      cells.push(`<div class="cd-cal-cell ${games.length?'has-games':''}"><span class="cd-cal-day">${day}</span><div class="cd-cal-games">${gamesHtml}</div></div>`);
    }
    while(cells.length%7)cells.push('<div class="cd-cal-cell is-empty"></div>');
    return `<section class="cd-cal-month"><div class="cd-cal-title">${monthLabel(ym)}</div><div class="cd-cal-week">${weekdays.map(d=>`<span>${d}</span>`).join('')}</div><div class="cd-cal-grid">${cells.join('')}</div></section>`;
  }
  fetch('data/matches/avc-2026-calendar.json',{cache:'no-store'}).then(r=>r.json()).then(data=>{
    const matches=data.matches||[];
    const months=[...new Set(matches.map(m=>m.date?.slice(0,7)).filter(Boolean))].sort();
    root.innerHTML=months.map(ym=>renderMonth(ym,matches)).join('')||'<div class="cd-empty">대회 일정이 없습니다.</div>';
  }).catch(err=>{console.error(err);root.innerHTML='<div class="cd-empty">달력 데이터를 불러오지 못했습니다.</div>';});
})();
