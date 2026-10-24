export type StudioOutlineSymbol={kind:string;name:string;line:number;column:number;depth:number};
export declare function sourceOutline(source:string,filename:string):{
 language:string;symbols:StudioOutlineSymbol[];approximate:boolean;truncated:boolean;note:string;
};
