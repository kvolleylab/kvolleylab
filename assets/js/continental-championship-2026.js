(()=>{
  const params=new URLSearchParams(location.search);
  const id=params.get('id')||'avc-men-continental-2026';
  const hero=document.getElementById('cc26Hero');
  const overview=document.getElementById('cc26Overview');
  const quota=document.getElementById('cc26Quota');
  const sources=document.getElementById('cc26Sources');
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
    quota.innerHTML=`<strong>${esc(item.quota)}</strong><p>FIVB의 LA28 배구 출전자격 체계에 따라 2026년 5개 대륙선수권에서 각 대륙의 최고 순위팀이 올림픽 출전권을 획득합니다.</p>`;
    sources.innerHTML=`<a href="${esc(item.official_url)}" target="_blank" rel="noopener">${esc(item.source_label)} ↗</a><a href="${esc(data.fivb_overview)}" target="_blank" rel="noopener">FIVB LA28 출전자격 개요 ↗</a><a href="${esc(data.official_qualification)}" target="_blank" rel="noopener">LA28 공식 출전자격 문서 ↗</a>`;
  }).catch(()=>{
    hero.innerHTML='<p class="eyebrow">NATIONAL TEAM</p><h1>대회 정보를 불러오지 못했습니다.</h1><p>잠시 후 다시 확인해주세요.</p>';
  });
})();