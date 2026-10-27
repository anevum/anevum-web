import {createContext,useContext,useEffect,useRef,useState,type ReactNode} from 'react';
import {canonicalAuthClient} from '../lib/canonical-beta';
import {progressionRequest,type MemberProgression,type RewardInbox,type RewardNotice} from '../lib/progression-api';
import {bindAlertAccount,notify,type AnevumAlert} from '../lib/ui-events';
import {scheduleTransmission} from '../lib/notification-delivery';
import '../progression.css';
type ProgressionContext={
 progression:MemberProgression|null;
 refresh:()=>Promise<void>;
 recent:RewardNotice[];
 unreadCount:number;
 markSignalsSeen:()=>void;
 // A single server-authoritative queue feeds IREN's visual presentation.
 activeTransmission:AnevumAlert|null;
 transmissionPhase:string;
 dismissTransmission:(item:AnevumAlert)=>void;
};
const Context=createContext<ProgressionContext>({progression:null,refresh:async()=>{},recent:[],unreadCount:0,markSignalsSeen:()=>{},activeTransmission:null,transmissionPhase:'mark',dismissTransmission:()=>{}});
export const useMemberProgression=()=>useContext(Context);
/** Read-only recognition history, shared with the single IREN companion. */
export const useIrenSignals=()=>{
 const {recent,unreadCount,markSignalsSeen,activeTransmission,transmissionPhase,dismissTransmission}=useContext(Context);
 return {recent,unreadCount,markSignalsSeen,activeTransmission,transmissionPhase,dismissTransmission};
};
const signalSeenKey=(id:string)=>"anevum.iren.signals.seen."+id;
/** Preserve queued signals while immersive playback or the tour masks IREN. */
function presentationAvailable(){
 return document.visibilityState==="visible"&&!document.fullscreenElement&&
  !document.body.classList.contains("av095-expanded")&&
  !document.body.classList.contains("ir80-tour-active");
}
function lastSeenSignal(id?:string){
 if(!id)return 0;
 try{return Number(window.localStorage.getItem(signalSeenKey(id))||0)||0}
 catch{return 0}
}
export function AnevumNotifications({children}:{children:ReactNode}){
 const {data:session}=canonicalAuthClient.useSession();
 return <NotificationSession key={session?.user?.id||'guest'} id={session?.user?.id}>{children}</NotificationSession>;
}
function NotificationSession({id,children}:{id?:string;children:ReactNode}){
 const [progression,setProgression]=useState<MemberProgression|null>(null),[queue,setQueue]=useState<AnevumAlert[]>([]),[recent,setRecent]=useState<RewardNotice[]>([]),[unreadCount,setUnreadCount]=useState(0),[phase,setPhase]=useState('mark'),[visible,setVisible]=useState(presentationAvailable);
 const alive=useRef(true),seen=useRef(new Set<number>()),loading=useRef(false),dirty=useRef(false),abort=useRef<AbortController|null>(null);
 const lastSeenRef=useRef(lastSeenSignal(id));
 const active=queue[0];
 function markSignalsSeen(){
  if(!id)return;
  const latest=recent.reduce((max,item)=>Math.max(max,item.id),0);
  if(latest<=lastSeenRef.current)return;
  lastSeenRef.current=latest;
  setUnreadCount(0);
  try{window.localStorage.setItem(signalSeenKey(id),String(latest))}catch{/* Private storage is optional. */}
 }
 function enqueue(alert:AnevumAlert){setQueue(old=>scheduleTransmission(old,alert))}
 async function refresh(){
  if(!id)return;if(loading.current){dirty.current=true;return}loading.current=true;
  const controller=new AbortController();abort.current=controller;
  try{
   const [p,inbox]=await Promise.all([progressionRequest<{progression:MemberProgression}>('progression',undefined,controller.signal),progressionRequest<RewardInbox>('notifications',undefined,controller.signal)]);
   if(!alive.current)return;setProgression(p.progression);setRecent(inbox.recent);setUnreadCount(inbox.recent.filter(item=>item.id>lastSeenRef.current).length);
   for(const item of inbox.items)if(!seen.current.has(item.id)){seen.current.add(item.id);enqueue({...item,key:'server-'+item.id,serverId:item.id})}
  }catch{/* A transient read failure must not invent or erase earned progress. */}finally{loading.current=false;if(dirty.current&&alive.current){dirty.current=false;void refresh()}}
 }
 useEffect(()=>{alive.current=true;bindAlertAccount(id);void refresh();
  const onChange=(event:Event)=>{if((event as CustomEvent).detail?.owner===id)void refresh()};
  const onAlert=(event:Event)=>{const data=(event as CustomEvent).detail;if(data?.owner===id)enqueue(data.alert)};
  const onVisible=()=>{const shown=presentationAvailable();setVisible(shown);if(shown)void refresh()};
  window.addEventListener('anevum:alert',onAlert);window.addEventListener('anevum:member-change',onChange);
  window.addEventListener('focus',onVisible);
  document.addEventListener('visibilitychange',onVisible);
  document.addEventListener('fullscreenchange',onVisible);
  // iPhone immersive fallback uses the existing body's av095-expanded class;
  // no iframe reload, fake notification ACK or new player overlay is needed.
  const immersive=new MutationObserver(onVisible);
  immersive.observe(document.body,{attributes:true,attributeFilter:['class']});
  const interval=window.setInterval(onVisible,15000);
  return()=>{alive.current=false;abort.current?.abort();bindAlertAccount(undefined);
   immersive.disconnect();clearInterval(interval);
   window.removeEventListener('anevum:alert',onAlert);window.removeEventListener('anevum:member-change',onChange);
   window.removeEventListener('focus',onVisible);
   document.removeEventListener('visibilitychange',onVisible);
   document.removeEventListener('fullscreenchange',onVisible)};

 },[id]);
 async function finish(item:AnevumAlert){
  setQueue(old=>old.filter(x=>x.key!==item.key));
  if(item.serverId)try{await progressionRequest('notifications/ack',{id:item.serverId});void refresh()}catch{/* Remains unread on the server and will be offered next visit. */}
 }
 useEffect(()=>{if(!active||!visible)return;setPhase('mark');const timers=[setTimeout(()=>setPhase('open'),450),setTimeout(()=>setPhase('close'),5200),setTimeout(()=>void finish(active),5850)];return()=>timers.forEach(clearTimeout)},[active?.key,visible]);
 return <Context.Provider value={{progression,refresh,recent,unreadCount,markSignalsSeen,activeTransmission:active||null,transmissionPhase:phase,dismissTransmission:(item)=>{void finish(item)}}}>{children}
  <div className="an-live" role="status" aria-live="polite" aria-atomic="true">{active?(active.preview?'Preview. ':'')+active.title+(active.detail?'. '+active.detail:''):''}</div>

 </Context.Provider>;
}
/** Interface motion preview only — never simulate an unearned level, badge
 * model, name, or award. Real unlock effects require a verified server notice. */
export function previewNotification(kind:'level'|'award'|'info'){
 const title=kind==='level'?'Progress notification':
  kind==='award'?'Earned recognition notification':'Transmission received';
 notify({kind:'info',title,detail:'Visual notification sample. No award, XP or specimen revealed.',preview:true});
}
