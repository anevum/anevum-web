import json
import os
import pathlib
import subprocess
import time
import re
import urllib.request
import urllib.error
import tempfile
from playwright.sync_api import sync_playwright

root=pathlib.Path(__file__).resolve().parents[1]
env=os.environ.copy()
env['PORCHLIGHT_FIXTURE_TEST_ONLY']='1'
p=subprocess.Popen(['node','--experimental-sqlite',str(root/'test/preview-server.mjs')],cwd=root,env=env,stdout=subprocess.PIPE,stderr=subprocess.DEVNULL,text=True)
try:
    line=p.stdout.readline().strip()
    if not line: raise RuntimeError('Test-only preview server did not start')
    cfg=json.loads(line)
    url=f"http://127.0.0.1:{cfg['port']}"
    print('Local review origin:',url)
    screenshots=pathlib.Path(os.environ.get('PORCHLIGHT_SCREENSHOT_DIR',str(pathlib.Path(tempfile.gettempdir())/'porchlight-v003-captures')))
    screenshots.mkdir(parents=True,exist_ok=True)
    with sync_playwright() as pw:
        browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
        errors=[]
        requests=[]
        html = (root/'index.html').read_text()
        html = re.sub(r'<link rel="stylesheet"[^>]*>', '', html)
        html = re.sub(r'<script type="module"[^>]*></script>', '', html)
        css = (root/'styles.css').read_text()
        js = (root/'app.mjs').read_text()
        def tab(role=None,width=1440,height=900):
            context=browser.new_context(viewport={'width':width,'height':height},device_scale_factor=1)
            page=context.new_page()
            page.on('pageerror',lambda e:errors.append(str(e)))
            page.on('request',lambda r:requests.append(r.url))
            page.on('dialog',lambda d:d.accept())
            def bridge(payload):
                target=url+payload['path']
                headers={'Accept':'application/json'}
                if payload.get('method')=='POST':
                    headers['Origin']=url
                    headers['Content-Type']='application/json'
                if role:headers['Cookie']='pv_fixture='+cfg['cookies'][role]
                data=payload.get('body')
                req=urllib.request.Request(target,method=payload['method'],headers=headers,
                    data=data.encode() if data is not None else None)
                try:
                    with urllib.request.urlopen(req,timeout=8) as response:
                        return {'status':response.status,'body':response.read().decode()}
                except urllib.error.HTTPError as error:
                    return {'status':error.code,'body':error.read().decode()}
            page.expose_function('__fixtureApiRequest',bridge)
            page.set_content(html,wait_until='domcontentloaded')
            page.add_style_tag(content=css)
            page.evaluate("""() => {
               window.fetch = async (path,opts={}) => {
                 const out=await window.__fixtureApiRequest({path,method:opts.method||'GET',body:opts.body||null});
                 return new Response(out.body,{status:out.status,headers:{'content-type':'application/json'}});
               };
            }""")
            page.add_script_tag(content='(async()=>{'+js+'\n})()')
            page.locator('#session-state').filter(has_not_text='Checking the session...').wait_for()
            return context,page
        guest_ctx,guest=tab()
        assert 'V003 / ISOLATED REVIEW' in guest.locator('.build-pill').inner_text()
        assert '0 homes' == guest.locator('#pin-count').inner_text()
        assert guest.locator('#submit-host').is_disabled()
        assert 'A verified adult session is required' in guest.locator('#session-state').inner_text()
        guest.screenshot(path=str(screenshots/'v003-desktop-before.png'),full_page=True)
        print('Guest: no fake homes or signup enabled')
        host_ctx,host=tab('host-A',390,844)
        host.locator('#session-state').wait_for(state='visible')
        assert 'verified adult session' in host.locator('#session-state').inner_text()
        assert not host.locator('#submit-host').is_disabled()
        host.locator('#host-label').fill('Lantern House')
        host.locator('#host-address').fill('123 Example Lane, Test City FL 00000')
        host.locator('#host-block').select_option('lantern-walk')
        host.locator('input[name=offering][value=candy]').check()
        host.locator('#host-adult').check()
        host.locator('#host-authority').check()
        host.locator('#host-consent').check()
        host.locator('#host-form button[type=submit]').click()
        host.locator('#host-result').wait_for(state='visible')
        assert 'Submitted: pending' in host.locator('#host-result').inner_text()
        assert 'pending' in host.locator('#my-list').inner_text()
        assert guest.locator('#pin-count').inner_text()=='0 homes'
        host.screenshot(path=str(screenshots/'v003-mobile-host.png'),full_page=True)
        print('Host A: submitted without publication')
        host_b_ctx,host_b=tab('host-B',390,844)
        assert 'No applications' in host_b.locator('#my-state').inner_text()
        print('Host B: cannot view host A submissions')
        reviewer_ctx,reviewer=tab('moderator-A')
        queue=reviewer.locator('#review-queue')
        assert '123 Example Lane' in queue.inner_text()
        reviewer.locator('#review-queue textarea').fill('Verified in person with household adult')
        reviewer.locator('#review-queue input[type=checkbox]').check()
        reviewer.locator('#review-queue select').select_option('in-person')
        reviewer.locator('#review-queue button[type=submit]').click()
        reviewer.wait_for_timeout(150)
        assert 'approved' in reviewer.locator('#review-queue').inner_text()
        reviewer.screenshot(path=str(screenshots/'v003-organizer-queue.png'),full_page=True)
        print('Reviewer: authorized approval performed')
        guest.locator('#refresh-directory').click()
        guest.wait_for_function("document.getElementById('pin-count').textContent==='1 home'")
        listing=guest.locator('#pin-list').inner_text()
        assert 'Fictional Lantern Walk' in listing
        assert '123 Example Lane' not in listing
        assert 'host-A' not in listing
        print('Public: only approved general area, no private address')
        host.locator('#refresh-mine').click()
        host.locator('#my-list .danger-button').click()
        host.wait_for_function("document.getElementById('my-list').textContent.includes('Status: withdrawn')")
        guest.locator('#refresh-directory').click()
        guest.wait_for_function("document.getElementById('pin-count').textContent==='0 homes'")
        reviewer.locator('#refresh-queue').click()
        reviewer.wait_for_function("document.getElementById('review-queue').textContent.includes('[deleted]')")
        print('Host withdrawal: public removed and private address scrubbed')
        manager_ctx,manager=tab('manager-A')
        assert manager.locator('#pause-form').is_visible()
        manager.locator('#pause-reason').fill('Test-only safety pause after review')
        manager.locator('#pause-form button').click()
        manager.wait_for_function("document.getElementById('pause-result').textContent.includes('paused')")
        guest.locator('#refresh-directory').click()
        guest.wait_for_function("document.getElementById('directory-state').textContent.includes('inactive')")
        print('Manager: event pause hides all listings')
        additional=[]
        for width in [320,768]:
            test_ctx, test_page=tab(width=width,height=800)
            assert test_page.locator('#directory-state').is_visible()
            assert test_page.locator('#submit-host').is_disabled()
            additional.append((test_ctx,test_page))
        for page in [guest,host,host_b,reviewer,manager]+[pg for _,pg in additional]:
            width=page.evaluate('document.documentElement.scrollWidth')
            inner=page.evaluate('window.innerWidth')
            assert width<=inner+2,f'horizontal overflow {width}>{inner}'
        assert not errors,errors
        assert not requests, f'Unexpected browser external request: {requests}'
        print('Browser: 320/390/768/1440px no JS errors, no overflow or external requests')
        for ctx in [guest_ctx,host_ctx,host_b_ctx,reviewer_ctx,manager_ctx]+[ctx for ctx,_ in additional]:ctx.close()
        browser.close()
    print('PASS: browser end-to-end fixture acceptance')
finally:
    p.terminate()
    try:p.wait(timeout=5)
    except: p.kill()
