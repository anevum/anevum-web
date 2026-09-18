import { canonProjectionRecords } from "./src/canonProjection.ts";

const ROOT_HOST = "anevum.com";
const WIKI_HOST = "wiki.anevum.com";
const LATTICE_HOST = "lattice.anevum.com";
const COMMAND_HOST = "command.anevum.com";

const ROOT_META_SHELLS = new Map([
  ["/the-book", "/__meta/the-book.html"],
  ["/the-story", "/__meta/the-story.html"],
  ["/store", "/__meta/store.html"],
  ["/rhenlink", "/__meta/rhenlink.html"],
  ["/about", "/__meta/about.html"],
  ["/privacy", "/__meta/privacy.html"],
  ["/terms", "/__meta/terms.html"],
  ["/contact", "/__meta/contact.html"],
]);

const ROOT_PUBLIC_PATHS = new Set(["/", ...ROOT_META_SHELLS.keys()]);
const WIKI_PRIVATE_PATHS = new Set(["/new", "/saved", "/admin"]);
const wikiBySlug = new Map(canonProjectionRecords.map((record) => [record.slug, record]));

function normalizePath(pathname) {
  if (!pathname || pathname === "/") return "/";
  return pathname.replace(/\/+$/, "") || "/";
}

function safeDecode(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return "";
  }
}

function isHtml(response) {
  return response.headers.get("content-type")?.includes("text/html") === true;
}

function assetRequest(request, pathname) {
  const url = new URL(request.url);
  url.pathname = pathname;
  url.search = "";
  return new Request(url.toString(), request);
}

function withHeaders(response, additions = {}) {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(additions)) headers.set(key, value);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function content(value) {
  return { element(element) { element.setInnerContent(value); } };
}

function attribute(name, value) {
  return { element(element) { element.setAttribute(name, value); } };
}

function structuredData(value) {
  return {
    element(element) {
      if (!value) {
        element.remove();
        return;
      }
      const json = JSON.stringify(value).replaceAll("<", "\\u003c");
      element.setInnerContent(json, { html: true });
    },
  };
}

function rewriteHtml(response, meta) {
  if (!isHtml(response)) return response;

  const rewriter = new HTMLRewriter()
    .on("title", content(meta.title))
    .on('meta[name="description"]', attribute("content", meta.description))
    .on('meta[name="robots"]', attribute("content", meta.robots))
    .on('link[rel="canonical"]', attribute("href", meta.canonical))
    .on('meta[property="og:title"]', attribute("content", meta.ogTitle))
    .on('meta[property="og:description"]', attribute("content", meta.description))
    .on('meta[property="og:url"]', attribute("content", meta.canonical))
    .on('meta[property="og:type"]', attribute("content", meta.ogType))
    .on('meta[name="twitter:title"]', attribute("content", meta.ogTitle))
    .on('meta[name="twitter:description"]', attribute("content", meta.description))
    .on("script#anevum-structured-data", structuredData(meta.structuredData || null));

  return rewriter.transform(response);
}

function wikiMeta(pathname) {
  if (pathname === "/") {
    return {
      title: "ANEVUM Wiki",
      description: "The publication-safe surface of the live ANEVUM Wiki and its canonical lifecycle state.",
      canonical: "https://anevum.com/wiki",
      ogTitle: "ANEVUM Wiki",
      ogType: "website",
      robots: "index,follow,max-image-preview:large",
      structuredData: {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "ANEVUM Wiki",
        url: "https://anevum.com/wiki",
      },
    };
  }

  const normalized = pathname.replace(/^\/+|\/+$/g, "");
  const privatePath = WIKI_PRIVATE_PATHS.has(pathname) || normalized.endsWith("/edit");
  if (privatePath) {
    return {
      title: "ANEVUM Wiki — Private Workspace",
      description: "Authenticated ANEVUM Wiki contribution and moderation workspace.",
      canonical: `https://anevum.com/wiki${pathname === "/" ? "" : pathname}`,
      ogTitle: "ANEVUM Wiki",
      ogType: "website",
      robots: "noindex,follow,noarchive",
      structuredData: null,
    };
  }

  const slug = safeDecode(normalized);
  const record = slug ? wikiBySlug.get(slug) : null;
  if (!record) {
    return {
      title: "Record Not Released — ANEVUM Wiki",
      description: "This ANEVUM Wiki record is not part of the current publication-safe release projection.",
      canonical: `https://anevum.com/wiki${pathname === "/" ? "" : pathname}`,
      ogTitle: "ANEVUM Wiki",
      ogType: "website",
      robots: "noindex,follow,noarchive",
      structuredData: null,
    };
  }

  const canonical = `https://anevum.com/wiki/${record.slug}`;
  return {
    title: `${record.title} — ANEVUM Wiki`,
    description: record.summary,
    canonical,
    ogTitle: `${record.title} — ANEVUM Wiki`,
    ogType: "article",
    robots: "index,follow,max-image-preview:large",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: record.title,
      description: record.summary,
      url: canonical,
      isPartOf: { "@type": "WebSite", name: "ANEVUM Wiki", url: "https://anevum.com/wiki" },
    },
  };
}

