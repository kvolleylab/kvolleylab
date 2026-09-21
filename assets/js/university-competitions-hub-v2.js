(()=> {
  const FEATURE_URL='data/competitions/university-index-2026.json?v=20260921-hub-2';
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

  const recordCards=list=>list.map(item=>{
    const men=winner(item,'남대부'),women=winner(item,'여대부'),ready=Boolean(item.pagePath);
    return '<article class="univ-record-card"><span class="univ-record-series">'+esc(item.series||'대학대회')+'</span><h3>'+esc(item.shortName)+'</h3>'+
      '<div class="univ-record-meta"><span>▣ '+esc(fmt(item.startDate))+' ~ '+esc(fmt(item.endDate))+'</span><span>● '+esc(item.location||'—')+'</span></div>'+
      '<div class="univ-record-winners">'+
      (men?'<span>🏆 남자부 우승 <b>'+esc(men)+'</b></span>':'<span class="univ-record-status is-active">남자부 진행 중</span>')+
      (women?'<span>🏆 여자부 우승 <b>'+esc(women)+'</b></span>':(item.status==='active'?'<span class="univ-record-status is-active">여자부 진행 중</span>':''))+
      '</div>'+(ready?'<a class="univ-record-link" href="'+esc(item.pagePath)+'">대회 보기 →</a>':'<span class="univ-record-link is-disabled">페이지 준비 중</span>')+'</article>';
  }).join('');

  fetch(FEATURE_URL,{cache:'no-cache'}).then(r=>{if(!r.ok)throw new Error(r.status);return r.json()}).then(data=>{
    const list=(data.competitions||[]).slice().sort((a,b)=>(a.featuredOrder||99)-(b.featuredOrder||99));
    featuredRoot.innerHTML=list.slice(0,3).map(featuredCard).join('');
    recordsRoot.innerHTML='<div class="univ-year-head"><strong>2026 <span>SEASON</span></strong><span>⌃</span></div>'+
      '<div class="univ-record-grid">'+recordCards(list)+'</div>';
  }).catch(()=>{
    featuredRoot.innerHTML='<div class="univ-hub-note">2026 대회 정보를 불러오지 못했습니다.</div>';
    recordsRoot.innerHTML='<div class="univ-hub-note">연도별 기록을 불러오지 못했습니다.</div>';
  });
})();