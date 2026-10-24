export type SourceDiagnostic={
 severity:'error'|'warning'|'info';code:string;message:string;
 line:number;column:number;offset:number
};
export declare function sourceOffsetForLine(source:string,line:number,column?:number):number;
export declare function diagnoseSource(source:string,filename:string,maxProblems?:number):{
 language:string;checked:boolean;note:string;diagnostics:SourceDiagnostic[];
};
