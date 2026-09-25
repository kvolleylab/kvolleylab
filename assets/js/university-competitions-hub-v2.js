(()=> {
  const INDEX_URL='data/competitions/university-index-2026.json?v=20260926-record-hub-1';
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const days=['일','월','화','수','목','금','토'];
  const fmt=value=>{
    if(!value)return '일정 미정';
    const [y,m,d]=String(value).split('-').map(Number);
    const dt=new Date(y,m-1,d);
    return String(value).replaceAll('-','.')+'('+days[dt.getDay()]+')';
  };
  const featuredRoot=document.getElementById('univFeaturedGrid');
  const root=document.getElementById('univRecords');
  const yearSelect=document.getElementById('univYearSelect');
  if(!root)return;

  function featuredCard(item){
    const ready=Boolean(item.pagePath);
    const tag=ready?'a':'article';
    const href=ready?' href="'+esc(item.pagePath)+'"':'';
    const cls='univ-featured-card '+(item.category==='uleague'?'is-uleague ':'')+(ready?'':'is-disabled');
    const style=item.cardImage?' style="--featured-image:url(&quot;'+esc(item.cardImage)+'&quot;)"':'';
    const note=item.category==='uleague'?'KUSF 대학배구 정규 시즌 리그':(item.series||'연맹 대회');
    return '<'+tag+href+' id="featured-'+esc(item.competitionId)+'" class="'+cls+'"'+style+'>'+
      (item.featuredLabel?'<span class="univ-featured-badge">'+esc(item.featuredLabel)+'</span>':'')+
      '<div class="univ-featured-content"><p class="univ-featured-year">2026</p><h3>'+esc(item.shortName)+'</h3>'+
      '<div class="univ-featured-meta"><span>▣ '+esc(fmt(item.startDate))+' ~ '+esc(fmt(item.endDate))+'</span><span>● '+esc(item.location||'개최지 확인 중')+'</span></div>'+
      '<div class="univ-featured-foot"><span>'+esc(note)+'</span>'+(ready?'<span class="univ-featured-arrow">→</span>':'<span>페이지 준비 중</span>')+'</div></div></'+tag+'>';
  }

  function statusLabel(item){
    if(item.status==='active')return '<span class="univ-status is-active">진행 중</span>';
    return '<span class="univ-status is-complete">대회 종료</span>';
  }
  function seriesLabel(item){
    const label=item.category==='uleague'?'정규리그':(item.series||'대회');
    const cls=item.category==='uleague'?'is-league':'is-federation';
    return '<span class="univ-series '+cls+'">'+esc(label)+'</span>';
  }
  function podiumPanel(item,gender){
    const key=gender==='men'?'남':'여';
    const custom=(item.recordPanels||[]).find(x=>String(x.division||'').includes(key));
    if(custom)return custom;
    const pod=(item.podiums||[]).find(x=>String(x.division||'').includes(key));
    if(!pod)return {label:(gender==='men'?'남대부':'여대부')+' 순위',rankings:[],state:'empty'};
    return {
      label:(gender==='men'?'남대부':'여대부')+' 최종순위',
      rankings:pod.rankings||[],
      state:'final'
    };
  }
  function rankText(r,rankings){
    const same=(rankings||[]).filter(x=>Number(x.rank)===Number(r.rank)).length;
    if(Number(r.rank)===3&&same>1)return '공동 3위';
    return Number.isFinite(Number(r.rank))?Number(r.rank)+'위':'-';
  }
  function medal(rank){
    const n=Number(rank);
    if(n===1)return '<span class="univ-medal is-gold">🏆</span>';
    if(n===2)return '<span class="univ-medal is-silver">🥈</span>';
    if(n===3)return '<span class="univ-medal is-bronze">🥉</span>';
    return '<span class="univ-medal is-fourth">4</span>';
  }
  function rankingPanel(panel,gender){
    const rows=(panel.rankings||[]).slice(0,4);
    const tone=gender==='women'?'is-women':'is-men';
    const note=panel.note?'<small>'+esc(panel.note)+'</small>':'';
    const body=rows.length?rows.map(r=>
      '<div class="univ-rank-row">'+medal(r.rank)+
      '<span class="univ-rank-label">'+esc(rankText(r,rows))+'</span>'+
      '<strong>'+esc(r.team||'미정')+'</strong></div>'
    ).join(''):'<div class="univ-rank-empty">순위 데이터 준비 중</div>';
    return '<section class="univ-ranking-panel '+tone+'">'+
      '<div class="univ-ranking-head"><strong>'+esc(panel.label||'순위')+'</strong>'+note+'</div>'+
      '<div class="univ-ranking-body">'+body+'</div></section>';
  }
  function recordCard(item){
    const ready=Boolean(item.pagePath);
    const men=podiumPanel(item,'men');
    const women=podiumPanel(item,'women');
    return '<article class="univ-record-card">'+
      '<div class="univ-record-info">'+
        '<div class="univ-record-top">'+seriesLabel(item)+statusLabel(item)+'</div>'+
        '<h3>'+esc(item.shortName||item.name)+'</h3>'+
        '<p class="univ-record-meta"><span class="univ-meta-icon" aria-hidden="true">▣</span><span>'+esc(fmt(item.startDate))+' ~ '+esc(fmt(item.endDate))+'</span></p>'+
        '<p class="univ-record-meta"><span class="univ-meta-icon" aria-hidden="true">⌖</span><span>'+esc(item.location||'개최지 확인 중')+'</span></p>'+
        (ready?'<a class="univ-record-link" href="'+esc(item.pagePath)+'">대회 보기 <span aria-hidden="true">→</span></a>':'<span class="univ-record-link is-disabled">대회 페이지 준비 중</span>')+
      '</div>'+
      rankingPanel(men,'men')+
      rankingPanel(women,'women')+
    '</article>';
  }
  function yearBlock(year,content,count,open){
    return '<section class="univ-year-block" data-year="'+year+'">'+
      '<button class="univ-year-head" type="button" aria-expanded="'+String(open)+'">'+
        '<strong>'+year+' <span>SEASON'+(count!=null?' ('+count+'개 대회)':'')+'</span></strong>'+
        '<span class="univ-year-chevron" aria-hidden="true">'+(open?'⌃':'⌄')+'</span>'+
      '</button>'+
      '<div class="univ-year-details'+(open?'':' is-collapsed')+'">'+content+'</div>'+
    '</section>';
  }
  function bindYears(){
    root.querySelectorAll('.univ-year-head').forEach(btn=>{
      btn.addEventListener('click',()=>{
        const block=btn.closest('.univ-year-block');
        const details=block.querySelector('.univ-year-details');
        const chevron=btn.querySelector('.univ-year-chevron');
        const next=btn.getAttribute('aria-expanded')!=='true';
        btn.setAttribute('aria-expanded',String(next));
        details.classList.toggle('is-collapsed',!next);
        chevron.textContent=next?'⌃':'⌄';
      });
    });
  }
  function selectYear(year){
    const target=root.querySelector('.univ-year-block[data-year="'+CSS.escape(String(year))+'"]');
    if(!target)return;
    root.querySelectorAll('.univ-year-block').forEach(block=>{
      const btn=block.querySelector('.univ-year-head');
      const details=block.querySelector('.univ-year-details');
      const chev=block.querySelector('.univ-year-chevron');
      const open=block===target;
      btn.setAttribute('aria-expanded',String(open));
      details.classList.toggle('is-collapsed',!open);
      chev.textContent=open?'⌃':'⌄';
    });
    target.scrollIntoView({behavior:'smooth',block:'start'});
  }

  fetch(INDEX_URL,{cache:'no-cache'}).then(r=>{
    if(!r.ok)throw new Error(r.status);
    return r.json();
  }).then(data=>{
    const list=(data.competitions||[]).slice().sort((a,b)=>(a.featuredOrder||99)-(b.featuredOrder||99));
    if(featuredRoot)featuredRoot.innerHTML=list.slice(0,3).map(featuredCard).join('');
    const current=list.map(recordCard).join('');
    const pending='<div class="univ-year-placeholder">검수 완료된 기록부터 순차적으로 추가합니다.</div>';
    root.innerHTML=
      yearBlock(2026,'<div class="univ-record-list">'+current+'</div>',list.length,true)+
      yearBlock(2025,pending,null,false)+
      yearBlock(2024,pending,null,false)+
      yearBlock(2023,pending,null,false);
    bindYears();
    yearSelect&&yearSelect.addEventListener('change',()=>selectYear(yearSelect.value));
  }).catch(err=>{
    console.error(err);
    if(featuredRoot)featuredRoot.innerHTML='<div class="univ-hub-note">2026 대회 정보를 불러오지 못했습니다.</div>';
    root.innerHTML='<div class="univ-hub-note">대학대회 기록을 불러오지 못했습니다.</div>';
  });
})();