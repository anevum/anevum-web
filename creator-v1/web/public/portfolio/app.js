
"use strict";

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const root = document.documentElement;
const reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
let motionPaused = reduceQuery.matches;
let motionOverride = false;
let activeProject = "anevum";
let lastDossierTrigger = null;
let toastHandle = 0;

const CONTINUANCE_MARK = '<svg class="continuance-seal" viewBox="0 0 180 180" fill="none" aria-label="Continuance Institute unfinished-circle emblem with three parallel horizontal strokes"><path d="M118 35 A68 68 0 1 0 118 145" stroke="currentColor" stroke-width="5" stroke-linecap="square"/><path d="M10 69H166M10 90H166M10 111H166" stroke="currentColor" stroke-width="5" stroke-linecap="square"/></svg>';

const projects = Object.freeze({
  anevum: {
    order:"01", title:"ANEVUM", ident:"AKINS / OBJECT 001",
    type:"PRODUCT / CREATOR PLATFORM", description:"A home for independent projects and the people who make them.",
    state:"IN ACTIVE DEVELOPMENT",
    visual:"/portfolio/assets/anevum-interface.webp",
    alt:"ANEVUM Discover development screenshot with synthetic offline review content",
    challenge:"Build a place where independent makers can share real work, find each other, and participate without needing to pay.",
    solution:"I'm designing its identity, navigation, creator experience and software as one system. The interface grows alongside the actual publishing and community infrastructure.",
    takeaway:"A compelling community needs to be useful before it looks busy. A screenshot of a prototype is not evidence of live creators.",
    role:"Founder / product direction / interface design / development",
    status:"Creator V1: active development. The screenshot contains synthetic offline review entries, not real community participation.",
    link:"https://anevum.com",
    linkText:"VISIT ANEVUM ↗"
  },
  rhen: {
    order:"02", title:"RHEN", ident:"AKINS / OBJECT 002",
    type:"AUTOMATION / RESEARCH", description:"Research interfaces and automation for understanding complicated systems.",
    state:"READ-ONLY RESEARCH WORKSPACE",
    visual:"/portfolio/assets/rhen-interface.webp",
    alt:"RHEN read-only research interface development screenshot",
    challenge:"Make research and automation legible. Show what's being tested, what changed, and what the system can actually do.",
    solution:"I work across bot infrastructure, operational controls, research workflows, UI, data evidence and automation. The console separates ideas, experiments and evidence from execution.",
    takeaway:"A useful technical interface reveals the limits of a system as clearly as its capabilities.",
    role:"Systems design / research tooling / software / UI",
    status:"Read-only research development workspace. This preview does not represent live trading, a connected brokerage account or proven investment returns.",
    link:null
  },
  fold: {
    order:"03", title:"THE FOLD", ident:"AKINS / OBJECT 003",
    type:"GAME / EXPERIENCE", description:"A game about exploring the real world and making memories together.",
    state:"PRIVATE PLAYABLE PROTOTYPE",
    visual:"/portfolio/assets/fold-interface.webp",
    alt:"The Fold illustrated private gameplay prototype",
    challenge:"Make an experience that sends people back into the world instead of keeping them on a screen.",
    solution:"I'm prototyping quests, illustrated environments, local progression and an adventure book that turns ordinary family activities into play.",
    takeaway:"The point is the experience beyond the interface, not endless screen time.",
    role:"Game concept / UX / prototyping / narrative systems",
    status:"Private playable prototype and working title. Artwork is illustrative, not GPS, multiplayer or a publicly released game.",
    link:null
  },
  transcosmic: {
    order:"04", title:"TRANSCOSMIC", ident:"AKINS / OBJECT 004",
    type:"FICTION / WORLD SYSTEMS", description:"A connected fictional universe built through story, science and internal logic.",
    state:"ONGOING WRITING",
    visual:null,
    alt:"",
    challenge:"Give a large imaginary world coherent history, science, institutions and stories that are worth actually finishing.",
    solution:"I write fiction and research the ideas behind it. The Continuance Institute is a fictional institutional world within Transcosmic, with its own established architectural identity and exact emblem.",
    takeaway:"The fiction is a creative work. It is not presented as a real operating research institution.",
    role:"Author / worldbuilding / narrative / research",
    status:"Ongoing writing and original worldbuilding. The symbol shown is the established Continuance Institute emblem, not a logo for a deployed application.",
    link:null
  }
});

