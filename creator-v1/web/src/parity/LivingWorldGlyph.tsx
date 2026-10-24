import {useId} from 'react';
import type {CosmicScene} from '../components/CosmicIllustration';
import {useLivingWorld,worldDensity} from './LivingWorldState';

const tones:Record<CosmicScene,{edge:string;core:string;shade:string;accent:string}>={
  hero:{edge:'#77e3ff',core:'#3869ad',shade:'#091c3e',accent:'#becbff'},
  portal:{edge:'#68d9ff',core:'#365ea0',shade:'#0b183b',accent:'#b5a1ff'},
  games:{edge:'#c09aff',core:'#5437a3',shade:'#180c3b',accent:'#77d9ff'},
  tools:{edge:'#60e9ff',core:'#147eaa',shade:'#072b41',accent:'#a5ffea'},
  automation:{edge:'#9ca8ff',core:'#3954a3',shade:'#101c44',accent:'#b2eaff'},
  research:{edge:'#8eaeff',core:'#3a68b2',shade:'#0d2147',accent:'#80fcff'},
  creative:{edge:'#f396fa',core:'#903c9b',shade:'#300f43',accent:'#8dd8ff'},
  learning:{edge:'#b99cff',core:'#4b57a7',shade:'#151b42',accent:'#a6f3f4'},
  libraries:{edge:'#7befce',core:'#268f81',shade:'#0b3937',accent:'#bcfaff'},
  other:{edge:'#a4baff',core:'#445b9e',shade:'#182348',accent:'#e2c7ff'}
};
function hash(value:string){
  let h=2166136261;
  for(let i=0;i<value.length;i++)h=Math.imul(h^value.charCodeAt(i),16777619);
  return h>>>0;
}
type Props={scene?:CosmicScene;seed?:string;className?:string;title?:string};

/** Code-generated vector identity for categories and creator directory cards.
 * Seed = stable public category/project identifier; density = approved counts.
 * The patterns are intentionally illustrations, not falsely attributed covers.
 */
