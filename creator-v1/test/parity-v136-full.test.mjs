import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
const root='creator-v1/web/src/';
const load=p=>readFileSync(root+p,'utf8');
test('V136 full homepage is independently gated',()=>{
 const home=load('pages/CinematicLandingPage.tsx');
 const main=load('main.tsx');
 const shell=load('components/Shell.tsx');
 assert.match(home,/VITE_PARITY_V136_FULL/);
 assert.match(shell,/VITE_PARITY_V136_FULL/);
 assert.match(main,/VITE_PARITY_V136_FULL/);
 assert.match(home,/if\(FullPortal\)return/);
 assert.match(shell,/FullParityHeader\?/);
});
test('V136 full preserves actual approved APIs and official mark',()=>{
 const portal=load('parity/ParityPortalV136.tsx');
 const shell=load('components/Shell.tsx');
 assert.match(portal,/projects\.slice\(0,4\)/);
 assert.match(portal,/projectDetailPath/);
 assert.match(portal,/OrbitalMark/);
 assert.match(portal,/catalogueState/);
 assert.doesNotMatch(portal,/12,428|24,128|1,842|fakeStats/);
 assert.match(shell,/IrenGuidedContinuance/);
 assert.match(shell,/canonicalAuthClient/);
});
test('V136 full assets and keyboard/reduced motion accessibility',()=>{
 const css=load('parity/visual-foundation-v136.css');
 const portal=load('parity/ParityPortalV136.tsx');
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(css,/focus-visible/);
 assert.match(css,/@media\(max-width:520px\)/);
 assert.match(portal,/aria-label/);
 assert.match(portal,/role="status"/);
});