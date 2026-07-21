(()=>{
  const apply=()=>{
    document.querySelectorAll('.md-set-row').forEach(row=>{
      const scores=[...row.querySelectorAll('strong')];
      if(scores.length<2)return;
      scores.forEach(s=>s.classList.remove('md-set-winner'));
      const a=Number(scores[0].textContent.trim());
      const b=Number(scores[1].textContent.trim());
      if(!Number.isFinite(a)||!Number.isFinite(b)||a===b)return;
      scores[a>b?0:1].classList.add('md-set-winner');
    });
  };
  if(!apply()){}
  const area=document.getElementById('matchArea');
  if(area)new MutationObserver(apply).observe(area,{childList:true,subtree:true});
  document.addEventListener('DOMContentLoaded',apply,{once:true});
})();
