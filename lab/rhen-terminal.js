// RHEN private Lab one-screen observer. All values come from a same-origin
// Access-protected GET response. No broker credentials, trade buttons, fake data,
// stored account history, order POSTs or copy-trade actions.
(()=>{'use strict';
 const $=id=>document.getElementById(id);
 const terminal=$('terminal');if(!terminal)return;
 const money=value=>typeof value==='number'&&Number.isFinite(value)?new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',minimumFractionDigits:2,maximumFractionDigits:2}).format(value):'—';
 const count=value=>typeof value==='number'&&Number.isFinite(value)?String(value):'—';
 const text=(id,value)=>{const node=$(id);if(node)node.textContent=String(value??'—');};
 let pane='scan',flowView='orders',lastGood=null,observations=[],inFlight=false,controller=null,prevFocus=null;
 let lastAttempt=0,timer=null;
 function renderMobile(){
  for(const key of ['scan','flow','account']){
   const item=$('pane'+(key==='scan'?'Scan':key==='flow'?'Flow':'Account'));
   if(item)item.dataset.mobileActive=String(key===pane);
   const tab=$('mobile'+(key==='scan'?'Scan':key==='flow'?'Flow':'Account'));
   if(tab){tab.setAttribute('aria-selected',String(key===pane));tab.tabIndex=key===pane?0:-1;}
  }
 }
 const selectPane=key=>{if(!['scan','flow','account'].includes(key))return;pane=key;renderMobile();};
 document.querySelectorAll('[data-mobile-pane]').forEach(el=>el.addEventListener('click',()=>selectPane(el.dataset.mobilePane)));
 const switchFlow=key=>{
  if(!['orders','positions'].includes(key))return;
  flowView=key;
  document.querySelectorAll('[data-flow]').forEach(el=>{el.setAttribute('aria-selected',String(el.dataset.flow===key));el.tabIndex=el.dataset.flow===key?0:-1;});
  renderActivity(lastGood);
 };
 document.querySelectorAll('[data-flow]').forEach(el=>el.addEventListener('click',()=>switchFlow(el.dataset.flow)));
 const setPill=(mode,caption)=>{
  const p=$('brokerPill');p.classList.toggle('connected',mode==='connected');p.classList.toggle('degraded',mode==='degraded');
  text('brokerPillText',caption);terminal.dataset.connection=mode;
 };
 function node(tag,cls,content){const el=document.createElement(tag);if(cls)el.className=cls;if(content!==undefined)el.textContent=String(content);return el;}
 const fmtTime=stamp=>{
  if(typeof stamp!=='string'||!Number.isFinite(Date.parse(stamp)))return '—';
  return new Date(stamp).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit',timeZone:'America/New_York'});
 };
 function makeRow(kind,item){
  const isOrder=kind==='orders',wrap=node('div',isOrder?'trade-row':'position-row');
  if(isOrder){
   const sym=node('strong','',item.symbol||'—');
   const middle=node('span','');
   const side=node('strong','trade-side'+(item.side==='sell'?' sell':''),String(item.side||'—').toUpperCase());
   const sub=node('small','',fmtTime(item.at));middle.append(side,sub);
   const right=node('span','trade-state',String(item.status||'—').toUpperCase());
   wrap.append(sym,middle,right);
   wrap.title='Broker order. RHEN bot attribution not independently verified.';
  }else{
   wrap.append(node('strong','',item.symbol||'—'),node('span','dim',count(item.qty)+' '+item.side),node('strong',item.unrealized_pl<0?'negative':item.unrealized_pl>0?'positive':'',money(item.unrealized_pl)));
  }
  return wrap;
 }
 function renderActivity(value){
  const orderRows=$('orderRows'),positionRows=$('positionRows'),empty=$('activityEmpty');
  orderRows.replaceChildren();positionRows.replaceChildren();
  orderRows.hidden=true;positionRows.hidden=true;
  const key=flowView==='orders'?'orders':'positions',items=value?.[key],state=value?.[key+'_state'];
  if(state!=='OBSERVED'||!Array.isArray(items)){
   empty.hidden=false;
   const main=empty.querySelector('strong');const desc=empty.querySelector('span');
   if(main)main.textContent='Broker data unavailable';
   if(desc)desc.textContent='This account '+(value?.provider?.state==='NOT_CONNECTED'?'has not been connected':'could not be verified')+'. No orders or positions are inferred.';
   text('tradeCount','NO SOURCE');
  }else if(items.length===0){
   empty.hidden=false;
   const main=empty.querySelector('strong');const desc=empty.querySelector('span');
   if(main)main.textContent=key==='orders'?'No recorded broker orders':'No open positions';
   if(desc)desc.textContent='This is an observed empty '+(key==='orders'?'order feed':'position set')+', not a fabricated or simulated activity state.';
   text('tradeCount','0 OBSERVED');
  }else{
   empty.hidden=true;
   const host=key==='orders'?orderRows:positionRows;
   for(const item of items.slice(0,5))host.append(makeRow(key,item));
   host.hidden=false;
   text('tradeCount',items.length+' OBSERVED');
  }
  text('activityNote','Broker '+(key==='orders'?'orders':'positions')+' are not verified RHEN bot activity; source and timestamps are shown only when observed.');
 }
 function showScanner(payload){
  const s=payload?.scanner;
  const real=Boolean(s?.state==='RUNNING'&&s?.source==='VERIFIED_RHEN_ENGINE'&&Array.isArray(s.candidates)&&typeof s.last_scan_at==='string');
  const empty=$('scannerEmpty'),rows=$('scannerRows');rows.replaceChildren();
  if(!real){
   empty.hidden=false;rows.hidden=true;
   text('activeCount','—');text('scanTime','NO RECENT SCAN');text('scannerSource','ENGINE OFFLINE');
   text('engineTitle','ENGINE OFFLINE');text('engineSubtitle','Waiting for a verified RHEN equity scanner');
   text('statusRuntime','OFFLINE');text('holoState','IDLE');return;
  }
  const filtered=s.candidates.slice(0,5);
  for(const item of filtered){
   const row=node('div','scanner-row');
   row.append(node('strong','',item.symbol||'—'),node('span','',item.state||'OBSERVING'),node('small','',item.score===null?'—':count(item.score)));
   rows.append(row);
  }
  empty.hidden=filtered.length>0;rows.hidden=filtered.length===0;
  text('activeCount',count(s.active_universe));text('scanTime',fmtTime(s.last_scan_at));text('scannerSource','VERIFIED ENGINE');
  text('engineTitle','SCANNER OBSERVING');text('engineSubtitle','Verified read-only RHEN telemetry');
  text('statusRuntime','OBSERVING');text('holoState','OBSERVING');
 }
 function plotHistory(){
  const history=$('historySvg'),blank=$('historyBlank'),plot=$('historyPlot');
  if(observations.length<2){history.hidden=true;blank.hidden=false;text('historyNote','NO VERIFIED HISTORY · NEW SESSION');return;}
  const pts=observations.slice(-90);
  const vals=pts.map(x=>x.equity),lowest=Math.min(...vals),highest=Math.max(...vals);
  const pad=Math.max(.01,(highest-lowest)*.18);
  const lo=lowest-pad,hi=highest+pad;
  const minT=pts[0].time,maxT=pts[pts.length-1].time;
  const coords=pts.map(x=>({x:((x.time-minT)/Math.max(1,maxT-minT))*680+10,y:90-((x.equity-lo)/Math.max(.01,hi-lo))*80}));
  $('historyPath').setAttribute('d',coords.map((p,i)=>(i?'L':'M')+p.x.toFixed(2)+' '+p.y.toFixed(2)).join(' '));
  const last=coords[coords.length-1];$('historyDot').setAttribute('cx',String(last.x));$('historyDot').setAttribute('cy',String(last.y));
  history.hidden=false;blank.hidden=true;text('historyNote',pts.length+' ACTUAL SAMPLES · SESSION ONLY');
 }
 function clearMetrics(){
  for(const id of ['metricEquity','metricPnl','metricPower','metricPositions','metricMarket','accountCash','accountLong','accountStatus','accountAge'])text(id,'—');
  $('metricPnl').classList.remove('positive','negative');
  text('metricEquityNote','No account source');text('marketNote','Clock unavailable');
 }
 function render(value){
  const p=value?.provider||{},connected=p.state==='CONNECTED',degraded=p.state==='DEGRADED';
  setPill(connected?'connected':degraded?'degraded':'offline',connected?'BROKER '+p.environment:degraded?'SOURCE DEGRADED':'NOT CONNECTED');
  text('statusSource',connected?'ALPACA '+p.environment:degraded?'PARTIAL':'NONE');
  text('holoMode',p.environment||'OFFLINE');
  text('footerSource',connected||degraded?'BROKER '+p.environment+' · 15S POLL':'SOURCE: NOT CONNECTED');
  text('footerFresh',connected?'OBSERVED '+fmtTime(p.observed_at):degraded?'PARTIAL BROKER DATA':'READ-ONLY · NOT ARMED');
  text('dialogBroker',connected?'ALPACA '+p.environment:degraded?'ALPACA PARTIAL':'NOT CONNECTED');
  clearMetrics();
  if(value?.account_state==='OBSERVED'&&value.account){
   const a=value.account;
   text('metricEquity',money(a.equity));text('metricPnl',money(a.day_pl));text('metricPower',money(a.buying_power));
   text('accountCash',money(a.cash));text('accountLong',money(a.long_market_value));text('accountStatus',a.broker_status||'—');
   text('accountAge',fmtTime(value.observed_at));text('metricEquityNote',p.environment+' · BROKER');
   $('metricPnl').classList.toggle('positive',typeof a.day_pl==='number'&&a.day_pl>0);
   $('metricPnl').classList.toggle('negative',typeof a.day_pl==='number'&&a.day_pl<0);
   // A line is only drawn from true observations, never extrapolated. No persistence.
   if(typeof a.equity==='number'&&Number.isFinite(Date.parse(value.observed_at))){
    const at=Date.parse(value.observed_at);
    if(!observations.length||at>observations[observations.length-1].time){
     observations.push({time:at,equity:a.equity});
     observations=observations.filter(x=>at-x.time<=4*60*60*1000).slice(-90);
    }
   }
   text('accountMessage','Authenticated brokerage observation');
  }else text('accountMessage','Account unavailable');
  if(value?.positions_state==='OBSERVED'&&Array.isArray(value.positions))text('metricPositions',count(value.positions.length));
  if(value?.market_state==='OBSERVED'&&value.market){
   text('metricMarket',value.market.is_open?'OPEN':'CLOSED');text('marketNote',value.market.is_open?'U.S. equity session':'Not currently open');
  }
  renderActivity(value);showScanner(value);plotHistory();
 }
 async function refresh(){
  if(inFlight)return;inFlight=true;lastAttempt=Date.now();
  const button=$('refreshBtn');button.disabled=true;button.textContent='···';
  controller?.abort();controller=new AbortController();
  try{
   const r=await fetch('/projects/rhen/api/overview',{method:'GET',credentials:'same-origin',cache:'no-store',headers:{Accept:'application/json'},signal:controller.signal});
   if(!r.ok||!(r.headers.get('content-type')||'').includes('application/json'))throw Error('Observer returned no verified JSON');
   const data=await r.json();
   if(data?.schema!=='anevum.lab.rhen-observer.v1'||!Number.isFinite(Date.parse(data.observed_at))||Date.now()-Date.parse(data.observed_at)>30000||Date.now()-Date.parse(data.observed_at)<-5000)throw Error('Observation schema/time invalid');
   lastGood=data;render(lastGood);
  }catch(error){
   // Do not freeze old broker values as though they are live.
   lastGood=null;observations=[];render({provider:{state:'DEGRADED',environment:'UNKNOWN'},account:null,account_state:'UNAVAILABLE',positions:null,positions_state:'UNAVAILABLE',orders:null,orders_state:'UNAVAILABLE',market:null,market_state:'UNAVAILABLE',scanner:{state:'OFFLINE'}});
   text('engineSubtitle','Read-only observer unavailable · no reliable account data');
  }finally{inFlight=false;button.disabled=false;button.textContent='↻';}
 }
 function schedule(){
  if(timer)clearInterval(timer);
  timer=setInterval(()=>{if(document.visibilityState==='visible'&&Date.now()-lastAttempt>=13500)void refresh();},15000);
 }
 $('refreshBtn').addEventListener('click',()=>void refresh());
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&Date.now()-lastAttempt>=12000)void refresh();});
 const dialog=$('sourceDialog');
 function openDialog(){prevFocus=document.activeElement;dialog.hidden=false;$('closeDialog').focus();}
 function closeDialog(){dialog.hidden=true;prevFocus?.focus();}
 $('sourceBtn').addEventListener('click',openDialog);
 $('closeDialog').addEventListener('click',closeDialog);
 dialog.addEventListener('click',e=>{if(e.target===dialog)closeDialog();});
 document.addEventListener('keydown',event=>{
  if(!dialog.hidden){
   if(event.key==='Escape'){event.preventDefault();closeDialog();}
   if(event.key==='Tab'){const list=[...dialog.querySelectorAll('a[href],button:not([disabled])')];if(!list.length)return;const first=list[0],last=list[list.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}
  }
 });
 // Pointer-driven three-dimensional parallax is purely aesthetic; no simulated scanner pulses.
 const stage=$('holoStage');let raf=0;
 const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 if(!reduceMotion&&window.matchMedia('(pointer:fine)').matches){
  stage.addEventListener('pointermove',e=>{
   const rect=stage.getBoundingClientRect(),nx=(e.clientX-rect.left)/Math.max(rect.width,1)-.5,ny=(e.clientY-rect.top)/Math.max(rect.height,1)-.5;
   if(raf)cancelAnimationFrame(raf);
   raf=requestAnimationFrame(()=>{stage.style.setProperty('--mx',(nx*17).toFixed(2)+'deg');stage.style.setProperty('--my',(-ny*15).toFixed(2)+'deg');});
  },{passive:true});
  stage.addEventListener('pointerleave',()=>{stage.style.setProperty('--mx','0deg');stage.style.setProperty('--my','0deg');});
 }
 renderMobile();render(null);void refresh();schedule();
})();
