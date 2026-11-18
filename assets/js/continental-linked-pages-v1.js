import {validateContinentalResults, continentalRows} from './continental-results-model-v1.mjs';
function markRoadmapNavigation() {
  const link = document.querySelector('.kvl-global-nav a[href="olympic-roadmap.html"]');
  if (!link) return false;
  link.classList.add('active'); link.setAttribute('aria-current', 'page');
  const group = link.closest('.kvl-global-group');
  group?.classList.add('open');
  const toggle = group?.querySelector('.kvl-global-group-toggle');
  toggle?.classList.add('active'); toggle?.setAttribute('aria-expanded', 'true');
  return true;
}
if (!markRoadmapNavigation()) {
  const observer = new MutationObserver(() => { if (markRoadmapNavigation()) observer.disconnect(); });
  observer.observe(document.documentElement, {childList:true, subtree:true});
}
export const escapeText = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function json(url) { const response = await fetch(url, {cache:'no-cache'}); if (!response.ok) throw new Error('continental_response'); return response.json(); }
export async function loadContinentalDirectory() {
  const data = await json('data/national/continental-championships-2026.json');
  const results = await json(data.resultsDataUrl);
  if (validateContinentalResults(results, 'la2028').length) throw new Error('continental_results');
  const rows = [...continentalRows(results, 'men'), ...continentalRows(results, 'women')];
  return {data, results, rows};
}
export function resultHTML(row) {
  const name = value => escapeText(value?.nameKo || '공식 결과 확인 중');
  return `<div class="cc26-result-row"><span>대륙선수권 우승</span><strong>${name(row.champion)}</strong></div><div class="cc26-result-row cc26-result-qualified"><span>LA28 대륙 출전권</span><strong>${name(row.qualified)}</strong></div>`;
}
export function resultSources(row, results) {
  const ids = new Set([...(row.event.championship.sourceIds || []), ...(row.event.qualification.sourceIds || [])]);
  return results.sources.filter(s => ids.has(s.id)).map(s => `<a href="${escapeText(s.url)}" target="_blank" rel="noopener noreferrer">${escapeText(s.title)} ↗</a>`).join('');
}
const lists = document.querySelectorAll('[data-continental-list]');
if (lists.length) loadContinentalDirectory().then(({data,results,rows}) => {
  for (const list of lists) {
    list.innerHTML = rows.filter(row => row.event.gender === list.dataset.continentalList).map(row => {
      const item = data.competitions.find(c => c.id === row.event.id);
      return `<a class="lq-continental-card nt-accent-card" href="${escapeText(row.event.competitionLink.url)}"><span class="conf">${escapeText(item.confederation)} · ${escapeText(item.region_ko)}</span><strong>${escapeText(item.name_ko)}</strong><p>${escapeText(item.dates)} · ${escapeText(item.host)}</p><div class="cc26-results">${resultHTML(row)}</div>${row.event.note ? `<p class="cc26-result-note">${escapeText(row.event.note)}</p>` : ''}<span class="go nt-accent-link">대회 ${row.event.competitionLink.kind === 'overview' ? '안내' : '보기'} →</span></a>`;
    }).join('');
  }
  document.getElementById('continentalResultSources').innerHTML = results.sources.map(s => `<a href="${escapeText(s.url)}" target="_blank" rel="noopener noreferrer">${escapeText(s.title)} ↗</a>`).join('');
}).catch(() => { for (const list of lists) list.innerHTML = '<p role="status">대회 결과를 불러오지 못했습니다. 페이지를 새로고침해 주세요.</p>'; });
