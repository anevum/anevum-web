import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const css=read('web/src/continuance-sitewide-v063.css');
const entry=read('web/src/main.tsx');
const alerts=read('web/src/components/AnevumNotifications.tsx');
const scout=read('web/src/components/IrenGuidedContinuance.tsx');
const collection=read('web/src/components/LevelCollection.tsx');
const specimen=read('web/src/components/LevelEmblem.tsx');
const instrument=read('web/src/pages/TheButtonPage.tsx');

test('V063 is loaded after the accumulated Creator V1 presentation layers',()=>{
  const v63=entry.lastIndexOf('continuance-sitewide-v063.css');
  assert.ok(v63>0);
  for(const layer of ['site-experience-v009.css','sitewide-cleanup-v012.css','supporter-compact-v045.css','member-space.css']){
    assert.ok(entry.indexOf(layer)>0&&entry.indexOf(layer)<v63,layer);
  }
  assert.equal((entry.match(/continuance-sitewide-v063.css/g)||[]).length,1);
});

test('V063 touches presentation only and retains accessibility fallbacks',()=>{
  assert.match(css,/ANEVUM.WEB.UPDATE.2026-10-17.001/);
  assert.match(css,/prefers-reduced-motion:reduce/);
  assert.match(css,/forced-colors:active/);
  assert.match(css,/\.an-notification-center/);
  assert.match(css,/\.an-inbox-toggle i/);
  assert.match(css,/\.an-toast-level/);
  assert.match(css,/\.an-toast-award/);
  for(const selector of ['.av9-shell','.ch7-panel','.cnb-project','.st-panel','.ms-panel','.av45-buy','.an-artifact-card-v034']){
    assert.ok(css.includes(selector),selector);
  }
  assert.doesNotMatch(css,/@import|https?:\/\/|url\(|display:\s*none\s*!important/);
  assert.equal((css.match(/\{/g)||[]).length,(css.match(/\}/g)||[]).length,'balanced styles');
});

test('alerts and awards share the canonical 30-level progression',()=>{
  // The permanent Updates dock was retired by V087. Server-authoritative
  // recognition still feeds the single IREN scout and its unread indicator.
  assert.match(alerts,/useIrenSignals/);
  assert.match(alerts,/markSignalsSeen/);
  assert.match(scout,/className="ir80-dock ir87-scout"/);
  assert.doesNotMatch(alerts,/an-notification-center|an-inbox-toggle/);
  assert.doesNotMatch(alerts,/level:30,title:'Level 30 reached',detail:'ANEVUM'/);
  assert.match(alerts,/Visual notification sample. No award, XP or specimen revealed/);
  assert.doesNotMatch(instrument,/EXPLORE ALL 60 LEVEL ICONS/);
  assert.match(instrument,/Navigate to="\/levels" replace/);
  assert.doesNotMatch(instrument,/\+5 XP|TRANSMIT SIGNAL|SIGN IN TO TEST YOUR XP/);
  assert.match(collection,/Thirty levels\. Your earned emblems/);
  assert.match(collection,/EarnedRewardVault/);
  assert.doesNotMatch(collection,/level-artifacts\.json|LIVING 3D ARCHIVE/);
  assert.doesNotMatch(specimen,/registerAnimatedSpecimen/);
  assert.match(specimen,/v081-hd-emblem/);
});
