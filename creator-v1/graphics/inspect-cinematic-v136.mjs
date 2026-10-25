/** ANEVUM PARITY V136.018 native arrival / asset-retirement source audit.
 * Pure local file inspection. Never downloads, publishes, or reads private data.
 */
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const here=fileURLToPath(new URL('.',import.meta.url));
const publicRoot=resolve(here,'../web/public');
const manifest=JSON.parse(readFileSync(resolve(publicRoot,'assets/cinematic-v136/arrival/manifest.json'),'utf8'));
assert.equal(manifest.schema,'anevum.cinematic.arrival.v1');
assert.equal(manifest.status,'preview-only','Preview must remain unapproved');
assert.equal(manifest.mode,'native-surface-pilot','Retired poster pilot must not mount');
assert.equal(manifest.sequence,null,'No unapproved animation frames or video');
assert.equal(manifest.posters,undefined,'Generated arrival posters cannot ship');
assert.equal(manifest.sourceManifest,undefined,'Retired imagegen source is no longer a dependency');
assert.equal(manifest.handoff.sceneSector,'hero');
assert.equal(manifest.handoff.geometry,'atrium');
assert.ok(manifest.handoff.revealStart>=0&&manifest.handoff.revealEnd<=1&&manifest.handoff.revealEnd>manifest.handoff.revealStart);
const arrival=readFileSync(resolve(here,'../web/src/parity/CinematicArrivalV136.tsx'),'utf8');
assert.match(arrival,/data-arrival-surface="native-interface"/);
assert.match(arrival,/cinematicInspectionOpacity\(inspecting,readiness,scrollOpacity\)/,'Live 3D inspection handoff remains ready-gated');
assert.doesNotMatch(arrival,/<img\b|<picture\b|manifest\.posters|assets\/parity-v136\//,'No raster fallback');
const css=readFileSync(resolve(here,'../web/src/parity/cinematic-arrival-v136.css'),'utf8');
assert.match(css,/\.p136-native-institute/,'Resolution-independent native presentation');
assert.match(css,/prefers-reduced-motion:reduce/,'Respect reduced motion');
const retired=['cinematic','community-portals','parity-v136','cinematic-v2/atmosphere'];
for(const folder of retired){
 const entries=readdirSync(resolve(publicRoot,'assets',folder),{recursive:true,withFileTypes:true});
 const images=entries.filter(e=>e.isFile()&&/\.(webp|png|jpe?g|avif)$/i.test(e.name));
 assert.equal(images.length,0,'Retired promotional files in '+folder);
}
console.log(JSON.stringify({
 status:'CINEMATIC_NATIVE_SOURCE_PASS',presentation:'native interface and authored 3D',
 retiredFolders:retired.length,generatedPosterCount:0,
 sequence:'not-authorized',network:'none',privateContent:'none',productionApproved:false
},null,2));
