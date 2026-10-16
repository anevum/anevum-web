// These expressions are sent as source to the browser CDP Runtime.evaluate.
// Keep them in a testable module so nested CSS selectors are syntax-checked
// before CI attempts a browser capture. No DOM access occurs when importing.
export const canonicalAvailabilityProbe=String.raw`!!document.querySelector('.engagement-panel[data-avp-availability="canonical-readonly"]')`;
export const canonicalParticipationProbe=String.raw`(()=>{
  const panel=document.querySelector('.engagement-panel');
  const nav=document.querySelector('.avp-stage-shortcuts');
  if(!panel||!nav)return null;
  const links=[...panel.querySelectorAll('a')].map(a=>({text:a.textContent.trim(),href:a.getAttribute('href')}));
  return {
    status:panel.getAttribute('data-avp-availability'),
    label:nav.querySelector('a[href="#avp-participation"]')?.textContent?.trim(),
    hasVotes:!!panel.querySelector('.engagement-votes,button[aria-label^="Rate "]'),
    hasSave:panel.textContent.includes('SAVE TO LIBRARY'),
    links,
    invitation:panel.textContent.includes('invite-only'),
    falsePromise:panel.textContent.includes('Signing in does not activate')
  };
})()`;
