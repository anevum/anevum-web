export function cleanPublicValue(value: unknown) {
  return String(value || "").trim();
}

export function safeHttpsUrl(value: unknown) {
  const raw = cleanPublicValue(value);
  if (!raw) return "";

  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" || !url.hostname || url.username || url.password) return "";
    return raw;
  } catch {
    return "";
  }
}

export function safePublicPathOrHttpsUrl(value: unknown) {
  const raw = cleanPublicValue(value);
  if (!raw) return "";

  if (raw.startsWith("/") && !raw.startsWith("//") && !raw.includes("\\")) {
    return raw;
  }

  return safeHttpsUrl(raw);
}

export function safePublicEmail(value: unknown) {
  const raw = cleanPublicValue(value);
  if (!raw || raw.length > 254 || /[\s<>\r\n]/.test(raw)) return "";
  if (!/^[^@]+@[^@]+\.[^@]+$/.test(raw)) return "";
  return raw;
}

export function configuredButRejected(rawValue: unknown, acceptedValue: string) {
  return Boolean(cleanPublicValue(rawValue) && !acceptedValue);
}
