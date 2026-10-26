/* Keep every historical school URL, division and tab bookmark working. */
(()=>{
 'use strict';
 const prefix=document.currentScript?.dataset.competition;
 if(!prefix)return;
 const p=new URLSearchParams(location.search),aliases={
  '18세이하 남자부':'high-men','18세이하 여자부':'high-women','15세이하 남자부':'middle-men','15세이하 여자부':'middle-women',
  '남고부':'high-men','여고부':'high-women','남중부':'middle-men','여중부':'middle-women'
 };
 let value=p.get('division')||p.get('category')||'';
 if(!value){try{value=sessionStorage.getItem('kvl:'+prefix.replace(/^school-/,'')+':division')||'';}catch{}}
 const division=aliases[value]||(['high-men','high-women','middle-men','middle-women'].includes(value)?value:'high-men');
 const viewAliases={results:'schedule',standings:'knockout',teams:'rosters',sources:'resources'},view=p.get('view')||'overview';
 const target=new URL('competition-engine.html',location.href);
 target.searchParams.set('competition',prefix+'-'+division);target.searchParams.set('view',viewAliases[view]||view);
 for(const key of ['date','team'])if(p.has(key))target.searchParams.set(key,p.get(key));
 location.replace(target.href);
})();
