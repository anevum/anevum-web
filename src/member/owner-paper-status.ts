/** Owner-only read-only PAPER account projection; never authorizes trading. */
export type OwnerPersonalPaperStatus={accountEnding:string;providerStatus:string};
const object=(v:unknown):v is Record<string,unknown>=>v!==null&&typeof v==="object"&&!Array.isArray(v);
export function verifiedOwnerPaperStatus(input:unknown):OwnerPersonalPaperStatus{
 if(!object(input)||Object.keys(input).sort().join(",")!=="account,available,executionEnabled,paper"||
    input.available!==true||input.paper!==true||input.executionEnabled!==false||!object(input.account))
    throw new Error("Private paper account proof could not be verified.");
 const a=input.account;
 if(Object.keys(a).sort().join(",")!=="ending,environment,status"||
    a.environment!=="paper"||typeof a.ending!=="string"||!/^[A-Za-z0-9-]{4}$/.test(a.ending)||
    typeof a.status!=="string"||!/^[A-Z_]{2,32}$/.test(a.status))
    throw new Error("Private paper account proof could not be verified.");
 return {accountEnding:a.ending,providerStatus:a.status};
}
