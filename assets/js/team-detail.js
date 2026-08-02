(()=>{
  const params=new URLSearchParams(location.search);
  const name=params.get('name')||'팀 정보';
  const id=params.get('id')||'-';
  document.title=`${name} | K-Volley Lab`;
  const title=document.getElementById('tdTeamName');
  const meta=document.getElementById('tdMeta');
  const teamId=document.getElementById('tdTeamId');
  const logo=document.getElementById('tdTeamLogo');
  const logoStatus=document.getElementById('tdLogoStatus');
  if(title)title.textContent=name;
  if(meta)meta.textContent=`${name}의 대회 성적과 팀 정보를 관리하는 페이지입니다.`;
  if(teamId)teamId.textContent=id;
  if(logo){logo.setAttribute('aria-label',`${name} 로고 자리`);logo.textContent=String(name).replace(/고등학교|중학교|여자|사범대학부속|스포츠과학|체육|전자/g,'').slice(0,2)||'팀'}
  const checkLogo=()=>{if(logoStatus)logoStatus.textContent=logo?.classList.contains('has-school-logo')?'공식 로고 등록':'기본 아이콘'};
  setTimeout(checkLogo,300);
  setTimeout(checkLogo,1200);
})();