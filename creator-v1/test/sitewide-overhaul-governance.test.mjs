import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';

const root=new URL('../../',import.meta.url);
const read=path=>readFileSync(new URL(path,root),'utf8');
const registry=JSON.parse(read('docs/production/anevum-site-surface-registry.v1.json'));
const north=read('docs/production/ANEVUM.WEB.NORTHSTAR.2026-10-25.002.MOTION-FIRST-SINGLE-STREAM.md');
const audit=read('docs/production/ANEVUM.WEB.AUDIT.2026-10-25.001.FULL-SITE-CONSOLIDATION.md');
const current=read('docs/production/ACTIVE-V136-WEB-OVERHAUL.md');

test('one North Star supersedes WebGL-as-site-background, but not actual product 3D',()=>{
  assert.equal(registry.schema,'anevum.web.site-surface-registry.v1');
  assert.equal(registry.creative_authority.north_star,
    'docs/production/ANEVUM.WEB.NORTHSTAR.2026-10-25.002.MOTION-FIRST-SINGLE-STREAM.md');
  assert.equal(registry.creative_authority.primary_brand_mark,
    'creator-v1/brand/anevum-mark.svg');
  assert.equal(registry.creative_authority.allowed_ambient_webgl_default,false);
  assert.equal(registry.creative_authority.specialized_player_or_studio_webgl_preserved,true);
  assert.match(north,/Owner|owner|OWNER/);
  assert.match(north,/motion-first/i);
  assert.match(north,/no parallel theme authority/i);
  assert.match(north,/existing CinematicMediaContractV136/);
  assert.match(north,/KEEP/i);
  assert.match(north,/REFACTOR/i);
  assert.match(north,/ARCHIVE/i);
  assert.match(north,/REMOVE/i);
  for(const document of [audit,current]){
    assert.match(document,/SUPERSED|supersed/i,
      'Prior V136/audit handoffs must explicitly defer to the new visual authority');
    assert.ok(document.includes(registry.creative_authority.north_star.split('/').pop()));
  }
  assert.ok(existsSync(new URL(registry.creative_authority.primary_brand_mark,root)));
});

test('exactly one canonical product source and one read-only visual preview',()=>{
  const roles=registry.canonical_lanes.flatMap(x=>[x.role,x.preview_role].filter(Boolean));
  assert.equal(roles.filter(x=>x==='ONE_INTEGRATED_PRODUCT_SOURCE').length,1);
  assert.equal(roles.filter(x=>x==='ONE_PUBLIC_LINK_VISUAL_PREVIEW').length,1);
  assert.equal(registry.canonical_lanes.find(x=>x.role==='ONE_INTEGRATED_PRODUCT_SOURCE').pr,763);
  assert.equal(registry.canonical_lanes.find(x=>x.role==='CURRENT_AUDIT_CONSOLIDATION').pr,778);
  assert.equal(registry.canonical_lanes.find(x=>x.preview_role==='ONE_PUBLIC_LINK_VISUAL_PREVIEW').pr,763);
  assert.ok(registry.canonical_lanes.filter(x=>x.pr!==763).every(x=>x.deploy_authority===false));
  assert.equal(registry.canonical_lanes.find(x=>x.pr===763).production_deploy_authority,false);
  assert.equal(registry.integration.pr,763);
  assert.equal(registry.integration.merged_review_pr,779);
  assert.equal(registry.integration.development_merge_sha,'eed2c3b1317890416c1ccbefaee271f796b392bd');
  assert.equal(registry.canonical_lanes.some(x=>x.pr===779),false);
  assert.equal(registry.destruction_allowed,false);
  assert.equal(registry.traffic_change_authorized,false);
  assert.equal(new Set(registry.canonical_lanes.map(x=>x.branch)).size,registry.canonical_lanes.length);
});

test('actual public preview is distinguished from older functional and private staging',()=>{
  const surfaces=registry.public_surfaces;
  assert.equal(new Set(surfaces.map(s=>s.key)).size,surfaces.length);
  assert.equal(surfaces.filter(s=>s.kind==='PRIMARY_VISUAL_REVIEW').length,1);
  const owner=surfaces.find(s=>s.kind==='PRIMARY_VISUAL_REVIEW');
  assert.equal(owner.host,'anevum-v136-visual-review-001.devonakins.workers.dev');
  assert.equal(owner.worker,'anevum-v136-visual-review-001');
  assert.equal(owner.audience,'PUBLIC_LINK_ONLY');
  const old=surfaces.find(s=>s.host==='next.anevum.com');
  assert.equal(old.kind,'OLDER_FUNCTIONAL_PREVIEW');
  assert.equal(old.decision,'AUDIT');
  assert.equal(surfaces.find(s=>s.host==='studio.next.anevum.com').audience,'GATED_STAGING');
  for(const name of ['anevum.com','portfolio.anevum.com','web.anevum.com',
    'sites.anevum.com','command.anevum.com']){
    assert.ok(surfaces.some(s=>s.host===name),name);
  }
  assert.ok(surfaces.every(s=>!['DELETE','DESTROY','MIGRATE_NOW'].includes(s.decision)));
});

test('known live /updates collision and old aliases remain unresolved until owner-reviewed transition',()=>{
  const collision=registry.route_collisions.find(x=>x.key==='updates');
  assert.equal(collision.status,'UNRESOLVED');
  assert.ok(collision.observed.includes('standalone-live-worker:/updates'));
  assert.ok(collision.observed.includes('v5-react:/updates/:slug'));
  assert.ok(collision.observed.includes('v5-react:/feed'));
  assert.equal(registry.route_collisions.find(x=>x.key==='studio-alias').status,
    'SOURCE_LINKS_CORRECTED_ALIASES_RETAINED');
  assert.ok(registry.cleanup_gates.includes('SEO_canonical_and_backlinks'));
  assert.ok(registry.cleanup_gates.includes('rollback_receipt'));
});

test('asset/media source is retained but no unapproved video or global forced 3D claim is made',()=>{
  const manifest=JSON.parse(read('creator-v1/web/public/assets/cinematic-v136/arrival/manifest.json'));
  assert.equal(manifest.status,'preview-only');
  assert.equal(manifest.sequence,null);
  assert.equal(manifest.video,undefined);
  for(const path of [
    'creator-v1/web/src/parity/CinematicMediaContractV136.ts',
    'creator-v1/web/src/parity/CinematicFramesV136.tsx',
    'creator-v1/web/src/parity/CinematicVideoV136.tsx',
    'creator-v1/web/src/components/ProjectThumbnail.tsx'
  ])assert.ok(existsSync(new URL(path,root)),path);
  assert.match(read('creator-v1/web/src/components/ProjectThumbnail.tsx'),
    /data-thumbnail-source=\{uploaded\?'creator':'default'\}/);
  assert.doesNotMatch(north,/approved video exists|public publishing is enabled/i);
});

test('owner-preview workflow uses only the active unified PR #763 exact source',()=>{
 const workflow=read('.github/workflows/v136-interactive-owner-review.yml');
 assert.match(workflow,/github\.event\.pull_request\.number == 763/);
 assert.match(workflow,/github\.event\.pull_request\.head\.ref == 'build\/parity-v136-controller-route-probe-20261025-038'/);
 assert.match(workflow,/github\.event\.pull_request\.base\.ref == 'build\/parity-v136-iren-visible-tour-20261025-037'/);
 assert.doesNotMatch(workflow,/review\/v136-interactive-public-owner-20261025-001/);
 assert.match(workflow,/REVIEWED_SOURCE_SHA/);
});
