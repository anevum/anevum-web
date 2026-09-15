import type { MemberSession } from "./memberClient";
import { loadMemberProgress, onMemberProgressChange, toggleMemberSave } from "./memberState";

const eventName = "anevum-wiki-saves";

export function loadWikiSaves(session: MemberSession | null): string[] {
  return session ? loadMemberProgress(session).savedRecordIds : [];
}

export function isWikiSaved(session: MemberSession | null, recordId: string) {
  return loadWikiSaves(session).includes(recordId);
}

export function toggleWikiSave(session: MemberSession, recordId: string) {
  const next = toggleMemberSave(session, recordId);
  window.dispatchEvent(new Event(eventName));
  return next;
}

export function onWikiSavesChange(listener: () => void) {
  const relay = () => listener();
  window.addEventListener(eventName, relay);
  const removeProgressListener = onMemberProgressChange(relay);
  return () => {
    window.removeEventListener(eventName, relay);
    removeProgressListener();
  };
}

export const wikiSavePersistence = {
  mode: "rhenlink" as const,
  label: "Synced to RHENLINK",
  detail: "Saved records follow your signed-in RHENLINK through ANEVUM.",
};
