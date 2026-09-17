/* Optional shared DATA ONLY extension. Load this file once in the shared entry
 * after kvl-competition-modules-v2.js. Register a stable ID used by config.modules.
 * Source JSON and options may vary per competition; DOM/CSS/HTML never do.
 * Keep this starter out of production until a real source mapping is supplied.
 */
(function(register){if(typeof module==='object'&&module.exports)module.exports=register;else register(window.KVLCompetitionModulesV2);})(function(api){
api.register('official-resources',{
 fields:['resources'],
 normalize(source){
  if(!Array.isArray(source))throw Error('Expected an array of official documents');
  return {resources:source.map(row=>({title:row.title,url:row.url}))};
 }
});
});
