// Existing edge retirement Worker: keep both retired routes independent of member auth and D1.
export default {
  async fetch(request) {
    const path = new URL(request.url).pathname;
    const headers = {'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'};
    if (/^\/thebutton(?:\/|$)/.test(path)) {
      return new Response(null,{status:302,headers:{...headers,Location:new URL('/levels',request.url).toString()}});
    }
    return new Response(JSON.stringify({error:'Not found'}),{status:404,headers:{...headers,'Content-Type':'application/json; charset=utf-8'}});
  }
};
