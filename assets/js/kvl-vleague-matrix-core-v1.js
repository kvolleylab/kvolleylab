/* Pure read-only V-League matrix. Source: approved matrix v4, PR #328. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.KVLVLeagueMatrixCoreV1 = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const METRICS = ['games','wins','losses','points','setWins','setLosses','pointsFor','pointsAgainst'];
  const blank = code => Object.fromEntries([['code',code], ...METRICS.map(k => [k,0])]);
  const integer = x => Number.isInteger(x) && x >= 0;
  const pair = (a,b) => [a,b].sort().join('|');
  function roundOf(m) {
    if (/준플레이오프|플레이오프|챔피언|올스타/.test(m.stage || '')) return null;
    const stage = String(m.stage || '').match(/^([1-6])\s*라운드$/);
    const raw = String(m.round ?? '').trim().match(/^([1-6])(?:\s*라운드|R|ROUND)?$/i);
    if (stage && raw && stage[1] !== raw[1]) return null;
    return stage ? +stage[1] : raw ? +raw[1] : null;
  }
  function validateScore(m) {
    const s = m.score;
    if (m.status !== 'final' || m.scoreVerification === false || !s ||
        !integer(s.home) || !integer(s.away) || Math.max(s.home,s.away) !== 3 || Math.min(s.home,s.away)>2) return false;
    if (!Array.isArray(s.sets) || s.sets.length !== s.home+s.away) return false;
    let h=0,a=0;
    for (const [i,t] of s.sets.entries()) {
      if (!integer(t.home) || !integer(t.away) || t.complete === false) return false;
      const max=Math.max(t.home,t.away),min=Math.min(t.home,t.away),target=i===4?15:25;
      if (!((max===target && min<=target-2)||(max>target && max-min===2))) return false;
      if (t.home>t.away) h++; else a++;
      if (i<s.sets.length-1 && Math.max(h,a)===3) return false;
    }
    return h===s.home && a===s.away;
  }
  function add(stats,m) {
    const h=stats[m.home.code],a=stats[m.away.code],s=m.score;
    h.games++;a.games++;h.setWins+=s.home;h.setLosses+=s.away;a.setWins+=s.away;a.setLosses+=s.home;
    const winner=s.home>s.away?h:a,loser=winner===h?a:h;
    winner.wins++;loser.losses++;
    winner.points+=Math.min(s.home,s.away)===2?2:3;loser.points+=Math.min(s.home,s.away)===2?1:0;
    for (const t of s.sets) {h.pointsFor+=t.home;h.pointsAgainst+=t.away;a.pointsFor+=t.away;a.pointsAgainst+=t.home;}
  }
  // Cross multiplication preserves exact quotients; rounded display ratios do not break ties.
  function ratioCompare(af,aa,bf,ba) {
    const ai=aa===0&&af>0,bi=ba===0&&bf>0;
    if(ai||bi) return ai===bi?0:ai?-1:1;
    return Math.sign(bf*(aa||1)-af*(ba||1));
  }
  function compare(a,b,withPoints=true) {
    return (withPoints?b.points-a.points:0) || b.wins-a.wins ||
      ratioCompare(a.setWins,a.setLosses,b.setWins,b.setLosses) ||
      ratioCompare(a.pointsFor,a.pointsAgainst,b.pointsFor,b.pointsAgainst);
  }
  function groups(sorted,cmp) {
    return sorted.reduce((a,v)=>{if(!a.length || cmp(a.at(-1)[0],v)!==0)a.push([]);a.at(-1).push(v);return a;},[]);
  }
  function ranks(stats,matches,official) {
    const rows=Object.values(stats),played=rows.filter(x=>x.games);
    const sourceRows=Array.isArray(official?.rows)?official.rows:[];
    const sourceMap=new Map(sourceRows.map(x=>[x.team?.code,x]));
    const officialOK=sourceRows.length===played.length && sourceMap.size===played.length && played.length>0 &&
      played.every(x=>{const o=sourceMap.get(x.code);return o && METRICS.every(k=>o[k]===x[k]) && integer(o.rank) && o.rank>0;}) &&
      new Set(sourceRows.map(x=>x.rank)).size===played.length && sourceRows.every(x=>x.rank<=played.length);
    const out=Object.fromEntries(rows.map(x=>[x.code,{rank:null,tied:false}]));
    if(officialOK){for(const x of played)out[x.code]={rank:sourceMap.get(x.code).rank,tied:false};return {byCode:out,official:true};}
    const basic=groups([...played].sort(compare),compare),resolved=[];
    for(const tied of basic){
      if(tied.length===1){resolved.push(tied);continue;}
      if(tied.length===2){
        const codes=tied.map(x=>x.code),head=matches.filter(m=>codes.includes(m.home.code)&&codes.includes(m.away.code))
          .sort((a,b)=>(a.date+'T'+(a.time||'')).localeCompare(b.date+'T'+(b.time||'')));
        const last=head.at(-1);
        if(last){const win=last.score.home>last.score.away?last.home.code:last.away.code;resolved.push([tied.find(x=>x.code===win)],[tied.find(x=>x.code!==win)]);}
        else resolved.push(tied);
      } else {
        const codes=tied.map(x=>x.code),mini=Object.fromEntries(codes.map(c=>[c,blank(c)]));
        for(const m of matches)if(codes.includes(m.home.code)&&codes.includes(m.away.code))add(mini,m);
        const cmp=(a,b)=>compare(mini[a.code],mini[b.code],false);
        resolved.push(...groups([...tied].sort(cmp),cmp));
      }
    }
    let n=1;for(const group of resolved){for(const x of group)out[x.code]={rank:n,tied:group.length>1};n+=group.length;}
    return {byCode:out,official:false};
  }
  function build(data,config={}) {
    if(!Array.isArray(data?.participants)||data.participants.length!==7||!Array.isArray(data.matches))throw Error('7개 팀과 경기 데이터가 필요합니다.');
    const pmap=new Map(data.participants.map(p=>[p.code,p]));
    const order=[...(data.previousSeasonRanking?.rows||[])].sort((a,b)=>a.rank-b.rank);
    if(order.length!==7||new Set(order.map(x=>x.teamCode)).size!==7||order.some((x,i)=>x.rank!==i+1||!pmap.has(x.teamCode)))throw Error('전년도 최종 순위 팀 배열을 확인할 수 없습니다.');
    const aliases=config.structure?.calendarDisplay?.teamAliases || {};
    const teams=order.map(x=>({...pmap.get(x.teamCode),short:aliases[x.teamCode]||pmap.get(x.teamCode).name}));
    const codes=teams.map(t=>t.code),issues=[],notices=[],byPair=new Map(),idPairs=new Map(),keyPairs=new Map(),badPairs=new Set();
    const signature=m=>JSON.stringify([m.home?.code,m.away?.code,m.date,m.time,m.status,m.score,m.scoreVerification]);
    for(const m of data.matches){
      const round=roundOf(m);
      if(!round){if(!/준플레이오프|플레이오프|챔피언|올스타/.test(m.stage||''))issues.push({round:1,id:m.id,code:'ROUND_MISSING'});continue;}
      if(!m.id||!codes.includes(m.home?.code)||!codes.includes(m.away?.code)||m.home.code===m.away.code){issues.push({round,id:m.id,code:'IDENTITY_INVALID'});continue;}
      const key=round+'|'+pair(m.home.code,m.away.code);
      for(const [map,id] of [[idPairs,m.id],[keyPairs,m.officialSourceKey]]){
        if(!id)continue;
        if(map.has(id)&&map.get(id)!==key){badPairs.add(key);badPairs.add(map.get(id));issues.push({round,id:m.id,code:'IDENTITY_CONFLICT'});}
        map.set(id,key);
      }
      if(!byPair.has(key))byPair.set(key,{...m,matrixRound:round});
      else if(signature(byPair.get(key))===signature(m))notices.push({round,id:m.id,code:'DUPLICATE_IGNORED'});
      else {badPairs.add(key);issues.push({round,id:m.id,code:'PAIR_CONFLICT'});}
    }
    for(const key of badPairs)byPair.delete(key);
    const fixtures=[...byPair.values()],finals=[];
    for(const m of fixtures){if(m.status!=='final')continue;if(validateScore(m))finals.push(m);else issues.push({round:m.matrixRound,id:m.id,code:'INVALID_FINAL'});}
    for(let r=1;r<=6;r++){const count=fixtures.filter(m=>m.matrixRound===r).length;if(count!==21)issues.push({round:r,code:'SCHEDULE_COVERAGE',count,expected:21});}
    const rounds=[];
    for(let r=1;r<=6;r++){
      const own=finals.filter(m=>m.matrixRound===r),upto=finals.filter(m=>m.matrixRound<=r),scheduled=fixtures.filter(m=>m.matrixRound===r);
      const stats=Object.fromEntries(codes.map(c=>[c,blank(c)])),rs=Object.fromEntries(codes.map(c=>[c,blank(c)]));
      for(const m of upto)add(stats,m);for(const m of own)add(rs,m);
      const rankings=ranks(stats,upto,data.standings);
      const issuesUpto=issues.filter(x=>x.round<=r),started=own.length>0||scheduled.some(m=>['live','in_progress'].includes(m.status));
      const matrix=Object.fromEntries(codes.map(c=>[c,Object.fromEntries(codes.map(o=>[o,null]))]));
      for(const m of own){matrix[m.home.code][m.away.code]=m.score.home;matrix[m.away.code][m.home.code]=m.score.away;}
      rounds.push({round:r,completed:own.length,expected:21,started,complete:own.length===21,
        cumulativeComplete:upto.length===r*21,issues:issuesUpto,rankSource:rankings.official?'official-reconciled':'rules-calculated',
        rows:teams.map(t=>({...t,...stats[t.code],rPoints:rs[t.code].points,rank:issuesUpto.length?null:rankings.byCode[t.code].rank,
          tied:rankings.byCode[t.code].tied,sets:matrix[t.code]}))});
    }
    return {teams,rounds,issues,notices,completed:finals.length,fixtures:fixtures.length,updatedAt:data.updatedAt,source:data.automation?.source};
  }
  return {build,roundOf,validateScore,compare,ratioCompare,ranks};
});
