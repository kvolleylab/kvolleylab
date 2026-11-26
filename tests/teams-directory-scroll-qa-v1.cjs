'use strict';
const assert=require('node:assert/strict');

// Use native Chromium touch input, not JS scrollBy, to test the scroll chain.
async function verifyRosterScrollChain(page){
 await page.locator('.kvlrv2-players .kvlrv2-row').first().waitFor();
 // Let the existing open-roster smooth scroll finish before setting up gestures.
 await page.waitForTimeout(600);
 const css=await page.locator('.kvlrv2-players').evaluate(e=>({
  y:getComputedStyle(e).overscrollBehaviorY,x:getComputedStyle(e).overscrollBehaviorX,
  overflow:getComputedStyle(e).overflowY,maxHeight:getComputedStyle(e).maxHeight,
  height:e.clientHeight,scrollHeight:e.scrollHeight
 }));
 assert.equal(css.y,'auto','Mobile vertical scroll must chain');
 assert.equal(css.x,'contain','Existing horizontal containment must remain');
 assert.equal(css.overflow,'auto','Player list retains internal scrolling');
 assert.ok(css.scrollHeight-css.height>=250,'Test requires a genuinely scrollable roster');
 const session=await page.context().newCDPSession(page);
 const metrics=()=>page.locator('.kvlrv2-players').evaluate(e=>({
  inner:e.scrollTop,maxInner:e.scrollHeight-e.clientHeight,outer:scrollY
 }));
 const cases={};
 try{
  for(const mode of ['middle','bottom','top']){
   await page.locator('.kvlrv2-players').evaluate((e,mode)=>{
    window.scrollTo({top:e.getBoundingClientRect().top+scrollY-100,behavior:'instant'});
    e.scrollTop=mode==='middle'?60:mode==='bottom'?e.scrollHeight:0;
   },mode);
   await page.waitForTimeout(150);
   const before=await metrics();
   const gesture=await page.locator('.kvlrv2-players').evaluate((e,mode)=>{
    const r=e.getBoundingClientRect(),top=Math.max(r.top,8),bottom=Math.min(r.bottom,innerHeight-8);
    const distance=Math.min(180,Math.floor((bottom-top)*.5));
    const x=Math.floor(r.left+r.width*.6),center=(top+bottom)/2;
    const delta=mode==='top'?distance:-distance;
    const y=Math.floor(center-delta/2);
    return {x,y,delta,hit:e.contains(document.elementFromPoint(x,y)),
     roomAbove:scrollY,roomBelow:document.scrollingElement.scrollHeight-innerHeight-scrollY};
   },mode);
   assert.ok(gesture.hit&&Math.abs(gesture.delta)>=80,'Swipe must start inside the visible roster: '+JSON.stringify(gesture));
   if(mode==='bottom')assert.ok(gesture.roomBelow>60,'Page needs room below roster');
   if(mode==='top')assert.ok(gesture.roomAbove>60,'Page needs room above roster');
   await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:gesture.x,y:gesture.y}]});
   for(let i=1;i<=12;i++){
    await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:gesture.x,y:gesture.y+gesture.delta*i/12}]});
    await page.waitForTimeout(25);
   }
   await page.waitForTimeout(100);
   await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
   await page.waitForTimeout(250);
   const after=await metrics();
   cases[mode]={innerDelta:Math.round(after.inner-before.inner),pageDelta:Math.round(after.outer-before.outer)};
   const label=mode+': '+JSON.stringify({before,after,gesture});
   if(mode==='middle'){
    assert.ok(after.inner-before.inner>25,'List must scroll internally before its edge: '+label);
    assert.ok(Math.abs(after.outer-before.outer)<=3,'Page should stay while the list can scroll: '+label);
   }else if(mode==='bottom'){
    assert.ok(Math.abs(after.inner-after.maxInner)<=3,'List stays at bottom: '+label);
    assert.ok(after.outer-before.outer>25,'Touch inside bottom must scroll the page down: '+label);
   }else{
    assert.ok(after.inner<=3,'List stays at top: '+label);
    assert.ok(before.outer-after.outer>25,'Touch inside top must scroll the page up: '+label);
   }
  }
 }finally{await session.detach();}
 return {css,cases};
}
async function verifyDesktopRosterContainment(page){
 const css=await page.locator('.kvlrv2-players').evaluate(e=>({
  x:getComputedStyle(e).overscrollBehaviorX,y:getComputedStyle(e).overscrollBehaviorY,
  maxHeight:getComputedStyle(e).maxHeight
 }));
 assert.deepEqual(css,{x:'contain',y:'contain',maxHeight:'640px'},'Desktop list retains existing containment and size');
 return css;
}
module.exports={verifyRosterScrollChain,verifyDesktopRosterContainment};
