// Read a bounded UTF-8 body before parsing. Content-Length is untrusted and
// may be absent for streamed requests; never buffer the complete input first.
export async function boundedText(request,maxBytes){
  const size=Number(request.headers.get("content-length")||0);
  if(!Number.isSafeInteger(size)||size<0||size>maxBytes)return null;
  const reader=request.body?.getReader();
  if(!reader)return null;
  const chunks=[];let total=0;
  try{
    for(;;){
      const {done,value}=await reader.read();
      if(done)break;
      total+=value.byteLength;
      if(total>maxBytes){await reader.cancel();return null;}
      chunks.push(value);
    }
    const bytes=new Uint8Array(total);let offset=0;
    for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
    return new TextDecoder("utf-8",{fatal:true}).decode(bytes);
  }catch{return null;}
  finally{reader.releaseLock();}
}
