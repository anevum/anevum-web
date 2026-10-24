// Reads only public GitHub PR metadata. Never treats PR state as live production health.
let cached = null;

export async function getPublicDevelopmentActivity(fetchImpl = globalThis.fetch, now = Date.now()) {
  if (cached && cached.expires > now) return cached.value;
  try {
    const result = await fetchImpl(
      "https://api.github.com/repos/anevum/anevum-web/pulls?state=open&per_page=8&sort=updated&direction=desc",
      {
        headers: {
          Accept: "application/vnd.github+json",
          "User-Agent": "ANEVUM-Continuance-House-V001"
        },
        signal: AbortSignal.timeout(5000)
      }
    );
    if (!result.ok) throw new Error("GitHub unavailable");
    const raw = await result.json();
    if (!Array.isArray(raw)) throw new Error("Unexpected GitHub response");
    const value = {
      live: true,
      source: "public-github-prs",
      note: "Open public pull requests, not production deployment or CI verification.",
      fetchedAt: new Date(now).toISOString(),
      items: raw.slice(0, 8).filter((item) =>
        typeof item.html_url === "string" &&
        /^https:\/\/github\.com\/anevum\/anevum-web\/pull\/\d+$/.test(item.html_url)
      ).map((item) => ({
        number: Number(item.number) || 0,
        title: String(item.title || "Untitled change").slice(0, 160),
        url: item.html_url,
        updatedAt: typeof item.updated_at === "string" ? item.updated_at : null,
        draft: Boolean(item.draft)
      }))
    };
    cached = { value, expires: now + 120000 };
    return value;
  } catch {
    return {
      live: false,
      source: "public-github-prs",
      note: "Public development activity could not be retrieved. No status has been inferred.",
      fetchedAt: new Date(now).toISOString(),
      items: []
    };
  }
}
