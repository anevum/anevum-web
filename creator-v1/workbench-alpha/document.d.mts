export type BlockType='heading'|'paragraph'|'quote'|'divider'|'scene'|'choice'|'caption'|'credits';
export interface Block {id:string;type:BlockType;text:string;target:string|null}
export interface Document {schema:'anevum.blocks.v1';blocks:Block[]}
export const PREFIX:string;
export const SCHEMA:'anevum.blocks.v1';
export const TYPES:readonly BlockType[];
export const LIMITS:Readonly<{blocks:number;text:number;description:number}>;
export function validate(value:unknown):Document;
export function encode(value:Document):string;
export function decode(raw:string):Document|null;
export function block(type:BlockType,text?:string):Block;
export function starter():Document;
export function visible(doc:Document,sceneId:string|null):Block[];
export function remove(doc:Document,id:string):Document;
