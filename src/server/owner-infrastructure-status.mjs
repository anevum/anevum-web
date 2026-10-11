// Bounded, query-only ANEVUM V5 provider observations.
// There is no client input and no provider write, token-management, or mutation path.
// The route using this module must first pass BOTH founder authentication gates.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ACCOUNT = /^[0-9a-f]{32}$/i;
const WORKERS = Object.freeze([
  {name: "anevum-web-nextgen", environment: "production"},
  {name: "anevum-member-staging", environment: "review-staging"}
]);
const DEPLOY_STATUSES = new Set(["SUCCESS", "FAILED", "CRASHED", "BUILDING", "DEPLOYING", "WAITING", "QUEUED", "INITIALIZING", "SKIPPED", "REMOVED", "REMOVING", "SLEEPING", "NEEDS_APPROVAL"]);
const RAILWAY_ENDPOINT = "https://backboard.railway.com/graphql/v2";
const QUERY_SCOPE = "query { projectToken { projectId environmentId } }";
const QUERY_PROJECT = "query Project($id: String!) { project(id: $id) { id name services { edges { node { id name } } } environments { edges { node { id name } } } } }";
const QUERY_INSTANCE = "query Instance($serviceId: String!, $environmentId: String!) { serviceInstance(serviceId: $serviceId, environmentId: $environmentId) { serviceName latestDeployment { id status createdAt } } }";
const LABEL = value => typeof value === "string" ? value.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, 96) : "";
const TIME = value => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T/.test(value)) return null;
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? new Date(ms).toISOString() : null;
};
const missing = value => typeof value !== "string" || value.length < 12 || value.length > 4096;
function cloudflareUnconfigured(){
  return {provider: "cloudflare", state: "NOT_CONFIGURED",
    workers: WORKERS.map(w => ({...w,state:"NOT_CONFIGURED",revision:null,deployed_at:null}))};
}
export async function observeCloudflare(env, fetchImpl = fetch) {
  const token = env?.CF_INFRA_READ_TOKEN;
  const account = env?.CF_INFRA_ACCOUNT_ID;
  if (missing(token) || !ACCOUNT.test(account || "")) return cloudflareUnconfigured();
  const workers = await Promise.all(WORKERS.map(async w => {
    const fallback = {...w,state:"UNAVAILABLE",revision:null,deployed_at:null};
    try {
      const resp = await fetchImpl("https://api.cloudflare.com/client/v4/accounts/"+account+
        "/workers/scripts/"+w.name+"/deployments?per_page=1",{
        method:"GET",redirect:"error",cache:"no-store",
        headers:{"Authorization":"Bearer "+token,"Accept":"application/json"},
        signal:AbortSignal.timeout(4500)
      });
      if (!resp.ok) return fallback;
      const payload = await resp.json();
      if (payload?.success !== true || !Array.isArray(payload?.result?.deployments)) return fallback;
      if (!payload.result.deployments.length)
        return {...w,state:"NO_DEPLOYMENTS",revision:null,deployed_at:null};
      const d = payload.result.deployments[0];
      if (!UUID.test(d?.id || "") || !TIME(d?.created_on)) return fallback;
      return {...w,state:"OBSERVED",revision:d.id,deployed_at:TIME(d.created_on)};
    } catch {return fallback;}
  }));
  const good = workers.filter(w => w.state !== "UNAVAILABLE").length;
  return {provider:"cloudflare",state:good === 0 ? "UNAVAILABLE" :
    good === workers.length ? "OBSERVED" : "PARTIAL",workers};
}
async function railwayRead(fetchImpl, token, query, variables = {}) {
  const resp = await fetchImpl(RAILWAY_ENDPOINT,{
    method:"POST",redirect:"error",cache:"no-store",
    headers:{"Project-Access-Token":token,"Content-Type":"application/json","Accept":"application/json"},
    body:JSON.stringify({query,variables}),signal:AbortSignal.timeout(4500)
  });
  if (!resp.ok) throw new Error("Railway API unavailable");
  const body = await resp.json();
  // GraphQL can return HTTP 200 with authorization/schema errors. Never accept it.
  if (!body || !body.data || (Array.isArray(body.errors) && body.errors.length)) throw new Error("Invalid Railway response");
  return body.data;
}
const noRailway = state => ({provider:"railway",state,environment:"production",
  project_name:null,services:[],truncated:false});
export async function observeRailway(env, fetchImpl = fetch) {
  const token = env?.RAILWAY_INFRA_PROJECT_TOKEN;
  const projectId = String(env?.RAILWAY_INFRA_PROJECT_ID || "");
  const environmentId = String(env?.RAILWAY_INFRA_ENVIRONMENT_ID || "");
  if (missing(token) || !UUID.test(projectId) || !UUID.test(environmentId))
    return noRailway("NOT_CONFIGURED");
  try {
    const scope = await railwayRead(fetchImpl, token, QUERY_SCOPE);
    if (scope?.projectToken?.projectId !== projectId ||
        scope?.projectToken?.environmentId !== environmentId)
      return noRailway("UNAVAILABLE");
    const data = await railwayRead(fetchImpl, token, QUERY_PROJECT, {id:projectId});
    const project = data?.project;
    const foundEnv = project?.environments?.edges?.find(e => e?.node?.id === environmentId)?.node;
    const edges = project?.services?.edges;
    if (project?.id !== projectId || foundEnv?.name !== "production" || !Array.isArray(edges))
      return noRailway("UNAVAILABLE");
    // An empty, scoped, independently verified Railway project really has no services.
    if (!edges.length) return {...noRailway("NO_SERVICES"),project_name:LABEL(project.name)};
    const bounded = edges.slice(0,8);
    if (bounded.some(e => !UUID.test(e?.node?.id || ""))) return noRailway("UNAVAILABLE");
    const rows = await Promise.all(bounded.map(async e => {
      const name = LABEL(e.node.name) || "Unnamed service";
      const unavailable = {name,state:"UNAVAILABLE",deployment_status:null,deployed_at:null};
      try {
        const z = await railwayRead(fetchImpl, token, QUERY_INSTANCE,
          {serviceId:e.node.id,environmentId});
        const i = z?.serviceInstance;
        if (!i || typeof i !== "object") return unavailable;
        if (i.latestDeployment === null)
          return {name,state:"NO_DEPLOYMENT",deployment_status:null,deployed_at:null};
        const d = i.latestDeployment;
        if (!UUID.test(d?.id || "") || !DEPLOY_STATUSES.has(d?.status) || !TIME(d?.createdAt))
          return unavailable;
        return {name,state:"OBSERVED",deployment_status:d.status,deployed_at:TIME(d.createdAt)};
      } catch{return unavailable;}
    }));
    const incomplete = edges.length > bounded.length || rows.some(r=>r.state==="UNAVAILABLE");
    return {provider:"railway",state:incomplete?"PARTIAL":"OBSERVED",
      environment:"production",project_name:LABEL(project.name),
      services:rows,truncated:edges.length>bounded.length};
  } catch {return noRailway("UNAVAILABLE");}
}
export async function observeOwnerInfrastructure(env, {fetchImpl=fetch,now=new Date()} = {}) {
  const observedAt = now instanceof Date && Number.isFinite(now.getTime()) ? now.toISOString() : new Date().toISOString();
  const [cloudflare,railway] = await Promise.all([
    observeCloudflare(env,fetchImpl),observeRailway(env,fetchImpl)
  ]);
  return {schema_version:"anevum.owner.infrastructure.v1",observed_at:observedAt,
    can_mutate:false,broker_connected:false,providers:{cloudflare,railway}};
}
