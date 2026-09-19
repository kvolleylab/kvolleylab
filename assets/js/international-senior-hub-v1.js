(()=> {
  const grid=document.getElementById('seniorRecentGrid');
  if(!grid)return;

  const DATA_URL='data/international/senior-competitions.json?v=20260919-1';
  const pad=n=>String(n).padStart(2,'0');
  const now=new Date();
  const today=now.getFullYear()+'-'+pad(now.getMonth()+1)+'-'+pad(now.getDate());

  const formatDate=value=>{
    const m=String(value||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return m?m[1]+'.'+m[2]+'.'+m[3]:String(value||'');
  };

  const recentSort=(a,b)=>{
    const aActive=a.startDate<=today&&today<=a.endDate;
    const bActive=b.startDate<=today&&today<=b.endDate;
    if(aActive!==bActive)return bActive-aActive;
    if(aActive)return b.startDate.localeCompare(a.startDate);
    return b.endDate.localeCompare(a.endDate);
  };

  const heroGradient=item=>
    (item.hero&&item.hero.gradient)||
    (item.hero&&item.hero.fallbackGradient)||
    'linear-gradient(112deg,#09264f,#0f5b96)';

  const renderCard=item=>{
    const active=item.startDate<=today&&today<=item.endDate;
    const card=document.createElement('a');
    card.className='senior-featured-card';
    card.href=item.href;
    card.dataset.competition=item.id;
    card.style.setProperty('--recent-gradient',heroGradient(item));
    card.style.setProperty('--recent-accent',(item.hero&&item.hero.accent)||'#fff');
    card.style.setProperty('--recent-eyebrow',(item.hero&&item.hero.eyebrow)||'#d9e9f7');

    const brand=document.createElement('span');
    brand.className='senior-featured-brand';
    brand.textContent=item.brand||'INTERNATIONAL';

    const title=document.createElement('h3');
    title.textContent=item.title||'국제대회';

    const date=document.createElement('p');
    date.className='date';
    date.textContent=formatDate(item.startDate)+' – '+formatDate(item.endDate).slice(5);

    const place=document.createElement('p');
    place.className='place';
    place.textContent=item.location||'';

    const action=document.createElement('span');
    action.className='senior-featured-action';
    action.textContent=(active?'진행 중 · 대회 보기':'대회 보기')+' →';

    card.append(brand,title,date,place,action);
    return card;
  };

  const setPhoto=async(card,hero)=>{
    if(!hero||hero.mode!=='competition-config'||!hero.config)return;
    try{
      const configRes=await fetch(hero.config,{cache:'force-cache'});
      if(!configRes.ok)throw new Error('config');
      const config=await configRes.json();
      const source=config.hero||{};
      if(Array.isArray(source.b64Chunks)&&source.b64Chunks.length){
        const parts=await Promise.all(source.b64Chunks.map(async path=>{
          const res=await fetch(path,{cache:'force-cache'});
          if(!res.ok)throw new Error('chunk');
          return (await res.text()).replace(/\s+/g,'');
        }));
        const dataUrl='data:'+(source.mimeType||'image/webp')+';base64,'+parts.join('');
        card.style.setProperty('--recent-image','url("'+dataUrl+'")');
        card.style.setProperty('--recent-position',hero.position||source.position||'center center');
        card.classList.add('has-photo');
        return;
      }
      if(source.pcImage){
        card.style.setProperty('--recent-image','url("'+source.pcImage+'")');
        card.style.setProperty('--recent-position',hero.position||source.position||'center center');
        card.classList.add('has-photo');
      }
    }catch{}
  };

  const showError=()=>{
    grid.innerHTML='<div class="senior-recent-loading">최근 대회를 불러오지 못했습니다. 잠시 후 다시 확인해 주세요.</div>';
  };

  fetch(DATA_URL,{cache:'no-cache'})
    .then(res=>{
      if(!res.ok)throw new Error('recent data');
      return res.json();
    })
    .then(data=>{
      const limit=Number(data.recentPolicy&&data.recentPolicy.limit)||3;
      const excludeFuture=!(data.recentPolicy&&data.recentPolicy.excludeFuture===false);
      const items=(data.competitions||[])
        .filter(item=>item.showInRecent!==false&&item.startDate&&item.endDate)
        .filter(item=>!excludeFuture||item.startDate<=today)
        .sort(recentSort)
        .slice(0,limit);

      grid.innerHTML='';
      if(!items.length){
        showError();
        return;
      }

      items.forEach(item=>{
        const card=renderCard(item);
        grid.appendChild(card);
        setPhoto(card,item.hero);
      });
    })
    .catch(showError);
})();