const LATTICE_META = {
  title: "Lattice — ANEVUM",
  description: "ANEVUM's member and relational discovery layer, connecting release-cleared records with RHENLINK identity.",
  canonical: "https://anevum.com/lattice",
  ogTitle: "Lattice — ANEVUM",
  ogType: "website",
  robots: "index,follow,max-image-preview:large",
  structuredData: null,
};

const COMMAND_META = {
  title: "ANEVUM COMMAND",
  description: "Private ANEVUM company cockpit for publishing, product, canon, identity, finance and infrastructure.",
  canonical: "https://anevum.com/command",
  ogTitle: "ANEVUM COMMAND",
  ogType: "website",
  robots: "noindex,nofollow,noarchive",
  structuredData: null,
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const host = url.hostname.toLowerCase();
    const pathname = normalizePath(url.pathname);

    // Legacy subdomains are aliases only. Redirect into the single ANEVUM
    // origin so RHENLINK local storage and authenticated state cannot fork.
    if (host === WIKI_HOST) {
      const targetPath = pathname === "/" ? "/wiki" : `/wiki${pathname}`;
      return Response.redirect(`https://${ROOT_HOST}${targetPath}${url.search}`, 308);
    }
    if (host === LATTICE_HOST) {
      const targetPath = pathname === "/" ? "/lattice" : `/lattice${pathname}`;
      return Response.redirect(`https://${ROOT_HOST}${targetPath}${url.search}`, 308);
    }
    if (host === COMMAND_HOST) {
      return Response.redirect(`https://${ROOT_HOST}/command${url.search}`, 308);
    }

    let response;

    if (host === ROOT_HOST && ROOT_META_SHELLS.has(pathname)) {
      response = await env.ASSETS.fetch(assetRequest(request, ROOT_META_SHELLS.get(pathname)));
    } else {
      response = await env.ASSETS.fetch(request);
    }

    if (host === WIKI_HOST) {
      const meta = wikiMeta(pathname);
      response = rewriteHtml(response, meta);
      if (meta.robots.startsWith("noindex") && isHtml(response)) {
        response = withHeaders(response, { "X-Robots-Tag": "noindex, nofollow, noarchive" });
      }
      return response;
    }

    if (host === LATTICE_HOST) {
      return rewriteHtml(response, LATTICE_META);
    }

    if (host === COMMAND_HOST) {
      const html = isHtml(response);
      response = rewriteHtml(response, COMMAND_META);
      if (!html) return response;
      return withHeaders(response, {
        "X-Robots-Tag": "noindex, nofollow, noarchive",
        "Cache-Control": "private, no-store",
      });
    }

    if (host === ROOT_HOST) {
      if (pathname === "/wiki" || pathname.startsWith("/wiki/")) {
        const wikiPath = pathname === "/wiki" ? "/" : pathname.slice(5) || "/";
        const meta = wikiMeta(wikiPath);
        response = rewriteHtml(response, meta);
        if (meta.robots.startsWith("noindex") && isHtml(response)) {
          return withHeaders(response, { "X-Robots-Tag": "noindex, nofollow, noarchive" });
        }
        return response;
      }

      if (pathname === "/lattice" || pathname.startsWith("/lattice/")) {
        return rewriteHtml(response, LATTICE_META);
      }

      if (pathname === "/command" || pathname.startsWith("/command/")) {
        const html = isHtml(response);
        response = rewriteHtml(response, COMMAND_META);
        if (!html) return response;
        return withHeaders(response, {
          "X-Robots-Tag": "noindex, nofollow, noarchive",
          "Cache-Control": "private, no-store",
        });
      }

      if (pathname === "/rhenlink" || pathname === "/auth-bridge" || !ROOT_PUBLIC_PATHS.has(pathname)) {
        if (isHtml(response)) return withHeaders(response, { "X-Robots-Tag": "noindex, follow, noarchive" });
      }
      return response;
    }

    if (isHtml(response)) return withHeaders(response, { "X-Robots-Tag": "noindex, nofollow, noarchive" });
    return response;
  },
};
