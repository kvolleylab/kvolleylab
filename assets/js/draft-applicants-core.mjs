// Pure draft-only functions. Never import eligibility as application evidence.
export const MATCH_LABELS={matched:'연결 완료',needs_review:'추가 확인 필요',unmatched:'미연결',duplicate_review:'동명이인·중복 검토'};
export const CATEGORY_LABELS={university:'대학',high_school:'고교',industrial:'실업',overseas_korean:'외국국적동포',other:'기타',unknown:'구분 미확인'};
export const APPLICATION_LABELS={confirmed:'신청 확인',withdrawn:'공식 철회'};
export const SELECTION_LABELS={unverified:'결과 미확인',selected:'지명 확인',undrafted:'미지명 확인'};
export function joinApplicants(dataset,mapping){
 const ids=new Set(),links=new Map();
 for(const row of mapping.links||[]){
  if(links.has(row.applicant_id))throw new Error('중복 신청자 연결');
  if(!Object.hasOwn(MATCH_LABELS,row.status))throw new Error('알 수 없는 연결 상태');
  if(row.status!=='matched'&&row.player_id)throw new Error('검수 전 선수 연결 금지');
  if(row.status==='matched'&&(!/^KVL-P-\d{6}$/.test(row.player_id||'')||row.profile_verified!==true||!row.evidence?.length))throw new Error('검증되지 않은 프로필 연결');
  links.set(row.applicant_id,row);
 }
 const rows=(dataset.applicants||[]).map(row=>{
  if(ids.has(row.applicant_id))throw new Error('중복 신청자 행');ids.add(row.applicant_id);
  if(row.access_level!=='PUBLIC'||row.record_status!=='VERIFIED'||!Object.hasOwn(APPLICATION_LABELS,row.application_status))throw new Error('미검수 신청 정보의 공개 금지');
  const link=links.get(row.applicant_id)||{status:'unmatched',player_id:null,evidence:[]};
  return {...row,match:link,match_status:link.status,player_id:link.status==='matched'?link.player_id:null};
 });
 for(const id of links.keys())if(!ids.has(id))throw new Error('신청자 없는 연결');
 return rows;
}
export function profileURL(row){return row.match_status==='matched'&&row.match?.profile_verified===true&&/^KVL-P-\d{6}$/.test(row.player_id||'')?`https://kvolleylab.com/player.html?id=${encodeURIComponent(row.player_id)}`:null}
export function filterApplicants(rows,f={}){
 const q=(f.query||'').trim().toLocaleLowerCase('ko');const grades=f.grades||[];
 const min=f.height_min===''||f.height_min==null?null:Number(f.height_min),max=f.height_max===''||f.height_max==null?null:Number(f.height_max);
 return rows.filter(p=>(!f.gender||p.gender===f.gender)&&(!q||p.name.toLocaleLowerCase('ko').includes(q))&&(!f.affiliation||p.affiliation===f.affiliation)&&(!f.category||p.category===f.category)&&(!f.position||(p.positions||[]).includes(f.position))&&(!grades.length||grades.includes(String(p.grade)))&&(!f.match_status||p.match_status===f.match_status)&&(!f.application_status||p.application_status===f.application_status)&&(!f.selection_status||p.selection.status===f.selection_status)&&(min===null||(p.height_cm!==null&&p.height_cm>=min))&&(max===null||(p.height_cm!==null&&p.height_cm<=max)));
}
export function sortApplicants(rows,sort='source'){
 const str=(a,b,key)=>String(a[key]||'').localeCompare(String(b[key]||''),'ko');
 return [...rows].sort((a,b)=>{
  if(sort.startsWith('height')){if(a.height_cm===null&&b.height_cm!==null)return 1;if(b.height_cm===null&&a.height_cm!==null)return -1;const diff=(a.height_cm??0)-(b.height_cm??0);if(diff)return sort==='height_desc'?-diff:diff}
  if(sort==='name')return str(a,b,'name');
  if(sort==='affiliation'){const v=str(a,b,'affiliation');if(v)return v;return str(a,b,'name')}
  return a.source_order-b.source_order||a.applicant_id.localeCompare(b.applicant_id);
 });
}
export function groupCounts(rows,key){const counts=new Map();for(const p of rows){const value=p[key]??'미확인';counts.set(String(value),(counts.get(String(value))||0)+1)}return [...counts.entries()].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0],'ko'))}
export function csvFor(rows){const protect=v=>{let s=String(v??'');if(/^[=+\-@\t\r]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"'};return '\ufeff'+[['시즌','부문','선수명','학교·소속','학년','참가구분','포지션','신장(cm)','신청상태','지명결과','DB연결','프로필','공식출처'],...rows.map(p=>[p.season,p.gender==='M'?'남자부':'여자부',p.name,p.affiliation,p.grade,CATEGORY_LABELS[p.category]||p.category,p.positions.join('/'),p.height_cm,APPLICATION_LABELS[p.application_status],SELECTION_LABELS[p.selection.status],MATCH_LABELS[p.match_status],profileURL(p)||'',p.source_url])].map(r=>r.map(protect).join(',')).join('\r\n')}
