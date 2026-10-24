import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {browseSavedWorks,savedCategoryFilters} from '../web/src/lib/saved-works-browse.ts';
const sample=(id,category,title,savedAt,creatorName='Mira')=>({id,title,summary:'A project description',category,creatorHandle:'maker_one',creatorName,publishedAt:'2026-10-23T00:00:00Z',savedAt});
const works=[sample('a'.repeat(32),'games','Orbital Garden',110,'Mira'),sample('b'.repeat(32),'tools','Signal Workbench',130,'Ash'),sample('c'.repeat(32),'games','Light Garden',120,'Sam')];
test('saved collection groups derive only from loaded server data',()=>{
 assert.deepEqual(savedCategoryFilters(works),[{id:'games',label:'Games',count:2},{id:'tools',label:'Tools',count:1}]);
 assert.deepEqual(savedCategoryFilters([]),[]);
});
test('one predictable list sorts newest first without mutating server responses',()=>{
 const snapshot=works.slice();
 assert.deepEqual(browseSavedWorks(works,'all','').map(x=>x.title),['Signal Workbench','Light Garden','Orbital Garden']);
 assert.deepEqual(works,snapshot);
 assert.deepEqual(browseSavedWorks(works,'games','').map(x=>x.title),['Light Garden','Orbital Garden']);
});
test('search is literal, case insensitive, and intersects category',()=>{
 assert.deepEqual(browseSavedWorks(works,'all',' SIGNAL ').map(x=>x.title),['Signal Workbench']);
 assert.deepEqual(browseSavedWorks(works,'games','garden').map(x=>x.title),['Light Garden','Orbital Garden']);
 assert.deepEqual(browseSavedWorks(works,'tools','garden'),[]);
 assert.deepEqual(browseSavedWorks(works,'all','MIRA').map(x=>x.title),['Orbital Garden']);
 assert.deepEqual(browseSavedWorks(works,'all','.*'),[]);
});
test('library UI remains private, server-gated, list-first, and read-only for organization',()=>{
 const page=readFileSync(new URL('../web/src/pages/CanonicalSavedWorksPage.tsx',import.meta.url),'utf8');
 const css=readFileSync(new URL('../web/src/pages/canonical-saved-works.css',import.meta.url),'utf8');
 assert.match(page,/useState<"list"\|"grid">\("list"\)/);
 assert.match(page,/className="avsaved-grid"/);
 assert.match(page,/data-view={layout}/);
 assert.match(page,/browseSavedWorks\(items,safeCategory,query\)/);
 assert.match(page,/categories\.some\(option=>option\.id===category\)/);
 assert.match(page,/aria-label="Saved category"/);
 assert.match(page,/Show all saved projects/);
 assert.match(page,/canonicalAuthClient\.useSession\(\)/);
 assert.match(page,/capability\.data\.kind==="canonical-saves"/);
 assert.match(page,/setCanonicalProjectSaved\(id,false\)/);
 assert.doesNotMatch(page,/localStorage|sessionStorage|createFolder|awardXp|grantXp/);
 assert.match(css,/data-view=list/);
 assert.match(css,/max-width:660px/);
 assert.match(css,/prefers-reduced-motion:reduce/);
});
