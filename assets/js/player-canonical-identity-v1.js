(()=>{
  const id=new URLSearchParams(location.search).get('id')||'';
  if(!id)return;
  const LINK_URL='data/national/player_id_links_v1.json';
  let canonical=null;
  let done=false;
  const apply=()=>{
    if(!canonical||done)return done;
    const area=document.getElementById('playerArea');
    const title=area?.querySelector('.pd-title');
    if(!title)return false;
    const name=String(canonical.name_ko||'').trim();
    const birth=String(canonical.birth_date||'').trim();
    if(name){
      title.textContent=name;
      document.title=`${name} | K-Volley Lab`;
      const crumb=area.querySelector('.pd-breadcrumb strong');
      if(crumb)crumb.textContent=name;
      area.querySelectorAll('[data-compare-id]').forEach(el=>{
        if(el.dataset.compareId===id)el.dataset.compareName=name;
      });
    }
    if(birth){
      [...area.querySelectorAll('.pd-info-item')].forEach(item=>{
        if(item.querySelector('span')?.textContent.trim()==='생년월일'){
          const strong=item.querySelector('strong');
          if(strong)strong.textContent=birth;
        }
      });
    }
    done=true;
    return true;
  };
  fetch(LINK_URL,{cache:'no-store'})
    .then(r=>r.ok?r.json():{links:[]})
    .then(data=>{
      canonical=(data.links||[]).find(x=>x.player_id===id)||null;
      if(!canonical)return;
      if(apply())return;
      const root=document.getElementById('playerArea');
      if(!root)return;
      const observer=new MutationObserver(()=>{if(apply())observer.disconnect()});
      observer.observe(root,{childList:true,subtree:true});
      setTimeout(()=>observer.disconnect(),6000);
    })
    .catch(err=>console.warn('Verified player identity overlay skipped',err));
})();
