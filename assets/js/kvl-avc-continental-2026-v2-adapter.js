/* K-Volley Lab · AVC Continental 2026 · shared V2 data adapter
 * DATA ONLY: converts existing AVC competition JSON into the common V2 schema.
 * This file must not create competition component HTML or competition-specific geometry.
 */
(()=>{
'use strict';

const COUNTRY_INFO={
  'Japan':{ko:'일본',flag:'jp'},'Italy':{ko:'이탈리아',flag:'it'},'Poland':{ko:'폴란드',flag:'pl'},'Türkiye':{ko:'튀르키예',flag:'tr'},'Turkey':{ko:'튀르키예',flag:'tr'},
  'Germany':{ko:'독일',flag:'de'},'Czechia':{ko:'체코',flag:'cz'},'Czech Republic':{ko:'체코',flag:'cz'},'France':{ko:'프랑스',flag:'fr'},'Iran':{ko:'이란',flag:'ir'},
  'South Korea':{ko:'대한민국',flag:'kr'},'Korea':{ko:'대한민국',flag:'kr'},'Portugal':{ko:'포르투갈',flag:'pt'},'India':{ko:'인도',flag:'in'},'Qatar':{ko:'카타르',flag:'qa'},
  'Bahrain':{ko:'바레인',flag:'bh'},'Oman':{ko:'오만',flag:'om'},'Australia':{ko:'호주',flag:'au'},'China':{ko:'중국',flag:'cn'},'Taiwan':{ko:'대만',flag:'tw'},
  'Thailand':{ko:'태국',flag:'th'},'New Zealand':{ko:'뉴질랜드',flag:'nz'},'Brazil':{ko:'브라질',flag:'br'},'Argentina':{ko:'아르헨티나',flag:'ar'},'Belgium':{ko:'벨기에',flag:'be'},
  'Netherlands':{ko:'네덜란드',flag:'nl'},'Spain':{ko:'스페인',flag:'es'},'Greece':{ko:'그리스',flag:'gr'},'Serbia':{ko:'세르비아',flag:'rs'},'Slovenia':{ko:'슬로베니아',flag:'si'},
  'Croatia':{ko:'크로아티아',flag:'hr'},'Romania':{ko:'루마니아',flag:'ro'},'Bulgaria':{ko:'불가리아',flag:'bg'},'Finland':{ko:'핀란드',flag:'fi'},'Estonia':{ko:'에스토니아',flag:'ee'},
  'Indonesia':{ko:'인도네시아',flag:'id'},'Kazakhstan':{ko:'카자흐스탄',flag:'kz'},'Saudi Arabia':{ko:'사우디아라비아',flag:'sa'},'United Arab Emirates':{ko:'아랍에미리트',flag:'ae'}
};
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
  if(m?.setsA==null||m?.setsB==null||m.setsA===''||m.setsB==='')return null;
  const h=Number(m.setsA),a=Number(m.setsB);
  if(!Number.isFinite(h)||!Number.isFinite(a))return null;
  return {home:h,away:a,sets:(m.sets||[]).map(s=>({home:Number(s?.[0]),away:Number(s?.[1])}))};
}
function normalizeMatch(m,venueLabel,gender){
  const r=ROUND[m.stage]||'';
  return {
    id:m.id,
    officialNo:m.officialNo,
    localTimeLabel:gender==='women'?`중국 현지 ${m.localTime||m.timeLocal||'미확인'} CST`:`일본 현지 ${m.time||'미정'} JST`,
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
  (raw.matches||[]).filter(m=>m.stage==='조별리그'&&matchScore(m)).forEach(m=>{
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
    rows.forEach((r,i)=>{const s=stats.get(r.team.name);s.poolRank=i+1;});
    return {id:g.id,title:`${g.id}조`,matchCount:(raw.matches||[]).filter(m=>m.group===g.id).length,rows};
  });
  // Production ranks pool positions first, including non-qualifiers; do not globally sort the remainder.
  const ordered=[...stats.values()].sort((a,b)=>a.poolRank-b.poolRank||rowCompare(a,b));
  const combined=ordered.map((s,i)=>rowFromStat(s,i+1,qfTeams.has(s.name)));
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
    result:rank===1?'우승 · LA28 올림픽 직행':label,
    qualification:rank<=3?'2027 FIVB 월드컵 진출':''
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
    pcImage:'assets/img/competition-hero/kvl-hero-avc-men-user-photo-v1.webp',
    mobileImage:'assets/img/competition-hero/kvl-hero-avc-men-user-photo-v1.webp'
  };
}
async function init(){
  try{
    if(!CFG.source)throw new Error('KVL_AVC_SHARED_VALIDATION.source is required');
    const raw=await fetch(CFG.source,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error(`AVC source ${r.status}`);return r.json();});
    const gender=CFG.gender==='women'?'women':'men';
    const venueLabel=raw.venueKo||(gender==='men'?'기타큐슈시 종합체육관':raw.venue)||[raw.hostCountry,raw.hostRegion].filter(Boolean).join(' ');
    const matches=(raw.matches||[]).map(m=>normalizeMatch(m,venueLabel,gender));
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
      status:['upcoming','active','completed'].includes(raw.status)?raw.status:'upcoming',
      stageLabel:raw.scheduleStatusLabel||(champion?`우승 ${champion.team} · 대회 종료`:'공식 결과 확인 중'),
      displayName:raw.displayName,
      officialName:raw.officialName,
      dateLabel:[raw.startDate,raw.endDate].map(v=>v+'('+['일','월','화','수','목','금','토'][new Date(v+'T12:00:00Z').getUTCDay()]+')').join(' ~ '),
      venuePrimary:gender==='men'?'일본 후쿠오카':'중국 톈진',
      venueSecondary:venueLabel,
      focusTeamCode:'KOR',
      focus:{code:'KOR',name:'대한민국',flagEmoji:'🇰🇷',rankingUrl:`https://en.volleyballworld.com/volleyball/world-ranking/${gender}`,note:'대한민국 랭킹 숫자는 공식 데이터 검수 후 연결합니다.'},
      timezoneSummary:gender==='men'?'KST/JST 동일 시각':'한국시간(KST) · 중국 현지 UTC+8',
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
        roster:{mode:'full'}
      },
      meaning:{eyebrow:'ROAD TO THE WORLD',title:'대회 의미 · 국제 진출권',note:'LA28 · 2027 World Cup · FIVB 세계랭킹에 직접 연결됩니다.'},
      qualifications:[
        {id:'la28',className:'is-la',brand:'LA 2028 올림픽',pill:'아시아 1장',title:'우승팀 직행',description:`2026 AVC ${genderLabel(gender)} 대륙선수권 우승팀이 LA28 올림픽 ${genderLabel(gender)}배구 출전 쿼터를 확보합니다.`,foot:'우승 → LA28 올림픽 진출',resultTeams:champion?[champion.team]:[]},
        {id:'worldcup',className:'is-wc',brand:'2027 FIVB World Cup',pill:'아시아 최대 3장',title:'최종 상위 3개 팀 진출',description:'최종 순위에서 가장 높은 3개 eligible teams가 2027 FIVB Volleyball World Cup 출전권을 얻습니다.',foot:'상위 3 eligible teams → World Cup',resultTeams:top3},
        {id:'ranking',className:'is-wr',brand:'FIVB 세계랭킹',pill:'MWF 40',title:'모든 경기 랭킹 포인트 반영',description:'Continental Championship의 모든 경기가 FIVB World Ranking에 반영되며 상대와 세트스코어에 따라 포인트가 변동합니다.',foot:'경기별 ± World Ranking 포인트',resultTeams:[]}
      ],
      matches,
      standings,
      participants,
      finalRanking,
      finalRankingFull:finalFull(raw,finalRanking),
      resourcesNote:'Volleyball World · AVC 공식자료 기준',
      resources:(raw.sources||[]).filter(x=>x.url&&x.type==='official').map(x=>({title:x.label||'공식자료',url:x.url}))
    };
    normalized.rosters={};
    normalized.clubSeasonLabel='26-27 소속팀';
    normalized.rosterNote='등번호 오름차순 · 공식 확정된 26-27 소속팀만 공개';
    normalized.rosterSourceNote='K-Volley Lab 선수명단 MASTER 공개 필드 + 검증된 Volleybox 프로필. 26-27 소속팀은 CONFIRMED/FA만 팀명 공개하며, 공식확인된 소속팀은 리그 국가와 리그명을 국기와 함께 표시합니다. 보도 단계(REPORTED)와 미확인(UNKNOWN)은 ‘미확인’으로 표시합니다. 내부 관찰·연봉 정보는 노출하지 않습니다.';
    normalized.rosterPrintNote='※ 소속팀은 공식확정/FA만 공개하며 미확인·보도 단계는 ‘미확인’으로 표기';
    normalized.rosterPendingLabel='등록 선수명단은 공식 자료 검수 후 연결합니다.';
    if(gender==='men'){
      const urls=['a','b','c'].map(g=>`data/competitions/avc-men-continental-2026-rosters-${g}.json`);
      const bundles=await Promise.all([...urls,'data/competitions/avc-men-continental-2026-clubs-2026-27.json','data/competitions/avc-men-continental-2026-volleybox-links.json'].map(url=>fetch(url).then(r=>{if(!r.ok)throw Error(url+': '+r.status);return r.json();})));
      const clubs=bundles[3].teams||{},vb=bundles[4].teams||{};
      for(const r of bundles.slice(0,3).flatMap(b=>b.teams||[])){
        const participant=participants.find(p=>p.code===r.code);if(participant){participant.count=r.players.length;participant.en=r.en;}
        normalized.rosters[r.code]={statusLabel:(String(r.status).startsWith('FINAL')?'최종 ':'등록 ')+r.players.length+'명',players:r.players.map(p=>{
          const c=clubs[r.code]?.[String(p.number)],allowed=c?.status==='CONFIRMED';
          const country=COUNTRY_INFO[c?.leagueCountry];
          const vbUrl=vb[r.code]?.[String(p.number)]||'';
          return {number:p.number,name:p.koreanName,en:p.officialName||p.fullName,position:p.position,dob:p.birthDate,heightCm:p.heightCm,playerId:p.playerId||p.player_id||'',volleybox:/^https:\/\/(?:[a-z]+\.)?volleybox\.net\//i.test(vbUrl)?vbUrl:'',club:{confirmed:allowed,name:allowed?c.club:c?.status==='FREE_AGENT'?'FA / 무소속':'미확인',country:allowed?(country?.ko||c.leagueCountry||''):'',flag:allowed&&country?.flag?`https://flagcdn.com/w40/${country.flag}.png`:'',league:allowed?c.leagueName||'':''}};
        })};
      }
    }
    window.KVL_COMPETITION_V2_DATA=normalized;
    if(window.KVLCompetitionTemplateV2)window.KVLCompetitionTemplateV2.apply();
    if(window.KVLCompetitionComponentsV2)window.KVLCompetitionComponentsV2.render(normalized);
  }catch(err){
    console.error('AVC shared V2 adapter failed',err);document.body.dataset.kvlRenderState='error';const main=document.querySelector('[data-kvl-shell]');if(main){const message=document.createElement('p');message.setAttribute('role','alert');message.textContent='대회 데이터를 불러오지 못했습니다. 새로고침 후 다시 확인해 주세요.';main.prepend(message);}
  }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();