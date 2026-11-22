import {resolveCycle,summaryView} from './olympic-cycle-model-v1.mjs';
import {mountContinentalSelector} from './continental-selector-v1.js';
import {mountWorldCupSelector} from './world-cup-selector-v1.js';
import {mountHostSelector} from './olympic-host-selector-v1.js';
import {mountRankingSelector} from './world-ranking-selector-v1.js';
const root=document.getElementById('olympic-summary');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const destination=s=>{const u=new URL(s.url,location.href);const internal=u.origin===location.origin||u.origin==='https://kvolleylab.com';return {href:internal?u.pathname.slice(1)+u.search+u.hash:u.href,external:!internal};};
const attributes=d=>`href="${esc(d.href)}"${d.external?' target="_blank" rel="noopener noreferrer"':''}`;
const link=s=>{const d=destination(s);return `<a ${attributes(d)}>${esc(s.title||s.label)} ${d.external?'↗':'→'}</a>`;};
function quota(q,i){
 const d=q.link?destination(q.link):null;
 const content=`<span class="oq-step">0${i+1}</span><h3>${esc(q.name)}</h3><strong class="oq-number">${q.count}<small>장</small></strong><p>${esc(q.summary)}</p>${d?`<span class="oq-quota-action">${esc(q.link.label)} <span aria-hidden="true">${d.external?'↗':'→'}</span></span>`:''}`;
 return d?`<a class="oq-quota oq-quota-link" data-quota="${esc(q.id)}" ${attributes(d)} aria-label="${esc(q.name)} ${q.count}장 · ${esc(q.link.label)}${d.external?' (새 창)':''}">${content}</a>`:`<article class="oq-quota" data-quota="${esc(q.id)}">${content}</article>`;
}
async function json(url){const r=await fetch(url,{cache:'no-cache'});if(!r.ok)throw Error('출전권 자료 응답 오류');return r.json();}
function details(c){return `<details class="oq-rules" id="qualification-rules"><summary>출전권 상세 규정 펼치기 <span aria-hidden="true">＋</span></summary><div class="oq-rules-body">${c.archiveStatus==='archived'&&c.finalOutcome?.verifiedAt?`<article><h3>${esc(c.name)} 최종 기록</h3><p>${esc(c.finalOutcome.gamesResult)}</p><p>공식 최종 결과 확인 ${esc(c.finalOutcome.verifiedAt)}</p></article>`:''}${c.rules.details.map(r=>`<article><h3>${esc(r.title)}</h3><p>${esc(r.text)}</p></article>`).join('')}${c.korea.routeStatus.length?`<h3>대한민국 남자대표팀 경로별 현황</h3><div class="oq-routes">${c.korea.routeStatus.map(r=>`<article><strong>${esc(r.name)}</strong><span>${esc(r.status)}</span><p>${esc(r.condition)}</p>${link({label:'관련 대회',url:r.url})}</article>`).join('')}</div>`:''}${c.trackingPolicy?`<p class="oq-policy">${esc(c.trackingPolicy)}</p>`:''}${c.relatedLinks.length?`<h3>대회 연결</h3><div class="oq-source-links">${c.relatedLinks.map(link).join('')}</div>`:''}<h3>공식 출처</h3><div class="oq-source-links">${c.sources.map(link).join('')}</div>${c.verificationNotes.map(n=>`<p class="oq-note">${esc(n)}</p>`).join('')}<p class="oq-note">확인 ${esc(c.checkedAt)} · 수정 ${esc(c.updatedAt)}</p></div></details>`;}
async function load(){
 try{
  const registry=await json('data/olympics/cycles_v1.json');const requested=new URLSearchParams(location.search).get('cycle');
  const entry=resolveCycle(registry,requested);const c=await json('data/olympics/'+entry.file);const view=summaryView(c);
  const status=entry.id===registry.activeCycleId?'현재 올림픽':entry.archived?'과거 올림픽':'다음 올림픽';
  const badge=view.known?`<span>남녀 각각</span> <strong>총 ${esc(view.totalPerGender)}장</strong>`:'규정 발표 전';
  root.innerHTML=`<div class="oq-overview"><div class="oq-heading"><div><p class="oq-eyebrow">올림픽 출전권</p><h2 id="oq-title">${esc(view.title)}</h2></div><span class="oq-cycle-badge" title="${esc(status)}">${badge}</span></div>${view.known?`<p class="oq-total">남녀 각각 <strong>${view.totalPerGender}개국</strong> 기준</p><div class="oq-quota-grid" aria-label="올림픽 출전권 배분">${view.allocation.map(quota).join('')}</div>`:`<div class="oq-awaiting"><strong>${esc(view.notice)}</strong><p>배정 수량과 참가 경로는 공식 발표를 확인한 뒤 안내합니다.</p></div>`}<div class="oq-korea" aria-label="대한민국 남자대표팀 출전 현황">${view.korea.map((s,i)=>`<span class="oq-korea-${i}">${esc(s)}</span>`).join('')}</div></div>${details(c)}<div class="oq-cycle-links"><details id="olympic-cycle-history"><summary>과거 올림픽 보기</summary><div>${registry.archiveIndex.length?registry.archiveIndex.map(e=>`<a href="?cycle=${encodeURIComponent(e.cycleId)}">${esc(e.label)} · 보관 기록</a>`).join(''):'<p>아직 보관된 지난 올림픽 자료가 없습니다.</p>'}${registry.cycles.map(e=>`<a href="?cycle=${encodeURIComponent(e.id)}">${esc(e.label)}${e.id===registry.activeCycleId?' · 현재 주기':e.year>c.year?' · 다음 주기':''}</a>`).join('')}</div></details><a href="national-team-history-verification.html">기록 확인 기준 ↗</a></div>`;
  root.dataset.cycle=c.id;root.dataset.rules=c.rules.status;
  mountContinentalSelector(root,c);
  mountWorldCupSelector(root,c);
  mountHostSelector(root,c);
  mountRankingSelector(root,c);
 }catch{root.innerHTML='<h2>올림픽 출전권 한눈에 보기</h2><p>출전권 자료를 불러오지 못했습니다. 아래 역사 기록은 계속 볼 수 있습니다.</p><button type="button" id="oq-retry">다시 불러오기</button>';root.querySelector('#oq-retry').addEventListener('click',load);}
}
load();
