"""End-to-end admin draft UI test against a FAKE local Supabase service.

This exercises the actual browser page, bundled Supabase JS client and real
completed Goseong competition data, but swaps auth/API calls for a local
file-backed SQLite simulator. It NEVER contacts/writes the real Supabase project.

Run:
  python scripts/build-goseong-local-engine-preview-v2.py /tmp/kvl-goseong-v4
  python scripts/qa-admin-layout-draft-e2e-v4.py /tmp/kvl-goseong-v4
"""
from __future__ import annotations
from base64 import urlsafe_b64encode
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlsplit
import argparse
import json
import sqlite3
import tempfile
import time
from uuid import UUID

SLUG = "university-goseong-men-2026"
SUPABASE_HOST = "byaukvbwdhextiqycrds.supabase.co"
ADMIN_ID = "11111111-1111-4111-8111-111111111111"
VIEWER_ID = "22222222-2222-4222-8222-222222222222"
BASE_MAIL = "admin@fixture.invalid"
VIEWER_MAIL = "viewer@fixture.invalid"
FIXTURE_PASS = "fixture-only-not-a-real-password"


def jwt_for(user_id: str) -> str:
    """Synthetic, UNSIGNED token never accepted by Supabase, only by mock route."""
    def b64(obj):
        s=json.dumps(obj,separators=(",",":")).encode()
        return urlsafe_b64encode(s).decode().rstrip("=")
    return ".".join([b64({"alg":"none","typ":"JWT"}),
                     b64({"iss":"local-fixture","role":"authenticated",
                          "sub":user_id,"exp":int(time.time())+7200}),"fixture"])


TOKENS={ADMIN_ID:jwt_for(ADMIN_ID),VIEWER_ID:jwt_for(VIEWER_ID)}


def user_data(user_id: str) -> dict:
    return {
        "id":user_id,"email":BASE_MAIL if user_id==ADMIN_ID else VIEWER_MAIL,
        "aud":"authenticated","role":"authenticated","app_metadata":{"provider":"email","providers":["email"]},
        "user_metadata":{},"created_at":"2026-01-01T00:00:00.000Z",
        "updated_at":"2026-01-01T00:00:00.000Z"
    }


