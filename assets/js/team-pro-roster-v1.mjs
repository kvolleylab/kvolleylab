const FALLBACK={
 season:'2026-27',
 men:'data/competitions/v-league-men-2026-27/rosters.json',
 women:'data/competitions/v-league-women-2026-27/rosters.json'
};
const INDEX='data/team-rosters/v-league/index.json';
const TEAM_NAMES={
 KAL:'대한항공',HDC:'현대캐피탈',WRC:'우리카드',KBI:'KB손해보험',KEP:'한국전력',OKF:'OK저축은행',SFB:'삼성화재',
 GSC:'GS칼텍스',KEX:'한국도로공사',HHC:'현대건설',HPS:'흥국생명',IBK:'IBK기업은행',RSP:'정관장',SOO:'SOOP'
};
const primary=v=>String(v||'').split(/[\/,+]/).map(x=>x.trim()).filter(Boolean)[0]||'';
async function sourceConfig(){
 try{
  const r=await fetch(INDEX,{cache:'no-store'});if(!r.ok)throw new Error('index');
  const index=await r.json(),season=(index.seasons||[]).find(x=>x.season===index.currentSeason);
  if(!season?.men||!season?.women)throw new Error('season');
  return{season:season.season,men:season.men,women:season.women};
 }catch{return FALLBACK}
}
function normalizeRow(row,code,gender,season,base){
 const team=TEAM_NAMES[code]||code,id=row.playerId||'';
 return{
  ...(base||{}),
  playerId:id,
  displayCode:base?.displayCode||'',
  nameKo:row.name||base?.nameKo||'',
  nameEn:row.en||base?.nameEn||'',
  birthDate:row.dob||base?.birthDate||'',
  nationality:row.nationalityCode||row.nationality||base?.nationality||'',
  height:row.heightCm??base?.height??'',
  position:primary(row.position||base?.position),
  rawPosition:row.position||base?.rawPosition||'',
  team,school:team,schoolCode:'',schoolKey:'team:'+team,
  grade:'',gradeLabel:'',draftEligible:false,type:'domestic',level:'professional',label:'프로',
  gender,jersey:row.number??'',season,currentPro:true,
  limited:!id,unlinkedCurrent:!id,
  sourceIds:[row.sourceId].filter(Boolean),
  sourceRef:{
    file:gender==='M'?FALLBACK.men:FALLBACK.women,
    verification:row.recordStatus||'KOVO official current roster',
    last_change_source:row.lastChangeSource||row.registrationSource||'',
    as_of:row.registrationDate||''
  }
 };
}
export async function loadCurrentProPlayers(catalog=[]){
 const cfg=await sourceConfig(),byId=new Map(catalog.filter(p=>p.playerId).map(p=>[p.playerId,p]));
 const [mr,wr]=await Promise.all([fetch(cfg.men,{cache:'no-store'}),fetch(cfg.women,{cache:'no-store'})]);
 if(!mr.ok||!wr.ok)throw new Error('current_pro_roster_unavailable');
 const [men,women]=await Promise.all([mr.json(),wr.json()]);
 const players=[];
 for(const [code,team] of Object.entries(men))for(const row of team.players||[])players.push(normalizeRow(row,code,'M',cfg.season,byId.get(row.playerId)));
 for(const [code,team] of Object.entries(women))for(const row of team.players||[])players.push(normalizeRow(row,code,'W',cfg.season,byId.get(row.playerId)));
 return{players,season:cfg.season,linked:players.filter(p=>p.playerId).length,unlinked:players.filter(p=>!p.playerId).length};
}
export async function catalogWithCurrentPro(catalog=[]){
 const current=await loadCurrentProPlayers(catalog);
 return{...current,players:[...catalog.filter(p=>p.level!=='professional'),...current.players]};
}
