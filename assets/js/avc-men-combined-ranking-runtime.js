(()=>{
  const path=(location.pathname.split('/').pop()||'').toLowerCase();
  if(path!=='international-competition-avc-men-continental-2026.html')return;

  const DATA='data/competitions/avc-men-continental-2026.json?v=20260904-1';
  const teamMeta={
    '일본':['Japan','jp'],'호주':['Australia','au'],'바레인':['Bahrain','bh'],'오만':['Oman','om'],
    '이란':['Iran','ir'],'중국':['China','cn'],'인도':['India','in'],'뉴질랜드':['New Zealand','nz'],
    '카타르':['Qatar','qa'],'대한민국':['Korea','kr'],'대만':['Chinese Taipei','tw'],'태국':['Thailand','th']
  };
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const ratio=(a,b)=>b===0?(a>0?Number.POSITIVE_INFINITY:0):a/b;
  const fmtRatio=(a,b)=>b===0?(a>0?'MAX':'-'):(a/b).toFixed(3);
  const matchPoints=(a,b)=>a===3?(b<=1?[3,0]:[2,1]):b===3?(a<=1?[0,3]:[1,2]):[0,0];
  const flag=team=>{const meta=teamMeta[team];return meta?`<img src="https://flagcdn.com/w80/${meta[1]}.png" alt="${esc(team)} 국기" loading="lazy">`:''};
  const qfForSeed=seed=>seed===1||seed===8?'1-8':seed===4||seed===5?'4-5':seed===2||seed===7?'2-7':'3-6';

  function resultOf(m){
    const setsA=Number(m.setsA),setsB=Number(m.setsB);
    if(!Number.isFinite(setsA)||!Number.isFinite(setsB)||(setsA!==3&&setsB!==3))return null;
    let pointsA=0,pointsB=0,pointSets=0;
    (m.sets||[]).forEach(s=>{
      const a=Number(s?.[0]),b=Number(s?.[1]);
      if(Number.isFinite(a)&&Number.isFinite(b)){pointsA+=a;pointsB+=b;pointSets++}
    });
    return {setsA,setsB,pointsA,pointsB,hasPoints:pointSets>0};
  }

  function calculate(data){
    const groupMatches=(data.matches||[]).filter(m=>m.stage==='조별리그');
    const completed=groupMatches.filter(m=>resultOf(m));
    const stats=new Map();let globalOrder=0;
    (data.groups||[]).forEach(g=>g.teams.forEach((team,index)=>stats.set(team,{
      team,pool:g.id,original:index,globalOrder:globalOrder++,played:0,wins:0,losses:0,matchPoints:0,
      setsFor:0,setsAgainst:0,pointsFor:0,pointsAgainst:0,pointMatches:0,poolPosition:0,combinedRank:0,qualified:false
    })));

    completed.forEach(m=>{
      const r=resultOf(m),a=stats.get(m.teamA),b=stats.get(m.teamB);if(!r||!a||!b)return;
      const [pa,pb]=matchPoints(r.setsA,r.setsB);
      a.played++;b.played++;a.matchPoints+=pa;b.matchPoints+=pb;
      a.setsFor+=r.setsA;a.setsAgainst+=r.setsB;b.setsFor+=r.setsB;b.setsAgainst+=r.setsA;
      if(r.hasPoints){
        a.pointsFor+=r.pointsA;a.pointsAgainst+=r.pointsB;b.pointsFor+=r.pointsB;b.pointsAgainst+=r.pointsA;
        a.pointMatches++;b.pointMatches++;
      }
      if(r.setsA>r.setsB){a.wins++;b.losses++}else{b.wins++;a.losses++}
    });

    const directWinner=(a,b)=>{
      const m=completed.find(x=>(x.teamA===a.team&&x.teamB===b.team)||(x.teamA===b.team&&x.teamB===a.team));
      if(!m)return '';
      const r=resultOf(m);return r.setsA>r.setsB?m.teamA:m.teamB;
    };
    const ratioCmp=(a,b)=>{
      if(a===b)return 0;
      if(!Number.isFinite(a))return -1;
      if(!Number.isFinite(b))return 1;
      return b-a;
    };
    const cmp=(a,b,headToHead=false)=>{
      if(b.wins!==a.wins)return b.wins-a.wins;
      if(b.matchPoints!==a.matchPoints)return b.matchPoints-a.matchPoints;
      const sr=ratioCmp(ratio(a.setsFor,a.setsAgainst),ratio(b.setsFor,b.setsAgainst));if(Math.abs(sr)>1e-9)return sr;
      if(a.pointMatches&&b.pointMatches){
        const pr=ratioCmp(ratio(a.pointsFor,a.pointsAgainst),ratio(b.pointsFor,b.pointsAgainst));if(Math.abs(pr)>1e-9)return pr;
      }
      if(headToHead){const winner=directWinner(a,b);if(winner)return winner===a.team?-1:1}
      return a.globalOrder-b.globalOrder;
    };

    const poolTables={};
    (data.groups||[]).forEach(g=>{
      const rows=g.teams.map(t=>stats.get(t));
      if(completed.length){
        rows.sort((a,b)=>cmp(a,b,true));
        rows.forEach((r,i)=>r.poolPosition=i+1);
      }
      poolTables[g.id]=rows;
    });

    const isFinal=groupMatches.length>0&&completed.length===groupMatches.length;
    const hasAny=completed.length>0;
    let allRows=[...stats.values()].sort((a,b)=>a.globalOrder-b.globalOrder);

    if(hasAny){
      const automaticQualifiers=Object.values(poolTables).flatMap(rows=>rows.filter(r=>r.poolPosition<=2));
      const thirds=Object.values(poolTables)
        .map(rows=>rows.find(r=>r.poolPosition===3))
        .filter(Boolean)
        .sort((a,b)=>cmp(a,b,false));
      const qualifiedSet=new Set([...automaticQualifiers,...thirds.slice(0,2)].map(r=>r.team));
      stats.forEach(r=>{r.qualified=qualifiedSet.has(r.team)});

      const qualifiers=[...stats.values()].filter(r=>r.qualified).sort((a,b)=>cmp(a,b,true));
      const eliminated=[...stats.values()].filter(r=>!r.qualified).sort((a,b)=>cmp(a,b,true));
      allRows=[...qualifiers,...eliminated];
      allRows.forEach((r,i)=>r.combinedRank=i+1);
    }

    return {
      completedCount:completed.length,
      total:groupMatches.length,
      hasAny,
      isFinal,
      phase:isFinal?'final':hasAny?'live':'pre',
      allRows,
      poolTables
    };
  }

  function ensureStyle(){
    if(document.getElementById('kvlAvcMenCombinedRankingStyle'))return;
    const style=document.createElement('style');
    style.id='kvlAvcMenCombinedRankingStyle';
    style.textContent=`
      #combinedRankingRoot.avc-combined{overflow-x:auto!important}
      .kvl-avc-combined-header,.kvl-avc-combined-row{display:grid!important;grid-template-columns:72px minmax(170px,1.25fr) 92px 68px 68px 112px 112px 138px!important;align-items:center;gap:8px;min-width:940px;box-sizing:border-box}
      .kvl-avc-combined-header{padding:9px 13px;border-bottom:1px solid var(--avc-line,#D8E8DF);background:var(--avc-soft,#F3FAF5);color:#536B5D;font-size:11px;font-weight:900;text-align:center}
      .kvl-avc-combined-header span:nth-child(2){text-align:left}
      .kvl-avc-combined-row{min-height:54px!important;padding:8px 13px!important}
      .kvl-avc-combined-row.rank-9{border-top:2px solid var(--avc-line,#D8E8DF)!important}
      .kvl-avc-combined-row .kvl-rank{color:var(--avc-primary,#166534);font-size:13px;font-weight:1000;text-align:center}
      .kvl-avc-combined-team{display:grid;grid-template-columns:30px minmax(0,1fr);align-items:center;gap:9px;min-width:0}
      .kvl-avc-combined-team img{width:28px;height:19px;object-fit:contain;background:#fff}
      .kvl-avc-combined-team strong{overflow:hidden;color:#17365D!important;font-size:13px;text-overflow:ellipsis;white-space:nowrap}
      .kvl-avc-combined-row>span{color:#667085!important;font-size:12px!important;font-weight:800;text-align:center;white-space:nowrap}
      .kvl-avc-combined-row .kvl-ratio{font-variant-numeric:tabular-nums;color:#334155!important}
      .kvl-avc-combined-status{display:flex!important;align-items:center;justify-content:center;gap:6px;white-space:nowrap}
      .kvl-avc-status-badge{display:inline-flex;align-items:center;justify-content:center;border-radius:999px;padding:4px 8px;font-size:11px;font-weight:900;line-height:1}
      .kvl-avc-status-badge.is-qualified{background:#EDF8F0;border:1px solid #BBDCC6;color:#166534}
      .kvl-avc-status-badge.is-eliminated{background:#F2F4F7;border:1px solid #E4E7EC;color:#667085}
      .kvl-avc-status-badge.is-pregame{background:#F8FAFC;border:1px solid #E2E8F0;color:#64748B}
      .kvl-avc-qf-seed{color:#3F7652;font-size:10px;font-weight:800}
      .kvl-avc-combined-row.is-korea{background:#F0FDF4!important}
      .kvl-avc-combined-row.is-eliminated{background:#FCFCFD}
      @media(max-width:760px){.kvl-avc-combined-header,.kvl-avc-combined-row{min-width:900px;grid-template-columns:66px 160px 84px 62px 62px 104px 104px 128px!important}}
    `;
    document.head.appendChild(style);
  }

  function syncCopy(calc){
    const title=document.querySelector('.avc-combined-head h3');
    if(title)title.textContent='예선 종합순위 · 전체 12개국';
    const scheduleRule=document.querySelector('#schedule .avc-rule-card small');
    if(scheduleRule)scheduleRule.innerHTML='<b>예선 종합순위:</b> 승리 경기 수 → 승점 → 세트 득실률 → 득점 득실률 → 동률 시 맞대결 순으로 비교합니다. 경기 결과가 바뀌면 현재 8강권과 예상 대진도 함께 갱신됩니다.';
    const groupRule=document.querySelector('#groups .avc-rule-card p');
    if(groupRule)groupRule.textContent='각 팀의 예선 성적은 승리 경기 수 → 승점 → 세트 득실률 → 득점 득실률 → 동률 시 맞대결 순으로 계산합니다. 각 조 1·2위와 조 3위 중 성적 상위 2팀이 8강에 진출하며, 진출 8팀은 같은 성적 기준으로 종합 1~8번 시드를 정합니다. 탈락 4팀도 같은 기준으로 이어서 9~12위에 표시합니다.';
    const empty=document.querySelector('#combinedRankingRoot .avc-combined-empty');
    if(empty&&calc?.phase==='pre')empty.textContent='조별리그 시작 전 · 12개국 전체 순위는 경기 결과 입력 후 자동 계산됩니다.';
  }

  function statusHtml(r,phase){
    if(phase==='pre')return '<span class="kvl-avc-status-badge is-pregame">경기 전</span>';
    if(r.qualified){
      const label=phase==='final'?'8강 진출':'현재 8강권';
      return `<span class="kvl-avc-status-badge is-qualified">${label}</span><small class="kvl-avc-qf-seed">${qfForSeed(r.combinedRank)}</small>`;
    }
    return `<span class="kvl-avc-status-badge is-eliminated">${phase==='final'?'조별리그 탈락':'현재 탈락권'}</span>`;
  }

  function render(calc){
    const root=document.getElementById('combinedRankingRoot');if(!root)return;
    const head=document.querySelector('.avc-combined-head>p');
    if(head){
      head.textContent=calc.phase==='pre'
        ?`조별리그 0/${calc.total}경기 · 경기 전`
        :`조별리그 ${calc.completedCount}/${calc.total}경기 기준 · 대회 규정 자동계산 · ${calc.isFinal?'최종 확정':'진행 중'}`;
    }
    root.innerHTML=`<div class="kvl-avc-combined-header" role="row"><span>종합순위</span><span>국가</span><span>조 순위</span><span>승리</span><span>승점</span><span>세트 득실률</span><span>득점 득실률</span><span>결과</span></div>${calc.allRows.map(r=>`<div class="avc-combined-row kvl-avc-combined-row ${r.combinedRank?`rank-${r.combinedRank}`:''} ${r.team==='대한민국'?'is-korea':''} ${calc.phase!=='pre'?(r.qualified?'is-qualified':'is-eliminated'):''}" role="row"><span class="kvl-rank">${r.combinedRank?`${r.combinedRank}위`:'-'}</span><div class="kvl-avc-combined-team">${flag(r.team)}<strong>${esc(r.team)}</strong></div><span>${esc(r.pool)}조 ${r.poolPosition?`${r.poolPosition}위`:'-'}</span><span>${r.wins}승</span><span>${r.matchPoints}점</span><span class="kvl-ratio">${r.played?fmtRatio(r.setsFor,r.setsAgainst):'-'}</span><span class="kvl-ratio">${r.pointMatches?fmtRatio(r.pointsFor,r.pointsAgainst):'-'}</span><span class="kvl-avc-combined-status">${statusHtml(r,calc.phase)}</span></div>`).join('')}`;
  }

  function boot(){
    ensureStyle();
    fetch(DATA,{cache:'no-store'}).then(r=>r.ok?r.json():Promise.reject(r.status)).then(data=>{
      const calc=calculate(data);render(calc);syncCopy(calc);
      const root=document.getElementById('combinedRankingRoot');
      if(root)new MutationObserver(()=>{if(!root.querySelector('.kvl-avc-combined-header')){render(calc);syncCopy(calc)}}).observe(root,{childList:true,subtree:true});
    }).catch(()=>{});
  }
  if(document.readyState==='complete')boot();else window.addEventListener('load',boot,{once:true});
})();