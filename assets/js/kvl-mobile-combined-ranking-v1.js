/* K-Volley Lab shared mobile combined ranking v1
   One renderer for every competition page. Only state/data vary by tournament. */
(function(){
  'use strict';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const flagCell = row => `<span class="kvl-shared-combined-flag kvl-comp-flag-cell">${row.flag ? `<img src="${esc(row.flag)}" alt="${esc(row.team)} 국기" loading="lazy">` : ''}</span>`;
  const resultCell = row => {
    const result = row.result || {};
    if (!result.label) return '<span class="kvl-shared-combined-result"></span>';
    return `<span class="kvl-shared-combined-result${result.out ? ' is-out' : ''}"><b>${esc(result.label)}</b>${result.detail ? `<small>${esc(result.detail)}</small>` : ''}</span>`;
  };
  function render(root, options){
    if (!root) return;
    const opts = options || {};
    const complete = opts.state === 'complete';
    const rows = Array.isArray(opts.rows) ? opts.rows : [];
    const head = complete
      ? ['종합순위','국기','국가','결과','승리 경기수','승점','세트 득실률','득점 득실률','조순위']
      : ['종합순위','국기','국가','조순위','승리 경기수','승점','세트 득실률','득점 득실률'];
    const header = `<div class="kvl-shared-combined-line is-head" role="row">${head.map(label => `<span role="columnheader"${label === '국기' ? ' class="kvl-shared-combined-flag-head"' : ''}>${label}</span>`).join('')}</div>`;
    const body = rows.map(row => {
      const common = `<span class="kvl-shared-combined-rank">${esc(row.rank)}위</span>${flagCell(row)}<strong class="kvl-shared-combined-team">${esc(row.team)}</strong>`;
      const stats = `<span class="kvl-shared-combined-stat">${esc(row.wins)}승</span><span class="kvl-shared-combined-stat">${esc(row.points)}</span><span class="kvl-shared-combined-stat">${esc(row.setRatio)}</span><span class="kvl-shared-combined-stat">${esc(row.pointRatio)}</span>`;
      const cells = complete
        ? `${common}${resultCell(row)}${stats}<span class="kvl-shared-combined-stat">${esc(row.poolRank)}</span>`
        : `${common}<span class="kvl-shared-combined-stat">${esc(row.poolRank)}</span>${stats}`;
      return `<div class="kvl-shared-combined-line${row.isKorea ? ' is-korea' : ''}" role="row">${cells}</div>`;
    }).join('');
    root.innerHTML = `<div class="kvl-shared-combined-table ${complete ? 'is-complete' : 'is-live'}" role="table" aria-label="예선 종합순위" data-kvl-common-component="combined-ranking-v1" data-state="${complete ? 'complete' : 'live'}">${header}${body}</div>`;
  }
  window.KVLMobileCombinedRanking = Object.freeze({version:'1.0.0', render});
})();
