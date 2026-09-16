/* K-Volley Lab · 2026 VNL Men · V2 data adapter
 * DATA ONLY: fetches existing VNL sources, normalizes them to the common V2 schema,
 * then asks the common template engine to refresh. No competition UI markup lives here.
 */
(()=>{
'use strict';

const FLAGS={Japan:'jp',Brazil:'br',Poland:'pl',Iran:'ir',USA:'us',France:'fr',Argentina:'ar',Italy:'it',Canada:'ca',Belgium:'be',Cuba:'cu',Slovenia:'si',Germany:'de',Serbia:'rs','Türkiye':'tr',Bulgaria:'bg',China:'cn',Ukraine:'ua'};
const CODES={Japan:'JPN',Brazil:'BRA',Poland:'POL',Iran:'IRI',USA:'USA',France:'FRA',Argentina:'ARG',Italy:'ITA',Canada:'CAN',Belgium:'BEL',Cuba:'CUB',Slovenia:'SLO',Germany:'GER',Serbia:'SRB','Türkiye':'TUR',Bulgaria:'BUL',China:'CHN',Ukraine:'UKR'};
const FLAG=name=>FLAGS[name]?`https://flagcdn.com/w80/${FLAGS[name]}.png`:'';
const ROUND={Quarterfinal:{stage:'8강',round:'QF'},Semifinal:{stage:'준결승',round:'SF'},'3rd Place':{stage:'3위결정전',round:'BRONZE'},Final:{stage:'결승',round:'FINAL'}};
const QF_NEXT={'KVL-M-000109':'KVL-M-000114','KVL-M-000110':'KVL-M-000113','KVL-M-000111':'KVL-M-000113','KVL-M-000112':'KVL-M-000114'};

function side(raw,participantMap){
  const en=raw?.name_en||'',p=participantMap.get(en);
  return {name:raw?.name_ko||p?.country_ko||en,en,code:CODES[en]||'',flag:FLAG(en),url:p?.country_page||''};
}
function resultFrom(raw,scoreMap){
  const detail=scoreMap.get(raw.match_id);
  const h=Number(detail?.home_sets??raw.score?.home_sets),a=Number(detail?.away_sets??raw.score?.away_sets);
  if(!Number.isFinite(h)||!Number.isFinite(a))return null;
  return {home:h,away:a,sets:(detail?.sets||[]).map(s=>({home:Number(s.home??s[0]),away:Number(s.away??s[1])}))};
}
function normalizeMatch(raw,participantMap,scoreMap){
  const rr=raw.stage==='finals'?(ROUND[raw.round]||{stage:'파이널',round:''}):{stage:'예선',round:''};
  return {
    id:raw.match_id,
    date:raw.date_kst,
    time:raw.time_kst,
    stage:rr.stage,
    round:rr.round,
    bracketLabel:rr.round?rr.round+(rr.round==='QF'?String(Number(raw.match_id.slice(-3))-108):rr.round==='SF'?String(Number(raw.match_id.slice(-3))-112):''):'',
    nextMatchId:QF_NEXT[raw.match_id]||'',
    home:side(raw.home,participantMap),
    away:side(raw.away,participantMap),
    venueLabel:raw.venue?.arena||raw.venue?.city_ko||raw.venue?.country_ko||'',
    score:resultFrom(raw,scoreMap)
  };
}
function normalizeStanding(row,participantMap){
  const p=participantMap.get(row.country);
  return {
    rank:row.rank,
    team:{name:row.country_ko,en:row.country,code:CODES[row.country]||'',flag:FLAG(row.country),url:p?.country_page||''},
    played:row.played,wins:row.wins,losses:row.losses,points:row.points,
    setRatio:Number(row.set_ratio).toFixed(3),pointRatio:Number(row.point_ratio).toFixed(3),
    status:row.host_qualified?'host-qualified':row.qualified?'qualified':'out',
    statusLabel:row.host_qualified?'개최국 · 파이널 진출':row.qualified?'파이널 진출':'예선 종료'
  };
}
function winner(m){if(!m?.score)return null;return m.score.home>m.score.away?m.home:m.away;}
function loser(m){if(!m?.score)return null;return m.score.home>m.score.away?m.away:m.home;}
function scoreText(m,team){
  if(!m?.score||!team)return '';
  const own=team.name===m.home.name?m.score.home:m.score.away,opp=team.name===m.home.name?m.score.away:m.score.home;
  return `${own}-${opp}`;
}

async function init(){
  try{
    const [participantsRaw,prelimRaw,standingsRaw,finalsRaw,scoresRaw,finalRaw]=await Promise.all([
      fetch('data/competition/vnl-2026-men-participants.json',{cache:'no-store'}).then(r=>r.json()),
      fetch('data/matches/vnl-2026-men.json',{cache:'no-store'}).then(r=>r.json()),
      fetch('data/standings/vnl-2026-men.json',{cache:'no-store'}).then(r=>r.json()),
      fetch('data/matches/vnl-2026-finals.json',{cache:'no-store'}).then(r=>r.json()),
      fetch('data/results/vnl-2026-men-set-scores.json',{cache:'no-store'}).then(r=>r.json()),
      fetch('data/standings/vnl-2026-men-final.json',{cache:'no-store'}).then(r=>r.json())
    ]);
    const participantMap=new Map((participantsRaw.participants||[]).map(p=>[p.country,p]));
    const scoreMap=new Map((scoresRaw.matches||[]).map(r=>[r.match_id,r]));
    const matches=[...(prelimRaw.matches||[]),...(finalsRaw.matches||[])].map(m=>normalizeMatch(m,participantMap,scoreMap));
    const participants=(participantsRaw.participants||[]).map(p=>({name:p.country_ko,en:p.country,code:CODES[p.country]||'',flag:FLAG(p.country),url:p.country_page||''}));
    const standingsRows=(standingsRaw.rows||[]).map(r=>normalizeStanding(r,participantMap));
    const finalRows=(finalRaw.rows||[]).map(r=>({rank:r.rank,team:r.country_ko,en:r.country,code:CODES[r.country]||'',flag:FLAG(r.country),url:participantMap.get(r.country)?.country_page||''}));
    const finalMatch=matches.find(m=>m.round==='FINAL'),bronze=matches.find(m=>m.round==='BRONZE');
    const champ=winner(finalMatch),runner=loser(finalMatch),third=winner(bronze),fourth=loser(bronze);
    const top=[
      champ&&{rank:1,team:champ.name,en:champ.en,flag:champ.flag,result:`우승 · 결승 ${runner?.name||''}에 ${scoreText(finalMatch,champ)}`},
      runner&&{rank:2,team:runner.name,en:runner.en,flag:runner.flag,result:`준우승 · 결승 ${champ?.name||''}에 ${scoreText(finalMatch,runner)}`},
      third&&{rank:3,team:third.name,en:third.en,flag:third.flag,result:`3위 · ${fourth?.name||''}에 ${scoreText(bronze,third)}`},
      fourth&&{rank:4,team:fourth.name,en:fourth.en,flag:fourth.flag,result:`4위 · ${third?.name||''}에 ${scoreText(bronze,fourth)}`}
    ].filter(Boolean);

    const base=window.KVL_COMPETITION_V2_DATA||{};
    const normalized={
      ...base,
      competitionId:'KVL-COMP-000001',
      gender:'men',
      competitionFamily:'fivb',
      status:'completed',
      stageLabel:'폴란드 우승 · 파이널 종료',
      displayName:'2026 VNL 남자부',
      officialName:'Volleyball Nations League 2026 · Men',
      dateLabel:'2026-06-10 ~ 2026-08-02',
      locationLabel:'예선 9개 개최지',
      venueLabel:'파이널 · 중국 닝보',
      teamCount:18,
      groupCount:108,
      matchCount:116,
      knockoutTeamCount:8,
      champion:'폴란드',
      championAchievement:'VNL 2026 챔피언',
      scheduleNote:'MASTER 기준 한국시간(KST) · 예선 108경기 + 파이널 8경기',
      standingsNote:'108경기 종료 · 상위 7개국 + 개최국 중국 파이널 진출',
      genderLinks:{men:'international-competition-vnl-men-2026-v2-prototype.html?view=overview'},
      structure:{
        labels:{groupsTab:'예선순위',groupsKpi:'예선 경기',groupsKpiUnit:'경기',knockoutKpi:'파이널 진출',standingsTitle:'예선순위',standingsEyebrow:'PRELIMINARY STANDINGS'},
        calendar:true,
        schedule:{stages:['전체','예선','8강','준결승','3위결정전','결승']},
        standings:{mode:'single-league',title:'예선 종합순위'},
        knockout:{mode:'bracket-8',title:'파이널 토너먼트'},
        participants:{mode:'flat',groupLabel:'VNL 2026 참가국'},
        roster:{mode:'link-only'}
      },
      meaning:{eyebrow:'SEASON STRUCTURE',title:'대회 의미 · 시즌 구조',note:'VNL은 예선 리그와 8강 파이널로 구성됩니다.'},
      qualifications:[
        {id:'finals',className:'is-wc',brand:'VNL 파이널',pill:'8개국',title:'상위 7개국 + 개최국',description:'18개국 예선 종료 후 상위 7개국과 파이널 개최국 중국이 8강 토너먼트에 진출합니다.',foot:'예선 → 8강 파이널',resultTeams:['일본','폴란드','슬로베니아','이탈리아','미국','튀르키예','우크라이나','중국']},
        {id:'champion',className:'is-la',brand:'시즌 최종 성적',pill:'2026',title:'폴란드 우승',description:'폴란드가 결승에서 미국을 3-2로 꺾고 2026 VNL 남자부 우승을 차지했습니다.',foot:'VNL 2026 챔피언',resultTeams:['폴란드']},
        {id:'ranking',className:'is-wr',brand:'FIVB 세계랭킹',pill:'공식 랭킹',title:'VNL 경기 랭킹 반영',description:'VNL 경기 결과는 FIVB World Ranking 계산에 반영됩니다.',foot:'경기별 World Ranking 포인트',resultTeams:[]}
      ],
      matches,
      standings:{rows:standingsRows},
      participants,
      finalRanking:top,
      finalRankingFull:finalRows,
      resources:[
        {title:'Volleyball World · VNL 공식 페이지',url:'https://en.volleyballworld.com/volleyball/competitions/volleyball-nations-league/'},
        {title:'Volleyball World · VNL 남자부 공식 순위',url:'https://en.volleyballworld.com/volleyball/competitions/volleyball-nations-league/standings/men/'},
        {title:'Volleyball World · FIVB 남자 세계랭킹',url:'https://en.volleyballworld.com/volleyball/world-ranking/men'}
      ]
    };
    window.KVL_COMPETITION_V2_DATA=normalized;
    if(window.KVLCompetitionTemplateV2)window.KVLCompetitionTemplateV2.apply();
    if(window.KVLCompetitionComponentsV2)window.KVLCompetitionComponentsV2.render(normalized);
  }catch(err){
    console.error('VNL V2 data adapter failed',err);
  }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
