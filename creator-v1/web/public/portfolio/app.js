'use strict';

const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
let motionPaused = motionPreference.matches;
let manualMotionChoice = false;
const motionToggle = document.querySelector('#motion-toggle');
const root = document.documentElement;

function updateMotion() {
  root.classList.toggle('motion-paused', motionPaused);
  motionToggle.setAttribute('aria-pressed', String(motionPaused));
  motionToggle.setAttribute('aria-label', motionPaused ? 'Play animation' : 'Pause animation');
  motionToggle.querySelector('.motion-icon').textContent = motionPaused ? '▷' : 'Ⅱ';
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
    number: '04', title: 'Transcosmic', category: 'A UNIVERSE IN THE MAKING', tagline: 'A long-form creative universe where story and systems grow together.',
    art: true,
    challenge: 'Build a fictional universe that is expansive enough to invite discovery and coherent enough to sustain stories. Its ideas need to connect, not just accumulate.',
    response: 'I develop the writing, internal logic, and worldbuilding as one creative practice. This work feeds the way I approach digital experiences: establish a world, give it rules, and make people want to step inside.',
    takeaway: 'Storytelling and product design share a question: what makes someone care enough to keep exploring?',
    role: 'Author · worldbuilder · creative direction',
    focus: 'Narrative, connected world systems, visual imagination',
    status: 'Ongoing writing and creative development',
    note: 'The celestial artwork was created for this portfolio as a visual interpretation. It is not a screenshot of a released Transcosmic application. The current project is presented as creative development.',
    url: null, link: null
  }
};

const dialog = document.querySelector('#project-dialog');
let lastProjectTrigger = null;
function openProject(key, trigger) {
  const project = projects[key];
  if (!project) return;
  lastProjectTrigger = trigger;
  document.querySelector('#case-number').textContent = `PROJECT ${project.number} / SELECTED WORK`;
  const visual = project.art
    ? '<div class="case-image case-art transcosmic-visual"><div class="cosmic-orbit" aria-hidden="true"></div><div class="cosmic-planet" aria-hidden="true"></div><div class="cosmic-moon" aria-hidden="true"></div><div class="cosmic-title" aria-hidden="true"><span>THE</span>TRANSCOSMIC<small>A UNIVERSE IN THE MAKING.</small></div></div>'
    : `<div class="case-image ${project.phone ? 'phone' : ''}"><img src="${project.image}" alt="${project.alt}"></div>`;
  document.querySelector('#case-content').innerHTML = `
    <div class="case-intro"><div><span class="eyebrow">${project.category}</span><h2 id="case-title">${project.title}</h2></div><p>${project.tagline}</p></div>
    ${visual}
    <div class="case-body"><div><h3>The idea</h3><p>${project.challenge}</p><h3>The work</h3><p>${project.response}</p><h3>The point of view</h3><p>${project.takeaway}</p></div>
    <div><dl class="case-facts"><dt>MY ROLE</dt><dd>${project.role}</dd><dt>DESIGN FOCUS</dt><dd>${project.focus}</dd><dt>CURRENT CONTEXT</dt><dd>${project.status}</dd></dl><p class="case-note">${project.note}</p><div class="case-cta">${project.url ? `<a href="${project.url}" class="button primary" target="_blank" rel="noopener noreferrer">${project.link} <span aria-hidden="true">↗</span></a>` : ''}<a href="#contact" class="text-link case-contact">Talk about a similar project <span aria-hidden="true">↗</span></a></div></div></div>`;
  dialog.showModal();
  document.body.style.overflow = 'hidden';
  dialog.scrollTop = 0;
  dialog.querySelector('.case-contact').addEventListener('click', () => dialog.close());
  dialog.querySelector('.case-close').focus({ preventScroll: true });
  if (!motionPaused && typeof dialog.animate === 'function') dialog.animate([{ opacity: 0, transform: 'translateY(20px) scale(.98)' }, { opacity: 1, transform: 'translateY(0) scale(1)' }], { duration: 380, easing: 'cubic-bezier(.2,.7,.2,1)' });
}
document.querySelectorAll('[data-project]').forEach(button => button.addEventListener('click', () => openProject(button.dataset.project, button)));
dialog.querySelector('.case-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close(); } });
dialog.addEventListener('close', () => { document.body.style.overflow = ''; lastProjectTrigger?.focus({ preventScroll: true }); });

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


const featureContent = {
  anevum: {
    path: 'anevum.com / discover',
    type: '01 / CREATOR COMMUNITY',
    name: 'ANEVUM',
    caption: 'A home for independent projects and the people who make them.',
    status: 'CREATOR V1 / ACTIVE DEVELOPMENT',
    image: projects.anevum.image,
    alt: projects.anevum.alt,
    portrait: false
  },
  fold: {
    path: 'THE FOLD / PRIVATE PROTOTYPE',
    type: '02 / EXPERIENCE DESIGN',
    name: 'The Fold',
    caption: 'Making everyday adventures feel like a game worth playing.',
    status: 'PRIVATE PLAYABLE PROTOTYPE',
    image: projects.fold.image,
    alt: projects.fold.alt,
    portrait: true
  },
  rhen: {
    path: 'RHEN / RESEARCH WORKSPACE',
    type: '03 / SOFTWARE & SYSTEMS',
    name: 'RHEN',
    caption: 'Clear interfaces for complicated research and automation.',
    status: 'READ-ONLY DEVELOPMENT WORKSPACE',
    image: projects.rhen.image,
    alt: projects.rhen.alt,
    portrait: true
  }
};

let currentFeature = 'anevum';
const featuredImage = document.querySelector('#featured-image');
const featureScreen = document.querySelector('#feature-screen');
const featureOpen = document.querySelector('#feature-open');

function showFeature(key) {
  const item = featureContent[key];
  if (!item || !featuredImage || !featureScreen) return;
  currentFeature = key;
  // No autoplay: visitors decide which project to inspect.
  document.querySelector('#featured-path').textContent = item.path;
  document.querySelector('#featured-type').textContent = item.type;
  document.querySelector('#featured-name').textContent = item.name;
  document.querySelector('#featured-caption').textContent = item.caption;
  document.querySelector('#featured-status').textContent = item.status;
  featuredImage.src = item.image;
  featuredImage.alt = item.alt;
  featureScreen.classList.toggle('is-portrait', item.portrait);
  document.querySelectorAll('[data-feature]').forEach(button => {
    const selected = button.dataset.feature === key;
    button.classList.toggle('active', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
}

document.querySelectorAll('[data-feature]').forEach(button => button.addEventListener('click', () => showFeature(button.dataset.feature)));
if (featureOpen) {
  featureOpen.addEventListener('click', () => {
    const trigger = document.querySelector('[data-feature="' + currentFeature + '"]') || featureOpen;
    openProject(currentFeature, trigger);
  });
}
