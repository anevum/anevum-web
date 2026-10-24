#!/usr/bin/env python3
"""Compiled actual-home-and-Discover React UI review (no live backend contact).
Serves only an opt-in local production-format build, returns honest empty public
catalogue fixtures, denies all API writes and retains source-bound screenshots.
"""
from http.server import SimpleHTTPRequestHandler
from urllib.parse import urlparse
from pathlib import Path
from threading import Thread
import json, socketserver
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
DIST=ROOT / "dist" / "web"
EVIDENCE=ROOT.parent / "evidence" / "continuance-sitewide-real-react"
EVIDENCE.mkdir(parents=True,exist_ok=True)
if not (DIST/"index.html").is_file(): raise SystemExit("Missing built React application")
writes=[]; queries=[]; errors=[]
class Handler(SimpleHTTPRequestHandler):
    def __init__(self,*args,**kwargs): super().__init__(*args,directory=str(DIST),**kwargs)
    def log_message(self,*args,**kwargs): pass
    def do_GET(self):
        path=urlparse(self.path).path
        if path.startswith("/api/"):
            queries.append(path)
            if "get-session" in path or path.endswith("/session"):
                data=None
            elif path.startswith("/api/v1/projects"):
                data={"items":[],"nextCursor":None}
            elif path.startswith("/api/v1/creators"):
                data={"items":[],"nextCursor":None}
            elif path.startswith("/api/v1/categories"):
                data={"categories":[]}
            elif path.startswith("/api/v1/status"):
                # Honest unavailable-status response: never label fixture counts VERIFIED.
                data={"error":"Isolated local review: status service unavailable"}
            else:
                data={"message":"Isolated local visual review. No service connected."}
            body=json.dumps(data).encode()
            self.send_response(503 if path.startswith("/api/v1/status") else 200)
            self.send_header("Content-Type","application/json; charset=utf-8")
            self.send_header("Content-Length",str(len(body)))
            self.send_header("Cache-Control","no-store")
            self.end_headers();self.wfile.write(body);return
        file=(DIST/path.lstrip("/"))
        if path in ["/","/discover"] or not file.is_file():
            self.path="/index.html"
        return super().do_GET()
    def do_POST(self):
        writes.append(("POST",self.path));self.send_error(405,"Read only browser QA")
    def do_PUT(self):
        writes.append(("PUT",self.path));self.send_error(405,"Read only browser QA")
    def do_PATCH(self):
        writes.append(("PATCH",self.path));self.send_error(405,"Read only browser QA")
    def do_DELETE(self):
        writes.append(("DELETE",self.path));self.send_error(405,"Read only browser QA")
class Server(socketserver.ThreadingMixIn,socketserver.TCPServer):
    allow_reuse_address=True;daemon_threads=True
server=Server(("127.0.0.1",0),Handler)
Thread(target=server.serve_forever,daemon=True).start()
base=f"http://127.0.0.1:{server.server_address[1]}"
checks=[];failures=[]
def check(name,condition):
    ok=bool(condition);checks.append({"name":name,"pass":ok})
    if not ok:failures.append(name)
