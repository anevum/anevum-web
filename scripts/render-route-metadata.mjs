import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const DIST_DIR = new URL("../dist/", import.meta.url);
const INDEX_PATH = new URL("../dist/index.html", import.meta.url);
const META_DIR = new URL("../dist/__meta/", import.meta.url);

const bookSchema = {
  "@context": "https://schema.org",
  "@type": "Book",
  name: "REPLY",
  url: "https://anevum.com/the-book",
  description: "REPLY is The Transcosmic Book One, a science-fiction novel by Devon Akins and the first publication from ANEVUM.",
  author: { "@type": "Person", name: "Devon Akins" },
  isPartOf: { "@type": "BookSeries", name: "The Transcosmic" },
};

const routes = [
  {
    path: "/",
    file: "index.html",
    title: "REPLY — A Transcosmic Novel | ANEVUM",
    description: "REPLY is the first Transcosmic novel by Devon Akins, arriving November 17, 2026 from ANEVUM.",
    canonical: "https://anevum.com/",
    ogTitle: "REPLY — A Transcosmic Novel",
    ogType: "book",
    robots: "index,follow,max-image-preview:large",
    structuredData: bookSchema,
  },
  {
    path: "/stories",
    file: "stories.html",
    title: "Stories — ANEVUM",
    description: "Enter ANEVUM through its stories. REPLY is Publication 001 and the first Transcosmic novel by Devon Akins.",
    canonical: "https://anevum.com/stories",
    ogTitle: "Stories — ANEVUM",
    ogType: "website",
    robots: "index,follow,max-image-preview:large",
  },
  {
    path: "/stories/reply",
    file: "stories-reply.html",
    title: "REPLY — The Book | ANEVUM",
    description: "REPLY is The Transcosmic Book One, a science-fiction novel by Devon Akins and the first publication from ANEVUM.",
    canonical: "https://anevum.com/the-book",
    ogTitle: "REPLY — The Book",
    ogType: "book",
    robots: "index,follow,max-image-preview:large",
    structuredData: bookSchema,
  },
  {
    path: "/explore",
    file: "explore.html",
    title: "Explore the Universe — ANEVUM",
    description: "Move through release-cleared ANEVUM people, places, institutions, technologies, events, and concepts by relationship.",
    canonical: "https://anevum.com/explore",
    ogTitle: "Explore — ANEVUM",
    ogType: "website",
    robots: "index,follow,max-image-preview:large",
  },
  {
    path: "/archive",
    file: "archive.html",
    title: "Archive — ANEVUM",
    description: "Search and filter the publication-safe ANEVUM record.",
    canonical: "https://anevum.com/archive",
    ogTitle: "Archive — ANEVUM",
    ogType: "website",
    robots: "index,follow,max-image-preview:large",
  },
  {
    path: "/transmissions",
    file: "transmissions.html",
    title: "Transmissions — ANEVUM",
    description: "Official ANEVUM publication updates, essays, production notes, and announcements.",
    canonical: "https://anevum.com/transmissions",
    ogTitle: "Transmissions — ANEVUM",
    ogType: "website",
    robots: "index,follow,max-image-preview:large",
  },
  {
    path: "/search",
    file: "search.html",
    title: "Search — ANEVUM",
    description: "Search the publication-safe ANEVUM Archive and public Wiki.",
    canonical: "https://anevum.com/search",
    ogTitle: "Search — ANEVUM",
    ogType: "website",
    robots: "index,follow,max-image-preview:large",
  },
  {
    path: "/the-book",
    file: "the-book.html",
    title: "REPLY — The Book | ANEVUM",
    description: "REPLY is The Transcosmic Book One, a science-fiction novel by Devon Akins and the first publication from ANEVUM.",
    canonical: "https://anevum.com/the-book",
    ogTitle: "REPLY — The Book",
    ogType: "book",
    robots: "index,follow,max-image-preview:large",
    structuredData: bookSchema,
  },
  {
    path: "/the-story",
    file: "the-story.html",
    title: "The Story of REPLY | ANEVUM",
    description: "Enter the spoiler-light public story doorway into REPLY, The Transcosmic Book One by Devon Akins.",
    canonical: "https://anevum.com/the-story",
    ogTitle: "The Story of REPLY",
    ogType: "article",
    robots: "index,follow,max-image-preview:large",
  },
  {
    path: "/store",
    file: "store.html",
    title: "ANEVUM Store — REPLY",
    description: "Official availability and editions for REPLY, The Transcosmic Book One by Devon Akins.",
    canonical: "https://anevum.com/store",
    ogTitle: "ANEVUM Store — REPLY",
    ogType: "website",
    robots: "index,follow,max-image-preview:large",
  },
  {
    path: "/rhenlink",
    file: "rhenlink.html",
    title: "RHENLINK — ANEVUM Identity",
    description: "RHENLINK is the persistent member identity for ANEVUM.",
    canonical: "https://anevum.com/rhenlink",
    ogTitle: "RHENLINK — ANEVUM",
    ogType: "website",
    robots: "noindex,follow,noarchive",
  },
  {
    path: "/about",
    file: "about.html",
    title: "About ANEVUM — Stories First",
    description: "How ANEVUM connects REPLY, the canonical Wiki, Lattice and RHENLINK while keeping finished stories at the center.",
    canonical: "https://anevum.com/about",
    ogTitle: "About ANEVUM",
    ogType: "website",
    robots: "index,follow,max-image-preview:large",
  },
  {
    path: "/privacy",
    file: "privacy.html",
    title: "Privacy — ANEVUM",
    description: "How the current ANEVUM website and RHENLINK member system use account, progress, release-preference, and optional analytics data.",
    canonical: "https://anevum.com/privacy",
    ogTitle: "Privacy — ANEVUM",
    ogType: "website",
    robots: "index,follow,max-image-preview:large",
  },
  {
    path: "/terms",
    file: "terms.html",
    title: "Terms — ANEVUM",
    description: "Launch-era terms for the ANEVUM website, RHENLINK, Wiki, Lattice, progression systems, and external REPLY purchase links.",
    canonical: "https://anevum.com/terms",
    ogTitle: "Terms — ANEVUM",
    ogType: "website",
    robots: "index,follow,max-image-preview:large",
  },
  {
    path: "/contact",
    file: "contact.html",
    title: "Contact — ANEVUM",
    description: "Current public contact and support status for ANEVUM, REPLY, and RHENLINK.",
    canonical: "https://anevum.com/contact",
    ogTitle: "Contact — ANEVUM",
    ogType: "website",
    robots: "index,follow,max-image-preview:large",
  },
];

