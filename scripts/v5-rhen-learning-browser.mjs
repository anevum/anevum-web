import fs from "node:fs";
import path from "node:path";
import os from "node:os";

// Real browser checks for the public R2 curriculum. No member fixtures or brokerage calls.
export async function verifyRhenLearningPage(send, route) {
  const prefix = "/products/rhen/learn";
  if (route !== "/learn" && route !== prefix && !route.startsWith(prefix + "/")) return;
  const titles = {
    "market-orders-and-quotes": "How orders meet a market",
    "risk-math-and-strategy-evidence": "Risk math and strategy evidence"
  };
  const slug = route.startsWith(prefix + "/") ? route.slice(prefix.length + 1) : null;
  const known = slug === null || Object.hasOwn(titles, slug);
  const expected = route === "/learn" ? "landing" : slug === null ? "index" : known ? "lesson" : "missing";
  async function inspect() {
    let data;
    for (let attempt = 0; attempt < 80; attempt++) {
      const result = await send("Runtime.evaluate", {expression: `(() => {
        const root = document.querySelector('.anevum-commons-v5-mount')?.shadowRoot;
        const type = ${JSON.stringify(expected)};
        const page = type === 'landing' ? root?.querySelector('#rh-public-lessons-title')?.closest('.c2-page') : root?.querySelector('[data-rhen-learning="'+type+'"]');
        if (!page) return {ready:false};
        return {
          ready:true, width:innerWidth, height:innerHeight,
          heading:page.querySelector('h1')?.textContent || '',
          cards:page.querySelectorAll('.rh-learn-card').length,
          sections:page.querySelectorAll('.rh-lesson-section').length,
          sources:page.querySelectorAll('.rh-learn-sources a[href^="https://"]').length,
          questions:page.querySelectorAll('.rh-learn-check details').length,
          glossary:page.querySelectorAll('.rh-learn-glossary dt').length,
          inputs:page.querySelectorAll('form,input,button[type="submit"]').length,
          body:page.textContent || '',
          robots:document.querySelector('meta[name="robots"]')?.content || '',
          canonical:document.querySelector('link[rel="canonical"]')?.href || '',
          links:[...page.querySelectorAll('a[href]')].map(a=>a.getAttribute('href')),
          overflow:[...page.querySelectorAll('*')].filter(e=>e.getBoundingClientRect().right>innerWidth+2 && e.getBoundingClientRect().width>0).length,
          documentOverflow:document.documentElement.scrollWidth>innerWidth+2,
          missing:page.getAttribute('data-page-state') === 'not-found'
        };
      })()`,returnByValue:true});
      data = result.result?.value;
      if (data?.ready) break;
      await new Promise(resolve=>setTimeout(resolve,125));
    }
    if (!data?.ready || data.inputs || data.overflow || data.documentOverflow) throw Error("Learning page failed hydration/anonymous layout: " + JSON.stringify({route,data}));
    if (!known) {
      if (!data.missing || !data.robots.startsWith('noindex') || data.canonical) throw Error('Missing lesson incorrectly advertised');
      return data;
    }
    if (!data.robots.startsWith('index') || data.canonical !== 'https://anevum.com' + route) throw Error('Learning metadata mismatch: ' + JSON.stringify({route,data}));
    if (expected === 'landing' || expected === 'index') {
      if (data.cards !== 2 || !Object.keys(titles).every(s=>data.links.includes(prefix+'/'+s))) throw Error('Both real lesson links are required');
      return data;
    }
    if (data.heading !== titles[slug] || data.sections < 4 || data.sources < 3 || data.questions < 3 || data.glossary < 5 || !data.body.includes('Free public education')) throw Error('Incomplete lesson body: ' + JSON.stringify({route,data}));
    // Establish keyboard modality before programmatic focus, just as a keyboard user does.
    await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
    await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
    const focus = await send('Runtime.evaluate',{expression:`(() => {
      const root=document.querySelector('.anevum-commons-v5-mount')?.shadowRoot;
      const summary=root?.querySelector('.rh-learn-check summary');
      if(!summary)return false;
      summary.closest('details').open=false;
      summary.focus();
      return root.activeElement===summary && parseFloat(getComputedStyle(summary).outlineWidth)>=2;
    })()`,returnByValue:true});
    if(!focus.result?.value)throw Error('Lesson self-check has no visible keyboard focus');
    await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
    await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
    const opened=await send('Runtime.evaluate',{expression:`(() => {
      const root=document.querySelector('.anevum-commons-v5-mount')?.shadowRoot;
      const detail=root?.querySelector('.rh-learn-check details');
      const ok=detail?.open===true && detail.textContent.includes('Answer:');
      if(detail){detail.open=false;detail.querySelector('summary')?.blur();}
      window.scrollTo({top:0,behavior:'instant'});
      return ok;
    })()`,returnByValue:true});
    if(!opened.result?.value)throw Error('Keyboard did not reveal the lesson answer');
    return data;
  }
  const initial = await inspect();
  if (initial.width <= 420 && initial.width !== 320) {
    try {
      await send('Emulation.setDeviceMetricsOverride',{width:320,height:initial.height,mobile:true,deviceScaleFactor:1});
      await send('Runtime.evaluate',{expression:'new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))',awaitPromise:true});
      const narrow = await inspect();
      if(narrow.width!==320)throw Error('Narrow learning viewport did not apply');
      const screenshot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
      const output=path.join(process.env.RUNNER_TEMP || os.tmpdir(),'anevum-visuals');
      fs.mkdirSync(output,{recursive:true});
      fs.writeFileSync(path.join(output,'learning-'+route.slice(1).replaceAll('/','-')+'-320.png'),Buffer.from(screenshot.data,'base64'));
      console.log('RHEN learning 320px layout and keyboard PASS: '+route);
    } finally {
      await send('Emulation.setDeviceMetricsOverride',{width:initial.width,height:initial.height,mobile:true,deviceScaleFactor:1});
      await send('Runtime.evaluate',{expression:'window.scrollTo({top:0,behavior:"instant"})'});
    }
  }
}
