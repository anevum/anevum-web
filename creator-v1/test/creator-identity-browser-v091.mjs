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

    // V104 first-visit regression: on real compiled React, the public member
    // display name must wrap on phones instead of reducing identity to "...".
    if(width<=390){
      const name=await evaluate('(()=>{const el=document.querySelector(".ms-public .av65-player-card--featured .av65-name-line .av61-member-name");if(!el)return null;const css=getComputedStyle(el);return {text:el.textContent,whiteSpace:css.whiteSpace,lineClamp:css.webkitLineClamp,clientWidth:el.clientWidth,scrollWidth:el.scrollWidth,height:el.getBoundingClientRect().height}})()');
      assert.ok(name,'Featured public identity name must exist');
      assert.equal(name.text,'SYNTHETIC / v091_public');
      assert.equal(name.whiteSpace,'normal','Public identity must wrap on a narrow phone');
      assert.equal(name.lineClamp,'2','Public identity may use two legible lines');
      assert.ok(name.scrollWidth<=name.clientWidth+2,'Public identity text overflows mobile card');
      if(width===320)assert.ok(name.height>=36,'Small-phone public identity remains collapsed to a single clipped line');
    }

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
    // A failing wall must not hide the public identity or force a reload of
    // its successful profile/space requests. Retry only the failed read.
    const recoveryHandle='v091_wall_'+width;
    const publicPath='/api/v1/members/'+recoveryHandle;
    await client.send('Page.navigate',{url:base+'/creator/@'+recoveryHandle});
    await until(()=>evaluate('!!document.querySelector(".ms-public-wall-feedback button")'));
    assert.equal(await evaluate('document.querySelector("#av12-world-heading")?.textContent'),'SYNTHETIC / '+recoveryHandle);
    assert.equal(await evaluate('!!document.querySelector(".ms-public-bio,.ms-public .ms-card")'),true);
    const successfulCoreReads=()=>evaluate(`performance.getEntriesByType('resource').filter(e=>[${JSON.stringify(publicPath)},${JSON.stringify(publicPath+'/space')}].includes(new URL(e.name).pathname)).length`);
    const beforeRetry=await successfulCoreReads();
    assert.equal(beforeRetry,2,'One successful profile and space read each');
    await screenshot('v104-public-wall-unavailable-'+width);
    await evaluate('document.querySelector(".ms-public-wall-feedback button").click()');
    await until(()=>evaluate('!!document.querySelector(".ms-public .ms-wall")&&!document.querySelector(".ms-public-wall-feedback")'));
    assert.equal(await successfulCoreReads(),beforeRetry,'Wall retry must not refetch successful public identity');
    assert.equal(await evaluate('document.documentElement.scrollWidth>innerWidth+1'),false);
    await screenshot('v104-public-wall-recovered-'+width);
    console.log('V091_CREATOR_IDENTITY_AND_ART_'+width+'=PASS');
  }
}
