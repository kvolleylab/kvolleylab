/* KVL Goseong layout compare v1 — offline deterministic tests.
 * Run: node tests/kvl-goseong-layout-compare-v1.test.cjs
 * Does NOT touch competition score or player MASTER data.
 */
"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const moduleApi=require("../assets/js/kvl-goseong-layout-compare-v1.js");
const html=fs.readFileSync(path.join(__dirname,"../prototypes/kvl-goseong-engine-compare-v1.html"),"utf8");
const data=JSON.parse(fs.readFileSync(path.join(__dirname,"../data/competitions/university-goseong-men-2026/data.json"),"utf8"));
const cfg=JSON.parse(fs.readFileSync(path.join(__dirname,"../data/competitions/university-goseong-men-2026/config.json"),"utf8"));
const components=fs.readFileSync(path.join(__dirname,"../assets/js/kvl-competition-components-v2.js"),"utf8");
const domestic=fs.readFileSync(path.join(__dirname,"../assets/js/kvl-domestic-home-v2.js"),"utf8");
let count=0;
function check(condition,message){assert.ok(condition,message);count++;}
function reject(callback,message){assert.throws(callback,undefined,message);count++;}
check(cfg.slug==="university-goseong-men-2026","correct slug");
check(cfg.competition.competitionFamily==="domestic"&&cfg.competition.gender==="men","protected family/gender");
check(data.status==="completed","finished tournament");
check(data.participants.length===15&&data.matches.length===35,"original records");
check(data.standings.pools.length===3,"original three pools");
const before=JSON.stringify({participants:data.participants,matches:data.matches,standings:data.standings});
const api=moduleApi;
check(api.rules({})==="","no-op has no CSS");
const edited=api.rules({nameMode:"two",nameSize:13,logoSize:46,logoY:-2,logoGap:9,winX:3,lossX:-3,rowPad:10});
check(edited.includes("#rosters .kvl-participant-flag"),"real roster logo selector");
check(edited.includes("#rosters .kvl1180-participant-button-copy strong"),"real roster name selector");
check(edited.includes("#groups .kvl1180-pool-w")&&edited.includes("#groups .kvl1180-pool-l"),"win loss values");
check(edited.includes("nth-child(3)")&&edited.includes("nth-child(4)"),"header alignment");
check(edited.includes("translate(3px,0px)")&&edited.includes("translate(-3px,0px)"),"opposite shifts");
check(components.includes("kvl1180-participant-button-copy")&&components.includes("kvl1180-pool-w"),"real DOM classes verified");
check(domestic.includes("dv2-team-tile"),"real overview classes verified");
reject(()=>api.normalize({customCSS:".body{display:none}"}),"CSS injection blocked");
reject(()=>api.normalize({logoSize:300}),"out-of-range blocked");
reject(()=>api.normalize({heroColor:"url(javascript:foo)"}),"malformed color blocked");
reject(()=>api.applyDocument(null,{}),"invalid document blocked");
reject(()=>api.applyDocument({body:{},head:{},defaultView:{}},{},"v-league-men-2026-27"),"wrong slug blocked");
check(html.includes('value="1180"')&&html.includes('value="390"')&&html.includes('value="360"'),"PC/mobile widths");
check(html.includes('value="rosters"')&&html.includes('value="groups"')&&html.includes('value="schedule"'),"relevant views");
check(html.includes("READ ONLY")&&html.includes("NOT DEPLOYED"),"visible safety note");
const bodyScript=html.match(/<script>([\s\S]*?)<\/script>\s*<\/body>/);
check(!!bodyScript,"inline controller exists");
new Function(bodyScript[1]);count++;
check(JSON.stringify({participants:data.participants,matches:data.matches,standings:data.standings})===before,"source data not changed");
console.log("PASS",count,"Goseong source/DOM/preview guard assertions");
