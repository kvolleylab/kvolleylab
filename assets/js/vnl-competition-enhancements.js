(()=>{
  const $=s=>document.querySelector(s);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const weekday=['일','월','화','수','목','금','토'];
  const roundKo=m=>m.stage!=='finals'?'예선':({Quarterfinal:'8강',Semifinal:'준결승','3rd Place':'3·4위',Final:'결승'})[m.round]||'결선';
  const monthLabel=ym=>{const [y,m]=ym.split('-');return `${y}년 ${Number(m)}월`;};

  function calendarMonth(ym,matches,scoreMap){
    const [year,month]=ym.split('-').map(Number);
    const first=new Date(year,month-1,1).getDay();
    const days=new Date(year,month,0).getDate();
    const byDate=new Map();
    matches.filter(m=>m.date_kst?.startsWith(ym)).forEach(m=>{
      if(!byDate.has(m.date_kst))byDate.set(m.date_kst,[]);
      byDate.get(m.date_kst).push(m);
    });
    const cells=[];
    for(let i=0;i<first;i++)cells.push('<div class="cd-cal-cell is-empty"></div>');
    for(let day=1;day<=days;day++){
      const date=`${ym}-${String(day).padStart(2,'0')}`;
      const games=(byDate.get(date)||[]).sort((a,b)=>(a.time_kst||'').localeCompare(b.time_kst||''));
      const gameHtml=games.map(m=>{
        const r=scoreMap.get(m.match_id),score=r?`${r.home_sets}-${r.away_sets}`:(m.score?`${m.score.home_sets}-${m.score.away_sets}`:'VS');
        const stage=roundKo(m);
        return `<a class="cd-cal-game vnl-cal-game" href="vnl.html?view=results&stage=${encodeURIComponent(stage)}" title="${esc(stage)} · ${esc(m.home?.name_ko)} vs ${esc(m.away?.name_ko)}"><time>${esc(m.time_kst||'')}</time><span>${esc(m.home?.name_ko||'')}</span><b>${esc(score)}</b><span>${esc(m.away?.name_ko||'')}</span></a>`;
      }).join('');
      cells.push(`<div class="cd-cal-cell ${games.length?'has-games':''}"><span class="cd-cal-day">${day}</span><div class="cd-cal-games">${gameHtml}</div></div>`);
    }
    while(cells.length%7)cells.push('<div class="cd-cal-cell is-empty"></div>');
    return `<section class="cd-cal-month"><div class="cd-cal-title">${monthLabel(ym)}</div><div class="cd-cal-week">${weekday.map(d=>`<span>${d}</span>`).join('')}</div><div class="cd-cal-grid">${cells.join('')}</div></section>`;
  }

  function linkResultTeams(countryByKo){
    document.querySelectorAll('#vnlResults .cd-side:not(a)').forEach(side=>{
      const name=side.querySelector('strong')?.textContent?.trim();
      const href=countryByKo.get(name);
      if(!href)return;
      const a=document.createElement('a');
      a.className=side.className;
      a.href=href;
      a.innerHTML=side.innerHTML;
      a.setAttribute('aria-label',`${name} 선수 페이지`);
      side.replaceWith(a);
    });
  }

  async function init(){
    const calendar=$('#vnlOverviewCalendar');
    if(!calendar)return;
    try{
      const [participants,prelim,finals,scores]=await Promise.all([
        fetch('data/competition/vnl-2026-men-participants.json',{cache:'no-store'}).then(r=>r.json()),
        fetch('data/matches/vnl-2026-men.json',{cache:'no-store'}).then(r=>r.json()),
        fetch('data/matches/vnl-2026-finals.json',{cache:'no-store'}).then(r=>r.json()),
        fetch('data/results/vnl-2026-men-set-scores.json',{cache:'no-store'}).then(r=>r.json())
      ]);
      const all=[...(prelim.matches||[]),...(finals.matches||[])].sort((a,b)=>(a.datetime_kst||'').localeCompare(b.datetime_kst||''));
      const scoreMap=new Map((scores.matches||[]).map(r=>[r.match_id,r]));
      const months=[...new Set(all.map(m=>m.date_kst?.slice(0,7)).filter(Boolean))].sort();
      calendar.innerHTML=months.map(ym=>calendarMonth(ym,all,scoreMap)).join('');

      const countryByKo=new Map((participants.participants||[]).map(p=>[p.country_ko,p.country_page]));
      const results=$('#vnlResults');
      if(results){
        linkResultTeams(countryByKo);
        new MutationObserver(()=>linkResultTeams(countryByKo)).observe(results,{childList:true,subtree:true});
      }

      const requestedStage=new URLSearchParams(location.search).get('stage');
      if(requestedStage){
        const filters=$('#vnlStageFilters');
        const activateStage=()=>{
          const btn=[...filters.querySelectorAll('[data-stage]')].find(b=>b.dataset.stage===requestedStage);
          if(btn&&!btn.classList.contains('is-active'))btn.click();
        };
        activateStage();
        new MutationObserver(activateStage).observe(filters,{childList:true,subtree:true});
      }
    }catch(err){
      console.error(err);
      calendar.innerHTML='<div class="cd-empty">달력 데이터를 불러오지 못했습니다.</div>';
    }
  }
  document.addEventListener('DOMContentLoaded',init);
})();
