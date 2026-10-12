// Catalog middleware for the EXISTING Worker. All non-catalog traffic delegates
// unchanged, including authentication, Studio, private RHEN and retirement gates.
import legacy from './worker.mjs';
import {makeMemberAuth, memberConfigured, safeMutation} from './src/server/member.mjs';
import {resolveMemberOrigin} from './src/server/member-preflight.mjs';
import {catalogEndpoint} from './src/server/creator-catalog.mjs';
const error=(message,status)=>Response.json({message},{status,headers:{
  'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff',
  'X-Robots-Tag':'noindex, nofollow, noarchive'}});
function page(path) {
  if(path==='/discover') return ['Discover independent software - ANEVUM','Explore creator-published apps, games, tools and experiments. Applications run on their creators\' hosting.'];
  if(/^\/projects\/[0-9a-f-]{36}$/.test(path)) return ['Creator project - ANEVUM','Project details, source links and an externally hosted application.'];
  if(path==='/publish') return ['Publish your project - ANEVUM','Manage your private project drafts and submit public links for review.'];
  if(path==='/library') return ['Your library - ANEVUM','Your private collection of creator projects.'];
  if(path==='/studio/catalog') return ['Creator review - ANEVUM Studio','Protected project submission review.'];
  return null;
}
export default {
  async fetch(request,env,ctx) {
    const url=new URL(request.url), pathname=url.pathname;
    const review=pathname==='/api/member/studio/catalog' || pathname.startsWith('/api/member/studio/catalog/');
    if(pathname.startsWith('/api/catalog/') || review) {
      try {
        const publicPath=pathname==='/api/catalog/status' || pathname==='/api/catalog/projects' || pathname.startsWith('/api/catalog/projects/');
        if(publicPath) return await catalogEndpoint(request,env);
        const origin=resolveMemberOrigin(request,env);
        if(!origin) return error('Member API origin is not authorized.',403);
        if(!memberConfigured(env)) return error('Member accounts are not available.',503);
        const session=await makeMemberAuth(env,origin).api.getSession({headers:request.headers}).catch(()=>null);
        const user=session?.user;
        if(!user?.id || user.emailVerified!==true) return error('A verified member account is required.',401);
        if(!['GET','HEAD'].includes(request.method) && !safeMutation(request,origin)) return error('Same-origin request required.',403);
        let reviewer=false, mapped=request;
        if(review) {
          // Reuse the full original Studio authorization: independently verified
          // Access JWT AND the exact bound Better Auth member. No client roles.
          const headers=new Headers(request.headers);
          headers.delete('Content-Length'); headers.delete('Content-Type');
          const access=await legacy.fetch(new Request(new URL('/api/member/studio/status',url),{method:'GET',headers}),env,ctx);
          if(!access.ok) return error('Independent Studio authorization is required.',403);
          const status=await access.json();
          reviewer=status.viewerMemberId===user.id && ['owner','admin'].includes(status.role);
          if(!reviewer) return error('Independent Studio authorization is required.',403);
          const target=new URL(request.url);
          target.pathname=pathname.replace('/api/member/studio/catalog','/api/catalog/review');
          mapped=new Request(target,request);
        }
        return await catalogEndpoint(mapped,env,{user,reviewer});
      } catch {return error('Catalog service is temporarily unavailable.',503);}
    }
    const metadata=page(pathname);
    if(metadata) {
      if(!['GET','HEAD'].includes(request.method)) return error('Method not allowed.',405);
      // Serve the same built React entry, retaining original response security.
      const root=new URL('/',url);
      const response=await legacy.fetch(new Request(root,{method:'GET',headers:request.headers}),env,ctx);
      if(!response.ok || !response.headers.get('Content-Type')?.includes('text/html')) return response;
      let rewritten=new HTMLRewriter()
        .on('title',{element(e){e.setInnerContent(metadata[0]);}})
        .on('meta[name="description"]',{element(e){e.setAttribute('content',metadata[1]);}})
        .on('meta[name="robots"]',{element(e){e.setAttribute('content','noindex,nofollow,noarchive');}})
        .on('link[rel="canonical"]',{element(e){e.remove();}})
        .on('meta[property="og:title"],meta[name="twitter:title"]',{element(e){e.setAttribute('content',metadata[0]);}})
        .on('meta[property="og:description"],meta[name="twitter:description"]',{element(e){e.setAttribute('content',metadata[1]);}})
        .on('meta[property="og:url"]',{element(e){e.setAttribute('content','https://anevum.com/discover');}})
        .transform(response);
      const headers=new Headers(rewritten.headers);
      headers.set('Cache-Control','private, no-store');
      headers.set('X-Robots-Tag','noindex, nofollow, noarchive');
      return new Response(request.method==='HEAD'?null:rewritten.body,{status:rewritten.status,headers});
    }
    return legacy.fetch(request,env,ctx);
  }
};
