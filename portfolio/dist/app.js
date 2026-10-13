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
    image: '/assets/anevum-interface.webp', alt: 'ANEVUM Discover interface prototype with synthetic review content',
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
    image: '/assets/fold-interface.webp', alt: 'The Fold illustrated mobile demo with local quests and location disabled', phone: true,
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
    image: '/assets/rhen-interface.webp', alt: 'RHEN read-only Research Console showing an offline development runtime', phone: true,
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

// The orbital sculpture is generated live in the browser. No model downloads or external runtime.
const vertexShader = `attribute vec2 a_position;void main(){gl_Position=vec4(a_position,0.0,1.0);}`;
const fragmentShader = `
precision highp float;
uniform vec2 u_resolution;
uniform vec2 u_pointer;
uniform float u_time;
uniform vec3 u_material;
uniform float u_light;
mat2 rotation(float a){float s=sin(a),c=cos(a);return mat2(c,-s,s,c);}
vec3 transformPoint(vec3 p){p.xy=rotation(-0.53+u_pointer.x*0.26)*p.xy;p.yz=rotation(0.9+u_pointer.y*0.35)*p.yz;p.xz=rotation(u_time*0.065)*p.xz;return p;}
float shape(vec3 p){p=transformPoint(p);float a=atan(p.z,p.x);float r=1.28+0.10*sin(3.0*a+u_time*0.13);vec2 q=vec2(length(p.xz)-r,p.y+0.12*sin(a*2.0));float groove=0.0045*sin(a*82.0+atan(q.y,q.x)*16.0);return length(q)-(0.37+0.025*cos(a*3.0))+groove;}
vec3 normal(vec3 p){vec2 e=vec2(0.002,0.0);return normalize(vec3(shape(p+e.xyy)-shape(p-e.xyy),shape(p+e.yxy)-shape(p-e.yxy),shape(p+e.yyx)-shape(p-e.yyx)));}
float occlusion(vec3 p,vec3 n){float a=0.0,w=1.0;for(int i=1;i<4;i++){float h=0.08*float(i);a+=max(0.0,h-shape(p+n*h))*w;w*=0.55;}return clamp(1.0-a*1.7,0.0,1.0);}
void main(){vec2 uv=(gl_FragCoord.xy*2.0-u_resolution.xy)/min(u_resolution.x,u_resolution.y);vec3 ro=vec3(0.0,0.0,5.4);vec3 rd=normalize(vec3(uv,-3.0));float t=0.0;bool hit=false;for(int i=0;i<75;i++){vec3 p=ro+rd*t;float d=shape(p);if(d<0.0017){hit=true;break;}t+=d*0.8;if(t>9.0)break;}if(!hit){gl_FragColor=vec4(0.0);return;}vec3 p=ro+rd*t;vec3 n=normal(p);vec3 v=-rd;vec3 l=normalize(vec3(-2.0,3.5,4.0));vec3 l2=normalize(vec3(3.0,-1.0,1.5));float diffuse=max(dot(n,l),0.0);float fill=max(dot(n,l2),0.0);vec3 halfV=normalize(l+v);float spec=pow(max(dot(n,halfV),0.0),48.0);float spec2=pow(max(dot(reflect(-l2,n),v),0.0),24.0);float fresnel=pow(1.0-max(dot(n,v),0.0),3.0);vec3 refl=reflect(rd,n);float band=pow(max(0.0,1.0-abs(refl.y-0.25)*2.2),6.0);float ao=occlusion(p,n);vec3 color=u_material*(0.17+diffuse*0.63+fill*0.22);color+=vec3(1.0,0.88,0.75)*(spec*1.2+band*0.43);color+=vec3(0.59,0.50,0.86)*spec2*0.5;color+=u_material*fresnel*0.32;color*=ao;color=mix(color,color*0.94+vec3(0.06),u_light);color=pow(color,vec3(0.86));gl_FragColor=vec4(color,1.0);}`;

