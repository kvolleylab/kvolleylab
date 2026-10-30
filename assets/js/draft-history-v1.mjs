// Annual facts are read-only joins. Never allocate IDs or mutate a player MASTER.
import {joinApplicants} from './draft-applicants-core.mjs';
let indexPromise;
const cache=new Map();
async function json(path){const r=await fetch(path,{cache:'no-store'});if(!r.ok)throw new Error(`Draft source unavailable: ${path}`);return r.json()}
export function loadDraftIndex(){return indexPromise??=json('data/draft-applicants/index.json').then(index=>{
 const keys=new Set();for(const s of index.seasons||[]){if(!/^\d{4}-\d{2}$/.test(s.season)||keys.has(s.season))throw new Error('Invalid draft season');keys.add(s.season);for(const path of [s.applicants,s.links,s.results,s.details].filter(Boolean))if(!path.startsWith(`data/draft-applicants/${s.season}/`)||path.includes('..'))throw new Error('Invalid draft source')}
 if(!keys.has(index.default_season))throw new Error('Missing default draft season');return index;
})}
export function mergeResults(rows,results,season){
 if(results.season!==season)throw new Error('Draft result season mismatch');
 const byId=new Map(rows.map(x=>[x.applicant_id,x])),seen=new Set();
 for(const r of results.results||[]){
  if(seen.has(r.applicant_id)||!byId.has(r.applicant_id)||r.season!==season)throw new Error('Invalid draft result identity');seen.add(r.applicant_id);
  if(r.record_status!=='VERIFIED'||r.access_level!=='PUBLIC'||!r.source_url||!/^https:\/\//.test(r.source_url)||!r.verified_at||!['selected','undrafted'].includes(r.status))throw new Error('Unverified draft result');
  if(r.status==='selected'&&(!r.team||!Number.isInteger(r.round)||r.round<1||!Number.isInteger(r.pick)||r.pick<1))throw new Error('Incomplete selected result');
 }
 const map=new Map((results.results||[]).map(x=>[x.applicant_id,x]));
 return rows.map(row=>({...row,selection:map.has(row.applicant_id)?{...map.get(row.applicant_id)}:{status:'unverified',team:null,round:null,pick:null}}));
}
export async function loadDraftSeason(season){
 const index=await loadDraftIndex(),entry=index.seasons.find(x=>x.season===(season||index.default_season));if(!entry)throw new Error('Unknown draft season');
 if(!cache.has(entry.season))cache.set(entry.season,(async()=>{
  const [dataset,mapping,results]=await Promise.all([json(entry.applicants),json(entry.links),entry.results?json(entry.results):{season:entry.season,results:[]}]);
  if(dataset.season!==entry.season)throw new Error('Draft season mismatch');
  const rows=joinApplicants(dataset,mapping),linked=new Set();
  for(const row of rows){if(row.season!==entry.season)throw new Error('Applicant season mismatch');if(row.player_id){const k=row.player_id;if(linked.has(k))throw new Error('Duplicate player link in season');linked.add(k)}}
  for(const gender of ['M','W'])if(dataset.divisions[gender]?.official_count!==rows.filter(x=>x.gender===gender).length)throw new Error('Official applicant count mismatch');
  return {dataset,mapping,rows:mergeResults(rows,results,entry.season)};
 })());return cache.get(entry.season);
}
export function validateAgainstCatalog(rows,catalog){
 const byId=new Map(catalog.map(p=>[p.playerId||p.id,p]));
 return rows.map(row=>{
  if(!row.player_id)return row;
  const p=byId.get(row.player_id),name=p?.nameKo||p?.name||p?.nameEn;
  if(p&&name===row.name&&p.gender===row.gender&&(p.birthDate&&row.birth_year&&p.birthDate.slice(0,4)===String(row.birth_year)))return row;
  return {...row,player_id:null,match_status:'needs_review',match:{...row.match,player_id:null,status:'needs_review',profile_verified:false,public_reason:'현재 선수 프로필과 신청 기록의 연결을 다시 확인하고 있습니다.'}};
 });
}
export function draftHubURL(row){return `draft-hub.html?season=${encodeURIComponent(row.season)}&gender=${encodeURIComponent(row.gender)}&applicant=${encodeURIComponent(row.applicant_id)}`}
export function safeReturnURL(value,fallback='players.html'){
 try{const url=new URL(value,location.href);const base=new URL('.',location.href);if(url.origin===base.origin&&url.pathname.startsWith(base.pathname)&&['players.html','draft-hub.html'].includes(url.pathname.split('/').pop()))return url.pathname+url.search+url.hash}catch{}return fallback;
}
