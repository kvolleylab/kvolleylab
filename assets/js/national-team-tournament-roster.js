(()=>{
  const params=new URLSearchParams(location.search);
  const competitionId=params.get('competition')||'avc-men-continental-2026';
  const country=params.get('country')||'대한민국';
  const hero=document.getElementById('ntRosterHero');
  const status=document.getElementById('ntRosterStatus');
  const summary=document.getElementById('ntRosterSummary');
  const sources=document.getElementById('ntRosterSources');
  const back=document.getElementById('ntRosterBack');
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const gender=competitionId.includes('-women-')||competitionId.includes('women')?'women':'men';
  fetch('data/national/continental-championships-2026.json',{cache:'no-store'}).then(r=>r.json()).then(data=>{
    const item=(data.competitions||[]).find(x=>x.id===competitionId);
    if(!item)throw new Error('competition not found');
    const participantNames=(item.participants||[]).map(x=>typeof x==='string'?x:x.name_ko).filter(Boolean);
    const isParticipant=participantNames.includes(country);
    document.title=`${country} · ${item.name_ko} 로스터 | K-Volley Lab`;
    back.href=`continental-championship-2026.html?id=${encodeURIComponent(item.id)}`;
    back.textContent=`← ${item.name_ko}`;
    hero.dataset.gender=gender;
    hero.innerHTML=`<p class="eyebrow">${gender==='women'?'WOMEN':'MEN'} · TOURNAMENT ROSTER</p><h1>${esc(country)}</h1><p>${esc(item.name_ko)} 대회 전용 공식 로스터</p><div class="ntroster-chips"><span>${esc(item.confederation)} · ${esc(item.region_ko)}</span><span>${esc(item.dates)}</span><span>${esc(item.host)}</span></div>`;
    status.textContent='공식 엔트리 대기';
    status.className='ntroster-status pending';
    summary.innerHTML=`<article><span>대회</span><strong>${esc(item.name_ko)}</strong></article><article><span>참가국 상태</span><strong>${isParticipant?'공식 참가국 확인':'참가 여부 확인 필요'}</strong></article><article><span>로스터 기준</span><strong>대회 공식 등록 엔트리</strong></article>`;
    const sourceLinks=[];
    if(item.official_url)sourceLinks.push(`<a href="${esc(item.official_url)}" target="_blank" rel="noopener">${esc(item.source_label||'대륙연맹 공식 발표')} ↗</a>`);
    if(item.calendar_url)sourceLinks.push(`<a href="${esc(item.calendar_url)}" target="_blank" rel="noopener">${esc(item.calendar_label||'공식 캘린더')} ↗</a>`);
    sources.innerHTML=sourceLinks.join('')||'<span>공식 로스터 출처 확인 후 연결합니다.</span>';
  }).catch(()=>{
    hero.innerHTML='<p class="eyebrow">NATIONAL TEAM</p><h1>로스터 정보를 불러오지 못했습니다.</h1><p>대회 정보를 다시 확인해주세요.</p>';
  });
})();