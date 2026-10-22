// Canonical non-destructive XP cutover shared by private and public recognition reads.
/** One reversible operational cutover: existing event and milestone rows remain untouched. */
export async function progressionReset(db){
 try{
  const row=await db.prepare('SELECT cutoff_event_id,cutoff_at FROM member_progression_reset_epoch WHERE epoch=1').first();
  if(!row)return null;
  const cutoffEventId=Number(row.cutoff_event_id),cutoffAt=Number(row.cutoff_at);
  if(!Number.isSafeInteger(cutoffEventId)||cutoffEventId<0||!Number.isSafeInteger(cutoffAt)||cutoffAt<=0)
   throw Error('Invalid progression reset baseline');
  return {cutoffEventId,cutoffAt};
 }catch(err){
  // Permit rollout before the additive table is provisioned; never hide other storage errors.
  if(/no such table:\s*member_progression_reset_epoch/i.test(String(err?.message||err)))return null;
  throw err;
 }
}
