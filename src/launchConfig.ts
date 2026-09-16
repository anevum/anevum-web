import { cleanPublicValue, configuredButRejected, safeHttpsUrl, safePublicPathOrHttpsUrl } from "./configSafety";

export type ReplyEdition = {
  label: "Hardcover" | "Paperback" | "eBook";
  note: string;
  href: string;
};

const rawGeneralBuyUrl = import.meta.env.VITE_REPLY_BUY_URL;
const rawHardcoverUrl = import.meta.env.VITE_REPLY_HARDCOVER_URL;
const rawPaperbackUrl = import.meta.env.VITE_REPLY_PAPERBACK_URL;
const rawEbookUrl = import.meta.env.VITE_REPLY_EBOOK_URL;
const rawSampleUrl = import.meta.env.VITE_REPLY_SAMPLE_URL;
const rawCoverUrl = import.meta.env.VITE_REPLY_COVER_URL;
const rawHeroImageUrl = import.meta.env.VITE_REPLY_HERO_IMAGE_URL;

const generalBuyUrl = safeHttpsUrl(rawGeneralBuyUrl);
const hardcoverUrl = safeHttpsUrl(rawHardcoverUrl);
const paperbackUrl = safeHttpsUrl(rawPaperbackUrl);
const ebookUrl = safeHttpsUrl(rawEbookUrl);
const sampleUrl = safePublicPathOrHttpsUrl(rawSampleUrl);
const coverUrl = safePublicPathOrHttpsUrl(rawCoverUrl);
const heroImageUrl = safePublicPathOrHttpsUrl(rawHeroImageUrl);

const editions: ReplyEdition[] = [];
if (hardcoverUrl) editions.push({ label: "Hardcover", note: "Print edition", href: hardcoverUrl });
if (paperbackUrl) editions.push({ label: "Paperback", note: "Print edition", href: paperbackUrl });
if (ebookUrl) editions.push({ label: "eBook", note: "Digital edition", href: ebookUrl });

export const replyLaunchConfig = {
  generalBuyUrl,
  editions,
  primaryPurchaseUrl: editions[0]?.href || generalBuyUrl,
  primaryPurchaseLabel: editions[0]?.label || "REPLY",
  releaseLabel: cleanPublicValue(import.meta.env.VITE_REPLY_RELEASE_LABEL),
  sampleUrl,
  coverUrl,
  heroImageUrl,
} as const;

export const replyLaunchRejected = {
  purchase: [
    configuredButRejected(rawGeneralBuyUrl, generalBuyUrl),
    configuredButRejected(rawHardcoverUrl, hardcoverUrl),
    configuredButRejected(rawPaperbackUrl, paperbackUrl),
    configuredButRejected(rawEbookUrl, ebookUrl),
  ].some(Boolean),
  sample: configuredButRejected(rawSampleUrl, sampleUrl),
  cover: configuredButRejected(rawCoverUrl, coverUrl),
  hero: configuredButRejected(rawHeroImageUrl, heroImageUrl),
} as const;

export const replyLaunchConfigured = {
  purchase: Boolean(replyLaunchConfig.primaryPurchaseUrl),
  editionSpecific: replyLaunchConfig.editions.length > 0,
  releaseLabel: Boolean(replyLaunchConfig.releaseLabel),
  sample: Boolean(replyLaunchConfig.sampleUrl),
  cover: Boolean(replyLaunchConfig.coverUrl),
  hero: Boolean(replyLaunchConfig.heroImageUrl),
} as const;
