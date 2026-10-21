/* ANEVUM Creator Compatibility v005 — advisory, never a safety or publication verdict.
 * Operates on structurally validated package entries; no execution or network access.
 */
export function detectCompatibility(entries, {sourceName="package.zip"}={}) {
  const paths=new Set(entries.map(x=>x.path));
  const has=x=>paths.has(x), suffix=x=>entries.some(e=>e.path.toLowerCase().endsWith(x));
  const issues=[];
  const add=(code,severity,message,fix)=>issues.push({code,severity,message,fix});
  const html=has("index.html");
  const sourceOnly=has("package.json")&&!html;
  const python=suffix(".py")||has("requirements.txt")||has("pyproject.toml");
  const godot=has("project.godot")||suffix(".pck");
  const unity=entries.some(e=>e.path.includes("Build/")&&/\.(wasm|data|framework\.js)$/.test(e.path));
  const wasm=suffix(".wasm");
  const manifest=has("anevum.json");
  let runtime=html?"web-static":sourceOnly?"web-source":python?"python-source":godot?"godot-source":"unknown";
  if(html&&godot)runtime="godot-web";
  else if(html&&unity)runtime="unity-web";
  else if(html&&wasm)runtime="web-wasm";
  if(!html)add("AEP_ENTRY_MISSING","blocker","No root index.html was found.","Export a browser-ready build and ZIP the contents of its output folder.");
  if(sourceOnly)add("AEP_SOURCE_ONLY","info","JavaScript source detected; a production web build is needed.","Run the project's documented build command, then ZIP the built output without node_modules or secrets.");
  if(python&&!html)add("AEP_PYTHON_SOURCE","info","Python source cannot run in the current browser player.","Provide a supported web export or link an externally hosted application.");
  if(godot&&!html)add("AEP_GODOT_EXPORT","info","Godot source or data detected without a web entrypoint.","Export for Web from Godot, then test browser and mobile support.");
  if(unity)add("AEP_UNITY_CONDITIONAL","warning","Unity WebGL may require additional headers, memory, and mobile testing.","Test the isolated runtime before claiming phone compatibility.");
  if(wasm)add("AEP_WASM_MOBILE","warning","WebAssembly support does not establish mobile compatibility.","Verify real iPhone Safari and Android Chrome performance and startup.");
  if(manifest)add("AEP_MANIFEST_UNVERIFIED","info","ANEVUM manifest found; upload validation remains authoritative.","Keep the manifest consistent with the actual browser build.");
  if(entries.some(e=>e.path.startsWith("node_modules/")))add("AEP_DEPENDENCIES_INCLUDED","warning","node_modules appears in the upload.","Upload the production build rather than the development dependency directory.");
  if(entries.some(e=>/(^|\/)(\.env(?:\.|$)|id_rsa|private\.key|credentials\.json)$/i.test(e.path)))add("AEP_POSSIBLE_SECRET","blocker","Possible secret or credential file detected.","Remove private credentials, rotate any exposed secrets, and export again.");
  if(entries.some(e=>e.path.startsWith("dist/")&&e.path.endsWith("index.html"))&&!html)add("AEP_NESTED_BUILD","blocker","A web entrypoint appears inside dist/, not at the ZIP root.","ZIP the contents of dist/, not the dist folder.");
  return {schemaVersion:"0.1",sourceName,runtime,entrypoint:html?"index.html":null,
    playableCandidate:html&&!issues.some(x=>x.severity==="blocker"),
    securityReviewed:false,mobileVerified:false,publicationApproved:false,issues};
}
