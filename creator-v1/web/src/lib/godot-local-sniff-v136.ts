/** V136/Creator V006 local-only Godot ZIP name probe.
 * This is NOT a ZIP validator. It reads bounded central-directory names to
 * identify an export we will REFUSE, without modifying the independently
 * frozen V003 server validator or decoding untrusted engine files.
 *
 * Unknown or malformed metadata returns null. The caller must then use the
 * untouched strict inspectZip() path, which rejects unsupported/invalid files.
 */
import {ZIP_LIMITS,safeAssetPath} from '../../../../site/alpha/v003/archive.mjs';
export type GodotAdvisoryEntry=Readonly<{path:string;unpacked:number}>;

export function sniffGodotZipEntries(bytes:Uint8Array):GodotAdvisoryEntry[]|null{
 if(!(bytes instanceof Uint8Array)||bytes.length<22||bytes.length>ZIP_LIMITS.archive)return null;
 const v=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
 const u16=(at:number)=>v.getUint16(at,true);
 const u32=(at:number)=>v.getUint32(at,true);
 let end=-1;
 for(let at=bytes.length-22;at>=Math.max(0,bytes.length-65557);at--){
  if(u32(at)===0x06054b50&&at+22+u16(at+20)===bytes.length){end=at;break;}
 }
 if(end<0||u16(end+4)!==0||u16(end+6)!==0)return null;
 const count=u16(end+10),start=u32(end+16),size=u32(end+12);
 if(!count||count>ZIP_LIMITS.files||u16(end+8)!==count||
   start===0xffffffff||size===0xffffffff||start+size!==end)return null;
 const utf8=new TextDecoder('utf-8',{fatal:true});
 const found:GodotAdvisoryEntry[]=[];
 const seen=new Set<string>();
 let cursor=start;
 for(let i=0;i<count;i++){
  if(cursor+46>end||u32(cursor)!==0x02014b50)return null;
  const flags=u16(cursor+8),len=u16(cursor+28),
   extra=u16(cursor+30),comment=u16(cursor+32);
  const next=cursor+46+len+extra+comment;
  if(!len||next>end||(flags&0x2041))return null;
  let name:string;
  try{name=utf8.decode(bytes.subarray(cursor+46,cursor+46+len));}
  catch{return null;}
  const directory=name.endsWith('/');
  const path=directory?name.slice(0,-1):name;
  if(!safeAssetPath(path))return null;
  const folded=path.toLocaleLowerCase('en-US');
  if(seen.has(folded))return null;
  seen.add(folded);
  if(!directory)found.push({path,unpacked:u32(cursor+24)});
  cursor=next;
 }
 if(cursor!==end)return null;
 return found.some(entry=>entry.path==='project.godot'||entry.path.toLowerCase().endsWith('.pck'))?found:null;
}
