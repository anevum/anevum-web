export type ProjectDoctorTarget =
 | {kind:'scene';blockId:string}
 | {kind:'interface';pageId:string;componentId:string|null};
export declare function locateProjectDoctorFinding(source:string,path:string):ProjectDoctorTarget|null;
