import type {ProjectDoctorResult,ProjectDoctorFinding} from './project-doctor-v001.mjs';

export interface ProjectDoctorBrief {
  schema:'anevum.project-doctor.brief.v001';
  status:'invalid'|'review'|'no_structural_warnings';
  headline:string;
  counts:{error:number;warning:number;info:number};
  checkedFindings:number;
  listTruncated:boolean;
  recommendations:ProjectDoctorFinding[];
  disclaimer:string;
}
export declare function projectDoctorBrief(result:ProjectDoctorResult):ProjectDoctorBrief;
export declare function formatProjectDoctorBriefText(result:ProjectDoctorResult):string;
