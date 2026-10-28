import {useEffect} from 'react';
import {useLocation} from 'react-router-dom';
import {publicPageMetadata} from '../lib/public-page-metadata';

const productionOrigin='https://anevum.com';
function setMeta(kind:'name'|'property',key:string,content:string):void{
  const selector='meta['+kind+'="'+key+'"]';
  let element=document.head.querySelector<HTMLMetaElement>(selector);
  if(!element){
    element=document.createElement('meta');
    element.setAttribute(kind,key);
    document.head.appendChild(element);
  }
  element.content=content;
}
function setCanonical(url:string|null):void{
  let link=document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if(!url){link?.remove();return;}
  if(!link){
    link=document.createElement('link');
    link.rel='canonical';
    document.head.appendChild(link);
  }
  link.href=url;
}
function setOgUrl(url:string|null):void{
  if(!url){
    document.head.querySelector('meta[property="og:url"]')?.remove();
    return;
  }
  setMeta('property','og:url',url);
}

/**
 * Route-level browser navigation metadata; no API request or user data.
 * A prerender/edge release is still necessary for no-JavaScript crawlers
 * and reliable third-party social previews. This only fixes hydrated pages.
 */
export function PublicPageMetadata(){
  const {pathname}=useLocation();
  useEffect(()=>{
    const route=publicPageMetadata(pathname);
    const canonical=route.canonicalPath?productionOrigin+route.canonicalPath:null;
    const onProduction=window.location.hostname==='anevum.com';
    document.title=route.title;
    setMeta('name','description',route.description);
    setMeta('property','og:title',route.title);
    setMeta('property','og:description',route.description);
    setMeta('name','twitter:title',route.title);
    setMeta('name','twitter:description',route.description);
    setMeta('name','robots',onProduction&&route.indexable?'index,follow':'noindex,nofollow');
    setCanonical(canonical);
    setOgUrl(canonical);
  },[pathname]);
  return null;
}
