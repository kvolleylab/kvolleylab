(()=>{
  const path=(location.pathname.split('/').pop()||'').toLowerCase();
  if(path!=='international-competition-avc-women-continental-2026.html')return;

  const DATA='data/competitions/avc-women-continental-2026.json?v=20260904-2';
  const teamMeta={
    '중국':['China','cn'],'이란':['Iran','ir'],'대만':['Chinese Taipei','tw'],'이라크':['Iraq','iq'],
    '태국':['Thailand','th'],'인도네시아':['Indonesia','id'],'카자흐스탄':['Kazakhstan','kz'],'호주':['Australia','au'],
    '일본':['Japan','jp'],'대한민국':['Korea','kr'],'베트남':['Vietnam','vn'],'홍콩':['Hong Kong, China','hk']
  };
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const ratio=(a,b)=>b===0?(a>0?Number.POSITIVE_INFINITY:0):a/b;
  const fmtRatio=(a,b)=>b===0?(a>0?'MAX':'-'):(a/b).toFixed(3);
  const matchPoints=(a,b)=>a===3?(b<=1?[3,0]:[2,1]):b===3?(a<=1?[0,3]:[1,2]):[0,0];
  const flag=team=>{const meta=teamMeta[team];return meta?`<img src="https://flagcdn.com/w80/${meta[1]}.png" alt="${esc(team)} 국기" loading="lazy">`:''};
  const qfForSeed=seed=>seed===1||seed===8?'QF1 · 1-8':seed===4||seed===5?'QF2 · 4-5':seed===2||seed===7?'QF3 · 2-7':'QF4 · 3-6';

  function resultOf(m){
    const setsA=Number(m.setsA),setsB=Number(m.setsB);
    if(!Number.isFinite(setsA)||!Number.isFinite(setsB)||(setsA!==3&&setsB!==3))return null;
    let pointsA=0,pointsB=0;
    (m.sets||[]).forEach(s=>{const a=Number(s?.[0]),b=Number(s?.[1]);if(Number.isFinite(a)&&Number.isFinite(b)){pointsA+=a;pointsB+=b}});
    return {setsA,setsB,pointsA,pointsB};
  }

  function calculate(data){
    const groupMatches=(data.matches||[]).filter(m=>m.stage==='조별리그');
    const completed=groupMatches.filter(m=>resultOf(m));
    const stats=new Map();let globalOrder=0;
    (data.groups||[]).forEach(g=>g.teams.forEach((team,index)=>stats.set(team,{team,pool:g.id,original:index,globalOrder:globalOrder++,played:0,wins:0,losses:0,matchPoints:0,setsFor:0,setsAgainst:0,pointsFor:0,pointsAgainst:0,poolPosition:0,seed:0})));

    completed.forEach(m=>{
      const r=resultOf(m),a=stats.get(m.teamA),b=stats.get(m.teamB);if(!r||!a||!b)return;
      const [pa,pb]=matchPoints(r.setsA,r.setsB);
      a.played++;b.played++;a.matchPoints+=pa;b.matchPoints+=pb;
      a.setsFor+=r.setsA;a.setsAgainst+=r.setsB;b.setsFor+=r.setsB;b.setsAgainst+=r.setsA;
      a.pointsFor+=r.pointsA;a.pointsAgainst+=r.pointsB;b.pointsFor+=r.pointsB;b.pointsAgainst+=r.pointsA;
      if(r.setsA>r.setsB){a.wins++;b.losses++}else{b.wins++;a.losses++}
    });

    const directWinner=(a,b)=>{
      const m=completed.find(x=>(x.teamA===a.team&&x.teamB===b.team)||(x.teamA===b.team&&x.teamB===a.team));
      if(!m)return '';
      const r=resultOf(m);return r.setsA>r.setsB?m.teamA:m.teamB;
    };
    const cmp=(a,b,usePoolPosition=false)=>{
      if(usePoolPosition&&a.poolPosition!==b.poolPosition)return a.poolPosition-b.poolPosition;
      if(b.wins!==a.wins)return b.wins-a.wins;
      if(b.matchPoints!==a.matchPoints)return b.matchPoints-a.matchPoints;
      const sr=ratio(b.setsFor,b.setsAgainst)-ratio(a.setsFor,a.setsAgainst);if(Math.abs(sr)>1e-9)return sr;
      const pr=ratio(b.pointsFor,b.pointsAgainst)-ratio(a.pointsFor,a.pointsAgainst);if(Math.abs(pr)>1e-9)return pr;
      return 0;
    };

    const poolTables={};
    (data.groups||[]).forEach(g=>{
      const rows=g.teams.map(t=>stats.get(t));
      rows.sort((a,b)=>{const c=cmp(a,b,false);if(c)return c;const winner=directWinner(a,b);if(winner)return winner===a.team?-1:1;return a.original-b.original});
      rows.forEach((r,i)=>r.poolPosition=i+1);poolTables[g.id]=rows;
    });

    const firstSeconds=Object.values(poolTables).flatMap(rows=>rows.filter(r=>r.poolPosition<=2));
    const thirds=Object.values(poolTables).map(rows=>rows.find(r=>r.poolPosition===3)).filter(Boolean).sort((a,b)=>cmp(a,b,false)||a.globalOrder-b.globalOrder);
    const qualifiers=[...firstSeconds,...thirds.slice(0,2)].sort((a,b)=>cmp(a,b,true)||a.globalOrder-b.globalOrder);
    qualifiers.forEach((r,i)=>r.seed=i+1);
    return {completedCount:completed.length,total:groupMatches.length,qualifiers,poolTables};
  }

  function ensureStyle(){
    if(document.getElementById('kvlAvcWomenCombinedRankingStyle'))return;
    const style=document.createElement('style');
    style.id='kvlAvcWomenCombinedRankingStyle';
    style.textContent=`
      #combinedRankingRoot.avc-combined{overflow-x:auto!important}
      .kvl-avc-combined-header,.kvl-avc-combined-row{display:grid!important;grid-template-columns:72px minmax(170px,1.25fr) 92px 68px 68px 112px 112px 104px!important;align-items:center;gap:8px;min-width:900px;box-sizing:border-box}
      .kvl-avc-combined-header{padding:9px 13px;border-bottom:1px solid var(--kvl-women-line,#EDBED0);background:var(--kvl-women-soft,#FFF2F7);color:#6f5661;font-size:11px;font-weight:900;text-align:center}
      .kvl-avc-combined-header span:nth-child(2){text-align:left}
      .kvl-avc-combined-row{min-height:54px!important;padding:8px 13px!important}
      .kvl-avc-combined-row .kvl-seed{color:var(--kvl-women-dark,#A43F68);font-size:13px;font-weight:1000;text-align:center}
      .kvl-avc-combined-team{display:grid;grid-template-columns:30px minmax(0,1fr);align-items:center;gap:9px;min-width:0}
      .kvl-avc-combined-team img{width:28px;height:19px;object-fit:contain;background:#fff}
      .kvl-avc-combined-team strong{overflow:hidden;color:#17365D!important;font-size:13px;text-overflow:ellipsis;white-space:nowrap}
      .kvl-avc-combined-row>span{color:#667085!important;font-size:12px!important;font-weight:800;text-align:center;white-space:nowrap}
      .kvl-avc-combined-row .kvl-ratio{font-variant-numeric:tabular-nums;color:#334155!important}
      .kvl-avc-combined-row .kvl-qf{color:var(--kvl-women-dark,#A43F68)!important;font-weight:900}
      .kvl-avc-combined-row.is-korea{background:var(--kvl-women-soft,#FFF2F7)!important}
      @media(max-width:760px){.kvl-avc-combined-header,.kvl-avc-combined-row{min-width:840px;grid-template-columns:66px 160px 84px 62px 62px 104px 104px 96px!important}}
    `;
    document.head.appendChild(style);
  }

  function render(calc){
    const root=document.getElementById('combinedRankingRoot');if(!root)return;
    const head=document.querySelector('.avc-combined-head>p');
    if(head)head.textContent=`조별리그 ${calc.completedCount}/${calc.total}경기 기준 · 최종 확정`;
    root.innerHTML=`<div class="kvl-avc-combined-header" role="row"><span>종합순위</span><span>국가</span><span>조 순위</span><span>승리</span><span>승점</span><span>세트 득실률</span><span>득점 득실률</span><span>8강 대진</span></div>${calc.qualifiers.map(r=>`<div class="avc-combined-row kvl-avc-combined-row ${r.team==='대한민국'?'is-korea':''}" role="row"><span class="kvl-seed">${r.seed}위</span><div class="kvl-avc-combined-team">${flag(r.team)}<strong>${esc(r.team)}</strong></div><span>${esc(r.pool)}조 ${r.poolPosition}위</span><span>${r.wins}승</span><span>${r.matchPoints}점</span><span class="kvl-ratio">${fmtRatio(r.setsFor,r.setsAgainst)}</span><span class="kvl-ratio">${fmtRatio(r.pointsFor,r.pointsAgainst)}</span><span class="kvl-qf">${qfForSeed(r.seed)}</span></div>`).join('')}`;
  }

  function boot(){
    ensureStyle();
    fetch(DATA,{cache:'no-store'}).then(r=>r.ok?r.json():Promise.reject(r.status)).then(data=>{
      const calc=calculate(data);render(calc);
      const root=document.getElementById('combinedRankingRoot');
      if(root)new MutationObserver(()=>{if(!root.querySelector('.kvl-avc-combined-header'))render(calc)}).observe(root,{childList:true,subtree:true});
    }).catch(()=>{});
  }
  if(document.readyState==='complete')boot();else window.addEventListener('load',boot,{once:true});
})();