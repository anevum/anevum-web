import api from "../api/worker.mjs";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === "/health" || url.pathname.startsWith("/api/v1/")) {
      return api.fetch(request, env, ctx);
    }
    return env.ASSETS.fetch(request);
  }
};
