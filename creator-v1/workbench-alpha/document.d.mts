export type BlockType='heading'|'paragraph'|'quote'|'divider'|'scene'|'choice'|'caption'|'credits';
export interface Block {id:string;type:BlockType;text:string;target:string|null}
export interface Document {schema:'anevum.blocks.v1';blocks:Block[]}
export declare const PREFIX:string;
export declare const SCHEMA:'anevum.blocks.v1';
export declare const TYPES:readonly BlockType[];
export declare const LIMITS:Readonly<{blocks:number;text:number;description:number}>;
export declare function validate(value:unknown):Document;
export declare function encode(value:Document):string;
export declare function decode(raw:string):Document|null;
export declare function block(type:BlockType,text?:string):Block;
export declare function starter():Document;
export declare function visible(doc:Document,sceneId:string|null):Block[];
export declare function remove(doc:Document,id:string):Document;
