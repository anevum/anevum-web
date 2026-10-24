import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=path=>fs.readFileSync(new URL(path,import.meta.url),'utf8');
const source=read('../web/src/pages/CommonsQuickNavigator.tsx');
const page=read('../web/src/pages/CommunityNextReviewPage.tsx');
const css=read('../web/src/pages/commons-quick-navigator.css');
test('native modal has an explicit accessible name, description and invoker relationship',()=>{
  for(const text of ['showModal()', 'aria-labelledby="lnx-quick-title"', 'aria-describedby="lnx-quick-help"', 'aria-controls="lnx-quick-dialog"', 'onClose={close}', 'Close Quick Navigator'])assert.ok(source.includes(text),text);
  assert.match(source,/target\?\.focus\(\{preventScroll: true\}\)/);
  assert.match(source,/selected\.current = true/);
});
test('only the existing eight canonical districts and public navigation destinations are offered',()=>{
  assert.match(source,/COMMONS_DISTRICTS\.map/);
  assert.match(source,/onChoose\(\{view: 'signals', category: destination\.district\}\)/);
  assert.match(source,/navigate\(discoverPath\)/);
  assert.match(source,/navigate\(creatorsPath\)/);
  for(const banned of ['fetch(', 'localStorage', 'sessionStorage', 'memberCreate', 'setXp', 'awardBadge', 'window.open', 'dangerouslySetInnerHTML'])assert.ok(!source.includes(banned),banned);
});
test('search is bounded and keyboard shortcuts respect composition, held keys and other dialogs',()=>{
  for(const text of ['normalizeCommonsSearch(query)', 'maxLength={72}', 'event.defaultPrevented', 'event.repeat', 'event.isComposing', 'event.nativeEvent.isComposing', 'if (occupied) return', 'ArrowDown', 'ArrowUp', 'Home', 'End'])assert.ok(source.includes(text),text);
  assert.match(source,/window\.removeEventListener\('keydown', shortcut\)/);
});
test('navigation is mounted only in the scoped page and does not duplicate the companion',()=>{
  assert.match(page,/<CommonsQuickNavigator /);
  assert.doesNotMatch(source,/<Iren|readMember|canonicalPublic/);
  for(const name of ['projectFeed', 'districtCounts', 'creators'])assert.ok(page.includes("aria-busy={"+name+".state === 'loading'}"));
});
test('new styles remain scoped and support touch, reduced motion and forced colors',()=>{
  assert.doesNotMatch(css,/^\s*(html|body|:root)\s*\{/m);
  for(const text of ['.lnx-root', '::backdrop', '100dvh', 'min-height:44px', '@media(prefers-reduced-motion:reduce)', '@media(forced-colors:active)', 'font-size:16px'])assert.ok(css.includes(text),text);
});
