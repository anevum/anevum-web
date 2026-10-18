
import { EVENT_END, SAMPLE_HOMES, publicDirectory } from "./model.mjs";

const area = document.getElementById("canvas-area");
const canvas = document.getElementById("scene");
const ctx = canvas.getContext("2d", {alpha:false});
const houseList = document.getElementById("house-list");
const inspector = document.getElementById("selected-panel");
const feedback = document.getElementById("feedback");
const activeCount = document.getElementById("activeCount");
const emptyNotice = document.getElementById("mapEmpty");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const homes = SAMPLE_HOMES.map(function(home){ return {...home, amenities:[...home.amenities]}; });
const camera = {yaw:-.48, zoom:1, panX:0, panY:0};
const target = {...camera};
let filter = "all";
let chosenId = null;
let requestStaged = false;
let width = 750, height = 610, pixelRatio = 1;
let renderPoints = [];
let viewHosts = [];
let dragging = false, dragged = false, pointerStart = null;
let pinchStart = null;
const pointers = new Map();

function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function isClosed(){return Date.now() >= Date.parse(EVENT_END);}
function currentHosts(){
  const hosts = publicDirectory(homes,Date.now());
  return filter === "all" ? hosts : hosts.filter(function(h){return h.amenities.includes(filter);});
}
function make(tag,cls,txt){
  const el = document.createElement(tag);
  if(cls) el.className = cls;
  if(txt !== undefined) el.textContent = String(txt);
  return el;
}
function writeFeedback(message){feedback.textContent = message;}
function rowFor(home){
  const button = make("button","house-row"+(home.id===chosenId?" selected":""),undefined);
  button.type = "button";
  button.setAttribute("aria-pressed",home.id===chosenId?"true":"false");
  const glyph = make("span","house-glyph","⌂");
  glyph.setAttribute("aria-hidden","true");
  const body = make("span","house-row-copy");
  body.append(make("strong","",home.label),make("span","DEMO · "+home.hours));
  const arrow = make("span","house-arrow","›");
  arrow.setAttribute("aria-hidden","true");
  button.append(glyph,body,arrow);
  button.addEventListener("click",function(){selectHouse(home.id);});
  return button;
}
function renderDirectory(){
  viewHosts = currentHosts();
  activeCount.textContent = String(publicDirectory(homes,Date.now()).length);
  emptyNotice.hidden = !isClosed();
  houseList.replaceChildren();
  if(!viewHosts.length){
    const message = isClosed() ?
      "Event expired. No house listings are displayed." :
      "No opt-in demonstration homes match this filter.";
    houseList.append(make("p","house-empty",message));
  }else{
    viewHosts.forEach(function(h){houseList.append(rowFor(h));});
  }
  if(!viewHosts.some(function(h){return h.id===chosenId;}))chosenId=null;
  renderInspector();
}
function renderInspector(){
  inspector.replaceChildren();
  inspector.append(make("span","eyebrow","SELECTED DEMONSTRATION HOUSE"));
  const h=viewHosts.find(function(item){return item.id===chosenId;});
  if(!h){
    inspector.append(make("p","","Select a glowing marker or directory entry to explore a fictional opt-in house."));
    return;
  }
  inspector.append(make("strong","",h.label));
  inspector.append(make("p","","Illustrative listing · "+h.hours+" · Not a real residence or verified safe location."));
  const tags=make("div","detail-row");
  h.amenities.forEach(function(v){tags.append(make("span","",v));});
  inspector.append(tags);
}
function selectHouse(id){
  if(!viewHosts.some(function(h){return h.id===id;}))return;
  chosenId=id;
  renderDirectory();
}
document.querySelectorAll("[data-filter]").forEach(function(button){
  button.addEventListener("click",function(){
    filter=button.dataset.filter;
    document.querySelectorAll("[data-filter]").forEach(function(b){
      const active=b===button;
      b.classList.toggle("active",active);
      b.setAttribute("aria-pressed",active?"true":"false");
    });
    renderDirectory();
  });
});
const mock=homes.find(function(h){return h.id==="S04";});
document.getElementById("request-demo").addEventListener("click",function(){
  if(isClosed()){writeFeedback("Event has ended. Submission remains closed.");return;}
  mock.status="pending";
  mock.adultAttested=true;
  mock.consentToPublish=true;
  mock.verifiedByOrganizer=false;
  requestStaged=true;
  writeFeedback("Fictional request staged: awaiting a simulated organizer decision. Not public.");
  renderDirectory();
});
document.getElementById("approve-demo").addEventListener("click",function(){
  if(isClosed()){writeFeedback("Event has ended. Nothing can be published.");return;}
  if(!requestStaged || mock.status!=="pending"){
    writeFeedback("Stage a mock host request before simulating approval.");
    return;
  }
  mock.verifiedByOrganizer=true;
  mock.status="approved";
  requestStaged=false;
  filter="all";
  document.querySelectorAll("[data-filter]").forEach(function(b){
    const active=b.dataset.filter==="all";
    b.classList.toggle("active",active);
    b.setAttribute("aria-pressed",active?"true":"false");
  });
  chosenId=mock.id;
  writeFeedback("Simulated organizer approval: one fictional consented house now appears. No data was saved.");
  renderDirectory();
});
document.getElementById("withdraw-demo").addEventListener("click",function(){
  mock.consentToPublish=false;
  mock.status="withdrawn";
  mock.verifiedByOrganizer=false;
  requestStaged=false;
  if(chosenId===mock.id)chosenId=null;
  writeFeedback("Mock consent withdrawn: fictional house removed from public directory and map immediately.");
  renderDirectory();
});

