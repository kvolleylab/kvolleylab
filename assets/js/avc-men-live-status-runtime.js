(()=>{
  const path=(location.pathname.split('/').pop()||'').toLowerCase();
  if(path!=='international-competition-avc-men-continental-2026.html')return;

  const DATA='data/competitions/avc-men-continental-2026.json?v=20260904-2';
  const apply=data=>{
    const badges=document.querySelectorAll('.avc-status span');
    if(!badges.length)return;
    badges[0].textContent=data?.status==='completed'?'대회 종료':data?.status==='ongoing'?'대회 진행중':'대회 예정';
    const review=document.querySelector('.avc-status .review');
    if(review&&data?.scheduleStatusLabel)review.textContent=data.scheduleStatusLabel;
  };

  fetch(DATA,{cache:'no-store'})
    .then(r=>r.ok?r.json():Promise.reject(r.status))
    .then(apply)
    .catch(()=>{});
})();