def loaded_image(page,selector):
    try:
        return bool(page.locator(selector).first.evaluate("(image)=> image.complete && image.naturalWidth > 0 && /community-portals/.test(image.currentSrc)"))
    except Exception: return False

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,args=["--no-sandbox"])
    for width,height,dpr in ((320,760,2),(390,844,3),(768,960,2),(1440,900,2),(1920,1080,2)):
        ctx=browser.new_context(viewport={"width":width,"height":height},
                                device_scale_factor=dpr,
                                reduced_motion="no-preference",color_scheme="dark")
        page=ctx.new_page()
        page_errors=[];external=[]
        page.on("pageerror",lambda e:page_errors.append(str(e)))
        console_errors=[]
        failed_requests=[]
        page.on("console",lambda m:console_errors.append(m.text) if m.type=="error" else None)
        page.on("requestfailed",lambda r:failed_requests.append(r.url))
        page.on("request",lambda r:external.append(r.url) if not r.url.startswith(base) else None)
        page.goto(base+"/",wait_until="domcontentloaded",timeout=30000)
        try:
            page.locator(".av-next-cinema").wait_for(timeout=12000)
        except Exception:
            diagnostic={"viewport":width,"url":page.url,"body":page.locator("body").inner_text(timeout=2500)[:5000],
                        "root_html":page.locator("#root").inner_html(timeout=2500)[:4500] if page.locator("#root").count() else "missing root",
                        "page_errors":page_errors,"console_errors":console_errors,"failed_requests":failed_requests,
                        "external":external,"request_paths":queries[:30]}
            (EVIDENCE/"runtime-diagnostic.json").write_text(json.dumps(diagnostic,indent=2))
            page.screenshot(path=str(EVIDENCE/f"runtime-debug-{width}.png"),full_page=False)
            print("ANEVUM REACT BROWSER DIAGNOSTIC:",json.dumps(diagnostic,indent=2))
            raise
        check(f"{width}: real canonical homepage",page.locator(".av79-home.av-next-cinema").count()==1)
        check(f"{width}: current real heading",page.locator("#av79-home-heading").count()==1)
        check(f"{width}: canonical one IREN guide button",page.get_by_role("button",name="MEET IREN").count()==1)
        check(f"{width}: responsive real homepage image loaded",loaded_image(page,".av-next-arrival-art img"))
        check(f"{width}: no manual motion button",page.locator(".av125-motion-toggle").count()==0)
        check(f"{width}: no horizontal overflow on homepage",page.evaluate("document.documentElement.scrollWidth <= innerWidth+1"))
        page.screenshot(path=str(EVIDENCE/f"home-{width}-dpr{dpr}.png"),full_page=True,animations="disabled")
        page.get_by_role("link",name="Enter ANEVUM").first.click()
        page.locator(".av-next-discover").wait_for(timeout=20000)
        check(f"{width}: real Discover route with flags",page.locator(".av73-discover.av-next-discover").count()==1)
        check(f"{width}: real Discover heading",page.locator(".av73-discover-intro h1").count()==1)
        check(f"{width}: full width creative art loaded",loaded_image(page,".av-next-discover-art img"))
        check(f"{width}: real catalogue search still mounted",page.locator("form.portal-wide-search input").count()==1)
        check(f"{width}: real filter choices still mounted",page.locator(".portal-channel-filters button").count()>=6)
        check(f"{width}: no synthetic cards",page.locator(".portal-discover-results .project-card").count()==0)
        check(f"{width}: no horizontal overflow on Discover",page.evaluate("document.documentElement.scrollWidth <= innerWidth+1"))
        page.screenshot(path=str(EVIDENCE/f"discover-{width}-dpr{dpr}.png"),full_page=True,animations="disabled")
        page.get_by_role("button",name="Apps & Tools").first.click()
        check(f"{width}: category changes actual query",("category=tools" in page.url))
        check(f"{width}: no unexpected external requests",len(external)==0)
        check(f"{width}: no uncaught runtime errors",len(page_errors)==0)
        errors.extend([f"{width}: "+x for x in page_errors])
        ctx.close()
    ctx=browser.new_context(viewport={"width":390,"height":844},reduced_motion="reduce")
    page=ctx.new_page();page.goto(base+"/",wait_until="domcontentloaded",timeout=30000)
    check("OS reduced motion preserves homepage",page.locator(".av79-home").count()==1)
    check("OS reduced motion disables decorative motion",page.evaluate("""() => { const a=document.querySelector('.av125-signal-atlas .av125-atlas-beacon-sweep');return !a || getComputedStyle(a).animationName==='none' || getComputedStyle(a).animationDuration==='0s';}"""))
    check("No manual motion control under reduced motion",page.locator(".av125-motion-toggle").count()==0)
    ctx.close();browser.close()
server.shutdown()
check("No write requests whatsoever",len(writes)==0)
receipt={"source":"opt-in compiled real React homepage+Discover; isolated read-only API fixtures",
         "checks":len(checks),"passed":len(checks)-len(failures),
         "failures":failures,"writes":writes,"endpoint_paths":sorted(set(queries)),
         "runtime_errors":errors,"details":checks}
(EVIDENCE/"browser-results.json").write_text(json.dumps(receipt,indent=2))
print(json.dumps({k:v for k,v in receipt.items() if k!="details"},indent=2))
if failures: raise SystemExit(1)
