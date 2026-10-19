/** Resolve public identity systems independently. A missing legacy channel is
 * not proof that a member is missing, and a transport failure is not a 404. */
export async function resolveCreatorRoute<C extends {handle:string}>(
  handle:string,
  readChannel:()=>Promise<C>,
  readPublicMember:()=>Promise<{profile:{handle:string}}>
):Promise<{kind:'channel';profile:C}|{kind:'member'}|{kind:'missing'}>{
  if(!/^[a-z][a-z0-9_]{2,29}$/.test(handle))return {kind:'missing'};
  try{
    const profile=await readChannel();
    if(profile.handle!==handle)throw Error('Creator channel identity could not be verified.');
    return {kind:'channel',profile};
  }catch(error){
    if((error as {status?:number})?.status!==404)throw error;
  }
  try{
    const member=await readPublicMember();
    return {kind:member.profile.handle===handle?'member':'missing'};
  }catch(error){
    const status=(error as {status?:number})?.status;
    if(status===404||status===403)return {kind:'missing'};
    throw error;
  }
}