function resize(){
  const b=canvas.getBoundingClientRect();
  width=Math.max(1,b.width); height=Math.max(1,b.height);
  pixelRatio=Math.min(window.devicePixelRatio||1,1.75);
  canvas.width=Math.round(width*pixelRatio);
  canvas.height=Math.round(height*pixelRatio);
  ctx.setTransform(pixelRatio,0,0,pixelRatio,0,0);
  renderFrame(performance.now());
}
function projection(x,y,z){
  const dx=x-7.4, dz=z-6.1;
  const c=Math.cos(camera.yaw),s=Math.sin(camera.yaw);
  const rx=dx*c-dz*s, rz=dx*s+dz*c;
  const scale=Math.min(width/20.5,height/16.5)*camera.zoom;
  return {x:width*.50+camera.panX+rx*scale,
          y:height*.54+camera.panY+rz*scale*.71-y*scale*.86,
          d:rz};
}
function fillShape(points,color,stroke,thickness){
  if(!points.length)return;
  ctx.beginPath();ctx.moveTo(points[0].x,points[0].y);
  for(let i=1;i<points.length;i++)ctx.lineTo(points[i].x,points[i].y);
  ctx.closePath();
  ctx.fillStyle=color;ctx.fill();
  if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=thickness||1;ctx.stroke();}
}
function groundRect(x1,z1,x2,z2,color,y=0){
  fillShape([projection(x1,y,z1),projection(x2,y,z1),projection(x2,y,z2),projection(x1,y,z2)],color);
}
function line3D(a,b,color,thickness=1,dash=[]){
  const p1=projection(a[0],a[1],a[2]),p2=projection(b[0],b[1],b[2]);
  ctx.beginPath();ctx.setLineDash(dash);
  ctx.moveTo(p1.x,p1.y);ctx.lineTo(p2.x,p2.y);
  ctx.strokeStyle=color;ctx.lineWidth=thickness;ctx.stroke();ctx.setLineDash([]);
}
function halo(x,y,r,color){
  const glow=ctx.createRadialGradient(x,y,0,x,y,r);
  glow.addColorStop(0,color);glow.addColorStop(1,"rgba(0,0,0,0)");
  ctx.fillStyle=glow;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
}
function rounded(x,y,w,h,r){
  const rr=Math.min(r,w/2,h/2);
  ctx.beginPath();ctx.moveTo(x+rr,y);ctx.arcTo(x+w,y,x+w,y+h,rr);
  ctx.arcTo(x+w,y+h,x,y+h,rr);ctx.arcTo(x,y+h,x,y,rr);
  ctx.arcTo(x,y,x+w,y,rr);ctx.closePath();
}
function drawTerrain(){
  const backdrop=ctx.createLinearGradient(0,0,0,height);
  backdrop.addColorStop(0,"#142d43");backdrop.addColorStop(.5,"#0c2233");backdrop.addColorStop(1,"#071523");
  ctx.fillStyle=backdrop;ctx.fillRect(0,0,width,height);
  halo(width*.52,height*.43,width*.56,"rgba(40,126,134,.18)");
  groundRect(-2.5,-2.5,17.5,14.7,"#1d3e3b");
  for(let ix=-2;ix<17;ix+=1.45){
    for(let iz=-2;iz<14;iz+=1.3){
      const n=(Math.sin(ix*21.2+iz*18.73)*127.1)%1;
      if(n>.1)groundRect(ix,iz,ix+1.42,iz+1.28,n>.5?"#244640":"#203e3c",.004);
    }
  }
  // Civic grid: fully fictional, not derived from street or parcel geometry.
  [4.55,9.22,14.75].forEach(function(x){
    groundRect(x-1.03,-2.5,x+1.03,14.7,"#74938b");
    groundRect(x-.89,-2.5,x+.89,14.7,"#273a48",.018);
    for(let z=-2;z<14;z+=.92)line3D([x,.025,z],[x,.025,z+.39],"#a3b9bb",1.2,[3,3]);
  });
  [4.8,9.8].forEach(function(z){
    groundRect(-2.5,z-1.06,17.5,z+1.06,"#738e87");
    groundRect(-2.5,z-.89,17.5,z+.89,"#293d4a",.02);
    for(let x=-2;x<17;x+=1.02)line3D([x,.025,z],[x+.46,.025,z],"#afc3bb",1.2,[3,3]);
  });
  // Crosswalks and low-detail municipal green spaces are purely artistic.
  for(let k=0;k<7;k++){
    groundRect(3.8+k*.16,4.6,3.87+k*.16,5.01,"#b4c0b8",.03);
    groundRect(8.45+k*.16,9.5,8.52+k*.16,10.04,"#b4c0b8",.03);
  }
  groundRect(0.15,5.55,1.2,8.2,"#32635b",.03);
  groundRect(10.3,10.85,13.2,12.45,"#315952",.03);
  for(let i=0;i<7;i++)line3D([10.5+i*.35,.035,11.1],[10.5+i*.35,.035,12.15],"#6a9b7d",.6);
}
function shade(hex,mul){
  const v=parseInt(hex.slice(1),16);
  const colors=[(v>>16)&255,(v>>8)&255,v&255].map(function(c){return clamp(Math.round(c*mul),0,255);});
  return "rgb("+colors.join(",")+")";
}
function drawBuilding(b,at=0){
  const x=b.x,z=b.z,w=b.w||1.16,d=b.d||1.1,h=b.h||.85;
  const roof=b.roof||"#5d7b83";
  const base=b.base||"#8497a1";
  const footprint=[[x-w/2,0,z-d/2],[x+w/2,0,z-d/2],[x+w/2,0,z+d/2],[x-w/2,0,z+d/2]];
  const top=footprint.map(function(p){return [p[0],h,p[2]];});
  const poly=footprint.map(function(p){return projection(...p);});
  fillShape(poly,"#0b2026","#2d646b55");
  // Lawn and a small front walk give depth without real GIS geometry.
  groundRect(x-w*.65,z-d*.67,x+w*.68,z+d*.75,"#376354",.03);
  const faces=[];
  for(let k=0;k<4;k++){
    const j=(k+1)%4;
    const corners=[footprint[k],footprint[j],top[j],top[k]];
    const depth=corners.reduce(function(n,p){return n+projection(...p).d;},0)/4;
    faces.push({depth,pts:corners.map(function(p){return projection(...p);}),color:shade(base,k===0?.85:k===1?.65:k===2?.76:.96)});
  }
  faces.sort(function(a,b){return a.depth-b.depth;});
  faces.forEach(function(f){fillShape(f.pts,f.color,"#1829359c",.9);});
  // Windows illuminated from within; no addresses or occupancy indicator.
  const windowP=projection(x-w*.19,h*.51,z-d*.502),windowQ=projection(x+w*.16,h*.51,z-d*.502);
  ctx.fillStyle="#f3d2a1";ctx.shadowBlur=8;ctx.shadowColor="#eaa66c";
  const ws=Math.max(2,Math.min(width/410,1.2)*6);
  ctx.fillRect(windowP.x-ws/2,windowP.y-ws/2,ws,ws*1.08);
  ctx.fillRect(windowQ.x-ws/2,windowQ.y-ws/2,ws,ws*1.08);
  ctx.shadowBlur=0;
  const eave=top.map(function(p){
    return [x+(p[0]-x)*1.20,h+.015,z+(p[2]-z)*1.18];
  });
  const ridge=[[x,h+.48,z-d*.31],[x,h+.48,z+d*.31]];
  const roofFaces=[
    {pts:[eave[0],eave[1],ridge[0]],color:shade(roof,1.05)},
    {pts:[eave[1],eave[2],ridge[1],ridge[0]],color:shade(roof,.94)},
    {pts:[eave[2],eave[3],ridge[1]],color:shade(roof,.67)},
    {pts:[eave[3],eave[0],ridge[0],ridge[1]],color:shade(roof,.77)}
  ];
  roofFaces.sort(function(a,b){
    const da=a.pts.reduce(function(s,p){return s+projection(...p).d;},0)/a.pts.length;
    const db=b.pts.reduce(function(s,p){return s+projection(...p).d;},0)/b.pts.length;
    return da-db;
  });
  roofFaces.forEach(function(f){fillShape(f.pts.map(function(p){return projection(...p);}),f.color,"#24323fe0",.75);});
  line3D(ridge[0],ridge[1],shade(roof,1.3),.9);
}
function seeded(n){const x=Math.sin(n*87.126)*41592.45;return x-Math.floor(x);}
function drawTree(t,time){
  const x=t.x,z=t.z,sz=t.sz||1;
  const base=projection(x,0,z),top=projection(x,sz*.83,z);
  ctx.strokeStyle="#4e5046";ctx.lineWidth=2*camera.zoom;
  ctx.beginPath();ctx.moveTo(base.x,base.y);ctx.lineTo(top.x,top.y);ctx.stroke();
  const radius=Math.max(3,sz*Math.min(width/20.5,height/16.5)*camera.zoom*.26);
  const shift=reducedMotion?0:Math.sin(time*.00051+t.x*2)*1.1;
  halo(top.x,top.y+shift,radius*2.2,"rgba(25,136,116,.08)");
  const grad=ctx.createRadialGradient(top.x-radius*.34,top.y-radius*.36+shift,1,top.x,top.y+shift,radius);
  grad.addColorStop(0,"#73a994");grad.addColorStop(.42,"#396f65");grad.addColorStop(1,"#173e47");
  ctx.beginPath();ctx.ellipse(top.x,top.y+shift,radius,radius*.81,0,0,Math.PI*2);ctx.fillStyle=grad;ctx.fill();
  ctx.beginPath();ctx.ellipse(top.x-radius*.22,top.y-radius*.22+shift,radius*.34,radius*.19,-.32,0,Math.PI*2);ctx.fillStyle="rgba(177,214,164,.16)";ctx.fill();
}
function drawMarker(host,time){
  const elevated=projection(host.x,2.05,host.z);
  const floor=projection(host.x,0,host.z);
  const selected=chosenId===host.id, glow=selected? "#ffddba":"#ffac82";
  const oscillation=reducedMotion?0:Math.sin(time*.002+host.x)*2.5;
  const y=elevated.y+oscillation;
  line3D([host.x,.12,host.z],[host.x,1.7,host.z],"#f5b99565",1.1,[3,4]);
  halo(elevated.x,y,selected?40:29,selected?"rgba(244,183,141,.30)":"rgba(252,166,128,.17)");
  ctx.beginPath();ctx.arc(elevated.x,y,selected?12:9,0,Math.PI*2);
  ctx.fillStyle="#171e30";ctx.fill();ctx.strokeStyle=glow;ctx.lineWidth=2;ctx.stroke();
  ctx.beginPath();ctx.arc(elevated.x,y,selected?5:4,0,Math.PI*2);ctx.fillStyle=glow;ctx.fill();
  if(selected){
    ctx.textAlign="center";ctx.font="700 11px system-ui,sans-serif";
    const tw=ctx.measureText(host.label).width, rw=tw+24;
    rounded(elevated.x-rw/2,y-41,rw,25,6);
    ctx.fillStyle="#131b2d";ctx.fill();ctx.strokeStyle="#edbb9d";ctx.lineWidth=.8;ctx.stroke();
    ctx.fillStyle="#f5e1cb";ctx.fillText(host.label,elevated.x,y-24);
  }
  renderPoints.push({id:host.id,x:elevated.x,y,footY:floor.y});
}
const backgroundHouses = (function(){
  const res=[];
  for(let i=0;i<39;i++){
    const x=.8+seeded(i*3+4)*13.3,z=.5+seeded(i*8+3)*12.6;
    if([4.55,9.22,14.75].some(function(a){return Math.abs(a-x)<1.35}))continue;
    if([4.8,9.8].some(function(a){return Math.abs(a-z)<1.35}))continue;
    if(SAMPLE_HOMES.some(function(h){return Math.hypot(h.x-x,h.z-z)<1.45}))continue;
    res.push({x,z,w:.65+seeded(i+32)*.38,d:.7,h:.52+seeded(i+11)*.21,roof:["#4e7985","#6c6988","#876d72","#607780"][i%4],base:"#7c9ba3"});
  }
  return res;
})();
const trees = (function(){
  const res=[];
  for(let i=0;i<140;i++){
    const x=-1+seeded(i*19+8)*18,z=-1+seeded(i*7+18)*15;
    if([4.55,9.22,14.75].some(function(a){return Math.abs(a-x)<1.17}))continue;
    if([4.8,9.8].some(function(a){return Math.abs(a-z)<1.18}))continue;
    if(SAMPLE_HOMES.some(function(h){return Math.hypot(h.x-x,h.z-z)<.9}))continue;
    if(backgroundHouses.some(function(h){return Math.hypot(h.x-x,h.z-z)<.55}))continue;
    res.push({x,z,sz:.65+seeded(i*5+31)*.85});
  }
  return res;
})();
function renderFrame(time){
  if(!ctx)return;
  ctx.setTransform(pixelRatio,0,0,pixelRatio,0,0);
  const smoothing=reducedMotion?1:.19;
  for(const prop of ["yaw","zoom","panX","panY"]){
    camera[prop]+=(target[prop]-camera[prop])*smoothing;
  }
  ctx.clearRect(0,0,width,height);
  drawTerrain();
  const parts=[];
  backgroundHouses.forEach(function(h){parts.push({kind:"building",object:h,depth:projection(h.x,0,h.z).y});});
  SAMPLE_HOMES.forEach(function(h){
    parts.push({kind:"building",object:{...h,w:1.0,d:1.08,h:.8,base:"#b4a9a2"},depth:projection(h.x,0,h.z).y});
  });
  trees.forEach(function(t){parts.push({kind:"tree",object:t,depth:projection(t.x,0,t.z).y});});
  parts.sort(function(a,b){return a.depth-b.depth;});
  parts.forEach(function(part){
    if(part.kind==="building")drawBuilding(part.object,time);
    else drawTree(part.object,time);
  });
  renderPoints=[];
  viewHosts.forEach(function(h){drawMarker(h,time);});
}
function setCamera(prop,value){
  if(prop==="zoom")target.zoom=clamp(value,.58,2.8);
  else if(prop==="yaw")target.yaw=value;
  else target[prop]=clamp(value,-width*.7,width*.7);
  if(reducedMotion)renderFrame(performance.now());
}
function bindControl(id,fn){document.getElementById(id).addEventListener("click",fn);}
bindControl("zoom-in",function(){setCamera("zoom",target.zoom*1.22);});
bindControl("zoom-out",function(){setCamera("zoom",target.zoom/1.22);});
bindControl("turn-left",function(){setCamera("yaw",target.yaw-.22);});
bindControl("turn-right",function(){setCamera("yaw",target.yaw+.22);});
bindControl("reset-map",function(){
  Object.assign(target,{yaw:-.48,zoom:1,panX:0,panY:0});
  if(reducedMotion)renderFrame(performance.now());
});
function coords(e){
  const rect=area.getBoundingClientRect();
  return {x:e.clientX-rect.left,y:e.clientY-rect.top};
}
function handleTap(p){
  const hit=renderPoints.filter(function(h){return Math.hypot(h.x-p.x,h.y-p.y)<23;})
    .sort(function(a,b){return Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y);})[0];
  if(hit)selectHouse(hit.id);
}
area.addEventListener("pointerdown",function(e){
  if(e.target.closest("button") || e.target.closest("a"))return;
  const p=coords(e);
  pointers.set(e.pointerId,p);
  if(pointers.size===1){pointerStart=p;dragging=true;dragged=false;}
  if(pointers.size===2){
    const v=[...pointers.values()];pinchStart={distance:Math.hypot(v[0].x-v[1].x,v[0].y-v[1].y),zoom:target.zoom};
  }
  area.setPointerCapture(e.pointerId);
});
area.addEventListener("pointermove",function(e){
  if(!pointers.has(e.pointerId))return;
  const p=coords(e),old=pointers.get(e.pointerId);
  pointers.set(e.pointerId,p);
  if(pointers.size>=2 && pinchStart){
    const v=[...pointers.values()],distance=Math.hypot(v[0].x-v[1].x,v[0].y-v[1].y);
    setCamera("zoom",pinchStart.zoom*(distance/Math.max(30,pinchStart.distance)));
    dragged=true;
    return;
  }
  if(dragging && pointerStart){
    const dx=p.x-old.x,dy=p.y-old.y;
    if(Math.hypot(p.x-pointerStart.x,p.y-pointerStart.y)>5)dragged=true;
    if(dragged){
      setCamera("panX",target.panX+dx);
      setCamera("panY",target.panY+dy);
    }
  }
});
function finishPointer(e){
  if(!pointers.has(e.pointerId))return;
  const p=coords(e);
  pointers.delete(e.pointerId);
  if(!dragged && pointers.size===0)handleTap(p);
  if(pointers.size===0){dragging=false;pointerStart=null;pinchStart=null;}
}
area.addEventListener("pointerup",finishPointer);
area.addEventListener("pointercancel",function(e){pointers.delete(e.pointerId);dragging=false;pointerStart=null;pinchStart=null;});
area.addEventListener("wheel",function(e){
  if(e.ctrlKey || e.metaKey)return;
  e.preventDefault();
  setCamera("zoom",target.zoom*(e.deltaY>0?.91:1.09));
},{passive:false});
area.addEventListener("keydown",function(e){
  if(e.target!==area)return;
  const step=25;
  const commands={ArrowLeft:function(){setCamera("panX",target.panX+step);},
    ArrowRight:function(){setCamera("panX",target.panX-step);},
    ArrowUp:function(){setCamera("panY",target.panY+step);},
    ArrowDown:function(){setCamera("panY",target.panY-step);},
    "+":function(){setCamera("zoom",target.zoom*1.15);},
    "-":function(){setCamera("zoom",target.zoom/1.15);},
    "[":function(){setCamera("yaw",target.yaw-.2);},
    "]":function(){setCamera("yaw",target.yaw+.2);}};
  if(commands[e.key]){e.preventDefault();commands[e.key]();}
});
let lastDraw=0, lastPolicyRefresh=0, lastClosedState=isClosed();
function tick(t){
  // A long-open page must obey expiry and withdrawal policy without needing a refresh.
  if(t-lastPolicyRefresh>3000){
    lastPolicyRefresh=t;
    const closed=isClosed(), next=currentHosts();
    if(closed!==lastClosedState || next.map(h=>h.id).join("|")!==viewHosts.map(h=>h.id).join("|")){
      lastClosedState=closed;
      renderDirectory();
    }
  }
  if(!document.hidden && t-lastDraw>(reducedMotion?900:30)){
    renderFrame(t);lastDraw=t;
  }
  requestAnimationFrame(tick);
}
window.addEventListener("resize",resize);
if(typeof ResizeObserver!=="undefined")new ResizeObserver(resize).observe(area);
renderDirectory();
resize();
requestAnimationFrame(tick);
