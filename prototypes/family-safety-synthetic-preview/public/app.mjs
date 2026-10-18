import {
  createSyntheticWorld, DEFAULT_CENTER, FICTIONAL_PLACES, FICTIONAL_ROUTE,
  RUN_LENGTH_SECONDS
} from "./synthetic-engine.mjs";

const el = id => document.getElementById(id);
const world = createSyntheticWorld();
let map=null, mapReady=false, tilt3d=true, buildingsReady=false, terrainReady=false;
let ticker=null, tab="circle", markers={}, places={}, shownError=false;

function toast(message){
  const node=el("toast");
  node.textContent=message;
  node.classList.add("show");
  clearTimeout(toast.hide);
  toast.hide=setTimeout(()=>node.classList.remove("show"),4400);
}

function displayTime(total){
  const t=Math.round(total);
  return String(Math.floor(t/60)).padStart(2,"0")+":"+String(t%60).padStart(2,"0");
}

function focusDevice(id){
  const device=world.getSnapshot().devices.find(d=>d.id===id);
  if(!device || !device.coordinates) {
    toast("This fictional device is unavailable or its illustrative share was revoked.");
    return;
  }
  if(mapReady)map.flyTo({center:device.coordinates,zoom:17.3,pitch:tilt3d?64:0,duration:850});
  else toast("The 3D map has not finished loading. The simulation is still available.");
}

function updateButtons(s){
  el("sim-clock").textContent=displayTime(s.elapsedSeconds);
  el("sim-visible").textContent=s.devices.filter(d=>d.state!=="unavailable").length+" / 2";
  el("sim-phase").textContent=!s.started?"Idle / nothing shared":
    s.running?"Fictional motion active":s.remainingSeconds===0?"Simulation ended":"Paused";
  const active=s.devices.filter(d=>d.sharing).map(d=>d.expiresIn);
  el("sim-expiry").textContent=active.length ?
    "Earliest sample expiry "+displayTime(Math.min(...active)) : "No sharing sessions";

  el("sim-start").textContent=s.started?"Restart fictional scenario":"Begin fictional family scenario";
  el("sim-pause").disabled=!s.started || s.remainingSeconds===0;
  el("sim-pause").textContent=s.running?"Pause":"Resume";
  el("sim-signal").disabled=!s.started||s.remainingSeconds===0 || !s.devices[1].sharing;
  el("sim-signal").textContent=s.signalB?"Simulate B signal loss":"Restore sample B signal";
  el("sim-signal").setAttribute("aria-pressed",String(!s.signalB));
  el("sim-revoke-a").disabled=!s.devices[0].sharing;
  el("sim-revoke-b").disabled=!s.devices[1].sharing;
  el("sim-fit").disabled=!s.devices.some(d=>d.coordinates);

  for(const d of s.devices){
    const node=el("focus-"+d.id);
    node.dataset.state=d.state;
    node.disabled=d.state==="unavailable";
    el("device-"+d.id+"-state").dataset.state=d.state;
    el("device-"+d.id+"-state").textContent=
      d.state==="recent"?"Recent":d.state==="stale"?"Stale":"Hidden";
    el("device-"+d.id+"-desc").textContent=
      d.state==="recent" ? "Example only · ±"+d.accuracyM+" m · "+displayTime(d.expiresIn)+" left" :
      d.state==="stale" ? "Fictional signal stopped · "+Math.round(d.ageSeconds)+" sec old" :
      "Not sharing / sample expired · no location";
  }
}

function updateMap(s){
  if(!mapReady)return;
  for(const d of s.devices){
    const marker=markers[d.id];
    if(!marker)continue;
    const node=marker.getElement();
    const visible=tab==="circle"&&d.state!=="unavailable"&&!!d.coordinates;
    node.style.display=visible?"":"none";
    node.dataset.state=d.state;
    node.setAttribute("aria-label",d.name+" — fictional "+d.state);
    if(visible)marker.setLngLat(d.coordinates);
  }
  const neighborhood=tab==="neighborhood";
  for(const pin of Object.values(places)){
    pin.getElement().style.display=neighborhood&&el("places-toggle").checked?"":"none";
  }
  if(map.getLayer("sample-route-line"))
    map.setLayoutProperty("sample-route-line","visibility",
      neighborhood&&el("route-toggle").checked?"visible":"none");
  if(map.getLayer("sample-route-points"))
    map.setLayoutProperty("sample-route-points","visibility",
      neighborhood&&el("route-toggle").checked?"visible":"none");
}

function render(s=world.getSnapshot()){
  updateButtons(s);
  updateMap(s);
  return s;
}

