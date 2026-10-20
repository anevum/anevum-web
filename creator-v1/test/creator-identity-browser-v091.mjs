/** Runs only against the existing loopback visual fixture and compiled React.
 * No production network, real session, protected specimen or account writes. */
import assert from 'node:assert/strict';
export async function captureCreatorIdentityV091({client,base,evaluate,until,screenshot}){
  assert.match(base,/^http:\/\/127\.0\.0\.1:\d+$/);
  for(const [width,height] of [[1440,900],[390,844],[320,720]]){
    await client.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<641});
    await client.send('Network.clearBrowserCookies');
    await client.send('Page.navigate',{url:base+'/creator/creators/v091_public'});
    await until(()=>evaluate("location.pathname==='/creator/@v091_public'&&document.querySelectorAll('.v091-level-safe-fallback').length>=2"));
    let state=await evaluate(`({
      level:document.querySelector('.v091-level-glyph strong')?.textContent,
      overflow:document.documentElement.scrollWidth>innerWidth+1,
      privateRewardRequests:performance.getEntriesByType('resource').filter(x=>x.name.includes('/api/v1/member/rewards/')).length
    })`);
    assert.equal(state.level,'05');assert.equal(state.overflow,false);
    assert.equal(state.privateRewardRequests,0,'Public identity requested owner rewards');
    await screenshot('v091-public-art-fallback-'+width);

    // Client-side navigation deliberately reuses the public-world route. A
    // failed image from one identity must not poison the next identity's art.
    await evaluate("history.pushState({},'', '/creator/@v091_other');window.dispatchEvent(new PopStateEvent('popstate'))");
    await until(()=>evaluate(`(()=>{\n      const visible=[...document.querySelectorAll('.level-emblem img')].filter(img=>{\n       const decorative=img.closest('.av78-featured-art');\n       return !decorative||getComputedStyle(decorative).display!=='none';\n      });\n      // On narrow phones the duplicate giant watermark is hidden, and the\n      // browser may skip loading it. The earned seal is still mandatory.\n      return location.pathname==='/creator/@v091_other'&&\n       visible.length>=(innerWidth<=430?1:2)&&\n       visible.every(img=>img.complete&&img.naturalWidth>0&&img.currentSrc.includes('/members/v091_other/'));\n     })()`));
    state=await evaluate("({fallback:document.querySelectorAll('.v091-level-safe-fallback').length,overflow:document.documentElement.scrollWidth>innerWidth+1,headers:document.querySelectorAll('.site-header.av9-header').length})");
    assert.equal(state.fallback,0);assert.equal(state.overflow,false);assert.equal(state.headers,1);
    await screenshot('v091-public-art-recovered-'+width);

    for(const [handle,heading] of [['v091_private','NO PUBLIC CREATOR CHANNEL'],['v091_offline','CREATOR INDEX UNAVAILABLE']]){
      await client.send('Page.navigate',{url:base+'/creator/creators/'+handle});
      await until(()=>evaluate('document.querySelector(".state-error h2")?.textContent==='+JSON.stringify(heading)));
      assert.equal(await evaluate('location.pathname'),'/creator/creators/'+handle,'Unverified public member was redirected');
      assert.equal(await evaluate('!!document.querySelector(".ms-public,.level-emblem")'),false,'Private/unavailable identity leaked public card details');
    }
    await screenshot('v091-profile-outage-recovery-'+width);
    console.log('V091_CREATOR_IDENTITY_AND_ART_'+width+'=PASS');
  }
}
