(()=> {
  const FEATURE_URL='data/competitions/university-index-2026.json?v=20260921-ui-match-1';
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const days=['일','월','화','수','목','금','토'];
  const fmt=value=>{if(!value)return '일정 미정';const [y,m,d]=value.split('-').map(Number);return value.replaceAll('-','.')+'('+days[new Date(y,m-1,d).getDay()]+')'};
  const winner=(item,key)=>{const p=(item.podiums||[]).find(x=>String(x.division||'').includes(key));const w=p&&(p.rankings||[]).find(x=>Number(x.rank)===1);return w?w.team:''};

  const featuredRoot=document.getElementById('univFeaturedGrid');
  const recordsRoot=document.getElementById('univRecords');
  if(!featuredRoot||!recordsRoot)return;

  const featuredCard=item=>{
    const ready=Boolean(item.pagePath);
    const tag=ready?'a':'article';
    const href=ready?' href="'+esc(item.pagePath)+'"':'';
    const cls='univ-featured-card '+(item.category==='uleague'?'is-uleague ':'')+(ready?'':'is-disabled');
    const style=item.cardImage?' style="--featured-image:url(&quot;'+esc(item.cardImage)+'&quot;)"':'';
    const note=item.category==='uleague'?'KUSF 대학배구 정규 시즌 리그':(item.series||'연맹 대회');
    return '<'+tag+href+' id="competition-'+esc(item.competitionId)+'" class="'+cls+'"'+style+'>'+
      (item.featuredLabel?'<span class="univ-featured-badge">'+esc(item.featuredLabel)+'</span>':'')+
      '<div class="univ-featured-content"><p class="univ-featured-year">2026</p><h3>'+esc(item.shortName)+'</h3>'+
      '<div class="univ-featured-meta"><span>▣ '+esc(fmt(item.startDate))+' ~ '+esc(fmt(item.endDate))+'</span><span>● '+esc(item.location||'개최지 확인 중')+'</span></div>'+
      '<div class="univ-featured-foot"><span>'+esc(note)+'</span>'+(ready?'<span class="univ-featured-arrow">→</span>':'<span>페이지 준비 중</span>')+'</div></div></'+tag+'>';
  };

  const recordRows=list=>list.map(item=>{
    const men=winner(item,'남대부'),women=winner(item,'여대부'),ready=Boolean(item.pagePath);
    const thumb=item.cardImage?'background-image:url(&quot;'+esc(item.cardImage)+'&quot;)':'';
    return '<tr>'+
      '<td><div class="univ-record-name"><span class="univ-record-thumb" style="'+thumb+'"></span><span>'+esc(item.shortName)+'</span></div></td>'+
      '<td>'+esc(fmt(item.startDate))+' ~ '+esc(fmt(item.endDate))+'</td>'+
      '<td>'+esc(item.location||'—')+'</td>'+
      '<td>'+(men?esc(men):'<span class="univ-record-status is-active">진행 중</span>')+'</td>'+
      '<td>'+(women?esc(women):(item.status==='active'?'<span class="univ-record-status is-active">진행 중</span>':'—'))+'</td>'+
      '<td>'+(ready?'<a class="univ-record-link" href="'+esc(item.pagePath)+'">대회 보기 →</a>':'<span class="univ-record-link is-disabled">준비 중</span>')+'</td>'+
      '</tr>';
  }).join('');

  const recordMobile=list=>list.map(item=>{
    const men=winner(item,'남대부'),women=winner(item,'여대부'),ready=Boolean(item.pagePath);
    const thumb=item.cardImage?'background-image:url(&quot;'+esc(item.cardImage)+'&quot;)':'';
    return '<article class="univ-record-mobile-card"><span class="univ-record-mobile-thumb" style="'+thumb+'"></span><div><h3>'+esc(item.shortName)+'</h3><p>'+esc(fmt(item.startDate))+' ~ '+esc(fmt(item.endDate))+'<br>'+esc(item.location||'—')+'</p><p>'+(men?'남 '+esc(men):'남 진행 중')+(women?' · 여 '+esc(women):'')+'</p>'+(ready?'<a class="univ-record-link" href="'+esc(item.pagePath)+'">대회 보기 →</a>':'<span class="univ-record-link is-disabled">준비 중</span>')+'</div></article>';
  }).join('');

  fetch(FEATURE_URL,{cache:'no-cache'}).then(r=>{if(!r.ok)throw new Error(r.status);return r.json()}).then(data=>{
    const list=(data.competitions||[]).slice().sort((a,b)=>(a.featuredOrder||99)-(b.featuredOrder||99));
    featuredRoot.innerHTML=list.slice(0,3).map(featuredCard).join('');
    recordsRoot.innerHTML='<button class="univ-year-head" type="button" aria-expanded="true"><strong>2026 <span>SEASON</span></strong><span class="univ-year-chevron" aria-hidden="true">⌃</span></button>'+
      '<div class="univ-year-details">'+
      '<table class="univ-record-table"><colgroup><col style="width:28%"><col style="width:22%"><col style="width:14%"><col style="width:13%"><col style="width:13%"><col style="width:10%"></colgroup><thead><tr><th>대회명</th><th>기간</th><th>개최지</th><th>남자부 우승</th><th>여자부 우승</th><th>상세보기</th></tr></thead><tbody>'+recordRows(list)+'</tbody></table>'+
      '<div class="univ-record-mobile">'+recordMobile(list)+'</div></div>'+
      '<div class="univ-year-collapsed"><strong>2025 <span>SEASON</span></strong><span>⌄</span></div>'+
      '<div class="univ-year-collapsed"><strong>2024 <span>SEASON</span></strong><span>⌄</span></div>'+
      '<div class="univ-year-collapsed"><strong>2023 <span>SEASON</span></strong><span>⌄</span></div>';

    const yearHead=recordsRoot.querySelector('.univ-year-head');
    const yearDetails=recordsRoot.querySelector('.univ-year-details');
    const chevron=recordsRoot.querySelector('.univ-year-chevron');
    const mobileMq=window.matchMedia('(max-width:680px)');
    const syncYearState=()=>{
      if(!yearHead||!yearDetails||!chevron)return;
      const collapsed=mobileMq.matches;
      yearHead.setAttribute('aria-expanded',collapsed?'false':'true');
      yearHead.classList.toggle('is-collapsed',collapsed);
      yearDetails.classList.toggle('is-collapsed',collapsed);
      chevron.textContent=collapsed?'⌄':'⌃';
    };
    syncYearState();
    yearHead&&yearHead.addEventListener('click',()=>{
      if(!mobileMq.matches)return;
      const next=yearHead.getAttribute('aria-expanded')!=='true';
      yearHead.setAttribute('aria-expanded',String(next));
      yearHead.classList.toggle('is-collapsed',!next);
      yearDetails.classList.toggle('is-collapsed',!next);
      chevron.textContent=next?'⌃':'⌄';
    });
    mobileMq.addEventListener&&mobileMq.addEventListener('change',syncYearState);
  }).catch(()=>{
    featuredRoot.innerHTML='<div class="univ-hub-note">2026 대회 정보를 불러오지 못했습니다.</div>';
    recordsRoot.innerHTML='<div class="univ-hub-note">연도별 기록을 불러오지 못했습니다.</div>';
  });
})();