function escapeAttribute(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function replaceOrInsert(html, pattern, tag) {
  if (pattern.test(html)) return html.replace(pattern, tag);
  return html.replace("</head>", `    ${tag}\n  </head>`);
}

function setNamedMeta(html, name, content) {
  const tag = `<meta name="${name}" content="${escapeAttribute(content)}" />`;
  const pattern = new RegExp(`<meta\\s+name=["']${name}["'][^>]*>`, "i");
  return replaceOrInsert(html, pattern, tag);
}

function setPropertyMeta(html, property, content) {
  const tag = `<meta property="${property}" content="${escapeAttribute(content)}" />`;
  const pattern = new RegExp(`<meta\\s+property=["']${property}["'][^>]*>`, "i");
  return replaceOrInsert(html, pattern, tag);
}

function setCanonical(html, href) {
  const tag = `<link rel="canonical" href="${escapeAttribute(href)}" />`;
  const pattern = /<link\s+rel=["']canonical["'][^>]*>/i;
  return replaceOrInsert(html, pattern, tag);
}

function setStructuredData(html, value) {
  const existing = /\s*<script\s+id=["']anevum-structured-data["'][^>]*>[\s\S]*?<\/script>/i;
  const withoutExisting = html.replace(existing, "");
  if (!value) return withoutExisting;
  const json = JSON.stringify(value).replaceAll("<", "\\u003c");
  return withoutExisting.replace(
    "</head>",
    `    <script id="anevum-structured-data" type="application/ld+json">${json}</script>\n  </head>`,
  );
}

function renderRoute(baseHtml, route) {
  let html = baseHtml.replace(/<title>[\s\S]*?<\/title>/i, `<title>${route.title}</title>`);
  html = setNamedMeta(html, "robots", route.robots);
  html = setNamedMeta(html, "description", route.description);
  html = setNamedMeta(html, "twitter:title", route.ogTitle);
  html = setNamedMeta(html, "twitter:description", route.description);
  html = setCanonical(html, route.canonical);
  html = setPropertyMeta(html, "og:title", route.ogTitle);
  html = setPropertyMeta(html, "og:description", route.description);
  html = setPropertyMeta(html, "og:type", route.ogType);
  html = setPropertyMeta(html, "og:url", route.canonical);
  html = setStructuredData(html, route.structuredData || null);
  return html;
}

const baseHtml = await readFile(INDEX_PATH, "utf8");
await mkdir(META_DIR, { recursive: true });

for (const route of routes) {
  const rendered = renderRoute(baseHtml, route);
  const output = route.path === "/" ? INDEX_PATH : new URL(`../dist/__meta/${route.file}`, import.meta.url);
  await writeFile(output, rendered, "utf8");
  console.log(`Static metadata shell: ${route.path} -> ${route.path === "/" ? "dist/index.html" : join("dist", "__meta", route.file)}`);
}

console.log(`Static metadata shells ready: ${routes.length} routes.`);
