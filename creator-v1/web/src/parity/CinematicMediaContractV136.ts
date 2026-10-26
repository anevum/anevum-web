/** V136.014. Authored media only. No member data, code execution, remote URLs or private APIs. */
export type CinematicAsset={path:string;bytes:number;sha256:string;width?:number;height?:number};
export type CinematicFrameSet={width:number;height:number;bytes:number;frames:CinematicAsset[]};
export type CinematicSequence={
  approved:true;
  fps:number;
  count:number;
  cameraId:string;
  desktop:CinematicFrameSet;
  mobile:CinematicFrameSet;
};
export type CinematicVideoSet={
  approved:true;
  assets:{mp4?:CinematicAsset;webm?:CinematicAsset;mp4Mobile?:CinematicAsset;webmMobile?:CinematicAsset};
  requiresMediaSrcSelf:true;
};
export type CinematicModeInput={enabled:boolean;reducedMotion:boolean;saveData:boolean;paused:boolean;forcedColors:boolean;visible:boolean};
export type CinematicReviewVideo=Omit<CinematicVideoSet,'approved'>&{approved:false};
const isRecord=(x:unknown):x is Record<string,unknown>=>typeof x==='object'&&x!==null&&!Array.isArray(x);
const digitHash=(value:unknown)=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);
const positiveInt=(value:unknown,limit:number):value is number=>typeof value==='number'&&Number.isSafeInteger(value)&&value>0&&value<=limit;
/** Never accept a URL, traversal, query, SVG, HTML, or uploaded creator asset as renderer media. */
export function isCinemaPath(value:unknown,format:'webp'|'avif'|'mp4'|'webm'):value is string {
 return typeof value==='string'&&
  new RegExp('^assets/cinematic-v136/[a-z0-9/_-]+\\.'+format+'$').test(value)&&
  !value.includes('//')&&!value.includes('..')&&!value.includes('/./');
}
function asset(value:unknown,extension:'webp'|'avif'|'mp4'|'webm',maxBytes:number):value is CinematicAsset {
 if(!isRecord(value))return false;
 if(!isCinemaPath(value.path,extension)||!positiveInt(value.bytes,maxBytes)||!digitHash(value.sha256))return false;
 return true;
}
function frameSet(value:unknown,count:number,maxBytes:number):value is CinematicFrameSet{
 if(!isRecord(value)||!positiveInt(value.width,3072)||!positiveInt(value.height,1728))return false;
 if(!Array.isArray(value.frames)||value.frames.length!==count)return false;
 if(!positiveInt(value.bytes,maxBytes))return false;
 const urls=new Set<string>();
 let total=0;
 for(const frame of value.frames){
  if(!asset(frame,'webp',450_000)&&!asset(frame,'avif',450_000))return false;
  const key=frame.path;
  if(urls.has(key))return false;
  urls.add(key);total+=frame.bytes;
 }
 return total===value.bytes&&total<=maxBytes;
}
export function approvedCinematicSequence(value:unknown):CinematicSequence|null{
 if(!isRecord(value)||value.approved!==true||!positiveInt(value.count,180)||value.count<4||
 !positiveInt(value.fps,30)||value.fps<6||typeof value.cameraId!=='string'||
 !/^[a-z0-9-]{8,90}$/.test(value.cameraId))return null;
 if(!frameSet(value.desktop,value.count,8_500_000)||
 !frameSet(value.mobile,value.count,3_800_000))return null;
 return value as unknown as CinematicSequence;
}
export function approvedCinematicVideo(value:unknown):CinematicVideoSet|null {
 if(!isRecord(value)||value.approved!==true||value.requiresMediaSrcSelf!==true||
 !isRecord(value.assets))return null;
 const {mp4,webm,mp4Mobile,webmMobile}=value.assets;
 if(!mp4&&!webm)return null;
 if(mp4&&!asset(mp4,'mp4',12_000_000))return null;
 if(webm&&!asset(webm,'webm',12_000_000))return null;
 if(mp4Mobile&&!asset(mp4Mobile,'mp4',3_800_000))return null;
 if(webmMobile&&!asset(webmMobile,'webm',3_800_000))return null;
 return value as unknown as CinematicVideoSet;
}
export function frameAt(sequence:CinematicSequence,tier:'desktop'|'mobile',progress:number):CinematicAsset{
 const set=sequence[tier];
 const normalized=Number.isFinite(progress)?Math.max(0,Math.min(1,progress)):0;
 const index=Math.min(sequence.count-1,Math.floor(normalized*sequence.count));
 return set.frames[index];
}
/** Isolated review only. Validation never relabels the candidate as approved. */
export function reviewCinematicVideo(value:unknown,isolatedOwnerReview:boolean):CinematicReviewVideo|null{
 if(!isolatedOwnerReview||!isRecord(value)||value.approved!==false||
  value.approval!=='owner-review-pending'||value.scope!=='isolated-owner-review')return null;
 const validated=approvedCinematicVideo({...value,approved:true});
 return validated?{...validated,approved:false}:null;
}
export function allowMotion(input:CinematicModeInput){
 return input.enabled&&!input.reducedMotion&&!input.saveData&&!input.paused&&!input.forcedColors&&input.visible;
}
/** Encoded size caps are NOT decoded memory claims; runtime retains at most three preload Image objects. */
export const CINEMATIC_DECODE_CACHE_LIMIT=3;
