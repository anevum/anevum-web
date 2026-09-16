import { cleanPublicValue, configuredButRejected, safePublicEmail, safePublicPathOrHttpsUrl } from "./configSafety";

function minimumAgeValue() {
  const configured = Number.parseInt(cleanPublicValue(import.meta.env.VITE_PUBLIC_MINIMUM_AGE), 10);
  if (!Number.isFinite(configured)) return 13;
  return Math.max(13, Math.min(99, configured));
}

const rawSupportEmail = import.meta.env.VITE_PUBLIC_SUPPORT_EMAIL;
const rawPrivacyEmail = import.meta.env.VITE_PUBLIC_PRIVACY_EMAIL;
const rawAccountRequestUrl = import.meta.env.VITE_PUBLIC_ACCOUNT_REQUEST_URL;

const legalName = cleanPublicValue(import.meta.env.VITE_PUBLIC_LEGAL_NAME);
const supportEmail = safePublicEmail(rawSupportEmail);
const privacyEmail = safePublicEmail(rawPrivacyEmail);
const mailingAddress = cleanPublicValue(import.meta.env.VITE_PUBLIC_MAILING_ADDRESS);
const accountRequestUrl = safePublicPathOrHttpsUrl(rawAccountRequestUrl);
const minimumAge = minimumAgeValue();

export const legalPublicConfig = {
  legalName,
  supportEmail,
  privacyEmail,
  mailingAddress,
  accountRequestUrl,
  minimumAge,
} as const;

export const legalPublicRejected = {
  supportEmail: configuredButRejected(rawSupportEmail, supportEmail),
  privacyEmail: configuredButRejected(rawPrivacyEmail, privacyEmail),
  accountRequestUrl: configuredButRejected(rawAccountRequestUrl, accountRequestUrl),
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
