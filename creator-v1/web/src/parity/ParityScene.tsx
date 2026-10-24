import {useEffect,useRef,useState} from 'react';
import {CosmicIllustration} from '../components/CosmicIllustration';

/** Original environment only; all identity, copy and controls remain DOM. */
export function ParityScene({paused}:{paused:boolean}){
  const ref=useRef<HTMLDivElement>(null);
  const [failed,setFailed]=useState(false);
  const [active,setActive]=useState(false);
  useEffect(()=>{
    const media=matchMedia('(prefers-reduced-motion: reduce)');
    const connection=(navigator as Navigator&{connection?:{saveData?:boolean}}).connection;
    let visible=true;
    const update=()=>setActive(!paused&&!media.matches&&!connection?.saveData&&visible&&document.visibilityState==='visible');
    const observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;update();});
    if(ref.current)observer.observe(ref.current);
    media.addEventListener('change',update);
    document.addEventListener('visibilitychange',update);update();
    return()=>{observer.disconnect();media.removeEventListener('change',update);document.removeEventListener('visibilitychange',update);};
  },[paused]);
  const base=import.meta.env.BASE_URL+'assets/parity-v136/';
  return <div ref={ref} className="p136-scene" aria-hidden="true" data-active={active} data-fallback={failed}>
    {failed?<CosmicIllustration scene="hero" className="p136-scene-fallback"/>:<img src={base+'institute-1672.webp'}
      srcSet={base+'institute-768.webp 768w, '+base+'institute-1536.webp 1536w, '+base+'institute-1672.webp 1672w'}
      sizes="100vw" width={1672} height={941} alt="" fetchPriority="high" decoding="async" onError={()=>setFailed(true)}/>}
    <span className="p136-scene-stars"/>
    <span className="p136-scene-horizon"/>
  </div>;
}
