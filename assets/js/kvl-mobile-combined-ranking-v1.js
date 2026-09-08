/* K-Volley Lab shared mobile combined ranking v1
   One renderer for every competition page. Only state/data vary by tournament. */
(function(){
  'use strict';
  const STYLE_ID = 'kvl-mobile-combined-ranking-v1-css';
  const STYLE_HREF = 'assets/css/kvl-mobile-combined-ranking-v1.css?v=20260908-1';
  const ensureStyles = () => {
    if (document.getElementById(STYLE_ID)) return;
    const link = document.createElement('link');
    link.id = STYLE_ID;
    link.rel = 'stylesheet';
    link.href = STYLE_HREF;
    document.head.appendChild(link);
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
  window.KVLMobileCombinedRanking = Object.freeze({version:'1.1.1', render});
})();
