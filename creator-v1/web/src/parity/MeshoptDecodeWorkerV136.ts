import {MeshoptDecoder} from 'meshoptimizer/meshopt_decoder_reference.js';
/** Same-origin external worker. No eval, WASM, blob-worker or remote source.
 * It receives only bounded static Institute model buffers, never user files. */
const scope=self as unknown as {onmessage:(event:MessageEvent)=>void;postMessage:(value:unknown,transfer?:Transferable[])=>void};
scope.onmessage=(event:MessageEvent<{id:number;count:number;size:number;source:Uint8Array;mode:string;filter?:string}>)=>{
 const {id,count,size,source,mode,filter}=event.data;
 try{
  if(!Number.isSafeInteger(count)||!Number.isSafeInteger(size)||count<0||size<1||count*size>1048576||source.byteLength>1048576)throw Error('Static geometry decode budget exceeded');
  const target=new Uint8Array(count*size);MeshoptDecoder.decodeGltfBuffer(target,count,size,source,mode,filter);
  scope.postMessage({id,target},[target.buffer]);
 }catch{scope.postMessage({id,error:'Static geometry decode failed'})}
};
