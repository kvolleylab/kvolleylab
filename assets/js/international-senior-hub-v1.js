(()=> {
  const grid=document.getElementById('seniorRecentGrid');
  if(!grid)return;

  const DATA_URL='data/international/senior-competitions.json?v=20260921-source-2';
  const pad=n=>String(n).padStart(2,'0');
  const now=new Date();
  const today=now.getFullYear()+'-'+pad(now.getMonth()+1)+'-'+pad(now.getDate());

  const recentSort=(a,b)=>{
    const aActive=a.startDate<=today&&today<=a.endDate;
    const bActive=b.startDate<=today&&today<=b.endDate;
    if(aActive!==bActive)return bActive-aActive;
    if(aActive)return b.startDate.localeCompare(a.startDate);
    return b.endDate.localeCompare(a.endDate);
  };

  const resolveHeroSource=async item=>{
    const hero=item.hero||{};
    if(hero.mode==='source-page'&&hero.sourcePage){
      const res=await fetch(hero.sourcePage,{cache:'no-cache'});
      if(!res.ok)throw new Error('hero source page');
      const html=await res.text();
      const doc=new DOMParser().parseFromString(html,'text/html');
      const node=doc.querySelector(hero.selector||'.kvl1180-hero');
      if(!node)throw new Error('hero selector');
      const mobile=node.style.getPropertyValue('--kvl-hero-image-mobile').trim();
      const pc=node.style.getPropertyValue('--kvl-hero-image-pc').trim();
      if(mobile)return {imageCss:mobile,sourcePosition:'center center'};
      if(pc)return {imageCss:pc,sourcePosition:'center center'};
    }
    if(hero.mode==='competition-config'&&hero.config){
      const res=await fetch(hero.config,{cache:'no-cache'});
      if(!res.ok)throw new Error('hero config');
      const config=await res.json();
      const h=config.hero||{};
      const image=h.mobileImage||h.pcImage;
      if(image)return {image:image,sourcePosition:h.mobilePosition||h.position||'center center'};
    }
    return {};
  };

  const renderCard=(item,source={})=>{
    const c=item.card||{};
    const card=document.createElement('a');
    card.className='senior-recent-card';
    card.href=item.href;
    card.dataset.competition=item.id;
    card.style.setProperty('--recent-a',c.themeA||'#074827');
    card.style.setProperty('--recent-b',c.themeB||'#0e7b43');
    card.style.setProperty('--recent-accent',c.accent||'#f2e8cf');
    card.style.setProperty('--recent-eyebrow',c.eyebrowColor||'#e6c46c');
    card.style.setProperty('--recent-overlay-pc',c.overlayPc||'linear-gradient(105deg,rgba(3,27,51,.42) 0%,rgba(3,27,51,.22) 48%,rgba(3,27,51,.04) 76%)');
    card.style.setProperty('--recent-overlay-mobile',c.overlayMobile||'linear-gradient(90deg,rgba(3,27,51,.20) 0%,rgba(3,27,51,.10) 42%,rgba(3,27,51,.02) 68%,rgba(3,27,51,0) 82%)');

    const imageCss=source.imageCss||(source.image?'url("'+source.image+'")':(c.image?'url("'+c.image+'")':''));
    if(imageCss){
      card.classList.add('has-photo');
      card.style.setProperty('--recent-image',imageCss);
      card.style.setProperty('--recent-image-pc-pos',source.sourcePosition||c.imagePositionPc||'center center');
      card.style.setProperty('--recent-image-mobile-pos',source.sourcePosition||c.imagePositionMobile||'center center');
    }

    const hero=document.createElement('div');
    hero.className='senior-recent-hero';

    const copy=document.createElement('div');
    copy.className='senior-recent-copy';

    const eyebrow=document.createElement('p');
    eyebrow.className='senior-recent-eyebrow';
    eyebrow.textContent=c.eyebrow||item.brand||'INTERNATIONAL COMPETITION';

    const title=document.createElement('h3');
    title.textContent=c.title||item.title||'국제대회';

    const sub=document.createElement('p');
    sub.className='senior-recent-sub';
    sub.textContent=c.subtitle||'';

    const meta=document.createElement('div');
    meta.className='senior-recent-meta';

    const date=document.createElement('div');
    date.className='senior-recent-meta-row';
    date.innerHTML='<span class="senior-recent-icon" aria-hidden="true">▣</span><span></span>';
    date.lastElementChild.textContent=c.dateLabel||'';

    const place=document.createElement('div');
    place.className='senior-recent-meta-row';
    place.innerHTML='<span class="senior-recent-icon" aria-hidden="true">●</span><span></span>';
    place.lastElementChild.textContent=c.locationLabel||item.location||'';

    meta.append(date,place);
    copy.append(eyebrow,title,sub,meta);

    const status=document.createElement('div');
    status.className='senior-recent-status';

    [c.status,c.teamCount].filter(Boolean).forEach(value=>{
      const pill=document.createElement('span');
      pill.textContent=value;
      status.appendChild(pill);
    });

    const accent=document.createElement('span');
    accent.className='is-accent';
    accent.textContent=c.accentStatus||'대회 보기';
    status.appendChild(accent);

    hero.append(copy,status);
    card.appendChild(hero);
    return card;
  };

  const showError=()=>{
    grid.innerHTML='<div class="senior-recent-loading">최근 대회를 불러오지 못했습니다. 잠시 후 다시 확인해 주세요.</div>';
  };

  fetch(DATA_URL,{cache:'no-cache'})
    .then(res=>{if(!res.ok)throw new Error('recent data');return res.json()})
    .then(data=>{
      const limit=Number(data.recentPolicy&&data.recentPolicy.limit)||3;
      const excludeFuture=!(data.recentPolicy&&data.recentPolicy.excludeFuture===false);
      const items=(data.competitions||[])
        .filter(item=>item.showInRecent!==false&&item.startDate&&item.endDate)
        .filter(item=>!excludeFuture||item.startDate<=today)
        .sort(recentSort)
        .slice(0,limit);

      if(!items.length){showError();return}
      return Promise.all(items.map(async item=>{
        try{return [item,await resolveHeroSource(item)]}
        catch(e){return [item,{}]}
      }));
    })
    .then(resolved=>{
      if(!resolved)return;
      grid.innerHTML='';
      resolved.forEach(([item,source])=>grid.appendChild(renderCard(item,source)));
    })
    .catch(showError);
})();