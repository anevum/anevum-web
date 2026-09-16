function clean(value: unknown) {
  return String(value || "").trim();
}

function minimumAgeValue() {
  const configured = Number.parseInt(clean(import.meta.env.VITE_PUBLIC_MINIMUM_AGE), 10);
  if (!Number.isFinite(configured)) return 13;
  return Math.max(13, Math.min(99, configured));
}

const legalName = clean(import.meta.env.VITE_PUBLIC_LEGAL_NAME);
const supportEmail = clean(import.meta.env.VITE_PUBLIC_SUPPORT_EMAIL);
const privacyEmail = clean(import.meta.env.VITE_PUBLIC_PRIVACY_EMAIL);
const mailingAddress = clean(import.meta.env.VITE_PUBLIC_MAILING_ADDRESS);
const accountRequestUrl = clean(import.meta.env.VITE_PUBLIC_ACCOUNT_REQUEST_URL);
const minimumAge = minimumAgeValue();

export const legalPublicConfig = {
  legalName,
  supportEmail,
  privacyEmail,
  mailingAddress,
  accountRequestUrl,
  minimumAge,
} as const;

export const legalPublicConfigured = {
  entity: Boolean(legalName),
  contact: Boolean(supportEmail && privacyEmail),
  mailing: Boolean(mailingAddress),
  accountRequests: Boolean(accountRequestUrl),
  launch: Boolean(legalName && supportEmail && privacyEmail && mailingAddress && accountRequestUrl),
} as const;

export function emailHref(email: string) {
  return email ? `mailto:${encodeURIComponent(email).replace(/%40/g, "@")}` : "";
}
