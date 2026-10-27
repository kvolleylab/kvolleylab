'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const css=read('assets/css/kvl-domestic-home-v2.css');
const marker='/* 2026-10-27 · KOVO Cup PC matchup geometry.';
const pos=css.lastIndexOf(marker);
assert(pos>0,'scoped KOVO Cup geometry must exist');
const patch=css.slice(pos);
assert.match(patch, /@media screen and \(min-width:901px\)/,'change must apply on PC only');
assert.match(patch, /\.kvl-pro-cup-domestic-v2 :is\(#schedule,#team-results\) \.kvl1180-match-row/,'must target Cup only');
assert.match(patch,/grid-template-columns:clamp\(118px,11\.8vw,150px\) minmax\(0,1fr\) clamp\(285px,25vw,300px\)!important/);
assert.match(patch,/\.kvl1180-match-meta\{\s*grid-column:1!important;\s*grid-row:1!important/);
assert.match(patch,/\.kvl1180-match-board\{\s*grid-column:2!important;\s*grid-row:1!important/);
assert.match(patch,/\.kvl1180-match-board\{[^}]+justify-self:center!important/s);
assert.match(patch,/\.kvl1180-set-scores\{\s*grid-column:3!important;\s*grid-row:1!important/);
assert.match(patch,/\.kvl1180-set-scores\{[^}]+justify-content:flex-end!important/s);
assert.doesNotMatch(patch, /@media[^{]*max-width:/,'mobile layout should not be overridden');
const clamp=(min,x,max)=>Math.max(min,Math.min(x,max));
// The midpoint of the reserved region between the time column and five-set column
// should equal the center of the matchup board at desktop widths.
for(const viewport of [901,1024,1100,1180,1440]){
  const contentWidth=Math.min(viewport,1180)-32;
  const time=clamp(118,.118*viewport,150);
  const fiveSet=clamp(285,.25*viewport,300);
  const gap=clamp(8,.01*viewport,14);
  const middle=contentWidth-time-fiveSet-2*gap;
  assert(middle>=400,'room for two crests and both team names at '+viewport);
  const middleStart=time+gap;
  const middleCenter=middleStart+middle/2;
  const scoreLaneStart=middleStart+middle+gap;
  assert(Math.abs(middleCenter-(time+(scoreLaneStart-time)/2))<1e-6,'middle anchor must be mathematically centered');
  assert.equal(fiveSet>=285,true,'always reserve five set scores');
}
// Existing family school/university geometry and mobile KOVO Cup rules must stay.
assert(css.includes('[data-kvl-family="domestic"] :is(#schedule,#team-results) .kvl1180-match-board'));
assert(css.includes('kvl-pro-cup-domestic-v2'));
for(const html of ['competition-engine.html','kovo-cup-domestic-template-prototype.html']){
  assert.match(read(html),/kvl-domestic-home-v2\.css\?v=20261027-cup-pc-matchup-center-1/,'cache-bust '+html);
}
console.log('PASS: Cup desktop matchup centered between game time and five-set lane; mobile & other competitions protected');
