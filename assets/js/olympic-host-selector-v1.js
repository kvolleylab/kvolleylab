import {hostOverviewView} from './olympic-host-model-v1.mjs';
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dates = period => `${period.startDate.replaceAll('-','.')}–${period.endDate.slice(5).replaceAll('-','.')}`;
export function mountHostSelector(root, cycle) {
  const view = hostOverviewView(cycle), old = root.querySelector('[data-quota="host"]');
  if (!old || !cycle.hostOverview || cycle.hostOverview.cycleId !== cycle.id) return;
  const trigger = document.createElement('button');
  trigger.type = 'button'; trigger.className = old.className + ' oq-host-trigger'; trigger.dataset.quota = 'host';
  trigger.setAttribute('aria-expanded', 'false'); trigger.setAttribute('aria-controls', 'host-country-info');
  trigger.setAttribute('aria-label', '개최국 출전권과 개최 정보 보기');
  trigger.innerHTML = old.innerHTML.replace(/<h3>/g, '<span class="oq-quota-title">').replace(/<\/h3>/g, '</span>');
  old.replaceWith(trigger);
  const panel = document.createElement('section'); panel.id = 'host-country-info'; panel.className = 'oq-host-panel'; panel.hidden = true;
  panel.setAttribute('aria-labelledby', 'oq-host-title'); root.querySelector('.oq-quota-grid').after(panel);
  panel.innerHTML = view ? `<div class="oq-host-heading"><div><p class="oq-host-eyebrow">${esc(cycle.name)}</p><h3 id="oq-host-title">${esc(view.country.nameKo)} · ${esc(view.city.nameKo)}</h3></div><span class="oq-host-confirmed">남녀 자동 출전</span></div><p class="oq-host-rule">${esc(view.country.nameKo)} 남자·여자대표팀에 <strong>각 ${view.quota}장</strong>이 배정됩니다. 남녀 각각 총 ${view.total}장에 포함됩니다.</p><dl class="oq-host-facts"><div><dt>실내배구 경기장</dt><dd>${esc(view.venue.nameKo)}<small>${esc(view.venue.cityKo)} · ${esc(view.venue.nameEn)}</small></dd></div><div><dt>배구 경기 기간</dt><dd>${dates(view.volleyball)}<small>남녀 실내배구</small></dd></div><div><dt>올림픽 개·폐막</dt><dd>${dates(view.ceremonies)}<small>현지 날짜 기준</small></dd></div></dl><p class="oq-host-note">${esc(view.history.text)} 일정·장소는 공식 발표에 따라 변경될 수 있습니다.</p><div class="oq-host-footer"><details><summary>공식 출처 보기</summary><ul>${view.sources.map(source => `<li><a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.title)}</a></li>`).join('')}</ul></details><span>확인 ${esc(view.checkedAt)}</span></div>` : '<h3 id="oq-host-title">개최국 안내</h3><p role="status">공식 개최 정보를 확인하고 있습니다.</p>';
  function toggle(open, remember = true) {
    panel.hidden = !open; trigger.setAttribute('aria-expanded', String(open));
    trigger.querySelector('.oq-quota-action').innerHTML = `${open ? '개최국 정보 접기' : '개최국 정보 보기'} <span aria-hidden="true">${open ? '⌃' : '⌄'}</span>`;
    if (remember) { const url = new URL(location.href); if (open) url.searchParams.set('host', '1'); else url.searchParams.delete('host'); history.replaceState(history.state, '', url); }
  }
  trigger.addEventListener('click', () => toggle(panel.hidden));
  panel.addEventListener('keydown', event => { if (event.key === 'Escape') { toggle(false); trigger.focus(); } });
  toggle(new URLSearchParams(location.search).get('host') === '1' || location.hash === '#host-country-info', false);
}
