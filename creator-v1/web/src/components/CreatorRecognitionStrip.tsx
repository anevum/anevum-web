import { CelestialEmblem } from "./CelestialEmblem";
import { achievementMotif, seriesOneMotif } from "../lib/artifact-art";
import type { VerifiedCreatorRecognition } from "../lib/creator-recognition";
import "./creator-recognition-v009.css";

/** Display-only earned identity. Never infer awards from votes or a displayed XP value. */
export function CreatorRecognitionStrip({
  recognition,
  compact=false
}:{
  recognition:VerifiedCreatorRecognition|null|undefined;
  compact?:boolean
}) {
  if(!recognition)return null;
  const artifact=recognition.earnedArtifact ? recognition.artifact : null;
  const award=recognition.earnedAward;
  return <span className={"ch9-recognition"+(compact?" ch9-recognition--compact":"")}
    aria-label={"Verified creator level "+recognition.level+
      (artifact?", artifact "+artifact:"")+(award?", earned award "+award.name:"")}>
    <span className="ch9-level" title={"Verified Level "+recognition.level}>
      <CelestialEmblem motif={artifact ? seriesOneMotif(recognition.level,artifact):"orbital"}
        size="micro" state={artifact?"earned":"preview"}/>
      <span>LVL <strong>{recognition.level}</strong></span>
    </span>
    {artifact&&<span className="ch9-artifact" title={"Earned artifact: "+artifact}>{artifact}</span>}
    {award&&<span className="ch9-award" title={"Earned achievement (not a selected showcase award): "+award.name}>
      <CelestialEmblem motif={achievementMotif(award.key)||"orbital"} size="micro" state="earned"/>
      <span>{award.name}</span>
    </span>}
  </span>;
}
