export type LearningProgress = {
  lessonSlug:string; lessonVersion:string; completed:boolean; revision:number; updatedAt:number;
};
export type LearningSnapshot = { memberId:string; progress:LearningProgress[] };
const SCHEMA="anevum.learning-progress.v1";
const record=(value:unknown):Record<string,unknown> => {
  if(!value || typeof value!=="object" || Array.isArray(value))throw Error("Invalid learning response.");
  return value as Record<string,unknown>;
};
function envelope(value:unknown,memberId:string) {
  const body=record(value);
  if(!memberId || body.schema!==SCHEMA || body.available!==true || body.memberId!==memberId)
    throw Error("Learning account could not be verified.");
  return body;
}
export function parseLearningProgress(value:unknown):LearningProgress {
  const row=record(value);
  if(Object.keys(row).sort().join(",")!=="completed,lessonSlug,lessonVersion,revision,updatedAt" ||
    typeof row.lessonSlug!=="string" || !/^[a-z0-9-]{3,64}$/.test(row.lessonSlug) ||
    typeof row.lessonVersion!=="string" || !/^\d{1,6}\.\d{1,6}\.\d{1,6}$/.test(row.lessonVersion) ||
    typeof row.completed!=="boolean" || !Number.isSafeInteger(row.revision) ||
    (row.revision as number)<1 || (row.revision as number)>1000000 ||
    !Number.isSafeInteger(row.updatedAt) || (row.updatedAt as number)<=0)
    throw Error("Saved learning state is invalid.");
  return {lessonSlug:row.lessonSlug,lessonVersion:row.lessonVersion,completed:row.completed,
    revision:row.revision as number,updatedAt:row.updatedAt as number};
}
export function parseLearningSnapshot(value:unknown,memberId:string,catalog:Record<string,string>):LearningSnapshot {
  const body=envelope(value,memberId);
  const versions=record(body.lessonVersions);
  const slugs=Object.keys(catalog).sort();
  if(Object.keys(versions).sort().join(",")!==slugs.join(",") ||
    slugs.some(slug=>versions[slug]!==catalog[slug]))throw Error("Lesson versions changed. Reload this page.");
  if(!Array.isArray(body.progress) || body.progress.length>128)throw Error("Incomplete learning response.");
  const progress=body.progress.map(parseLearningProgress);
  if(new Set(progress.map(row=>row.lessonSlug)).size!==progress.length)throw Error("Duplicate saved progress.");
  return {memberId,progress};
}
export function parseLearningAcknowledgement(value:unknown,memberId:string,lessonSlug:string,
  lessonVersion:string,completed:boolean,previousRevision:number):LearningProgress {
  const body=envelope(value,memberId);
  const progress=parseLearningProgress(body.progress);
  if(progress.lessonSlug!==lessonSlug || progress.lessonVersion!==lessonVersion ||
    progress.completed!==completed || progress.revision!==previousRevision+1)
    throw Error("Saved lesson update could not be verified.");
  return progress;
}
export function isCurrentLessonRead(progress:LearningProgress|undefined,version:string):boolean {
  return progress?.completed===true && progress.lessonVersion===version;
}
