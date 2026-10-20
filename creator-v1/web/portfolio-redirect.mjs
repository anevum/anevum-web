// Preserve portfolio business-card links while making the apex path canonical.
export default {
  async fetch(request) {
    const url=new URL(request.url);
    if(url.hostname!=="portfolio.anevum.com" || url.protocol!=="https:")
      return new Response("Not found",{status:404});
    if(!["GET","HEAD"].includes(request.method))
      return new Response("Method not allowed",{status:405});
    return new Response(null,{status:308,headers:{
      Location:"https://anevum.com/portfolio"+url.pathname+url.search,
      "cache-control":"no-store","x-content-type-options":"nosniff",
      "referrer-policy":"no-referrer"
    }});
  }
};
