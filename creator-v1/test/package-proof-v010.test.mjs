import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {canonicalPackageProof} from '../canonical-auth/package-proof.mjs';

const ENABLED={CANONICAL_PACKAGE_PROOF_ENABLED:'true',
 CANONICAL_PACKAGE_PROOF_KEY:'development-fixture-strong-key-64-characters-long-do-not-use-in-deploy'};
test('canonical proof is absent by default and refuses missing or weak secret',async()=>{
 assert.equal(await canonicalPackageProof({},'member-a','cosmiccreator',1760000000),null);
 await assert.rejects(canonicalPackageProof({CANONICAL_PACKAGE_PROOF_ENABLED:'true'},
  'member-a','cosmiccreator',1760000000),/secret unavailable/);
 await assert.rejects(canonicalPackageProof({...ENABLED,CANONICAL_PACKAGE_PROOF_KEY:'short'},
  'member-a','cosmiccreator',1760000000),/secret unavailable/);
});
test('creator proof HMAC binds canonical account, current handle, profile creation and issuer key',async()=>{
 const a=await canonicalPackageProof(ENABLED,'member-a','cosmiccreator',1760000000);
 const twice=await canonicalPackageProof(ENABLED,'member-a','cosmiccreator',1760000000);
 const sameTimeOtherAccount=await canonicalPackageProof(ENABLED,'member-b','cosmiccreator',1760000000);
 const changedHandle=await canonicalPackageProof(ENABLED,'member-a','differentname',1760000000);
 const changedProfile=await canonicalPackageProof(ENABLED,'member-a','cosmiccreator',1760000001);
 const changedKey=await canonicalPackageProof({...ENABLED,
  CANONICAL_PACKAGE_PROOF_KEY:'another-strong-development-fixture-key-with-unique-material'},
  'member-a','cosmiccreator',1760000000);
 assert.match(a,/^[0-9a-f]{64}$/);
 assert.equal(a,twice);
 for(const proof of [sameTimeOtherAccount,changedHandle,changedProfile,changedKey])
  assert.notEqual(a,proof);
 assert.ok(!a.includes('member-a')&&!a.includes('cosmiccreator'));
});
test('proof refuses invalid handles or subjects and never accepts an object-supplied identity',async()=>{
 for(const args of [
  ['member-a','Bad Handle',1760000000],
  ['member-a','cosmiccreator',-1],
  ['', 'cosmiccreator',1760000000],
  [{id:'member-a'},'cosmiccreator',1760000000]
 ]){
  await assert.rejects(canonicalPackageProof(ENABLED,...args),/Invalid canonical package proof subject/);
 }
});
test('public issuer profile emits HMAC only from a verified canonical DB record and private profile owner',async()=>{
 const src=await readFile(new URL('../canonical-auth/profile.mjs',import.meta.url),'utf8');
 assert.match(src,/canonicalPackageProof\(env,row.user_id,row.handle,Number\(row.created_at\)\)/);
 assert.match(src,/canonicalPackageProof\(env,user.id,profile.handle,profile.createdAt\)/);
 assert.match(src,/\(proof\?\{packageProof:proof\}:\{\}\)/);
 assert.doesNotMatch(src,/packageProof:payload\./);
});