const keys = Object.keys(projects);
const artifact = $("#artifact");
const artifactImage = $("#artifact-image");
const dossier = $("#dossier-dialog");
const motionToggle = $("#motion-toggle");
const motionValue = $("#motion-value");
const worldNode = $("#world");
const worldCanvas = $("#architecture-canvas");
const cursor = $("#custom-pointer");

function setMotionState() {
  root.classList.toggle("motion-paused", motionPaused);
  motionToggle.setAttribute("aria-pressed", String(motionPaused));
  motionToggle.setAttribute("aria-label", motionPaused ? "Resume animation" : "Pause animation");
  motionValue.textContent = motionPaused ? "OFF" : "ON";
  scene?.setPaused(motionPaused);
}
motionToggle.addEventListener("click", () => {
  motionOverride = true;
  motionPaused = !motionPaused;
  setMotionState();
});
reduceQuery.addEventListener?.("change", event => {
  if (!motionOverride) {
    motionPaused = event.matches;
    setMotionState();
  }
});

function toast(message) {
  const node = $("#toast");
  node.textContent = message;
  node.classList.add("visible");
  window.clearTimeout(toastHandle);
  toastHandle = window.setTimeout(() => node.classList.remove("visible"), 2700);
}

function feature(key, withAnimation = true) {
  const p = projects[key];
  if (!p) return;
  activeProject = key;
  artifact.dataset.current = key;
  $("#artifact-ident").textContent = p.ident;
  $("#artifact-wordmark").textContent = p.title;
  $("#artifact-imprint").textContent = p.type;
  $("#exhibit-index").textContent = p.order + " / 04";
  $("#exhibit-title").textContent = p.title;
  $("#exhibit-description").textContent = p.description;
  $("#exhibit-state").textContent = p.state;
  artifact.setAttribute("aria-label", "Open " + p.title + " project record");
  if (p.visual) {
    artifactImage.src = p.visual;
    artifactImage.alt = p.alt;
  } else {
    artifactImage.removeAttribute("src");
    artifactImage.alt = "";
  }
  $$("[data-select]").forEach(button => {
    const selected = button.dataset.select === key;
    button.classList.toggle("active", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
  if (!motionPaused && withAnimation) {
    artifact.animate([
      {opacity:.35,filter:"blur(9px)", transform:"perspective(1100px) rotateY(-29deg) translateY(16px) scale(.96)"},
      {opacity:1,filter:"blur(0)", transform:"perspective(1100px) rotateY(-16deg) rotateX(6deg) rotateZ(-2deg) scale(1)"}
    ],{duration:650,easing:"cubic-bezier(.19,1,.22,1)"});
    $(".exhibit-summary")?.animate?.([{opacity:.25,transform:"translateY(9px)"},{opacity:1,transform:"translateY(0)"}],{duration:400,easing:"ease-out"});
  }
}

function relativeProject(direction) {
  feature(keys[(keys.indexOf(activeProject) + keys.length + direction) % keys.length]);
}
$$("[data-select]").forEach(button => {
  button.addEventListener("click", () => feature(button.dataset.select));
  button.addEventListener("keydown", event => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const next = (keys.indexOf(activeProject) + keys.length + (event.key === "ArrowRight" ? 1 : -1)) % keys.length;
    feature(keys[next]);
    $('[data-select="' + keys[next] + '"]').focus();
  });
});
$("#exhibit-zone").addEventListener("keydown", event => {
  if (event.target?.matches("[data-select]")) return;
  if (!["ArrowRight","ArrowLeft"].includes(event.key) || dossier.open) return;
  event.preventDefault();
  relativeProject(event.key === "ArrowRight" ? 1 : -1);
});
let touchStart = null;
$("#exhibit-zone").addEventListener("touchstart", event => {
  if (event.touches.length !== 1) return;
  touchStart = {x:event.touches[0].clientX,y:event.touches[0].clientY};
},{passive:true});
$("#exhibit-zone").addEventListener("touchend", event => {
  if (!touchStart || !event.changedTouches.length) return;
  const dx = event.changedTouches[0].clientX - touchStart.x;
  const dy = event.changedTouches[0].clientY - touchStart.y;
  touchStart = null;
  if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.6) relativeProject(dx < 0 ? 1 : -1);
},{passive:true});

let dragging = false;
let dragMoved = false;
let dragStart = null;
let blockNextClick = false;
artifact.addEventListener("pointerdown", event => {
  if (event.pointerType === "touch" && event.isPrimary === false) return;
  dragStart = {x:event.clientX, y:event.clientY};
  dragMoved = false;
  dragging = true;
});
artifact.addEventListener("pointermove", event => {
  if (motionPaused) return;
  const bounds = artifact.getBoundingClientRect();
  const rx = (event.clientX - (bounds.left + bounds.width * .5)) / Math.max(1,bounds.width);
  const ry = (event.clientY - (bounds.top + bounds.height * .5)) / Math.max(1,bounds.height);
  artifact.style.setProperty("--tilt-y", (rx * 13).toFixed(2) + "deg");
  artifact.style.setProperty("--tilt-x", (-ry * 10).toFixed(2) + "deg");
  artifact.style.setProperty("--shine-x", (rx * 27).toFixed(2) + "%");
  artifact.style.setProperty("--shine-y", (ry * 15).toFixed(2) + "%");
  if (dragging && dragStart && Math.hypot(event.clientX - dragStart.x,event.clientY - dragStart.y) > 8) dragMoved = true;
},{passive:true});
artifact.addEventListener("pointerup", () => {
  if (dragMoved) blockNextClick = true;
  dragging = false;
  dragStart = null;
});
artifact.addEventListener("pointercancel", () => {dragging=false;dragStart=null;dragMoved=false});
artifact.addEventListener("pointerleave", () => {
  if (!dragging) {
    artifact.style.setProperty("--tilt-y","0deg");
    artifact.style.setProperty("--tilt-x","0deg");
  }
});

function openDossier(key, trigger) {
  const p = projects[key];
  if (!p) return;
  lastDossierTrigger = trigger || document.activeElement;
  const media = p.visual
    ? '<div class="dossier-visual '+ (key === "anevum" ? "is-browser" : "") +'"><img src="'+p.visual+'" alt="'+p.alt+'"></div>'
    : '<div class="dossier-visual is-cosmic">'+CONTINUANCE_MARK+'</div>';
  const link = p.link ? '<a class="dossier-link" href="'+p.link+'" target="_blank" rel="noopener noreferrer">'+(p.linkText||"OPEN PROJECT ↗")+'</a>' : "";
  $("#dossier-content").innerHTML =
    '<div class="dossier-intro"><span class="record-eyebrow">RECORD '+p.order+' / '+p.type+'</span><h2 id="dossier-title">'+p.title+'</h2><p>'+p.description+'</p></div>'
    +media+
    '<div class="dossier-body"><div><h3>THE QUESTION</h3><p>'+p.challenge+'</p><h3>THE WORK</h3><p>'+p.solution+'</p><h3>WHAT MATTERS</h3><p>'+p.takeaway+'</p></div>'
    +'<div><dl class="dossier-facts"><dt>MY ROLE</dt><dd>'+p.role+'</dd><dt>CURRENT STATE</dt><dd>'+p.state+'</dd></dl><p class="dossier-context">'+p.status+'</p>'+link+'<a class="dossier-link" href="mailto:devon@anevum.com?subject='+encodeURIComponent("Portfolio / "+p.title)+'">TALK ABOUT THIS KIND OF WORK ↗</a></div></div>';
  dossier.showModal();
  document.body.style.overflow = "hidden";
  $(".dossier-close").focus({preventScroll:true});
}
function closeDossier() {dossier.close();}
$$("[data-open]").forEach(button => button.addEventListener("click", () => openDossier(button.dataset.open, button)));
artifact.addEventListener("click", event => {
  if (blockNextClick) {event.preventDefault();blockNextClick=false;return;}
  openDossier(activeProject, artifact);
});
$("#exhibit-open").addEventListener("click", () => openDossier(activeProject, $("#exhibit-open")));
$(".dossier-close").addEventListener("click", closeDossier);
dossier.addEventListener("click", event => {
  if (event.target !== dossier) return;
  const box = dossier.getBoundingClientRect();
  if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) closeDossier();
});
dossier.addEventListener("close", () => {
  document.body.style.overflow="";
  lastDossierTrigger?.focus?.({preventScroll:true});
});

