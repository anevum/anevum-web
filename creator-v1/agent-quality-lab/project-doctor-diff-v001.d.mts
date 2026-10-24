import type {ProjectDoctorFinding} from './project-doctor-v001.mjs';

export interface ProjectDoctorDiff {
  schema:'anevum.project-doctor.diff.v001';
  comparable:boolean;
  reason?:string;
  format?:string;
  introduced:ProjectDoctorFinding[];
  noLongerReported:ProjectDoctorFinding[];
  stillReported:ProjectDoctorFinding[];
  counts:{
    introduced:number;
    noLongerReported:number;
    stillReported:number;
  };
  disclaimer:string;
}
export declare function compareProjectDoctorSources(savedSource:string,draftSource:string):ProjectDoctorDiff;
