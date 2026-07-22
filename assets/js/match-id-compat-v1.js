(()=>{
  const params=new URLSearchParams(window.location.search);
  const raw=(params.get('id')||'').trim();
  if(!raw)return;

  const legacy=raw.match(/^KVL-M-2026-VNL-(\d{6})$/i);
  if(legacy){
    params.set('id',`KVL-M-${legacy[1]}`);
    const query=params.toString();
    history.replaceState(null,'',`${location.pathname}${query?`?${query}`:''}${location.hash}`);
  }
})();
