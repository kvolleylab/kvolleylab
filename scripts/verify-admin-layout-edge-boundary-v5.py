"""Live, read-only boundary smoke test for KVL layout draft Edge Function.

No credentials, no writes, and no action-specific data changes. Runs only
OPTIONS and rejected unauthenticated requests to the new endpoint.
Authenticated CRUD requires a separately approved admin browser test.
"""
import json
import sys
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

ENDPOINT = "https://byaukvbwdhextiqycrds.supabase.co/functions/v1/admin-competition-layout-drafts"
ORIGIN = "https://kvolleylab.com"

def fetch(method, data=None, headers=None):
    req=Request(ENDPOINT,data=data,method=method,headers=headers or {})
    try:
        resp=urlopen(req,timeout=18)
    except HTTPError as err:
        resp=err
    with resp:
        body=resp.read(2048).decode("utf-8","replace")
        return resp.status, dict(resp.headers.items()), body

def main():
    checks=[]
    status,headers,body=fetch("OPTIONS",headers={
        "Origin":ORIGIN,
        "Access-Control-Request-Method":"POST",
        "Access-Control-Request-Headers":"authorization,apikey,content-type",
    })
    assert status==204,(status,body[:180])
    assert headers.get("Access-Control-Allow-Origin") == ORIGIN,headers
    checks.append("browser CORS preflight is 204 and confined to KVL origin")

    for label,headers in [
        ("anonymous POST",{"Content-Type":"application/json","Origin":ORIGIN}),
        ("malformed JWT POST",{"Content-Type":"application/json","Origin":ORIGIN,
                                "Authorization":"Bearer intentionally-invalid-token"}),
    ]:
        status,response_headers,body=fetch("POST",data=b'{"action":"status"}',headers=headers)
        assert status in (401,403),(label,status,body[:250])
        assert '"ok":true' not in body,(label,body[:100])
        checks.append(label+" rejected with HTTP "+str(status))

    print(json.dumps({"status":"PASS","endpoint":"admin-competition-layout-drafts",
                      "anonymousRequestsOnly":True,
                      "realUserTokensUsed":False,
                      "writes":False,"checks":checks},ensure_ascii=False,indent=2))

if __name__=="__main__":
    try:
        main()
    except (AssertionError, URLError, TimeoutError) as err:
        print("LIVE_EDGE_BOUNDARY_CHECK_FAILED:",str(err)[:600],file=sys.stderr)
        sys.exit(1)
