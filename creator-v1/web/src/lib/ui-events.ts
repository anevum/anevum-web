export type AlertKind='success'|'error'|'info'|'xp'|'level'|'award';
export type AnevumAlert={key:string;kind:AlertKind;title:string;detail?:string;level?:number;award?:string;serverId?:number;xp?:number;preview?:boolean};
let account:string|undefined;
export const alertAccount=()=>account;
export const bindAlertAccount=(id:string|undefined)=>{account=id};
export function notify(alert:Omit<AnevumAlert,'key'>,owner=account){
 window.dispatchEvent(new CustomEvent('anevum:alert',{detail:{owner,alert:{...alert,key:crypto.randomUUID()}}}));
}
export function memberChanged(owner:string|undefined,message?:string){
 window.dispatchEvent(new CustomEvent('anevum:member-change',{detail:{owner}}));
 if(message)notify({kind:'success',title:message},owner);
}
