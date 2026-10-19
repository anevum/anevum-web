import {createContext,useContext,useEffect,useRef,useState,type ReactNode} from 'react';
import {Link} from 'react-router-dom';
import {canonicalAuthClient} from '../lib/canonical-beta';
import {progressionRequest,type MemberProgression,type RewardInbox,type RewardNotice} from '../lib/progression-api';
import {bindAlertAccount,notify,type AnevumAlert} from '../lib/ui-events';
import {OrbitalMark} from './OrbitalMark';
import {LevelEmblem,AwardEmblem} from './LevelEmblem';
import '../progression.css';
type ProgressionContext={progression:MemberProgression|null;testEnabled:boolean;refresh:()=>Promise<void>;openInbox:()=>void;unreadCount:number};
const Context=createContext<ProgressionContext>({progression:null,testEnabled:false,refresh:async()=>{},openInbox:()=>{},unreadCount:0});
export const useMemberProgression=()=>useContext(Context);
export const useNotificationsControls=()=>{
 const {openInbox,unreadCount}=useContext(Context);
 return {openInbox,unreadCount};
};
export function AnevumNotifications({children}:{children:ReactNode}){
 const {data:session}=canonicalAuthClient.useSession();
 return <NotificationSession key={session?.user?.id||'guest'} id={session?.user?.id}>{children}</NotificationSession>;
}
function NotificationSession({id,children}:{id?:string;children:ReactNode}){
 const [progression,setProgression]=useState<MemberProgression|null>(null),[testEnabled,setTestEnabled]=useState(false),[queue,setQueue]=useState<AnevumAlert[]>([]),[recent,setRecent]=useState<RewardNotice[]>([]),[open,setOpen]=useState(false),[phase,setPhase]=useState('mark'),[visible,setVisible]=useState(document.visibilityState==='visible');
 const alive=useRef(true),seen=useRef(new Set<number>()),loading=useRef(false),dirty=useRef(false),abort=useRef<AbortController|null>(null);
 const dialogRef=useRef<HTMLDialogElement>(null);
 const active=queue[0];
 function enqueue(alert:AnevumAlert){setQueue(old=>{
  // Keep recognition in order, and combine rapid XP receipts instead of a backlog.
  if(alert.kind==='xp'){const at=old.findIndex((x,i)=>i>0&&x.kind==='xp');if(at>=0)return old.map((x,i)=>i===at?{...x,xp:(x.xp||0)+(alert.xp||0),title:'+'+((x.xp||0)+(alert.xp||0))+' XP received'}:x)}
  if(old.length>=20&&!alert.serverId)return old;
  if(alert.serverId){const at=old.findIndex((x,i)=>i>0&&!x.serverId);if(at>=0)return [...old.slice(0,at),alert,...old.slice(at)]}
  if(alert.kind==='success'){const at=old.findIndex((x,i)=>i>0&&x.kind==='success');if(at>=0)return old.map((x,i)=>i===at?alert:x)}
  return [...old,alert];
 })}
 async function refresh(){
  if(!id)return;if(loading.current){dirty.current=true;return}loading.current=true;
  const controller=new AbortController();abort.current=controller;
  try{
   const [p,inbox]=await Promise.all([progressionRequest<{progression:MemberProgression;testButtonEnabled:boolean}>('progression',undefined,controller.signal),progressionRequest<RewardInbox>('notifications',undefined,controller.signal)]);
   if(!alive.current)return;setProgression(p.progression);setTestEnabled(p.testButtonEnabled);setRecent(inbox.recent);
   for(const item of inbox.items)if(!seen.current.has(item.id)){seen.current.add(item.id);enqueue({...item,key:'server-'+item.id,serverId:item.id})}
  }catch{/* A transient read failure must not invent or erase earned progress. */}finally{loading.current=false;if(dirty.current&&alive.current){dirty.current=false;void refresh()}}
 }
 useEffect(()=>{alive.current=true;bindAlertAccount(id);void refresh();
  const onChange=(event:Event)=>{if((event as CustomEvent).detail?.owner===id)void refresh()};
  const onAlert=(event:Event)=>{const data=(event as CustomEvent).detail;if(data?.owner===id)enqueue(data.alert)};
  const onVisible=()=>{const shown=document.visibilityState==='visible';setVisible(shown);if(shown)void refresh()};
  window.addEventListener('anevum:alert',onAlert);window.addEventListener('anevum:member-change',onChange);window.addEventListener('focus',onVisible);document.addEventListener('visibilitychange',onVisible);
  const interval=window.setInterval(onVisible,15000);
  return()=>{alive.current=false;abort.current?.abort();bindAlertAccount(undefined);clearInterval(interval);window.removeEventListener('anevum:alert',onAlert);window.removeEventListener('anevum:member-change',onChange);window.removeEventListener('focus',onVisible);document.removeEventListener('visibilitychange',onVisible)};
 },[id]);
 // A modal is opened only on demand from the Wayfinder. The updates inbox
 // must never compete with IREN for the same fixed mobile corner.
 useEffect(()=>{
  const dialog=dialogRef.current;
  if(!dialog)return;
  if(open&&!dialog.open)dialog.showModal();
  else if(!open&&dialog.open)dialog.close();
 },[open,id]);
 async function finish(item:AnevumAlert){
  setQueue(old=>old.filter(x=>x.key!==item.key));
  if(item.serverId)try{await progressionRequest('notifications/ack',{id:item.serverId});void refresh()}catch{/* Remains unread on the server and will be offered next visit. */}
 }
 useEffect(()=>{if(!active||!visible)return;setPhase('mark');const timers=[setTimeout(()=>setPhase('open'),450),setTimeout(()=>setPhase('close'),5200),setTimeout(()=>void finish(active),5850)];return()=>timers.forEach(clearTimeout)},[active?.key,visible]);
 return <Context.Provider value={{progression,testEnabled,refresh,openInbox:()=>setOpen(true),unreadCount:queue.filter(item=>Boolean(item.serverId)).length}}>{children}
  {id&&<dialog
   ref={dialogRef}
   id="an-notifications-dialog"
   className="an-updates-dialog"
   aria-labelledby="an-reward-history-title"
   onClose={()=>setOpen(false)}
   onCancel={()=>setOpen(false)}
   onClick={event=>{if(event.target===event.currentTarget)setOpen(false);}}>
   <section className="an-history" aria-label="Recent recognition">
    <header><h2 id="an-reward-history-title">Your signals.</h2><button type="button" onClick={()=>setOpen(false)} aria-label="Close updates">×</button></header>
    {recent.length?recent.map(item=><article key={item.id}>
     {item.kind==='level'?<LevelEmblem level={item.level!} size={44}/>:<AwardEmblem award={item.award}/>}
     <div><strong>{item.title}</strong><p>{item.detail}</p></div>
    </article>):<p>Your earned badges and level-ups will be kept here.</p>}
    <Link to="/member?tab=awards" onClick={()=>setOpen(false)}>OPEN AWARDS & STATS ↗</Link>
   </section>
  </dialog>}
  <div className="an-live" role="status" aria-live="polite" aria-atomic="true">{active?(active.preview?'Preview. ':'')+active.title+(active.detail?'. '+active.detail:''):''}</div>
  {active&&<aside key={active.key} className={'an-toast an-toast-'+phase+' an-toast-'+active.kind} data-notification-kind={active.kind} aria-label="ANEVUM notification"><div className="an-toast-mark" aria-hidden="true"><OrbitalMark/></div><div className="an-toast-body"><div className="an-toast-symbol" aria-hidden="true">{active.kind==='level'?<LevelEmblem level={active.level!} size={56}/>:active.kind==='award'?<AwardEmblem award={active.award}/>:<span>{active.kind==='error'?'!':active.kind==='xp'?'+':'✦'}</span>}</div><div className="an-toast-copy"><small>{active.preview?'ANIMATION PREVIEW':active.kind==='level'?'CONTINUANCE / LEVEL UP':active.kind==='award'?'BADGE / RECOGNITION':'ANEVUM / SIGNAL'}</small><strong>{active.title}</strong>{active.detail&&<p>{active.detail}</p>}</div><button onClick={()=>void finish(active)} aria-label="Dismiss notification">×</button></div></aside>}
 </Context.Provider>;
}
/** Interface motion preview only — never simulate an unearned level, badge
 * model, name, or award. Real unlock effects require a verified server notice. */
export function previewNotification(kind:'level'|'award'|'info'){
 const title=kind==='level'?'Progress notification':
  kind==='award'?'Earned recognition notification':'Transmission received';
 notify({kind:'info',title,detail:'Visual notification sample. No award, XP or specimen revealed.',preview:true});
}
