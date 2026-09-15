import type { MemberSession } from "./memberClient";

const prefix = "anevum.rhenlink.wiki-saved.v1";
const eventName = "anevum-wiki-saves";

function keyFor(session: MemberSession) {
  return `${prefix}:${session.user.id}`;
}

export function loadWikiSaves(session: MemberSession | null): string[] {
  if (!session) return [];
  try {
    const raw = localStorage.getItem(keyFor(session));
    const value = raw ? JSON.parse(raw) : [];
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export function isWikiSaved(session: MemberSession | null, recordId: string) {
  return loadWikiSaves(session).includes(recordId);
}

export function toggleWikiSave(session: MemberSession, recordId: string) {
  const current = loadWikiSaves(session);
  const next = current.includes(recordId)
    ? current.filter((id) => id !== recordId)
    : [...current, recordId];
  localStorage.setItem(keyFor(session), JSON.stringify(next));
  window.dispatchEvent(new Event(eventName));
  return next;
}

export function onWikiSavesChange(listener: () => void) {
  window.addEventListener(eventName, listener);
  return () => window.removeEventListener(eventName, listener);
}

export const wikiSavePersistence = {
  mode: "device" as const,
  label: "Saved on this device",
  detail: "RHENLINK cloud persistence activates after the member database is verified.",
};
