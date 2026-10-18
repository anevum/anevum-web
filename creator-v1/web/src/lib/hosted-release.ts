/** Classify an existing public handoff URL only; never grants runtime approval. */
export function isHostedAlphaRelease(project:{id:string;demoUrl:string|null},origin:string):boolean{
  const id=/^alpha_([a-f0-9]{32})$/.exec(project.id)?.[1];
  if(!id||!project.demoUrl)return false;
  try{
    const url=new URL(project.demoUrl);
    const path=/^\/play\/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/.exec(url.pathname);
    return url.origin===new URL(origin).origin&&url.protocol==='https:'&&!url.username&&!url.password&&
      !url.search&&!url.hash&&path?.[1].replaceAll('-','')===id;
  }catch{return false;}
}
