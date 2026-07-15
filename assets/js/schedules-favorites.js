(()=>{
const KEY='kvl.favoriteMatches.v1';
const getFavorites=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch{return[]}};
function apply(){
  const favorites=getFavorites();
  const count=document.getElementById('scheduleFavoritesCount');
  if(count)count.textContent=String(favorites.length);
  document.querySelectorAll('a[href*="match.html?id="]').forEach(link=>{
    const matchId=new URL(link.href,location.href).searchParams.get('id');
    link.classList.toggle('favorite-match',favorites.includes(matchId));
  });
}
apply();
const target=document.getElementById('calendarArea');
if(target){new MutationObserver(apply).observe(target,{childList:true,subtree:true})}
window.addEventListener('storage',apply);
})();