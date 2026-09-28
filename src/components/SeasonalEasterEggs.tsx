import { useMemo, type CSSProperties } from "react";

type AmbientTheme = {
  floater: string;
  peeker: string;
  floaters: number;
  peekers: number;
};

const THEMES: Record<string, AmbientTheme> = {
  jan:{floater:"snow",peeker:"glint",floaters:18,peekers:3},
  feb:{floater:"ember",peeker:"glint",floaters:12,peekers:3},
  mar:{floater:"petal",peeker:"glint",floaters:12,peekers:3},
  apr:{floater:"rain",peeker:"glint",floaters:16,peekers:3},
  may:{floater:"firefly",peeker:"glint",floaters:14,peekers:3},
  jun:{floater:"mote",peeker:"glint",floaters:12,peekers:3},
  jul:{floater:"spark",peeker:"glint",floaters:12,peekers:3},
  aug:{floater:"haze",peeker:"glint",floaters:10,peekers:3},
  sep:{floater:"leaf",peeker:"glint",floaters:10,peekers:3},
  oct:{floater:"ghost",peeker:"eyes",floaters:8,peekers:7},
  nov:{floater:"ember",peeker:"glint",floaters:10,peekers:3},
  dec:{floater:"snow",peeker:"glint",floaters:16,peekers:3},
};

function rand(seed:number){
  const x=Math.sin(seed*999.91)*43758.5453;
  return x-Math.floor(x);
}

export default function SeasonalEasterEggs(){
  const theme=document.documentElement.dataset.seasonalTheme || "jan";
  const spec=THEMES[theme] || THEMES.jan;
  const seed=useMemo(()=>Date.now()%100000,[]);

  const floaters=Array.from({length:spec.floaters},(_,i)=>{
    const r1=rand(seed+i*7+1);
    const r2=rand(seed+i*11+2);
    const r3=rand(seed+i*13+3);
    return {
      left:(r1*100).toFixed(2)+"%",
      delay:(-r2*(theme==="oct"?38:24)).toFixed(2)+"s",
      duration:((theme==="oct"?24:14)+r3*(theme==="oct"?24:18)).toFixed(2)+"s",
      scale:(0.55+r2*0.95).toFixed(2),
      drift:((-55+r3*110)).toFixed(1)+"px"
    };
  });

  const peekers=Array.from({length:spec.peekers},(_,i)=>{
    const r1=rand(seed+i*17+20);
    const r2=rand(seed+i*19+21);
    const r3=rand(seed+i*23+22);
    return {
      left:(4+r1*92).toFixed(2)+"%",
      top:(6+r2*88).toFixed(2)+"%",
      delay:(r3*42+i*9).toFixed(2)+"s",
      duration:(34+r1*34).toFixed(2)+"s",
      scale:(0.65+r2*0.85).toFixed(2)
    };
  });

  return (
    <div className="seasonal-easter-eggs" data-theme={theme} aria-hidden="true">
      <div className="seasonal-floaters">
        {floaters.map((style,i)=>(
          <span
            key={i}
            className={"seasonal-floater seasonal-floater-"+spec.floater}
            style={{
              "--egg-left":style.left,
              "--egg-delay":style.delay,
              "--egg-duration":style.duration,
              "--egg-scale":style.scale,
              "--egg-drift":style.drift
            } as CSSProperties}
          />
        ))}
      </div>
      <div className="seasonal-peekers">
        {peekers.map((style,i)=>(
          <span
            key={i}
            className={"seasonal-peeker seasonal-peeker-"+spec.peeker}
            style={{
              "--peek-left":style.left,
              "--peek-top":style.top,
              "--peek-delay":style.delay,
              "--peek-duration":style.duration,
              "--peek-scale":style.scale
            } as CSSProperties}
          >
            <i/><i/>
          </span>
        ))}
      </div>
    </div>
  );
}
