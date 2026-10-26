'use strict';

const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
let motionPaused = motionPreference.matches;
let manualMotionChoice = false;
const stages = [];
const motionToggle = document.querySelector('#motion-toggle');
const root = document.documentElement;

function updateMotion() {
  root.classList.toggle('motion-paused', motionPaused);
  motionToggle.setAttribute('aria-pressed', String(motionPaused));
  motionToggle.setAttribute('aria-label', motionPaused ? 'Play animation' : 'Pause animation');
  motionToggle.querySelector('.motion-icon').textContent = motionPaused ? '▷' : 'Ⅱ';
  stages.forEach(stage => stage.setPaused(motionPaused));
}
motionToggle.addEventListener('click', () => { manualMotionChoice = true; motionPaused = !motionPaused; updateMotion(); });
motionPreference.addEventListener('change', event => { if (!manualMotionChoice) { motionPaused = event.matches; updateMotion(); } });
updateMotion();

if ('IntersectionObserver' in window && !motionPaused) {
  root.classList.add('js-reveal');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); } });
  }, { threshold: 0.07, rootMargin: '0px 0px -20px 0px' });
  document.querySelectorAll('.reveal').forEach(element => observer.observe(element));
  // A true WebGL environment can cause short IntersectionObserver delays on
  // slow/software GPUs. Native scroll must never leave real project records
  // invisible just because someone moves through the site quickly.
  let lastRevealedScrollY=window.scrollY;
  const revealCurrentlyVisible = () => {
    const currentY=window.scrollY;
    // Sweep the ENTIRE traversed interval, not only the destination viewport.
    // A 3D frame can overlap one scroll event and jump over a small heading.
    const scanTop=Math.min(lastRevealedScrollY,currentY)-120;
    const scanBottom=Math.max(lastRevealedScrollY,currentY)+innerHeight+120;
    document.querySelectorAll('.reveal:not(.visible)').forEach(element => {
      const box=element.getBoundingClientRect();
      const top=box.top+currentY,bottom=box.bottom+currentY;
      if (top<scanBottom && bottom>scanTop && box.width>0 && box.height>0) {
        element.classList.add('visible');
        observer.unobserve(element);
      }
    });
    lastRevealedScrollY=currentY;
  };
  window.addEventListener('scroll',revealCurrentlyVisible,{passive:true});
  window.addEventListener('resize',revealCurrentlyVisible,{passive:true});
  requestAnimationFrame(revealCurrentlyVisible);
}

let progressScheduled = false;
function updateProgress() {
  const max = root.scrollHeight - window.innerHeight;
  document.querySelector('.scroll-progress').style.transform = `scaleX(${max > 0 ? Math.min(1, window.scrollY / max) : 0})`;
  progressScheduled = false;
}
window.addEventListener('scroll', () => { if (!progressScheduled) { progressScheduled = true; requestAnimationFrame(updateProgress); } }, { passive: true });
window.addEventListener('resize', updateProgress, { passive: true });
updateProgress();
document.querySelector('#year').textContent = String(new Date().getFullYear());

