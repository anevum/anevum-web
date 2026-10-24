export type WorldKind='island'|'spire'|'bridge'|'waterfall'|'cube'|'sphere'|'light'|'starship';
export type WorldMaterial='stone'|'grass'|'gold'|'glass'|'cyan'|'slate'|'violet'|'water';
export type Vec3=[number,number,number];
export type WorldNode={id:string;name:string;kind:WorldKind;parentId:string|null;position:Vec3;
 rotation:Vec3;scale:Vec3;material:WorldMaterial};
export type WorldCamera={yaw:number;pitch:number;distance:number;target:Vec3};
export type WorldDocument={format:'ANEVUM_WORLD_V1';name:string;units:'meters';
 environment:{sky:'day'|'night';sunIntensity:number};camera:WorldCamera;nodes:WorldNode[]};
export type WorldCommand=
 |{type:'ADD_NODE';node:WorldNode}
 |{type:'DELETE_NODE';id:string}
 |{type:'RENAME';id:string;name:string}
 |{type:'SET_TRANSFORM';id:string;field:'position'|'rotation'|'scale';value:Vec3}
 |{type:'SET_MATERIAL';id:string;material:WorldMaterial}
 |{type:'SET_PARENT';id:string;parentId:string|null}
 |{type:'SET_ENVIRONMENT';sky:'day'|'night';sunIntensity:number}
 |{type:'SET_CAMERA';camera:WorldCamera};
export declare const PREFIX:'ANEVUM_WORLD_V1\n';
export declare const LIMITS:Readonly<{bytes:32768;nodes:64;depth:6;name:80;id:40;dimension:40}>;
export declare function validate(value:unknown):WorldDocument;
export declare function encode(document:WorldDocument):string;
export declare function decode(raw:unknown):WorldDocument|null;
export declare function starter():WorldDocument;
export declare function primitive(id:string,kind?:WorldKind):WorldNode;
export declare function apply(document:WorldDocument,command:WorldCommand):WorldDocument;