$("#copy-email").addEventListener("click", async () => {
  try { await navigator.clipboard.writeText("devon@anevum.com"); toast("EMAIL ADDRESS COPIED");}
  catch {toast("DEVON@ANEVUM.COM");}
});
$("#year").textContent = String(new Date().getFullYear());

const appears = $$(".appear");
if ("IntersectionObserver" in window && !motionPaused) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  },{threshold:.09,rootMargin:"0px 0px -40px 0px"});
  appears.forEach(node => observer.observe(node));
} else {
  appears.forEach(node => node.classList.add("visible"));
}
reduceQuery.addEventListener?.("change",event => {
  if (event.matches) appears.forEach(node => node.classList.add("visible"));
});

let scrollTicking = false;
let scrollFraction = 0;
function applyScroll() {
  const max = Math.max(1,document.documentElement.scrollHeight-innerHeight);
  const y = window.scrollY;
  scrollFraction = Math.min(1,y/max);
  $(".reading-line").style.transform = "scaleX("+scrollFraction+")";
  document.body.classList.toggle("is-scrolled",y>35);
  scrollTicking = false;
  scene?.setScroll(Math.min(1,y/Math.max(1,innerHeight)));
}
window.addEventListener("scroll", () => {
  if (!scrollTicking) {
    scrollTicking=true;
    requestAnimationFrame(applyScroll);
  }
},{passive:true});

