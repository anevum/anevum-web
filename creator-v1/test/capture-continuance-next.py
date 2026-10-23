"""Browser acceptance for a compiled, local-only React review. No production URLs."""
import functools
import json
import os
from pathlib import Path
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from threading import Thread
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[2]
BUILD = ROOT / 'creator-v1/dist/continuance-next-review'
OUT = ROOT / 'evidence/continuance-next'
OUT.mkdir(parents=True, exist_ok=True)
assert (BUILD / 'review/continuance-next/index.html').is_file(), 'Build the explicit review first.'
class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *_args):
        pass
server = ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(QuietHandler, directory=str(BUILD)))
Thread(target=server.serve_forever, daemon=True).start()
origin = 'http://127.0.0.1:' + str(server.server_address[1])
url = origin + '/review/continuance-next/'
checks, errors, blocked = [], [], []
def passed(name):
    checks.append({'name': name, 'passed': True})
try:
    with sync_playwright() as p:
        options = {'headless': True}
        if os.getenv('PLAYWRIGHT_CHROMIUM_EXECUTABLE'):
            options['executable_path'] = os.environ['PLAYWRIGHT_CHROMIUM_EXECUTABLE']
        browser = p.chromium.launch(**options)
        context = browser.new_context(viewport={'width': 1440, 'height': 1000}, device_scale_factor=2)
        def route_request(route):
            parsed = urlsplit(route.request.url)
            if parsed.scheme + '://' + parsed.netloc != origin:
                blocked.append(route.request.url)
                route.abort()
            else:
                route.continue_()
        context.route('**/*', route_request)
        page = context.new_page()
        page.on('pageerror', lambda error: errors.append(str(error)))
        for width, height in [(1440,1000),(1024,768),(768,1024),(390,844),(320,568)]:
            page.set_viewport_size({'width': width, 'height': height})
            for view in ['Arrival', 'Discover', 'Creator Studio']:
                page.goto(url)
                page.get_by_role('navigation', name='Review views').get_by_role('button', name=view, exact=True).click()
                expect(page.locator('h1')).to_be_visible()
                assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth + 1'), (view, width)
                if view != 'Arrival':
                    expect(page.locator('h1')).to_be_focused()
                page.screenshot(path=str(OUT / (view.lower().replace(' ', '-') + '-' + str(width) + '.png')), full_page=True, animations='disabled')
                passed('layout:' + view + ':' + str(width))
        page.set_viewport_size({'width':1440,'height':1000})
        page.goto(url)
        nav = page.get_by_role('navigation', name='Review views')
        nav.get_by_role('button', name='Creator Studio', exact=True).click()
        title = page.get_by_label('Scene title', exact=True)
        description = page.get_by_label('Description', exact=True)
        page.get_by_role('button', name='Inspect suggested change', exact=True).click()
        page.get_by_role('button', name='Apply to local example', exact=True).click()
        expect(title).to_have_value('Opening scene')
        page.get_by_role('button', name='Undo local change', exact=True).click()
        expect(title).to_have_value('Untitled scene')
        passed('apply-and-undo')
        page.get_by_role('button', name='Inspect suggested change', exact=True).click()
        title.fill('My later title')
        expect(page.get_by_role('button', name='Apply to local example', exact=True)).to_be_disabled()
        page.get_by_role('button', name='Cancel proposal', exact=True).click()
        expect(title).to_have_value('My later title')
        passed('stale-proposal-denied')
        page.get_by_role('button', name='Inspect suggested change', exact=True).click()
        page.get_by_role('button', name='Apply to local example', exact=True).click()
        description.fill('Human work after application')
        page.get_by_role('button', name='Undo local change', exact=True).click()
        expect(page.get_by_role('status')).to_contain_text('Newer edits exist')
        expect(description).to_have_value('Human work after application')
        passed('undo-preserves-later-edit')
        title.fill('')
        expect(title).to_have_value('')
        title.fill('<img src=x onerror=alert(1)>')
        expect(page.locator('.avnext-preview h3')).to_have_text('<img src=x onerror=alert(1)>')
        assert page.locator('.avnext-preview img').count() == 0
        passed('blank-draft-and-safe-text-preview')
        nav.get_by_role('button', name='Discover', exact=True).click()
        controls = page.get_by_role('group', name='Review catalogue states')
        controls.get_by_role('button', name='error', exact=True).click()
        expect(page.get_by_role('status')).to_contain_text('could not be loaded')
        page.get_by_role('button', name='Show loading example', exact=True).click()
        expect(page.get_by_role('status')).to_contain_text('Loading approved projects')
        passed('catalogue-state-distinction')
        nav.get_by_role('button', name='Creator Studio', exact=True).click()
        expect(title).to_have_value('<img src=x onerror=alert(1)>')
        passed('edits-survive-view-switch')
        page.set_viewport_size({'width':390,'height':844})
        panes = page.get_by_role('group', name='Workspace panes')
        panes.get_by_role('button', name='preview', exact=True).click()
        expect(page.locator('.avnext-preview')).to_be_visible()
        expect(page.locator('.avnext-editor')).to_be_hidden()
        panes.get_by_role('button', name='editor', exact=True).click()
        expect(title).to_have_value('<img src=x onerror=alert(1)>')
        passed('mobile-pane-edit-continuity')
        nav.get_by_role('button', name='Arrival', exact=True).click()
        page.get_by_role('button', name='Pause motion', exact=True).click()
        assert page.locator('.avnext-planet').evaluate('(e)=>getComputedStyle(e).animationPlayState') == 'paused'
        page.emulate_media(reduced_motion='reduce')
        assert page.locator('.avnext-planet').evaluate('(e)=>getComputedStyle(e).animationName') == 'none'
        passed('manual-pause-and-reduced-motion')
        assert not blocked, blocked
        assert not errors, errors
        passed('no-external-requests-or-runtime-errors')
        browser.close()
finally:
    server.shutdown()
    result = {'scope':'compiled local React review; not physical Safari or real accounts', 'checks':checks, 'runtimeErrors':errors, 'blockedExternalRequests':blocked}
    (OUT / 'browser-qa.json').write_text(json.dumps(result, indent=2))
print(json.dumps({'passed':len(checks),'runtimeErrors':len(errors),'externalRequests':len(blocked)}))
