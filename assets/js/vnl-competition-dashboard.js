(()=>{
  const $=s=>document.querySelector(s);
  const $$=s=>Array.from(document.querySelectorAll(s));
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const flagCodes={Japan:'jp',Brazil:'br',Poland:'pl',Iran:'ir',USA:'us',France:'fr',Argentina:'ar',Italy:'it',Canada:'ca',Belgium:'be',Cuba:'cu',Slovenia:'si',Germany:'de',Serbia:'rs','Türkiye':'tr',Bulgaria:'bg',China:'cn',Ukraine:'ua'};
  const flagUrl=name=>`https://flagcdn.com/w80/${flagCodes[name]||'un'}.png`;
  const weekday=d=>['일','월','화','수','목','금','토'][new Date(`${d}T00:00:00+09:00`).getDay()];
  const stageKo=m=>m.stage==='finals'?'결선':'예선';
  const roundKo=m=>({Quarterfinal:'8강',Semifinal:'준결승','3rd Place':'3·4위','Final':'결승'})[m.round]||stageKo(m);
  let allMatches=[];
  let resultMap=new Map();
  let activeStage='전체';

  function setupViews(){
    const links=$$('.cd-jump [data-view]');
    function activate(view){
      $$('.cd-view').forEach(x=>x.classList.toggle('is-active',x.id===view));
      links.forEach(x=>x.classList.toggle('is-active',x.dataset.view===view));
      const url=new URL(location.href);url.searchParams.set('view',view);history.replaceState(null,'',url);
    }
    links.forEach(a=>a.addEventListener('click',e=>{e.preventDefault();activate(a.dataset.view)}));
    const requested=new URLSearchParams(location.search).get('view');
    if(requested&&$(`#${requested}`))activate(requested);
  }

  function renderTeams(data){
    const root=$('#vnlCountries');
    const list=data.participants||[];
    $('#vnlCountryCount').textContent=list.length;
    root.innerHTML=list.map(p=>`<a class="cd-team-card" href="${esc(p.country_page)}"><span class="cd-team-mark"><img src="${flagUrl(p.country)}" alt="${esc(p.country)} flag"></span><strong>${esc(p.country)}</strong><small>${esc(p.country_ko)}</small></a>`).join('');
  }

  function renderStandings(data){
    const root=$('#vnlPreliminaryStandings');
    const rows=data.rows||[];
    root.innerHTML=`<table class="vnl-standings-table"><thead><tr><th>순위</th><th>국가</th><th>경기</th><th>승</th><th>패</th><th>승점</th><th>세트</th><th>세트율</th><th>진출</th></tr></thead><tbody>${rows.map(r=>`<tr class="${r.host_qualified?'is-host':r.qualified?'is-qualified':''}"><td><strong>${r.rank}</strong></td><td><a class="vnl-standing-team" href="${esc(r.country_page||'#')}"><img src="${flagUrl(r.country)}" alt="${esc(r.country)} flag"><span>${esc(r.country_ko)}<br><small>${esc(r.country)}</small></span></a></td><td>${r.played}</td><td>${r.wins}</td><td>${r.losses}</td><td><strong>${r.points}</strong></td><td>${r.sets_won}-${r.sets_lost}</td><td>${Number(r.set_ratio).toFixed(3)}</td><td>${r.host_qualified?'<span class="vnl-host-badge">개최국</span>':r.qualified?'<span class="vnl-qualify-badge">8강</span>':'-'}</td></tr>`).join('')}</tbody></table>`;
  }

  function matchResult(m){
    const r=resultMap.get(m.match_id);
    if(r?.final_score)return {home:r.final_score.home_sets,away:r.final_score.away_sets,sets:r.sets||[]};
    if(m.score&&Number.isFinite(m.score.home_sets))return {home:m.score.home_sets,away:m.score.away_sets,sets:[]};
    return null;
  }

  function renderMatch(m){
    const r=matchResult(m);
    const homeWin=r&&r.home>r.away,awayWin=r&&r.away>r.home;
    const setHtml=(r?.sets||[]).length?r.sets.map((s,i)=>{const h=s.home??s.home_points??s.home_score;const a=s.away??s.away_points??s.away_score;return `<span>${i+1}세트 ${esc(h)}-${esc(a)}</span>`}).join(''):'';
    return `<div class="cd-match"><div class="cd-match-meta"><strong>${esc(m.time_kst||'')}</strong><span>${esc(roundKo(m))}</span><span>${esc(m.venue?.city_ko||m.venue?.country_ko||'')}</span></div><div class="cd-match-board"><div class="cd-side is-left ${homeWin?'cd-winner':''}"><strong>${esc(m.home?.name_ko||m.home?.name_en||'')}</strong><span class="cd-inline-logo vnl-result-flag"><img src="${flagUrl(m.home?.name_en)}" alt=""></span></div><div class="cd-score">${r?`${r.home}-${r.away}`:'VS'}</div><div class="cd-side is-right ${awayWin?'cd-winner':''}"><span class="cd-inline-logo vnl-result-flag"><img src="${flagUrl(m.away?.name_en)}" alt=""></span><strong>${esc(m.away?.name_ko||m.away?.name_en||'')}</strong></div></div><div class="cd-set-scores">${setHtml||'<span>세트별 점수 연결 예정</span>'}</div></div>`;
  }

  function renderResults(){
    const root=$('#vnlResults');
    const filtered=allMatches.filter(m=>activeStage==='전체'||stageKo(m)===activeStage);
    $('#vnlResultSummary').textContent=`${filtered.length}경기 · ${activeStage==='전체'?'전체 단계':activeStage}`;
    const groups=new Map();filtered.forEach(m=>{if(!groups.has(m.date_kst))groups.set(m.date_kst,[]);groups.get(m.date_kst).push(m)});
    root.innerHTML=Array.from(groups.entries()).sort((a,b)=>a[0].localeCompare(b[0])).map(([date,list])=>`<section class="cd-date-group"><header class="cd-date-head"><span>${date}(${weekday(date)})</span><span>${list.length}경기</span></header>${list.map(renderMatch).join('')}</section>`).join('')||'<div class="cd-empty">표시할 경기가 없습니다.</div>';
  }

  function renderFilters(){
    const c=$('#vnlStageFilters');
    const stages=['전체','예선','결선'];
    c.innerHTML=stages.map(s=>`<button type="button" class="${s===activeStage?'is-active':''}" data-stage="${s}">${s}</button>`).join('');
    c.querySelectorAll('[data-stage]').forEach(b=>b.addEventListener('click',()=>{activeStage=b.dataset.stage;renderFilters();renderResults()}));
  }

  async function load(){
    setupViews();
    try{
      const [participants,matches,results,standings,finals]=await Promise.all([
        fetch('data/competition/vnl-2026-men-participants.json').then(r=>r.json()),
        fetch('data/matches/vnl-2026-men.json').then(r=>r.json()),
        fetch('data/results/vnl-2026-men-results.json').then(r=>r.json()),
        fetch('data/standings/vnl-2026-men.json').then(r=>r.json()),
        fetch('data/matches/vnl-2026-finals.json').then(r=>r.json())
      ]);
      renderTeams(participants);renderStandings(standings);
      resultMap=new Map((results.results||[]).map(r=>[r.match_id,r]));
      const prelim=matches.matches||[], finalList=finals.matches||[];
      allMatches=[...prelim,...finalList];
      $('#vnlPrelimMatchCount').textContent=prelim.length;
      $('#vnlFinalMatchCount').textContent=finalList.length;
      $('#vnlCompletedCount').textContent=prelim.filter(m=>m.status==='completed').length;
      renderFilters();renderResults();
    }catch(err){
      console.error(err);
      ['#vnlResults','#vnlPreliminaryStandings','#vnlCountries'].forEach(sel=>{const n=$(sel);if(n)n.innerHTML='<div class="cd-empty">데이터를 불러오지 못했습니다.</div>'});
    }
  }
  document.addEventListener('DOMContentLoaded',load);
})();
