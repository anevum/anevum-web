const MiB=1048576;
export const RULES=Object.freeze({png:["image/png",10*MiB],jpg:["image/jpeg",10*MiB],jpeg:["image/jpeg",10*MiB],webp:["image/webp",10*MiB],gif:["image/gif",10*MiB],mp3:["audio/mpeg",20*MiB],wav:["audio/wav",20*MiB],pdf:["application/pdf",10*MiB],txt:["text/plain",MiB],md:["text/markdown",MiB],zip:["application/zip",20*MiB]});
export function declaration(x){
 const name=typeof x?.name==="string"?x.name.trim():"";
 if(!name||name.length>160||/[\\/\x00-\x1f\x7f]/.test(name)||name.startsWith(".")||name.includes(".."))throw Error("Invalid filename");
 const extension=name.split(".").at(-1)?.toLowerCase(),rule=RULES[extension];
 if(!rule)throw Error("Unsupported format");
 if(!Number.isSafeInteger(x.sizeBytes)||x.sizeBytes<1||x.sizeBytes>rule[1])throw Error("Invalid or oversized file");
 if(x.contentType!==rule[0])throw Error("File type mismatch");
 return {name,extension,mime:rule[0],size:x.sizeBytes,kind:["png","jpg","jpeg","webp","gif"].includes(extension)?"image": ["mp3","wav"].includes(extension)?"audio":extension==="zip"?"package":"document"};
}
const prefix=(x,s,o=0)=>x.length>=s.length+o&&[...s].every((a,i)=>x[i+o]===a.charCodeAt(0));
export function signature(x,r){
 switch(r.extension){
 case "png":return x[0]===137&&prefix(x,"PNG",1);
 case "jpg":case "jpeg":return x[0]===255&&x[1]===216&&x[2]===255;
 case "webp":return prefix(x,"RIFF")&&prefix(x,"WEBP",8);
 case "gif":return prefix(x,"GIF87a")||prefix(x,"GIF89a");
 case "mp3":return prefix(x,"ID3")||(x[0]===255&&(x[1]&224)===224);
 case "wav":return prefix(x,"RIFF")&&prefix(x,"WAVE",8);
 case "pdf":return prefix(x,"%PDF-");
 case "zip":return prefix(x,"PK",0)&&x[2]===3&&x[3]===4;
 case "txt":case "md":try{const t=new TextDecoder("utf-8",{fatal:true}).decode(x);return !/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(t)}catch{return false}
 default:return false;
 }
}