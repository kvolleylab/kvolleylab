'use strict';
/* Derived-only index. Never rewrites official competition snapshots or Player Master. */
const fs=require('node:fs'),path=require('node:path');
const ROOT=path.resolve(__dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(ROOT,p),'utf8'));
const OUT_COUNTRIES='data/international/country-directory-v1.json';
const OUT_ROSTERS='data/international/country-roster-index-v1.json';
const REGIONS={
 asia:'JPN IRI CHN THA PAK KAZ UZB INA KGZ QAT IND VIE HKG KOR TPE PHI NEP MGL BRN OMA',
 europe:'POL FRA ITA BEL SLO GER SRB TUR BUL UKR CZE NED',
 north_america:'USA CAN CUB DOM',
 south_america:'BRA ARG',
 oceania:'AUS NZL'
};
const CONFIG=read('data/international/country-source-config-v1.json');
const SOURCES=CONFIG?.sources;
if(CONFIG?.schema_version!==1||!Array.isArray(SOURCES)||SOURCES.length<5)
 throw Error('Missing reviewed international competition source config');
const used=new Set();
for(const x of SOURCES){
 if(!x||!/^\d{4}$/.test(String(x.year||''))||!['men','women'].includes(x.gender)
  ||!['embedded','separate','team-array','cup'].includes(x.kind)
  ||!/^data\/(?:competitions|competition)\/[a-z0-9_-]+(?:\/(?:data|rosters))?\.json$/.test(x.path||'')
  ||x.rosterPath&&!/^data\/competitions\/[a-z0-9_-]+\/rosters\.json$/.test(x.rosterPath)
  ||!x.slug||used.has(x.slug)||!x.title||!x.href)throw Error('Unreviewed or duplicate source '+x?.slug);
 used.add(x.slug);
}
const CODE=/^[A-Z]{3}$/;
const safeUrl=u=>typeof u==='string'&&/^https:\/\//.test(u)?u:null;
const regionFor=code=>{
 const matches=Object.entries(REGIONS).filter(([,codes])=>codes.split(' ').includes(code));
 if(matches.length!==1)throw Error('Missing/ambiguous regional mapping for '+code);
 return matches[0][0];
};
function build(){
 const existing=read('data/master/country_master.json');
 const existingIds=new Map(existing.map(x=>[x.iso3,x.country_id]));
 const countries=new Map(),snapshots=[];
 const data=SOURCES.map(src=>({...src,raw:read(src.path),rosters:src.rosterPath?read(src.rosterPath):null}));
 for(const src of data.filter(x=>x.kind!=='cup')){
  const participants=src.kind==='team-array'?src.raw.teams:src.raw.participants;
  if(!Array.isArray(participants))throw Error('Source participants missing: '+src.path);
  for(const team of participants){
   if(!CODE.test(team.code||''))throw Error('Invalid official country code '+src.path);
   const c=countries.get(team.code)||{code:team.code,name_ko:team.nameKo||team.name||'',name_en:team.en||team.name||'',flag_code:null};
   const match=String(team.flag||'').match(/\/w\d+\/([a-z]{2})\.png(?:\?.*)?$/i);
   const iso2=match?.[1]?.toLowerCase()||(/^[a-z]{2}$/i.test(team.flag||'')?team.flag.toLowerCase():null);
   if(iso2&&c.flag_code&&c.flag_code!==iso2)throw Error('Conflicting flag code '+team.code);
   if(iso2)c.flag_code=iso2;
   countries.set(team.code,c);
  }
 }
 if(countries.size<40)throw Error('Existing country evidence unexpectedly shrank below 40; check source revisions.');
 const english=new Map([...countries.values()].map(c=>[c.name_en.toLowerCase(),c.code]));
 for(const src of data){
  let teams;
  if(src.kind==='team-array')teams=src.raw.teams.map(t=>({code:t.code,roster:t}));
  else if(src.kind==='cup')teams=src.raw.teams.map(t=>({code:english.get(String(t.country||'').toLowerCase()),roster:t}));
  else{
   const source=src.kind==='embedded'?src.raw.rosters:src.rosters;
   teams=Object.entries(source).map(([code,roster])=>({code,roster}));
  }
  for(const {code,roster} of teams){
   if(!countries.has(code))throw Error('Unmapped country in '+src.slug+': '+code);
   const count=roster?.players?.length||0;
   const status=String(roster.statusLabel||roster.status||roster.verification_status||'대회 명단 게시');
   const stage=src.kind==='team-array'&&/^FINAL\b/i.test(status)?'final':
     src.kind==='team-array'&&/출국/.test(status)?'departure':'tournament_registration';
   const sourceUrl=safeUrl(roster.source)||null;
   snapshots.push({
    snapshot_id:src.slug+':'+code,
    country_code:code,
    gender:src.gender,
    year:src.year,
    competition_slug:src.slug,
    competition_title:src.title,
    stage,
    source_status_label:status,
    player_count:count,
    source_format:src.kind,
    source_path:src.kind==='separate'?src.rosterPath:src.path,
    source_team_key:src.kind==='cup'?String(roster.country||''):code,
    source_url:sourceUrl,
    competition_url:src.href,
    player_identity_policy:'source_id_only_no_name_guess'
   });
  }
 }
 const overview=[...countries.values()].map(c=>{
  if(!c.name_ko||!c.flag_code)throw Error('Incomplete grounded country: '+c.code);
  return {
   code:c.code,
   country_id:existingIds.get(c.code)||null,
   name_ko:c.name_ko,
   name_en:c.name_en,
   flag_iso2:c.flag_code,
   region:regionFor(c.code),
   available_genders:[...new Set(snapshots.filter(s=>s.country_code===c.code).map(s=>s.gender))].sort(),
   snapshot_count:snapshots.filter(s=>s.country_code===c.code).length
  };
 }).sort((a,b)=>a.name_ko.localeCompare(b.name_ko,'ko'));
 const countriesOut={schema_version:1,collection:'KVL international national-team directory',data_years:[...new Set(SOURCES.map(s=>s.year))].sort((a,b)=>a-b),
  source_policy:'Only source-approved published competition participants. No country non-participation inference. Existing country_master IDs reused, never reassigned.',
  regions:['asia','europe','north_america','south_america','oceania'],
  sources:SOURCES.map(({slug,path,rosterPath})=>({slug,path,...rosterPath?{roster_path:rosterPath}:{}})),
  country_count:overview.length,countries:overview};
 const rosterOut={schema_version:1,collection:'KVL international tournament roster index',
  source_policy:'Metadata references historical published tournament source files only. Candidate pools, weekly selections and finality must be separately source-verified. No source player ID reassignment.',
  snapshot_count:snapshots.length,
  snapshots:snapshots.sort((a,b)=>b.year-a.year||a.country_code.localeCompare(b.country_code)||a.gender.localeCompare(b.gender)||a.competition_slug.localeCompare(b.competition_slug))};
 return {countriesOut,rosterOut};
}
function serialize(x){return JSON.stringify(x,null,2)+'\n'}
function run(){
 const {countriesOut,rosterOut}=build();
 for(const [file,value] of [[OUT_COUNTRIES,countriesOut],[OUT_ROSTERS,rosterOut]]){
  const expected=serialize(value);
  if(process.argv.includes('--check')){
   if(!fs.existsSync(path.join(ROOT,file))||fs.readFileSync(path.join(ROOT,file),'utf8')!==expected)throw Error('Index out of sync: '+file+'; run node scripts/build-international-country-index-v1.cjs --write');
  }else if(process.argv.includes('--write')){
   fs.mkdirSync(path.dirname(path.join(ROOT,file)),{recursive:true});
   fs.writeFileSync(path.join(ROOT,file),expected);
  }else console.log(file+': '+(file===OUT_COUNTRIES?countriesOut.country_count:rosterOut.snapshot_count));
 }
}
if(require.main===module)run();
module.exports={build,serialize,SOURCES,REGIONS};
