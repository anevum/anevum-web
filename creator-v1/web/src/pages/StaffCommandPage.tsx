// ANEVUM.IREN.BUILD.2026-10-17.001.MODERATOR-COMMAND-PORTAL
// Single viewport, independently authenticated staff operations workspace.
// Data comes from canonical MEMBER_DB; never from demo fixtures or localStorage.
import {useEffect,useRef,useState, type FormEvent, type PointerEvent as ReactPointerEvent} from 'react';
import {canonicalAuthClient} from '../lib/canonical-beta';
import {OrbitalMark} from '../components/OrbitalMark';
import {StaffBridge,type StaffPeer} from '../components/StaffBridge';
import './staff-command.css';

type Room='operations'|'review'|'projects';
type Pane='overview'|'communications'|'board'|'invitations'|'tasks'|'moderation'|'team'|'members';
type DirectoryMember={id:string;name:string;handle:string;verified:boolean;visibility:string;staffRole:string|null};
type InviteStage='invited'|'responded'|'joined'|'staff-candidate'|'closed';
type TaskStage='open'|'in-progress'|'blocked'|'done';
type Invitation={id:string;alias:string;channel:string;stage:InviteStage;note:string;createdAt:number;updatedAt:number};
type Task={id:string;title:string;stage:TaskStage;priority:string;updatedAt:number};
type Message={seq:number;id:string;room:Room;authorId:string;author:string;body:string;createdAt:number};
type Stroke={points:number[][];color:string;width:number};
type CanvasEntry={seq:number;id:string;authorId:string;eventType:'stroke'|'clear';data:Stroke|null;createdAt:number};
type Activity={seq:number;eventType:string;entityId:string;createdAt:number;actor:string};
type StaffSnapshot={
 role:'owner'|'reviewer';memberId:string;room:Room;checkedAt:number;
 invitations:Invitation[];tasks:Task[];messages:Message[];canvas:CanvasEntry[];
 history:Activity[];roster:StaffPeer[];peers:{id:string;lastSeen:number}[];
 memberMetrics:{total:number;verified:number;profiles:number;new24h:number;new7d:number;new30d:number}|null;
 eligibleMembers:{id:string;name:string;handle:string}[];
 invitationMode:'manual-only';liveMode:'short-poll';callMode:'peer-preview'
};
type Author={displayName:string;handle:string};
type PendingThread={id:string;title:string;body:string;topic:string;createdAt:number;author:Author;canPublish:boolean;selfAuthored:boolean};
type PendingReply={id:string;body:string;threadTitle:string;createdAt:number;author:Author;canPublish:boolean;selfAuthored:boolean};
type OpenReport={id:string;reason:string;targetKind:'thread'|'reply';targetId:string;threadTitle:string|null;contentPreview:string;createdAt:number;canHide:boolean};
type DecisionLog={id:string;targetKind:string;action:string;reviewerHandle:string|null;createdAt:number};
type ReviewQueue={
 threads:PendingThread[];replies:PendingReply[];reports:OpenReport[];recent:DecisionLog[];
 totals:{threads:number;replies:number;reports:number};checkedAt:number
};
type PendingDecision={kind:'thread'|'reply'|'report';id:string;action:'publish'|'reject'|'hide'|'dismiss_report';label:string};
type ReviewLane='reports'|'threads'|'replies'|'activity';
const menu:{id:Pane;code:string;name:string;short:string;description:string}[]=[
 {id:'overview',code:'01',name:'Overview',short:'Overview',description:'Current situation'},
 {id:'communications',code:'02',name:'Comms',short:'Comms',description:'Staff transmissions'},
 {id:'board',code:'03',name:'Whiteboard',short:'Board',description:'Live drawing surface'},
 {id:'invitations',code:'04',name:'Invitations',short:'Invites',description:'People you reached'},
 {id:'tasks',code:'05',name:'Assignments',short:'Tasks',description:'Shared team actions'},
 {id:'moderation',code:'06',name:'Review',short:'Review',description:'Community integrity'},
 {id:'team',code:'07',name:'Personnel',short:'Team',description:'Verified staff roster'},
 {id:'members',code:'08',name:'Members',short:'Members',description:'Owner directory'}
];
const rooms:{id:Room;name:string}[]=[{id:'operations',name:'Operations'},{id:'review',name:'Moderation'},{id:'projects',name:'Projects'}];
const inviteStages:InviteStage[]=['invited','responded','joined','staff-candidate','closed'];
const taskStages:TaskStage[]=['open','in-progress','blocked','done'];
const colors=['#f67c73','#a99aff','#f5d2a0','#a6dece','#e4e7f5'];
const uppercase=(s:string)=>s.replaceAll('-',' ').replaceAll('_',' ').toUpperCase();
const clock=(seconds:number)=>new Date(seconds*1000).toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit'});
const stamp=(seconds:number)=>new Date(seconds*1000).toLocaleDateString(undefined,{month:'short',day:'numeric'});
const errorOf=(e:unknown)=>e instanceof Error?e.message:'Staff service unavailable';

