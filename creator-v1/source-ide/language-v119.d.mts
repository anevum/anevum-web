export type StudioSyntaxToken={text:string;kind:string};
export type EditorPatch={text:string;start:number;end:number};
export declare const SOURCE_LANGUAGES:readonly string[];
export declare function editorLanguage(filename:string):string;
export declare function highlightSource(source:string,filename:string,maxLines?:number):{
 language:string;lines:StudioSyntaxToken[][];truncated:boolean;
};
export declare function sourceCursor(text:string,start:number,end?:number):{
 line:number;column:number;selection:number;
};
export declare function editorIndent(text:string,start:number,end:number,width?:number,outdent?:boolean):EditorPatch;
export declare function editorEnter(text:string,start:number,end:number):EditorPatch;
export declare function findSource(text:string,query:string,from?:number,sensitive?:boolean,reverse?:boolean):
 {start:number;end:number}|null;
export declare function replaceSourceAll(source:string,query:string,replacement:string,sensitive?:boolean):
 {text:string;count:number};
export declare function prettyJsonSource(text:string,indent?:number):string;
