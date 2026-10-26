/** PARITY frontend-only release. Original V131 Worker bytes and V132 systems retained.
 * This helper performs provider GETs only. Wrangler uploads an inactive version;
 * traffic activation is a separate, observable Cloudflare operation. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,readdirSync,mkdirSync,cpSync,existsSync} from 'node:fs';
import {join,resolve,relative} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
export const BASE='baa92c0cbdcce71bd0ae5862e574c90ac53d84a9';
export const WORKER='anevum-apex-prelaunch-gateway';
export const ACCOUNT='2f7ee83107240152097efd956a4e8335';
export const V131='44f5971b-4cc9-4e7e-ab6a-1adb6fc5c12e',V132='de673bf1-ef05-4276-af16-2ee8713d965c';
export const LIVE_V136_003='72f35ec3-e046-4f75-ae65-19fa672b87c9';
export const LIVE_DEPLOY_003='f2f950d8-8ec6-42cd-80c2-06681ad2fcf9';
export const LIVE_V136_005='cf058439-2487-4b96-b183-94a5c419f3cb';
export const SESSION='ANEVUM.WEB.RELEASE.2026-10-25.004.CONTROLLED-UI-ROLLOUT';
export const GATEWAY='1884ff0dd3c8aa3d38711167af0b4552c9b200b3148e72d9ba6d90d23171ef99';
const ROOT=`/accounts/${ACCOUNT}/workers/scripts/${WORKER}`;
const ZONE='8abe27259b5436af5966d3b40d9a3760';
const git=(...a)=>execFileSync('git',a,{encoding:'utf8'}).trim();
const hash=b=>createHash('sha256').update(b).digest('hex');
const load=p=>JSON.parse(readFileSync(p,'utf8'));
const save=(p,v)=>writeFileSync(p,JSON.stringify(v,null,2)+'\n');
const stable=x=>JSON.stringify(x,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b))):v);
const allowed=new Set([
 'creator-v1/ops/parity-v136-asset-pair.mjs','creator-v1/test/parity-v136-asset-pair.test.mjs',
 'creator-v1/web/src/pages/NativeCreatorStudio.tsx',
 'creator-v1/source-ide/language-v119.mjs','creator-v1/source-ide/language-v119.d.mts',
 'creator-v1/test/source-archive-v136.test.mjs','creator-v1/test/csp-meshopt-v136.test.mjs',
 ...['ArtifactWorkbenchV136.tsx','MonacoSourceV136.tsx','source-archive-v136.ts','artifact-workbench-v136.css'].map(x=>'creator-v1/web/src/parity/'+x),
 'package.json',
 'creator-v1/graphics/build-institute-assets.mjs',
 'creator-v1/graphics/inspect-institute-assets.mjs','creator-v1/graphics/build-institute-textures.mjs',
 'docs/production/parity-v136-webgl-asset-overhaul-20261024.md',
 ...['InstituteRendererV136.ts','InstituteHorizonV136017.ts','InstituteCitadelsV136017.ts','InstituteMaterialsV136.ts','CspMeshoptDecoderV136.ts','MeshoptDecodeWorkerV136.ts','meshopt-reference-v136.d.ts','InstituteAssetManifestV136.ts','institute-optics-v136.css'].map(x=>'creator-v1/web/src/parity/'+x),
 ...['manifest.json','texture-manifest.json','THIRD_PARTY_NOTICES.md',...['mobile','desktop'].flatMap(t=>['astc_rgba','bc7_rgba','etc2_rgba'].map(f=>'alloy-normal-'+t+'-'+f+'.ktx')),...['atrium','archive','forge','relay'].flatMap(f=>['mobile','desktop'].map(t=>f+'-'+t+'.glb'))].map(x=>'creator-v1/web/public/assets/institute/v136-011/'+x),
 '.github/workflows/parity-v136-release.yml','creator-v1/ops/parity-v136-release.mjs',
 '.github/workflows/parity-v136-scene-qa.yml',
 'creator-v1/test/parity-v136-scene-director.test.mjs',
 'creator-v1/test/parity-v136-citadel-geometry.test.mjs',
 'creator-v1/test/parity-v136-spatial-render-browser.mjs',
 'docs/production/parity-v136-continuance-spatial-system-20261024.md',
 ...['SceneDirectorV136.ts','scene-materials-v136.css','ArtifactLensV136.tsx','artifact-lens-v136.css'].map(x=>'creator-v1/web/src/parity/'+x),
 'creator-v1/test/parity-v136-discover-browser.mjs',
 'creator-v1/web/src/pages/DiscoverPage.tsx',
 'creator-v1/web/src/pages/CommunityPage.tsx',
 // V136.017 public-directory and profile UI; no permissions, schema or API changes.
 'creator-v1/web/src/pages/CreatorsPage.tsx',
 'creator-v1/web/src/pages/Phase1PublicMemberPage.tsx',
 'creator-v1/web/src/pages/PublicBoardsPage.tsx',
 'creator-v1/web/src/pages/CanonicalStudioPage.tsx',
 'creator-v1/web/src/components/CompactMemberIdentity.tsx',
 'creator-v1/web/src/parity/SpatialSurfaceV136.tsx',
 'creator-v1/web/src/parity/StudioSpatialWorkspaceV136.tsx',
 'creator-v1/web/src/parity/studio-spatial-workspace-v136.css',
 'docs/production/anevum-workstreams-consolidation-20261024.md',
 'creator-v1/web/src/parity/spatial-surface-v136.css',
 'creator-v1/web/src/pages/CanonicalSavedWorksPage.tsx',
 'creator-v1/web/src/pages/canonical-saved-works.css',
 'creator-v1/web/src/components/CosmicArtwork.tsx',
 'creator-v1/web/src/components/ProjectCard.tsx',
 'creator-v1/web/src/components/CreatorPackageGallery.tsx',
 'creator-v1/web/src/components/CompactMemberIdentity.tsx',
 'creator-v1/web/src/components/BadgeInsignia.tsx',
 'creator-v1/web/src/components/OrbitalMark.tsx',
 'creator-v1/web/src/components/Icons.tsx',
 'docs/production/parity-v136-living-world-20261024.md',
 ...['LivingRecognition.tsx','living-recognition-v136.css'].map(x=>'creator-v1/web/src/parity/'+x),
 ...['LivingWorldState.tsx','LivingWorldField.tsx','LivingWorldGlyph.tsx','living-world-shaders.ts','living-world-v136.css'].map(x=>'creator-v1/web/src/parity/'+x),
 'creator-v1/web/src/parity/ParityDiscoverV136.tsx',
 'creator-v1/web/src/parity/parity-discover-v136.css',
 // UI-only fixed category covers; creator-uploaded imagery remains the priority.
 'creator-v1/web/src/parity/CategoryCoverV136.tsx',
 'creator-v1/web/src/parity/category-cover-v136.css',
 'creator-v1/test/parity-v136-full-browser.mjs','docs/production/parity-v136-release-20261024.md',
 'creator-v1/web/src/main.tsx','creator-v1/web/vite.config.ts',
 'creator-v1/web/src/parity/ControllerBridgeV136.tsx',
 'creator-v1/web/src/parity/controller-input-v136.ts',
 'creator-v1/web/src/parity/controller-bridge-v136.css',
 'creator-v1/test/parity-v136-controller.test.mjs',
 'docs/production/parity-v136-controller-integration-20261024.md',
  'docs/production/parity-v136-cinematic-continuance-20261024.md',
  'docs/production/parity-v136-cinematic-production-20261024.md',
  '.github/workflows/parity-v136-cinematic-production.yml',
  'creator-v1/graphics/author-cinematic-institute-v136.py',
  'creator-v1/graphics/inspect-cinematic-camera-v136.mjs',
  'creator-v1/graphics/lod-cinematic-institute-v136.py',
  'creator-v1/graphics/optimize-cinematic-runtime-v136.mjs',
  'creator-v1/web/src/parity/CinematicStageGeometryV136.ts',
  'creator-v1/test/parity-v136-stage-geometry.test.mjs',
  'creator-v1/test/parity-v136-cinematic-stage-browser.mjs',
  'docs/production/parity-v136-cinematic-runtime-20261024.md',
  'creator-v1/test/parity-v136-camera-registration.test.mjs',
  'docs/production/parity-v136-cinematic-camera-handoff-20261024.md',
  'creator-v1/web/src/parity/CinematicCameraRegistrationV136.ts',
  'creator-v1/graphics/encode-cinematic-v136.mjs',
  'creator-v1/graphics/inspect-cinematic-candidate-v136.mjs',
  'creator-v1/graphics/smoke-cinematic-v136.mjs',
  'creator-v1/test/parity-v136-media-contract.test.mjs',
  ...['CinematicMediaContractV136.ts','CinematicFramesV136.tsx','CinematicVideoV136.tsx'].map(x=>'creator-v1/web/src/parity/'+x),
  'creator-v1/test/parity-v136-cinematic.test.mjs',
  'creator-v1/graphics/inspect-cinematic-v136.mjs',
  ...['CinematicArrivalV136.tsx','cinematic-director-v136.ts','cinematic-arrival-v136.css'].map(x=>'creator-v1/web/src/parity/'+x),
  'creator-v1/web/public/assets/cinematic-v136/arrival/manifest.json',
  'creator-v1/web/src/parity/ContinuanceInstrumentV136017.tsx',
  'creator-v1/web/src/parity/FileGlyphV136017.tsx',
  'creator-v1/web/src/parity/workbench-file-ops-v136.ts',
  'creator-v1/web/src/parity/concept-convergence-v136017.css',
  'creator-v1/test/parity-v136-concept-convergence.test.mjs',
  'creator-v1/test/cinematic-worlds.test.mjs',
  'docs/production/parity-v136-concept-convergence-20261024.md',
 'creator-v1/web/src/components/Shell.tsx',
 'creator-v1/web/src/parity/ConsoleWayfinderV136.tsx',
 'creator-v1/web/src/parity/console-wayfinder-v136.css','creator-v1/web/src/pages/CinematicLandingPage.tsx',
 ...['ParityHeaderV136.tsx','ParityPortalV136.tsx','ParityScene.tsx','visual-foundation-v136.css'].map(x=>'creator-v1/web/src/parity/'+x),
 ...['institute-768.webp','institute-1536.webp','institute-1672.webp','manifest.json'].map(x=>'creator-v1/web/public/assets/parity-v136/'+x)
]);
// Owner authorized the reviewed unified UI release on 2026-10-25. Newly
// reviewed paths are pinned to exact Git blobs (null means reviewed deletion),
// rather than granting broad authority to future edits in those directories.
export const REVIEWED_UI_BLOBS=Object.freeze({
 "creator-v1/test/canonical-saved-works-v009.test.mjs": "d4128333e90b0439f4d7f6caa3cbd12f85163d0e",
 "creator-v1/test/capture-community-hub-v007.mjs": "5a778c66aa6da5e8a11aff376a251caeb2652e7a",
 "creator-v1/test/cinematic-depth-v011.test.mjs": "d4736e525de382434c028c6b9338746a65cb92f4",
 "creator-v1/test/free-launch-kit-v136018.test.mjs": "651f634bf0be571c18b9ab2bd6b9cb3dceffddf7",
 "creator-v1/test/package-gallery-v010.test.mjs": "736598f412a63d08bb08b214849605d2a91c3e7b",
 "creator-v1/test/parity-v136-integrated-overhaul.test.mjs": "10be6fcc7079e3c8ccaf237a8eaf62adaa58535b",
 "creator-v1/test/parity-v136-member-world.test.mjs": "2c83fa8cc628ab460a5cbfd48f6c6c5285f590f2",
 "creator-v1/test/parity-v136-release-scope.test.mjs": "95f69bf641e656de016819e14dc08e3bfbbbe902",
 "creator-v1/test/parity-v136-sitewide-art-retirement.test.mjs": "5eb4ad970f1194f914be4deb078bd9c97dc82ebb",
 "creator-v1/test/parity-v136-thumbnails.test.mjs": "f765c109932d384e36f58e4900106e921058238a",
 "creator-v1/test/portal-offline-preview.mjs": "193a27e596cd3c7b6332dd50aa701326c46b198f",
 "creator-v1/test/visual-kit-v010.test.mjs": "499e4b1dbebc6d31644b971b2db4aabea5f4ba9c",
 "creator-v1/web/AGENTS.md": "0b95d4d8936da49333a24fbd3036a868262ce776",
 "creator-v1/web/public/assets/cinematic-v2/atmosphere/manifest.json": "31b44047ee7e9658b7b92747ee9bc65d5f8a8d08",
 "creator-v1/web/public/assets/cinematic-v2/atmosphere/orbital-dust-desktop.webp": null,
 "creator-v1/web/public/assets/cinematic-v2/atmosphere/orbital-dust-mobile.webp": null,
 "creator-v1/web/public/assets/cinematic-v2/atmosphere/orbital-haze-desktop.webp": null,
 "creator-v1/web/public/assets/cinematic-v2/atmosphere/orbital-haze-mobile.webp": null,
 "creator-v1/web/public/assets/cinematic/categories/apps.webp": null,
 "creator-v1/web/public/assets/cinematic/categories/automation.webp": null,
 "creator-v1/web/public/assets/cinematic/categories/creative.webp": null,
 "creator-v1/web/public/assets/cinematic/categories/games.webp": null,
 "creator-v1/web/public/assets/cinematic/categories/learning.webp": null,
 "creator-v1/web/public/assets/cinematic/categories/libraries.webp": null,
 "creator-v1/web/public/assets/cinematic/categories/other.webp": null,
 "creator-v1/web/public/assets/cinematic/categories/research.webp": null,
 "creator-v1/web/public/assets/cinematic/hero/portal-world.webp": null,
 "creator-v1/web/public/assets/cinematic/hero/skyward-city.webp": null,
 "creator-v1/web/public/assets/cinematic/manifest.json": "13c98be67160e9464420f796e2ffeeae8ec84c1a",
 "creator-v1/web/public/assets/community-portals/creative-1536.webp": null,
 "creator-v1/web/public/assets/community-portals/creative-768.webp": null,
 "creator-v1/web/public/assets/community-portals/games-1536.webp": null,
 "creator-v1/web/public/assets/community-portals/games-768.webp": null,
 "creator-v1/web/public/assets/community-portals/libraries-1536.webp": null,
 "creator-v1/web/public/assets/community-portals/libraries-768.webp": null,
 "creator-v1/web/public/assets/community-portals/manifest.json": "3ca675b3d0f47eaaa61d437ba504f2881ddea1c0",
 "creator-v1/web/public/assets/community-portals/tools-1536.webp": null,
 "creator-v1/web/public/assets/community-portals/tools-768.webp": null,
 "creator-v1/web/public/assets/default-thumbnails/automation.svg": "371c789d9d698fd92087a80f4c24a037b7a9a284",
 "creator-v1/web/public/assets/default-thumbnails/creative.svg": "a3f351101c20153558bb7c037c6388ae531b69f4",
 "creator-v1/web/public/assets/default-thumbnails/games.svg": "be5b193952976d8fd99d07b301ae1edd3d2a9b5f",
 "creator-v1/web/public/assets/default-thumbnails/learning.svg": "4c88beed18031f59135b67fb3022cfeb5ddbd447",
 "creator-v1/web/public/assets/default-thumbnails/libraries.svg": "76db375c4002a4d8abfcd40c10c79f5359df830e",
 "creator-v1/web/public/assets/default-thumbnails/other.svg": "4fe76eff037b3c74f957c6ba135aaf46e4f5091b",
 "creator-v1/web/public/assets/default-thumbnails/research.svg": "43e0d312de02aec48d41917ad36c9c446e766cb7",
 "creator-v1/web/public/assets/default-thumbnails/simulation.svg": "334b34304346c4b21f61e5281f3edd4521c54747",
 "creator-v1/web/public/assets/default-thumbnails/story.svg": "a5d715f2a48b0ab094b32d7adf2e1fedb4de7c1f",
 "creator-v1/web/public/assets/default-thumbnails/tools.svg": "e07c045ea5097a99852c09db25248f6eeb5ef666",
 "creator-v1/web/src/components/CinematicAtmosphere.tsx": "67a75e6eb7d1d5ec30876be8b68df6f9bf1f6a67",
 "creator-v1/web/src/components/CinematicCatalogueSections.tsx": "c91f52547ea44eebd06ee3ba0ef675e66ddb88a3",
 "creator-v1/web/src/components/CinematicDepthLayers.tsx": "c5ad15a3cc16d9384d532c8ddad469efd4df4be6",
 "creator-v1/web/src/components/CinematicDiscoverySections.tsx": "6544e85fcf578ba599ef83152e1542f194e040c6",
 "creator-v1/web/src/components/CommunityHomeFeed.tsx": "7444fde584fc7edd3a0eb3d2217510812593a8d8",
 "creator-v1/web/src/components/MemberPortrait.tsx": "c6a0a2d5d63f15e8ba2311e80e80ee20c55b42d7",
 "creator-v1/web/src/components/MemberSpaceDashboard.tsx": "b97f2c7ddd7ee8600adbb5560ae86949c19722f8",
 "creator-v1/web/src/components/ProjectLaunchKit.tsx": "f477a73096259dd44e37f29e93a69b4bb444e383",
 "creator-v1/web/src/components/ProjectPlayerShell.tsx": "54d74a6ee2cf0434d6248f9df3bd154da7eb0a02",
 "creator-v1/web/src/components/ProjectThumbnail.tsx": "6aa0512b792b8e688c0183e6ad37623767298022",
 "creator-v1/web/src/components/VisualKit.tsx": "a9dcc6ee9108d7dfef4cdb96ea349c1f5aebb43c",
 "creator-v1/web/src/components/project-launch-kit-v136018.css": "9462e52ed779e74305a7f83fc9db5bbc956fbeac",
 "creator-v1/web/src/lib/launch-kit-v136018.ts": "8d941ca49f5a698f12058e0c53a933f08be81410",
 "creator-v1/web/src/lib/project-thumbnails.ts": "28ee912139cd48a8908f6619ab1d67ec6f619bfc",
 "creator-v1/web/src/member-space.css": "261b8841f14dc4f1ba1eb23306c662980e1401aa",
 "creator-v1/web/src/pages/ProjectPage.tsx": "805df6cc2eee6bacf8dc32e0deb2a9920e414fba",
 "creator-v1/web/src/parity/sitewide-interface-v136.css": "a4a9565a1c8225ccb7c900ffa76921c3b52202ca",
 "docs/production/ACTIVE-V136-WEB-OVERHAUL.md": "6abe12e9abbb8ebf6c1e5155228f4592eaa3e494",
 "docs/production/ANEVUM-MASTER-CONTINUITY.md": "453be434cb49c140a49138adf1da2493ff92f340",
 "docs/production/parity-v136-free-launch-companion-20261024.md": "3655321aab3016bac5038a0ad4f30fd588d0da92",
 "docs/production/parity-v136-unified-ui-release-20261025.md": "74d611e69103405729cafa7da1b6ecb743e919ea",
 "docs/production/parity-v136018-sitewide-visual-retirement-20261025.md": "36b7178ef8b1ce82521981e5be27572a396d761f",
 "docs/production/parity-v136019-creator-thumbnail-fallback-20261025.md": "746d61da9dc9eb1c0a521f869425248095d5cad8"
});
export function verifySourcePaths(paths,blobAtPath){
 for(const path of paths){
  if(allowed.has(path))continue;
  assert.ok(Object.hasOwn(REVIEWED_UI_BLOBS,path),'Unreviewed release change '+path);
  assert.equal(blobAtPath(path),REVIEWED_UI_BLOBS[path],'Reviewed UI file bytes changed '+path);
 }
}
function headBlob(path){
 const entry=git('ls-tree','HEAD','--',path);
 if(!entry)return null;
 const match=entry.match(/^100(?:644|755) blob ([a-f0-9]{40})\t/);
 assert.ok(match,'Reviewed UI path must be a regular file '+path);
 return match[1];
}
export function source(){
 // Staged cinematic geometry/video are reviewed artifacts only. Never permit
 // deployment or packaging with either private QA or unapproved media flags.
 assert.notEqual(process.env.VITE_ANEVUM_OWNER_REVIEW,'true','Owner-review media must never enter production packaging');
 assert.notEqual(process.env.VITE_PARITY_V136_HORIZON_QA,'true',
  'Unapproved planetary art QA must be disabled in release');
 assert.notEqual(process.env.VITE_PARITY_V136_SHARED_SCENE_QA,'true',
  'Shared cinematic scene QA flag must be disabled in release');
 assert.notEqual(process.env.VITE_PARITY_V136_NATIVE_VIDEO,'true',
  'Native video requires independently reviewed CSP/media deployment');
 git('merge-base','--is-ancestor',BASE,'HEAD');
 // Allow this renderer's pinned additions without permitting collateral changes
 // to auth/runtime dependencies through the package.json allowlist.
 const baseline=JSON.parse(git('show',BASE+':package.json')),current=load('package.json');
 const additions={dependencies:{three:'0.180.0','monaco-editor':'0.55.1',fflate:'0.8.2'},devDependencies:{'@types/three':'0.180.0','@gltf-transform/core':'4.2.1','@gltf-transform/extensions':'4.2.1','@gltf-transform/functions':'4.2.1',meshoptimizer:'0.24.0',basisu:'1.16.3'}};
 for(const field of ['dependencies','devDependencies'])assert.deepEqual(current[field],{...baseline[field],...additions[field]},'Only pinned graphics dependencies may change');
 assert.deepEqual(current.scripts,baseline.scripts,'Build and protected-system commands preserved');
 const changed=git('diff','--name-only',BASE,'HEAD').split('\n').filter(Boolean);
 assert.ok(changed.length);verifySourcePaths(changed,headBlob);
 assert.equal(git('diff','--name-only','--','creator-v1/web/src','creator-v1/apex-prelaunch','creator-v1/canonical-auth'),'','Uncommitted application edits');
 return {head:git('rev-parse','HEAD'),base:BASE,changed};
}
function walk(dir,root=dir){return readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(join(dir,e.name),root):[{path:join(dir,e.name).slice(root.length+1),sha256:hash(readFileSync(join(dir,e.name)))}]).sort((a,b)=>a.path.localeCompare(b.path));}
// These retired-art metadata records are build/audit inputs, not runtime URLs.
// Keep their new bytes under a versioned audit namespace. The existing public
// URLs retain baseline bytes for cached old clients and rollback. The shared
// asset packer's general conflicting-byte rejection is deliberately unchanged.
export const REVIEWED_METADATA=Object.freeze({
 'assets/parity-v136/manifest.json':'9f30256619e988d3d9c7f0c3e8b109ca50ccd17bdb53851d79dde67b31e58832',
 'assets/cinematic/manifest.json':'bf98bfff4e8e1a76d732c85a35ee2573f812c4f5678fc1c20829acf26d858b07',
 'assets/community-portals/manifest.json':'1747ff11a0ff47b62af5f1d38dc8c8d6f86cae5e403b754253d39adcafe34972',
 'assets/cinematic-v2/atmosphere/manifest.json':'ad9b76bf0c678616a7c0db039cf6da7edab86774711051ef645c7490e42e9946'
});
export function copyReleaseFrontend(freshRoot,dest){
 const records=Object.entries(REVIEWED_METADATA);
 for(const [path,expected] of records){
  assert.equal(hash(readFileSync(join(freshRoot,path))),expected,'Unreviewed metadata bytes '+path);
 }
 for(const file of walk(freshRoot).filter(x=>/\.(js|css|html)$/.test(x.path))){
  const text=readFileSync(join(freshRoot,file.path),'utf8');
  for(const [path] of records)assert.ok(!text.includes(path)&&!text.includes(path.slice(7)),
   'Metadata relocation requires no current runtime consumer: '+path);
 }
 cpSync(freshRoot,dest,{recursive:true,filter:src=>!Object.hasOwn(REVIEWED_METADATA,relative(freshRoot,src).replaceAll('\\','/'))});
 const relocated=records.map(([path,sha256])=>({path,sha256,releasePath:'release-records/v136-ui-004/'+path}));
 for(const item of relocated){
  const target=join(dest,item.releasePath);mkdirSync(join(target,'..'),{recursive:true});
  cpSync(join(freshRoot,item.path),target);
 }
 return relocated;
}
export function pack(oldRoot,freshRoot,out){
 const identity=source();mkdirSync(out,{recursive:true});
 assert.equal(hash(readFileSync(join(oldRoot,'worker-bundle/gateway.js'))),GATEWAY);
 const media=walk(join(oldRoot,'compiled-web')).filter(x=>x.path.startsWith('evolution/assets/'));
 assert.equal(media.length,152);
 cpSync(join(oldRoot,'compiled-web'),join(out,'compiled-web'),{recursive:true});
 const metadataRecords=copyReleaseFrontend(freshRoot,join(out,'compiled-web'));
 cpSync(join(oldRoot,'worker-bundle'),join(out,'worker-bundle'),{recursive:true});
 assert.deepEqual(walk(join(out,'compiled-web')).filter(x=>x.path.startsWith('evolution/assets/')),media);
 const inventory=walk(join(out,'compiled-web'));assert.equal(inventory.some(x=>x.path.endsWith('.map')),false);
 const report={session:SESSION,source:identity,worker:WORKER,gatewaySha256:GATEWAY,metadataRecords,
  assetCount:inventory.length,assetsSha256:hash(stable(inventory)),earnedMediaCount:media.length,
  originalBackendUnchanged:true,uploaded:false,activated:false,authenticatedAcceptance:false,physicalSafariAcceptance:false};
 save(join(out,'manifest.json'),report);save(join(out,'assets.json'),inventory);return report;
}
async function get(path){
 assert.ok(process.env.CLOUDFLARE_API_TOKEN?.length>15,'Cloudflare token required');
 const response=await fetch('https://api.cloudflare.com/client/v4'+path,{headers:{Authorization:'Bearer '+process.env.CLOUDFLARE_API_TOKEN},signal:AbortSignal.timeout(30000),redirect:'error'});
 const j=await response.json();assert.ok(response.ok&&j.success,'Provider GET failed '+path+' '+response.status);return j.result;
}
const signatures=b=>b.map(x=>({name:x.name,type:x.type,...(x.type==='plain_text'?{text:x.text}:{}),...(x.type==='d1'?{database_id:x.database_id}:{})})).sort((a,b)=>a.name.localeCompare(b.name));
async function snapshot(){
 const [deploy,settings,original,controller,routes,versions]=await Promise.all([
  get(ROOT+'/deployments'),get(ROOT+'/settings'),get(ROOT+'/versions/'+V131),
  get(`/accounts/${ACCOUNT}/workers/scripts/anevum-package-alpha-v003-control/deployments`),
  get(`/zones/${ZONE}/workers/routes`),get(ROOT+'/versions?per_page=100')]);
 return {deployment:deploy.deployments[0],settings,original,controller:controller.deployments[0],routes,versions:versions.items};
}
function verifyBefore(s){
 assert.equal(s.deployment.id,LIVE_DEPLOY_003,'Production changed; inspect before retry');
 assert.deepEqual(s.deployment.versions,[{version_id:LIVE_V136_003,percentage:99},{version_id:LIVE_V136_005,percentage:1}]);
 assert.equal(s.settings.bindings.length,26);assert.deepEqual(signatures(s.settings.bindings),signatures(s.original.resources.bindings));
 assert.equal(s.controller.id,'4c832ec7-ce67-4864-832c-9b0b470af92d','Controller changed; inspect');
 assert.equal(s.routes.length,40,'Route inventory changed; inspect');
 const vars=Object.fromEntries(s.settings.bindings.filter(x=>x.type==='plain_text').map(x=>[x.name,x.text]));
 assert.equal(vars.CANONICAL_XP_TEST_ENABLED,'false');assert.equal(vars.CANONICAL_CREATOR_UPLOADS_ENABLED,'false');
 assert.equal(vars.ANEVUM_PRELAUNCH_MODE,'public');assert.equal(vars.CANONICAL_PUBLIC_SIGNUP_ENABLED,'true');
}
async function before(out){
 const p=load(join(out,'manifest.json'));assert.equal(p.source.head,git('rev-parse','HEAD'));assert.equal(p.gatewaySha256,GATEWAY);
 assert.equal(hash(stable(walk(join(out,'compiled-web')))),p.assetsSha256);assert.equal(hash(readFileSync(join(out,'worker-bundle/gateway.js'))),GATEWAY);
 const s=await snapshot();verifyBefore(s);save(join(out,'provider-before.json'),s);
 const runtime=s.original.resources.script_runtime;
 const config={name:WORKER,account_id:ACCOUNT,main:resolve(out,'worker-bundle/gateway.js'),no_bundle:true,
  compatibility_date:runtime.compatibility_date,compatibility_flags:runtime.compatibility_flags,workers_dev:false,preview_urls:false,routes:[],upload_source_maps:false,
  assets:{directory:resolve(out,'compiled-web'),binding:'ASSETS',run_worker_first:true,not_found_handling:'single-page-application'},
  vars:Object.fromEntries(s.settings.bindings.filter(x=>x.type==='plain_text').map(x=>[x.name,x.text])),
  d1_databases:s.settings.bindings.filter(x=>x.type==='d1').map(x=>({binding:x.name,database_id:x.database_id}))};
 save(join(out,'upload.json'),config);return {status:'INACTIVE_UPLOAD_PREFLIGHT_PASS',source:p.source.head,bindings:26,secretNamesOnly:true};
}
async function after(out){
 const original=load(join(out,'provider-before.json'));const now=await snapshot();verifyBefore(now);
 assert.equal(stable(now.deployment),stable(original.deployment));assert.equal(stable(now.controller),stable(original.controller));assert.equal(stable(now.routes),stable(original.routes));
 assert.deepEqual(signatures(now.settings.bindings),signatures(original.settings.bindings));
 const added=now.versions.filter(x=>!original.versions.some(y=>y.id===x.id));assert.equal(added.length,1);
 const v=await get(ROOT+'/versions/'+added[0].id);
 assert.deepEqual(signatures(v.resources.bindings),signatures(original.original.resources.bindings));
 assert.deepEqual(v.resources.script_runtime,original.original.resources.script_runtime);
 const packageManifest=load(join(out,'manifest.json'));
 const label=packageManifest.releaseVariant==='baseline-assets-only'?'baseline-assets-only':'frontend';
 assert.equal(v.annotations?.['workers/message'],'PARITY V136 '+label+' '+git('rev-parse','HEAD')+'; V131 gateway unchanged; INACTIVE');
 const result={status:'VERIFIED_INACTIVE_PARITY_VERSION',releaseVariant:packageManifest.releaseVariant||'candidate',frontendSourceHead:packageManifest.frontendSourceHead||git('rev-parse','HEAD'),sharedAssetsSha256:packageManifest.sharedAssetsSha256||null,version:v.id,number:v.number,source:git('rev-parse','HEAD'),gatewaySha256:GATEWAY,rollback:[LIVE_V136_003,LIVE_V136_005,V131,V132],trafficChanged:false,controllerChanged:false,bindingsPreserved:true,routesPreserved:true,memberDataChanged:false};
 save(join(out,'inactive-receipt.json'),result);return result;
}
const [cmd,...args]=process.argv.slice(2);
if(cmd==='source')console.log(JSON.stringify(source()));
else if(cmd==='package')console.log(JSON.stringify(pack(...args)));
else if(cmd==='before')console.log(JSON.stringify(await before(...args)));
else if(cmd==='after')console.log(JSON.stringify(await after(...args)));
