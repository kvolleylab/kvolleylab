(()=>{
  const params=new URLSearchParams(location.search);
  const competition=params.get('competition')||'vnl';
  const script=document.createElement('script');
  script.async=false;
  script.src=competition==='avc-men-cup'
    ? 'assets/js/schedules-avc.js?v=20260816-2'
    : 'assets/js/schedules-v3.js?v=20260715-15';
  document.head.appendChild(script);
})();
