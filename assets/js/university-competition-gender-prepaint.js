(()=>{
'use strict';
const page=location.pathname.split('/').pop()||'university-competition.html';
const id=page==='university-competition-danyang.html'?'danyang-2026':'gosung-2026';
const raw=new URLSearchParams(location.search).get('gender');
let mode=null;
if(raw==='women'||raw==='여대부')mode='women';
else if(raw==='men'||raw==='남대부')mode='men';
if(!mode){
  try{mode=sessionStorage.getItem(`kvl:${id}:gender`)==='여대부'?'women':'men';}
  catch(_){mode='men';}
}
document.documentElement.dataset.kvlInitialGender=mode;
})();