export function LivingWorldGlyph({scene='portal',seed='',className='',title}:Props){
  const {signal}=useLivingWorld();
  const tone=tones[scene];
  const density=worldDensity(signal,scene);
  const amount=signal.source==='unavailable'?3:Math.min(9,Math.max(3,Math.ceil(density*8)));
  const n=hash(seed||scene);
  const key=useId().replace(/:/g,'');
  const id=(suffix:string)=>'p136g-'+key+'-'+suffix;
  const orbit=Array.from({length:amount},(_,i)=>({
    x:100+((n+i*337+Math.imul(i*i+5,117))%1011),
    y:70+((n>>>3+i*241+Math.imul(i+13,37))%550),
    r:2+(i%3)*1.8
  }));
  const cx=scene==='games'?625:scene==='creative'?650:scene==='tools'?570:590;
  const cy=340;
  const angle=(n%70)-35;
  return <span className={'cw-artwork cw-artwork--'+scene+' cw-live-glyph '+className}
    data-generated="procedural" data-sector={scene} data-signal={signal.source}
    role={title?'img':undefined} aria-label={title} aria-hidden={title?undefined:true}>
    <svg className="cw-artwork-image" viewBox="0 0 1200 700" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={id('sky')} x1="0" x2=".9" y1="0" y2="1">
          <stop stopColor={tone.shade}/><stop offset=".6" stopColor="#07152a"/><stop offset="1" stopColor="#040d1b"/>
        </linearGradient>
        <radialGradient id={id('glow')}>
          <stop stopColor={tone.edge} stopOpacity=".44"/>
          <stop offset=".44" stopColor={tone.core} stopOpacity=".34"/>
          <stop offset="1" stopColor={tone.shade} stopOpacity="0"/>
        </radialGradient>
        <radialGradient id={id('body')} cx=".36" cy=".27">
          <stop stopColor={tone.accent}/><stop offset=".2" stopColor={tone.core}/>
          <stop offset=".82" stopColor={tone.shade}/><stop offset="1" stopColor="#030c1c"/>
        </radialGradient>
        <linearGradient id={id('orbit')} x1="0" y1=".2" x2="1" y2=".9">
          <stop stopColor={tone.edge} stopOpacity=".04"/><stop offset=".52" stopColor={tone.edge} stopOpacity=".96"/>
          <stop offset="1" stopColor={tone.accent} stopOpacity=".09"/>
        </linearGradient>
      </defs>
      <rect width="1200" height="700" fill={'url(#'+id('sky')+')'}/>
      <ellipse cx={cx} cy={cy} rx="560" ry="420" fill={'url(#'+id('glow')+')'}/>
      <g stroke={tone.edge} strokeOpacity=".14" strokeWidth="1" fill="none">
        {Array.from({length:7},(_,i)=><path key={'vanish'+i} d={'M'+(i*215-70)+' 700L'+(540+(i-3)*23)+' 350'}/>)}
        {Array.from({length:4},(_,i)=><path key={'line'+i} d={'M0 '+(485+i*52)+'H1200'}/>)}
      </g>
      <g className="cw-live-orbit">
        <ellipse cx={cx} cy={cy} rx={300+(n%44)} ry="100" transform={'rotate('+angle+' '+cx+' '+cy+')'}
          stroke={'url(#'+id('orbit')+')'} strokeWidth="7" fill="none"/>
        <ellipse cx={cx} cy={cy} rx={220+(n%33)} ry="165"
          transform={'rotate('+(angle+64)+' '+cx+' '+cy+')'} stroke={tone.accent}
          strokeOpacity=".38" strokeWidth="2" fill="none"/>
        <ellipse cx={cx} cy={cy} rx="183" ry="180" stroke={tone.edge} strokeOpacity=".30" strokeWidth="12" fill="none"/>
      </g>
      <circle cx={cx} cy={cy} r={128+(n%21)} fill={'url(#'+id('body')+')'}
        stroke={tone.edge} strokeOpacity=".35" strokeWidth="3"/>
      <path d={'M'+(cx-100)+' '+(cy+30)+'Q'+cx+' '+(cy-118)+' '+(cx+109)+' '+(cy-38)}
        stroke={tone.accent} strokeWidth="3" strokeOpacity=".15" fill="none"/>
      {scene==='tools'||scene==='automation'||scene==='libraries'?
        <g stroke={tone.edge} fill="none" strokeWidth="3" opacity=".60">
          <path d="M145 190H335L420 277H486M745 409H881L944 344H1102M214 500H350L433 424"/>
          <rect x="100" y="145" width="118" height="88" rx="8"/>
          <path d="M154 145V102M166 233V265M944 344V300"/>
          <circle cx="944" cy="300" r="10" fill={tone.accent}/>
        </g>:
        scene==='creative'?
          <g fill="none" strokeWidth="4" strokeOpacity=".52">
            <path d="M98 545Q286 174 510 284T985 148" stroke={tone.accent}/>
            <path d="M115 605Q300 244 534 329T1090 245" stroke={tone.edge}/>
          </g>:
        <g fill="none" stroke={tone.edge} strokeOpacity=".50" strokeWidth="2">
          <path d="M145 438L326 307L428 374M860 241L1050 144L1120 318"/>
          <circle cx="326" cy="307" r="9"/><circle cx="1050" cy="144" r="6"/>
        </g>}
      <g fill={tone.accent}>
        {orbit.map((point,i)=><circle key={i} cx={point.x} cy={point.y}
          r={point.r} opacity={.32+(i%4)*.13}/>)}
      </g>
      <path d="M0 610Q250 565 480 640T1200 570V700H0Z" fill="#030b18" opacity=".75"/>
    </svg>
    <span className="cw-artwork-glaze" aria-hidden="true"/>
  </span>;
}
