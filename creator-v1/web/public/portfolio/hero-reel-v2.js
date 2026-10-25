/* ANEVUM Portfolio V2 / Real-work cinematic experience director
 * The large work panel contains real first-party screenshot evidence;
 * transitions never masquerade as shipped applications or user activity.
 * Zero WebGL renderers, zero third-party calls, zero autoplay video.
 */
(() => {
  'use strict';
  const root = document.documentElement;
  const hero = document.querySelector('.hero-v2');
  const stage = hero?.querySelector('.hero-v2-reel');
  const screen = stage?.querySelector('[data-reel-image]');
  const artwork = stage?.querySelector('.reel-transcosmic-art');
  const open = stage?.querySelector('#reel-open');
  const name = stage?.querySelector('#reel-chapter-name');
  const summary = stage?.querySelector('#reel-chapter-summary');
  const status = stage?.querySelector('#reel-project-status');
  const index = stage?.querySelector('#reel-chapter-index');
  const controls = [...(stage?.querySelectorAll('[data-hero-select]') || [])];
  if (!stage || !screen || !artwork || !open || controls.length !== 4) return;

  const chapters = Object.freeze({
    anevum: {
      index:'01',name:'ANEVUM',title:'ANEVUM',summary:'A platform for people who make things.',
      status:'ANEVUM / ACTIVE PRODUCT DEVELOPMENT',
      src:'/portfolio/assets/anevum-interface.webp',
      alt:'ANEVUM Discover interface prototype; the displayed review catalogue includes synthetic content.'
    },
    fold: {
      index:'02',name:'THE FOLD',title:'The Fold',summary:'A playable idea for finding adventure in ordinary life.',
      status:'THE FOLD / PRIVATE PLAYABLE PROTOTYPE',
      src:'/portfolio/assets/fold-interface.webp',
      alt:'The Fold prototype mobile screen displaying an illustrated local quest experience, not live GPS.'
    },
    rhen: {
      index:'03',name:'RHEN',title:'RHEN',summary:'Making complex research systems understandable.',
      status:'RHEN / READ-ONLY RESEARCH INTERFACE',
      src:'/portfolio/assets/rhen-interface.webp',
      alt:'RHEN read-only research interface screenshot; no live trading engine is depicted.'
    },
    transcosmic: {
      index:'04',name:'TRANSCOSMIC',title:'Transcosmic',summary:'An original fiction universe taking shape.',
      status:'TRANSCOSMIC / CREATIVE DEVELOPMENT',
      src:null,
      alt:''
    }
  });
  const names = Object.keys(chapters);
  let current = 'anevum';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const saveData = navigator.connection?.saveData === true;
  let pointerX = 0, pointerY = 0, scrolling = 0, visible = true, scheduled = false;

  function choose(key, focus = false) {
    if (!Object.prototype.hasOwnProperty.call(chapters, key)) return;
    const data = chapters[key];
    const changed = current !== key;
    current = key;
    stage.dataset.heroProject = key;
    if (changed && !reduced.matches && !saveData && !root.classList.contains('motion-paused')) {
      stage.classList.remove('reel-sweep');
      void stage.offsetWidth; // restart a deliberate transition after a real choice
      stage.classList.add('reel-sweep');
    }
    name.textContent = data.name;
    summary.textContent = data.summary;
    index.textContent = data.index + ' / 04';
    status.textContent = data.status;
    open.dataset.project = key;
    open.setAttribute('aria-label', 'Open ' + data.title + ' case study');
    const art = !data.src;
    screen.hidden = art;
    artwork.hidden = !art;
    if (data.src) {
      if (!screen.src.endsWith(data.src)) screen.src = data.src;
      screen.alt = data.alt;
    }
    controls.forEach(button => {
      const selected = button.dataset.heroSelect === key;
      button.classList.toggle('active', selected);
      button.setAttribute('aria-pressed', String(selected));
      if (selected && focus) button.focus({preventScroll:true});
    });
  }

  controls.forEach(button => {
    button.addEventListener('click', () => choose(button.dataset.heroSelect));
    button.addEventListener('keydown', event => {
      if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
      event.preventDefault();
      const selected = names.indexOf(button.dataset.heroSelect);
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? names.length - 1
        : (selected + (event.key === 'ArrowRight' ? 1 : -1) + names.length) % names.length;
      choose(names[next],true);
    });
  });
  choose('anevum');

  const enabled = () => !root.classList.contains('motion-paused') && !reduced.matches && !saveData && !document.hidden && visible;
  function paint() {
    scheduled = false;
    if (!enabled()) {
      root.style.setProperty('--reel-motion-x','0px');
      root.style.setProperty('--reel-motion-y','0px');
      root.style.setProperty('--reel-offset-x','0px');
      root.style.setProperty('--reel-offset-y','0px');
      root.style.setProperty('--reel-zoom','1.025');
      root.style.setProperty('--reel-scroll','0');
      return;
    }
    const x = Math.max(-1, Math.min(1,pointerX)) * 14;
    const y = Math.max(-1, Math.min(1,pointerY)) * 10;
    root.style.setProperty('--reel-motion-x',x.toFixed(1)+'px');
    root.style.setProperty('--reel-motion-y',y.toFixed(1)+'px');
    root.style.setProperty('--reel-offset-x',(x * .52).toFixed(1)+'px');
    root.style.setProperty('--reel-offset-y',(-y * .45 + scrolling * 34).toFixed(1)+'px');
    root.style.setProperty('--reel-scroll',scrolling.toFixed(3));
    root.style.setProperty('--reel-zoom',(1.025 + scrolling * .055).toFixed(4));
  }
  const requestPaint=()=>{
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(paint);
  };
  window.addEventListener('pointermove',event=>{
    if(event.pointerType!=='mouse'&&event.pointerType!=='pen')return;
    pointerX=(event.clientX/Math.max(1,innerWidth)-.5)*2;
    pointerY=(event.clientY/Math.max(1,innerHeight)-.5)*2;
    requestPaint();
  },{passive:true});
  window.addEventListener('scroll',()=>{
    scrolling=Math.min(1,Math.max(0,window.scrollY/Math.max(1,hero.offsetHeight)));
    requestPaint();
  },{passive:true});
  document.addEventListener('visibilitychange',requestPaint);
  window.addEventListener('resize',requestPaint,{passive:true});
  reduced.addEventListener?.('change',requestPaint);
  document.querySelector('#motion-toggle')?.addEventListener('click',requestPaint);
  if('IntersectionObserver' in window) {
    new IntersectionObserver(entries=>{
      visible=Boolean(entries[0]?.isIntersecting);
      requestPaint();
    },{rootMargin:'80px'}).observe(hero);
  }

  const mobileMenu=document.querySelector('details.mobile-nav');
  mobileMenu?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{mobileMenu.open=false;}));
  mobileMenu?.addEventListener('keydown',event=>{
    if(event.key==='Escape'){mobileMenu.open=false;mobileMenu.querySelector('summary')?.focus();}
  });
  document.addEventListener('click',event=>{
    if(mobileMenu?.open&&!mobileMenu.contains(event.target))mobileMenu.open=false;
  });
  const sections=['work','process','about'];
  const nav=[...document.querySelectorAll('.site-header nav a[href^="#"]')];
  if('IntersectionObserver' in window) {
    const observer=new IntersectionObserver(entries=>{
      for(const item of entries){
        if(!item.isIntersecting)continue;
        for(const anchor of nav) {
          if(anchor.hash.slice(1)===item.target.id)anchor.setAttribute('aria-current','location');
          else anchor.removeAttribute('aria-current');
        }
      }
    },{rootMargin:'-25% 0px -60% 0px',threshold:0});
    for(const id of sections){const item=document.getElementById(id);if(item)observer.observe(item);}
  }
  requestPaint();
})();
