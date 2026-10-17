/** Browser acceptance for the public /levels gallery after a guarded staging-only release. */
import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
import {join} from 'node:path';
import {chromium} from 'playwright';

const target = process.env.ANEVUM_V037_HOST || 'https://a.anevum.com';
const output = process.env.ANEVUM_V037_OUTPUT || 'evidence/series-one-v037-hosted';
const executablePath = process.env.ANEVUM_CHROME;
if (!executablePath) throw new Error('ANEVUM_CHROME executable path required for hosted verification');
mkdirSync(output,{recursive:true});
const browser=await chromium.launch({executablePath,headless:true,args:['--no-sandbox']});
try {
  for (const [name,width,height,scale] of [['mobile',390,844,2],['desktop',1440,900,1]]) {
    const context=await browser.newContext({
      viewport:{width,height},
      deviceScaleFactor:scale,
      isMobile:width<500,
      hasTouch:width<500,
      reducedMotion:'reduce' // stable screenshots, motion remains supported in normal runtime
    });
    try {
      const page=await context.newPage();
      await page.goto(target+'/levels',{waitUntil:'domcontentloaded',timeout:45000});
      const gallery=page.locator('.an-series-v034');
      await gallery.waitFor({timeout:30000});
      await page.waitForFunction(()=>document.querySelectorAll('.an-artifact-card-v034').length===60,null,{timeout:30000});
      const first=page.locator('.an-artifact-card-v034 img[data-artwork="v037-transparent-preview"]').first();
      await first.scrollIntoViewIfNeeded();
      await page.waitForFunction(()=>{
        const img=document.querySelector('.an-artifact-card-v034 img[data-artwork="v037-transparent-preview"]');
        return img && img.complete && img.naturalWidth===256 && img.naturalHeight===256;
      },null,{timeout:30000});
      const result=await page.evaluate(()=>{
        const cards=[...document.querySelectorAll('.an-artifact-card-v034')];
        const imgs=[...document.querySelectorAll('.an-artifact-card-v034 img')];
        const first=imgs[0];const style=getComputedStyle(first);
        return {
          cards:cards.length,
          illustrativeCount:imgs.filter(img=>img.dataset.artwork==='v037-transparent-preview').length,
          firstSrc:first.getAttribute('src'),
          firstNaturalSize:[first.naturalWidth,first.naturalHeight],
          mixBlendMode:style.mixBlendMode,
          maskImage:style.maskImage,
          firstLabel:cards[0]?.querySelector('h3')?.textContent,
          secondLabel:cards[1]?.querySelector('h3')?.textContent
        };
      });
      assert.equal(result.cards,60);
      assert.equal(result.illustrativeCount,60);
      assert.ok(result.firstSrc?.includes('/assets/levels/series-one-v037/level-01.webp'));
      assert.deepEqual(result.firstNaturalSize,[256,256]);
      assert.equal(result.mixBlendMode,'normal');
      assert.equal(result.maskImage,'none');
      assert.equal(result.firstLabel,'Foundry Spark');
      assert.equal(result.secondLabel,'Copper Key');

      await page.locator('.an-series-filters button').nth(1).click();
      await page.waitForFunction(()=>document.querySelectorAll('.an-artifact-card-v034').length===10,null,{timeout:10000});
      await page.locator('.an-series-filters button').first().click();
      await page.waitForFunction(()=>document.querySelectorAll('.an-artifact-card-v034').length===60,null,{timeout:10000});
      await first.scrollIntoViewIfNeeded();
      await page.screenshot({path:join(output,'levels-'+name+'.png'),animations:'disabled'});
      console.log('V037_HOSTED_VISUAL_PASS',name,result);
    } finally {await context.close()}
  }
} finally {await browser.close()}