async function staffRequest<T>(method:'GET'|'POST',body?:unknown,query='',signal?:AbortSignal):Promise<T>{
 const response=await fetch('/api/v1/member/staff-ops'+(query?'?'+query:''),{
  method,mode:'same-origin',credentials:'same-origin',redirect:'error',cache:'no-store',
  referrerPolicy:'same-origin',signal,
  headers:body===undefined?{Accept:'application/json'}:{Accept:'application/json','Content-Type':'application/json'},
  body:body===undefined?undefined:JSON.stringify(body)
 });
 const result=await response.json().catch(()=>({error:'Staff service returned an invalid response'}));
 if(!response.ok){
  const error=Object.assign(new Error(response.status===403?'Verified staff permission required':result.error||'Staff service unavailable'),{status:response.status});
  throw error;
 }
 return result as T;
}
async function reviewRequest<T>(method:'GET'|'POST',body?:unknown):Promise<T>{
 const response=await fetch('/api/v1/member/forum-review',{
  method,mode:'same-origin',credentials:'same-origin',redirect:'error',cache:'no-store',
  referrerPolicy:'same-origin',
  headers:body===undefined?{Accept:'application/json'}:{Accept:'application/json','Content-Type':'application/json'},
  body:body===undefined?undefined:JSON.stringify(body)
 });
 const data=await response.json().catch(()=>({error:'Review console unavailable'}));
 if(!response.ok)throw Error(response.status===403?'Independent reviewer authorization required':data.error||'Review console unavailable');
 return data as T;
}
// The current apex forum-review endpoint returns V041 flat queue rows.
 // Normalize safely while preserving V043 enriched snapshots when present.
function normalizeReviewQueue(raw:ReviewQueue):ReviewQueue {
 if(raw?.totals&&Array.isArray(raw.recent))return raw;
 const threadRows=Array.isArray(raw?.threads)?raw.threads:[];
 const replyRows=Array.isArray(raw?.replies)?raw.replies:[];
 const reportRows=Array.isArray(raw?.reports)?raw.reports:[];
 const threads=threadRows.map(item=>{
  const row=item as PendingThread&{created_at?:number;handle?:string;display_name?:string};
  return {...item,createdAt:row.createdAt??row.created_at??0,
   author:row.author??{displayName:row.display_name||'Member',handle:row.handle||''},
   canPublish:row.canPublish??true,selfAuthored:row.selfAuthored??false};
 });
 const replies=replyRows.map(item=>{
  const row=item as PendingReply&{created_at?:number;handle?:string;display_name?:string;thread_id?:string};
  return {...item,createdAt:row.createdAt??row.created_at??0,
   threadTitle:row.threadTitle||'Community discussion',
   author:row.author??{displayName:row.display_name||'Member',handle:row.handle||''},
   canPublish:row.canPublish??true,selfAuthored:row.selfAuthored??false};
 });
 const reports=reportRows.map(item=>{
  const row=item as OpenReport&{created_at?:number;target_kind?:'thread'|'reply';target_id?:string};
  return {...item,createdAt:row.createdAt??row.created_at??0,
   targetKind:row.targetKind??row.target_kind??'thread',
   targetId:row.targetId??row.target_id??'',
   threadTitle:row.threadTitle??null,contentPreview:row.contentPreview??'Open the full reviewer console for the reported content.',
   canHide:row.canHide??false};
 });
 return {threads,replies,reports,recent:Array.isArray(raw.recent)?raw.recent:[],
  totals:{threads:threads.length,replies:replies.length,reports:reports.length},
  checkedAt:Math.floor(Date.now()/1000)};
}
function Badge({label,kind='neutral'}:{label:string;kind?:'neutral'|'active'|'warning'}){
 return <span className={'ir-tag ir-tag--'+kind}>{label}</span>;
}
function Empty({title,detail}:{title:string;detail:string}){
 return <div className="ir-empty"><span aria-hidden="true">◇</span><strong>{title}</strong><p>{detail}</p></div>;
}

