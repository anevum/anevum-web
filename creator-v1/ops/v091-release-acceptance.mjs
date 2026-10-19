/** Read-only release gate. Never interprets roles, fixture sessions or a green
 * public canary as proof of an authenticated creator/staff browser journey. */
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
export const V091_APPLICATION_SOURCE='8fd6b931af0b68e9cab18a15ccf094b220863076';
export function verifyV091Acceptance(record){
  if(record?.source_sha!==V091_APPLICATION_SOURCE)throw Error('V091 acceptance does not match the pinned application source.');
  for(const gate of ['founder_staff_session','reviewer_staff_session','creator_journey','cross_account_identity']){
    if(record[gate]!==true)throw Error('V091 authenticated release gate remains unverified: '+gate);
  }
  if(typeof record.verified_at!=='string'||!Number.isFinite(Date.parse(record.verified_at))||Date.parse(record.verified_at)>Date.now())
    throw Error('V091 acceptance requires an actual verification timestamp.');
  if(!Array.isArray(record.evidence)||record.evidence.length<1||record.evidence.some(ref=>
    typeof ref!=='string'||!/^https:\/\/github\.com\/anevum\/anevum-web\/(?:actions\/runs\/\d+(?:\/artifacts\/\d+)?|pull\/554#issuecomment-\d+)$/.test(ref)))
    throw Error('V091 acceptance requires recorded repository evidence, without session credentials.');
  return true;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  verifyV091Acceptance(JSON.parse(readFileSync(new URL('../../.github/release-evidence/v091-authenticated.json',import.meta.url),'utf8')));
  console.log('V091_AUTHENTICATED_ACCEPTANCE=PASS');
}
