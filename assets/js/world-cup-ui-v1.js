import {worldCupView,validateWorldCup} from './world-cup-model-v1.mjs';
export const esc = value => String(value ?? '').replace(/[&<>"']/g,c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const safeURL = value => {try {const u = new URL(value,location.href);return ['https:','http:'].includes(u.protocol) ? u.href : '';}catch{return '';}};
export async function json(url) {const r = await fetch(url,{cache:'no-cache'});if(!r.ok) throw new Error('world_cup_response');return r.json();}
export async function loadWorldCup(cycle) {
  const [data,continental] = await Promise.all([json(cycle.worldCupOverview.dataUrl),json(cycle.continentalOverview.dataUrl)]);
  if (validateWorldCup(data,cycle,continental).length) throw new Error('world_cup_data');
  return {data,cycle,continental};
}
export const genderLabel = gender => gender === 'women' ? '여자' : '남자';
export const dateLabel = event => `${event.startDate.replaceAll('-','.')} — ${event.endDate.slice(5).replaceAll('-','.')}`;
export function flag(team) {return `<img class="wc-flag" src="https://flagcdn.com/w40/${esc(team.flagIso2)}.png" width="22" height="15" alt="" loading="lazy">`;}
export function genders(gender,attribute) {return `<div class="wc-genders" role="group" aria-label="월드컵 성별"><button type="button" ${attribute}="men" aria-pressed="${gender === 'men'}">남자</button><button type="button" ${attribute}="women" aria-pressed="${gender === 'women'}">여자</button></div>`;}
export function slotsHTML(view) {return `<div class="wc-slots" aria-label="월드컵을 통한 LA28 출전권 획득국">${view.slots.map(slot => `<div class="wc-slot${slot.team?' is-awarded':''}"><span class="wc-slot-label"><i aria-hidden="true"></i>출전권 ${slot.number}</span><strong>${slot.team ? flag(slot.team)+esc(slot.team.nameKo) : '결과 미확정'}</strong></div>`).join('')}</div>`;}
export function koreaHTML(view) {return `<div class="wc-korea"><strong>대한민국 ${genderLabel(view.event.gender)}대표팀</strong><span class="wc-confirmed">월드컵 출전 확정</span><span>${view.koreaOlympicQualified?'LA28 출전권 확보':'LA28 출전권 아직 미확보'}</span></div><p class="wc-korea-route">참가 경로 · ${esc(view.event.korea.routeLabel)}</p>`;}
export function priorHTML(view) {return `<details class="wc-prior"><summary>이미 LA28 출전권을 확보한 ${view.previous.length}개국</summary><div class="wc-prior-teams">${view.previous.map(t => `<span>${flag(t)}${esc(t.nameKo)}</span>`).join('')}</div><p>월드컵에는 참가하지만, 이번 ${view.quota}장 배정 대상에서는 제외됩니다.</p></details>`;}
export function sourceLinks(data, ids) {return data.sources.filter(s => ids.includes(s.id)).map(s => `<a href="${esc(safeURL(s.url))}" target="_blank" rel="noopener noreferrer">${esc(s.title)} ↗</a>`).join('');}
export function drawLabel(view) {return view.event.draw.status === 'completed' ? `조 편성 확정 · 대한민국 ${view.koreaPool?.id || ''}조` : `조 추첨 ${view.event.draw.date.replaceAll('-','.')} 예정`;}
export function quickHTML(bundle,gender) {
  const {data,cycle,continental} = bundle, view = worldCupView(data,cycle,continental,gender);
  return `<div class="wc-heading"><div><p class="wc-eyebrow">2027 FIVB 월드컵</p><h3 id="oq-world-cup-title">LA28 출전권 ${view.quota}장</h3></div>${genders(gender,'data-world-cup-gender')}</div><div class="wc-event-meta"><strong>${esc(view.event.hosts.join('·'))}</strong><span>${dateLabel(view.event)}</span><span>${view.event.participantCount}개국 참가</span></div>${koreaHTML(view)}<p class="wc-rule">${esc(data.ruleText)}</p>${slotsHTML(view)}<div class="wc-next"><span>${esc(drawLabel(view))}</span><a class="wc-detail-link" href="fivb-world-cup-2027.html?gender=${gender}">월드컵 대회 보기 <span aria-hidden="true">→</span></a></div>${priorHTML(view)}<div class="wc-footer"><details class="wc-sources"><summary>공식 출처 보기</summary>${sourceLinks(data,[...view.event.metadataSourceIds,...view.event.draw.sourceIds,'qualification-system','la28-'+gender])}</details><span>확인 ${esc(data.checkedAt)}</span></div>`;
}
