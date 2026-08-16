(()=>{
  const params=new URLSearchParams(location.search);
  const competition=(params.get('competition')||'').toLowerCase();
  if(!['avc-men-cup-2026','avc-men-cup','kvl-comp-000003'].includes(competition))return;
  const country=(params.get('country')||'대한민국').trim().toLowerCase();
  const iso2={AUS:'au',BRN:'bh',TPE:'tw',IND:'in',INA:'id',KAZ:'kz',KOR:'kr',NZL:'nz',OMA:'om',QAT:'qa',THA:'th'};
  fetch('data/competition/avc-men-cup-2026-men-participants.json',{cache:'no-store'})
    .then(r=>r.ok?r.json():Promise.reject(new Error('participants')))
    .then(data=>{
      const p=(data.participants||[]).find(x=>[x.country,x.country_ko,x.participant_id,String(x.volleyball_world_team_id)].some(v=>String(v??'').trim().toLowerCase()===country));
      if(!p||!iso2[p.code])return;
      const hero=document.getElementById('ntRosterHero');
      if(!hero)return;
      const apply=()=>{
        const h1=hero.querySelector('h1');
        if(!h1||hero.querySelector('.ntroster-country-flag'))return false;
        const wrap=document.createElement('div');
        wrap.className='ntroster-country-title';
        const img=document.createElement('img');
        img.className='ntroster-country-flag';
        img.src=`https://flagcdn.com/w80/${iso2[p.code]}.png`;
        img.alt=`${p.country_ko} 국기`;
        img.width=58;img.height=39;
        h1.parentNode.insertBefore(wrap,h1);
        wrap.append(img,h1);
        return true;
      };
      if(apply())return;
      const observer=new MutationObserver(()=>{if(apply())observer.disconnect();});
      observer.observe(hero,{childList:true,subtree:true});
      setTimeout(()=>observer.disconnect(),5000);
    }).catch(()=>{});
})();