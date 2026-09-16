export type ReplyEdition = {
  label: "Hardcover" | "Paperback" | "eBook";
  note: string;
  href: string;
};

function envValue(value: unknown) {
  return String(value || "").trim();
}

const generalBuyUrl = envValue(import.meta.env.VITE_REPLY_BUY_URL);
const hardcoverUrl = envValue(import.meta.env.VITE_REPLY_HARDCOVER_URL);
const paperbackUrl = envValue(import.meta.env.VITE_REPLY_PAPERBACK_URL);
const ebookUrl = envValue(import.meta.env.VITE_REPLY_EBOOK_URL);

const editions: ReplyEdition[] = [];
if (hardcoverUrl) editions.push({ label: "Hardcover", note: "Print edition", href: hardcoverUrl });
if (paperbackUrl) editions.push({ label: "Paperback", note: "Print edition", href: paperbackUrl });
if (ebookUrl) editions.push({ label: "eBook", note: "Digital edition", href: ebookUrl });

export const replyLaunchConfig = {
  generalBuyUrl,
  editions,
  primaryPurchaseUrl: editions[0]?.href || generalBuyUrl,
  primaryPurchaseLabel: editions[0]?.label || "REPLY",
  releaseLabel: envValue(import.meta.env.VITE_REPLY_RELEASE_LABEL),
  sampleUrl: envValue(import.meta.env.VITE_REPLY_SAMPLE_URL),
  coverUrl: envValue(import.meta.env.VITE_REPLY_COVER_URL),
  heroImageUrl: envValue(import.meta.env.VITE_REPLY_HERO_IMAGE_URL),
} as const;

export const replyLaunchConfigured = {
  purchase: Boolean(replyLaunchConfig.primaryPurchaseUrl),
  editionSpecific: replyLaunchConfig.editions.length > 0,
  releaseLabel: Boolean(replyLaunchConfig.releaseLabel),
  sample: Boolean(replyLaunchConfig.sampleUrl),
  cover: Boolean(replyLaunchConfig.coverUrl),
  hero: Boolean(replyLaunchConfig.heroImageUrl),
} as const;
