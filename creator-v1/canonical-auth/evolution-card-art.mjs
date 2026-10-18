/** Server-only player-card illustrations for the thirty canonical earned Evolution levels.
 *  Artwork is composed in a stable front projection, independently of WebGL.
 *  SVG plates are never placed in the public static directory or imported by React.
 *  Only earnedRewardMedia can return a plate after canonical XP/visibility checks.
 *  The original high-definition posters and interactive 3D scene assets are untouched.
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
  '</defs>',
  '<ellipse cx="128" cy="129" rx="109" ry="108" fill="url(#aura)"/>',
  '<g stroke="'+accent+'" stroke-opacity=".13" fill="none">',
  '<circle cx="128" cy="128" r="112" stroke-width="1"/>',
  '<path d="M128 13v13M128 230v13M13 128h13M230 128h13" stroke-width="2"/>',
  '</g>',
  plate.art,
  '</svg>'
 ].join('');
}
