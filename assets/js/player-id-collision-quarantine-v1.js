/* 2026-27 legacy KVL-P collision quarantine.
   26 IDs occur in both the national link registry and pro season MASTER,
   referring to different people. Do not reassign or alias these IDs until
   a reviewed migration is approved. This list is checked against live
   source JSON by tests/player-id-collision-quarantine.test.mjs. */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.KVLPlayerIdCollisionV1=api;
})(typeof window==='object'?window:globalThis,function(){
 'use strict';
 const collisionIds=Object.freeze(Array.from({length:26},(_,i)=>
  'KVL-P-'+String(1620+i).padStart(6,'0')));
 const frozen=new Set(collisionIds);
 const isConflict=id=>frozen.has(String(id||''));
 const validScope=scope=>scope==='pro'||scope==='national';
 function profileUrl(id,kind){
  const url='player.html?id='+encodeURIComponent(id);
  if(isConflict(id)&&kind==='pro')return url+'&scope=pro';
  if(isConflict(id)&&kind==='national')return url+'&scope=national';
  return url;
 }
 return Object.freeze({collisionIds,isConflict,validScope,profileUrl});
});
