import {escapeHTML as e} from './player-workspace-core.mjs';

// Official application-time facts only. Never substitute current player-profile facts.
export function mergeListDetails(rows, details, season) {
  if (!details) return rows;
  const fail=()=>{throw new Error('공식 신청자 상세 자료의 신원·출처 대조가 필요합니다.');};
  if(details.season!==season||!['M','W'].includes(details.division)||!Array.isArray(details.records)||!details.verified_at)fail();
  const source=details.source;
  if(!source?.source_id||!/^https:\/\//.test(source.url||'')||!/^[a-f0-9]{64}$/.test(source.sha256||''))fail();
  const known=new Map(rows.map(p=>[p.applicant_id,p])),seen=new Map();
  for(const d of details.records){
    const p=known.get(d.applicant_id);
    if(!p||seen.has(d.applicant_id)||p.season!==season||p.gender!==details.division||p.name!==d.name||p.affiliation!==d.affiliation||p.source_order!==d.source_order||p.source_id!==d.source_id||d.source_id!==source.source_id||p.source_url!==source.url||d.access_level!=='PUBLIC'||d.record_status!=='VERIFIED')fail();
    if(!/^\d{4}-\d{2}-\d{2}$/.test(d.birth_date||'')||!Number.isFinite(Date.parse(d.birth_date))||new Date(d.birth_date).toISOString().slice(0,10)!==d.birth_date||Number(d.birth_date.slice(0,4))!==p.birth_year||!Number.isFinite(d.weight_kg)||d.weight_kg<=0||d.weight_kg>250||typeof d.previous_school!=='string'||!d.previous_school.trim())fail();
    seen.set(d.applicant_id,d);
  }
  if(seen.size!==rows.filter(p=>p.gender===details.division).length)fail();
  return rows.map(p=>{const d=seen.get(p.applicant_id);return d?{...p,birth_date:d.birth_date,weight_kg:d.weight_kg,previous_school:d.previous_school}:p;});
}

export const highlightedApplicant=p=>['high_school','industrial','overseas_korean'].includes(p.category)||(p.category==='university'&&[1,2,3].includes(p.grade));

export function renderOfficialApplicantTable(rows,{season,gender,nameControl}) {
  const end=String(Number(season.slice(0,4))+1),title=`${season.slice(0,4)}~${end} KOVO ${gender==='M'?'남자':'여자'} 신인선수 드래프트 신청자 명단`;
  const spans=new Map();
  for(let i=0;i<rows.length;){let j=i+1;while(j<rows.length&&rows[j].affiliation===rows[i].affiliation)j++;spans.set(i,j-i);i=j;}
  return `<p class="da-roster-scroll-hint">표를 좌우로 밀어 생년월일·신장·체중·출신학교를 확인하세요.</p><div class="da-roster-wrap" role="region" aria-label="공식 참가 신청자 명단, 가로 스크롤 가능" tabindex="0"><table class="da-official-roster"><caption><span>${e(title)}</span></caption><colgroup>${[70,44,136,54,134,116,76,76,134,98].map(w=>`<col style="width:${w}px">`).join('')}</colgroup><thead><tr>${['구분','순','소속','학년','성명','생년월일','신장','체중','출신학교','포지션'].map((label,i)=>`<th scope="col"${i===4?' class="da-roster-name"':''}>${label}${i===6?'<small>cm</small>':i===7?'<small>kg</small>':''}</th>`).join('')}</tr></thead><tbody>${rows.map((p,i)=>`<tr data-applicant="${e(p.applicant_id)}" class="${highlightedApplicant(p)?'da-roster-highlight':''}">${i===0?`<th class="da-roster-category" scope="rowgroup" rowspan="${rows.length}">신청자<br>(${rows.length}명)</th>`:''}<td class="da-roster-order">${p.source_order}</td>${spans.has(i)?`<th class="da-roster-school ${highlightedApplicant(p)&&p.category!=='university'?'da-roster-fact':''}" scope="rowgroup" rowspan="${spans.get(i)}">${e(p.affiliation||'미확인')}</th>`:''}<td class="da-roster-fact">${p.grade??'—'}</td><td class="da-roster-fact da-roster-name">${nameControl(p)}</td><td class="da-roster-fact da-roster-num">${e(p.birth_date?.replaceAll('-','.')||'미확인')}</td><td class="da-roster-fact da-roster-num">${p.height_cm??'미확인'}</td><td class="da-roster-fact da-roster-num">${p.weight_kg??'미확인'}</td><td class="da-roster-fact">${e(p.previous_school||'미확인')}</td><td class="da-roster-fact">${e(p.positions.join(', ')||'미확인')}</td></tr>`).join('')}</tbody></table></div><p class="da-roster-legend"><span aria-hidden="true"></span>음영처리된 선수는 고3, 대학 1·2·3학년, 실업, 해외활동 후 귀국 선수입니다. 신체 정보와 출신학교는 신청 당시 공식 명단 기준입니다.</p>`;
}