class DraftSimulator:
    """SQLite persistence across browser reloads, not a Supabase SQL/RLS test."""
    def __init__(self, db_path: Path):
        self.path=db_path
        with self.conn() as db:
            db.executescript("""
                create table if not exists drafts(
                  user_id text not null, scope text not null, scope_key text not null,
                  tokens text not null, revision integer not null, updated_at text not null,
                  primary key(user_id,scope,scope_key)
                );
                create table if not exists revisions(
                  user_id text not null, scope text not null, scope_key text not null,
                  revision integer not null, tokens text not null, action text not null,
                  created_at text not null,
                  primary key(user_id,scope,scope_key,revision)
                );
            """)
    def conn(self):
        return sqlite3.connect(self.path)

    def get(self, user_id, scope="competition", key=SLUG):
        with self.conn() as db:
            r=db.execute("select tokens, revision from drafts where user_id=? and scope=? and scope_key=?",
                         (user_id,scope,key)).fetchone()
        return {"tokens":json.loads(r[0]),"revision":r[1]} if r else None

    def handle(self, token: str, body: dict):
        if token not in TOKENS.values():
            return 401,{"ok":False,"error":"invalid_session"}
        user_id=next(k for k,v in TOKENS.items() if v==token)
        if user_id!=ADMIN_ID:
            return 403,{"ok":False,"error":"admin_only"}
        action=body.get("action")
        if action=="status":
            return 200,{"ok":True,"mode":"draft_only","publish_available":False}
        if action=="list":
            with self.conn() as db:
                entries=db.execute(
                    "select scope,scope_key,tokens,revision,updated_at from drafts where user_id=?",
                    (user_id,)).fetchall()
            return 200,{"ok":True,"items":[
                {"scope":e[0],"scope_key":e[1],"tokens":json.loads(e[2]),"revision":e[3],"updated_at":e[4]}
                for e in entries]}
        scope=body.get("scope")
        key=body.get("scope_key")
        if not ((scope=="all" and key=="all") or
                (scope=="family" and key in ("domestic","international","pro")) or
                (scope=="competition" and isinstance(key,str) and key==SLUG)):
            return 400,{"ok":False,"error":"invalid_scope"}
        if action=="history":
            current=self.get(user_id,scope,key)
            with self.conn() as db:
                rows=db.execute(
                    "select revision,action,created_at,tokens from revisions where user_id=? and scope=? and scope_key=? order by revision desc limit 40",
                    (user_id,scope,key)).fetchall()
            return 200,{"ok":True,"current_revision":current["revision"] if current else None,
                        "items":[{"revision":r[0],"action":r[1],"created_at":r[2],"tokens":json.loads(r[3])} for r in rows]}
        if action not in ("save","restore"):
            return 400,{"ok":False,"error":"unknown_action"}
        if "expected_revision" not in body or (body["expected_revision"] is not None and
                (not isinstance(body["expected_revision"],int) or body["expected_revision"]<1)):
            return 400,{"ok":False,"error":"invalid_revision"}
        if action=="save":
            tokens=body.get("tokens")
            if not isinstance(tokens,dict) or any(k not in (
                "nameMode","nameSize","logoSize","logoX","logoY","logoGap","tableFont",
                "rowPad","winWidth","lossWidth","winX","lossX","statY",
                "heroFit","heroPosition","heroFont","heroColor"
            ) for k in tokens):
                return 400,{"ok":False,"error":"invalid_tokens"}
        else:
            restore=body.get("restore_revision")
            if not isinstance(restore,int) or restore<1:
                return 400,{"ok":False,"error":"invalid_restore_revision"}

        with self.conn() as db:
            existing=db.execute(
                "select tokens,revision from drafts where user_id=? and scope=? and scope_key=?",
                (user_id,scope,key)).fetchone()
            prior_revision=existing[1] if existing else None
            if body["expected_revision"]!=prior_revision:
                return 409,{"ok":False,"error":"revision_conflict","current_revision":prior_revision}
            if action=="restore":
                prev=db.execute(
                    "select tokens from revisions where user_id=? and scope=? and scope_key=? and revision=?",
                    (user_id,scope,key,restore)).fetchone()
                if not prev:
                    return 404,{"ok":False,"error":"revision_not_found"}
                tokens=json.loads(prev[0])
            revision=(prior_revision or 0)+1
            now=datetime.now(timezone.utc).isoformat()
            db.execute(
                """insert into drafts(user_id,scope,scope_key,tokens,revision,updated_at)
                values(?,?,?,?,?,?) on conflict(user_id,scope,scope_key) do update set
                tokens=excluded.tokens,revision=excluded.revision,updated_at=excluded.updated_at""",
                (user_id,scope,key,json.dumps(tokens),revision,now))
            db.execute(
                "insert into revisions(user_id,scope,scope_key,revision,tokens,action,created_at) values(?,?,?,?,?,?,?)",
                (user_id,scope,key,revision,json.dumps(tokens),action,now))
        return 200,{"ok":True,"scope":scope,"scope_key":key,"revision":revision,
                    "tokens":tokens,"mode":"draft_only"}

    def force_revision(self, target_revision: int):
        with self.conn() as db:
            db.execute("update drafts set revision=? where user_id=? and scope='competition' and scope_key=?",
                       (target_revision,ADMIN_ID,SLUG))


def fixture_headers(origin="*"):
    return {
        "content-type":"application/json; charset=utf-8",
        "access-control-allow-origin":origin,
        "access-control-allow-headers":"authorization,apikey,x-client-info,content-type",
        "access-control-allow-methods":"POST,GET,OPTIONS",
        "cache-control":"no-store",
    }


