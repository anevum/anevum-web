#!/usr/bin/env python3
"""Source-bound read-only Chromium review of IREN /updates and preference pages.
No live backend, subscriptions, external requests, deployment or mail delivery.
"""
import json,socketserver
from http.server import SimpleHTTPRequestHandler
from pathlib import Path
from threading import Thread
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
DIST=ROOT/'dist'/'web'
OUT=ROOT.parent/'evidence'/'iren-communications-v026'
OUT.mkdir(parents=True,exist_ok=True)
if not (DIST/'index.html').exists() or not (DIST/'communications'/'updates.v1.json').exists():
    raise SystemExit('Missing compiled React site or approved public release file')
writes=[]
class Handler(SimpleHTTPRequestHandler):
    def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(DIST),**kwargs)
    def log_message(self,*args,**kwargs):pass
    def do_GET(self):
        path=urlparse(self.path).path
        if path.startswith('/api/'):
            raw=b'{"error":"Isolated read-only browser QA; no account or communications backend."}'
            self.send_response(503);self.send_header('Content-Type','application/json; charset=utf-8')
            self.send_header('Cache-Control','no-store');self.send_header('Content-Length',str(len(raw)))
            self.end_headers();self.wfile.write(raw);return
        if not (DIST/path.lstrip('/')).is_file():self.path='/index.html'
        return super().do_GET()
    def do_POST(self):writes.append(('POST',self.path));self.send_error(405)
    def do_PUT(self):writes.append(('PUT',self.path));self.send_error(405)
    def do_DELETE(self):writes.append(('DELETE',self.path));self.send_error(405)
    def do_PATCH(self):writes.append(('PATCH',self.path));self.send_error(405)
class Server(socketserver.ThreadingMixIn,socketserver.TCPServer):
    allow_reuse_address=True
    daemon_threads=True
server=Server(('127.0.0.1',0),Handler)
Thread(target=server.serve_forever,daemon=True).start()
base=f'http://127.0.0.1:{server.server_address[1]}'
checks=[];failed=[];runtime=[]
def check(name,value):
    passed=bool(value);checks.append({'name':name,'passed':passed})
    if not passed:failed.append(name)

with sync_playwright() as playwright:
    browser=playwright.chromium.launch(headless=True,args=['--no-sandbox'])
    for width,height,dpr in [(320,760,2),(390,844,3),(768,920,2),(1440,900,2)]:
        ctx=browser.new_context(viewport={'width':width,'height':height},device_scale_factor=dpr,
                                reduced_motion='reduce',color_scheme='dark')
        page=ctx.new_page()
        errors=[];outbound=[]
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.on('request',lambda request:outbound.append(request.url) if not request.url.startswith(base) else None)
        page.goto(base+'/updates',wait_until='domcontentloaded',timeout=30000)
        page.locator('article.au26-entry').first.wait_for(timeout=20000)
        check(f'{width}: real archive mounted',page.locator('.au26-page .au26-updates').count()==1)
        check(f'{width}: approved V131 note displayed',page.get_by_role('heading',name='ANEVUM V131 is live').count()==1)
        check(f'{width}: current source record has one visible entry',page.locator('article.au26-entry').count()==1)
        check(f'{width}: email signup stays disabled',page.locator('.au26-optin-pending').count()==1 and page.locator('.au26-optin-form').count()==0)
        check(f'{width}: canonical OrbitalMark visible',page.locator('.au26-masthead svg').count()==1)
        check(f'{width}: exactly one existing IREN dock',page.locator('button.ir80-dock').count()==1)
        check(f'{width}: archive no horizontal overflow',page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
        page.screenshot(path=str(OUT/f'updates-{width}-dpr{dpr}.png'),full_page=True,animations='disabled')
        page.goto(base+'/updates/preferences',wait_until='domcontentloaded',timeout=30000)
        page.get_by_role('heading',name='Manage your updates').wait_for(timeout=20000)
        check(f'{width}: preferences are not prematurely enabled',page.get_by_text('Email preference changes are not yet available.').count()==1)
        check(f'{width}: no active management form under disabled flag',page.locator('.au26-optin-form').count()==0)
        check(f'{width}: preference page no x overflow',page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
        page.screenshot(path=str(OUT/f'preferences-{width}-dpr{dpr}.png'),full_page=True,animations='disabled')
        check(f'{width}: no client exceptions',not errors)
        check(f'{width}: no external requests',not outbound)
        runtime.extend(errors);ctx.close()
    browser.close()
server.shutdown()
check('no email, account, or other write request issued',not writes)
receipt={'mode':'compiled React; read-only local API fixtures; all mail disabled',
         'checks':len(checks),'passed':len(checks)-len(failed),'failures':failed,
         'writes':writes,'runtime_errors':runtime,'details':checks}
(OUT/'browser-results.json').write_text(json.dumps(receipt,indent=2))
print(json.dumps({k:v for k,v in receipt.items() if k!='details'},indent=2))
if failed:raise SystemExit(1)
