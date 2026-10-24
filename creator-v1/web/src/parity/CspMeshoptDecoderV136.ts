import {MeshoptDecoder as reference} from 'meshoptimizer/meshopt_decoder_reference.js';
import DecodeWorker from './MeshoptDecodeWorkerV136?worker';
/** Upstream Meshopt reference decoder is deliberately used for our small,
 * bounded static meshes in an external worker: the production script-src
 * policy disallows WebAssembly. No protection is weakened for graphics. */
export function cspMeshoptDecoder(){
 let worker:Worker|null=null,sequence=0,disposed=false;
 const pending=new Map<number,{resolve:(v:Uint8Array)=>void;reject:(e:Error)=>void;timer:ReturnType<typeof setTimeout>}>();
 const fail=()=>{worker?.terminate();worker=null;for(const p of pending.values()){clearTimeout(p.timer);p.reject(Error('Static geometry worker unavailable'))}pending.clear()};
 try{
  worker=new DecodeWorker();worker.onmessage=(event:MessageEvent<{id:number;target?:Uint8Array;error?:string}>)=>{
   const p=pending.get(event.data.id);if(!p)return;pending.delete(event.data.id);clearTimeout(p.timer);
   event.data.target?p.resolve(event.data.target):p.reject(Error(event.data.error||'Static geometry unavailable'));
  };worker.onerror=fail;
 }catch{/* The bounded reference decoder remains available without workers. */}
 const decoder={...reference,useWorkers(count:number){if(count>1)throw Error('One static geometry worker is the resource limit')},
  async decodeGltfBufferAsync(count:number,size:number,source:Uint8Array,mode:string,filter?:string){
   if(disposed||count*size>1048576||source.byteLength>1048576)throw Error('Static geometry unavailable');
   if(!worker){const target=new Uint8Array(count*size);reference.decodeGltfBuffer(target,count,size,source,mode,filter);return target}
   const id=++sequence,copy=source.slice();
   return new Promise<Uint8Array>((resolve,reject)=>{
    const timer=setTimeout(()=>{pending.delete(id);reject(Error('Static geometry decode deadline exceeded'))},15000);
    pending.set(id,{resolve,reject,timer});worker!.postMessage({id,count,size,source:copy,mode,filter},[copy.buffer]);
   });
  }};
 return {decoder,dispose(){disposed=true;fail()}};
}
