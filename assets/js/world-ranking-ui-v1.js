import {rankingView,validateRanking} from './world-ranking-model-v1.mjs';
import {esc,json,safeURL,genderLabel} from './world-cup-ui-v1.js';
export {esc,genderLabel};
export async function loadRanking(cycle) {
 const [data,cup,continental]=await Promise.all([json(cycle.rankingOverview.dataUrl),json(cycle.worldCupOverview.dataUrl),json(cycle.continentalOverview.dataUrl)]);
 if(validateRanking(data,cycle,cup,continental).length)throw Error('ranking_data');
 return {data,cycle,cup,continental};
}
export const rankingGenders=gender=>`<div class="wr-genders" role="group" aria-label="세계랭킹 출전권 성별"><button type="button" data-ranking-gender="men" aria-pressed="${gender==='men'}">남자</button><button type="button" data-ranking-gender="women" aria-pressed="${gender==='women'}">여자</button></div>`;
export const cutoffLabel=event=>event.cutoff.date.replaceAll('-','.')+(event.cutoff.status==='date_tbc'?' · 잠정':'');
function sourcesHTML(data){return data.sources.map(s=>`<a href="${esc(safeURL(s.url))}" target="_blank" rel="noopener noreferrer">${esc(s.title)}</a>`).join('');}
export function rankingHTML(bundle,gender,{detail=false}={}) {
 const {data,cycle,cup,continental}=bundle,view=rankingView(data,cycle,cup,continental,gender),name=genderLabel(gender);
 return `<div class="wr-heading"><div><p class="wr-eyebrow">${data.year} FIVB 세계랭킹</p><h${detail?'2':'3'} id="oq-ranking-title">LA28 마지막 출전권 ${view.quota}장</h${detail?'2':'3'}></div>${rankingGenders(gender)}</div>
 <div class="wr-cutoff"><span>${name} 기준일</span><strong>${cutoffLabel(view.event)}</strong><span>VNL 예선 종료 시점</span></div>
 <div class="wr-korea"><strong>대한민국 ${name}대표팀</strong><span class="${view.koreaQualified?'is-qualified':''}">${view.koreaQualified?'LA28 출전권 확보':'LA28 출전권 아직 미확보'}</span>${view.koreaWorldCup?'<span>2027 월드컵 출전 확정</span>':''}</div>
 <ol class="wr-priority">${data.priority.map(p=>`<li><strong>${esc(p.title)}</strong><span>${esc(p.text)}</span></li>`).join('')}</ol>
 <div class="wr-slots" aria-label="세계랭킹을 통한 LA28 출전권 획득국">${view.slots.map(s=>`<div class="wr-slot${s.team?' is-qualified':''}"><span><i aria-hidden="true"></i>출전권 ${s.number}</span><strong>${s.team?esc(s.team.nameKo):'결과 미확정'}</strong></div>`).join('')}</div>
 <p class="wr-note">${esc(data.rankingNote)}</p>
 ${detail?'':`<a class="wr-detail-link" href="fivb-world-ranking-la28-2028.html?gender=${gender}">랭킹 출전 경로 자세히 보기</a>`}
 <details class="wr-prior"><summary>이미 LA28 출전권을 확보한 ${view.previous.length}개국</summary><div class="wr-prior-teams">${view.previous.map(t=>`<span><strong>${esc(t.nameKo)}</strong><small>${esc(t.route)}</small></span>`).join('')}</div><p>이 국가들은 세계랭킹 출전권 배정에서 제외됩니다. 월드컵 출전권 확정 후 해당 국가도 함께 제외합니다.</p></details>
 ${detail?`<div class="wr-links"><a href="${esc(safeURL(view.event.officialRankingUrl))}" target="_blank" rel="noopener noreferrer">공식 ${name} 세계랭킹 보기</a><a href="fivb-world-ranking-events.html">세계랭킹 반영 대회 보기</a><a href="fivb-world-cup-2027.html?gender=${gender}">2027 월드컵 보기</a><a href="continental-championships-2026.html?gender=${gender}">2026 대륙선수권 보기</a></div><p class="wr-note">기준일·출전권 배정은 공식 규정에 따릅니다.${view.event.cutoff.status==='date_tbc'?' 여자 기준일은 공식 문서에서 잠정(TBC)으로 안내하고 있습니다.':''}</p>`:''}
 <div class="wr-footer"><details class="wr-sources"><summary>공식 출처 보기</summary>${sourcesHTML(data)}</details><span>규정 확인 ${esc(data.checkedAt)}</span></div>`;
}