def run(root: Path, output: Path, executable: str | None = None):
    from playwright.sync_api import sync_playwright
    import importlib.util
    qa_path = Path(__file__).with_name("qa-goseong-local-engine-v2.py")
    spec = importlib.util.spec_from_file_location("kvl_goseong_qa_server", qa_path)
    qa_module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(qa_module)
    serve = qa_module.serve

    output.mkdir(parents=True,exist_ok=True)
    errors=[]
    requests={"supabase":0,"github":0,"blocked":0}
    with tempfile.TemporaryDirectory(prefix="kvl-drafts-e2e-") as tmp:
        store=DraftSimulator(Path(tmp)/"drafts.sqlite3")
        with serve(root) as origin, sync_playwright() as p:
            params={"headless":True}
            if executable:
                params["executable_path"]=executable
            browser=p.chromium.launch(**params)
            context=browser.new_context(viewport={"width":1280,"height":900},device_scale_factor=1,accept_downloads=True)

            def handler(route):
                req=route.request
                u=urlsplit(req.url)
                if req.url.startswith(origin+"/"):
                    return route.continue_()
                if u.netloc in ("raw.githubusercontent.com","api.github.com"):
                    requests["github"]+=1
                    if u.netloc=="api.github.com" and u.path.endswith("/git/trees/main"):
                        body={"tree":[{"path":"data/competitions/"+s+"/config.json"} for s in
                              (SLUG,"university-goseong-women-2026")]}
                        return route.fulfill(status=200,headers=fixture_headers(),body=json.dumps(body))
                    prefix="/kvolleylab/kvolleylab/main/"
                    if u.netloc=="raw.githubusercontent.com" and u.path.startswith(prefix):
                        item=u.path[len(prefix):]
                        if (item.startswith("data/competitions/university-goseong-") and
                            item.endswith(("/config.json","/data.json")) and ".." not in item):
                            src=root/item
                            if src.is_file():
                                return route.fulfill(status=200,headers=fixture_headers(),body=src.read_bytes())
                    return route.fulfill(status=404,headers=fixture_headers(),body='{"error":"fixture_not_found"}')
                if u.netloc=="kvolleylab.com" and u.path.startswith("/assets/"):
                    file=root/u.path.lstrip("/")
                    if file.is_file():
                        ext=file.suffix.lower()
                        mime=("image/svg+xml" if ext==".svg" else "image/webp" if ext==".webp"
                              else "image/jpeg" if ext in (".jpg",".jpeg") else "application/octet-stream")
                        return route.fulfill(status=200,headers={"content-type":mime,
                                           "access-control-allow-origin":"*"},body=file.read_bytes())
                    return route.abort()
                if u.netloc==SUPABASE_HOST:
                    requests["supabase"]+=1
                    headers=fixture_headers(origin)
                    if req.method=="OPTIONS":
                        return route.fulfill(status=204,headers=headers,body="")
                    if u.path=="/auth/v1/token":
                        try:
                            body=req.post_data_json
                        except:
                            body={}
                        email=body.get("email")
                        ident=ADMIN_ID if email==BASE_MAIL else VIEWER_ID if email==VIEWER_MAIL else None
                        if ident is None or body.get("password")!=FIXTURE_PASS:
                            return route.fulfill(status=400,headers=headers,body=json.dumps(
                                {"error":"invalid_grant","error_description":"Invalid login credentials"}))
                        response={"access_token":TOKENS[ident],"refresh_token":"fixture-"+ident,
                                  "expires_in":7200,"token_type":"bearer","user":user_data(ident)}
                        return route.fulfill(status=200,headers=headers,body=json.dumps(response))
                    if u.path=="/auth/v1/logout":
                        return route.fulfill(status=204,headers=headers,body="")
                    if u.path=="/auth/v1/user":
                        token=req.headers.get("authorization","").removeprefix("Bearer ")
                        ident=next((k for k,v in TOKENS.items() if token==v),None)
                        return route.fulfill(status=200 if ident else 401,headers=headers,
                            body=json.dumps(user_data(ident) if ident else {"error":"invalid_token"}))
                    if u.path=="/functions/v1/admin-competition-layout-drafts":
                        token=req.headers.get("authorization","").removeprefix("Bearer ")
                        body=req.post_data_json if req.post_data else {}
                        status,payload=store.handle(token,body)
                        return route.fulfill(status=status,headers=headers,body=json.dumps(payload))
                    return route.fulfill(status=404,headers=headers,body='{"error":"fixture_not_found"}')
                requests["blocked"]+=1
                return route.abort()

            context.route("**/*",handler)
            page=context.new_page()
            page.on("pageerror",lambda error:errors.append(str(error)))
            checks=[]
            def tick(msg): checks.append(msg)
            try:
                page.goto(origin+"/admin-competition-layout-v3.html",wait_until="domcontentloaded",timeout=25000)
                page.locator("#loginView").wait_for(state="visible",timeout=12000)
                tick("login form shown without session")
                page.locator("#email").fill(BASE_MAIL)
                page.locator("#password").fill(FIXTURE_PASS)
                page.locator("#loginForm button").click()
                try:
                    page.locator("#workspace").wait_for(state="visible",timeout=12000)
                except Exception as failed:
                    info={"loginMessage":page.locator("#loginMessage").inner_text(),
                          "requests":requests,"pageErrors":errors,
                          "message":"fixture-only fake login, no real Supabase calls"}
                    (output/"login-diagnostic.json").write_text(
                        json.dumps(info,ensure_ascii=False,indent=2)+"\\n",encoding="utf-8")
                    page.screenshot(path=str(output/"login-diagnostic.png"),full_page=False)
                    raise AssertionError("Mock admin login did not advance: "+str(info)) from failed
                page.locator("#draftMessage").get_by_text("불러왔습니다",exact=False).wait_for(timeout=16000)
                page.wait_for_function(
                    "() => document.querySelector('#editorFrame')?.contentWindow?.KVLExistingEditorV2?.currentSlug?.()==='university-goseong-men-2026'",
                    timeout=16000)
                tick("mock administrator role allows existing Goseong editor")
                frame=page.frame_locator("#editorFrame")
                frame.locator('[data-field="logoSize"]').evaluate(
                    "(el) => {el.value='52';el.dispatchEvent(new Event('input',{bubbles:true}));}")
                page.locator("#saveBtn").click()
                page.locator("#draftMessage").get_by_text("임시저장 완료",exact=False).wait_for(timeout=12000)
                saved=store.get(ADMIN_ID)
                assert saved and saved["revision"]==1 and saved["tokens"].get("logoSize")==52,saved
                tick("first scoped draft saved in SQLite fixture")
                page.screenshot(path=str(output/"draft-save.png"),full_page=False)
                page.reload(wait_until="domcontentloaded",timeout=25000)
                page.locator("#workspace").wait_for(state="visible",timeout=16000)
                page.locator("#draftMessage").get_by_text("불러왔습니다",exact=False).wait_for(timeout=16000)
                page.wait_for_function(
                    "() => document.querySelector('#editorFrame')?.contentWindow?.KVLExistingEditorV2?.currentSlug?.()==='university-goseong-men-2026'",
                    timeout=16000)
                frame=page.frame_locator("#editorFrame")
                assert frame.locator('[data-field="logoSize"]').input_value()=="52"
                tick("browser reload restores persisted draft")
                frame.locator('[data-field="logoSize"]').evaluate(
                    "(el) => {el.value='60';el.dispatchEvent(new Event('input',{bubbles:true}));}")
                page.locator("#saveBtn").click()
                page.locator("#draftMessage").get_by_text("임시저장 완료",exact=False).wait_for(timeout=12000)
                saved=store.get(ADMIN_ID)
                assert saved and saved["revision"]==2 and saved["tokens"].get("logoSize")==60,saved
                tick("second save creates revision 2")
                page.locator("#historyBtn").click()
                page.locator("#revisionBox option[value='1']").wait_for(timeout=12000)
                page.locator("#revisionBox").select_option("1")
                page.locator("#restoreBtn").click()
                page.locator("#draftMessage").get_by_text("복원했습니다",exact=False).wait_for(timeout=12000)
                saved=store.get(ADMIN_ID)
                assert saved and saved["revision"]==3 and saved["tokens"].get("logoSize")==52,saved
                assert frame.locator('[data-field="logoSize"]').input_value()=="52"
                tick("restore revision 1 as revision 3; editor synchronized")
                page.screenshot(path=str(output/"draft-restored.png"),full_page=False)

                # Another administrator window writes the same draft after our last list.
                store.force_revision(4)
                frame.locator('[data-field="logoSize"]').evaluate(
                    "(el) => {el.value='54';el.dispatchEvent(new Event('input',{bubbles:true}));}")
                page.locator("#saveBtn").click()
                page.locator("#draftMessage").get_by_text("다른 창에서 변경된 설정",exact=False).wait_for(timeout=12000)
                tick("409 optimistic concurrency mismatch shown to user")
                page.screenshot(path=str(output/"draft-conflict.png"),full_page=False)

                page.locator("#logoutBtn").click()
                page.locator("#loginView").wait_for(state="visible",timeout=12000)
                page.locator("#email").fill(VIEWER_MAIL)
                page.locator("#password").fill(FIXTURE_PASS)
                page.locator("#loginForm button").click()
                page.locator("#loginMessage").get_by_text("admin_only",exact=False).wait_for(timeout=12000)
                assert page.locator("#workspace").is_hidden()
                tick("non-admin user denied even after valid mock login")
                assert requests["blocked"]==0,requests
                assert not errors,errors
                result={"status":"PASS","mockedSupabase":True,"mockedAuth":True,
                        "realSupabaseWrites":False,"productionDeploy":False,
                        "competition":SLUG,"checks":checks,"pageErrors":errors,
                        "network":requests,
                        "finalDraftRevision":store.get(ADMIN_ID)["revision"]}
                (output/"admin-draft-e2e.json").write_text(
                    json.dumps(result,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
                return result
            finally:
                browser.close()


if __name__=="__main__":
    parser=argparse.ArgumentParser()
    parser.add_argument("preview_root",type=Path)
    parser.add_argument("--output",type=Path,default=Path("admin-draft-qa-v4"))
    parser.add_argument("--chromium",type=str,default=None)
    args=parser.parse_args()
    result=run(args.preview_root.resolve(),args.output.resolve(),args.chromium)
    print(json.dumps(result,ensure_ascii=False,indent=2))
