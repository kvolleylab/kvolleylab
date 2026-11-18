import {selectorConfig, validateContinentalResults, continentalRows} from './continental-results-model-v1.mjs';
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeURL = value => { try { const u = new URL(value, location.href); return ['https:', 'http:'].includes(u.protocol) ? u.href : ''; } catch { return ''; } };
const country = value => value ? `<strong>${esc(value.nameKo)}</strong><span class="oq-country-code">${esc(value.code)}</span>` : '<span class="oq-pending">공식 결과 확인 중</span>';
export function mountContinentalSelector(root, cycle) {
  const config = selectorConfig(cycle);
  const existing = root.querySelector('[data-quota="continental"]');
  if (!config || !existing) return;
  const olympic = esc(config.olympicLabel || cycle.name);
  const trigger = document.createElement('button');
  trigger.type = 'button'; trigger.className = existing.className + ' oq-continental-trigger'; trigger.dataset.quota = 'continental';
  trigger.setAttribute('aria-expanded', 'false'); trigger.setAttribute('aria-controls', 'oq-continental-panel');
  trigger.setAttribute('aria-label', `${existing.querySelector('h3')?.textContent || '대륙선수권'} · 우승국과 ${olympic} 출전국 보기`);
  trigger.innerHTML = existing.innerHTML.replace(/<h3>/g, '<span class="oq-quota-title">').replace(/<\/h3>/g, '</span>');
  existing.replaceWith(trigger);
  const panel = document.createElement('section');
  panel.id = 'oq-continental-panel'; panel.className = 'oq-continental-panel'; panel.hidden = true;
  panel.setAttribute('aria-labelledby', 'oq-continental-title');
  root.querySelector('.oq-quota-grid').after(panel);
  const requestedGender = new URLSearchParams(location.search).get('continental');
  let data = null, loading = false, gender = ['men', 'women'].includes(requestedGender) ? requestedGender : 'men';
  const fallback = safeURL(config.fallbackUrl);
  function header() {
    return `<div class="oq-continental-heading"><div><p class="oq-continental-eyebrow">${esc(config.year)} 대륙선수권</p><h3 id="oq-continental-title">대륙별 우승국과 ${olympic} 출전국</h3></div><div class="oq-genders" role="group" aria-label="대륙선수권 성별"><button type="button" data-continental-gender="men" aria-pressed="${gender === 'men'}">남자</button><button type="button" data-continental-gender="women" aria-pressed="${gender === 'women'}">여자</button></div></div>`;
  }
  function render() {
    const rows = continentalRows(data, gender);
    panel.dataset.gender = gender;
    panel.innerHTML = header() + `<div class="oq-continental-grid">${rows.map(({region, event, champion, qualified, separatePathway}) => `<a class="oq-continent-card" data-competition="${esc(event.id)}" href="${esc(safeURL(event.competitionLink.url))}" aria-label="${esc(event.nameKo)} · 우승 ${esc(champion?.nameKo || '확인 중')} · ${olympic} 출전권 ${esc(qualified?.nameKo || '확인 중')} · 대회 보기"><div class="oq-continent-name"><strong>${esc(region.nameKo)}</strong><span>${esc(region.id)}</span></div><div class="oq-continent-result"><span class="oq-result-label">우승국</span><span class="oq-country">${country(champion)}</span></div><div class="oq-continent-result oq-qualified"><span class="oq-result-label">${olympic} 출전국${separatePathway ? '<sup>＊</sup>' : ''}</span><span class="oq-country">${country(qualified)}</span></div><span class="oq-continent-action">대회 ${event.competitionLink.kind === 'overview' ? '안내' : '보기'} <span aria-hidden="true">→</span></span></a>`).join('')}</div><p class="oq-continental-exception"><span>＊ 북중미·카리브</span> ${esc(rows.find(r => r.separatePathway)?.event.note || '')}</p><div class="oq-continental-footer"><details class="oq-continental-sources"><summary>공식 결과·출처 보기</summary><ul>${rows.map(({event, region}) => { const ids = [...new Set([...(event.championship.sourceIds || []), ...(event.qualification.sourceIds || [])])]; return `<li><strong>${esc(region.nameKo)}</strong> ${ids.map(id => { const s = data.sources.find(source => source.id === id); return s ? `<a href="${esc(safeURL(s.url))}" target="_blank" rel="noopener noreferrer">${esc(s.title)} ↗</a>` : ''; }).join('')}</li>`; }).join('')}</ul></details><span>공식 확인 ${esc(data.checkedAt)}</span></div>`;
    panel.querySelectorAll('[data-continental-gender]').forEach(button => button.addEventListener('click', () => {
      if (gender === button.dataset.continentalGender) return;
      gender = button.dataset.continentalGender; render();
      panel.querySelector(`[data-continental-gender="${gender}"]`).focus({preventScroll:true});
    }));
  }
  async function load() {
    if (loading) return; loading = true;
    panel.innerHTML = `<h3 id="oq-continental-title">대륙별 우승국과 ${olympic} 출전국</h3><p role="status">공식 결과를 불러오고 있습니다.</p>`;
    try {
      const response = await fetch(config.dataUrl, {cache:'no-cache'});
      if (!response.ok) throw new Error('continental_response');
      const candidate = await response.json();
      if (validateContinentalResults(candidate, cycle.id).length) throw new Error('continental_data');
      data = candidate; render();
    } catch {
      panel.innerHTML = `<h3 id="oq-continental-title">대륙선수권 결과</h3><p role="status">공식 결과를 불러오지 못했습니다.</p><div class="oq-continental-retry"><button type="button">다시 불러오기</button>${fallback ? `<a href="${esc(fallback)}">기존 대륙선수권 안내 →</a>` : ''}</div>`;
      panel.querySelector('button').addEventListener('click', load);
    } finally { loading = false; }
  }
  function toggle(open) {
    panel.hidden = !open; trigger.setAttribute('aria-expanded', String(open));
    trigger.querySelector('.oq-quota-action').innerHTML = `${open ? '대륙별 결과 접기' : '우승국·출전국 보기'} <span aria-hidden="true">${open ? '⌃' : '⌄'}</span>`;
    if (open && !data && !loading) load();
  }
  trigger.addEventListener('click', () => toggle(panel.hidden));
  panel.addEventListener('keydown', event => { if (event.key === 'Escape') { toggle(false); trigger.focus(); } });
  toggle(['men', 'women'].includes(requestedGender));
}
