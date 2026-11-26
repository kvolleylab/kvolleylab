'use strict';
const assert=require('node:assert/strict');
const dialogFor=page=>page.locator('.kvl-roster-profile-dialog');
async function closeProPopup(page){
 const dialog=dialogFor(page);
 if(await dialog.isVisible()){
  await page.keyboard.press('Escape');
  await dialog.waitFor({state:'hidden'});
 }
}
async function verifyProPopup(page,league,row){
 const dialog=dialogFor(page),isV=league==='vleague';
 const trigger=isV?row:row.locator('.kvl-lr-name-button');
 const name=isV?row.locator('.kvlrv2-name strong'):row.locator('.kvl-lr-name-button');
 const nameText=(await name.innerText()).trim();
 const pane=page.locator(isV?'.kvlrv2-list':'.kvl-lr-table');
 assert.equal(await dialog.count(),1);
 assert.equal(await dialog.evaluate(el=>el.open),false,'No automatic desktop popup');
 const width=await pane.evaluate(el=>el.clientWidth);
 async function check(){
  await dialog.waitFor({state:'visible'});
  const size=await dialog.evaluate(el=>{const r=el.getBoundingClientRect();return {modal:el.matches(':modal'),width:r.width,left:r.left,right:r.right,top:r.top,bottom:r.bottom,vw:innerWidth,vh:innerHeight}});
  assert.ok(size.modal&&size.width<=522&&size.left>=0&&size.right<=size.vw&&size.top>=0&&size.bottom<=size.vh,'Common centered popup: '+JSON.stringify(size));
  assert.equal(await dialog.locator(isV?'.kvlrv2-profile-head h3':'.kvl-lr-detail-head h4').innerText().then(s=>s.split('\n')[0].trim()),nameText);
  assert.equal(await pane.evaluate(el=>el.clientWidth),width,'Popup must not narrow the roster');
  return size;
 }
 await name.click();
 const size=await check();
 await closeProPopup(page);
 assert.ok(await trigger.evaluate(el=>document.activeElement===el),'Escape restores selected row or name button focus');
 await trigger.press('Enter');
 await check();
 await dialog.locator(isV?'[data-kvl-rs-close]':'[data-kvl-lr-close]').click();
 await dialog.waitFor({state:'hidden'});
 await name.click();
 await check();
 await page.mouse.click(10,10);
 await dialog.waitFor({state:'hidden'});
 return {name:nameText,paneWidth:width,popup:size};
}
module.exports={closeProPopup,verifyProPopup};
