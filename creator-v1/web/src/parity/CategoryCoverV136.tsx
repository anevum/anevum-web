import {useState} from 'react';
import {Icon} from '../components/Icons';
import './category-cover-v136.css';

/** One deliberate first-party thumbnail family for every project type.
 * The creator's verified cover wins when present. A missing or failed cover
 * becomes a neutral, authored type placeholder rather than generated art.
 * No project data is inferred from the thumbnail.
 */
const categories:Record<string,{label:string;symbol:string;tone:string}>={
 games:{label:'GAME / WORLD',symbol:'games',tone:'violet'},
 game:{label:'BROWSER GAME',symbol:'games',tone:'violet'},
 tools:{label:'APP / TOOL',symbol:'library',tone:'cyan'},
 app:{label:'APPLICATION',symbol:'library',tone:'cyan'},
 automation:{label:'AUTOMATION',symbol:'status',tone:'cyan'},
 research:{label:'RESEARCH',symbol:'explore',tone:'mint'},
 simulation:{label:'SIMULATION',symbol:'explore',tone:'mint'},
 creative:{label:'CREATIVE WORK',symbol:'create',tone:'rose'},
 story:{label:'STORY / EXPERIENCE',symbol:'create',tone:'rose'},
 learning:{label:'LEARNING',symbol:'star',tone:'gold'},
 libraries:{label:'OPEN SOURCE',symbol:'library',tone:'cyan'},
 other:{label:'PROJECT',symbol:'create',tone:'slate'}
};
type Props={category:string;coverUrl?:string|null;title?:string;className?:string};
export function CategoryCoverV136({category,coverUrl=null,title='',className=''}:Props){
 const [failedUrl,setFailedUrl]=useState<string|null>(null);
 const meta=Object.hasOwn(categories,category)?categories[category]:categories.other;
 const hasCover=Boolean(coverUrl&&failedUrl!==coverUrl);
 return <span
  className={'p136-category-cover p136-category-cover--'+meta.tone+(className?' '+className:'')}
  data-cover-kind={category} data-cover-source={hasCover?'creator':'default'}
  role="img" aria-label={hasCover?'Creator-supplied cover for '+title:meta.label+' — ANEVUM type-default thumbnail'}>
   <span className="p136-category-cover-bg" aria-hidden="true">
    <span className="p136-category-cover-corners"/>
    <span className="p136-category-cover-icon"><Icon name={meta.symbol} size={52}/></span>
    <span className="p136-category-cover-identity"><strong>{meta.label}</strong><small>ANEVUM / DEFAULT COVER</small></span>
   </span>
   {hasCover&&<img src={coverUrl!} alt="" loading="lazy" decoding="async"
    referrerPolicy="same-origin" onError={()=>setFailedUrl(coverUrl??null)}/>}
  </span>;
}
