(()=>{
  const params=new URLSearchParams(location.search);
  if(params.get('division')!=='school')return;

  const main=document.querySelector('main.dc-main');
  if(!main)return;
  document.body.classList.add('school-competitions-hub-page');
  document.title='중·고 배구대회 | K-Volley Lab';

  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const days=['일','월','화','수','목','금','토'];
  const parseDate=value=>{const [y,m,d]=String(value||'').split('-').map(Number);return new Date(y,m-1,d)};
  const dateWithWeekday=value=>{if(!value)return '일정 미정';const d=parseDate(value);return `${value}(${days[d.getDay()]})`};
  const today=()=>{const d=new Date();d.setHours(0,0,0,0);return d};
  const statusOf=item=>{const now=today(),start=parseDate(item.startDate),end=parseDate(item.endDate);end.setHours(23,59,59,999);return now<start?'upcoming':now>end?'completed':'live'};
  const statusLabel={live:'진행 중',upcoming:'예정',completed:'대회 종료'};
  const divisionKeys=[['18세이하 남자부','18U 남'],['18세이하 여자부','18U 여'],['15세이하 남자부','15U 남'],['15세이하 여자부','15U 여']];
  const medal=rank=>rank===1?'🏆':rank===2?'🥈':'🥉';
  const rankingCache=new Map();

  main.className='sh-main';
  main.innerHTML=`
    <section class="sh-hero">
      <div class="sh-hero-copy">
        <div class="sh-hero-logo" aria-hidden="true"><span>🏐</span></div>
        <div><p class="eyebrow">SCHOOL COMPETITIONS</p><h1>중·고 배구대회</h1><p>연도별 전국 중·고 배구대회의 일정과 최종 결과를 확인하세요.</p></div>
      </div>
      <div class="sh-summary"><span id="shYearCount">연도 -개</span><span id="shCompetitionCount">대회 -개</span></div>
    </section>
    <div id="shYears"></div>
    <div id="shLoading" class="sh-loading"></div>
    <div id="shLoadSentinel" class="sh-load-sentinel" aria-hidden="true"></div>
    <div class="sh-note">최신 연도를 먼저 표시하고, 과거 연도는 아래로 스크롤할 때 순차적으로 불러옵니다.</div>`;

  const normalizedStage=stage=>String(stage||'').replace(/\s+/g,'').replace(/전$/,'');
  const isFinal=stage=>normalizedStage(stage)==='결승';
  const isSemi=stage=>normalizedStage(stage)==='준결승';
  const teamAliases={'울산스포츠과하고':'울산스포츠과학고','순천팦마중':'순천팔마중','인하부고':'인하사대부고','인하부중':'인하사대부중','찬안고':'천안고','경북사대부설고':'경북사대부고','인하사대부속중':'인하사대부중'};
  const team=name=>teamAliases[name]||name;
  const unpack=(data,row)=>{
    if(!Array.isArray(row))return {...row,team_a:team(row.team_a),team_b:team(row.team_b)};
    const[date,venueIndex,court_order,divisionIndex,stageIndex,team_a,team_b,set_score,sets]=row;
    return{date,venue:data.venues?.[venueIndex],court_order:Number(court_order)||0,division:data.divisions?.[divisionIndex],stage:data.stages?.[stageIndex],team_a:team(team_a),team_b:team(team_b),set_score,sets};
  };
  const score=m=>String(m?.set_score||'').match(/^(\d+)-(\d+)$/)?.slice(1).map(Number)||[];
  const winner=m=>{const[a,b]=score(m);return Number.isFinite(a)&&Number.isFinite(b)?(a>b?m.team_a:b>a?m.team_b:''):''};
  const loser=m=>{const w=winner(m);return !w?'':w===m.team_a?m.team_b:m.team_a};
  const chronological=(a,b)=>String(a.date).localeCompare(String(b.date))||Number(a.court_order||0)-Number(b.court_order||0);

  async function podiumsFor(item){
    if(!item.rankingSource)return null;
    if(rankingCache.has(item.rankingSource))return rankingCache.get(item.rankingSource);
    const promise=fetch(`data/domestic/${encodeURIComponent(item.rankingSource)}.json?v=20260831-2`,{cache:'no-store'})
      .then(r=>{if(!r.ok)throw new Error(r.status);return r.json()})
      .then(data=>{
        const matches=(data.matches||[]).map(row=>unpack(data,row));
        const out={};
        divisionKeys.forEach(([division])=>{
          const rows=matches.filter(m=>m.division===division&&winner(m)).sort(chronological);
          const final=rows.filter(m=>isFinal(m.stage)).at(-1);
          if(!final){out[division]=[];return}
          const thirds=[...new Set(rows.filter(m=>isSemi(m.stage)).map(loser).filter(Boolean))];
          out[division]=[
            {rank:1,team:winner(final)},
            {rank:2,team:loser(final)},
            ...(thirds.length?[{rank:3,team:thirds.join(' · ')}]:[])
          ];
        });
        return out;
      })
      .catch(()=>null);
    rankingCache.set(item.rankingSource,promise);
    return promise;
  }

  const podiumHtml=(division,label,rankings,state)=>{
    if(state!=='completed')return `<div class="sh-podium"><strong>${esc(label)}</strong><div class="sh-pending">${state==='live'?'대회 진행 중':'대회 예정'}</div></div>`;
    if(!rankings?.length)return `<div class="sh-podium"><strong>${esc(label)}</strong><div class="sh-pending">결과 확인 중</div></div>`;
    return `<div class="sh-podium"><strong>${esc(label)}</strong>${rankings.map(r=>`<div class="sh-rank ${r.rank===1?'is-champion':''}" title="${esc(r.team)}"><span class="medal">${medal(r.rank)}</span><span>${r.rank}위 ${esc(r.team)}</span></div>`).join('')}</div>`;
  };

  const cardHtml=(item,podiums)=>{
    const state=statusOf(item);
    const short=item.shortName||item.name;
    const subtitle=item.name&&item.name!==short?item.name:'';
    const dateLocation=`${dateWithWeekday(item.startDate)} ~ ${dateWithWeekday(item.endDate)}${item.location?` · ${item.location}`:''}`;
    return `<article class="sh-card"><div class="sh-card-main"><a class="sh-card-info" href="${esc(item.pagePath)}"><div class="sh-card-top"><span class="sh-card-series">${esc(item.series||'중·고 대회')}</span><span class="sh-status ${state}">${statusLabel[state]}</span></div><div class="sh-card-body"><h3>${esc(short)}</h3>${subtitle?`<p>${esc(subtitle)}</p>`:''}<div class="sh-date">${esc(dateLocation)}</div></div><span class="sh-card-link">대회 보기 →</span></a><div class="sh-podiums" aria-label="최종 순위">${divisionKeys.map(([division,label])=>podiumHtml(division,label,podiums?.[division],state)).join('')}</div></div></article>`;
  };

  const championSummaryHtml=(items,podiumList)=>{
    const parts=items.map((item,index)=>{
      if(statusOf(item)!=='completed')return '';
      const podiums=podiumList[index];
      if(!podiums)return '';
      const winners=divisionKeys.map(([division,label])=>{
        const champ=(podiums[division]||[]).find(r=>r.rank===1)?.team;
        return champ?`${label} ${champ}`:'';
      }).filter(Boolean);
      if(!winners.length)return '';
      return `<span><b>${esc(item.series||item.shortName)}</b>${esc(winners.join(' · '))}</span>`;
    }).filter(Boolean);
    return parts.length?`<div class="sh-champion-summary" aria-label="연도별 우승팀 요약">${parts.join('')}</div>`:'';
  };

  const yearsRoot=document.getElementById('shYears');
  const loading=document.getElementById('shLoading');
  const sentinel=document.getElementById('shLoadSentinel');
  let manifest=[],index=0,loadingNow=false,totalCompetitions=0;

  async function loadNextYear(){
    if(loadingNow||index>=manifest.length)return;
    loadingNow=true;
    loading.textContent='이전 연도 불러오는 중…';
    const meta=manifest[index++];
    try{
      const data=await fetch(`${meta.dataPath}${meta.dataPath.includes('?')?'&':'?'}v=20260831-2`,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error(r.status);return r.json()});
      const list=[...(data.competitions||[])].sort((a,b)=>String(b.startDate).localeCompare(String(a.startDate)));
      const podiumList=await Promise.all(list.map(item=>statusOf(item)==='completed'?podiumsFor(item):Promise.resolve(null)));
      totalCompetitions+=list.length;
      document.getElementById('shCompetitionCount').textContent=`대회 ${totalCompetitions}개`;
      const section=document.createElement('section');
      section.className='sh-year';
      section.innerHTML=`<div class="sh-head"><div class="sh-head-left"><p class="eyebrow">${meta.year} SEASON</p><div class="sh-year-title-row"><h2>${esc(meta.label||`${meta.year} 중·고 배구대회`)}</h2>${championSummaryHtml(list,podiumList)}</div></div><p>대회 일정과 종료 대회의 최종 순위를 함께 보관합니다.</p></div><div class="sh-grid">${list.map((item,i)=>cardHtml(item,podiumList[i])).join('')||'<div class="sh-empty">등록된 대회가 없습니다.</div>'}</div>`;
      yearsRoot.appendChild(section);
    }catch{
      const err=document.createElement('div');
      err.className='sh-empty';
      err.textContent=`${meta.year}년 대회 데이터를 불러오지 못했습니다.`;
      yearsRoot.appendChild(err);
    }finally{
      loadingNow=false;
      loading.textContent=index<manifest.length?'아래로 스크롤하면 이전 연도를 불러옵니다.':'';
    }
  }

  fetch('data/competitions/school-years.json?v=20260831-2',{cache:'no-store'})
    .then(r=>{if(!r.ok)throw new Error(r.status);return r.json()})
    .then(data=>{
      manifest=[...(data.years||[])].sort((a,b)=>b.year-a.year);
      document.getElementById('shYearCount').textContent=`연도 ${manifest.length}개`;
      loadNextYear();
      const observer=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting))loadNextYear()},{rootMargin:'400px 0px'});
      observer.observe(sentinel);
    })
    .catch(()=>{loading.textContent='연도별 대회 데이터를 불러오지 못했습니다.'});
})();
