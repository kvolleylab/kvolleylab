(()=>{
  'use strict';
  const INF=Number.POSITIVE_INFINITY;
  const safe=(n,d=0)=>Number.isFinite(Number(n))?Number(n):d;
  const ratio=(a,b)=>b?safe(a)/safe(b):(a?INF:0);
  const parseSet=s=>{
    if(Array.isArray(s)) return [safe(s[0]),safe(s[1])];
    const m=String(s||'').match(/^(\d+)\s*[-:]\s*(\d+)$/);
    return m?[Number(m[1]),Number(m[2])]:null;
  };
  const clone=o=>JSON.parse(JSON.stringify(o));

  function normalizeGame(game){
    const sets=(game.sets||[]).map(parseSet).filter(Boolean);
    let setsA=0,setsB=0,pointsA=0,pointsB=0;
    sets.forEach(([a,b])=>{pointsA+=a;pointsB+=b;if(a>b)setsA++;else if(b>a)setsB++;});
    if(!sets.length&&game.score){
      const m=String(game.score).match(/^(\d+)\s*[-:]\s*(\d+)$/);
      if(m){setsA=Number(m[1]);setsB=Number(m[2]);}
    }
    const completed=setsA!==setsB&&(setsA>=3||setsB>=3||game.completed===true||game.status==='공식 결과');
    return {...game,sets,setsA,setsB,pointsA,pointsB,completed,locked:game.status==='공식 결과'||game.locked===true};
  }

  function matchPoints(a,b,scheme){
    const key=`${a}-${b}`;
    const defaults={'3-0':[3,0],'3-1':[3,0],'3-2':[2,1],'2-3':[1,2],'1-3':[0,3],'0-3':[0,3]};
    const value=(scheme&&scheme[key])||defaults[key]||[a>b?1:0,b>a?1:0];
    return [safe(value[0]),safe(value[1])];
  }

  function blank(team){return {team,played:0,wins:0,losses:0,matchPoints:0,setsFor:0,setsAgainst:0,pointsFor:0,pointsAgainst:0,setRatio:0,pointRatio:0,rank:0,qualified:false};}

  function calculate(games,rules={},filter={}){
    const normalized=(games||[]).map(normalizeGame).filter(g=>g.completed)
      .filter(g=>!filter.division||g.division===filter.division)
      .filter(g=>!filter.pool||g.pool===filter.pool)
      .filter(g=>!filter.stage||g.stage===filter.stage);
    const names=[...new Set(normalized.flatMap(g=>[g.teamA,g.teamB]).filter(Boolean))];
    const map=Object.fromEntries(names.map(t=>[t,blank(t)]));
    normalized.forEach(g=>{
      const a=map[g.teamA]||(map[g.teamA]=blank(g.teamA));
      const b=map[g.teamB]||(map[g.teamB]=blank(g.teamB));
      a.played++;b.played++;
      a.setsFor+=g.setsA;a.setsAgainst+=g.setsB;b.setsFor+=g.setsB;b.setsAgainst+=g.setsA;
      a.pointsFor+=g.pointsA;a.pointsAgainst+=g.pointsB;b.pointsFor+=g.pointsB;b.pointsAgainst+=g.pointsA;
      if(g.setsA>g.setsB){a.wins++;b.losses++;}else{b.wins++;a.losses++;}
      const [ap,bp]=matchPoints(g.setsA,g.setsB,rules.matchPointsScheme);
      a.matchPoints+=ap;b.matchPoints+=bp;
    });
    Object.values(map).forEach(x=>{x.setRatio=ratio(x.setsFor,x.setsAgainst);x.pointRatio=ratio(x.pointsFor,x.pointsAgainst);});
    const order=rules.rankingRules||['wins','setRatio','pointRatio','headToHead'];
    const rows=Object.values(map).sort((a,b)=>compareRows(a,b,order,normalized,rules));
    const q=safe(rules.qualifiersPerPool,0);
    rows.forEach((r,i)=>{r.rank=i+1;r.qualified=q>0&&i<q;});
    return rows;
  }

  function metric(row,key){
    const aliases={wins:'wins',matchPoints:'matchPoints',setRatio:'setRatio',pointRatio:'pointRatio',setsWon:'setsFor',pointsWon:'pointsFor'};
    return row[aliases[key]||key];
  }

  function headToHead(a,b,games,rules){
    const direct=games.filter(g=>(g.teamA===a.team&&g.teamB===b.team)||(g.teamA===b.team&&g.teamB===a.team));
    if(!direct.length)return 0;
    const mini=calculate(direct,{...rules,rankingRules:(rules.headToHeadRules||['wins','matchPoints','setRatio','pointRatio']),qualifiersPerPool:0},{});
    const ai=mini.findIndex(x=>x.team===a.team),bi=mini.findIndex(x=>x.team===b.team);
    return ai<bi?-1:ai>bi?1:0;
  }

  function compareRows(a,b,order,games,rules){
    for(const key of order){
      if(key==='headToHead'){
        const h=headToHead(a,b,games,rules);if(h)return h;
      }else{
        const av=metric(a,key),bv=metric(b,key);
        if(av!==bv)return bv-av;
      }
    }
    return String(a.team).localeCompare(String(b.team),'ko');
  }

  function replaceGame(games,id,patch){return (games||[]).map(g=>g.id===id?{...g,...clone(patch),status:g.status==='공식 결과'?g.status:(patch.status||'예상 결과')}:g);}

  function pendingGames(games,filter={}){return (games||[]).map(normalizeGame).filter(g=>!g.locked&&!g.completed)
    .filter(g=>!filter.division||g.division===filter.division).filter(g=>!filter.pool||g.pool===filter.pool).filter(g=>!filter.stage||g.stage===filter.stage);}

  function defaultOutcomeSets(score){
    const templates={
      '3-0':[[25,20],[25,20],[25,20]],'3-1':[[25,20],[22,25],[25,20],[25,20]],'3-2':[[25,20],[22,25],[25,20],[22,25],[15,12]],
      '2-3':[[20,25],[25,22],[20,25],[25,22],[12,15]],'1-3':[[20,25],[25,22],[20,25],[20,25]],'0-3':[[20,25],[20,25],[20,25]]
    };
    return templates[score]||[];
  }

  function enumerate(games,rules={},filter={},options={}){
    const pending=pendingGames(games,filter);
    const scorelines=options.scorelines||['3-0','3-1','3-2','2-3','1-3','0-3'];
    const max=options.maxScenarios||50000;
    const total=Math.pow(scorelines.length,pending.length);
    if(total>max)return {total,calculated:0,truncated:true,probabilities:{},message:`경우의 수 ${total.toLocaleString()}개로 간편 계산 한도를 초과했습니다.`};
    const counts={};let calculated=0;
    function walk(index,current){
      if(index===pending.length){
        calculated++;
        calculate(current,rules,filter).forEach(r=>{if(!counts[r.team])counts[r.team]={qualified:0,total:0};counts[r.team].total++;if(r.qualified)counts[r.team].qualified++;});
        return;
      }
      const game=pending[index];
      scorelines.forEach(score=>walk(index+1,replaceGame(current,game.id,{score,sets:defaultOutcomeSets(score),completed:true})));
    }
    walk(0,clone(games));
    const probabilities=Object.fromEntries(Object.entries(counts).map(([team,c])=>[team,{...c,percent:c.total?c.qualified/c.total*100:0}]));
    return {total,calculated,truncated:false,probabilities,assumption:'각 세트 스코어 결과를 동일한 가능성으로 간주한 경우의 수 비율이며 실제 전력 예측 확률이 아닙니다.'};
  }

  function explain(row,rows,rules={}){
    if(!row)return '팀 정보를 확인할 수 없습니다.';
    const labels={wins:'승리 경기 수',matchPoints:'승점',setRatio:'세트득실률',pointRatio:'점수득실률',setsWon:'승리 세트 수',pointsWon:'총 득점',headToHead:'승자승'};
    const ruleText=(rules.rankingRules||[]).map(x=>labels[x]||x).join(' → ');
    const status=row.qualified?'본선 진출권':'진출권 밖';
    return `${row.team}은 현재 ${row.rank}위로 ${status}입니다. ${row.wins}승 ${row.losses}패, 승점 ${row.matchPoints}, 세트득실률 ${Number.isFinite(row.setRatio)?row.setRatio.toFixed(3):'∞'}, 점수득실률 ${Number.isFinite(row.pointRatio)?row.pointRatio.toFixed(3):'∞'}입니다.${ruleText?` 순위 기준은 ${ruleText} 순입니다.`:''}`;
  }

  window.KVLTournamentEngine={normalizeGame,calculate,replaceGame,pendingGames,enumerate,explain,defaultOutcomeSets};
})();
