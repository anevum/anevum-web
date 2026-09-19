import { loadSession, syncCurrentUser, type MemberSession } from "./memberClient";

export type ReleaseUpdateStatus = {
  enabled: boolean;
  email: string;
  source: string | null;
  optedInAt: string | null;
  optedOutAt: string | null;
  emailDeliveryConfigured: boolean;
  inAppDeliveryConfigured: boolean;
};

export type MemberNotification = {
  id: string;
  topic: string;
  title: string;
  body: string;
  action_label?: string | null;
  action_url?: string | null;
  created_at: string;
  read_at?: string | null;
};

export type ReleaseCampaignSummary = {
  providerConfigured: boolean;
  inAppConfigured: boolean;
  subscriberCount: number;
  recentCampaigns: Array<{
    id: string;
    subject: string;
    title: string;
    status: string;
    subscriber_count: number;
    sent_count: number;
    failed_count: number;
    created_at: string;
    sent_at?: string | null;
  }>;
};

export type ReleaseCampaignInput = {
  subject: string;
  title: string;
  body: string;
  actionLabel?: string;
  actionUrl?: string;
};

export class NotificationApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "NotificationApiError";
    this.status = status;
  }
}

async function activeSession(session = loadSession()) {
  if (!session) throw new NotificationApiError("Resolve RHENLINK before using notifications.", 401);
  return await syncCurrentUser(session) || session;
}

async function api<T>(path: string, init: RequestInit = {}, session?: MemberSession | null): Promise<T> {
  const current = await activeSession(session || undefined);
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${current.access_token}`,
      ...(init.headers || {}),
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const value = payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
    throw new NotificationApiError(String(value.message || value.error || `Notification request failed (${response.status})`), response.status);
  }
  return payload as T;
}

export function loadReleaseUpdateStatus(session?: MemberSession | null) {
  return api<ReleaseUpdateStatus>("/api/member/release-updates", { method: "GET" }, session);
}

export function saveReleaseUpdatePreference(enabled: boolean, source: string, session?: MemberSession | null) {
  return api<ReleaseUpdateStatus>("/api/member/release-updates", {
    method: "PUT",
    body: JSON.stringify({ enabled, source }),
  }, session);
}

export async function loadMemberNotifications(session?: MemberSession | null) {
  const result = await api<{ notifications: MemberNotification[] }>("/api/member/notifications", { method: "GET" }, session);
  return result.notifications;
}

export async function markMemberNotificationRead(id: string, session?: MemberSession | null) {
  const result = await api<{ notification: MemberNotification }>(`/api/member/notifications/${encodeURIComponent(id)}/read`, {
    method: "POST",
  }, session);
  return result.notification;
}

export function loadReleaseCampaignSummary(session?: MemberSession | null) {
  return api<ReleaseCampaignSummary>("/api/command/release-updates", { method: "GET" }, session);
}

export function sendReleaseCampaign(input: ReleaseCampaignInput, session?: MemberSession | null) {
  return api<{
    id: string;
    status: string;
    subscriberCount: number;
    sentCount: number;
    failedCount: number;
  }>("/api/command/release-updates/send", {
    method: "POST",
    body: JSON.stringify({ ...input, confirm: "SEND REPLY RELEASE UPDATE" }),
  }, session);
}
