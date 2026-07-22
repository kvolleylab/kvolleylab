(()=>{
  const finalStart=109;
  const finalEnd=116;
  const roundLabels={
    109:'8강 1',110:'8강 2',111:'8강 3',112:'8강 4',
    113:'준결승 1',114:'준결승 2',115:'3위 결정전',116:'결승'
  };
  const matchNo=value=>{
    const m=String(value||'').match(/KVL-M-(?:2026-VNL-)?(\d{6})/i);
    return m?Number(m[1]):0;
  };
  const isFinalNo=no=>no>=finalStart&&no<=finalEnd;
  const patch=()=>{
    const currentNo=matchNo(new URLSearchParams(location.search).get('id'));
    if(isFinalNo(currentNo)){
      const eyebrow=document.querySelector('#summary .eyebrow');
      if(eyebrow)eyebrow.textContent=`2026 VNL Men · ${roundLabels[currentNo]||'파이널'}`;
      const venueItems=[...document.querySelectorAll('#summary .md-meta > div')];
      const venueItem=venueItems.find(item=>item.querySelector('span')?.textContent.trim()==='개최지');
      const venueValue=venueItem?.querySelector('strong');
      if(venueValue)venueValue.textContent='중국 (닝보)';
    }
    document.querySelectorAll('a[href*="match.html?id="]').forEach(link=>{
      const no=matchNo(link.getAttribute('href'));
      if(!isFinalNo(no))return;
      const place=link.querySelector('small');
      if(place&&/중국\s*\(린이\)/.test(place.textContent))place.textContent='중국 (닝보)';
    });
    return Boolean(document.querySelector('#summary'));
  };
  if(patch())return;
  const observer=new MutationObserver(()=>{if(patch())observer.disconnect()});
  observer.observe(document.documentElement,{childList:true,subtree:true});
})();
