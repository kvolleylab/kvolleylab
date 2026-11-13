"use strict";
// node tests/kvl-layout-draft-jsonb-v1.test.cjs
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const fn=fs.readFileSync(path.join(__dirname,"../supabase/functions/admin-competition-layout-drafts/index.ts"),"utf8");
const param="$"+"{JSON.stringify(tokens)}";
const safe=param+"::text::jsonb";
const unsafe=param+"::jsonb";

assert.equal(fn.split(safe).length-1,4,"all four insert/update/history paths must parse TEXT into JSONB");
assert.equal(fn.split(unsafe).length-1,0,"never bind a JSON.stringify string directly as a JSONB-typed parameter");
assert.match(fn,/const result=await sql\.begin\(async tx=>/,"save/restore must remain atomic");
assert.match(fn,/cleanTokens\(body\.tokens\)/,"save tokens remain validated");
assert.match(fn,/tokens=cleanTokens\(history\[0\]\.tokens\)/,"restored tokens remain validated");
assert.match(fn,/auth\.getUser/,"live user authentication preserved");
assert.match(fn,/kvl_admin_private\.admin_accounts/,"private admin table check preserved");
assert.match(fn,/active=true/,"admin account active check preserved");
assert.match(fn,/revision_conflict/,"409 revision conflict handling preserved");
assert.match(fn,/publish_available:false/,"function must not publish");
assert.doesNotMatch(fn,/github\.com\/repos|deploy_to_production/,"no public source or deployment writes");
console.log("PASS: 11 static guards for four JSONB writes and administrator boundaries");
