/* 
 * ANEVUM PORCHLIGHT OFFLINE REVIEW ONLY.
 * This replaces fetch for a synthetic, in-memory UI exercise. It is not
 * the Porchlight production API and MUST NOT be served as a live site.
 * No network, GPS, browser storage, accounts, or real addresses.
 */
(() => {
  "use strict";
  const prefix = "/api/v1/porchlight";
  const slug = "fictional-halloween";
  const baseline = Object.freeze([
    Object.freeze({
      id: "00000000-0000-4000-8000-000000000101",
      name: "FICTIONAL Lantern House",
      location: "MOCK POINT — NOT A RESIDENCE",
      visibility: "exact",
      lat: 0,
      lng: 0,
      options: ["candy", "non_food"]
    }),
    Object.freeze({
      id: "00000000-0000-4000-8000-000000000102",
      name: "Participating household",
      location: "Fictional Sector",
      visibility: "area",
      lat: null,
      lng: null,
      options: ["decorations"]
    })
  ]);
  const event = Object.freeze({
    slug,
    title: "FICTIONAL Halloween Demonstration",
    neighborhood: "Fictional Sector",
    startsAt: Math.floor(Date.now() / 1000) - 3600,
    endsAt: Math.floor(Date.now() / 1000) + 86400,
    center: { lat: 0, lng: 0 },
    note: "Fictional demonstration: not an operating event."
  });
  const state = {
    hosts: baseline.map(item => ({ ...item, options: [...item.options] })),
    submitted: null,
    receipt: null,
    closed: false,
    reports: 0,
    outboundRequestsBlocked: 0
  };
  const answer = (value, status = 200) =>
    new Response(JSON.stringify(value), {
      status,
      headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }
    });
  const deny = (code, status = 400) => answer({ ok: false, code }, status);
  const allFictional = body =>
    typeof body === "object" && body !== null &&
    /^demo /i.test(body.hostName || "") &&
    /^[^@\s]+@example\.test$/i.test(body.contactEmail || "") &&
    /^000 FAKE PLACE\b/.test(body.privateAddress || "");
  const hex = length => {
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    return [...bytes].map(x => x.toString(16).padStart(2, "0")).join("");
  };
  const refresh = () => {
    const picker = document.getElementById("event-picker");
    if (picker && !picker.disabled) picker.dispatchEvent(new Event("change"));
  };
  const tell = msg => {
    const el = document.getElementById("demo-feedback");
    if (el) el.textContent = msg;
  };
  const ensureLocal = req => {
    if (typeof req !== "string" || !req.startsWith(prefix)) throw Error("OFFLINE_REVIEW_BLOCKED_EXTERNAL_REQUEST");
  };
  window.fetch = async (input, options = {}) => {
    ensureLocal(input);
    const path = input.slice(prefix.length);
    const method = (options.method || "GET").toUpperCase();
    let body = null;
    if (options.body) {
      try { body = JSON.parse(options.body); }
      catch { return deny("INVALID_DEMO_JSON", 400); }
    }
    if (path === "/events" && method === "GET") {
      return answer({ ok: true, events: state.closed ? [] : [event], mapStyleUrl: null });
    }
    if (path === "/events/" + slug + "/hosts" && method === "GET") {
      return answer({ ok: true, hosts: state.closed ? [] : state.hosts });
    }
    if (path === "/events/" + slug + "/hosts" && method === "POST") {
      if (state.closed) return deny("FICTIONAL_EVENT_CLOSED", 404);
      if (!allFictional(body)) return deny("DEMO_REQUIRES_FICTIONAL_TEST_DATA", 422);
      if (!body.consent || body.consent.isAdult !== true ||
          body.consent.controlsHome !== true ||
          body.consent.publishApprovedInfo !== true ||
          (body.visibility === "exact" && body.consent.exactLocation !== true))
        return deny("DEMO_CONSENT_REQUIRED", 422);
      if (state.submitted && state.submitted.status !== "withdrawn")
        return deny("DEMO_ONE_HOST_AT_A_TIME", 409);
      const id = "00000000-0000-4000-8000-" + hex(6);
      const receipt = hex(32);
      state.submitted = { id, status: "pending", visibility: body.visibility,
        name: "FICTIONAL Demo Household", options: [...(body.options || [])] };
      state.receipt = receipt;
      tell("Fictional application pending. Use 'Simulate organizer approval' to see the host card.");
      return answer({
        ok: true, id, receipt, status: "pending",
        notice: "FICTIONAL TEST ONLY. No data was sent or persisted."
      }, 201);
    }
    const removal = /^\/submissions\/([0-9a-f-]{36})\/revoke$/.exec(path);
    if (removal && method === "POST") {
      if (!state.submitted || state.submitted.id !== removal[1] ||
          !body || body.receipt !== state.receipt)
        return deny("DEMO_REMOVAL_CODE_NOT_RECOGNIZED", 404);
      state.hosts = state.hosts.filter(host => host.id !== removal[1]);
      state.submitted.status = "withdrawn";
      state.receipt = null;
      tell("The fictional host was removed from this browser's temporary demo state.");
      return answer({ ok: true, status: "withdrawn", notice: "FICTIONAL TEST REMOVAL" });
    }
    if (path === "/events/" + slug + "/reports" && method === "POST") {
      if (!body || !state.hosts.some(host => host.id === body.hostId))
        return deny("DEMO_HOST_NOT_FOUND", 404);
      state.reports += 1;
      tell("Fictional report simulated. Report text was discarded; nothing was submitted.");
      return answer({ ok: true, notice: "Fictional report, not submitted to anyone." }, 201);
    }
    return deny("OFFLINE_DEMO_API_DISABLED", 404);
  };
  // Intercept outgoing navigation too. Test coordinates are in the ocean,
  // but clicking Maps should not contact any third-party website.
  document.addEventListener("click", ev => {
    const anchor = ev.target instanceof Element ? ev.target.closest("a[href]") : null;
    if (anchor && /^https?:\/\//.test(anchor.getAttribute("href") || "")) {
      ev.preventDefault();
      state.outboundRequestsBlocked++;
      tell("External maps and all outbound links are disabled in offline review.");
    }
  }, true);
  document.addEventListener("DOMContentLoaded", () => {
    const fill = document.getElementById("demo-fill");
    const approve = document.getElementById("demo-approve");
    const close = document.getElementById("demo-close");
    const reset = document.getElementById("demo-reset");
    if (!fill || !approve || !close || !reset) throw Error("OFFLINE_REVIEW_CONTROLS_MISSING");
    fill.addEventListener("click", () => {
      document.getElementById("host-name").value = "DEMO Household";
      document.getElementById("host-email").value = "household@example.test";
      document.getElementById("host-address").value = "000 FAKE PLACE — FICTIONAL";
      document.getElementById("host-note").value = "";
      document.querySelector('input[name="visibility"][value="area"]').checked = true;
      document.querySelector('input[name="visibility"][value="area"]').dispatchEvent(new Event("change"));
      document.getElementById("host-adult").checked = true;
      document.getElementById("host-public").checked = true;
      const candy = document.querySelector('input[name="options"][value="candy"]');
      candy.checked = true;
      tell("Fictional form data inserted. Submit it to see the pending review state.");
      document.getElementById("host-form").scrollIntoView({ block: "center" });
    });
    approve.addEventListener("click", () => {
      const host = state.submitted;
      if (!host || host.status !== "pending") return tell("Submit a fictional adult host first.");
      state.hosts.push({
        id: host.id,
        name: host.visibility === "exact" ? host.name : "Participating household",
        location: host.visibility === "exact" ? "MOCK POINT — NOT A RESIDENCE" : "Fictional Sector",
        visibility: host.visibility,
        lat: host.visibility === "exact" ? 0 : null,
        lng: host.visibility === "exact" ? 0 : null,
        options: [...host.options]
      });
      host.status = "published";
      tell("Simulated organizer approval. This is not an actual review or authorization.");
      refresh();
    });
    close.addEventListener("click", () => {
      state.closed = true;
      state.hosts = [];
      tell("Fictional event closed. All demo hosts are hidden. Reload to reset.");
      const list = document.getElementById("host-list");
      const map = document.getElementById("map-content");
      if (list) list.replaceChildren();
      if (map) map.replaceChildren();
      document.getElementById("host-count").textContent = "0";
      document.getElementById("directory-status").textContent =
        "DEMO CLOSED. No event or household information is published.";
      document.getElementById("host-submit").disabled = true;
    });
    reset.addEventListener("click", () => location.reload());
  });
  Object.defineProperty(window, "__porchlightReview", {
    value: Object.freeze({ snapshot: () => ({
      fictionalOnly: true,
      hostCount: state.closed ? 0 : state.hosts.length,
      pending: state.submitted?.status || null,
      reportCount: state.reports,
      closed: state.closed,
      outboundRequestsBlocked: state.outboundRequestsBlocked
    }) }),
    writable: false, configurable: false
  });
})();
