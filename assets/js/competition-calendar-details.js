(()=>{
  const root=document.getElementById('competitionCalendar');
  if(!root)return;
  let events=[];
  const esc=s=>String(s??'').replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  const fmt=d=>{const x=new Date(`${d}T00:00:00`);return `${x.getMonth()+1}.${x.getDate()}`};
  const normalizeHref=href=>{try{const u=new URL(href,location.href);return `${u.pathname.split('/').pop()}${u.search}${u.hash}`}catch{return href||''}};

  document.body.insertAdjacentHTML('beforeend',`<div class="cc-detail-backdrop" hidden></div><section class="cc-detail-modal" role="dialog" aria-modal="true" aria-labelledby="ccDetailTitle" hidden><button class="cc-detail-close" type="button" aria-label="상세 정보 닫기">×</button><div id="ccDetailBody"></div></section>`);
  const modal=document.querySelector('.cc-detail-modal');
  const backdrop=document.querySelector('.cc-detail-backdrop');
  const body=document.getElementById('ccDetailBody');
  const close=()=>{modal.hidden=true;backdrop.hidden=true;document.body.classList.remove('cc-detail-open')};
  backdrop.onclick=close;
  modal.querySelector('.cc-detail-close').onclick=close;
  document.addEventListener('keydown',e=>{if(e.key==='Escape')close()});

  function open(event){
    const podiums=(event.podiums||[]).map(p=>`<section class="cc-podium-card"><h3>${esc(p.division)}</h3><dl><div><dt>🏆 우승</dt><dd>${esc(p.champion)}</dd></div><div><dt>🥈 준우승</dt><dd>${esc(p.runner_up)}</dd></div><div><dt>🥉 3위</dt><dd>${esc((p.third||[]).join(' · '))}</dd></div></dl></section>`).join('');
    const progress=event.match_count?Math.min(100,Math.round(((event.result_count||0)/event.match_count)*100)):0;
    const links=(event.links?.length?event.links:[{label:'일정 보기',href:event.href}]).map(link=>`<a href="${esc(link.href)}"${link.external?' target="_blank" rel="noopener"':''}>${esc(link.label)}${link.external?' ↗':''}</a>`).join('');
    body.innerHTML=`<header class="cc-detail-head"><p><span>종료</span><span>국내대회</span>${(event.divisions||[]).map(x=>`<span>${esc(x)}</span>`).join('')}<span>${esc(event.result_status||'')}</span></p><h2 id="ccDetailTitle">${esc(event.title)}</h2><div>${fmt(event.start)} ~ ${fmt(event.end)}${event.location?` · ${esc(event.location)}`:''}</div></header>${event.match_count?`<div class="cc-detail-progress"><strong>총 ${event.match_count}경기 · 결과 ${event.result_count||0}/${event.match_count}</strong><i><span style="width:${progress}%"></span></i></div>`:''}<div class="cc-podium-grid">${podiums}</div>${event.final_score?`<div class="cc-final-score"><span>남대부 결승</span><strong>${esc(event.final_score)}</strong></div>`:''}${event.venues?.length?`<div class="cc-detail-venues"><strong>경기장</strong><span>${event.venues.map(esc).join(' · ')}</span></div>`:''}<div class="cc-detail-actions">${links}</div>`;
    modal.hidden=false;backdrop.hidden=false;document.body.classList.add('cc-detail-open');modal.querySelector('.cc-detail-close').focus();
  }

  document.addEventListener('click',e=>{
    const target=e.target.closest('.cc-period-bar,.cc-big-period,.cc-focus-event');
    if(!target)return;
    const href=normalizeHref(target.getAttribute('href'));
    const event=events.find(item=>normalizeHref(item.href)===href&&item.podiums?.length);
    if(!event)return;
    e.preventDefault();
    open(event);
  },true);

  const year=new URLSearchParams(location.search).get('year')||2026;
  fetch(`data/calendar/${year}-competition-periods.json?v=20260725-3`,{cache:'no-store'}).then(r=>r.ok?r.json():Promise.reject()).then(data=>{events=data.events||[]}).catch(()=>{});
})();