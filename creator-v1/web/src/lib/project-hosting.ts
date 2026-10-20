/** Recognize only the existing, exact ANEVUM alpha player URL for this release. */
export function isAnevumHostedRelease(id:string,demo:URL|null):boolean {
 if(!/^alpha_[a-f0-9]{32}$/.test(id)||!demo||demo.origin!=='https://anevum.com'||demo.username||demo.password||demo.search||demo.hash)return false;
 const match=/^\/play\/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/.exec(demo.pathname);
 return Boolean(match&&'alpha_'+match[1].replaceAll('-','')===id);
}
