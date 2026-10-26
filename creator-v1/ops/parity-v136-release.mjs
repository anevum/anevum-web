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
export const LIVE_V136_003='ec5f106b-482c-4415-9c66-d6f8daf219ad';
export const LIVE_DEPLOY_003='77ceaf3d-5bfb-4f07-b64d-1655a3093065';
/* Production exact read-back; prevents release over an unexpectedly changed Worker. */
export const LIVE_V136_BETA_BASE='c53d8b9c-625b-459a-a8cc-67ebb50155fd';
export const LIVE_DEPLOY_BETA_BASE='5bdc7902-bdd5-458d-9295-a35ffb122c96';
export const LIVE_V136_005='cedb7ac1-74ca-4fcd-9a40-ce56964f1785';
export const SESSION='ANEVUM.WEB.BUILD.2026-10-26.001.STEALTH-BETA-CUTOVER';
export const UI_ORIGIN='f02be2199a62017928e51e5bfb8df6979ba6d735';
export const FROZEN_PRODUCT_SOURCE='4dfaed54fed606713a99b87c3152beddbcbc31f3';
export const ROUTES_SHA256='fa8abbaca3813f9172bbb1677c7a71068f4ab6c093b4f4835e67d7c70db5e67b';
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
 ".github/workflows/parity-v136-cinematic-production.yml": "6744a0790e2eb4bf8e7e2796f30f6d9535fcaba4",
 ".github/workflows/parity-v136-release.yml": "e7a568e2f0465283f469f15235160370509bc5d0",
 ".github/workflows/parity-v136-scene-qa.yml": "c03cb5e9d485f7b95a0d322d13bf77feaa1e27c1",
 ".github/workflows/parity-v136030-studio-preview.yml": "95f5ea288fc300f18cd4213dc931d6dbbcaf9942",
 ".github/workflows/v136-interactive-owner-review.yml": "9582940d6d8711fa921e9b6c11b5d76f39bcf238",
 "creator-v1/graphics/author-cinematic-institute-v136.py": "f6c16d5f64e2371ae83ed23e30d3a3fc82fda180",
 "creator-v1/graphics/build-institute-assets.mjs": "f4f7d4c835182ed4dc942603ca5323013c08f8a4",
 "creator-v1/graphics/build-institute-textures.mjs": "a7a02628156df67b42aa97330c0e9ed13f30c9ab",
 "creator-v1/graphics/encode-cinematic-v136.mjs": "2341d74613269a9abed350bcb5c44278cf32422b",
 "creator-v1/graphics/inspect-cinematic-camera-v136.mjs": "8f13dfd72dc98296cbf49b9dadc256cd6e47528a",
 "creator-v1/graphics/inspect-cinematic-candidate-v136.mjs": "9a8ed296e4bc57bb98ecd37ad0e1570c0747e646",
 "creator-v1/graphics/inspect-cinematic-v136.mjs": "3355f98a7ca0ff71c65b25b17fcd610f2a71c2eb",
 "creator-v1/graphics/inspect-institute-assets.mjs": "7bbcd5354fd06ee1f56c08b9f04217a1c3935c2f",
 "creator-v1/graphics/lod-cinematic-institute-v136.py": "7c66fba8896f37210a922766d24d464769c72943",
 "creator-v1/graphics/optimize-cinematic-runtime-v136.mjs": "b351dc348321cb4b75bcedb3006d7de96153e1a8",
 "creator-v1/graphics/smoke-cinematic-v136.mjs": "74e10c50e216d1cb46df8459b6e979155bdab102",
 "creator-v1/ops/parity-v136-asset-pair.mjs": "1897e3fd767307f0234e228a960cc75a397b6dfb",
 "creator-v1/source-ide/language-v119.d.mts": "105d58135ec8bbfb56c3aa6ed0c9d0be18f70061",
 "creator-v1/source-ide/language-v119.mjs": "718dc4c24c011a475f2e014c3728fd406dc814f3",
 "creator-v1/test/canonical-saved-works-v009.test.mjs": "d4128333e90b0439f4d7f6caa3cbd12f85163d0e",
 "creator-v1/test/capture-community-hub-v007.mjs": "5a778c66aa6da5e8a11aff376a251caeb2652e7a",
 "creator-v1/test/capture-iren-transmissions-v111.mjs": "83c99f3a6823ee8a93df46e1c6913f81a96f52c0",
 "creator-v1/test/cinematic-depth-v011.test.mjs": "d4736e525de382434c028c6b9338746a65cb92f4",
 "creator-v1/test/cinematic-worlds.test.mjs": "edcc528eb50e1bfa276d3df90b5b12e599528109",
 "creator-v1/test/community-hub-v007.test.mjs": "f24786915d2e6e084b57ee654feb0ee446e88dee",
 "creator-v1/test/csp-meshopt-v136.test.mjs": "177fbd144437ad415f3f68bf235be8c9e1e7f187",
 "creator-v1/test/free-launch-kit-v136018.test.mjs": "651f634bf0be571c18b9ab2bd6b9cb3dceffddf7",
 "creator-v1/test/home-navigation-v079.test.mjs": "726e92d638f82ae04c04acdcb87bf61071bf229b",
 "creator-v1/test/iren-guided-v080.test.mjs": "5ede7c9f6b717bec01639a9b7b4ba45425436176",
 "creator-v1/test/member-profile-ui.test.mjs": "789f32dfd5bc305c1f5d3a8d1582cfe47a1ee9e8",
 "creator-v1/test/motion-first-browser.mjs": "2ac6aeb44effa871ad667fc64b0b0d5a938c6654",
 "creator-v1/test/motion-first-media.test.mjs": "dbfafaa700dc600d9268d99df5bc817c3e6ad2ba",
 "creator-v1/test/native-compatibility-v101.test.mjs": "5b244a0028a0da5537cf00b97b22d2b341a1622a",
 "creator-v1/test/package-discovery-browser-v011.mjs": "a728b40b46fc35d4d1028ad9731948d75e29cc8b",
 "creator-v1/test/package-gallery-v010.test.mjs": "736598f412a63d08bb08b214849605d2a91c3e7b",
 "creator-v1/test/parity-v136-asset-pair.test.mjs": "34d6bd9684de30b2d09e3e7d2e371dc78c36f4aa",
 "creator-v1/test/parity-v136-camera-registration.test.mjs": "35833afe068235fc835b1f887241d35c7b917061",
 "creator-v1/test/parity-v136-cinematic-stage-browser.mjs": "7897493d4d532d4cfdf32c1ff8c7cdf56db990a6",
 "creator-v1/test/parity-v136-cinematic.test.mjs": "5436edddb2fbf71345541163fd224b05f369b36f",
 "creator-v1/test/parity-v136-citadel-geometry.test.mjs": "ab291bc915116f57f0cc8ad9708a752d89f04d8c",
 "creator-v1/test/parity-v136-concept-convergence.test.mjs": "b128d494aa694881daab9aab25d1fddcb00f9dbe",
 "creator-v1/test/parity-v136-controller.test.mjs": "df983aaebafc78e46ed4fdff2f0b765577884459",
 "creator-v1/test/parity-v136-discover-browser.mjs": "ee9191263e5ecae7bb9642602c9ff1c165e7b9ed",
 "creator-v1/test/parity-v136-full-browser.mjs": "56ecb9b7370dcfc00a5f47533d5f614e5ddd2aad",
 "creator-v1/test/parity-v136-integrated-overhaul.test.mjs": "5e4cb8919279a0f5bf80b223ca4c9cf88b90543c",
 "creator-v1/test/parity-v136-media-contract.test.mjs": "9c3b7be99a191e0ac4c739e7a707547028fca938",
 "creator-v1/test/parity-v136-member-world.test.mjs": "2c83fa8cc628ab460a5cbfd48f6c6c5285f590f2",
 "creator-v1/test/parity-v136-release-scope.test.mjs": "7ce46f75b0b979d93f8c39c10ef5d077ab9ffe5c",
 "creator-v1/test/parity-v136-scene-director.test.mjs": "f86e54398c12973a41e0149979ccc993b59cb288",
 "creator-v1/test/parity-v136-sitewide-art-retirement.test.mjs": "530045f19c56592dfced7c83081283aa2027ecb5",
 "creator-v1/test/parity-v136-spatial-render-browser.mjs": "dfa33f45aeb5fd3f85d0af84f66af4296e62eb56",
 "creator-v1/test/parity-v136-stage-geometry.test.mjs": "55a2acf3be027ca231081b2ac7c6f3a052200578",
 "creator-v1/test/parity-v136-thumbnails.test.mjs": "d38d024ba34058e18ac2e717c051f6dd69c639a1",
 "creator-v1/test/portal-launcher.test.mjs": "8445e5fdb749c7ba6776e1cba3ab68b61c773030",
 "creator-v1/test/portal-offline-preview.mjs": "3a8dbbe4c3252797070814505af768e97102a7b2",
 "creator-v1/test/portal-overhaul-contract.test.mjs": "dc36a77b385e17e2a438ad96767499119a387c0f",
 "creator-v1/test/react-public-navigation.test.mjs": "6a30a4d381ebc97e86798ffce8038723b175198c",
 "creator-v1/test/react-shell-contract.test.mjs": "3c2ba75bf6a153ff783bba962faeb04b4925a49e",
 "creator-v1/test/sitewide-experience-v009.test.mjs": "c9eb409068c81d07aa3f868723596aa9855bfeb8",
 "creator-v1/test/source-archive-v136.test.mjs": "824f00f1f667247b7113963deaf740b5c4809566",
 "creator-v1/test/transcosmic-observatory.test.mjs": "4fbc3ddbd46c23f56c108e3fe7997f1f7c936e5e",
 "creator-v1/test/visitor-onramp.test.mjs": "35fda579a952e330112c11541c5084fc617094d5",
 "creator-v1/test/visual-convergence-v136.test.mjs": "2700932e1ff82c1d1597588d6930601fc7483fa9",
 "creator-v1/test/visual-kit-v010.test.mjs": "499e4b1dbebc6d31644b971b2db4aabea5f4ba9c",
 "creator-v1/web/AGENTS.md": "0b95d4d8936da49333a24fbd3036a868262ce776",
 "creator-v1/web/index.html": "ad161c9ad9118c72dabaaf4cd69c3cc923a68038",
 "creator-v1/web/public/assets/cinematic-v136/arrival/manifest.json": "07468b0f27f4a8c03531b78fc3212e2aa2cfbde9",
 "creator-v1/web/public/assets/cinematic-v136/arrival/review-001/SOURCE.md": "5f1057a37d3d8f8bb103aa4b7cab8082be295d96",
 "creator-v1/web/public/assets/cinematic-v136/arrival/review-001/continuance-1440.mp4": "fb3dfaac145cacdbc22515370839572bc362b84d",
 "creator-v1/web/public/assets/cinematic-v136/arrival/review-001/continuance-1440.webm": "7f66819ba28544c814480fe17f8d17581202710d",
 "creator-v1/web/public/assets/cinematic-v136/arrival/review-001/continuance-1664.webp": "a13c075bb072af9c039044560738b115c8d9fbbd",
 "creator-v1/web/public/assets/cinematic-v136/arrival/review-001/continuance-640.webp": "9fbdc7b03ea5f74b26b8b4ee3d2205058a21fec8",
 "creator-v1/web/public/assets/cinematic-v136/arrival/review-001/continuance-720.mp4": "a73c7f7fd6106adb90295fd38a1293c586e7f7cd",
 "creator-v1/web/public/assets/cinematic-v136/arrival/review-001/continuance-720.webm": "dd941ff0f23a8233c769538e4d52ac9680d72a7e",
 "creator-v1/web/public/assets/cinematic-v136/arrival/review-001/continuance-960.webp": "e5643bc616b2b770cbc6d1174b78739294871d51",
 "creator-v1/web/public/assets/cinematic-v136/arrival/review-001/continuance-mobile.webp": "96d315a16fbfe8be6c070a2f8edb037c9ed56667",
 "creator-v1/web/public/assets/cinematic-v136/arrival/review-001/manifest.json": "b816bba7a633e47c37f90de6c2f591c6aa3bb700",
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
 "creator-v1/web/public/assets/default-thumbnails/automation.svg": "600a25cd1df75c2562dbf0d2a7a3c0eb4619f3e2",
 "creator-v1/web/public/assets/default-thumbnails/creative.svg": "2668ea8375f43f7a072a4cbb585b4c8414affe7d",
 "creator-v1/web/public/assets/default-thumbnails/games.svg": "a9791ebee978ae8e6167706c95ef44dec0dcff07",
 "creator-v1/web/public/assets/default-thumbnails/learning.svg": "8b7c6da699964d4d7940b6c0258605041e70dfd7",
 "creator-v1/web/public/assets/default-thumbnails/libraries.svg": "b2cacf8407ad34a56aba84676c31bce2c5b3ac1c",
 "creator-v1/web/public/assets/default-thumbnails/other.svg": "b181aba3c880044a8fe0f2d03301bb213c322b3b",
 "creator-v1/web/public/assets/default-thumbnails/research.svg": "d40512ce0a9b706904a701c40e1b2780efefbe61",
 "creator-v1/web/public/assets/default-thumbnails/simulation.svg": "7c9cdcf8ddfae4cc0ad1b9b9efe4d67a0e1bcf57",
 "creator-v1/web/public/assets/default-thumbnails/story.svg": "658cd617e8af0b601ae662dfd4c6ba88b7c2450c",
 "creator-v1/web/public/assets/default-thumbnails/tools.svg": "3002a6f54a7e39750a5bf815ad6b43cbda80c959",
 "creator-v1/web/public/assets/institute/v136-011/THIRD_PARTY_NOTICES.md": "6aef23267649b3c2419e9a41370b684cb8bcfa5d",
 "creator-v1/web/public/assets/institute/v136-011/alloy-normal-desktop-astc_rgba.ktx": "f9f8f9ed655b69f7675ba12947678b875d0c793b",
 "creator-v1/web/public/assets/institute/v136-011/alloy-normal-desktop-bc7_rgba.ktx": "5199c255476d45986f140fe77e8924edb8340928",
 "creator-v1/web/public/assets/institute/v136-011/alloy-normal-desktop-etc2_rgba.ktx": "2eb7af57485f0cef3d18e0625c9a70c847813bb4",
 "creator-v1/web/public/assets/institute/v136-011/alloy-normal-mobile-astc_rgba.ktx": "ca5ef25f74a59a2dfa88667fecd0be1c431e4fdd",
 "creator-v1/web/public/assets/institute/v136-011/alloy-normal-mobile-bc7_rgba.ktx": "13f3d6ddbe5280ba36feb268ea9a3894528b6c27",
 "creator-v1/web/public/assets/institute/v136-011/alloy-normal-mobile-etc2_rgba.ktx": "fc398303e1984e759c9e5d05058d77365666b0a7",
 "creator-v1/web/public/assets/institute/v136-011/archive-desktop.glb": "83af2ec54d7f93f7b37127d59a414644986f0eac",
 "creator-v1/web/public/assets/institute/v136-011/archive-mobile.glb": "e449faea38694a59478229fc09e3f32432bcf546",
 "creator-v1/web/public/assets/institute/v136-011/atrium-desktop.glb": "7d73d00c1e21f4bb32048445950c078064bb8605",
 "creator-v1/web/public/assets/institute/v136-011/atrium-mobile.glb": "85465900aa3580ca398617e529b963b34656b6e3",
 "creator-v1/web/public/assets/institute/v136-011/forge-desktop.glb": "785ca698a5a991e393aa94d4d534d886c3863f95",
 "creator-v1/web/public/assets/institute/v136-011/forge-mobile.glb": "3d209e374d70112b41065aadeb30c6693ac61ee5",
 "creator-v1/web/public/assets/institute/v136-011/manifest.json": "2c5c78c3f466c70f3091a0d7c2150dfe57db6b50",
 "creator-v1/web/public/assets/institute/v136-011/relay-desktop.glb": "d818b4120f4beb29989e1b295ca30e867e3ca9fd",
 "creator-v1/web/public/assets/institute/v136-011/relay-mobile.glb": "bd700e83b35848edf4b6baa3debe73edf3908493",
 "creator-v1/web/public/assets/institute/v136-011/texture-manifest.json": "9b6921f60a856579ada6294ab9c696c8850aaf92",
 "creator-v1/web/public/assets/parity-v136/manifest.json": "3908d9085cb09ee6a3260cb9d5a02068d2bda470",
 "creator-v1/web/public/favicon.svg": "2eada081498b941dca4f2bb1388b80a928ba2dcf",
 "creator-v1/web/public/site.webmanifest": "c1774537f5a619154b23deff47e306f69a54c5f4",
 "creator-v1/web/src/components/BadgeInsignia.tsx": "2e5c65b73f24795c9677d9b15cbf86011c92348a",
 "creator-v1/web/src/components/CinematicAtmosphere.tsx": "67a75e6eb7d1d5ec30876be8b68df6f9bf1f6a67",
 "creator-v1/web/src/components/CinematicCatalogueSections.tsx": "c91f52547ea44eebd06ee3ba0ef675e66ddb88a3",
 "creator-v1/web/src/components/CinematicDepthLayers.tsx": "c5ad15a3cc16d9384d532c8ddad469efd4df4be6",
 "creator-v1/web/src/components/CinematicDiscoverySections.tsx": "6544e85fcf578ba599ef83152e1542f194e040c6",
 "creator-v1/web/src/components/CinematicSiteRail.tsx": "47dd1ab52c51df09cba87747bf011ddcb2f6e425",
 "creator-v1/web/src/components/CommunityHomeFeed.tsx": "b0d55c03eb3299d148fdd3bce9bec57e7aa44150",
 "creator-v1/web/src/components/CompactMemberIdentity.tsx": "d519f8796352db5a4c3f7a2a6e1609301a4fda0c",
 "creator-v1/web/src/components/CosmicArtwork.tsx": "5ef07bbedade462f61ddd2db87b61a9742eddf8e",
 "creator-v1/web/src/components/CreatorPackageGallery.tsx": "5a0f004b25b3d69417f5f7eb0a6788b712809629",
 "creator-v1/web/src/components/Icons.tsx": "94cdbc74a60ae2b7ae4f22b8ac62d045d34dc27f",
 "creator-v1/web/src/components/IrenLivingCanvas.tsx": "496630e7011fdb33ee3769d93717a6db8c8735b8",
 "creator-v1/web/src/components/IrenGuidedContinuance.tsx": "6d3157fe5c18a70a2448e58787565eaf550d255c",
 "creator-v1/web/src/components/IsolatedProjectViewport.tsx": "cb4609d724f11eee1c82ff16c6d1f373201af184",
 "creator-v1/web/src/components/LevelPanel.tsx": "ccb4283928d9ba5c2befa874901031d58c29e44c",
 "creator-v1/web/src/components/MemberGate.tsx": "bcd29b4b1dc594674534b78637bb88a8e301d768",
 "creator-v1/web/src/components/MemberPortrait.tsx": "c6a0a2d5d63f15e8ba2311e80e80ee20c55b42d7",
 "creator-v1/web/src/components/MemberSpaceDashboard.tsx": "f2829a0805b181bdeb67f2debfaf9c8df1a336bc",
 "creator-v1/web/src/components/OrbitalMark.tsx": "c08596116ba2171a9a4b395bcfedd107d5823fa6",
 "creator-v1/web/src/components/ProjectCard.tsx": "7e8f82d015d68cdea4c08eea222c2dcea2d4bc4e",
 "creator-v1/web/src/components/ProjectLaunchKit.tsx": "f477a73096259dd44e37f29e93a69b4bb444e383",
 "creator-v1/web/src/components/ProjectPlayerShell.tsx": "f9978866f2c69f45eae71924e8b29282d6161323",
 "creator-v1/web/src/components/ProjectThumbnail.tsx": "6aa0512b792b8e688c0183e6ad37623767298022",
 "creator-v1/web/src/components/Shell.tsx": "cd4d29c73aa20e377af3bcebf9b9ec5caebe4bd8",
 "creator-v1/web/src/components/StudioLargeUploader.tsx": "f7793697ecd7b28bdd1985baeb0a9e97b58a5e5e",
 "creator-v1/web/src/components/VisualKit.tsx": "a9dcc6ee9108d7dfef4cdb96ea349c1f5aebb43c",
 "creator-v1/web/src/components/project-launch-kit-v136018.css": "9462e52ed779e74305a7f83fc9db5bbc956fbeac",
 "creator-v1/web/src/lib/canonical-studio.ts": "256b0a7aa524c4f1c7da21a95822fdaec5d4832d",
 "creator-v1/web/src/lib/godot-local-sniff-v136.ts": "09f5ab599167ffda8000adf3919ef8973de63490",
 "creator-v1/web/src/lib/launch-kit-v136018.ts": "8d941ca49f5a698f12058e0c53a933f08be81410",
 "creator-v1/web/src/lib/native-compatibility-v101.ts": "411d3297fec6db4486892c3dd851a80cffe0cda3",
 "creator-v1/web/src/lib/navigation.ts": "c0028dea15174ce8ea9c8ff95a77b24e8109f1ab",
 "creator-v1/web/src/lib/portal-destinations.ts": "919fd7bd10e13c76fc753c4c5559d9068a57ea66",
 "creator-v1/web/src/lib/project-thumbnails.ts": "cb047ec3893d0fde37a9873ea8daeb33af57cfe1",
 "creator-v1/web/src/lib/request-id.ts": "8fb3441022418d03e3e754f97d7e4af6fad44bb5",
 "creator-v1/web/src/lib/site-navigation.ts": "66c5057bf507f68dbb8621123b90bfb37bc96376",
 "creator-v1/web/src/main.tsx": "978b90bbed4b5e5d4e66c4ad0f3d2e3afb9b1441",
 "creator-v1/web/src/member-collection-nav.css": "6988ae75ad65f1a9d4a08d247623f0faa0ee908c",
 "creator-v1/web/src/member-space.css": "261b8841f14dc4f1ba1eb23306c662980e1401aa",
 "creator-v1/web/src/pages/CanonicalForums.tsx": "abf72dde7746130e8d32f4c6e02346a6445f32d9",
 "creator-v1/web/src/pages/CanonicalSavedWorksPage.tsx": "e4fbf9e98023c4212a5e5350fe20867ddfd9dd8b",
 "creator-v1/web/src/pages/CanonicalStudioPage.tsx": "6fb6b438dd3de33f89bb5052b5ad9bba93b485fd",
 "creator-v1/web/src/pages/CinematicLandingPage.tsx": "17477a89cc313ea6544de2e73026db46919d0b99",
 "creator-v1/web/src/pages/CommunityPage.tsx": "bb481bfbb930050c9eacfd21c751459be5e09880",
 "creator-v1/web/src/pages/CommunityPostEditorPage.tsx": "b3ee8aa18c8ff5908985ab18a8940ef00e900224",
 "creator-v1/web/src/pages/CreatorsPage.tsx": "9ffe9b9acad1451ba4efdab80a3b53fed4674ade",
 "creator-v1/web/src/pages/DiscoverPage.tsx": "f377f9d4221559346313f65bdccd1c314a8f7c9c",
 "creator-v1/web/src/pages/NativeCreatorStudio.tsx": "ef65c1c9e703332aa53c87ce8a6b592c8cdccf71",
 "creator-v1/web/src/pages/Phase1PublicMemberPage.tsx": "d076fec352dbed6c41ffa41581000fefa360db18",
 "creator-v1/web/src/pages/ProjectPage.tsx": "51132dc686031d283e93a79e8c9467c54faeea3a",
 "creator-v1/web/src/pages/PublicBoardsPage.tsx": "63ffc6b9286952213ce5f40b6ab6b6702bc2103d",
 "creator-v1/web/src/pages/StartPage.tsx": "24f0a277b6e8172061886c4cbf26ea1865269a07",
 "creator-v1/web/src/pages/StatusPage.tsx": "8e1821439ac20279690636863151d9ccaf250eb0",
 "creator-v1/web/src/pages/canonical-saved-works.css": "b0df74d196e9896700a8e13a9c846229c2a0d257",
 "creator-v1/web/src/pages/community-hub-v007.css": "9e6476e71032b1acf4fc50c39675d0676cd284ce",
 "creator-v1/web/src/pages/native-creator-v095.css": "2052e7095562247cf6a3c49956fa134e178c4cec",
 "creator-v1/web/src/pages/status-focus-v136.css": "3cb6fde4e4f6d588b1ce560a1a3fa34cd9c3e559",
 "creator-v1/web/src/parity/ArtifactLensV136.tsx": "fc35fc8cd9c01c1bcfb93d66742a4143a0e7ab0a",
 "creator-v1/web/src/parity/ArtifactWorkbenchV136.tsx": "b7b7ab7b0ad795a89b0713b5559481d02d2b8812",
 "creator-v1/web/src/parity/CinematicArrivalV136.tsx": "e49083e30a6a34952c0a9838b14314fdc32471c6",
 "creator-v1/web/src/parity/CinematicCameraRegistrationV136.ts": "803763d30bad68d7387bbbf8eeee6e22b59cb50e",
 "creator-v1/web/src/parity/CinematicFramesV136.tsx": "ed867dc85e22fa6b07c499661c22092fad38236e",
 "creator-v1/web/src/parity/CinematicMediaContractV136.ts": "243ce4135d1230d4b4b775e0b74cb7f3b84ae6d4",
 "creator-v1/web/src/parity/CinematicStageGeometryV136.ts": "1128a2fdc6fafe0e9afec6e734d93019034c33c4",
 "creator-v1/web/src/parity/CinematicVideoV136.tsx": "8399f1e73676ea18d3ebb7485e1154f0bbb12906",
 "creator-v1/web/src/parity/ConsoleWayfinderV136.tsx": "637d17000769242ad7ab4e79f31620a56f0047b6",
 "creator-v1/web/src/parity/ContinuanceInstrumentV136017.tsx": "9196a10f039bc4ebf8dfa5be63c3ab3b26e1026f",
 "creator-v1/web/src/parity/ControllerBridgeV136.tsx": "3e381c1b6ef9f6e9bfffadc8775b6f4cd9181c67",
 "creator-v1/web/src/parity/CspMeshoptDecoderV136.ts": "c0bdccd641656fe5f6198e680509a3dab32f5509",
 "creator-v1/web/src/parity/FileGlyphV136017.tsx": "e06998de6dd5d661882efca3308283b78ff5237e",
 "creator-v1/web/src/parity/FirstVisitClarityV136.tsx": "267029c69d548bb21a6c76b4095673e708a2b289",
 "creator-v1/web/src/parity/InstituteAssetManifestV136.ts": "fc5ba59ac197a1650dece5abe77e2269e69e841c",
 "creator-v1/web/src/parity/InstituteCitadelsV136017.ts": "9aa1975dee7f6fc881d11f4b96f878aff7b69cf0",
 "creator-v1/web/src/parity/InstituteHorizonV136017.ts": "45c56b69a9b5a0905166ed862c6e3490462c9412",
 "creator-v1/web/src/parity/InstituteMaterialsV136.ts": "94cbecdbe0b8475c01254300be2d84bbf40229b5",
 "creator-v1/web/src/parity/InstituteRendererV136.ts": "4c523b5f5898ed16eb30ddb2a03dff7245ce329a",
 "creator-v1/web/src/parity/LivingRecognition.tsx": "8b0b67a9b172e72d16bd5c24525fee1371d8d301",
 "creator-v1/web/src/parity/LivingWorldField.tsx": "046448baa2d53f3f80134939cb1b120eb34f4be2",
 "creator-v1/web/src/parity/LivingWorldGlyph.tsx": "3dc477ea9db3febcba70f410f2eac4cca9cfae45",
 "creator-v1/web/src/parity/LivingWorldState.tsx": "aa0deed268a39c0b13c3147232a792dc0be9c8b9",
 "creator-v1/web/src/parity/MeshoptDecodeWorkerV136.ts": "824b34c41037890e06f36b82f37d923a0c117e42",
 "creator-v1/web/src/parity/MonacoSourceV136.tsx": "896f4aaf895f2a278051c971d004d233883c161f",
 "creator-v1/web/src/parity/ParityDiscoverV136.tsx": "e45aeeeea0480299b8902b7c9e2290f2f47739d6",
 "creator-v1/web/src/parity/ParityHeaderV136.tsx": "d9c2a47f92e035310ed4055609ccd7564d9554f4",
 "creator-v1/web/src/parity/ParityPortalV136.tsx": "d5710f17bad99ca22962c8df351185bc978ee056",
 "creator-v1/web/src/parity/ParityScene.tsx": "6feb10d46db0602312f3ceb493b4bd38e938a287",
 "creator-v1/web/src/parity/SceneDirectorV136.ts": "3ebf6cc4dce5bb249819318afdfc71424cc9f476",
 "creator-v1/web/src/parity/SourcePreviewV136.tsx": "600a50dfab3cdd3b390787877e32b3637993fdc1",
 "creator-v1/web/src/parity/SpatialSurfaceV136.tsx": "f2cc8fb2a71ec40fa46bdb7d915a0bdb2401176a",
 "creator-v1/web/src/parity/StudioSpatialWorkspaceV136.tsx": "141777e2b33a1b365c58c15095d4e4a351eabd82",
 "creator-v1/web/src/parity/artifact-lens-v136.css": "5ba79cd90fe5390a6323b9186d12320fa0b126eb",
 "creator-v1/web/src/parity/artifact-workbench-v136.css": "705c061e6f206187ff44a7667dda27d5ba4cf259",
 "creator-v1/web/src/parity/cinematic-arrival-v136.css": "755816fd59a66e2897a9b2325f9ff47442296a0a",
 "creator-v1/web/src/parity/cinematic-director-v136.ts": "0438b9ad972a9c76094895f85413ae9c9baa2f68",
 "creator-v1/web/src/parity/concept-convergence-v136017.css": "9601042c1d6b29cdd18ea089747f333c4564826b",
 "creator-v1/web/src/parity/console-wayfinder-v136.css": "cddae748dfad8990e90a3da23154938e1a25b154",
 "creator-v1/web/src/parity/continuance-design-system.css": "00139aafba0638d4f9c92a0f32f90428c25d7ea2",
 "creator-v1/web/src/parity/controller-bridge-v136.css": "e0313d4b9d495c10f686779b4a26d66af5b3ebb8",
 "creator-v1/web/src/parity/controller-input-v136.ts": "2d23c6d1a7a832d33db90f7524b6ebb2288a1ae1",
 "creator-v1/web/src/parity/first-visit-clarity-v136.css": "9579faa2edb28562a19dcc78dec812c8aa8e6e73",
 "creator-v1/web/src/parity/institute-optics-v136.css": "2d7093353f2a62b8801db990c919d969df6f99d7",
 "creator-v1/web/src/parity/living-recognition-v136.css": "5ea6cbcc0357c6791c20c53f5c5f161a62911a40",
 "creator-v1/web/src/parity/living-world-shaders.ts": "1ed9ebe1a796aa0a606b53fc0c88ce12dd517273",
 "creator-v1/web/src/parity/living-world-v136.css": "839c41c2597d099a76c496680fe7a43297c35bdc",
 "creator-v1/web/src/parity/meshopt-reference-v136.d.ts": "5b1f51ca1ed4eb07ac4c4474a5503510815de859",
 "creator-v1/web/src/parity/parity-discover-v136.css": "f6eec74569d84554e2dd8e7559632d1a4b9d4356",
 "creator-v1/web/src/parity/scene-materials-v136.css": "cc70fe848d8e4ca519e0082cac61591d4115d6cf",
 "creator-v1/web/src/parity/sitewide-interface-v136.css": "5ee8043caf6b135ba9ec4851b33fd4a86d6721a4",
 "creator-v1/web/src/parity/source-archive-v136.ts": "882f19c7503d16b97ac75ade357377d212413682",
 "creator-v1/web/src/parity/spatial-surface-v136.css": "442c96718a3623b578b7591669cc4a5eb6201ec3",
 "creator-v1/web/src/parity/studio-spatial-workspace-v136.css": "d97bd7a3836b9b8b82dab1d69bcc4de7ae99d484",
 "creator-v1/web/src/parity/visual-foundation-v136.css": "52f0dc89235271360de6e318f155e164a825ccec",
 "creator-v1/web/src/parity/workbench-file-ops-v136.ts": "707c1122a548b64717298f94255cb98b1b6b1de3",
 "creator-v1/web/tsconfig.json": "cd0d14da0d2d38db03ad6a1485d04c682a14a69a",
 "creator-v1/web/v136-visual-review.worker.mjs": "60d8068b5124b4463e2b48e8dd370ff9106b8986",
 "creator-v1/web/vite.config.ts": "96258cae4910e0c6437750669af8fe6365127acc",
 "creator-v1/wrangler.v136-interactive-review.jsonc": "72b7658bf1df1ca9ad5a138ab1034c14b476e784",
 "docs/production/ACTIVE-V136-WEB-OVERHAUL.md": "01e6f178b8ee2d98babfb76e067ba8c631386e28",
 "docs/production/ANEVUM-MASTER-CONTINUITY.md": "bac8b826227b8b9d8ed6a92f6a577293759db7db",
 "docs/production/UNIFIED-CINEMATIC-RECONSTRUCTION.md": "a42c8f94afb23ace5320c2e57ad4b3ea14c98231",
 "docs/production/anevum-workstreams-consolidation-20261024.md": "e10773e2b37c7bce0a5a37b87c7ff573e00a735c",
 "docs/production/parity-v136-cinematic-camera-handoff-20261024.md": "3c316fc8bf255e2646a4fad68847e48fca73556b",
 "docs/production/parity-v136-cinematic-continuance-20261024.md": "287a931ecbce53f3b9eb402485cc443227d757b7",
 "docs/production/parity-v136-cinematic-production-20261024.md": "6238413a5848c0df0f8f0cf5ab6234b920d5875b",
 "docs/production/parity-v136-cinematic-runtime-20261024.md": "db727f1e8e57f9c842c04121bb3871625646f70c",
 "docs/production/parity-v136-concept-convergence-20261024.md": "7db20d0a93112bb0fe6071ad5c46da3c91166f43",
 "docs/production/parity-v136-continuance-spatial-system-20261024.md": "469720127e5e095a8fca00fca451c643594efec5",
 "docs/production/parity-v136-controller-integration-20261024.md": "a8d3f5b80e27890686cb47d9ccf1bb5cee0a013b",
 "docs/production/parity-v136-free-launch-companion-20261024.md": "3655321aab3016bac5038a0ad4f30fd588d0da92",
 "docs/production/parity-v136-living-world-20261024.md": "1b77affe79666038b75b2d97460fd13a151833b2",
 "docs/production/parity-v136-release-20261024.md": "7446dd72f9086ec013a258a441ce952689828aaa",
 "docs/production/parity-v136-unified-ui-release-20261025.md": "74d611e69103405729cafa7da1b6ecb743e919ea",
 "docs/production/parity-v136-webgl-asset-overhaul-20261024.md": "0a27942614ce020c2411e707ad9cfbd056138e89",
 "docs/production/parity-v136018-sitewide-visual-retirement-20261025.md": "36b7178ef8b1ce82521981e5be27572a396d761f",
 "docs/production/parity-v136019-creator-thumbnail-fallback-20261025.md": "746d61da9dc9eb1c0a521f869425248095d5cad8",
 "package.json": "a283b81f1196f6002cae8d0fac571214f245d634",
 "site/alpha/v003/archive.d.mts": "bdb48f893916fbd7abba59ee277e1688663aa9a5"
});
export function verifySourcePaths(paths,blobAtPath){
 for(const path of paths){
  if(Object.hasOwn(REVIEWED_UI_BLOBS,path)){
   assert.equal(blobAtPath(path),REVIEWED_UI_BLOBS[path],'Reviewed UI file bytes changed '+path);continue;
  }
  assert.ok(allowed.has(path),'Unreviewed release change '+path);
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
 assert.notEqual(process.env.VITE_PARITY_V136_HORIZON_QA,'true',
  'Unapproved planetary art QA must be disabled in release');
 assert.notEqual(process.env.VITE_PARITY_V136_SHARED_SCENE_QA,'true',
  'Shared cinematic scene QA flag must be disabled in release');
 assert.notEqual(process.env.VITE_PARITY_V136_NATIVE_VIDEO,'true',
  'Native video requires independently reviewed CSP/media deployment');
 git('merge-base','--is-ancestor',BASE,'HEAD');
 assert.equal(git('diff','--name-only',FROZEN_PRODUCT_SOURCE,'HEAD','--',
  'creator-v1/canonical-auth','creator-v1/api','creator-v1/apex-prelaunch','site/alpha/v003/archive.mjs'),'',
  'Experimental backend and archive runtime must not enter the frontend release');
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
 assert.ok(!existsSync(join(freshRoot,'assets/cinematic-v136/arrival/review-001')),
  'Owner-review artwork must not enter the production package');
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
 const report={session:SESSION,source:identity,frontendOrigin:UI_ORIGIN,frozenProductSource:FROZEN_PRODUCT_SOURCE,worker:WORKER,gatewaySha256:GATEWAY,metadataRecords,
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
 assert.equal(s.deployment.id,LIVE_DEPLOY_BETA_BASE,'Production changed; inspect before retry');
 assert.deepEqual(s.deployment.versions,[{version_id:LIVE_V136_BETA_BASE,percentage:100}], 'Production allocation changed; refuse stale release');
 assert.equal(s.settings.bindings.length,26);assert.deepEqual(signatures(s.settings.bindings),signatures(s.original.resources.bindings));
 assert.equal(s.controller.id,'4c832ec7-ce67-4864-832c-9b0b470af92d','Controller changed; inspect');
 assert.equal(s.routes.length,45,'Route inventory changed; inspect');
 assert.equal(hash(stable([...s.routes].sort((a,b)=>a.id.localeCompare(b.id)))),ROUTES_SHA256,
  'Exact production route inventory changed; inspect');
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
 const result={status:'VERIFIED_INACTIVE_PARITY_VERSION',releaseVariant:packageManifest.releaseVariant||'candidate',frontendSourceHead:packageManifest.frontendSourceHead||git('rev-parse','HEAD'),sharedAssetsSha256:packageManifest.sharedAssetsSha256||null,version:v.id,number:v.number,source:git('rev-parse','HEAD'),gatewaySha256:GATEWAY,rollback:[LIVE_V136_BETA_BASE,LIVE_V136_003,LIVE_V136_005,V131,V132],trafficChanged:false,controllerChanged:false,bindingsPreserved:true,routesPreserved:true,memberDataChanged:false};
 save(join(out,'inactive-receipt.json'),result);return result;
}
const [cmd,...args]=process.argv.slice(2);
if(cmd==='source')console.log(JSON.stringify(source()));
else if(cmd==='package')console.log(JSON.stringify(pack(...args)));
else if(cmd==='before')console.log(JSON.stringify(await before(...args)));
else if(cmd==='after')console.log(JSON.stringify(await after(...args)));
