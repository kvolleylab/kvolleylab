/* KVL admin-only Goseong layout test page release gate — run via Node. */
"use strict";
const fs=require("node:fs"), path=require("node:path"), assert=require("node:assert/strict");
const root=path.resolve(__dirname,"..");
const read=name=>fs.readFileSync(path.join(root,name),"utf8");
const page=read("admin-competition-layout-test.html");
const editor=read("prototypes/kvl-existing-competition-editor-v2.html");
const comparator=read("prototypes/kvl-goseong-engine-compare-v1.html");
const js=read("assets/js/kvl-goseong-layout-compare-v1.js");
let checks=0;function ok(condition,msg){assert.ok(condition,msg);checks++;}
ok(page.includes("noindex,nofollow,noarchive"),"admin test is not indexable by robots");
ok(page.includes('src="about:blank"')&&page.includes("frame.src=frame.dataset.src"),"editor iframe loads only after authorization");
ok(page.includes("await call('status')")&&page.includes("await showAdmin(session.user)"),"server-side admin check before workspace is visible");
ok(page.includes("enforceScope(editor().exportCurrentDraft())"),"save is restricted to Goseong");
ok(page.includes("enforceScope(editor().exportCurrentDraft()),res=await call('history'"),"history restricted");
ok(page.includes("enforceScope(editor().exportCurrentDraft()),prior=records.find"),"restore restricted");
ok(page.includes("scope==='competition'&&r.scope_key===TEST_SLUG"),"only Goseong saved records used");
ok(page.includes('disabled title="운영 배포 승인과 검증이 필요합니다"'),"publish disabled");
ok(page.includes("admin-competition-layout-drafts"),"existing authenticated backend used");
ok(!page.includes("service_role")&&!page.includes("sb_secret_"),"no server secrets embedded");
ok(page.includes("#saveBtn{")&&page.includes("position:fixed;right:20px;bottom:20px"),"save button remains visible while scrolling outside editor iframe");
ok(page.includes("saveFeedback(message)"),"save success appears in visible status toast");
ok(page.includes('id="saveToast"'),"save toast exists in parent viewport");
ok(page.includes('aria-label="현재 범위 임시저장"'),"save button accessible label preserved");
ok(editor.includes("ADMIN_TEST=")&&editor.includes("adminTest')==='goseong'"),"child knows scoped test mode");
ok(editor.includes("new URL('/data/competitions/',location.origin).href"),"child loads existing site data, not GitHub/raw for test mode");
ok(editor.includes("if(ADMIN_TEST&&slug!==TEST_SLUG)"),"child refuses other competitions");
ok(editor.includes("$('scope').disabled=true"),"child disallows family/global edits");
ok(editor.includes("if(ADMIN_TEST&&(state.config.slug!==TEST_SLUG||state.scope!=='competition'))"),"child prevents manual programmatic scope escalation");
ok(editor.includes("if(ADMIN_TEST&&(r.scope!=='competition'||r.scope_key!==TEST_SLUG))return;"),"child ignores other admin scopes");
ok(comparator.includes("kvl-goseong-layout-tokens-v1")&&js.includes("preview_target_mismatch"),"actual Engine comparison is read-only and slug-scoped");
for(const [name,html,rx] of [
 ["admin",page,/<script type="module">([\s\S]*?)<\/script>/],
 ["editor",editor,/<script>([\s\S]*?)<\/script>\s*<\/body>/],
 ["comparator",comparator,/<script>([\s\S]*?)<\/script>\s*<\/body>/]
]){
 const m=html.match(rx);assert(m,"missing "+name+" script");
 const code=name==="admin"?m[1].replace(/^import\s+\{createClient\}[^\n]*\n/m,""):m[1];
 new Function(code);
 checks++;
}
const data=JSON.parse(read("data/competitions/university-goseong-men-2026/data.json"));
const config=JSON.parse(read("data/competitions/university-goseong-men-2026/config.json"));
ok(config.slug==="university-goseong-men-2026"&&data.status==="completed","real Goseong tournament remains complete");
ok(data.participants.length===15&&data.matches.length===35&&data.standings.pools.length===3,"no score/player changes in source data");
console.log("PASS",checks,"admin layout test page v6 security/contract checks");
