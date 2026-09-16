/* K-Volley Lab · AVC Continental 2026 · shared V2 data adapter
 * DATA ONLY: converts existing AVC competition JSON into the common V2 schema.
 * This file must not create competition component HTML or competition-specific geometry.
 */
(()=>{
'use strict';

const CFG=window.KVL_AVC_SHARED_VALIDATION||{};
const TEAM_META={
  '대한민국':{en:'Korea',code:'KOR',flag:'kr'},
  '일본':{en:'Japan',code:'JPN',flag:'jp'},
  '호주':{en:'Australia',code:'AUS',flag:'au'},
  '바레인':{en:'Bahrain',code:'BRN',flag:'bh'},
  '오만':{en:'Oman',code:'OMA',flag:'om'},
  '이란':{en:'Iran',code:'IRI',flag:'ir'},
  '중국':{en:'China',code:'CHN',flag:'cn'},
  '인도':{en:'India',code:'IND',flag:'in'},
  '뉴질랜드':{en:'New Zealand',code:'NZL',flag:'nz'},
  '카타르':{en:'Qatar',code:'QAT',flag:'qa'},
  '대만':{en:'Chinese Taipei',code:'TPE',flag:'tw'},
  '태국':{en:'Thailand',code:'THA',flag:'th'},
  '이라크':{en:'Iraq',code:'IRQ',flag:'iq'},
  '인도네시아':{en:'Indonesia',code:'INA',flag:'id'},
  '카자흐스탄':{en:'Kazakhstan',code:'KAZ',flag:'kz'},
  '베트남':{en:'Vietnam',code:'VIE',flag:'vn'},
  '홍콩':{en:'Hong Kong',code:'HKG',flag:'hk'}
};
const FLAG=cc=>cc?`https://flagcdn.com/w80/${cc}.png`:'';
const ROUND={'8강':'QF','준결승':'SF','3위결정전':'BRONZE','결승':'FINAL'};

function team(name){
  const m=TEAM_META[name]||{en:name,code:'',flag:''};
  return {name,en:m.en,code:m.code,flag:FLAG(m.flag)};
}
function matchScore(m){
  const h=Number(m?.setsA),a=Number(m?.setsB);
  if(!Number.isFinite(h)||!Number.isFinite(a))return null;
  return {home:h,away:a,sets:(m.sets||[]).map(s=>({home:Number(s?.[0]),away:Number(s?.[1])}))};
}
function normalizeMatch(m,venueLabel){
  const r=ROUND[m.stage]||'';
  return {
    id:m.id,
    date:m.date,
    time:m.time,
    stage:m.stage,
    group:m.group||'',
    round:r,
    bracketLabel:r?(r==='BRONZE'?'3RD':r==='FINAL'?'FINAL':m.id):'',
    home:team(m.teamA),
    away:team(m.teamB),
    venueLabel,
    score:matchScore(m)
  };
}
function winner(m){
  if(!m?.score)return null;
  return m.score.home>m.score.away?m.home:m.away;
}
function loser(m){
  if(!m?.score)return null;
  return m.score.home>m.score.away?m.away:m.home;
}
function containsTeam(m,t){
  return !!t&&(m.home.name===t.name||m.away.name===t.name);
}
function addResult(row,m,isA){
  const setsFor=Number(isA?m.setsA:m.setsB),setsAgainst=Number(isA?m.setsB:m.setsA);
  row.played++;
  if(setsFor>setsAgainst)row.wins++; else row.losses++;
  row.setsFor+=setsFor;row.setsAgainst+=setsAgainst;
  if(setsFor===3&&setsAgainst<=1)row.points+=3;
  else if(setsFor===3&&setsAgainst===2)row.points+=2;
  else if(setsFor===2&&setsAgainst===3)row.points+=1;
  (m.sets||[]).forEach(s=>{
    const a=Number(s?.[0]),b=Number(s?.[1]);
    if(Number.isFinite(a)&&Number.isFinite(b)){
      row.pointsFor+=isA?a:b;
      row.pointsAgainst+=isA?b:a;
    }
  });
}
function ratio(a,b){
  if(!b)return a?999:0;
  return a/b;
}
function rowCompare(a,b){
  return b.wins-a.wins || b.points-a.points ||
    ratio(b.setsFor,b.setsAgainst)-ratio(a.setsFor,a.setsAgainst) ||
    ratio(b.pointsFor,b.pointsAgainst)-ratio(a.pointsFor,a.pointsAgainst) ||
    a.name.localeCompare(b.name,'ko');
}
function displayRatio(a,b){
  const r=ratio(a,b);
  return r===999?'MAX':r.toFixed(3);
}
function buildStats(raw){
  const map=new Map();
  (raw.groups||[]).forEach(g=>(g.teams||[]).forEach(n=>map.set(n,{
    name:n,group:g.id,played:0,wins:0,losses:0,points:0,
    setsFor:0,setsAgainst:0,pointsFor:0,pointsAgainst:0
  })));
  (raw.matches||[]).filter(m=>m.stage==='조별리그').forEach(m=>{
    if(map.has(m.teamA))addResult(map.get(m.teamA),m,true);
    if(map.has(m.teamB))addResult(map.get(m.teamB),m,false);
  });
  return map;
}
function rowFromStat(s,rank,qualified){
  return {
    rank,
    team:team(s.name),
    played:s.played,wins:s.wins,losses:s.losses,points:s.points,
    setRatio:displayRatio(s.setsFor,s.setsAgainst),
    pointRatio:displayRatio(s.pointsFor,s.pointsAgainst),
    status:qualified?'qualified':'out',
    statusLabel:qualified?'8강 진출':'조별리그 탈락'
  };
}
function seedMapFromRaw(raw){
  const seeds=new Map();
  (raw.combinedSeeds||[]).forEach(x=>seeds.set(x.team,Number(x.seed)));
  if(raw.competitionSystem?.quarterfinalPairs){
    raw.competitionSystem.quarterfinalPairs.forEach(p=>{
      const m=(raw.matches||[]).find(x=>x.id===p.matchId);
      if(!m)return;
      seeds.set(m.teamA,Number(p.seedA));
      seeds.set(m.teamB,Number(p.seedB));
    });
  }
  return seeds;
}
function buildStandings(raw){
  const stats=buildStats(raw);
  const qfTeams=new Set((raw.matches||[]).filter(m=>m.stage==='8강').flatMap(m=>[m.teamA,m.teamB]));
  const pools=(raw.groups||[]).map(g=>{
    const rows=(g.teams||[]).map(n=>stats.get(n)).filter(Boolean).sort(rowCompare)
      .map((s,i)=>rowFromStat(s,i+1,qfTeams.has(s.name)));
    return {id:g.id,title:`${g.id}조`,rows};
  });
  const seeds=seedMapFromRaw(raw);
  const seeded=[...seeds.entries()].sort((a,b)=>a[1]-b[1]).map(([name,rank])=>({name,rank}));
  const used=new Set(seeded.map(x=>x.name));
  const rest=[...stats.values()].filter(s=>!used.has(s.name)).sort(rowCompare)
    .map((s,i)=>({name:s.name,rank:seeded.length+i+1}));
  const combined=[...seeded,...rest].map(x=>rowFromStat(stats.get(x.name),x.rank,qfTeams.has(x.name)));
  return {pools,combinedRows:combined};
}
function wireBracket(matches){
  const qf=matches.filter(m=>m.round==='QF'),sf=matches.filter(m=>m.round==='SF');
  qf.forEach(m=>{
    const w=winner(m);
    const next=sf.find(s=>containsTeam(s,w));
    if(next)m.nextMatchId=next.id;
  });
}
function top4(matches){
  const f=matches.find(m=>m.round==='FINAL'),b=matches.find(m=>m.round==='BRONZE');
  const champ=winner(f),runner=loser(f),third=winner(b),fourth=loser(b);
  const item=(rank,t,label,m)=>t?{
    rank,team:t.name,en:t.en,flag:t.flag,
    result:`${label} · ${m?.score?`${m.score.home}-${m.score.away}`:''}`.replace(/\s·\s$/,'')
  }:null;
  return [
    item(1,champ,'우승',f),
    item(2,runner,'준우승',f),
    item(3,third,'3위',b),
    item(4,fourth,'4위',b)
  ].filter(Boolean);
}
function finalFull(raw,top){
  if(Array.isArray(raw.podium)&&raw.podium.length){
    return raw.podium.map(x=>{const t=team(x.team);return {rank:x.rank,team:t.name,en:t.en,flag:t.flag};});
  }
  return top.map(x=>({rank:x.rank,team:x.team,en:x.en,flag:x.flag}));
}
function genderLabel(g){return g==='women'?'여자':'남자';}
function hero(g){
  if(g==='women')return {
    pcImage:'assets/img/competition-hero/kvl-hero-avc-women-continental-2026-women-pc-v01.jpg',
    mobileImage:'assets/img/competition-hero/kvl-hero-avc-women-continental-2026-women-mobile-v01.jpg'
  };
  return {
    pcImage:'assets/img/competition-hero/kvl-hero-avc-men-continental-2026-men-pc-v01.webp',
    mobileImage:'assets/img/competition-hero/kvl-hero-avc-men-continental-2026-men-mobile-v01.webp'
  };
}
async function init(){
  try{
    if(!CFG.source)throw new Error('KVL_AVC_SHARED_VALIDATION.source is required');
    const raw=await fetch(CFG.source,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error(`AVC source ${r.status}`);return r.json();});
    const gender=CFG.gender==='women'?'women':'men';
    const venueLabel=raw.venueKo||raw.venue||[raw.hostCountry,raw.hostRegion].filter(Boolean).join(' ');
    const matches=(raw.matches||[]).map(m=>normalizeMatch(m,venueLabel));
    wireBracket(matches);
    const standings=buildStandings(raw);
    const finalRanking=top4(matches);
    const champion=finalRanking.find(x=>x.rank===1);
    const top3=finalRanking.filter(x=>x.rank<=3).map(x=>x.team);
    const participants=(raw.groups||[]).flatMap(g=>(g.teams||[]).map(n=>({...team(n),group:`${g.id}조`})));
    const normalized={
      ...(window.KVL_COMPETITION_V2_DATA||{}),
      competitionId:raw.competitionId,
      gender,
      competitionFamily:'avc',
      status:'completed',
      stageLabel:champion?`우승 ${champion.team} · 대회 종료`:'대회 종료',
      displayName:raw.displayName,
      officialName:raw.officialName,
      dateLabel:`${raw.startDate} ~ ${raw.endDate}`,
      locationLabel:[raw.hostCountry,raw.hostRegion].filter(Boolean).join(' '),
      venueLabel,
      teamCount:raw.teamCount,
      groupCount:raw.groupCount,
      matchCount:raw.matchCount,
      knockoutTeamCount:8,
      champion:champion?.team||raw.champion||'',
      championAchievement:'LA28 올림픽 직행',
      hero:hero(gender),
      genderLinks:{men:CFG.menLink||'',women:CFG.womenLink||''},
      scheduleNote:`한국시간(KST) · 총 ${raw.matchCount||matches.length}경기`,
      standingsNote:'조별리그 최종 결과 · 8강 진출 8개국',
      structure:{
        labels:{groupsTab:'조별순위',groupsKpi:'조 편성',groupsKpiUnit:'개 조',knockoutKpi:'8강 진출',standingsTitle:'조별순위',standingsEyebrow:'POOL & COMBINED STANDINGS'},
        calendar:true,
        schedule:{stages:['전체','조별리그','8강','준결승','3위결정전','결승']},
        standings:{mode:'pools-combined',combinedTitle:'예선 종합순위'},
        knockout:{mode:'bracket-8',title:'결선 토너먼트'},
        participants:{mode:'groups'},
        roster:{mode:'link-only'}
      },
      meaning:{eyebrow:'ROAD TO THE WORLD',title:'대회 의미 · 국제 진출권',note:'LA28 · 2027 World Cup · FIVB 세계랭킹에 연결됩니다.'},
      qualifications:[
        {id:'la28',className:'is-la',brand:'LA 2028 올림픽',pill:'아시아 1장',title:'우승팀 직행',description:`2026 AVC ${genderLabel(gender)} 대륙선수권 우승팀이 LA28 올림픽 출전 쿼터를 확보합니다.`,foot:'우승 → LA28 올림픽 진출',resultTeams:champion?[champion.team]:[]},
        {id:'worldcup',className:'is-wc',brand:'2027 FIVB World Cup',pill:'아시아 최대 3장',title:'최종 상위 3개 팀 진출',description:'최종 순위의 상위 eligible teams가 2027 FIVB Volleyball World Cup 출전권을 얻습니다.',foot:'상위 3 eligible teams → World Cup',resultTeams:top3},
        {id:'ranking',className:'is-wr',brand:'FIVB 세계랭킹',pill:'MWF 40',title:'모든 경기 랭킹 포인트 반영',description:'Continental Championship의 경기 결과가 FIVB World Ranking 계산에 반영됩니다.',foot:'경기별 World Ranking 포인트',resultTeams:[]}
      ],
      matches,
      standings,
      participants,
      finalRanking,
      finalRankingFull:finalFull(raw,finalRanking),
      resources:(raw.sources||[]).filter(x=>x.url).map(x=>({title:x.label||'공식자료',url:x.url}))
    };
    window.KVL_COMPETITION_V2_DATA=normalized;
    if(window.KVLCompetitionTemplateV2)window.KVLCompetitionTemplateV2.apply();
    if(window.KVLCompetitionComponentsV2)window.KVLCompetitionComponentsV2.render(normalized);
  }catch(err){
    console.error('AVC shared V2 adapter failed',err);
  }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();