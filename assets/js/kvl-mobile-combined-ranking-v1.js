/* K-Volley Lab shared mobile combined ranking v1
   One renderer for every competition page. Only state/data vary by tournament. */
(function(){
  'use strict';
  const STYLE_ID = 'kvl-mobile-combined-ranking-v1-css';
  const STYLE_HREF = 'assets/css/kvl-mobile-combined-ranking-v1.css?v=20260908-1';
  const QF_STYLE_ID = 'kvl-mobile-qf-alignment-v1-css';
  const QF_STYLE_HREF = 'assets/css/kvl-mobile-qf-alignment-v1.css?v=20260908-2';
  const QF_INLINE_STYLE_ID = 'kvl-mobile-qf-alignment-v1-inline';
  const QF_CRITICAL_CSS = '@media(max-width:680px){html body[data-avc-gender] .avc-main #knockout .kvl-comp-qf-projection{display:grid!important;grid-template-columns:minmax(0,1fr) 22px minmax(0,1fr)!important;align-items:center!important;gap:3px!important;min-height:64px!important;padding:10px 6px!important;box-sizing:border-box!important}html body[data-avc-gender] .avc-main #knockout .kvl-comp-qf-side{display:grid!important;width:100%!important;min-width:0!important;min-height:44px!important;align-items:center!important;column-gap:4px!important;box-sizing:border-box!important}html body[data-avc-gender] .avc-main #knockout .kvl-comp-qf-side.is-left{grid-template-columns:minmax(0,1fr) 54px!important}html body[data-avc-gender] .avc-main #knockout .kvl-comp-qf-side.is-right{grid-template-columns:54px minmax(0,1fr)!important}html body[data-avc-gender] .avc-main #knockout .kvl-comp-qf-identity{display:flex!important;width:100%!important;min-width:0!important;min-height:26px!important;align-items:center!important;gap:4px!important;overflow:visible!important}html body[data-avc-gender] .avc-main #knockout .kvl-comp-qf-side.is-left .kvl-comp-qf-identity{grid-column:1!important;justify-content:flex-start!important;text-align:left!important}html body[data-avc-gender] .avc-main #knockout .kvl-comp-qf-side.is-right .kvl-comp-qf-identity{grid-column:2!important;justify-content:flex-end!important;text-align:right!important}html body[data-avc-gender] .avc-main #knockout .kvl-comp-qf-identity img{display:block!important;flex:0 0 34px!important;width:34px!important;height:24px!important;margin:0!important;object-fit:contain!important;background:#fff!important}html body[data-avc-gender] .avc-main #knockout .kvl-comp-qf-identity strong{display:block!important;min-width:0!important;margin:0!important;font-size:12px!important;font-weight:950!important;line-height:1.15!important;letter-spacing:-.05em!important;white-space:nowrap!important}html body[data-avc-gender] .avc-main #knockout .kvl-comp-qf-meta{display:grid!important;grid-template-rows:12px 12px!important;box-sizing:border-box!important;width:54px!important;min-width:54px!important;max-width:54px!important;min-height:27px!important;align-content:center!important;row-gap:2px!important;line-height:1!important;white-space:nowrap!important}html body[data-avc-gender] .avc-main #knockout .kvl-comp-qf-side.is-left .kvl-comp-qf-meta{grid-column:2!important;justify-self:end!important;text-align:right!important}html body[data-avc-gender] .avc-main #knockout .kvl-comp-qf-side.is-right .kvl-comp-qf-meta{grid-column:1!important;justify-self:start!important;text-align:left!important}html body[data-avc-gender] .avc-main #knockout .kvl-comp-qf-status,html body[data-avc-gender] .avc-main #knockout .kvl-comp-qf-seedline{display:block!important;width:54px!important;margin:0!important;padding:0!important;font-size:8.5px!important;line-height:12px!important;white-space:nowrap!important}html body[data-avc-gender] .avc-main #knockout .kvl-comp-qf-vs{display:block!important;width:22px!important;margin:0!important;justify-self:center!important;align-self:center!important;color:#4B5563!important;font-size:10px!important;font-weight:1000!important;line-height:1!important;text-align:center!important}}';
  const ensureStyles = () => {
    if (!document.getElementById(STYLE_ID)) {
      const link = document.createElement('link');
      link.id = STYLE_ID;
      link.rel = 'stylesheet';
      link.href = STYLE_HREF;
      document.head.appendChild(link);
    }
    if (!document.getElementById(QF_STYLE_ID)) {
      const qf = document.createElement('link');
      qf.id = QF_STYLE_ID;
      qf.rel = 'stylesheet';
      qf.href = QF_STYLE_HREF;
      document.head.appendChild(qf);
    }
    if (!document.getElementById(QF_INLINE_STYLE_ID)) {
      const style = document.createElement('style');
      style.id = QF_INLINE_STYLE_ID;
      style.textContent = QF_CRITICAL_CSS;
      document.head.appendChild(style);
    }
  };
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const flagCell = row => `<span class="kvl-shared-combined-flag kvl-comp-flag-cell">${row.flag ? `<img src="${esc(row.flag)}" alt="${esc(row.team)} 국기" loading="lazy">` : ''}</span>`;
  const resultCell = row => {
    const result = row.result || {};
    if (!result.label) return '<span class="kvl-shared-combined-result"></span>';
    return `<span class="kvl-shared-combined-result${result.out ? ' is-out' : ''}"><b>${esc(result.label)}</b>${result.detail ? `<small>${esc(result.detail)}</small>` : ''}</span>`;
  };
  const headerCell = label => `<span role="columnheader">${label}</span>`;
  function render(root, options){
    if (!root) return;
    ensureStyles();
    const opts = options || {};
    const complete = opts.state === 'complete';
    const rows = Array.isArray(opts.rows) ? opts.rows : [];
    const identityHead = '<span class="kvl-shared-combined-identity is-head-identity" role="presentation"><span role="columnheader" class="kvl-shared-combined-rank-head">종합순위</span><span role="columnheader" class="kvl-shared-combined-country-head" aria-label="국기 및 국가">국가</span></span>';
    const trailingHead = complete
      ? [headerCell('결과'),headerCell('승리 경기수'),headerCell('승점'),headerCell('세트 득실률'),headerCell('득점 득실률'),headerCell('조순위')].join('')
      : [headerCell('조순위'),headerCell('승리 경기수'),headerCell('승점'),headerCell('세트 득실률'),headerCell('득점 득실률')].join('');
    const header = `<div class="kvl-shared-combined-line is-head" role="row">${identityHead}${trailingHead}</div>`;
    const body = rows.map(row => {
      const common = `<span class="kvl-shared-combined-identity"><span class="kvl-shared-combined-rank">${esc(row.rank)}위</span>${flagCell(row)}<strong class="kvl-shared-combined-team">${esc(row.team)}</strong></span>`;
      const stats = `<span class="kvl-shared-combined-stat">${esc(row.wins)}승</span><span class="kvl-shared-combined-stat">${esc(row.points)}</span><span class="kvl-shared-combined-stat">${esc(row.setRatio)}</span><span class="kvl-shared-combined-stat">${esc(row.pointRatio)}</span>`;
      const cells = complete
        ? `${common}${resultCell(row)}${stats}<span class="kvl-shared-combined-stat">${esc(row.poolRank)}</span>`
        : `${common}<span class="kvl-shared-combined-stat">${esc(row.poolRank)}</span>${stats}`;
      return `<div class="kvl-shared-combined-line${row.isKorea ? ' is-korea' : ''}" role="row">${cells}</div>`;
    }).join('');
    root.innerHTML = `<div class="kvl-shared-combined-table ${complete ? 'is-complete' : 'is-live'}" role="table" aria-label="예선 종합순위" data-kvl-common-component="combined-ranking-v1" data-state="${complete ? 'complete' : 'live'}">${header}${body}</div>`;
  }
  const loadRosterComponent = () => {
    if (!document.getElementById('teamRoot') || document.getElementById('kvl-competition-roster-v1-js')) return;
    const script = document.createElement('script');
    script.id = 'kvl-competition-roster-v1-js';
    script.src = 'assets/js/kvl-competition-roster-v1.js?v=20260908-3';
    script.defer = true;
    document.head.appendChild(script);
  };
  const initShared = () => { ensureStyles(); loadRosterComponent(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initShared, {once:true});
  else initShared();
  window.KVLMobileCombinedRanking = Object.freeze({version:'1.1.5', render});
})();