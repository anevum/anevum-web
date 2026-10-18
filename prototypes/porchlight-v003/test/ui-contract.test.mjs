import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const js=readFileSync(new URL('../app.mjs',import.meta.url),'utf8');
const css=readFileSync(new URL('../styles.css',import.meta.url),'utf8');

test('review-only release posture is explicit and household GPS is absent',()=>{
 assert.match(html,/DEMONSTRATION ONLY/);
 assert.match(html,/no verified homeowners/i);
 assert.doesNotMatch(html,/navigator\.geolocation|navigator\.contacts|<iframe/i);
 assert.doesNotMatch(js,/geolocation|localStorage|sessionStorage|indexedDB|innerHTML|document\.cookie/);
});
test('host UI enforces general area mode and affirmative independent consent',()=>{
 assert.match(js,/displayMode:'block'/);
 for(const id of ['host-adult','host-authority','host-consent','host-block','host-address'])
   assert.match(html,new RegExp(`id="${id}"`));
 assert.match(js,/adultAttested:/);
 assert.match(js,/authorizedResidentAttested:/);
 assert.match(js,/consentConfirmed:/);
});
test('UI uses same-origin authenticated requests, safe DOM rendering and no third-party SDK',()=>{
 assert.match(js,/credentials:'same-origin'/);
 assert.match(js,/cache:'no-store'/);
 assert.match(js,/textContent/);
 assert.doesNotMatch(html,/<script[^>]+src="https?:\/\//);
 assert.doesNotMatch(html,/<link[^>]+href="https?:\/\//);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
});
test('organizer controls and household revocation are present without role editing controls',()=>{
 assert.match(html,/id="organizer"/);
 assert.match(html,/id="my-home"/);
 assert.match(js,/\/withdraw/);
 assert.match(js,/\/pause/);
 assert.match(js,/expectedRevision:item.revision/);
 assert.doesNotMatch(html,/name="role"|id="role"/);
});
