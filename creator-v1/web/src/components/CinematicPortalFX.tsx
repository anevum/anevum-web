import {useEffect, useRef} from "react";

/**
 * Decorative emissive pass for the cinematic world portal.
 * The orbit is drawn at device pixel ratio; labels, controls and links remain
 * accessible DOM elements above this canvas. Existing artwork is a complete
 * static fallback; animation sleeps offscreen and with reduced motion.
 */
export function CinematicPortalFX(){
  const canvasRef=useRef<HTMLCanvasElement>(null);
  useEffect(()=>{
    const canvas=canvasRef.current;
    if(!canvas)return;
    const ctx=canvas.getContext("2d",{alpha:true});
    if(!ctx)return;
    const media=window.matchMedia("(prefers-reduced-motion: reduce)");
    let width=0,height=0,visible=false,raf=0,lastFrame=0,disposed=false;
    const tau=Math.PI*2;
    function resize(){
      const bounds=canvas!.getBoundingClientRect();
      width=Math.max(1,bounds.width);
      height=Math.max(1,bounds.height);
      const dpr=Math.min(2,Math.max(1,window.devicePixelRatio||1));
      canvas!.width=Math.round(width*dpr);
      canvas!.height=Math.round(height*dpr);
      ctx!.setTransform(dpr,0,0,dpr,0,0);
      draw(0);
    }
    function draw(milliseconds:number){
      if(disposed||width<2||height<2)return;
      const seconds=milliseconds/1000;
      const mobile=width<650;
      const cx=width*(mobile ? 0.64 : 0.594),cy=height*(mobile ? 0.245 : 0.39);
      const radius=Math.min(height*(mobile ? 0.245 : 0.36),width*(mobile ? 0.175 : 0.135));
      const ringHeight=radius*(mobile ? 0.83 : 0.88);
      ctx!.clearRect(0,0,width,height);
      ctx!.save();
      ctx!.globalCompositeOperation="screen";
      const bloom=ctx!.createRadialGradient(cx,cy,radius*.22,cx,cy,radius*1.44);
      bloom.addColorStop(0,"rgba(255,211,141,.055)");
      bloom.addColorStop(.55,"rgba(176,94,255,.035)");
      bloom.addColorStop(1,"rgba(69,46,163,0)");
      ctx!.fillStyle=bloom;
      ctx!.beginPath();
      ctx!.ellipse(cx,cy,radius*1.5,radius*1.43,0,0,tau);
      ctx!.fill();
      for(let ring=0;ring<3;ring++){
        const extent=radius*(1+ring*.105);
        const ellipseHeight=ringHeight*(1+ring*.085);
        const segments=ring===0?18:12;
        const speed=(ring%2?-1:1)*(ring===0 ? 0.026 : 0.018);
        for(let i=0;i<segments;i++){
          const phase=(i/segments)*tau+seconds*speed;
          const span=(tau/segments)*(.38+.35*(.5+.5*Math.sin(i*4.1+ring)));
          const alpha=(.11+.19*(.5+.5*Math.sin(seconds*.55+i*2.2+ring)));
          ctx!.save();
          ctx!.translate(cx,cy);
          ctx!.scale(1,ellipseHeight/extent);
          ctx!.beginPath();
          ctx!.ellipse(0,0,extent,extent,0,phase,phase+span);
          ctx!.strokeStyle=ring===1?`rgba(154,145,255,${alpha})`:`rgba(255,184,128,${alpha})`;
          ctx!.lineWidth=(ring===0?2.2:1.25)*(extent/ellipseHeight);
          ctx!.shadowColor=ring===1?"#926dff":"#f7a265";
          ctx!.shadowBlur=ring===0?18:11;
          ctx!.stroke();
          ctx!.restore();
        }
      }
      const count=mobile?17:29;
      for(let i=0;i<count;i++){
        const theta=i*2.399963+seconds*(i%3===0 ? 0.012 : -0.008);
        const distance=radius*(.91+(i%11)*.058);
        const px=cx+Math.cos(theta)*distance;
        const py=cy+Math.sin(theta)*distance*.78;
        const luminosity=(.24+.34*(.5+.5*Math.sin(seconds*1.15+i*2.7)));
        const r=.65+(i%4)*.36;
        ctx!.beginPath();
        ctx!.arc(px,py,r,0,tau);
        ctx!.fillStyle=i%3===0?`rgba(255,203,152,${luminosity})`:`rgba(175,156,255,${luminosity*.8})`;
        ctx!.shadowColor=i%3===0?"#ffca9c":"#b88fff";
        ctx!.shadowBlur=i%3===0?8:6;
        ctx!.fill();
      }
      const lightY=cy+Math.sin(seconds*.4)*radius*.018;
      const ray=ctx!.createLinearGradient(cx-radius*.68,lightY,cx+radius*.65,lightY);
      ray.addColorStop(0,"rgba(255,175,116,0)");
      ray.addColorStop(.42,"rgba(255,199,148,.1)");
      ray.addColorStop(.5,"rgba(255,245,220,.18)");
      ray.addColorStop(.58,"rgba(193,138,246,.1)");
      ray.addColorStop(1,"rgba(164,107,243,0)");
      ctx!.shadowBlur=0;
      ctx!.fillStyle=ray;
      ctx!.fillRect(cx-radius*.68,lightY-1.2,radius*1.33,2.4);
      ctx!.restore();
    }
    function tick(now:number){
      raf=0;
      if(disposed||!visible||document.hidden||media.matches)return;
      if(now-lastFrame>=32){draw(now);lastFrame=now;}
      raf=window.requestAnimationFrame(tick);
    }
    function refresh(){
      if(disposed)return;
      if(raf){window.cancelAnimationFrame(raf);raf=0;}
      if(!visible||document.hidden||media.matches){draw(0);return;}
      lastFrame=0;
      raf=window.requestAnimationFrame(tick);
    }
    const resizeObserver=new ResizeObserver(resize);
    const visibilityObserver=new IntersectionObserver(entries=>{
      visible=Boolean(entries[0]?.isIntersecting);
      refresh();
    },{rootMargin:"120px"});
    resizeObserver.observe(canvas);
    visibilityObserver.observe(canvas);
    media.addEventListener("change",refresh);
    document.addEventListener("visibilitychange",refresh);
    resize();
    return ()=>{
      disposed=true;
      if(raf)window.cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      media.removeEventListener("change",refresh);
      document.removeEventListener("visibilitychange",refresh);
    };
  },[]);
  return <canvas ref={canvasRef} className="cinema-portal-fx" aria-hidden="true" role="presentation"/>;
}