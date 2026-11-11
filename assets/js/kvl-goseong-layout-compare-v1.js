/* KVL real-Engine visual comparison v1.
 * Only adds styles to a SAME-ORIGIN, READ-ONLY iframe. Never writes match/roster/standings data.
 * Source: approved KVL existing-editor v2 token vocabulary; target: goseong men's university competition.
 */
(function (root,factory) {
  const api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;
  if(typeof window==="object")root.KVLGoseongCompareV1=api;
})(typeof window==="object"?window:globalThis,function(){
"use strict";
const SLUG="university-goseong-men-2026";
const STYLE_ID="kvl-goseong-compare-v1";
const NUMERIC={
  nameSize:[10,22],logoSize:[26,84],logoX:[-24,24],logoY:[-24,24],
  logoGap:[0,28],tableFont:[11,19],rowPad:[3,22],
  winWidth:[38,100],lossWidth:[38,100],winX:[-20,20],
  lossX:[-20,20],statY:[-15,15],heroFont:[20,44]
};
const MODES=new Set(["natural","two","shrink","one"]);
const FITS=new Set(["contain","cover"]);
const POSITIONS=new Set(["center center","left center","right center","70% center"]);
const rootSel='html body.kvl1180-prototype.kvl-competition-template-v2[data-kvl-layout-preview="'+SLUG+'"]';
const has=(obj,key)=>Object.prototype.hasOwnProperty.call(obj,key);
function normalize(input){
  if(!input||typeof input!=="object"||Array.isArray(input))throw Error("invalid_layout_tokens");
  const result={};
  for(const [key,value] of Object.entries(input)){
    if(has(NUMERIC,key)){
      const [min,max]=NUMERIC[key];
      if(typeof value!=="number"||!Number.isFinite(value)||value<min||value>max)throw Error("invalid_"+key);
      result[key]=value;
    }else if(key==="nameMode"){
      if(!MODES.has(value))throw Error("invalid_nameMode");
      result[key]=value;
    }else if(key==="heroFit"){
      if(!FITS.has(value))throw Error("invalid_heroFit");
      result[key]=value;
    }else if(key==="heroPosition"){
      if(!POSITIONS.has(value))throw Error("invalid_heroPosition");
      result[key]=value;
    }else if(key==="heroColor"){
      if(typeof value!=="string"||!/^#[0-9a-f]{6}$/i.test(value))throw Error("invalid_heroColor");
      result[key]=value.toLowerCase();
    }else throw Error("unknown_token_"+key);
  }
  return result;
}
function rules(tokens){
  const v=normalize(tokens), css=[];
  const a=s=>css.push(s);
  const scope=rootSel;
  const teamImgs=scope+" .dv2-team-tile img, "+scope+" .dv2-team-tile .dv2-team-mark";
  const matchLogo=scope+" :is(#schedule,#team-results) .kvl1180-inline-logo";
  if(has(v,"logoSize")){
    a(teamImgs+"{width:"+v.logoSize+"px!important;height:"+v.logoSize+"px!important;object-fit:contain!important;}");
    a(matchLogo+"{width:"+Math.round(v.logoSize*.875)+"px!important;min-width:"+Math.round(v.logoSize*.875)+"px!important;max-width:"+Math.round(v.logoSize*.875)+"px!important;height:"+Math.round(v.logoSize*.875)+"px!important;}");
    a("@media(max-width:680px){"+teamImgs+"{width:"+Math.round(v.logoSize*.79)+"px!important;height:"+Math.round(v.logoSize*.79)+"px!important;}"+matchLogo+"{width:"+Math.round(v.logoSize*.79)+"px!important;min-width:"+Math.round(v.logoSize*.79)+"px!important;max-width:"+Math.round(v.logoSize*.79)+"px!important;height:"+Math.round(v.logoSize*.79)+"px!important;}}");
  }
  if(has(v,"logoX")||has(v,"logoY")){
    const dx=v.logoX||0,dy=v.logoY||0,translation="translate("+dx+"px,"+dy+"px)";
    a(teamImgs+","+matchLogo+","+scope+" .dv2-standings-table img{transform:"+translation+"!important;}");
  }
  if(has(v,"logoGap"))a(teamImgs+"{margin-bottom:"+v.logoGap+"px!important;}");
  const names=scope+" .dv2-team-tile b,"+scope+" #groups .kvl1180-pool-team-copy strong,"+scope+" .dv2-standings-table tbody a span";
  if(has(v,"nameSize")){
    a(names+"{font-size:"+v.nameSize+"px!important;}");
    a("@media(max-width:680px){"+names+"{font-size:"+Math.round(v.nameSize*.86*10)/10+"px!important;}}");
  }
  if(has(v,"nameMode")){
    const base=names+"{max-width:100%!important;word-break:keep-all!important;overflow-wrap:anywhere!important;";
    if(v.nameMode==="two")a(base+"white-space:normal!important;line-height:1.28!important;min-height:2.56em;}");
    else if(v.nameMode==="natural")a(base+"white-space:normal!important;line-height:1.3!important;}");
    else if(v.nameMode==="shrink")a(base+"white-space:normal!important;font-size:clamp(10px,0.83em,14px)!important;line-height:1.25!important;}");
    else a(base+"white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;}");
  }
  if(has(v,"rowPad")){
    a(scope+" #groups .kvl1180-pool-row{padding-top:"+v.rowPad+"px!important;padding-bottom:"+v.rowPad+"px!important;height:auto!important;}");
    a(scope+" .dv2-standings-table tbody :is(th,td){padding-top:"+v.rowPad+"px!important;padding-bottom:"+v.rowPad+"px!important;}");
  }
  if(has(v,"tableFont"))a(scope+" #groups .kvl1180-pool-row{font-size:"+v.tableFont+"px!important;}");
  // Shift the win/loss HEADINGS and VALUES together. Do not reorder the source data.
  if(has(v,"winX")||has(v,"lossX")||has(v,"statY")){
    const y=v.statY||0,w=v.winX||0,l=v.lossX||0;
    a(scope+" #groups .kvl1180-pool-table-head>span:nth-child(3),"+scope+" #groups .kvl1180-pool-w{position:relative;transform:translate("+w+"px,"+y+"px)!important;}");
    a(scope+" #groups .kvl1180-pool-table-head>span:nth-child(4),"+scope+" #groups .kvl1180-pool-l{position:relative;transform:translate("+l+"px,"+y+"px)!important;}");
    a(scope+" .dv2-standings-table thead th:nth-child(4),"+scope+" .dv2-standings-table [data-stat='wins']{position:relative;left:"+w+"px!important;top:"+y+"px!important;}");
    a(scope+" .dv2-standings-table thead th:nth-child(5),"+scope+" .dv2-standings-table [data-stat='losses']{position:relative;left:"+l+"px!important;top:"+y+"px!important;}");
  }
  // Explicit track width is opt-in only. When absent, the production CSS grid is untouched.
  if(has(v,"winWidth")||has(v,"lossWidth")){
    const w=v.winWidth??38,l=v.lossWidth??38;
    a(scope+" #groups .kvl1180-pool-table-head,"+scope+" #groups .kvl1180-pool-row{grid-template-columns:36px minmax(138px,1fr) "+w+"px "+l+"px 36px 88px 88px!important;min-width:480px!important;}");
  }
  if(has(v,"heroFont"))a(scope+" .kvl1180-hero h1{font-size:"+v.heroFont+"px!important;}");
  if(has(v,"heroColor"))a(scope+" .kvl1180-hero h1{color:"+v.heroColor+"!important;}");
  if(has(v,"heroFit"))a(scope+" .kvl1180-hero{background-size:100% 100%,"+v.heroFit+"!important;}");
  if(has(v,"heroPosition"))a(scope+" .kvl1180-hero{background-position:center,"+v.heroPosition+"!important;}");
  return css.join("\n");
}
function applyDocument(doc,tokens,slug=SLUG){
  if(slug!==SLUG)throw Error("comparison_requires_goseong_men");
  if(!doc||!doc.body||!doc.head||!doc.defaultView)throw Error("preview_document_unavailable");
  const url=new URL(doc.defaultView.location.href);
  if(url.pathname.split("/").pop()!=="competition-engine.html"||url.searchParams.get("competition")!==SLUG){
    throw Error("preview_target_mismatch");
  }
  if(!doc.body.classList.contains("kvl-competition-template-v2"))throw Error("competition_engine_not_ready");
  const css=rules(tokens);
  let node=doc.getElementById(STYLE_ID);
  if(!node){node=doc.createElement("style");node.id=STYLE_ID;doc.head.append(node);}
  doc.body.setAttribute("data-kvl-layout-preview",SLUG);
  node.textContent=css;
  return {cssLength:css.length,applied:true};
}
function clearDocument(doc){
  if(!doc?.body)return;
  doc.getElementById(STYLE_ID)?.remove();
  doc.body.removeAttribute("data-kvl-layout-preview");
}
return {SLUG,STYLE_ID,normalize,rules,applyDocument,clearDocument};
});
