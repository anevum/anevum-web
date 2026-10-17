// ANEVUM / IREN — private staff peer bridge pilot.
// A small-team, direct WebRTC call, not a hosted conferencing service.
// Camera and microphone activate only after a deliberate local click.
import {useEffect,useRef,useState} from 'react';
import './staff-command.css';

export type StaffPeer={id:string;name:string;handle:string;role:'owner'|'reviewer'};
type Signal={seq:number;senderId:string;signalType:'offer'|'answer'|'candidate'|'leave';data:unknown};
type SignalEnvelope={signals:Signal[]};

async function bridgeRequest(method:'GET'|'POST',body?:unknown,search=''){
 const response=await fetch('/api/v1/member/staff-ops'+(search?'?'+search:''),{
  method,credentials:'same-origin',mode:'same-origin',redirect:'error',
  cache:'no-store',referrerPolicy:'same-origin',
  headers:body===undefined?{Accept:'application/json'}:{Accept:'application/json','Content-Type':'application/json'},
  body:body===undefined?undefined:JSON.stringify(body)
 });
 const result=await response.json().catch(()=>({error:'Bridge unavailable'}));
 if(!response.ok)throw new Error(result.error||'Bridge request rejected');
 return result;
}
const isSession=(s:unknown):s is RTCSessionDescriptionInit=>
 Boolean(s&&typeof s==='object'&&'sdp' in s&&typeof (s as {sdp?:unknown}).sdp==='string'&&
 'type' in s&&['offer','answer'].includes(String((s as {type?:unknown}).type)));