function setNotice(s=world.getSnapshot()){
  const node=el("scenario-note");
  if(!s.started)node.textContent="No real people or device locations are connected. Begin the fictional scenario to see invented sample devices move.";
  else if(!s.devices.some(d=>d.sharing))node.textContent="The sample sessions are no longer sharing. Hidden means the fictional share ended, not that a person is missing.";
  else if(!s.signalB)node.textContent="Sample device B has lost its invented position signal. Its last report becomes stale and then unavailable; this is not a safety alarm.";
  else node.textContent="All locations, timestamps, permission changes and routes are fictional. Location-sharing in a real family app will require verified adult consent and server authorization.";
}

function stopTick(){
  if(ticker!==null){clearInterval(ticker);ticker=null;}
}
function runTick(){
  stopTick();
  ticker=setInterval(()=>{
    const s=world.step(1);
    render(s);
    if(!s.running){stopTick();setNotice(s);}
  },1000);
}
function startScenario(){
  const s=world.start();
  render(s);setNotice(s);runTick();
  if(mapReady)map.flyTo({center:DEFAULT_CENTER,zoom:15.7,pitch:tilt3d?64:0,bearing:tilt3d?-22:0,duration:950});
  toast("Started a fictional scenario with two sample positions. No GPS was accessed.");
}
function pauseScenario(){
  const s=world.getSnapshot();
  if(!s.started || !s.remainingSeconds)return;
  if(s.running){world.pause();stopTick();}
  else{world.resume();runTick();}
  render();setNotice();
}
function resetScenario(){
  stopTick();world.reset();render();setNotice();
  toast("The fictional scenario has been reset; no information was stored.");
}
function revoke(id){
  world.revoke(id);render();setNotice();
  toast("Fictional device "+id.toUpperCase()+" viewing was revoked. This is not a server-side permission change.");
}

function setTab(next){
  if(next!=="circle"&&next!=="neighborhood")return;
  tab=next;
  for(const mode of ["circle","neighborhood"]){
    el("tab-"+mode).setAttribute("aria-selected",String(mode===next));
    el(mode+"-pane").hidden=mode!==next;
  }
  updateMap(world.getSnapshot());
}

function addSampleRoute(){
  map.addSource("sample-route",{
    type:"geojson",data:{
      type:"FeatureCollection",
      features:[
        {type:"Feature",geometry:{type:"LineString",coordinates:FICTIONAL_ROUTE}},
        {type:"Feature",geometry:{type:"MultiPoint",coordinates:FICTIONAL_ROUTE}}
      ]
    }
  });
  map.addLayer({id:"sample-route-line",type:"line",source:"sample-route",filter:["==",["geometry-type"],"LineString"],
    paint:{"line-color":"#e4b0f3","line-width":4,"line-opacity":.82,"line-dasharray":[2,1.4]},
    layout:{visibility:"none","line-join":"round","line-cap":"round"}
  });
  map.addLayer({id:"sample-route-points",type:"circle",source:"sample-route",filter:["==",["geometry-type"],"Point"],
    paint:{"circle-radius":4,"circle-color":"#b6e3ee","circle-stroke-color":"#0b1931","circle-stroke-width":1},
    layout:{visibility:"none"}
  });
}

function addMarker(coord,css,label,text){
  const node=document.createElement("button");
  node.type="button";node.className=css;node.textContent=text;
  node.setAttribute("aria-label",label);
  const result=new window.maplibregl.Marker({element:node,anchor:"center"}).setLngLat(coord).addTo(map);
  node.addEventListener("click",event=>event.stopPropagation());
  return result;
}

function setupMarkerLayers(){
  for(const id of ["a","b"]){
    const d=world.getSnapshot().devices.find(x=>x.id===id);
    const m=addMarker(DEFAULT_CENTER,"sample-marker "+id,d.name+" (fictional)",d.initial);
    m.getElement().style.display="none";
    m.getElement().addEventListener("click",()=>focusDevice(id));
    markers[id]=m;
  }
  for(const p of FICTIONAL_PLACES){
    const m=addMarker(p.coords,"place-marker",p.label+" — sample only","◇");
    m.getElement().style.display="none";
    m.getElement().addEventListener("click",()=>toast(p.label+" is fictional. "+p.kind+". Not a real safe location."));
    places[p.id]=m;
  }
}

