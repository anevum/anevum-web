export class ReadDeadlineError extends Error {}
export function readWithDeadline<T>(read:(signal:AbortSignal)=>Promise<T>, signal?:AbortSignal, milliseconds?:number):Promise<T>;
