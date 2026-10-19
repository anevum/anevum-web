/** Server-only player-card illustrations for the thirty canonical earned Evolution levels.
 *  Artwork is composed in a stable front projection, independently of WebGL.
 *  SVG plates are never placed in the public static directory or imported by React.
 *  Only earnedRewardMedia can return a plate after canonical XP/visibility checks.
 *  Original assets remain available for safe rollback, but the member experience
 *  now uses resolution-independent vector emblems instead of 3D models.
 */
import PLATES from './evolution-card-plates.json' with {type:'json'};

const validColor = /^#[0-9a-fA-F]{6}$/;
if(!Array.isArray(PLATES) || PLATES.length !== 30 ||
  PLATES.some((plate,index) =>
    plate.level !== index+1 || typeof plate.name !== 'string' ||
    !validColor.test(plate.accent) || typeof plate.art !== 'string' ||
    plate.art.length > 9000 || /<script|<foreignObject|<image|onload\s*=|javascript:/i.test(plate.art))){
  throw new Error('Invalid server-only Evolution card artwork');
}
const escapeXml = value => value.replace(/[&<>"']/g,character=>({
 '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'
})[character]);

/** A distinctive illustration, not a camera snapshot or a live miniature. */
export function renderEvolutionCardArt(level){
 if(!Number.isSafeInteger(level)||level<1||level>30)return null;
 const plate=PLATES[level-1];
 const accent=plate.accent;
 return [
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256" role="img">',
  '<title>Evolution level '+level+' - '+escapeXml(plate.name)+'</title>',
  '<defs>',
  '<radialGradient id="aura"><stop offset="0" stop-color="'+accent+'" stop-opacity=".35"/>',
  '<stop offset=".62" stop-color="'+accent+'" stop-opacity=".11"/>',
  '<stop offset="1" stop-color="'+accent+'" stop-opacity="0"/></radialGradient>',
  '<linearGradient id="stone" x1="0" y1="0" x2="1" y2="1">',
  '<stop stop-color="#59677e"/><stop offset=".32" stop-color="#222d44"/>',
  '<stop offset=".68" stop-color="#11172b"/><stop offset="1" stop-color="#8694a6"/></linearGradient>',
  '<linearGradient id="metal" x1=".08" y1="0" x2=".94" y2="1">',
  '<stop stop-color="#fff7eb"/><stop offset=".22" stop-color="'+accent+'"/>',
  '<stop offset=".59" stop-color="#526078"/><stop offset=".81" stop-color="'+accent+'"/>',
  '<stop offset="1" stop-color="#f8f8fc"/></linearGradient>',
  '<linearGradient id="ceramic" x1="0" y1="0" x2=".87" y2="1">',
  '<stop stop-color="#fff5df"/><stop offset=".36" stop-color="#d4d9dd"/>',
  '<stop offset=".69" stop-color="'+accent+'"/><stop offset="1" stop-color="#4a6074"/></linearGradient>',
  '<radialGradient id="glass" cx=".3" cy=".23" r=".86">',
  '<stop stop-color="#d4f2fb" stop-opacity=".96"/><stop offset=".25" stop-color="'+accent+'" stop-opacity=".77"/>',
  '<stop offset=".65" stop-color="#334664" stop-opacity=".88"/>',
  '<stop offset="1" stop-color="#0c1728" stop-opacity=".97"/></radialGradient>',
  '<radialGradient id="core" cx=".38" cy=".31" r=".68">',
  '<stop stop-color="#fffef3"/><stop offset=".25" stop-color="#fff0c8"/>',
  '<stop offset=".57" stop-color="'+accent+'"/><stop offset="1" stop-color="#3c506c"/></radialGradient>',
  '<linearGradient id="energy" x1="0" y1="0" x2="1" y2="1">',
  '<stop stop-color="#ffffff"/><stop offset=".42" stop-color="'+accent+'"/>',
  '<stop offset="1" stop-color="#85c6e4"/></linearGradient>',
  '<filter id="glow" x="-50%" y="-50%" width="200%" height="200%">',
  '<feGaussianBlur stdDeviation="7"/></filter>',
  '<filter id="depth" x="-35%" y="-35%" width="170%" height="175%">',
  '<feDropShadow dx="0" dy="9" stdDeviation="7" flood-color="#070b16" flood-opacity=".72"/></filter>',
  '<radialGradient id="sigilFace" cx=".3" cy=".17" r=".9"><stop offset="0" stop-color="#405780"/>',
  '<stop offset=".6" stop-color="#172641"/><stop offset="1" stop-color="#060c1b"/></radialGradient>',
  '<linearGradient id="rim" x1="0" y1="0" x2="1" y2="1">',
  '<stop offset="0" stop-color="#fff"/><stop offset=".15" stop-color="#a0bad4"/>',
  '<stop offset=".32" stop-color="'+accent+'"/><stop offset=".5" stop-color="#405168"/>',
  '<stop offset=".73" stop-color="#f1e4d1"/><stop offset=".89" stop-color="'+accent+'"/>',
  '<stop offset="1" stop-color="#73859d"/></linearGradient>',
  '<clipPath id="sigilInterior"><circle cx="128" cy="128" r="89"/></clipPath>',
  '</defs>',
  '<circle cx="128" cy="128" r="124" fill="url(#aura)"/>',
  '<circle cx="128" cy="128" r="120" fill="url(#rim)" stroke="#eef6ff" stroke-opacity=".72" stroke-width="1.3"/>',
  '<circle cx="128" cy="128" r="112" fill="#0d172b" stroke="#324961" stroke-width="4"/>',
  '<circle cx="128" cy="128" r="108" fill="none" stroke="url(#rim)" stroke-width="5"/>',
  '<circle cx="128" cy="128" r="102" fill="url(#sigilFace)" stroke="#b9cce3" stroke-opacity=".7" stroke-width="1.2"/>',
  '<g fill="none" stroke="'+accent+'" opacity=".7">',
  '<circle cx="128" cy="128" r="99" stroke-width=".8"/>',
  '<circle cx="128" cy="128" r="93" stroke-width=".7" stroke-dasharray="2 7"/>',
  '</g>',
  Array.from({length:48},(_,i)=>'<path d="'+(i%4===0?'M128 29v10':'M128 31v5')+
   '" transform="rotate('+(i*7.5)+' 128 128)" stroke="'+(i%4===0?'#f0e2ca':accent)+
   '" stroke-opacity="'+(i%4===0?'.87':'.6')+'" stroke-width="'+(i%4===0?'1.6':'.9')+'"/>').join(''),
  '<circle cx="128" cy="128" r="89" fill="url(#sigilFace)"/>',
  '<g clip-path="url(#sigilInterior)">',
  '<g transform="translate(22 22) scale(.828125)">',plate.art,'</g>',
  '</g>',
  '<circle cx="128" cy="128" r="89" fill="none" stroke="url(#rim)" stroke-width="2.4"/>',
  '<circle cx="128" cy="128" r="84" fill="none" stroke="'+accent+'" stroke-opacity=".35" stroke-width=".65"/>',
  '<path d="M67 61C88 40 158 39 181 59" stroke="#fff" stroke-opacity=".35" stroke-width="3" stroke-linecap="round" fill="none"/>',
  '<path d="M128 6v14M128 236v14M6 128h14M236 128h14" stroke="#ffeed5" stroke-width="1.8" stroke-opacity=".7"/>',
  '</svg>'
 ].join('');
}
