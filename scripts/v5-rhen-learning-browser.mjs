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
  let data;
  for (let attempt = 0; attempt < 80; attempt++) {
    const result = await send("Runtime.evaluate", {expression: `(() => {
      const root = document.querySelector('.anevum-commons-v5-mount')?.shadowRoot;
      const type = ${JSON.stringify(expected)};
      const page = type === 'landing' ? root?.querySelector('#rh-public-lessons-title')?.closest('.c2-page') : root?.querySelector('[data-rhen-learning="'+type+'"]');
      if (!page) return {ready:false};
      const heading = page.querySelector('h1')?.textContent || '';
      return {
        ready: true, heading,
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
        missing:page.getAttribute('data-page-state') === 'not-found'
      };
    })()`,returnByValue:true});
    data = result.result?.value;
    if (data?.ready) break;
    await new Promise(resolve=>setTimeout(resolve,125));
  }
  if (!data?.ready || data.inputs || data.overflow) throw Error("Learning page failed hydration/anonymous layout: " + JSON.stringify({route,data}));
  if (!known) {
    if (!data.missing || !data.robots.startsWith('noindex') || data.canonical) throw Error('Missing lesson incorrectly advertised');
    return;
  }
  if (!data.robots.startsWith('index') || data.canonical !== 'https://anevum.com' + route) throw Error('Learning metadata mismatch: ' + JSON.stringify({route,data}));
  if (expected === 'landing' || expected === 'index') {
    if (data.cards !== 2 || !Object.keys(titles).every(s=>data.links.includes(prefix+'/'+s))) throw Error('Both real lesson links are required');
    return;
  }
  if (data.heading !== titles[slug] || data.sections < 4 || data.sources < 3 || data.questions < 3 || data.glossary < 5 || !data.body.includes('Free public education')) throw Error('Incomplete lesson body: ' + JSON.stringify({route,data}));
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
}
