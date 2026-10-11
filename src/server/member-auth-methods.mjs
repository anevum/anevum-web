// Optional member login providers. No brokerage or GitHub repository privileges
// are granted by logging in. Production activation is separate from source merge.
const VERIFIED_SENDER = /^ANEVUM <[a-z0-9._%+-]+@anevum\.com>$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function memberGithubConfigured(env) {
  return env?.ANEVUM_GITHUB_OAUTH_ENABLED === "true" &&
    typeof env.GITHUB_CLIENT_ID === "string" && env.GITHUB_CLIENT_ID.length > 0 &&
    typeof env.GITHUB_CLIENT_SECRET === "string" && env.GITHUB_CLIENT_SECRET.length > 0;
}

export function memberEmailOtpConfigured(env) {
  return env?.ANEVUM_EMAIL_OTP_ENABLED === "true" &&
    typeof env.ANEVUM_AUTH_RESEND_API_KEY === "string" &&
    env.ANEVUM_AUTH_RESEND_API_KEY.length > 12 &&
    typeof env.ANEVUM_AUTH_EMAIL_FROM === "string" &&
    VERIFIED_SENDER.test(env.ANEVUM_AUTH_EMAIL_FROM);
}

export function memberSignInMethods(env) {
  return [
    "google",
    ...(memberGithubConfigured(env) ? ["github"] : []),
    ...(memberEmailOtpConfigured(env) ? ["email"] : [])
  ];
}

export function isPrivilegedMemberEmail(env, email) {
  const protectedEmails = [
    env?.RHEN_OWNER_EMAIL,
    ...(String(env?.ANEVUM_STUDIO_ACCESS_EMAILS || "").split(","))
  ].map(item => String(item || "").trim().toLowerCase()).filter(Boolean);
  return protectedEmails.includes(String(email || "").trim().toLowerCase());
}

/** One-time login codes only. Never log tokens, addresses, OTPs or responses. */
export async function sendMemberEmailOtp(env, { email, otp, type }, send = fetch) {
  if (!memberEmailOtpConfigured(env)) throw new Error("Email login is unavailable.");
  if (type !== "sign-in" ||
      typeof email !== "string" || email.length > 254 || !EMAIL.test(email) ||
      typeof otp !== "string" || !/^\d{8}$/.test(otp) ||
      isPrivilegedMemberEmail(env, email)) {
    throw new Error("Email login is unavailable for this request.");
  }
  const response = await send("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + env.ANEVUM_AUTH_RESEND_API_KEY,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: env.ANEVUM_AUTH_EMAIL_FROM,
      to: [email],
      subject: "Your ANEVUM sign-in code",
      text: "Your ANEVUM sign-in code is: " + otp +
        "\n\nThis code expires in 10 minutes. If you did not request it, ignore this message."
    })
  });
  if (!response.ok) throw new Error("Email delivery is unavailable.");
}
