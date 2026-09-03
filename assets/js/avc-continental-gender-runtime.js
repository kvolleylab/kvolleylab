(()=>{
  const path=(location.pathname.split('/').pop()||'').toLowerCase();
  const pages={
    'international-competition-avc-men-continental-2026.html':'men',
    'international-competition-avc-women-continental-2026.html':'women',
    'international-competition-avc-continental-2026.html':'hub'
  };
  const current=pages[path];
  if(!current)return;

  const ensureStyle=()=>{
    if(document.getElementById('avcGenderSwitchStyle'))return;
    const style=document.createElement('style');
    style.id='avcGenderSwitchStyle';
    style.textContent=`
      :root{
        --kvl-women-primary:#D2648F;
        --kvl-women-dark:#A43F68;
        --kvl-women-soft:#FFF2F7;
        --kvl-women-soft-2:#FFF8FB;
        --kvl-women-line:#EDBED0;
        --kvl-women-gold:#FFE4A3;
        --kvl-women-name:#17365D;
      }
      .avc-gender-switch-runtime{display:flex;align-items:center;justify-content:space-between;gap:14px;margin:16px 0 0;padding:11px 13px;border:1px solid #dfe8e3;border-radius:16px;background:#fff;box-shadow:0 5px 16px rgba(15,61,46,.04)}
      .avc-gender-switch-runtime .label{color:#708078;font-size:11px;font-weight:900;letter-spacing:.08em}
      .avc-gender-switch-runtime .tabs{display:flex;gap:7px}
      .avc-gender-switch-runtime a{min-width:92px;padding:9px 16px;border:1px solid #d8e5dd;border-radius:11px;background:#f8fbf9;color:#536477;font-size:13px;font-weight:900;text-align:center;text-decoration:none}
      .avc-gender-switch-runtime a:hover{border-color:#88b99a;color:#155c34}
      .avc-gender-switch-runtime a.is-active{border-color:#166534;background:#166534;color:#fff}
      .avc-gender-switch-runtime a[data-gender="women"]:hover{border-color:var(--kvl-women-primary);background:var(--kvl-women-soft);color:var(--kvl-women-dark)}
      .avc-gender-switch-runtime a[data-gender="women"].is-active{border-color:var(--kvl-women-primary);background:var(--kvl-women-primary);color:#fff}

      /* Tournament snapshot: keep numeric unit directly beside the number, matching the compact competition KPI style. */
      body[data-avc-gender="men"] .avc-kpis strong{display:inline-block!important;margin:10px 0 0!important}
      body[data-avc-gender="men"] .avc-kpis small{display:inline-block!important;margin-left:3px!important;vertical-align:baseline!important}

      /* AVC WOMEN uses the same Soft Rose palette as domestic/university women's competition views. */
      body[data-avc-gender="women"]{
        --avc-primary:var(--kvl-women-primary);
        --avc-dark:var(--kvl-women-dark);
        --avc-light:#DB749B;
        --avc-accent:var(--kvl-women-primary);
        --avc-gold:var(--kvl-women-gold);
        --avc-gold-soft:var(--kvl-women-gold);
        --avc-line:var(--kvl-women-line);
        --avc-soft:var(--kvl-women-soft-2);
      }
      body[data-avc-gender="women"] .avc-hero{border-color:var(--kvl-women-line)!important;background:linear-gradient(135deg,var(--kvl-women-dark),var(--kvl-women-primary))!important;box-shadow:0 18px 42px rgba(164,63,104,.18)!important}
      body[data-avc-gender="women"] .avc-hero .eyebrow,body[data-avc-gender="women"] .avc-hero h1,body[data-avc-gender="women"] .avc-status .champion{color:var(--kvl-women-gold)!important}
      body[data-avc-gender="women"] .avc-hero h1 small{color:#FFF1F6!important}
      body[data-avc-gender="women"] .avc-meta{color:#FFF2F7!important}
      body[data-avc-gender="women"] .avc-section{border-color:var(--kvl-women-line)!important;box-shadow:0 8px 24px rgba(164,63,104,.05)!important}
      body[data-avc-gender="women"] .avc-section .eyebrow,body[data-avc-gender="women"] .avc-section h2,body[data-avc-gender="women"] .avc-combined-head h3,body[data-avc-gender="women"] .avc-bronze-title{color:var(--kvl-women-dark)!important}
      body[data-avc-gender="women"] .avc-kpis article{border-color:var(--kvl-women-line)!important;background:var(--kvl-women-soft-2)!important}
      body[data-avc-gender="women"] .avc-kpis strong{color:var(--kvl-women-dark)!important}
      body[data-avc-gender="women"] .avc-note{border-left-color:var(--kvl-women-primary)!important;background:var(--kvl-women-soft)!important;color:#5F4650!important}
      body[data-avc-gender="women"] .avc-rule-card{border-color:var(--kvl-women-line)!important;background:linear-gradient(180deg,#fff,var(--kvl-women-soft-2))!important}
      body[data-avc-gender="women"] .avc-podium-card{border-color:var(--kvl-women-line)!important;background:var(--kvl-women-soft-2)!important}
      body[data-avc-gender="women"] .avc-podium-rank{background:var(--kvl-women-soft)!important;color:var(--kvl-women-dark)!important}
      body[data-avc-gender="women"] .avc-podium-copy strong,body[data-avc-gender="women"] .avc-standing-copy strong,body[data-avc-gender="women"] .avc-combined-row strong{color:var(--kvl-women-name)!important}
      body[data-avc-gender="women"] #schedule .cd-stage-filters button:hover,body[data-avc-gender="women"] #schedule .cd-stage-filters button.is-active{border-color:var(--kvl-women-primary)!important;background:var(--kvl-women-soft)!important;color:var(--kvl-women-dark)!important}
      body[data-avc-gender="women"] #schedule .cd-date-group{border-color:var(--kvl-women-line)!important}
      body[data-avc-gender="women"] #schedule .cd-date-head{background:var(--kvl-women-soft)!important;color:var(--kvl-women-dark)!important}
      body[data-avc-gender="women"] #schedule .cd-score{color:var(--kvl-women-primary)!important}
      body[data-avc-gender="women"] .avc-set-scores span{border-color:var(--kvl-women-line)!important;background:var(--kvl-women-soft-2)!important;color:#6F5661!important}
      body[data-avc-gender="women"] .avc-winner{color:var(--kvl-women-dark)!important}
      body[data-avc-gender="women"] .avc-group-card{border-color:var(--kvl-women-line)!important}
      body[data-avc-gender="women"] .avc-group-card h3{background:var(--kvl-women-primary)!important}
      body[data-avc-gender="women"] .avc-group-card h3 span{color:#FFF2F7!important}
      body[data-avc-gender="women"] .avc-standing-row.is-korea,body[data-avc-gender="women"] .avc-combined-row.is-korea{background:var(--kvl-women-soft)!important}
      body[data-avc-gender="women"] .avc-standing-row.is-qualified{box-shadow:inset 3px 0 0 var(--kvl-women-primary)!important}
      body[data-avc-gender="women"] .avc-combined{border-color:var(--kvl-women-line)!important}
      body[data-avc-gender="women"] .avc-combined-seed{color:var(--kvl-women-dark)!important}
      body[data-avc-gender="women"] #overview .cd-cal-title,body[data-avc-gender="women"] .avc-round-title{background:var(--kvl-women-primary)!important}
      body[data-avc-gender="women"] #overview .cd-cal-week span{background:var(--kvl-women-soft)!important;color:#75505F!important}
      body[data-avc-gender="women"] #overview .cd-cal-cell.has-games{background:var(--kvl-women-soft-2)!important}
      body[data-avc-gender="women"] #overview .cd-cal-game{border-color:var(--kvl-women-line)!important;color:var(--kvl-women-name)!important}
      body[data-avc-gender="women"] #overview .cd-cal-game b{color:var(--kvl-women-primary)!important}
      body[data-avc-gender="women"] .avc-qf-pair::after,body[data-avc-gender="women"] .avc-round-sf .avc-round-body::after{border-right-color:#D99AB3!important}
      body[data-avc-gender="women"] .avc-qf-pair::before,body[data-avc-gender="women"] .avc-round-sf .avc-round-body::before,body[data-avc-gender="women"] .avc-qf-pair .avc-bracket-match::after,body[data-avc-gender="women"] .avc-round-sf .avc-bracket-match::after,body[data-avc-gender="women"] .avc-round-sf .avc-bracket-match::before,body[data-avc-gender="women"] .avc-round-final .avc-bracket-match::before{border-top-color:#D99AB3!important}
      body[data-avc-gender="women"] .avc-bracket-match{border-color:var(--kvl-women-line)!important;box-shadow:0 6px 18px rgba(164,63,104,.06)!important}
      body[data-avc-gender="women"] .avc-bracket-match-head{border-bottom-color:var(--kvl-women-line)!important;background:var(--kvl-women-soft)!important;color:#765563!important}
      body[data-avc-gender="women"] .avc-bracket-match-head strong{color:var(--kvl-women-dark)!important}
      body[data-avc-gender="women"] .avc-bracket-team.is-winner{background:var(--kvl-women-soft-2)!important}
      body[data-avc-gender="women"] .avc-bracket-team.is-winner strong,body[data-avc-gender="women"] .avc-bracket-team.is-winner b{color:var(--kvl-women-dark)!important}
      body[data-avc-gender="women"] .avc-source{border-color:var(--kvl-women-line)!important;background:var(--kvl-women-soft-2)!important}
      body[data-avc-gender="women"] .avc-source strong,body[data-avc-gender="women"] .avc-source a{color:var(--kvl-women-dark)!important}
      body[data-avc-gender="women"] .avc-gender-switch-runtime{border-color:var(--kvl-women-line)!important;box-shadow:0 5px 16px rgba(164,63,104,.04)!important}

      /* Parent hub: WOMEN card follows the same domestic Soft Rose card system. */
      body[data-avc-gender="hub"] .division-card.women{border-color:var(--kvl-women-line)!important;background:linear-gradient(180deg,#fff,var(--kvl-women-soft-2))!important;box-shadow:inset 0 3px 0 rgba(210,100,143,.16),0 8px 24px rgba(164,63,104,.06)!important}
      body[data-avc-gender="hub"] .division-card.women .tag{background:var(--kvl-women-soft)!important;color:var(--kvl-women-dark)!important}
      body[data-avc-gender="hub"] .division-card.women h2{color:var(--kvl-women-dark)!important}
      body[data-avc-gender="hub"] .division-card.women .meta span{border-color:var(--kvl-women-line)!important;background:var(--kvl-women-soft-2)!important;color:#75505F!important}
      body[data-avc-gender="hub"] .division-card.women .enter{background:var(--kvl-women-primary)!important}
      body[data-avc-gender="hub"] .division-card.women .status strong{color:var(--kvl-women-dark)!important}
      body[data-avc-gender="hub"] .gender-tabs .women:hover{border-color:var(--kvl-women-primary)!important;background:var(--kvl-women-soft)!important;color:var(--kvl-women-dark)!important}

      @media(max-width:680px){.avc-gender-switch-runtime{align-items:flex-start;flex-direction:column}.avc-gender-switch-runtime .tabs{width:100%}.avc-gender-switch-runtime a{flex:1;min-width:0}}
    `;
    document.head.appendChild(style);
  };

  const apply=()=>{
    ensureStyle();
    document.body.dataset.avcGender=current;
    if(current==='hub')return;
    const hero=document.querySelector('.avc-hero');
    if(!hero||document.querySelector('.avc-gender-switch-runtime'))return;
    const nav=document.createElement('nav');
    nav.className='avc-gender-switch-runtime';
    nav.setAttribute('aria-label','AVC 대륙선수권 성별 전환');
    nav.innerHTML=`<span class="label">AVC CONTINENTAL 2026</span><span class="tabs"><a data-gender="men" class="${current==='men'?'is-active':''}" href="international-competition-avc-men-continental-2026.html">MEN · 남자부</a><a data-gender="women" class="${current==='women'?'is-active':''}" href="international-competition-avc-women-continental-2026.html">WOMEN · 여자부</a></span>`;
    hero.insertAdjacentElement('afterend',nav);
  };

  if(document.readyState==='loading')addEventListener('DOMContentLoaded',apply,{once:true});else apply();
})();