const projects = {
  anevum: {
    number: '01', title: 'ANEVUM', category: 'A HOME FOR CREATORS', tagline: 'A digital world built around the things people make.',
    image: '/portfolio/assets/anevum-interface.webp', alt: 'ANEVUM Discover interface prototype with synthetic review content',
    challenge: 'Bring independent projects, people, and discovery into one coherent place. A creator community needs a sense of belonging, but it also needs a clear path from curiosity to actually trying something.',
    response: 'I’m developing the product direction, visual language, and interfaces together: a recognizable identity, a cinematic entrance, a browsable project catalogue, and member experiences that give the work context.',
    takeaway: 'The interface is part of the invitation. The aim is to make participation feel expressive, approachable, and worth returning to.',
    role: 'Founder · product direction · UI design · independent development',
    focus: 'Brand language, discovery, community navigation, responsive interfaces',
    status: 'Creator V1 — active development',
    note: 'The image is an actual screenshot of an offline interface prototype. Catalogue entries, release counts, and activity shown in that review fixture are synthetic. They are design test content, not public usage or release claims.',
    url: 'https://anevum.com', link: 'Visit ANEVUM'
  },
  fold: {
    number: '02', title: 'The Fold', category: 'REAL LIFE, REIMAGINED', tagline: 'A real-life RPG about going out, paying attention, and making memories.',
    image: '/portfolio/assets/fold-interface.webp', alt: 'The Fold illustrated mobile demo with local quests and location disabled', phone: true,
    challenge: 'Design a game whose most meaningful moments happen away from the screen. The interaction should invite people into shared experiences, then help them remember what happened.',
    response: 'I’m building a playable prototype around small quests, local progression, and an adventure book. The illustrated map gives ordinary actions a sense of place and possibility.',
    takeaway: 'A compelling game loop can encourage real connection. The product is designed to make the next small adventure feel accessible.',
    role: 'Concept · experience design · game systems · prototyping',
    focus: 'Quest navigation, Level 0 progression, local saves, memory capture',
    status: 'Private playable prototype · working title',
    note: 'This is a development prototype, not a released multiplayer game. The pictured map is an illustrated demo; it does not show live GPS. Shared account synchronization and multiplayer are not demonstrated here.',
    url: null, link: null
  },
  rhen: {
    number: '03', title: 'RHEN', category: 'SYSTEMS YOU CAN UNDERSTAND', tagline: 'Research tools and interfaces for seeing what a complex system is doing.',
    image: '/portfolio/assets/rhen-interface.webp', alt: 'RHEN read-only Research Console showing an offline development runtime', phone: true,
    challenge: 'Make a complicated research and automation workflow understandable. People need to distinguish an idea, a test, a result, and a system’s actual current state.',
    response: 'My work spans research dashboards, bot infrastructure, workflow organization, and control interfaces. The current console makes the development state visible and separates research exploration from execution.',
    takeaway: 'Clarity builds trust. A dashboard should help someone understand a system’s limits as well as its possibilities.',
    role: 'Independent maker · system design · UI design · automation',
    focus: 'Research interfaces, evidence, state visibility, workflow controls',
    status: 'Read-only research workspace · successor build in development',
    note: 'The pictured console has no running trading engine or connected brokerage account. The current successor is an unmerged development candidate. This portfolio makes no investment-return, validated-strategy, or live-trading claims.',
    url: null, link: null
  },
  transcosmic: {
    number: '04', title: 'Transcosmic', category: 'A UNIVERSE IN THE MAKING', tagline: 'Connected fiction, larger questions, and worlds built through writing.',
    art: true,
    challenge: 'Build an enormous connected setting without losing the human stories that make it worth exploring. Scientific curiosity and far-reaching ideas need to become readable fiction, not an endless catalogue of concepts.',
    response: 'I am writing and developing the stories while shaping the histories, environments, and internal logic that support them. Visual studies like the dimensional Continuance field are explorations of the setting, not replacements for finishing the books.',
    takeaway: 'An imagined universe earns its scale through the people and stories inside it. The writing comes first; the connected systems exist to serve it.',
    role: 'Author · worldbuilder · creative direction',
    focus: 'Fiction writing, narrative continuity, science-informed worldbuilding, visual studies',
    status: 'Writing and creative development in progress',
    note: 'The Transcosmic environments here are original portfolio visual studies. They are not footage of a released game, application, or finished digital experience.',
    url: null, link: null
  }
};