export function StaffBridge({myId,peers,online,expanded}:{myId:string;peers:StaffPeer[];online:string[];expanded:boolean}){
 const [joined,setJoined]=useState(false);
 const [withVideo,setWithVideo]=useState(false);
 const [selected,setSelected]=useState('');
 const [incoming,setIncoming]=useState<{senderId:string;offer:RTCSessionDescriptionInit}|null>(null);
 const [peerId,setPeerId]=useState<string|null>(null);
 const [status,setStatus]=useState('PRIVATE BRIDGE / STANDBY');
 const [working,setWorking]=useState(false);
 const cursorRef=useRef(0);
 const streamRef=useRef<MediaStream|null>(null);
 const pcRef=useRef<RTCPeerConnection|null>(null);
 const remoteRef=useRef<MediaStream|null>(null);
 const targetRef=useRef<string|null>(null);
 const joinedRef=useRef(false);
 const pendingIce=useRef<RTCIceCandidateInit[]>([]);
 const localVideoRef=useRef<HTMLVideoElement|null>(null);
 const remoteVideoRef=useRef<HTMLVideoElement|null>(null);
 const handleSignalRef=useRef<(signal:Signal)=>Promise<void>>(async()=>{});

 const sendSignal=async(recipientId:string,type:Signal['signalType'],data:unknown)=>{
  await bridgeRequest('POST',{kind:'signal',recipientId,signalType:type,data});
 };
 const connectVideoElements=()=>{
  if(localVideoRef.current&&streamRef.current){
   localVideoRef.current.srcObject=streamRef.current;
   void localVideoRef.current.play().catch(()=>{});
  }
  if(remoteVideoRef.current&&remoteRef.current){
   remoteVideoRef.current.srcObject=remoteRef.current;
   void remoteVideoRef.current.play().catch(()=>{});
  }
 };
 const createPeer=(recipientId:string)=>{
  if(pcRef.current)pcRef.current.close();
  const pc=new RTCPeerConnection({iceServers:[{urls:'stun:stun.l.google.com:19302'}]});
  pcRef.current=pc;
  targetRef.current=recipientId;
  setPeerId(recipientId);
  pendingIce.current=[];
  const remote=new MediaStream();
  remoteRef.current=remote;
  streamRef.current?.getTracks().forEach(track=>pc.addTrack(track,streamRef.current!));
  pc.ontrack=e=>{
   remote.addTrack(e.track);
   connectVideoElements();
   setStatus('PEER MEDIA RECEIVED');
  };
  pc.onicecandidate=e=>{
   if(e.candidate)void sendSignal(recipientId,'candidate',e.candidate.toJSON()).catch(()=>setStatus('CALL SIGNAL INTERRUPTED'));
  };
  pc.onconnectionstatechange=()=>{
   if(pc.connectionState==='connected')setStatus('DIRECT PEER LINK / ESTABLISHED');
   if(pc.connectionState==='failed'||pc.connectionState==='disconnected')setStatus('LINK LOST / RECONNECT OR HANG UP');
  };
  connectVideoElements();
  return pc;
 };
 const flushIce=async()=>{
  const pc=pcRef.current;
  if(!pc||!pc.remoteDescription)return;
  const pending=[...pendingIce.current];pendingIce.current=[];
  for(const c of pending)try{await pc.addIceCandidate(c)}catch{/* stale ICE candidate */}
 };
 const acceptOffer=async(senderId:string,offer:RTCSessionDescriptionInit)=>{
  if(!streamRef.current)return;
  const pc=createPeer(senderId);
  await pc.setRemoteDescription(offer);
  await flushIce();
  const answer=await pc.createAnswer();
  await pc.setLocalDescription(answer);
  await sendSignal(senderId,'answer',{type:'answer',sdp:pc.localDescription?.sdp});
  setIncoming(null);
  setStatus('ANSWER SENT / CONNECTING');
 };
 const startMedia=async(video:boolean)=>{
  if(joinedRef.current)return;
  if(!navigator.mediaDevices?.getUserMedia||!window.RTCPeerConnection){
   setStatus('WEBRTC UNAVAILABLE IN THIS BROWSER');return;
  }
  setWorking(true);
  try{
   const stream=await navigator.mediaDevices.getUserMedia({audio:true,video});
   streamRef.current=stream;
   joinedRef.current=true;
   setJoined(true);setWithVideo(video);
   await bridgeRequest('POST',{kind:'presence',room:'bridge'});
   setStatus('BRIDGE ONLINE / SELECT A PEER');
   connectVideoElements();
   if(incoming)await acceptOffer(incoming.senderId,incoming.offer);
  }catch(e){
   streamRef.current?.getTracks().forEach(track=>track.stop());
   streamRef.current=null;
   joinedRef.current=false;
   setJoined(false);
   setStatus(e instanceof Error?e.message.toUpperCase().slice(0,80):'MICROPHONE ACCESS FAILED');
  }finally{setWorking(false)}
 };
 const callPeer=async()=>{
  if(!joinedRef.current||!selected||selected===myId||working)return;
  setWorking(true);
  try{
   const pc=createPeer(selected);
   const offer=await pc.createOffer();
   await pc.setLocalDescription(offer);
   await sendSignal(selected,'offer',{type:'offer',sdp:pc.localDescription?.sdp});
   setStatus('CALLING / AWAITING PEER ACCEPTANCE');
  }catch(e){setStatus(e instanceof Error?e.message.toUpperCase().slice(0,80):'CALL FAILED')}
  finally{setWorking(false)}
 };
 const endCall=async()=>{
  const target=targetRef.current;
  targetRef.current=null;
  if(target)void sendSignal(target,'leave',{}).catch(()=>{});
  pcRef.current?.close();pcRef.current=null;
  streamRef.current?.getTracks().forEach(t=>t.stop());
  streamRef.current=null;remoteRef.current=null;
  if(localVideoRef.current)localVideoRef.current.srcObject=null;
  if(remoteVideoRef.current)remoteVideoRef.current.srcObject=null;
  joinedRef.current=false;setJoined(false);setWithVideo(false);
  setIncoming(null);setPeerId(null);setStatus('PRIVATE BRIDGE / STANDBY');
  void bridgeRequest('POST',{kind:'presence',room:'off'}).catch(()=>{});
 };
 handleSignalRef.current=async signal=>{
  if(signal.senderId===myId||!peers.some(p=>p.id===signal.senderId))return;
  if(signal.signalType==='offer'&&isSession(signal.data)&&signal.data.type==='offer'){
   if(joinedRef.current){
    try{await acceptOffer(signal.senderId,signal.data)}
    catch{setStatus('INCOMING LINK COULD NOT BE ESTABLISHED')}
   }else{
    setIncoming({senderId:signal.senderId,offer:signal.data});
    setStatus('INCOMING CALL / JOIN TO ANSWER');
   }
  }
  if(signal.signalType==='answer'&&isSession(signal.data)&&signal.data.type==='answer'&&
     targetRef.current===signal.senderId&&pcRef.current){
   try{await pcRef.current.setRemoteDescription(signal.data);await flushIce()}
   catch{setStatus('REMOTE ANSWER REJECTED')}
  }
  if(signal.signalType==='candidate'&&signal.data&&typeof signal.data==='object'&&
     targetRef.current===signal.senderId){
   const candidate=signal.data as RTCIceCandidateInit;
   if(!pcRef.current?.remoteDescription)pendingIce.current.push(candidate);
   else try{await pcRef.current.addIceCandidate(candidate)}catch{/* older ICE */}
  }
  if(signal.signalType==='leave'&&targetRef.current===signal.senderId){
   pcRef.current?.close();pcRef.current=null;targetRef.current=null;
   remoteRef.current=null;setPeerId(null);setStatus('PEER LEFT / STILL IN BRIDGE');
   if(remoteVideoRef.current)remoteVideoRef.current.srcObject=null;
  }
 };
 useEffect(()=>{
  let stopped=false,inFlight=false;
  async function poll(){
   if(inFlight||stopped)return;inFlight=true;
   try{
    const result=await bridgeRequest('GET',undefined,'lane=signals&after='+cursorRef.current) as SignalEnvelope;
    for(const signal of result.signals||[]){
     if(stopped)break;
     if(!Number.isSafeInteger(signal.seq)||signal.seq<=cursorRef.current)continue;
     cursorRef.current=signal.seq;
     await handleSignalRef.current(signal);
    }
   }catch{/* Staff snapshot independently reports authorization/service errors. */}
   finally{inFlight=false}
  }
  void poll();const timer=window.setInterval(()=>void poll(),2600);
  const presence=window.setInterval(()=>{
   if(joinedRef.current)void bridgeRequest('POST',{kind:'presence',room:'bridge'}).catch(()=>{});
  },19000);
  return()=>{stopped=true;window.clearInterval(timer);window.clearInterval(presence)};
 },[myId]);
 useEffect(()=>{
  connectVideoElements();
 },[expanded,joined,peerId]);
 useEffect(()=>()=>{pcRef.current?.close();streamRef.current?.getTracks().forEach(t=>t.stop())},[]);
 const otherPeers=peers.filter(p=>p.id!==myId);
 const nameOf=(id:string)=>otherPeers.find(p=>p.id===id)?.name||'VERIFIED STAFF';
 return <section className={'ir-bridge '+(!expanded?'ir-bridge--compact':'')} aria-label="Voice and video bridge">
  <div className="ir-pane-heading"><span className="ir-kicker">SECURE STAFF / PEER BRIDGE</span>
   <strong>{joined?'● MEDIA ACTIVE':'○ MEDIA OFF'}</strong></div>
  <p className="ir-bridge-status" role="status">{status}</p>
  {incoming&&!joined&&<div className="ir-incoming" role="alert">
   Incoming invitation from {nameOf(incoming.senderId)}. Join the bridge to answer.
  </div>}
  <div className="ir-videos" hidden={!joined||!expanded}>
   <div><video ref={localVideoRef} muted playsInline autoPlay aria-label="Your camera"/>
    <small>LOCAL / {withVideo?'CAMERA':'AUDIO ONLY'}</small></div>
   <div><video ref={remoteVideoRef} playsInline autoPlay aria-label="Remote staff camera"/>
    <small>REMOTE / {peerId?nameOf(peerId):'NOT CONNECTED'}</small></div>
  </div>
  {expanded&&<p className="ir-hint">Peer-to-peer pilot for two staff members. Audio/video requires permission and a compatible network; no recording. Group conferencing requires a later SFU/TURN service.</p>}
  <div className="ir-bridge-controls">
   {!joined?<><button type="button" disabled={working} onClick={()=>void startMedia(false)}>JOIN VOICE</button>
    <button type="button" disabled={working} onClick={()=>void startMedia(true)}>JOIN VIDEO</button></>:
    <><select aria-label="Select staff member to call" value={selected}
       onChange={e=>setSelected(e.target.value)}>
       <option value="">SELECT PEER</option>
       {otherPeers.map(p=><option value={p.id} key={p.id}>{p.name}{online.includes(p.id)?' · ONLINE':''}</option>)}
      </select>
     <button type="button" disabled={working||!selected} onClick={()=>void callPeer()}>CALL</button>
     <button type="button" className="ir-danger" onClick={()=>void endCall()}>HANG UP</button></>}
  </div>
 </section>;
}
