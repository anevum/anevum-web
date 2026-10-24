export type ProjectDoctorSeverity = 'error' | 'warning' | 'info';
export interface ProjectDoctorFinding {
  code: string;
  severity: ProjectDoctorSeverity;
  path: string;
  message: string;
}
export interface ProjectDoctorResult {
  format: string;
  valid: boolean;
  mode: 'read-only';
  findings: ProjectDoctorFinding[];
  truncated: boolean;
}
export declare function diagnoseStudioSource(source: string): ProjectDoctorResult;