const dialog = document.querySelector('#project-dialog');
let lastProjectTrigger = null;
function openProject(key, trigger) {
  const project = projects[key];
  if (!project) return;
  lastProjectTrigger = trigger || lastProjectTrigger || document.activeElement;
  document.querySelector('#case-number').textContent = `PROJECT ${project.number} / SELECTED WORK`;
  const visual = project.art
    ? '<div class="case-image case-art transcosmic-visual"><div class="transcosmic-portal-thumb" aria-hidden="true"></div><div class="cosmic-title" aria-hidden="true"><span>THE</span>TRANSCOSMIC<small>A UNIVERSE IN THE MAKING.</small></div></div>'
    : `<div class="case-image ${project.phone ? 'phone' : ''}"><img src="${project.image}" alt="${project.alt}"></div>`;
  document.querySelector('#case-content').innerHTML = `
    <div class="case-intro"><div><span class="eyebrow">${project.category}</span><h2 id="case-title">${project.title}</h2></div><p>${project.tagline}</p></div>
    ${visual}
    <div class="case-navigation" role="group" aria-label="Browse project stories"><button type="button" data-case-direction="-1" aria-label="Previous project story">← Previous project</button><span>RECORD ${project.number} / 04</span><button type="button" data-case-direction="1" aria-label="Next project story">Next project →</button><button type="button" data-copy-case>Copy direct link ↗</button></div>
    <div class="case-body"><div><h3>The idea</h3><p>${project.challenge}</p><h3>The work</h3><p>${project.response}</p><h3>The point of view</h3><p>${project.takeaway}</p></div>
    <div><dl class="case-facts"><dt>MY ROLE</dt><dd>${project.role}</dd><dt>DESIGN FOCUS</dt><dd>${project.focus}</dd><dt>CURRENT CONTEXT</dt><dd>${project.status}</dd></dl><p class="case-note">${project.note}</p><div class="case-cta">${project.url ? `<a href="${project.url}" class="button primary" target="_blank" rel="noopener noreferrer">${project.link} <span aria-hidden="true">↗</span></a>` : ''}<a href="#contact" class="text-link case-contact">Talk about a similar project <span aria-hidden="true">↗</span></a></div></div></div>`;
  dialog.dataset.project = key;
  if (!dialog.open) dialog.showModal();
  const shared = new URL(window.location.href);
  shared.searchParams.set("project", key);
  history.replaceState(history.state, "", shared.pathname + shared.search + shared.hash);
  document.body.style.overflow = 'hidden';
  dialog.scrollTop = 0;
  dialog.querySelector('.case-contact').addEventListener('click', () => dialog.close());
  if (!trigger || !dialog.contains(document.activeElement)) dialog.querySelector('.case-close').focus({ preventScroll: true });
  dialog.querySelectorAll('[data-case-direction]').forEach(button => button.addEventListener('click', () => {
    const names = Object.keys(projects);
    const index = names.indexOf(dialog.dataset.project);
    const delta = Number(button.dataset.caseDirection);
    openProject(names[(index + delta + names.length) % names.length], lastProjectTrigger);
  }));
  dialog.querySelector('[data-copy-case]')?.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(window.location.href); toast('Case study link copied.'); }
    catch { toast('Copy this page address to share the case study.'); }
  });
  if (!motionPaused && typeof dialog.animate === 'function') dialog.animate([{ opacity: 0, transform: 'translateY(20px) scale(.98)' }, { opacity: 1, transform: 'translateY(0) scale(1)' }], { duration: 380, easing: 'cubic-bezier(.2,.7,.2,1)' });
}
document.querySelectorAll('[data-project]').forEach(button => button.addEventListener('click', () => openProject(button.dataset.project, button)));
dialog.querySelector('.case-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close(); } });
dialog.addEventListener('close', () => {
  document.body.style.overflow = '';
  const current = new URL(window.location.href);
  if (current.searchParams.has('project')) { current.searchParams.delete('project'); history.replaceState(history.state, '', current.pathname + current.search + current.hash); }
  lastProjectTrigger?.focus?.({ preventScroll: true });
});
window.addEventListener('popstate', () => {
  const key = new URLSearchParams(window.location.search).get('project');
  if (key && Object.hasOwn(projects, key)) openProject(key);
  else if (dialog.open) dialog.close();
});
const directProject = new URLSearchParams(window.location.search).get('project');
if (directProject && Object.hasOwn(projects, directProject)) openProject(directProject);
dialog.addEventListener('keydown', event => {
  if (!dialog.open || !['ArrowLeft','ArrowRight'].includes(event.key) || event.target.closest('input,textarea,select')) return;
  event.preventDefault();
  const names = Object.keys(projects);
  const current = names.indexOf(dialog.dataset.project);
  openProject(names[(current + (event.key === 'ArrowRight' ? 1 : -1) + names.length) % names.length], lastProjectTrigger);
});

document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
  const filter = button.dataset.filter;
  document.querySelectorAll('[data-filter]').forEach(item => { const active = item === button; item.classList.toggle('active', active); item.setAttribute('aria-pressed', String(active)); });
  let count = 0;
  document.querySelectorAll('.project').forEach(project => { const show = filter === 'all' || project.dataset.category === filter; project.hidden = !show; if (show) { count++; project.classList.add('visible'); } });
  document.querySelector('#work-count').textContent = `${String(count).padStart(2, '0')} PROJECTS`;
}));

