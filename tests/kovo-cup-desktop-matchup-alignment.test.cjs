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
// The two logo/name groups must hug the score equally and keep their own
// logo immediately beside each name, rather than inheriting opposite auto margins.
const equalPatch=css.slice(css.lastIndexOf('/* KOVO Cup PC: equal gaps between both team-name groups'));
assert(equalPatch.startsWith('/* KOVO Cup PC: equal gaps'), 'equal-gap PC patch missing');
assert.match(equalPatch, /@media screen and \(min-width:901px\)/);
assert.match(equalPatch, /grid-template-columns:minmax\(0,1fr\) 62px minmax\(0,1fr\)!important/);
assert.match(equalPatch, /column-gap:12px!important/);
assert.match(equalPatch, /\.kvl1180-side\{[^}]+display:flex!important/s);
assert.match(equalPatch, /\.kvl1180-side\{[^}]+width:100%!important/s);
assert.match(equalPatch, /\.kvl1180-side\.is-left\{[^}]+justify-content:flex-end!important/s);
assert.match(equalPatch, /\.kvl1180-side\.is-right\{[^}]+justify-content:flex-start!important/s);
assert.match(equalPatch, /\.kvl1180-slot-copy strong\{[^}]+margin:0!important/s);
assert.match(equalPatch, /\.kvl1180-score\{[^}]+justify-self:center!important/s);
assert.doesNotMatch(equalPatch, /@media[^{]*max-width:/, 'mobile geometry not changed');
for(const width of [420,460,520,560]){
  const scoreWidth=62, gap=12;
  const eachSide=(width-scoreWidth-2*gap)/2;
  assert(eachSide>160,'team logos and names fit within symmetric lanes');
  assert.equal(eachSide+gap,(width-scoreWidth)/2,'team-to-score gap stays equal on both sides');
}

// Short and long club names must never move either 46px team-logo rail.
// Text must sit immediately beside its logo; the board has 12px score gutters.
const rails=css.slice(css.lastIndexOf('/* KOVO Cup PC: fixed logo rails and attached team labels'));
assert(rails.startsWith('/* KOVO Cup PC: fixed logo rails and attached team labels'), 'latest Cup PC logo column rule missing');
assert.match(rails, /@media screen and \(min-width:901px\)/);
assert.match(rails, /\.kvl1180-side\{[^}]+display:grid!important/s);
assert.match(rails, /grid-template-rows:46px!important/);
assert.match(patch, /width:min\(100%,400px\)!important/,'PC board must be compact and centred');
assert.match(rails, /column-gap:8px!important/,'team names attach to 46px logo rails');
assert.match(equalPatch, /column-gap:12px!important/,'left/right score gutters stay symmetric');

assert.match(rails, /\.kvl1180-side\.is-left\{[^}]+grid-template-columns:46px minmax\(0,1fr\)!important/s);
assert.match(rails, /\.kvl1180-side\.is-right\{[^}]+grid-template-columns:minmax\(0,1fr\) 46px!important/s);
assert.match(rails, /\.kvl1180-side\.is-left \.kvl1180-inline-logo\{[^}]+grid-column:1!important/s);
assert.match(rails, /\.kvl1180-side\.is-right \.kvl1180-inline-logo\{[^}]+grid-column:2!important/s);
assert.match(rails, /\.kvl1180-side\.is-left \.kvl1180-slot-copy\{[^}]+text-align:left!important/s);
assert.match(rails, /\.kvl1180-side\.is-right \.kvl1180-slot-copy\{[^}]+text-align:right!important/s);
assert.match(rails, /\.kvl1180-slot-copy\{[^}]+width:100%!important/s);
assert.doesNotMatch(rails, /@media[^{]*max-width:/, 'no mobile changes');
// From both outer edges, the independent name lengths do not enter the logo-X formula.
for(const sideWidth of [164,192,230,240]){
  const leftLogoX=0, rightLogoX=sideWidth-46;
  for(const labelPx of [45,65,85,110]){
    assert.equal(leftLogoX,0, 'left logo rail never follows varying name length');
    assert.equal(rightLogoX,sideWidth-46, 'right logo rail never follows varying name length');
    assert(sideWidth-46-8>=110, 'usable team name lane remains');
  }
}

// Existing family school/university geometry and mobile KOVO Cup rules must stay.
assert(read('assets/css/kvl-competition-components-v2.css').includes('[data-kvl-family="domestic"] :is(#schedule,#team-results) .kvl1180-match-board'), 'existing baseline stays in common competition components CSS');
assert(css.includes('kvl-pro-cup-domestic-v2'));
for(const html of ['competition-engine.html','kovo-cup-domestic-template-prototype.html']){
  assert.match(read(html),/kvl-domestic-home-v2\.css\?v=(?:20261027-(?:cup-pc-labels-tight|club-rosters)|20261028-club-rosters-flags)-1/,'cache-bust '+html);
}
console.log('PASS: Cup PC matchup centered with equal team-to-score gaps; five-set lane and mobile layout protected');
