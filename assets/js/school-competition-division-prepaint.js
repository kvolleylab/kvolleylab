(()=>{
'use strict';
const script=document.currentScript;
const id=script?.dataset.competition||'school-competition';
const raw=new URLSearchParams(location.search).get('division');
let division=raw||'';
if(!division){
  try{division=sessionStorage.getItem(`kvl:${id}:division`)||'';}catch(_){division='';}
}
document.documentElement.dataset.kvlInitialGender=/여자부/.test(division)?'women':'men';
})();
