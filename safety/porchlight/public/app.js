const base="/api/v1/porchlight";
const $=id=>document.getElementById(id);
const state={events:[],event:null,hosts:[],styleUrl:null};
const optionNames={candy:"Candy",non_food:"Non-food options",decorations:"Decorations",step_free:"Self-reported step-free access"};
const E=(tag,className,text)=>{const node=document.createElement(tag);if(className)node.className=className;if(text!=null)node.textContent=text;return node};
function setMessage(id,message,error=false){const el=$(id);el.textContent=message;el.dataset.error=String(error)}
function fmtDate(epoch){return new Intl.DateTimeFormat(undefined,{dateStyle:"medium",timeStyle:"short"}).format(new Date(epoch*1000))}
async function json(path,opts={}) {
 const response=await fetch(base+path,{credentials:"omit",cache:"no-store",headers:{"Accept":"application/json",...(opts.body?{"Content-Type":"application/json"}:{})},...opts});
 const data=await response.json().catch(()=>({code:"INVALID_SERVER_RESPONSE"}));
 if(!response.ok||!data.ok)throw Error((data.code||"REQUEST_FAILED").replaceAll("_"," "));
 return data;
}
function safeEvents(events){return Array.isArray(events)?events.filter(x=>x&&typeof x.slug==="string"&&typeof x.title==="string").slice(0,20):[]}
async function init(){
 try{
   const data=await json("/events");
   state.events=safeEvents(data.events);state.styleUrl=data.mapStyleUrl||null;
   const picker=$("event-picker");picker.replaceChildren();
   if(!state.events.length){
      picker.append(E("option","","No active community events"));picker.disabled=true;
      $("directory-status").textContent="No active events are published. No houses or residents are being displayed.";
      $("host-submit").disabled=true;return;
   }
   picker.disabled=false;
   for(const event of state.events){const o=E("option","",event.title+" / "+event.neighborhood);o.value=event.slug;picker.append(o)}
   const desired=new URL(location.href).searchParams.get("event");
   picker.value=state.events.some(e=>e.slug===desired)?desired:state.events[0].slug;
   picker.addEventListener("change",()=>selectEvent(picker.value));
   await selectEvent(picker.value);
 }catch(error){$("directory-status").textContent="Directory unavailable. Please try again. No private information is shown.";setMessage("host-feedback","Host applications are unavailable until the directory is reachable.",true);$("host-submit").disabled=true}
}
async function selectEvent(slug){
 const event=state.events.find(x=>x.slug===slug);if(!event)return;
 state.event=event;state.hosts=[];
 $("directory-status").textContent="Checking approved listings…";
 $("host-submit").disabled=false;
 const summary=$("event-summary");summary.replaceChildren();const title=E("b","",event.title+" · "+event.neighborhood);const details=E("small","",fmtDate(event.startsAt)+" – "+fmtDate(event.endsAt));summary.append(title,details);summary.hidden=false;
 try{
  const d=await json("/events/"+encodeURIComponent(slug)+"/hosts");
  state.hosts=Array.isArray(d.hosts)?d.hosts:[];
  $("directory-status").textContent=state.hosts.length ? "Only reviewed, opted-in hosts are shown. No live family locations are collected." : "No hosts have been approved for public display yet.";
 }catch{
  $("directory-status").textContent="Host listings could not be verified; no locations are being displayed.";
  state.hosts=[];
 }
 drawHosts();
}
function drawHosts(){
 const list=$("host-list"),map=$("map-content"),empty=$("map-empty"),report=$("report-host");
 list.replaceChildren();map.replaceChildren();report.replaceChildren();
 $("host-count").textContent=String(state.hosts.length);
 const first=E("option","",state.hosts.length?"Choose a host":"No published hosts");first.value="";report.append(first);report.disabled=!state.hosts.length;
 if(!state.hosts.length){const holder=E("div","empty");holder.append(E("strong","","No homes have been published."),E("p","","This directory is only populated from approved adult household submissions."));list.append(holder)}
 const exact=state.hosts.filter(h=>h.visibility==="exact"&&Number.isFinite(h.lat)&&Number.isFinite(h.lng));
 const latVals=exact.map(h=>h.lat),lngVals=exact.map(h=>h.lng);
 const minLat=Math.min(...latVals),maxLat=Math.max(...latVals),minLng=Math.min(...lngVals),maxLng=Math.max(...lngVals);
 for(const [index,h] of state.hosts.entries()){
  const article=E("article","host-item");article.setAttribute("role","listitem");
  const top=E("div","host-top");const head=E("div");head.append(E("h3","",h.name||"Participating home"),E("p","",h.location||"Location approved for listing"));top.append(head,E("span","host-id",String(index+1).padStart(2,"0")));article.append(top);
  const tags=E("div","tags");for(const op of (h.options||[])){if(optionNames[op])tags.append(E("span","tag",optionNames[op]))}article.append(tags);
  if(h.visibility==="exact"&&Number.isFinite(h.lat)&&Number.isFinite(h.lng)){
   const link=E("a","","Open this approved location in Maps ↗");link.target="_blank";link.rel="noopener noreferrer";link.href="https://maps.apple.com/?ll="+encodeURIComponent(h.lat+","+h.lng);article.append(link);
   const pin=E("span","map-pin",String(index+1));pin.title=(h.name||"Participating host")+": "+(h.location||"");pin.tabIndex=0;pin.setAttribute("aria-label",pin.title);
   const x=exact.length===1?50:12+76*(h.lng-minLng)/Math.max(maxLng-minLng,0.000001);
   const y=exact.length===1?50:88-76*(h.lat-minLat)/Math.max(maxLat-minLat,0.000001);
   pin.style.left=x+"%";pin.style.top=y+"%";map.append(pin);
  }
  list.append(article);
  const choice=E("option","",h.name||"Participating host");choice.value=h.id;report.append(choice);
 }
 empty.hidden=exact.length>0;
}
document.querySelectorAll('input[name="visibility"]').forEach(el=>el.addEventListener("change",()=>{
 $("exact-consent-row").hidden=document.querySelector('input[name="visibility"]:checked').value!=="exact";
 if($("exact-consent-row").hidden)$("host-exact").checked=false;
}));
$("host-form").addEventListener("submit",async event=>{
 event.preventDefault();
 if(!state.event)return setMessage("host-feedback","Choose an active event first.",true);
 const form=event.currentTarget;if(!form.reportValidity())return;
 const visibility=document.querySelector('input[name="visibility"]:checked').value;
 if(visibility==="exact"&&!$("host-exact").checked)return setMessage("host-feedback","Exact location sharing requires separate explicit consent.",true);
 const body={
  hostName:$("host-name").value.trim(),contactEmail:$("host-email").value.trim(),privateAddress:$("host-address").value.trim(),
  visibility,options:[...document.querySelectorAll('input[name="options"]:checked')].map(x=>x.value),
  note:$("host-note").value.trim(),
  consent:{isAdult:$("host-adult").checked,controlsHome:$("host-adult").checked,publishApprovedInfo:$("host-public").checked,exactLocation:$("host-exact").checked}
 };
 $("host-submit").disabled=true;setMessage("host-feedback","Submitting privately…");
 try{
  const res=await json("/events/"+encodeURIComponent(state.event.slug)+"/hosts",{method:"POST",body:JSON.stringify(body)});
  $("receipt-id").value=res.id;$("receipt-code").value=res.receipt;$("receipt-panel").hidden=false;
  $("remove-id").value=res.id;$("remove-code").value=res.receipt;
  setMessage("host-feedback","Received for review. Your address is not publicly displayed.");
  form.reset();$("exact-consent-row").hidden=true;
  $("receipt-panel").scrollIntoView({behavior:"auto",block:"nearest"});
 }catch(error){setMessage("host-feedback",error.message,true)}finally{$("host-submit").disabled=false}
});
$("copy-receipt").addEventListener("click",async()=>{
 const content="Porchlight submission ID: "+$("receipt-id").value+"\nRemoval code: "+$("receipt-code").value;
 try{await navigator.clipboard.writeText(content);setMessage("host-feedback","Receipt copied. Store it securely.")}catch{setMessage("host-feedback","Copy the ID and removal code manually.",true)}
});
$("remove-form").addEventListener("submit",async e=>{
 e.preventDefault();if(!e.currentTarget.reportValidity())return;
 const id=$("remove-id").value.trim(),receipt=$("remove-code").value.trim();
 if(!/^[0-9a-f-]{36}$/i.test(id)||!/^[0-9a-f]{64}$/.test(receipt))return setMessage("remove-feedback","Check your submission ID and removal code.",true);
 try{await json("/submissions/"+encodeURIComponent(id)+"/revoke",{method:"POST",body:JSON.stringify({receipt})});setMessage("remove-feedback","Your listing has been withdrawn and private contact details cleared.");$("remove-code").value="";if(state.event)await selectEvent(state.event.slug)}
 catch(err){setMessage("remove-feedback",err.message,true)}
});
$("report-form").addEventListener("submit",async e=>{
 e.preventDefault();if(!e.currentTarget.reportValidity()||!state.event)return;
 const body={hostId:$("report-host").value,reason:$("report-reason").value,details:$("report-details").value.trim()};
 try{await json("/events/"+encodeURIComponent(state.event.slug)+"/reports",{method:"POST",body:JSON.stringify(body)});setMessage("report-feedback","Private report recorded for organizer review.");$("report-details").value=""}
 catch(err){setMessage("report-feedback",err.message,true)}
});
init();
