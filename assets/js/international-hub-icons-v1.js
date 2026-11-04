// Original KVL category artwork. No federation, host-city or season logo assets.
// Shared 64px canvas, 2.2px stroke and volleyball construction; safe to reuse by year.
const volleyball=(x,y,r)=>`<g transform="translate(${x} ${y}) scale(${r/12})"><circle r="12" fill="white"/><path d="M0-12c-3 5-2 10 3 13M-10.4 6c6 0 10-3 11.5-8M10.4 6C7 1 2-1-3-1M-7-9.7c-2 6-1 11 4 16M-4.9 11c6-1 10-4 12-10M11.9-1c-4-5-9-7-15-6"/></g>`;
const drawings={
 'olympic':`<path d="m25 40-4 17 11-6 11 6-4-17" fill="#edf2f7"/><circle cx="32" cy="26" r="17" fill="#edf2f7"/>${volleyball(32,26,12)}<path d="M18 47C6 41 5 27 10 18M46 47c12-6 13-20 8-29"/><path d="M12 39c-6 0-8-4-8-7 5 0 8 2 8 7Zm-4-11c-5-1-6-5-5-8 5 2 6 4 5 8Zm6 15c-4 1-7 0-9-3m47-1c6 0 8-4 8-7-5 0-8 2-8 7Zm4-11c5-1 6-5 5-8-5 2-6 4-5 8Zm-6 15c4 1 7 0 9-3"/>`,
 'world-championship':`<circle cx="28" cy="28" r="22" fill="#edf2f7"/><ellipse cx="28" cy="28" rx="10" ry="22"/><path d="M6 28h44M10 16h36M10 40h23M28 6v44"/>${volleyball(44,44,14)}`,
 'vnl':`<path d="M9 25v27m46-27v27M9 28h46M9 46h46"/><path d="M17 28v18m10-18v18m10-18v18m10-18v18M9 37h46" stroke-opacity=".5"/><path d="m12 18 8-6m-3 11 7-5"/>${volleyball(42,16,12)}<rect x="20" y="47" width="24" height="15" rx="4" fill="currentColor" stroke="none"/><text x="32" y="58" fill="white" stroke="none" font-family="Arial,sans-serif" font-size="10" font-weight="800" text-anchor="middle">VNL</text>`,
 'continental':`<circle cx="28" cy="28" r="22" fill="#edf2f7"/><path d="m12 11 10 2 3 7-5 6-10-1-3-6m5 10 8 2 5 6-4 10m13-39-4 8 6 6 7-4 6 9m-19 0 6 5-3 10-6 4-5-9Z" fill="white"/><path d="m40 7 11 4 6 10M51 7v4h5" stroke-opacity=".55"/>${volleyball(45,44,14)}`,
 'asian-games':`<circle cx="32" cy="27" r="18" fill="#edf2f7"/><path d="M32 3v3m12 0-2 3m11 6-3 2m7 10h-3M20 6l2 3m-11 6 3 2M7 27h3M12 39l3-2m37 2-3-2"/>${volleyball(32,27,12)}<path d="M22 58V46h20v12M11 58v-7h11m20 0h11v7M8 59h48" fill="#edf2f7"/><path d="M32 50v5"/>`,
 'multi-sport':`<path d="M18 35c-8-12 2-18 4-26 2 4 5 5 5 5 0-7 5-10 9-12-1 8 8 10 10 18 2-1 3-4 3-6 8 11 5 18-2 23" fill="#edf2f7"/>${volleyball(32,26,12)}<path d="M17 40h30l-6 8H23ZM26 48l3 13h6l3-13" fill="#edf2f7"/><path d="m8 42 3 3m45-3-3 3"/>`
};
export function categoryIcon(category){
 return `<svg class="hub-category-art" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${drawings[category]||''}</svg>`;
}
