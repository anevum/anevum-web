/* Motion is decorative; never blocks navigation or replaces real content. */
(()=>{'use strict';const root=document.documentElement;const hero=document.querySelector('.hero');if(!hero)return;
const orbit=document.createElement('div');orbit.className='cinema-orbit';orbit.setAttribute('aria-hidden','true');hero.prepend(orbit);
const beacon=document.createElement('div');beacon.className='cinema-beacon';beacon.setAttribute('aria-hidden','true');hero.append(beacon);
const media=document.createElement('video');media.className='cinema-approved-video';media.muted=true;media.loop=true;media.playsInline=true;media.preload='none';media.setAttribute('aria-hidden','true');media.hidden=true;
const source=hero.getAttribute('data-approved-video');if(source&&source.startsWith('/portfolio/assets/')&&/\.(mp4|webm)$/.test(source)){media.src=source;media.hidden=false;media.style.cssText='position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.24;pointer-events:none;z-index:0';hero.prepend(media);}
const reduce=matchMedia('(prefers-reduced-motion: reduce)');const saveData=navigator.connection?.saveData===true;const motionButton=document.querySelector('#motion-toggle');
function enabled(){return !reduce.matches&&!saveData&&!document.hidden&&!root.classList.contains('motion-paused')&&hero.getBoundingClientRect().bottom>0;}
function sync(){if(!media.src)return;if(enabled())media.play().catch(()=>{});else media.pause();}
document.addEventListener('visibilitychange',sync);motionButton?.addEventListener('click',()=>requestAnimationFrame(sync));reduce.addEventListener?.('change',sync);
let scheduled=false;function onScroll(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;if(enabled()){const n=Math.max(-100,Math.min(100,scrollY*.09));root.style.setProperty('--cinematic-drift',n.toFixed(1)+'px');}sync();});}
window.addEventListener('scroll',onScroll,{passive:true});sync();
})();
