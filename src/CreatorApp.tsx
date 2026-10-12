import {lazy, Suspense, useEffect} from 'react';
import {useLocation} from 'react-router-dom';
import App from './App';
import {memberAuthClient} from './member/auth-client';
const CommonsV5=lazy(()=>import('./commons/CommonsV5'));
const Catalog=lazy(()=>import('./creator/Catalog'));
export default function CreatorApp(){
  const {pathname}=useLocation();
  const {data:session,isPending}=memberAuthClient.useSession();
  const isCatalog=['/discover','/publish','/library','/studio/catalog'].includes(pathname)||/^\/projects\/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(pathname);
  const memberId=session?.user?.id||null;
  useEffect(()=>{
    if(!isCatalog)return;
    document.title=pathname==='/discover'?'Discover independent software - ANEVUM':pathname==='/publish'?'Publish your project - ANEVUM':pathname==='/library'?'Your library - ANEVUM':pathname==='/studio/catalog'?'Creator review - ANEVUM':'Creator project - ANEVUM';
    const robots=document.head.querySelector('meta[name="robots"]');
    robots?.setAttribute('content','noindex,nofollow,noarchive');
    document.head.querySelector('link[rel="canonical"]')?.remove();
    window.scrollTo({top:0,behavior:'auto'});
  },[pathname,isCatalog]);
  if(!isCatalog)return <App/>;
  return <Suspense fallback={<div className="route-loader">Loading ANEVUM...</div>}><CommonsV5 content={
    <Catalog key={(memberId||'guest')+':'+pathname} pathname={pathname} memberId={memberId} sessionPending={isPending}/>
  }/></Suspense>;
}
