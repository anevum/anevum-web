export type Kind='heading'|'paragraph'|'card'|'button'|'input'|'counter'|'notice'|'divider';
export type Theme='continuance'|'midnight'|'dawn';
export type Tone='neutral'|'accent'|'success'|'warning';
export type Align='start'|'center'|'end';
export type Width='full'|'half';
export type Action='none'|'navigate'|'increment'|'decrement'|'toggle'|'reset';
export interface Component {id:string;kind:Kind;title:string;text:string;tone:Tone;align:Align;width:Width;action:Action;target:string|null}
export interface Page {id:string;name:string;components:Component[]}
export interface Document {schema:'anevum.ui.v1';name:string;theme:Theme;pages:Page[]}
export declare const PREFIX:'ANEVUM_UI_V1\n';
export declare const SCHEMA:'anevum.ui.v1';
export declare const KINDS:readonly Kind[];
export declare const THEMES:readonly Theme[];
export declare const TONES:readonly Tone[];
export declare const ALIGNS:readonly Align[];
export declare const WIDTHS:readonly Width[];
export declare const ACTIONS:readonly Action[];
export declare const LIMITS:Readonly<{pages:number;componentsPerPage:number;components:number;title:number;text:number;name:number;bytes:number}>;
export declare function component(kind?:Kind,title?:string,text?:string):Component;
export declare function page(name?:string):Page;
export declare function validate(value:unknown):Document;
export declare function encode(value:Document):string;
export declare function decode(raw:string):Document|null;
export declare function removeComponent(doc:Document,pageId:string,componentId:string):Document;
export declare function removePage(doc:Document,pageId:string):Document;
export declare function starter():Document;