let toastTimer;
function toast(message) { const element = document.querySelector('#toast'); element.textContent = message; element.classList.add('visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => element.classList.remove('visible'), 3500); }
document.querySelector('#copy-email').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText('devon@anevum.com'); toast('Email copied. Let’s make something.'); }
  catch { toast('Email: devon@anevum.com'); }
});
document.querySelector('#brief-form').addEventListener('submit', event => {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const data = new FormData(form);
  const subject = `Portfolio inquiry — ${data.get('interest')}`;
  const body = `Hi Devon,\n\nI’m interested in: ${data.get('interest')}.\n\n${String(data.get('brief')).trim()}\n\n—\nSent from your portfolio`;
  window.location.href = `mailto:devon@anevum.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  document.querySelector('#form-status').textContent = 'If your email app did not open, email devon@anevum.com directly. Your message has not been sent by this site.';
});

// Both old isolated sculpture renderers remain retired. The portfolio's sole
// decorative 3D field is managed by transcosmic-depth-v2.js; case-study
// dialogs, record content and native interactions remain regular accessible DOM.
const processFrames = Object.freeze({
  understand: ['01 / RESEARCH','Find the real problem.','Establish the constraints, explore the people and systems involved, and decide what should be built first.'],
  make: ['02 / DESIGN + CODE','Make something someone can use.','Build the smallest working version, refine the hierarchy and interactions, and connect the interface to real behavior.'],
  verify: ['03 / TEST + DOCUMENT','Show what is actually true.','Test real devices and workflows. Identify limitations, record the evidence, and improve the work before claiming it is finished.']
});
const processKeys = Object.keys(processFrames);
function activateProcess(key) {
  const frame = processFrames[key];
  if (!frame) return;
  document.querySelector('#process-index').textContent = frame[0];
  document.querySelector('#process-heading').textContent = frame[1];
  document.querySelector('#process-description').textContent = frame[2];
  document.querySelector('.process-stage').dataset.stage = key;
  document.querySelectorAll('[data-process]').forEach(button => {
    const active = button.dataset.process === key;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
}
document.querySelectorAll('[data-process]').forEach(button => {
  button.addEventListener('click', () => activateProcess(button.dataset.process));
  button.addEventListener('keydown', event => {
    if (!['ArrowLeft','ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    const i = processKeys.indexOf(button.dataset.process);
    const next = processKeys[(i + processKeys.length + (event.key === 'ArrowRight' ? 1 : -1)) % processKeys.length];
    activateProcess(next);
    document.querySelector('[data-process="' + next + '"]').focus();
  });
});
