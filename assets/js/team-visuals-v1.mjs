const SCHOOL_MANIFEST='data/master/school_logo_manifest_2026.json?v=20261027-1';
const PRO_LOGOS={
 '대한항공':'assets/img/team-logos/v-league/2026-27/men/KAL.svg',
 '현대캐피탈':'assets/img/team-logos/v-league/2026-27/men/HDC.svg',
 '우리카드':'assets/img/team-logos/v-league/2026-27/men/WRC.svg',
 'KB손해보험':'assets/img/team-logos/v-league/2026-27/men/KBI.svg',
 '한국전력':'assets/img/team-logos/v-league/2026-27/men/KEP.svg',
 'OK저축은행':'assets/img/team-logos/v-league/2026-27/men/OKF.svg',
 '삼성화재':'assets/img/team-logos/v-league/2026-27/men/SFB.svg',
 'GS칼텍스':'assets/img/team-logos/v-league/2026-27/women/GSC.svg',
 '한국도로공사':'assets/img/team-logos/v-league/2026-27/women/KEX.svg',
 '현대건설':'assets/img/team-logos/v-league/2026-27/women/HHC.svg',
 '흥국생명':'assets/img/team-logos/v-league/2026-27/women/HPS.svg',
 'IBK기업은행':'assets/img/team-logos/v-league/2026-27/women/IBK.svg',
 '정관장':'assets/img/team-logos/v-league/2026-27/women/RSP.svg',
 'SOOP':'assets/img/team-logos/v-league/2026-27/women/SOO.svg'
};
const COUNTRY_ISO2={
 '대한민국':'kr','대한민국 대표팀':'kr','South Korea':'kr','Korea':'kr','KOR':'kr',
 'Argentina':'ar','Belgium':'be','Brazil':'br','Germany':'de','Iran':'ir','Japan':'jp',
 'Poland':'pl','Serbia':'rs','Slovenia':'si','Türkiye':'tr','Turkey':'tr','USA':'us','United States':'us'
};
const normalize=v=>String(v||'').trim().replace(/\s+/g,'').toLocaleLowerCase();
let schoolPromise=null;
async function schoolIndex(){
 if(schoolPromise)return schoolPromise;
 schoolPromise=fetch(SCHOOL_MANIFEST,{cache:'no-store'}).then(r=>r.ok?r.json():Promise.reject(new Error('school_logo_manifest'))).then(manifest=>{
  const teams=manifest.teams||{},base=manifest.basePath||'assets/images/school-logos/2026/',map=new Map();
  const put=(name,key)=>{if(name)map.set(normalize(name),key)};
  for(const [key,entry] of Object.entries(teams)){put(key,key);put(entry.school_name,key);put(entry.display_name,key);for(const alias of entry.aliases||[])put(alias,key)}
  for(const [alias,target] of Object.entries({...manifest.aliases,...manifest.displayAliases}))put(alias,map.get(normalize(target))||target);
  return{nameMap:map,teams,base};
 }).catch(()=>({nameMap:new Map(),teams:{},base:'assets/images/school-logos/2026/'}));
 return schoolPromise;
}
function schoolPath(name,index){const key=index.nameMap.get(normalize(name));if(!key)return'';const entry=index.teams[key];if(!entry)return'';const raw=entry.asset_path||entry.path||entry.file||'';return raw?(raw.includes('/')?raw:index.base+raw):''}
function flagSrc(name){const iso=COUNTRY_ISO2[String(name||'').trim()]||'';return iso?'https://flagcdn.com/w160/'+iso+'.png':''}
export async function visualForTeam(team){
 if(PRO_LOGOS[team.name])return{kind:'logo',src:PRO_LOGOS[team.name],alt:team.name+' 로고'};
 if(team.level==='international'||team.level==='national'){
  const candidate=team.name||team.players?.[0]?.nationality||'';
  const src=flagSrc(candidate);if(src)return{kind:'flag',src,alt:candidate+' 국기'};
 }
 const index=await schoolIndex(),src=schoolPath(team.name,index);
 return src?{kind:'logo',src,alt:team.name+' 로고'}:{kind:'fallback',src:'',alt:''};
}
export async function attachTeamVisuals(teams){for(const team of teams)team.visual=await visualForTeam(team);return teams}
export function renderTeamVisual(team,{hero=false,escape=v=>String(v)}={}){
 const v=team.visual||{kind:'fallback'},cls='tw-team-visual '+(hero?'tw-team-visual-hero ':'')+(v.kind==='flag'?'is-flag':'is-logo');
 if(v.src)return '<span class="'+cls+'"><img src="'+escape(v.src)+'" alt="'+escape(v.alt)+'" loading="lazy"></span>';
 const initials=String(team.name||'팀').replace(/대학교|고등학교|중학교|배구단|배구부|프로배구단/g,'').trim().slice(0,2)||'팀';
 return '<span class="'+cls+' is-fallback" aria-hidden="true">'+escape(initials)+'</span>';
}