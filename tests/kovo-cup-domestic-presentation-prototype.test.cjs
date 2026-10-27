'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const proto=read('kovo-cup-domestic-template-prototype.html');
const shared=read('assets/js/kvl-domestic-home-v2.js');
const components=read('assets/js/kvl-competition-components-v2.js');
assert.match(proto,/<meta name="robots" content="noindex,nofollow,noarchive">/);
assert.match(proto,/window\.KVL_COMPETITION_PAGE_V2=\{production:false/);
assert.match(proto,/window\.KVLCompetitionAdapterV2=function\(original\)/);
assert.match(proto,/competitionFamily:'domestic'/);
assert.match(proto,/presentation:'domestic-home-v2'/);
assert.match(proto,/presentationCategory:'pro-cup'/);
assert.match(shared,/const enabled=d=>\['domestic','pro'\]\.includes\(d\?\.competitionFamily\)&&d\.structure\?\.presentation==='domestic-home-v2'/);
assert.match(shared,/d\.structure\.hubCategoryLabel\|\|'국내대회'/);
assert.match(shared,/d\.structure\.heroTagline/);
assert.match(proto,/PRO VOLLEYBALL · KOVO CUP/);
assert.match(proto,/hubUrl:'kovo-cup\.html'/);
assert.match(proto,/divisionLinks:\[/);
assert.match(proto,/searchLabels:\{label:'참가팀 검색'/);
assert.match(components,/data\(\)\.structure\?\.presentationCategory!=='pro-cup'/);
assert.match(proto,/kvl-domestic-home-v2\.css/);
assert.match(proto,/kvl-domestic-home-v2\.js/);
const scripts=['kvl-competition-config-v2.js','kvl-competition-shell-v2.js','kvl-competition-template-v2.js','kvl-competition-components-v2.js','kvl-domestic-home-v2.js','kvl-competition-loader-v2.js'];
let last=-1;
for(const name of scripts){const next=proto.indexOf('/assets/js/'+name);assert(next>last,name+' must load in correct shared-engine order');last=next;}
for(const gender of ['men','women']){
 const base='data/competitions/kovo-cup-'+gender+'-2026/';
 const cfg=JSON.parse(read(base+'config.json')),data=JSON.parse(read(base+'data.json'));
 assert.equal(cfg.competition.competitionFamily,'pro','production config must remain pro');
 assert.equal(cfg.hero.themeVariant,'cup');
 assert.equal(cfg.hero.size,'contain');
 assert.equal(cfg.hero.mobileSize,'contain');
 assert.equal(cfg.hero.showImage,true);
 for(const variant of ['pcImage','mobileImage']){
  assert(cfg.hero[variant].startsWith('/assets/img/competition-hero/'));
  assert(fs.existsSync(path.join(root,cfg.hero[variant].split('?')[0].slice(1))),
    gender+' missing verified Hero '+variant);
 }
 assert.equal(data.participants.length,7);
 assert.equal(data.matches.length,12);
 for(const p of data.participants){
  assert(p.logo,p.code+' logo is missing');
  assert(fs.existsSync(path.join(root,p.logo.replace(/^\//,''))),p.code+' logo file missing');
 }
}
assert.match(proto,/background-size:100% 100%,contain!important/,'Hero must not be enlarged/cropped');
assert.match(proto,/var\(--kvl-hero-image-mobile\)/,'must use existing mobile Hero asset');
assert.match(proto,/color:#4b5563!important/,'sets and game scores must remain neutral');
assert.match(proto,/kovo-cup-men-2026/);
assert.match(proto,/kovo-cup-women-2026/);
assert.doesNotMatch(proto,/fetch\(['"]https:\/\/drive\.google\.com/,'no raw Drive dependence');
assert.doesNotMatch(proto,/localStorage\.setItem/,'do not create unrelated personal state');
console.log('PASS: KOVO Cup domestic-home-v2 presentation prototype, original assets, gender routes and neutral score palette');
