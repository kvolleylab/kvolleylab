(()=>{
  const STYLE_ID='kvl-set-winner-highlight-style';
  if(!document.getElementById(STYLE_ID)){
    const style=document.createElement('style');
    style.id=STYLE_ID;
    style.textContent=`
      .md-set-row strong.kvl-set-winner{
        color:#C62828!important;
        font-weight:800!important;
      }
      @media print{
        .md-set-row strong.kvl-set-winner{
          color:#C62828!important;
          -webkit-print-color-adjust:exact;
          print-color-adjust:exact;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function apply(root=document){
    root.querySelectorAll?.('.md-set-row').forEach(row=>{
      const scores=[...row.querySelectorAll('strong')];
      if(scores.length<2)return;
      scores.forEach(el=>el.classList.remove('kvl-set-winner'));
      const home=Number(scores[0].textContent.trim());
      const away=Number(scores[1].textContent.trim());
      if(!Number.isFinite(home)||!Number.isFinite(away)||home===away)return;
      (home>away?scores[0]:scores[1]).classList.add('kvl-set-winner');
    });
  }

  apply();
  const target=document.getElementById('matchArea')||document.body;
  new MutationObserver(()=>apply(target)).observe(target,{childList:true,subtree:true});
})();
