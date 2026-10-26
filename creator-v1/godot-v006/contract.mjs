/**
 * ANEVUM Creator / Godot Web V006.
 *
 * Structural screening only. This is NOT a malware scan, trusted engine proof,
 * browser certification, or authorization to publish. The isolated runtime,
 * resource quotas and human publication gate remain authoritative.
 */
const ROOT_GODOT_ASSET=/^[a-zA-Z0-9][a-zA-Z0-9._-]*\.(?:pck|wasm|js)$/;
const VERSION=/^4\.(?:[3-9]|[1-9][0-9])(?:\.[0-9]{1,3})?$/;
const INPUTS=new Set(["keyboard","mouse","touch","gamepad"]);
export const GODOT_WEB_LIMITS=Object.freeze({
  legacyZipBytes:20*1048576,
  legacyFileBytes:12*1048576,
  legacyExpandedBytes:48*1048576
});

export function classifyGodotWeb(entries=[]) {
  const paths=new Set(entries.map(item=>item.path));
  const files=entries.filter(item=>typeof item.path==="string"&&ROOT_GODOT_ASSET.test(item.path));
  const asset=(ext)=>files.filter(item=>item.path.endsWith("."+ext));
  const packs=asset("pck"),wasms=asset("wasm"),scripts=asset("js");
  const source=paths.has("project.godot");
  const isGodot=source||packs.length>0;
  const issues=[];
  const add=(code,severity,message,fix)=>issues.push({code,severity,message,fix});
  if(!isGodot)return {kind:"not-godot",issues:[],legacyUploadEligible:null,exportFiles:null};
  const html=paths.has("index.html");
  const kind=html?"godot-web":"godot-source";
  if(!html)add("AEP_GODOT_ENTRY","blocker","A Godot Web export needs a root index.html.","Export the project using Godot's Web preset, then package the exported files.");
  if(source)add("AEP_GODOT_SOURCE_INCLUDED","blocker","Godot project source is mixed into the browser package.","Upload the Web export only. Keep project.godot, scenes, and source files in the development repository.");
  if(packs.length!==1||wasms.length!==1||scripts.length!==1)
    add("AEP_GODOT_COMPONENTS","blocker","Godot web export needs one root .pck, .wasm and .js file.","Keep the complete export together; do not rename generated files.");
  const stems=[packs[0],wasms[0],scripts[0]].map(item=>item?.path?.slice(0,item.path.lastIndexOf(".")));
  if(stems.every(Boolean)&&new Set(stems).size!==1)
    add("AEP_GODOT_FILENAMES","blocker","Godot Web asset names do not share one base name.","Export all files to the same directory and keep their generated names.");
  const total=entries.reduce((sum,x)=>sum+(Number(x.unpacked)||0),0);
  const largest=Math.max(0,...entries.map(x=>Number(x.unpacked)||0));
  const large=largest>GODOT_WEB_LIMITS.legacyFileBytes||total>GODOT_WEB_LIMITS.legacyExpandedBytes;
  if(large)add("AEP_GODOT_LARGE_BUILD","blocker","This Godot export exceeds the Creator alpha's small-build limits.","Use the isolated, reviewed large-build publishing pipeline. Do not split or truncate engine files.");
  if(html)add("AEP_GODOT_REAL_DEVICE","warning","Godot Web needs WebGL 2.0 and real-device testing.","Check iOS Safari, Android Chrome, and desktop/controller inputs before approval.");
  if(html)add("AEP_GODOT_SANDBOX_SAVE","warning","Browser-local saves are not guaranteed inside the isolated player.","Treat user:// storage as temporary; ANEVUM cloud saves are not enabled.");
  return {kind,issues,legacyUploadEligible:html&&!issues.some(x=>x.severity==="blocker"),
    exportFiles:stems.every(Boolean)&&new Set(stems).size===1?
      {stem:stems[0],pack:packs[0].path,wasm:wasms[0].path,script:scripts[0].path}:null};
}

/** Optional ANEVUM metadata added *after* a Godot web export. */
export function validateGodotManifest(manifest) {
  if(!manifest||typeof manifest!=="object"||Array.isArray(manifest))return {ok:false,error:"Expected a manifest object"};
  if(manifest.schema!=="anevum.web.v1"||manifest.runtime!=="browser"||
    manifest.entrypoint!=="index.html"||!Array.isArray(manifest.permissions)||
    manifest.permissions.length!==0)
    return {ok:false,error:"Manifest must target the permission-free ANEVUM browser runtime"};
  const e=manifest.engine;
  if(!e||typeof e!=="object"||Array.isArray(e)||e.name!=="godot"||
    typeof e.version!=="string"||!VERSION.test(e.version))
    return {ok:false,error:"Declare a supported Godot 4.x version"};
  if(!Array.isArray(manifest.inputs)||manifest.inputs.length<1||
    manifest.inputs.some(i=>typeof i!=="string"||!INPUTS.has(i))||
    new Set(manifest.inputs).size!==manifest.inputs.length)
    return {ok:false,error:"Declare distinct keyboard, mouse, touch and/or gamepad inputs"};
  if(manifest.save!=="ephemeral")
    return {ok:false,error:"Cloud saves are not supported in the V006 preview; save must be ephemeral"};
  if(typeof manifest.title!=="string"||manifest.title.length<3||manifest.title.length>100||
    /[\x00-\x1f\x7f]/.test(manifest.title))
    return {ok:false,error:"Provide a valid title of 3–100 characters"};
  return {ok:true,engine:e.name,version:e.version,inputs:manifest.inputs};
}