function CommandWorkspace({memberId}:{memberId:string}){
 const [pane,setPane]=useState<Pane>('overview');
 const [room,setRoom]=useState<Room>('operations');
 const [snapshot,setSnapshot]=useState<StaffSnapshot|null>(null);
 const [loading,setLoading]=useState(true);
 const [fault,setFault]=useState('');
 const [notice,setNotice]=useState('');
 const [busy,setBusy]=useState(false);
 const [chatDraft,setChatDraft]=useState('');
 const [inviteName,setInviteName]=useState('');
 const [inviteChannel,setInviteChannel]=useState('direct');
 const [inviteNote,setInviteNote]=useState('');
 const [taskName,setTaskName]=useState('');
 const [candidate,setCandidate]=useState('');
 const [members,setMembers]=useState<DirectoryMember[]>([]);
 const [memberSearch,setMemberSearch]=useState('');
 const [memberError,setMemberError]=useState('');
 const [membersLoading,setMembersLoading]=useState(false);
 const [taskPriority,setTaskPriority]=useState('routine');
 const [penColor,setPenColor]=useState(colors[0]);
 const [penWidth,setPenWidth]=useState(2);
 const [queue,setQueue]=useState<ReviewQueue|null>(null);
 const [reviewFault,setReviewFault]=useState('');
 const [reviewLane,setReviewLane]=useState<ReviewLane>('reports');
 const [decision,setDecision]=useState<PendingDecision|null>(null);
 const canvasRef=useRef<HTMLCanvasElement|null>(null);
 const drawingRef=useRef<Stroke|null>(null);
 const canvasEventsRef=useRef<CanvasEntry[]>([]);
 const chatEndRef=useRef<HTMLDivElement|null>(null);
 const roomRef=useRef<Room>(room);
 const paneRef=useRef<Pane>(pane);
 roomRef.current=room;paneRef.current=pane;

 useEffect(()=>{
  let cancelled=false,inFlight=false,lastFetched=0;
  const controller=new AbortController();
  // Keep the verified workspace mounted across room switches so active peer
  // calls are not disconnected by a channel change.
  setLoading(true);setFault('');
  const poll=async()=>{
   if(inFlight||cancelled)return;
   const minAge=paneRef.current==='communications'||paneRef.current==='board'?6000:20000;
   if(lastFetched&&Date.now()-lastFetched<minAge)return;
   inFlight=true;lastFetched=Date.now();
   try{
    const next=await staffRequest<StaffSnapshot>('GET',undefined,'room='+room,controller.signal);
    if(!cancelled){setSnapshot(next);setFault('');setLoading(false)}
   }catch(e){if(!cancelled){
    if((e as Error & {status?:number})?.status===401||(e as Error & {status?:number})?.status===403)setSnapshot(null);
    setFault(errorOf(e));setLoading(false)
   }}
   finally{inFlight=false}
  };
  void poll();
  const id=window.setInterval(()=>{if(document.visibilityState!=='hidden')void poll()},2000);
  return()=>{cancelled=true;controller.abort();window.clearInterval(id)};
 },[memberId,room]);
 useEffect(()=>{
  if(!snapshot?.memberId)return;
  let disposed=false,fetching=false;
  const poll=async()=>{
   if(disposed||fetching)return;fetching=true;
   try{
    const next=normalizeReviewQueue(await reviewRequest<ReviewQueue>('GET'));
    if(!disposed){setQueue(next);setReviewFault('')}
   }catch(e){if(!disposed){setReviewFault(errorOf(e));setQueue(null)}}
   finally{fetching=false}
  };
  void poll();const id=window.setInterval(()=>{
   if(document.visibilityState!=='hidden'&&(paneRef.current==='overview'||paneRef.current==='moderation'))void poll();
  },45000);
  return()=>{disposed=true;window.clearInterval(id)};
 },[snapshot?.memberId]);

 useEffect(()=>{
  if(pane!=='members'||snapshot?.role!=='owner')return;
  let alive=true;setMembersLoading(true);setMemberError('');
  void staffRequest<{members:DirectoryMember[]}>('GET',undefined,'lane=members').then(d=>{
   if(alive)setMembers(d.members);
  }).catch(e=>{if(alive)setMemberError(errorOf(e))}).finally(()=>{if(alive)setMembersLoading(false)});
  return()=>{alive=false};
 },[pane,snapshot?.role]);
 const refresh=async()=>{
  const next=await staffRequest<StaffSnapshot>('GET',undefined,'room='+roomRef.current);
  if(next.room===roomRef.current){setSnapshot(next);setFault('')}
 };
 const execute=async(body:unknown,onSuccess?:()=>void)=>{
  if(busy)return;
  setBusy(true);setNotice('');
  try{
   await staffRequest('POST',body);onSuccess?.();await refresh();
  }catch(e){setNotice(errorOf(e))}
  finally{setBusy(false)}
 };
 const refreshReview=async()=>{
  try{setQueue(normalizeReviewQueue(await reviewRequest<ReviewQueue>('GET')));setReviewFault('')}
  catch(e){setReviewFault(errorOf(e))}
 };
 const sendMessage=(e?:FormEvent)=>{
  e?.preventDefault();
  const body=chatDraft.trim();
  if(body&&body.length<=1200){
   void execute({kind:'message',room,body},()=>setChatDraft(''));
  }
 };
 const createInvite=(e:FormEvent)=>{
  e.preventDefault();
  const alias=inviteName.trim();
  if(alias)void execute({kind:'invite-create',alias,channel:inviteChannel,note:inviteNote},()=>{
   setInviteName('');setInviteNote('')
  });
 };
 const createTask=(e:FormEvent)=>{
  e.preventDefault();
  const title=taskName.trim();
  if(title.length>=4)void execute({kind:'task-create',title,priority:taskPriority},()=>setTaskName(''));
 };
 const confirmDecision=async()=>{
  if(!decision||busy)return;
  setBusy(true);setNotice('');
  try{
   await reviewRequest('POST',{targetKind:decision.kind,targetId:decision.id,action:decision.action});
   setDecision(null);await refreshReview();setNotice('Review decision recorded by the canonical moderation service.');
  }catch(e){setNotice(errorOf(e))}
  finally{setBusy(false)}
 };
 const drawCanvas=()=>{
  const canvas=canvasRef.current;
  if(!canvas)return;
  const rect=canvas.getBoundingClientRect();
  if(rect.width<2||rect.height<2)return;
  const ratio=Math.min(window.devicePixelRatio||1,2.5);
  const pixelWidth=Math.round(rect.width*ratio),pixelHeight=Math.round(rect.height*ratio);
  if(canvas.width!==pixelWidth||canvas.height!==pixelHeight){canvas.width=pixelWidth;canvas.height=pixelHeight}
  const ctx=canvas.getContext('2d');
  if(!ctx)return;
  ctx.setTransform(ratio,0,0,ratio,0,0);
  ctx.clearRect(0,0,rect.width,rect.height);
  const strokes:Stroke[]=[];
  for(const event of canvasEventsRef.current){
   if(event.eventType==='clear')strokes.length=0;
   else if(event.data?.points?.length)strokes.push(event.data);
  }
  if(drawingRef.current)strokes.push(drawingRef.current);
  for(const stroke of strokes){
   if(!stroke.points||stroke.points.length<2)continue;
   ctx.beginPath();ctx.strokeStyle=stroke.color;ctx.lineWidth=stroke.width*1.35;
   ctx.lineJoin='round';ctx.lineCap='round';
   stroke.points.forEach(([x,y],i)=>{
    if(i===0)ctx.moveTo(x*rect.width,y*rect.height);
    else ctx.lineTo(x*rect.width,y*rect.height);
   });
   ctx.stroke();
  }
 };
 useEffect(()=>{
  canvasEventsRef.current=snapshot?.room===room?snapshot.canvas:[];
  if(pane!=='board')return;
  const frame=window.requestAnimationFrame(drawCanvas);
  const canvas=canvasRef.current;
  const observer=typeof ResizeObserver!=='undefined'&&canvas?new ResizeObserver(drawCanvas):null;
  if(canvas)observer?.observe(canvas);
  window.addEventListener('resize',drawCanvas);
  return()=>{window.cancelAnimationFrame(frame);observer?.disconnect();window.removeEventListener('resize',drawCanvas)};
 },[snapshot?.canvas,pane,room]);
 const normalized=(e:ReactPointerEvent<HTMLCanvasElement>):number[]=>{
  const rect=e.currentTarget.getBoundingClientRect();
  return [Math.max(0,Math.min(1,(e.clientX-rect.left)/rect.width)),
   Math.max(0,Math.min(1,(e.clientY-rect.top)/rect.height))];
 };
 const startStroke=(e:ReactPointerEvent<HTMLCanvasElement>)=>{
  if(e.pointerType==='mouse'&&e.button!==0)return;
  e.currentTarget.setPointerCapture(e.pointerId);
  const p=normalized(e);drawingRef.current={points:[p,p],color:penColor,width:penWidth};
  drawCanvas();
 };
 const moveStroke=(e:ReactPointerEvent<HTMLCanvasElement>)=>{
  const stroke=drawingRef.current;
  if(!stroke)return;
  const p=normalized(e),last=stroke.points.at(-1)!;
  if(Math.hypot(p[0]-last[0],p[1]-last[1])<0.004||stroke.points.length>=64)return;
  stroke.points.push(p);drawCanvas();
 };
 const finishStroke=()=>{
  const stroke=drawingRef.current;
  drawingRef.current=null;
  drawCanvas();
  if(stroke?.points.length&&stroke.points.length>=2)void execute({kind:'stroke',room,stroke});
 };
 useEffect(()=>{
  if(pane==='communications')chatEndRef.current?.scrollIntoView({block:'end'});
 },[snapshot?.messages,pane]);

 const activeMessages=snapshot?.room===room?snapshot.messages:[];
 const activeCanvas=snapshot?.room===room?snapshot.canvas:[];
 const invites=snapshot?.invitations||[];
 const tasks=snapshot?.tasks||[];
 const roster=snapshot?.roster||[];
 const candidates=snapshot?.eligibleMembers||[];
 const online=snapshot?.peers.map(p=>p.id)||[];
 const counts=queue?.totals;
 const reviewTotal=counts?counts.threads+counts.replies+counts.reports:null;
 const pendingTasks=tasks.filter(x=>x.stage!=='done');
 const invited=invites.filter(x=>x.stage==='invited');
 const selectedMenu=menu.find(x=>x.id===pane)!;
 const memberHasAccess=Boolean(snapshot);
 return <section className="ir-screen" data-pane={pane} aria-label="IREN staff command portal">
  <div className="ir-atmosphere" aria-hidden="true"/><div className="ir-scanner" aria-hidden="true"/>
  <header className="ir-header">
   <div className="ir-header-brand"><OrbitalMark className="ir-mark"/>
    <div><small>ANEVUM / CONTINUANCE INSTITUTE</small><strong>IREN <span>COMMAND</span></strong></div></div>
   <div className="ir-header-signal"><span className="ir-pulse" aria-hidden="true"/>
    <span>STAFF CHANNEL <b>{memberHasAccess?'AUTHENTICATED':loading?'NEGOTIATING':'SEALED'}</b></span></div>
   <div className="ir-header-right"><span className="ir-time">{new Date().toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'})}</span>
    <a href="/community">RETURN TO COMMONS <span aria-hidden="true">↗</span></a></div>
  </header>
  {loading&&!snapshot?<div className="ir-gate"><div className="ir-gate-symbol">◇</div><h1>Identifying staff signal.</h1>
    <p>Verifying your canonical ANEVUM membership and explicit reviewer authorization.</p></div>:
   !snapshot?<div className="ir-gate" role="alert">
    <div className="ir-gate-symbol">◇</div><span className="ir-kicker">ACCESS / DENIED OR UNAVAILABLE</span>
    <h1>Staff clearance required.</h1><p>{fault||'The staff command service is closed.'}</p>
    <p>Invitations and ordinary member accounts never automatically grant staff access. The owner must authorize a verified member ID and enable the staff service after schema checks.</p>
    <div><a href="/join">SIGN IN</a><a href="/community/review">EXISTING REVIEW CONSOLE</a></div>
   </div>:
   <div className="ir-body">
    <nav className="ir-nav" aria-label="IREN command sections">
     <div className="ir-nav-top"><span className="ir-kicker">OPERATIONS ARRAY</span><strong>07 / ACTIVE MODULES</strong></div>
     {menu.filter(item=>item.id!=='members'||snapshot.role==='owner').map(item=><button type="button" key={item.id} className={pane===item.id?'is-current':''}
      onClick={()=>{setPane(item.id);setNotice('')}} aria-current={pane===item.id?'page':undefined}>
      <span className="ir-nav-index">{item.code}</span><span className="ir-nav-copy"><b className="ir-nav-name">{item.name}</b><b className="ir-nav-short">{item.short}</b><small>{item.description}</small></span>
      {(item.id==='moderation'&&reviewTotal!==null&&reviewTotal>0)||(item.id==='tasks'&&pendingTasks.length>0)||
       (item.id==='invitations'&&invited.length>0)?<i className="ir-nav-count">
        {item.id==='moderation'?reviewTotal:item.id==='tasks'?pendingTasks.length:invited.length}</i>:null}
     </button>)}
     <div className="ir-nav-bottom"><span>COMMAND ID / IREN-001</span><small>OBSERVE · COORDINATE · PROTECT</small></div>
    </nav>
    <main className="ir-stage" id="iren-workspace">
     <header className="ir-stage-header">
      <div><span className="ir-kicker">TERMINAL / {selectedMenu.code} / {pane.toUpperCase()}</span>
       <h1>{selectedMenu.name}<span className="ir-cursor" aria-hidden="true">_</span></h1></div>
      <div className="ir-stage-status"><Badge kind="active" label={snapshot.role==='owner'?'FOUNDER ACCESS':'REVIEWER ACCESS'}/>
       <small>SYNC {clock(snapshot.checkedAt)}</small></div>
     </header>
     {notice&&<p className="ir-flash" role="alert">{notice}<button type="button" onClick={()=>setNotice('')} aria-label="Dismiss message">×</button></p>}
     {fault&&<p className="ir-flash" role="status">Connection interrupted. Existing records may be stale. {fault}</p>}
     <div className="ir-view">
      {pane==='overview'&&<div className="ir-overview">
       <section className="ir-hero"><div>
        <span className="ir-kicker">CONTINUANCE / OPERATIONS NETWORK</span>
        <h2>A place to maintain the signal.</h2>
        <p>One verified team. Community safety, creator support, shared plans, and direct communication — inside the same operating environment.</p>
        <div className="ir-hero-actions"><button type="button" onClick={()=>setPane('communications')}>OPEN STAFF COMMS ↗</button>
         <button type="button" onClick={()=>setPane('moderation')}>REVIEW QUEUE →</button></div>
       </div><div className="ir-hero-orbit" aria-hidden="true"><span/><span/><span/></div></section>
       <section className="ir-metrics" aria-label="Verified operation metrics">
        <button type="button" onClick={()=>setPane('moderation')}><small>REVIEW CASES</small><strong>{reviewTotal??'—'}</strong><span>{reviewTotal===null?'AUTHORIZATION REQUIRED':'THREADS · REPLIES · REPORTS'}</span></button>
        <button type="button" onClick={()=>setPane('invitations')}><small>OUTREACH RECORDS</small><strong>{invites.length}</strong><span>MANUALLY ENTERED</span></button>
        <button type="button" onClick={()=>setPane('tasks')}><small>OPEN TASKS</small><strong>{pendingTasks.length}</strong><span>ACTIVE ASSIGNMENTS</span></button>
        <button type="button" onClick={()=>setPane('team')}><small>VERIFIED STAFF</small><strong>{roster.length}</strong><span>{online.length} IN PEER BRIDGE</span></button>
       </section>
       <div className="ir-overview-bottom">
        <section className="ir-surface"><div className="ir-pane-heading"><span className="ir-kicker">INSTITUTE / NETWORK</span>
         <button type="button" onClick={()=>setPane('team')}>ALL STAFF ↗</button></div>
         {snapshot.memberMetrics?<><div className="ir-signups"><div><strong>{snapshot.memberMetrics.total}</strong><small>REGISTERED USERS</small></div>
          <div><strong>{snapshot.memberMetrics.verified}</strong><small>VERIFIED ACCOUNTS</small></div>
          <div><strong>{snapshot.memberMetrics.profiles}</strong><small>CREATOR PROFILES</small></div></div>
          <p className="ir-hint">NEW: {snapshot.memberMetrics.new24h} IN 24H · {snapshot.memberMetrics.new7d} IN 7D · {snapshot.memberMetrics.new30d} IN 30D</p></>:
          <p className="ir-hint">Member-wide signup totals are visible to the founder only.</p>}
         <p className="ir-hint">Invitation stages are manual and cannot be treated as verified registrations or granted moderator access.</p>
        </section>
        <section className="ir-surface"><div className="ir-pane-heading"><span className="ir-kicker">IMMEDIATE PRIORITIES</span>
         <button type="button" onClick={()=>setPane('tasks')}>ASSIGNMENTS ↗</button></div>
         {pendingTasks.length===0?<Empty title="No open assignments" detail="Add a shared task for the staff team."/>:
          pendingTasks.slice(0,3).map(t=><div className="ir-compact" key={t.id}><span className="ir-status-dot"/><b>{t.title}</b>
           <small>{uppercase(t.priority)}</small></div>)}
        </section>
       </div>
      </div>}
      {pane==='communications'&&<div className="ir-comms">
       <div className="ir-pane-heading"><div><span className="ir-kicker">ENCRYPTED IN TRANSIT / STAFF-ONLY</span><h2>Live transmissions</h2></div>
        <Badge label="APPROX. 6 S SYNC" kind="active"/></div>
       <div className="ir-room-tabs" role="group" aria-label="Choose communication channel">
        {rooms.map(r=><button key={r.id} type="button" className={room===r.id?'is-selected':''}
         onClick={()=>setRoom(r.id)}>{r.name.toUpperCase()}</button>)}
       </div>
       <div className="ir-chat-log" role="log" aria-label="Staff messages">
        {activeMessages.length===0?<Empty title="Quiet channel" detail="Send the first message to the staff room."/>:
         activeMessages.map(m=><article key={m.id} className={'ir-message '+(m.authorId===memberId?'is-own':'')}>
          <div><strong>{m.author}</strong><small>{clock(m.createdAt)} · {stamp(m.createdAt)}</small></div>
          <p>{m.body}</p>
         </article>)}
        <div ref={chatEndRef}/>
       </div>
       <form className="ir-composer" onSubmit={sendMessage}><label htmlFor="ir-message">TRANSMIT / {room.toUpperCase()}</label>
        <div><textarea id="ir-message" value={chatDraft} rows={2} maxLength={1200}
         placeholder="Write a staff message…" onChange={e=>setChatDraft(e.target.value)}
         onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMessage()}}}/>
         <button type="submit" disabled={busy||!chatDraft.trim()}>TRANSMIT ↗</button></div>
       </form>
      </div>}
      {pane==='board'&&<div className="ir-board">
       <div className="ir-pane-heading"><div><span className="ir-kicker">VISUAL COLLABORATION / LIVE EVENT STREAM</span><h2>Shared whiteboard</h2></div>
        <Badge label="SYNC / 6 S" kind="active"/></div>
       <div className="ir-board-tools"><div className="ir-room-tabs">
        {rooms.map(r=><button type="button" key={r.id} onClick={()=>setRoom(r.id)}
         className={room===r.id?'is-selected':''}>{r.name.toUpperCase()}</button>)}</div>
        <div className="ir-pen-tools"><span className="ir-kicker">INK</span>
         {colors.map(color=><button key={color} type="button" style={{background:color}}
          onClick={()=>setPenColor(color)} className={penColor===color?'is-chosen':''} aria-label={'Select '+color+' pen'}/>)}
         <select aria-label="Pen width" value={penWidth} onChange={e=>setPenWidth(Number(e.target.value))}>
          <option value={1}>FINE</option><option value={2}>MED</option><option value={3}>BOLD</option><option value={5}>HEAVY</option>
         </select>
         <button type="button" className="ir-clear" disabled={busy||activeCanvas.length===0}
          onClick={()=>{if(window.confirm('Clear the shared whiteboard for this channel?'))void execute({kind:'clear-canvas',room})}}>CLEAR ↺</button>
        </div></div>
       <div className="ir-canvas-container"><div className="ir-canvas-grid" aria-hidden="true"/>
        <canvas ref={canvasRef} className="ir-canvas" aria-label="Collaborative whiteboard. Draw with mouse or touch."
         onPointerDown={startStroke} onPointerMove={moveStroke} onPointerUp={finishStroke}
         onPointerCancel={()=>{drawingRef.current=null;drawCanvas()}}/>
        <span className="ir-canvas-label">IREN / {room.toUpperCase()} · SHARED DRAWING PLANE</span>
       </div>
       <p className="ir-hint">Draw directly on the plane. Strokes are shared with verified staff in this channel and saved as a bounded event history. Content is not automatically published.</p>
      </div>}
      {pane==='invitations'&&<div className="ir-list-module">
       <div className="ir-pane-heading"><div><span className="ir-kicker">OUTREACH / HUMAN NETWORK</span><h2>Personal invitations</h2></div>
        <Badge label="MANUALLY TRACKED"/></div>
       <p className="ir-section-intro">Record who you invited and their response. This is not an email-sending service, an invitation gate, or a way to grant staff permissions.</p>
       {snapshot.role==='owner'&&<form className="ir-inline-form" onSubmit={createInvite}>
        <label><span>FRIEND / ALIAS</span><input required maxLength={64} value={inviteName} onChange={e=>setInviteName(e.target.value)} placeholder="Name or nickname"/></label>
        <label><span>CHANNEL</span><select value={inviteChannel} onChange={e=>setInviteChannel(e.target.value)}>
         <option value="direct">DIRECT</option><option value="email">EMAIL</option><option value="social">SOCIAL</option><option value="other">OTHER</option>
        </select></label>
        <label className="ir-form-note"><span>NOTE / OPTIONAL</span><input maxLength={240} value={inviteNote} onChange={e=>setInviteNote(e.target.value)} placeholder="Short context"/></label>
        <button type="submit" disabled={busy||!inviteName.trim()}>LOG INVITE +</button>
       </form>}
       <div className="ir-record-list">
        {invites.length===0?<Empty title="No invitation records" detail="The portal cannot infer whom you invited from personal messages. Add people explicitly."/>:
        invites.map(invite=><article className="ir-record" key={invite.id}>
         <span className="ir-record-icon">↗</span>
         <div className="ir-record-copy"><strong>{invite.alias}</strong><small>{uppercase(invite.channel)} · {stamp(invite.updatedAt)} · {invite.note||'NO ADDITIONAL NOTES'}</small></div>
         {snapshot.role==='owner'?<select aria-label={'Outreach stage for '+invite.alias}
          value={invite.stage} disabled={busy} onChange={e=>void execute({kind:'invite-update',id:invite.id,stage:e.target.value})}>
          {inviteStages.map(stage=><option key={stage} value={stage}>{uppercase(stage)}</option>)}
         </select>:<Badge label={uppercase(invite.stage)}/>}
        </article>)}
       </div>
      </div>}
      {pane==='tasks'&&<div className="ir-list-module">
       <div className="ir-pane-heading"><div><span className="ir-kicker">JOINT OPERATIONS / ACTION REGISTER</span><h2>Shared assignments</h2></div>
        <Badge label={pendingTasks.length+' ACTIVE'}/></div>
       <form className="ir-inline-form ir-task-form" onSubmit={createTask}>
        <label><span>ACTION TITLE</span><input required minLength={4} maxLength={140} value={taskName}
         onChange={e=>setTaskName(e.target.value)} placeholder="What needs to be done?"/></label>
        <label><span>PRIORITY</span><select value={taskPriority} onChange={e=>setTaskPriority(e.target.value)}>
         <option value="routine">ROUTINE</option><option value="important">IMPORTANT</option><option value="urgent">URGENT</option></select></label>
        <button type="submit" disabled={busy||taskName.trim().length<4}>CREATE TASK +</button>
       </form>
       <div className="ir-record-list">
        {tasks.length===0?<Empty title="No assignments yet" detail="Create the first shared operation to coordinate the team."/>:
        tasks.map(t=><article className="ir-record" key={t.id}>
         <span className="ir-record-icon">◇</span><div className="ir-record-copy">
          <strong>{t.title}</strong><small>{uppercase(t.priority)} · UPDATED {stamp(t.updatedAt)}</small></div>
         <select value={t.stage} disabled={busy} aria-label={'Status for '+t.title}
          onChange={e=>void execute({kind:'task-update',id:t.id,stage:e.target.value})}>
          {taskStages.map(stage=><option key={stage} value={stage}>{uppercase(stage)}</option>)}
         </select>
        </article>)}
       </div>
      </div>}
      {pane==='moderation'&&<div className="ir-list-module">
       <div className="ir-pane-heading"><div><span className="ir-kicker">COMMUNITY INTEGRITY / CANONICAL REVIEW</span><h2>Moderator docket</h2></div>
        <button type="button" onClick={()=>void refreshReview()} disabled={busy}>SYNC NOW ↺</button></div>
       <div className="ir-review-tabs">
        {(['reports','threads','replies','activity'] as ReviewLane[]).map(lane=><button key={lane} type="button"
         onClick={()=>setReviewLane(lane)} className={reviewLane===lane?'is-selected':''}>
         {uppercase(lane)} {counts&&lane!=='activity'?counts[lane]:' '}</button>)}
       </div>
       {reviewFault&&<div className="ir-error-block" role="alert"><strong>Canonical review not connected.</strong><p>{reviewFault}</p>
        <a href="/community/review">OPEN ESTABLISHED REVIEW CONSOLE ↗</a></div>}
       {!queue&&!reviewFault&&<p className="ir-hint">Retrieving the authorized review window…</p>}
       <div className="ir-record-list ir-review-items">
        {queue&&reviewLane==='threads'&&(queue.threads.length===0?
          <Empty title="No pending threads" detail="There are no submissions in the current review window."/>:
          queue.threads.map(t=><article className="ir-review-item" key={t.id}>
           <span className="ir-kicker">{uppercase(t.topic)} / {clock(t.createdAt)}</span><h3>{t.title}</h3>
           <p>{t.body}</p><small>AUTHOR / {t.author?.displayName||'MEMBER'} {t.selfAuthored?'· INDEPENDENT REVIEW REQUIRED':''}</small>
           <div><button type="button" disabled={busy||!t.canPublish}
            onClick={()=>setDecision({kind:'thread',id:t.id,action:'publish',label:t.title})}>PUBLISH</button>
            <button type="button" disabled={busy} onClick={()=>setDecision({kind:'thread',id:t.id,action:'reject',label:t.title})}>REJECT</button></div>
          </article>))}
        {queue&&reviewLane==='replies'&&(queue.replies.length===0?
          <Empty title="No pending replies" detail="There are no replies awaiting independent review."/>:
          queue.replies.map(t=><article className="ir-review-item" key={t.id}>
           <span className="ir-kicker">REPLY / {t.threadTitle} / {clock(t.createdAt)}</span>
           <p>{t.body}</p><small>AUTHOR / {t.author?.displayName||'MEMBER'}</small>
           <div><button type="button" disabled={busy||!t.canPublish}
            onClick={()=>setDecision({kind:'reply',id:t.id,action:'publish',label:t.threadTitle})}>PUBLISH</button>
            <button type="button" disabled={busy} onClick={()=>setDecision({kind:'reply',id:t.id,action:'reject',label:t.threadTitle})}>REJECT</button></div>
          </article>))}
        {queue&&reviewLane==='reports'&&(queue.reports.length===0?
          <Empty title="No active reports" detail="No outstanding member reports in the current review window."/>:
          queue.reports.map(t=><article className="ir-review-item" key={t.id}>
           <span className="ir-kicker">{uppercase(t.reason)} / REPORTED {uppercase(t.targetKind)}</span>
           <h3>{t.threadTitle||'Community report'}</h3><p>{t.contentPreview}</p>
           <div><button type="button" disabled={busy||!t.canHide}
            onClick={()=>setDecision({kind:t.targetKind,id:t.targetId,action:'hide',label:t.threadTitle||'Reported content'})}>HIDE CONTENT</button>
            <button type="button" disabled={busy}
             onClick={()=>setDecision({kind:'report',id:t.id,action:'dismiss_report',label:t.threadTitle||'Member report'})}>DISMISS REPORT</button></div>
          </article>))}
        {queue&&reviewLane==='activity'&&(queue.recent.length===0?
          <Empty title="No recorded actions" detail="No moderator decisions in the visible audit window."/>:
          queue.recent.map(x=><article className="ir-compact" key={x.id}>
           <strong>{uppercase(x.action)}</strong><span>{uppercase(x.targetKind)}</span>
           <small>{x.reviewerHandle||'STAFF'} · {stamp(x.createdAt)}</small></article>))}
       </div>
       <p className="ir-hint">The docket shows the first authorized review window. The existing <a href="/community/review">full reviewer console</a> retains pagination and the complete independent-review workflow.</p>
      </div>}
      {pane==='members'&&snapshot.role==='owner'&&<div className="ir-list-module">
       <div className="ir-pane-heading"><div><span className="ir-kicker">OWNER ACCESS / VERIFIED DIRECTORY</span><h2>Members</h2></div><Badge label={members.length+' SHOWN'}/></div>
       <p className="ir-section-intro">Private member records. Cosmetic halos, earned levels and staff permissions are separate systems.</p>
       <label className="ir-inline-form"><span>SEARCH MEMBER</span><input value={memberSearch} maxLength={100} onChange={e=>setMemberSearch(e.target.value)} placeholder="Name or handle"/></label>
       {membersLoading?<p role="status">Loading directory…</p>:null}{memberError?<p role="alert">{memberError}</p>:null}
       <div className="ir-record-list">{members.filter(m=>(m.name+' '+m.handle).toLowerCase().includes(memberSearch.trim().toLowerCase())).map(m=><article className="ir-record" key={m.id}>
        <span className="ir-person-sigil">{m.name.charAt(0).toUpperCase()}</span>
        <div className="ir-record-copy"><strong>{m.name}</strong><small>{m.handle?'@'+m.handle:'PRIVATE HANDLE'} · {m.verified?'VERIFIED':'UNVERIFIED'} · {m.visibility.toUpperCase()}</small></div>
        <Badge label={m.staffRole?uppercase(m.staffRole):'MEMBER'} kind={m.staffRole?'active':'neutral'}/>
       </article>)}</div>
       <p className="ir-hint">Showing the newest 100. Grant or revoke staff access under Personnel; this directory does not issue rewards or XP.</p>
      </div>}
      {pane==='team'&&<div className="ir-list-module">
       <div className="ir-pane-heading"><div><span className="ir-kicker">AUTHENTICATED PERSONNEL / ROLE BOUNDARIES</span><h2>Staff directory</h2></div>
        <Badge label={roster.length+' VERIFIED'}/></div>
       <p className="ir-section-intro">Only accounts explicitly authorized by their immutable user IDs appear here. Staff roles are not purchased, earned by XP, or assigned through invitations.</p>
       {snapshot.role==='owner'&&<form className="ir-inline-form ir-role-form" onSubmit={event=>{
        event.preventDefault();
        if(!candidate||busy)return;
        const person=candidates.find(x=>x.id===candidate);
        if(person&&window.confirm('Grant verified moderator access to '+person.name+'? This includes staff chat, whiteboard and moderation decisions.'))
         void execute({kind:'staff-grant',memberId:candidate},()=>setCandidate(''));
       }}>
        <label><span>VERIFIED ACCOUNT / REVIEWER CANDIDATE</span>
         <select value={candidate} onChange={event=>setCandidate(event.target.value)}>
          <option value="">SELECT A VERIFIED MEMBER</option>
          {candidates.map(p=><option key={p.id} value={p.id}>{p.name}{p.handle?' / @'+p.handle:''}</option>)}
         </select></label>
        <button type="submit" disabled={busy||!candidate}>AUTHORIZE REVIEWER +</button>
       </form>}
       <div className="ir-record-list">
        {roster.length===0?<Empty title="No verified staff found" detail="Configured staff must already have verified ANEVUM accounts."/>:
        roster.map(p=><article key={p.id} className="ir-record">
         <span className="ir-person-sigil">{p.name.slice(0,1).toUpperCase()}</span>
         <div className="ir-record-copy"><strong>{p.name}</strong><small>{p.handle?'@'+p.handle:'PRIVATE PERSONNEL'} · {uppercase(p.role)}</small></div>
         <Badge label={online.includes(p.id)?'BRIDGE ONLINE':'OFFLINE'} kind={online.includes(p.id)?'active':'neutral'}/>
         {snapshot.role==='owner'&&p.role==='reviewer'&&<button className="ir-danger ir-revoke" type="button"
           disabled={busy} onClick={()=>{
            if(window.confirm('Revoke moderator access from '+p.name+'? They will lose staff tools on their next request.'))
             void execute({kind:'staff-revoke',memberId:p.id});
           }}>REVOKE</button>}
        </article>)}
       </div>
       <section className="ir-permissions"><span className="ir-kicker">PRINCIPLE / LEAST PRIVILEGE</span>
        <p>Reviewers can collaborate and perform independently authorized community review. Founder-only actions include editing the manual outreach registry. Nobody can grant themselves a moderator role inside the portal.</p></section>
      </div>}
     </div>
    </main>
    <aside className="ir-side" aria-label="Team communications and activity">
     <StaffBridge myId={memberId} peers={roster} online={online} expanded={pane==='communications'}/>
     <div className="ir-side-activity"><div className="ir-pane-heading"><span className="ir-kicker">EVENTS / STAFF AUDIT</span>
      <strong>{snapshot.history.length} LOGGED</strong></div>
      <div className="ir-history">
       {snapshot.history.length===0?<p className="ir-hint">No staff operation events recorded yet.</p>:
        snapshot.history.slice(0,12).map(a=><div key={a.seq}>
         <span className="ir-event-icon">◇</span><div><strong>{uppercase(a.eventType)}</strong>
          <small>{a.actor} · {stamp(a.createdAt)} {clock(a.createdAt)}</small></div></div>)}
      </div>
     </div>
     <div className="ir-side-foot"><span className="ir-pulse"/> <p>PRIVATE CHANNEL · VERIFIED MEMBERS ONLY</p></div>
    </aside>
   </div>}
  <footer className="ir-footer"><span>ANEVUM / IREN · CONTINUANCE OPERATIONS</span>
   <span>INSTITUTE NETWORK · BUILT FOR EXPANSION</span>
   <span>STAFF / {snapshot?.role.toUpperCase()||'LOCKED'}</span></footer>
  {decision&&<div className="ir-modal" role="presentation"><div role="alertdialog" aria-modal="true" aria-label="Confirm moderation decision" className="ir-modal-card">
   <span className="ir-kicker">DOCUMENTED ACTION / {uppercase(decision.kind)}</span><h2>{uppercase(decision.action)}?</h2>
   <p>{decision.label}</p><p>This action uses the existing server-authorized moderation service and records a reviewer audit entry. It cannot be undone from this screen.</p>
   <div><button type="button" disabled={busy} onClick={()=>setDecision(null)}>CANCEL</button>
    <button type="button" className="ir-danger" disabled={busy} onClick={()=>void confirmDecision()}>{busy?'RECORDING…':'CONFIRM ACTION'}</button></div>
  </div></div>}
 </section>;
}
export function StaffCommandPage(){
 // Staff Command owns the full viewport; only its internal data panes scroll.
 useEffect(()=>{
  const oldBody=document.body.style.overflow,oldHtml=document.documentElement.style.overflow;
  document.body.style.overflow='hidden';document.documentElement.style.overflow='hidden';
  return()=>{document.body.style.overflow=oldBody;document.documentElement.style.overflow=oldHtml};
 },[]);
 const {data:session,isPending}=canonicalAuthClient.useSession();
 if(isPending)return <section className="ir-auth-gate"><h1>IREN / Verifying identity</h1><p>Requesting private staff clearance…</p></section>;
 if(!session?.user?.id||session.user.emailVerified!==true)return <section className="ir-auth-gate">
  <h1>IREN / Staff channel sealed</h1><p>A verified ANEVUM member account is required before staff authorization can be checked.</p>
  <a href="/join">SIGN IN ↗</a></section>;
 return <CommandWorkspace key={session.user.id} memberId={session.user.id}/>;
}