let pointerX=0,pointerY=0;
document.addEventListener("pointermove", event => {
  if(event.pointerType!=="mouse"&&event.pointerType!=="pen")return;
  const x=event.clientX/innerWidth-.5, y=event.clientY/innerHeight-.5;
  pointerX+=(x-pointerX)*.35;
  pointerY+=(y-pointerY)*.35;
  if(!motionPaused) {
    root.style.setProperty("--mx",(pointerX*90).toFixed(2)+"px");
    root.style.setProperty("--my",(pointerY*90).toFixed(2)+"px");
    scene?.setPointer(pointerX,pointerY);
  }
  if(window.matchMedia("(hover: hover) and (pointer: fine)").matches){
    cursor.classList.add("enabled");
    cursor.style.left=event.clientX+"px";
    cursor.style.top=event.clientY+"px";
    cursor.classList.toggle("over-target",Boolean(event.target.closest("button,a")));
  }
},{passive:true});

const vertex = "attribute vec2 a_position; void main(){ gl_Position=vec4(a_position,0.0,1.0); }";
const fragment = window.PORTFOLIO_SCENES?.fragment || "";

class ArchitectureScene {
  constructor(canvas) {
    this.canvas=canvas;
    this.pointer=[0,0];
    this.scroll=0;
    this.time=0;
    this.elapsed=0;
    this.lastShownSecond=-1;
    this.activeScene=0;
    this.frame=0;
    this.lastFrame=0;
    this.visible=true;
    this.paused=motionPaused;
    this.ready=false;
    this.isMobile=window.matchMedia("(max-width: 700px)").matches;
    this.gl=null;
    try {
      if(!canvas||!canvas.getContext) return;
      const gl=canvas.getContext("webgl",{
        antialias:false,alpha:false,depth:false,stencil:false,
        powerPreference:"low-power",preserveDrawingBuffer:false
      });
      if(!gl) return;
      this.gl=gl;
      const shader=(kind,source)=>{
        const s=gl.createShader(kind);
        gl.shaderSource(s,source);
        gl.compileShader(s);
        if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){
          const info=gl.getShaderInfoLog(s);
          gl.deleteShader(s);
          throw new Error("Scene shader unavailable: "+info);
        }
        return s;
      };
      const vert=shader(gl.VERTEX_SHADER,vertex);
      const frag=shader(gl.FRAGMENT_SHADER,fragment);
      const program=gl.createProgram();
      gl.attachShader(program,vert);
      gl.attachShader(program,frag);
      gl.linkProgram(program);
      gl.deleteShader(vert);gl.deleteShader(frag);
      if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error("Scene program unavailable");
      gl.useProgram(program);
      const buffer=gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
      gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
      const position=gl.getAttribLocation(program,"a_position");
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
      this.uniform={};
      ["resolution","pointer","time","scroll","scene","blend"].forEach(name=>{
        this.uniform[name]=gl.getUniformLocation(program,"u_"+name);
      });
      this.program=program;
      this.ready=true;
      this.resize();
      worldNode.classList.add("ready");
      canvas.addEventListener("webglcontextlost",event=>{
        event.preventDefault();
        cancelAnimationFrame(this.frame);
        this.ready=false;
        worldNode.classList.remove("ready");
      });
      canvas.addEventListener("webglcontextrestored",()=>{
        // A destroyed WebGL context cannot reuse buffers or shaders. Fallback stays visible.
        this.ready=false;
        worldNode.classList.remove("ready");
      });
      window.addEventListener("resize",()=>this.resize(),{passive:true});
      if("IntersectionObserver" in window){
        new IntersectionObserver(entries=>{
          this.visible=Boolean(entries[0]?.isIntersecting);
          this.updateLoop();
        },{threshold:0}).observe($("#top"));
      }
      document.addEventListener("visibilitychange",()=>this.updateLoop());
      this.updateLoop();
    } catch(error) {
      console.info("Portfolio scene disabled; accessible visual fallback is active.");
      this.ready=false;
      worldNode.classList.remove("ready");
    }
  }
  updateReadout(index,seconds,blend){
    const second=Math.floor(this.elapsed);
    if(second===this.lastShownSecond)return;
    this.lastShownSecond=second;
    const config=window.PORTFOLIO_SCENES;
    if(!config)return;
    const name=$("#scene-name"),position=$("#scene-position"),clock=$("#scene-clock");
    if(name)name.textContent=config.names[index];
    if(position)position.textContent=String(index+1).padStart(2,"0")+" / "+String(config.names.length).padStart(2,"0");
    const remaining=Math.ceil(config.duration-seconds);
    if(clock)clock.textContent=(blend>0?"MORPH / ":"NEXT IN / ")+String(Math.floor(remaining/60)).padStart(2,"0")+":"+String(remaining%60).padStart(2,"0");
  }
  nextScene(){
    const config=window.PORTFOLIO_SCENES;
    if(!config)return;
    this.activeScene=(this.activeScene+1)%config.names.length;
    this.elapsed=this.activeScene*config.duration;
    this.lastShownSecond=-1;
    this.updateReadout(this.activeScene,0,0);
    this.render();
  }
  resize(){
    if(!this.ready||!this.gl)return;
    const width=Math.max(1,innerWidth),height=Math.max(1,innerHeight);
    const ratio=Math.min(window.devicePixelRatio||1,this.isMobile ? .72 : 1.05);
    const maxPixel= this.isMobile?640:1100;
    const scale=Math.min(ratio,maxPixel/Math.max(width,height));
    this.canvas.width=Math.max(1,Math.round(width*scale));
    this.canvas.height=Math.max(1,Math.round(height*scale));
    this.gl.viewport(0,0,this.canvas.width,this.canvas.height);
    this.render();
  }
  render(){
    if(!this.ready||!this.gl||this.gl.isContextLost())return;
    const gl=this.gl;
    gl.useProgram(this.program);
    gl.uniform2f(this.uniform.resolution,this.canvas.width,this.canvas.height);
    gl.uniform2f(this.uniform.pointer,this.pointer[0],this.pointer[1]);
    gl.uniform1f(this.uniform.time,this.time);
    gl.uniform1f(this.uniform.scroll,this.scroll);
    const config=window.PORTFOLIO_SCENES;
    const duration=config.duration, transition=config.transition;
    const cycle=this.elapsed%(duration*config.names.length);
    const index=Math.floor(cycle/duration);
    const seconds=cycle-index*duration;
    const linear=Math.min(1,Math.max(0,(seconds-(duration-transition))/transition));
    const blend=linear*linear*(3-2*linear);
    this.activeScene=index;
    gl.uniform1f(this.uniform.scene,index);
    gl.uniform1f(this.uniform.blend,blend);
    this.updateReadout(index,seconds,blend);
    gl.drawArrays(gl.TRIANGLES,0,6);
  }
  setPointer(x,y){
    this.pointer=[x,y];
    if(this.paused)this.render();
  }
  setScroll(value){
    this.scroll=value;
    if(this.paused)this.render();
  }
  setPaused(value){
    this.paused=value;
    this.render();
    this.updateLoop();
  }
  updateLoop(){
    cancelAnimationFrame(this.frame);
    if(!this.ready||this.paused||!this.visible||document.hidden)return;
    this.lastFrame=0;
    const cap=this.isMobile?1000/16:1000/30;
    const draw=now=>{
      if(!this.ready||this.paused||!this.visible||document.hidden)return;
      if(!this.lastFrame||now-this.lastFrame>=cap){
        const delta=this.lastFrame?Math.min((now-this.lastFrame)/1000,.12):0;
        this.time+=delta;
        this.elapsed+=delta;
        this.lastFrame=now;
        this.render();
      }
      this.frame=requestAnimationFrame(draw);
    };
    this.frame=requestAnimationFrame(draw);
  }
}
const scene=new ArchitectureScene(worldCanvas);
$("#scene-next")?.addEventListener("click",()=>scene.nextScene());
setMotionState();
feature("anevum",false);
applyScroll();
