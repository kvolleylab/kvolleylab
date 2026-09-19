(()=> {
  const grid=document.getElementById('seniorRecentGrid');
  if(!grid)return;

  const DATA_URL='data/international/senior-competitions.json?v=20260919-2';
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
    card.style.setProperty('--recent-overlay',(item.hero&&item.hero.overlay)||'linear-gradient(90deg,rgba(2,19,39,.82) 0%,rgba(3,35,67,.48) 57%,rgba(3,28,53,.10) 100%)');

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

  const setImages=(card,{desktopImage,mobileImage,desktopPosition,mobilePosition})=>{
    if(!desktopImage&&!mobileImage)return;
    const d=desktopImage||mobileImage;
    const m=mobileImage||desktopImage;
    card.style.setProperty('--recent-desktop-image','url("'+d+'")');
    card.style.setProperty('--recent-mobile-image','url("'+m+'")');
    card.style.setProperty('--recent-desktop-position',desktopPosition||'center center');
    card.style.setProperty('--recent-mobile-position',mobilePosition||'center center');
    card.classList.add('has-photo');
  };

  const loadSharedB64=async hero=>{
    const parts=await Promise.all((hero.b64Chunks||[]).map(async path=>{
      const res=await fetch(path,{cache:'force-cache'});
      if(!res.ok)throw new Error('chunk');
      return (await res.text()).replace(/\s+/g,'');
    }));
    return 'data:'+(hero.mimeType||'image/webp')+';base64,'+parts.join('');
  };

  const setPhoto=async(card,hero)=>{
    if(!hero)return;
    try{
      if(hero.mode==='competition-config'&&hero.config){
        const configRes=await fetch(hero.config,{cache:'force-cache'});
        if(!configRes.ok)throw new Error('config');
        const config=await configRes.json();
        const source=config.hero||{};

        // Recent cards intentionally invert the competition's responsive HERO sources:
        // PC recent grid -> mobile HERO source, mobile recent list -> PC HERO source.
        const desktopImage=source.mobileImage||source.pcImage;
        const mobileImage=source.pcImage||source.mobileImage;

        if(desktopImage||mobileImage){
          setImages(card,{
            desktopImage,
            mobileImage,
            desktopPosition:source.mobilePosition||source.position||'right center',
            mobilePosition:source.position||source.mobilePosition||'center center'
          });
          return;
        }

        if(Array.isArray(source.b64Chunks)&&source.b64Chunks.length){
          const parts=await Promise.all(source.b64Chunks.map(async path=>{
            const res=await fetch(path,{cache:'force-cache'});
            if(!res.ok)throw new Error('chunk');
            return (await res.text()).replace(/\s+/g,'');
          }));
          const dataUrl='data:'+(source.mimeType||'image/webp')+';base64,'+parts.join('');
          setImages(card,{
            desktopImage:dataUrl,
            mobileImage:dataUrl,
            desktopPosition:source.mobilePosition||source.position||'right center',
            mobilePosition:source.position||source.mobilePosition||'center center'
          });
        }
        return;
      }

      if(hero.mode==='shared-b64'&&Array.isArray(hero.b64Chunks)&&hero.b64Chunks.length){
        const dataUrl=await loadSharedB64(hero);
        setImages(card,{
          desktopImage:dataUrl,
          mobileImage:dataUrl,
          desktopPosition:hero.desktopCardPosition||'72% center',
          mobilePosition:hero.mobileCardPosition||'center center'
        });
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