class Sculpture {
  constructor(canvas, light = false) {
    this.canvas = canvas; this.parent = canvas.parentElement; this.light = light; this.pointer = [0, 0]; this.current = [0, 0]; this.time = 0; this.lastFrame = 0; this.frame = 0; this.visible = true; this.paused = motionPaused; this.material = [0.72, 0.39, 0.24];
    this.gl = canvas.getContext('webgl', { alpha: true, antialias: false, powerPreference: 'low-power', preserveDrawingBuffer: false });
    if (!this.gl) { this.canvas.hidden = true; return; }
    const gl = this.gl;
    const compile = (source, type) => { const shader = gl.createShader(type); gl.shaderSource(shader, source); gl.compileShader(shader); if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) { gl.deleteShader(shader); throw new Error('Shader unavailable'); } return shader; };
    try {
      const vs = compile(vertexShader, gl.VERTEX_SHADER), fs = compile(fragmentShader, gl.FRAGMENT_SHADER);
      this.program = gl.createProgram(); gl.attachShader(this.program, vs); gl.attachShader(this.program, fs); gl.linkProgram(this.program); gl.deleteShader(vs); gl.deleteShader(fs);
      if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) throw new Error('Program unavailable');
      gl.useProgram(this.program);
      const buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);
      const position = gl.getAttribLocation(this.program, 'a_position'); gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
      this.uniform = Object.fromEntries(['resolution','pointer','time','material','light'].map(key => [key, gl.getUniformLocation(this.program, `u_${key}`)]));
      this.parent.classList.add('webgl-ready');
      this.resize();
      if ('ResizeObserver' in window) new ResizeObserver(() => this.resize()).observe(this.parent);
      else window.addEventListener('resize', () => this.resize(), { passive: true });
      this.parent.addEventListener('pointermove', event => {
        if (event.pointerType === 'touch' && event.buttons === 0) return;
        const rect = this.parent.getBoundingClientRect(); this.pointer = [(event.clientX - rect.left) / rect.width * 2 - 1, (event.clientY - rect.top) / rect.height * 2 - 1];
        if (this.paused) { this.current = this.pointer.slice(); this.draw(); }
      }, { passive: true });
      this.parent.addEventListener('pointerleave', () => { this.pointer = [0, 0]; });
      this.canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); cancelAnimationFrame(this.frame); this.parent.classList.remove('webgl-ready'); this.canvas.hidden = true; });
      if ('IntersectionObserver' in window) new IntersectionObserver(entries => { this.visible = entries[0].isIntersecting; this.manageLoop(); }, { rootMargin: '100px' }).observe(this.parent);
      this.draw(); this.manageLoop();
    } catch { this.canvas.hidden = true; this.parent.classList.remove('webgl-ready'); this.program = null; }
  }
  resize() {
    if (!this.program) return;
    const rect = this.parent.getBoundingClientRect();
    const resolutionScale = window.innerWidth < 600 ? 0.8 : 0.85;
    const ratio = Math.min(Math.min(window.devicePixelRatio || 1, 1.3) * resolutionScale, 960 / Math.max(rect.width, rect.height, 1));
    this.canvas.width = Math.max(1, Math.round(rect.width * ratio));
    this.canvas.height = Math.max(1, Math.round(rect.height * ratio));
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height); this.draw();
  }
  draw() {
    if (!this.program || this.gl.isContextLost()) return;
    const gl = this.gl; gl.useProgram(this.program);
    gl.uniform2f(this.uniform.resolution, this.canvas.width, this.canvas.height); gl.uniform2fv(this.uniform.pointer, this.current); gl.uniform1f(this.uniform.time, this.time); gl.uniform3fv(this.uniform.material, this.material); gl.uniform1f(this.uniform.light, this.light ? 1 : 0); gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
  manageLoop() {
    cancelAnimationFrame(this.frame);
    if (!this.program || this.paused || !this.visible || document.hidden || this.gl.isContextLost()) return;
    this.lastFrame = 0;
    const tick = timestamp => {
      if (!this.lastFrame || timestamp - this.lastFrame >= 1000 / 24) {
        const delta = this.lastFrame ? Math.min((timestamp - this.lastFrame) / 1000, 0.08) : 0;
        this.lastFrame = timestamp; this.time += delta;
        this.current[0] += (this.pointer[0] - this.current[0]) * 0.07; this.current[1] += (this.pointer[1] - this.current[1]) * 0.07;
        this.draw();
      }
      this.frame = requestAnimationFrame(tick);
    };
    this.frame = requestAnimationFrame(tick);
  }
  setPaused(paused) { this.paused = paused; this.draw(); this.manageLoop(); }
  setMaterial(material) { this.material = material; this.draw(); }
}

stages.push(new Sculpture(document.querySelector('#sculpture')));
stages.push(new Sculpture(document.querySelector('#play-sculpture'), true));
document.addEventListener('visibilitychange', () => stages.forEach(stage => stage.manageLoop()));

const materials = { copper: { color: [0.72,0.39,0.24], note: '01 / COPPER — WARM, TACTILE, ALIVE.', fallback: '#bd805d' }, pearl: { color: [0.62,0.67,0.74], note: '02 / PEARL — QUIET, REFLECTIVE, PRECISE.', fallback: '#aab3bd' }, violet: { color: [0.47,0.28,0.71], note: '03 / VIOLET — CURIOUS, OTHERWORLDLY, EXPRESSIVE.', fallback: '#9570b8' } };
document.querySelectorAll('[data-material]').forEach(button => button.addEventListener('click', () => {
  const material = materials[button.dataset.material];
  document.querySelectorAll('[data-material]').forEach(item => { const active = item === button; item.classList.toggle('active', active); item.setAttribute('aria-pressed', String(active)); });
  stages.forEach(stage => stage.setMaterial(material.color));
  document.querySelector('#material-note').textContent = material.note;
  document.querySelector('.play-fallback').style.borderColor = material.fallback;
  document.querySelector('.orbital-fallback').style.borderColor = material.fallback;
}));
