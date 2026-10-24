import {useEffect,useRef,useState} from "react";
import {Link} from "react-router-dom";
import {Icon} from "./Icons";

/** PARITY's real arrival surface. Artwork is decorative; every control is DOM.
 * Reuses canonical navigation and IREN. No account, catalogue or provider I/O.
 * Existing V014 art is explicitly interim, not a claim of final 4K fidelity.
 */
export function ParityArrivalV136({signedIn}:{signedIn:boolean}){
  const scene=useRef<HTMLElement>(null);
  const [artFailed,setArtFailed]=useState(false);
  useEffect(()=>{
    const node=scene.current;
    if(!node)return;
    const motion=window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible=true;
    const update=()=>{node.dataset.active=String(visible&&!document.hidden&&!motion.matches);};
    const observer=new IntersectionObserver(entries=>{
      visible=entries.some(entry=>entry.isIntersecting);update();
    });
    observer.observe(node);
    motion.addEventListener("change",update);
    document.addEventListener("visibilitychange",update);
    update();
    return()=>{
      observer.disconnect();motion.removeEventListener("change",update);
      document.removeEventListener("visibilitychange",update);
    };
  },[]);
  const art=import.meta.env.BASE_URL+"assets/community-portals/games-";
  return <section ref={scene} className="av136-arrival" data-active="false"
    data-iren-anchor="arrival" aria-labelledby="av79-home-heading">
    <div className="av136-environment" aria-hidden="true">
      {!artFailed&&<picture>
        <source media="(max-width: 650px)" srcSet={art+"768.webp 768w, "+art+"1536.webp 1536w"} sizes="100vw"/>
        <img src={art+"1536.webp"} srcSet={art+"768.webp 768w, "+art+"1536.webp 1536w"}
          sizes="100vw" width={1536} height={1024} alt="" decoding="async"
          loading="eager" fetchPriority="high" draggable={false} onError={()=>setArtFailed(true)}/>
      </picture>}
      {artFailed&&<span className="av136-art-fallback"/>}
      <span className="av136-environment-shade"/>
      <span className="av136-orbit av136-orbit--outer"/>
      <span className="av136-orbit av136-orbit--inner"/>
      <span className="av136-horizon"/>
    </div>
    <div className="av136-arrival-copy">
      <p className="av136-register">THE CONTINUANCE INSTITUTE <span aria-hidden="true">/</span> ANEVUM</p>
      <h1 id="av79-home-heading">Find something <em>worth trying.</em></h1>
      <p className="av136-purpose">Independent games, useful apps and creative experiments.</p>
      <div className="av136-actions">
        <Link className="av136-action av136-action--primary" to="/discover">
          Explore real projects <Icon name="arrow" size={18}/>
        </Link>
        <Link className="av136-action av136-action--secondary" to={signedIn?"/member":"/join"}>
          {signedIn?"Return to my space":"Join the early community"} <Icon name="arrow" size={17}/>
        </Link>
      </div>
      <p className="av136-access">Free to explore. No account required.</p>
    </div>
    <div className="av136-arrival-foot">
      <span>Membership is free. Creator publishing is still in testing.</span>
      <button type="button" onClick={()=>window.dispatchEvent(new Event("anevum:iren-intro"))}>
        <span className="av136-guide-light" aria-hidden="true"/> Need a guide? Meet IREN <Icon name="arrow" size={15}/>
      </button>
    </div>
  </section>;
}
