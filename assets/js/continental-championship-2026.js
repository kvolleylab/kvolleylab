(()=>{
  const params=new URLSearchParams(location.search);
  const id=params.get('id')||'avc-men-continental-2026';
  const hero=document.getElementById('cc26Hero');
  const overview=document.getElementById('cc26Overview');
  const quota=document.getElementById('cc26Quota');
  const sources=document.getElementById('cc26Sources');
  const participantsSection=document.getElementById('cc26ParticipantsSection');
  const participants=document.getElementById('cc26Participants');
  const participantStatus=document.getElementById('cc26ParticipantStatus');
  const structureSection=document.getElementById('cc26StructureSection');
  const structure=document.getElementById('cc26Structure');
  const schedule=document.getElementById('cc26Schedule');
  const scheduleBadge=document.getElementById('cc26ScheduleBadge');
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const markNationalActive=()=>{
    const link=document.querySelector('.kvl-global-nav a[href="la28-volleyball-qualification.html"]');
    if(link){link.classList.add('active');link.setAttribute('aria-current','page');return true}
    return false;
  };
  if(!markNationalActive()){
    const observer=new MutationObserver(()=>{if(markNationalActive())observer.disconnect()});
    observer.observe(document.documentElement,{childList:true,subtree:true});
  }
  fetch('data/national/continental-championships-2026.json',{cache:'no-store'}).then(r=>r.json()).then(data=>{
    const item=(data.competitions||[]).find(x=>x.id===id)||(data.competitions||[])[0];
    if(!item)throw new Error('competition not found');
    document.title=`${item.name_ko} | K-Volley Lab`;
    hero.innerHTML=`<p class="eyebrow">${esc(item.confederation)} · ${esc(item.region_ko)} · LA28 QUALIFIER</p><h1>${esc(item.name_ko)}</h1><p>${esc(item.name_en)}</p><div class="cc26-chips"><span>${esc(item.dates)}</span><span>${esc(item.host)}</span><span>${esc(item.status)}</span></div>`;
    overview.innerHTML=`<article><span>대륙</span><strong>${esc(item.region_ko)}</strong></article><article><span>대회 기간</span><strong>${esc(item.dates)}</strong></article><article><span>개최지</span><strong>${esc(item.host)}</strong></article><article><span>현재 상태</span><strong>${esc(item.status)}</strong></article>`;
    const extra=[item.world_cup_quota?`<li><strong>2027 World Cup</strong><span>${esc(item.world_cup_quota)}</span></li>`:'',item.ranking_note?`<li><strong>세계랭킹</strong><span>${esc(item.ranking_note)}</span></li>`:''].join('');
    quota.innerHTML=`<strong>${esc(item.quota)}</strong><p>2026 대륙선수권은 LA28 올림픽 출전권이 처음 걸리는 본격적인 국가대표 경로입니다.</p>${extra?`<ul class="cc26-meaning-list">${extra}</ul>`:''}`;
    if(Array.isArray(item.participants)&&item.participants.length){
      participantsSection.hidden=false;
      participantStatus.textContent=item.participant_status||`${item.participants.length}개국`;
      participants.innerHTML=item.participants.map((entry,i)=>{
        const name=typeof entry==='string'?entry:entry.name_ko;
        const rosterStatus=typeof entry==='object'&&entry.roster_status?entry.roster_status:'공식 엔트리 대기';
        const href=`national-team-tournament-roster.html?competition=${encodeURIComponent(item.id)}&country=${encodeURIComponent(name)}`;
        return `<a class="cc26-team-card cc26-team-link" href="${href}"><span>${String(i+1).padStart(2,'0')}</span><div><strong>${esc(name)}</strong><small>${esc(rosterStatus)}</small></div><b>→</b></a>`;
      }).join('');
    }
    if(item.draw_status||item.schedule_status){
      structureSection.hidden=false;
      structure.innerHTML=`${item.draw_status?`<article><span>조 편성</span><strong>${esc(item.draw_status)}</strong></article>`:''}${item.schedule_status?`<article><span>경기 일정</span><strong>${esc(item.schedule_status)}</strong></article>`:''}`;
      schedule.innerHTML=`<article><span>현재 상태</span><strong>${esc(item.schedule_status||'공식 세부 일정 확인중')}</strong><p>공식 경기시간이 발표되면 현지시간을 한국시간(KST)으로 변환하여 월별 일정과 함께 연결합니다.</p></article>`;
      scheduleBadge.textContent='공식 발표 대기';
    }
    const sourceLinks=[];
    if(item.official_url)sourceLinks.push(`<a href="${esc(item.official_url)}" target="_blank" rel="noopener">${esc(item.source_label||'대륙연맹 공식 발표')} ↗</a>`);
    if(item.calendar_url)sourceLinks.push(`<a href="${esc(item.calendar_url)}" target="_blank" rel="noopener">${esc(item.calendar_label||'공식 캘린더')} ↗</a>`);
    if(data.fivb_continental_news)sourceLinks.push(`<a href="${esc(data.fivb_continental_news)}" target="_blank" rel="noopener">FIVB · 대륙선수권과 LA28 ↗</a>`);
    if(data.fivb_overview)sourceLinks.push(`<a href="${esc(data.fivb_overview)}" target="_blank" rel="noopener">FIVB LA28 출전자격 개요 ↗</a>`);
    if(data.official_qualification)sourceLinks.push(`<a href="${esc(data.official_qualification)}" target="_blank" rel="noopener">LA28 공식 출전자격 문서 ↗</a>`);
    sources.innerHTML=sourceLinks.join('');
  }).catch(()=>{
    hero.innerHTML='<p class="eyebrow">NATIONAL TEAM</p><h1>대회 정보를 불러오지 못했습니다.</h1><p>잠시 후 다시 확인해주세요.</p>';
  });
})();
