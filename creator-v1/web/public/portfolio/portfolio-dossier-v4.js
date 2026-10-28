/* ANEVUM Portfolio V136.042 / evidence-led case-story director.
 * One decorative DOM reel; the hero is the only WebGL renderer.
 * Each chapter describes an existing portfolio record, never live user data. */
(() => {
  'use strict';
  const stage = document.querySelector('[data-portfolio-dossier]');
  if (!stage) return;
  const media = stage.querySelector('.dossier-media');
  const image = stage.querySelector('[data-dossier-image]');
  const count = stage.querySelector('[data-dossier-count]');
  const category = stage.querySelector('[data-dossier-kind-label]');
  const name = stage.querySelector('[data-dossier-name]');
  const description = stage.querySelector('[data-dossier-description]');
  const proof = stage.querySelector('[data-dossier-proof]');
  const state = stage.querySelector('[data-dossier-status]');
  const open = stage.querySelector('#dossier-open');
  const controls = [...stage.querySelectorAll('[data-dossier-select]')];
  if (!media || !image || !count || !category || !name || !description || !proof || !state || !open || controls.length !== 4) return;
  const chapters = Object.freeze({
    anevum: Object.freeze({
      number:'01',kind:'desktop',label:'COMMUNITY / PLATFORM',
      title:'ANEVUM',description:'A creator-first product, built around discovering and sharing things people make.',
      status:'ACTIVE PRODUCT DEVELOPMENT',
      proof:'INTERFACE PROTOTYPE / SYNTHETIC REVIEW CONTENT',
      src:'/portfolio/assets/anevum-interface.webp',
      alt:'ANEVUM Discover offline interface prototype; the catalogue shown is synthetic review content.'
    }),
    fold: Object.freeze({
      number:'02',kind:'phone',label:'PLAYABLE EXPERIMENT',
      title:'The Fold',description:'An early playable prototype that turns ordinary days into small adventures.',
      status:'PRIVATE PLAYABLE PROTOTYPE',
      proof:'ILLUSTRATED DEMO / NO LIVE GPS',
      src:'/portfolio/assets/fold-interface.webp',
      alt:'The Fold illustrated mobile prototype showing local quests, not a live GPS map.'
    }),
    rhen: Object.freeze({
      number:'03',kind:'phone',label:'RESEARCH / INTERFACES',
      title:'RHEN',description:'A research workspace designed to make complicated automation and systems understandable.',
      status:'READ-ONLY RESEARCH INTERFACE',
      proof:'DEVELOPMENT SCREEN / NO LIVE TRADING SHOWN',
      src:'/portfolio/assets/rhen-interface.webp',
      alt:'RHEN read-only research console development screenshot; no connected live trading account is shown.'
    }),
    transcosmic: Object.freeze({
      number:'04',kind:'art',label:'FICTION / WORLDBUILDING',
      title:'Transcosmic',description:'An interconnected fictional universe. The books and human stories come before the worldbuilding systems.',
      status:'WRITING AND CREATIVE DEVELOPMENT',
      proof:'ORIGINAL ENVIRONMENT ART STUDY / NOT GAMEPLAY',
      src:'/portfolio/assets/transcosmic-continuum.svg',
      alt:'Original Transcosmic dimensional environment art study, not a released game or film.'
    })
  });
  const order = Object.keys(chapters);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const saveData = navigator.connection?.saveData === true;
  let active = 'anevum';
  const root = document.documentElement;
  function choose(key, focus = false) {
    if (!Object.prototype.hasOwnProperty.call(chapters,key)) return;
    const data = chapters[key];
    const changed = active !== key;
    active = key;
    stage.dataset.dossierProject = key;
    stage.dataset.dossierKind = data.kind;
    media.dataset.dossierIndex = data.number;
    count.textContent = data.number + ' / 04';
    category.textContent = data.label;
    name.textContent = data.title;
    description.textContent = data.description;
    proof.textContent = data.proof;
    state.textContent = data.status;
    if (image.getAttribute('src') !== data.src) image.setAttribute('src',data.src);
    image.alt = data.alt;
    open.dataset.project = key;
    open.setAttribute('aria-label','Open ' + data.title + ' project story');
    controls.forEach(button => {
      const selected = button.dataset.dossierSelect === key;
      button.setAttribute('aria-pressed',String(selected));
      if (selected && focus) button.focus({preventScroll:true});
    });
    media.dataset.sweep = 'false';
    if (changed && !reduced.matches && !saveData && !root.classList.contains('motion-paused')) {
      // Click/keyboard-triggered animation only; never auto-cycle the work.
      void media.offsetWidth;
      media.dataset.sweep = 'true';
    }
  }
  controls.forEach(button => {
    button.addEventListener('click',() => choose(button.dataset.dossierSelect));
    button.addEventListener('keydown',event => {
      if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
      event.preventDefault();
      const index = order.indexOf(button.dataset.dossierSelect);
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? order.length-1
        : (index + (event.key === 'ArrowRight'?1:-1) + order.length) % order.length;
      choose(order[next],true);
    });
  });
  document.querySelector('#motion-toggle')?.addEventListener('click',() => {
    if (root.classList.contains('motion-paused')) media.dataset.sweep = 'false';
  });
  choose('anevum');
})();
