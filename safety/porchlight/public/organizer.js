const path="/_private/porchlight";
const $=id=>document.getElementById(id);
const E=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text!=null)el.textContent=text;return el};
let access="",current="";
const message=(id,text,error=false)=>{const el=$(id);el.textContent=text;el.dataset.error=String(error)};
async function api(route,opts={}){
 if(!access)throw Error("PRIVATE_ACCESS_REQUIRED");
 const response=await fetch(path+route,{cache:"no-store",credentials:"omit",headers:{Authorization:"Bearer "+access,Accept:"application/json",...(opts.body?{"Content-Type":"application/json"}:{})},...opts});
 const value=await response.json().catch(()=>({code:"INVALID_SERVER_RESPONSE"}));
 if(!response.ok||!value.ok)throw Error((value.code||"REQUEST_FAILED").replaceAll("_"," "));
 return value;
}
$("auth-form").addEventListener("submit",async e=>{
 e.preventDefault();
 const token=$("token").value.trim();
 if(!/^[A-Za-z0-9_-]{32,128}$/.test(token))return message("auth-feedback","Token must be a long randomly generated organizer credential.",true);
 access=token;$("token").value="";
 $("admin-shell").hidden=false;$("sign-out").hidden=false;
 message("auth-feedback","Token retained in this page only. No persistent login cookie.");
 try{await api("/events/invalid-probe/queue");}
 catch(error){if(!/EVENT NOT FOUND/.test(error.message)){access="";$("admin-shell").hidden=true;$("sign-out").hidden=true;message("auth-feedback","Access could not be confirmed; token cleared.",true)}}
});
$("sign-out").addEventListener("click",()=>{
 access="";current="";$("admin-shell").hidden=true;$("sign-out").hidden=true;
 $("pending-hosts").replaceChildren();$("pending-reports").replaceChildren();
 message("auth-feedback","Access key and displayed private information cleared from this page.");
});
$("event-form").addEventListener("submit",async e=>{
 e.preventDefault();if(!e.currentTarget.reportValidity())return;
 const payload={
 slug:$("event-slug").value.trim(),title:$("event-title").value.trim(),neighborhood:$("event-neighborhood").value.trim(),
 startsAt:Math.floor(new Date($("event-start").value).getTime()/1000),
 endsAt:Math.floor(new Date($("event-end").value).getTime()/1000),
 centerLat:Number($("center-lat").value),centerLng:Number($("center-lng").value),
 radiusMeters:Number($("radius").value)
 };
 try{const r=await api("/events",{method:"POST",body:JSON.stringify(payload)});$("manage-slug").value=r.slug;message("event-create-feedback","Draft created. It is not public until activated.");}
 catch(error){message("event-create-feedback",error.message,true)}
});
function slug(){const v=$("manage-slug").value.trim();if(!/^[a-z][a-z0-9-]{2,47}$/.test(v))throw Error("Enter a valid event slug.");return v}
async function load(){
 current=slug();
 const d=await api("/events/"+encodeURIComponent(current)+"/queue");
 const hosts=$("pending-hosts"),reports=$("pending-reports");hosts.replaceChildren();reports.replaceChildren();
 if(!d.submissions?.length)hosts.append(E("p","notice","No pending host submissions."));
 for(const host of d.submissions||[])hosts.append(hostCard(host));
 if(!d.reports?.length)reports.append(E("p","notice","No open reports."));
 for(const report of d.reports||[])reports.append(reportCard(report));
 message("admin-feedback","Private queue updated. "+(d.submissions?.length||0)+" hosts awaiting review.");
}
$("load-queue").addEventListener("click",async()=>{try{await load()}catch(e){message("admin-feedback",e.message,true)}});
for(const [button,action] of [["activate-event","activate"],["close-event","close"]]){
 $(button).addEventListener("click",async()=>{
  try{
   const s=slug();
   if(!confirm(action==="close"?"Close event now? All public pins will disappear.":"Activate this event for public reads and approved hosts?"))return;
   const r=await api("/events/"+encodeURIComponent(s)+"/"+action,{method:"POST",body:"{}"});
   message("admin-feedback","Event status: "+r.status+".");
   await load();
  }catch(e){message("admin-feedback",e.message,true)}
 });
}
function field(label,value){const p=E("p");p.append(E("strong","",label+"  "),E("span","",String(value||"Not provided")));return p}
function hostCard(host){
 const card=E("article","admin-item");card.append(E("h3","",host.host_name||"Host application"),E("code","",host.id),
  field("Private address",host.private_address),field("Private contact",host.contact_email),
  field("Visibility",host.visibility),field("Note to organizer",host.note));
 const form=E("form","form-card");
 const label=E("label","","Public display label (approved by host)");const input=E("input");input.required=true;input.minLength=3;input.maxLength=120;input.placeholder=host.visibility==="area"?"General neighborhood area (never an address)":"Approved host address label";label.append(input);form.append(label);
 const methodLabel=E("label","","Out-of-band verification method");const method=E("select");for(const [id,title] of [["","Choose verification"],["direct_contact","Direct contact"],["in_person","In person"]]){const o=E("option","",title);o.value=id;method.append(o)}method.required=true;methodLabel.append(method);form.append(methodLabel);
 const coords=E("div","split");
 let lat, lng;
 if(host.visibility==="exact"){
  const a=E("label","","Approved latitude");lat=E("input");lat.type="number";lat.step="any";lat.required=true;lat.placeholder="Must be within event boundary";a.append(lat);
  const b=E("label","","Approved longitude");lng=E("input");lng.type="number";lng.step="any";lng.required=true;b.append(lng);coords.append(a,b);form.append(coords);
 }else form.append(E("p","","Area-only: no exact location pin will be published."));
 const verify=E("label","choice verify-box");const chk=E("input");chk.type="checkbox";chk.required=true;verify.append(chk,E("span","","I independently verified the applicant's authority and explicit public display preferences."));form.append(verify);
 const actions=E("div","actions"),approve=E("button","btn primary","Approve host"),reject=E("button","btn secondary","Reject");approve.type="submit";reject.type="button";actions.append(approve,reject);form.append(actions);
 const feedback=E("p","form-feedback");feedback.setAttribute("role","status");form.append(feedback);
 form.addEventListener("submit",async e=>{
  e.preventDefault();if(!form.reportValidity())return;
  if(!confirm("Confirm independent verification and publication of only the approved details?"))return;
  const payload={action:"approve",publicLabel:input.value.trim(),verificationMethod:method.value,verifiedOutOfBand:chk.checked,lat:lat?Number(lat.value):null,lng:lng?Number(lng.value):null};
  try{await api("/hosts/"+encodeURIComponent(host.id)+"/decision",{method:"POST",body:JSON.stringify(payload)});await load()}catch(e){feedback.textContent=e.message;feedback.dataset.error="true"}
 });
 reject.addEventListener("click",async()=>{
  if(!confirm("Reject this pending application?"))return;
  try{await api("/hosts/"+encodeURIComponent(host.id)+"/decision",{method:"POST",body:JSON.stringify({action:"reject"})});await load()}catch(e){feedback.textContent=e.message;feedback.dataset.error="true"}
 });
 card.append(form);return card;
}
function reportCard(report){
 const card=E("article","admin-item");card.append(E("h3","","Community report · "+report.reason),field("Private details",report.details),field("Host ID",report.host_id),E("small","",new Date(report.created_at*1000).toLocaleString()));
 const done=E("button","btn secondary","Mark reviewed / resolved");done.type="button";
 const feedback=E("p","form-feedback");feedback.setAttribute("role","status");
 done.addEventListener("click",async()=>{
  if(!confirm("Mark report resolved after taking any necessary private action?"))return;
  try{await api("/reports/"+encodeURIComponent(report.id)+"/resolve",{method:"POST",body:"{}"});await load()}catch(e){feedback.textContent=e.message;feedback.dataset.error="true"}
 });
 card.append(done,feedback);return card;
}
