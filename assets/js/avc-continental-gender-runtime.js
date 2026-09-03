(()=>{
  const path=(location.pathname.split('/').pop()||'').toLowerCase();
  const pages={
    'international-competition-avc-men-continental-2026.html':'men',
    'international-competition-avc-women-continental-2026.html':'women'
  };
  const current=pages[path];
  if(!current)return;
  const apply=()=>{
    const hero=document.querySelector('.avc-hero');
    if(!hero||document.querySelector('.avc-gender-switch-runtime'))return;
    if(!document.getElementById('avcGenderSwitchStyle')){
      const style=document.createElement('style');
      style.id='avcGenderSwitchStyle';
      style.textContent=`.avc-gender-switch-runtime{display:flex;align-items:center;justify-content:space-between;gap:14px;margin:16px 0 0;padding:11px 13px;border:1px solid #dfe8e3;border-radius:16px;background:#fff;box-shadow:0 5px 16px rgba(15,61,46,.04)}.avc-gender-switch-runtime .label{color:#708078;font-size:11px;font-weight:900;letter-spacing:.08em}.avc-gender-switch-runtime .tabs{display:flex;gap:7px}.avc-gender-switch-runtime a{min-width:92px;padding:9px 16px;border:1px solid #d8e5dd;border-radius:11px;background:#f8fbf9;color:#536477;font-size:13px;font-weight:900;text-align:center;text-decoration:none}.avc-gender-switch-runtime a:hover{border-color:#88b99a;color:#155c34}.avc-gender-switch-runtime a.is-active{border-color:#166534;background:#166534;color:#fff}.avc-gender-switch-runtime a[data-gender="women"].is-active{border-color:#8a3754;background:#8a3754}@media(max-width:680px){.avc-gender-switch-runtime{align-items:flex-start;flex-direction:column}.avc-gender-switch-runtime .tabs{width:100%}.avc-gender-switch-runtime a{flex:1;min-width:0}}`;
      document.head.appendChild(style);
    }
    const nav=document.createElement('nav');
    nav.className='avc-gender-switch-runtime';
    nav.setAttribute('aria-label','AVC 대륙선수권 성별 전환');
    nav.innerHTML=`<span class="label">AVC CONTINENTAL 2026</span><span class="tabs"><a data-gender="men" class="${current==='men'?'is-active':''}" href="international-competition-avc-men-continental-2026.html">MEN · 남자부</a><a data-gender="women" class="${current==='women'?'is-active':''}" href="international-competition-avc-women-continental-2026.html">WOMEN · 여자부</a></span>`;
    hero.insertAdjacentElement('afterend',nav);
  };
  if(document.readyState==='loading')addEventListener('DOMContentLoaded',apply,{once:true});else apply();
})();