function initMap(){
  if(!window.maplibregl){
    el("map-error").hidden=false;
    toast("MapLibre failed to load. Check the network; the synthetic controls still function.");
    return;
  }
  try{
    map=new window.maplibregl.Map({
      container:"map",style:"https://tiles.openfreemap.org/styles/dark",
      center:DEFAULT_CENTER,zoom:15.4,pitch:64,bearing:-22,
      minZoom:3,maxZoom:20,antialias:true,attributionControl:true
    });
    map.addControl(new window.maplibregl.NavigationControl({showZoom:false,visualizePitch:true}),"top-right");
    map.on("load",()=>{
      mapReady=true;
      try{
        map.addSource("field-buildings",{type:"vector",url:"https://tiles.openfreemap.org/planet"});
        const firstLabel=map.getStyle().layers.find(l=>l.type==="symbol"&&l.layout&&l.layout["text-field"]);
        map.addLayer({id:"field-building-volumes",type:"fill-extrusion",source:"field-buildings",
          "source-layer":"building",minzoom:15,filter:["!=",["get","hide_3d"],true],
          paint:{
            "fill-extrusion-color":["interpolate",["linear"],["coalesce",["get","render_height"],0],0,"#596b8a",25,"#7a7fa8",70,"#b589a9"],
            "fill-extrusion-height":["interpolate",["linear"],["zoom"],15,0,15.5,["coalesce",["get","render_height"],["get","height"],8]],
            "fill-extrusion-base":["coalesce",["get","render_min_height"],["get","min_height"],0],
            "fill-extrusion-opacity":.83
          },layout:{visibility:"visible"}},firstLabel?.id);
        buildingsReady=true;
      }catch{toast("3D building volumes are unavailable in this region/style. Map navigation is still available.");}
      try{
        map.addSource("field-elevation",{
          type:"raster-dem",encoding:"terrarium",tileSize:256,maxzoom:15,
          tiles:["https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"],
          attribution:"Mapzen/Amazon elevation data"
        });
        terrainReady=true;
      }catch{terrainReady=false;}
      try{addSampleRoute();}catch{toast("Illustrative route layer failed to load.");}
      setupMarkerLayers();
      render();
    });
    map.on("error",error=>{
      if(!shownError){shownError=true;toast("Map provider data may be unavailable or incomplete. Fictional controls remain local.");}
      if(error?.error)console.warn("Synthetic map tile error:",error.error.message);
    });
  }catch{
    el("map-error").hidden=false;
    toast("3D rendering was unavailable on this device. Try a WebGL-enabled browser.");
  }
}

el("sim-start").addEventListener("click",startScenario);
el("sim-pause").addEventListener("click",pauseScenario);
el("sim-reset").addEventListener("click",resetScenario);
el("sim-signal").addEventListener("click",()=>{
  const s=world.getSnapshot();
  if(!s.started||!s.devices[1].sharing)return;
  world.signalB(!s.signalB);render();setNotice();
  toast(s.signalB?"Fictional sample B signal disconnected.":"Fictional sample B signal restored.");
});
el("sim-revoke-a").addEventListener("click",()=>revoke("a"));
el("sim-revoke-b").addEventListener("click",()=>revoke("b"));
el("sim-fit").addEventListener("click",()=>{
  const positions=world.getSnapshot().devices.filter(d=>d.coordinates).map(d=>d.coordinates);
  if(!mapReady || positions.length===0)return;
  if(positions.length===1)map.flyTo({center:positions[0],zoom:17,pitch:tilt3d?60:0,duration:800});
  else map.fitBounds([
    [Math.min(...positions.map(p=>p[0])),Math.min(...positions.map(p=>p[1]))],
    [Math.max(...positions.map(p=>p[0])),Math.max(...positions.map(p=>p[1]))]
  ],{padding:110,maxZoom:17,duration:850});
});
el("focus-a").addEventListener("click",()=>focusDevice("a"));
el("focus-b").addEventListener("click",()=>focusDevice("b"));
el("tab-circle").addEventListener("click",()=>setTab("circle"));
el("tab-neighborhood").addEventListener("click",()=>setTab("neighborhood"));
for(const id of ["places-toggle","route-toggle"])el(id).addEventListener("change",()=>updateMap(world.getSnapshot()));
el("buildings-toggle").addEventListener("change",event=>{
  if(mapReady&&buildingsReady)map.setLayoutProperty("field-building-volumes","visibility",event.target.checked?"visible":"none");
  else if(event.target.checked)toast("Building volumes are not available on this map.");
});
el("terrain-toggle").addEventListener("change",event=>{
  if(!terrainReady||!mapReady){event.target.checked=false;toast("Elevation relief is not ready.");return;}
  try{map.setTerrain(event.target.checked?{source:"field-elevation",exaggeration:1}:null);}
  catch{event.target.checked=false;toast("Terrain could not be rendered in this browser.");}
});
el("map-in").addEventListener("click",()=>map?.zoomIn());
el("map-out").addEventListener("click",()=>map?.zoomOut());
el("map-home").addEventListener("click",()=>map?.flyTo({
  center:DEFAULT_CENTER,zoom:15.4,pitch:tilt3d?64:0,bearing:tilt3d?-22:0,duration:900
}));
el("map-tilt").addEventListener("click",()=>{
  tilt3d=!tilt3d;
  el("map-tilt").setAttribute("aria-pressed",String(tilt3d));
  el("map-tilt").textContent=tilt3d?"3D":"2D";
  map?.easeTo({pitch:tilt3d?64:0,bearing:tilt3d?-22:0,duration:600});
});
document.addEventListener("visibilitychange",()=>{
  if(document.hidden){world.pause();stopTick();render();setNotice();}
});
window.addEventListener("pagehide",()=>{stopTick();world.reset();});
render();setNotice();
initMap();
