// Staff-only privacy queue; parent Worker verifies signed Cloudflare Access JWT.
// No completed/deleted action here: fulfillment requires a separately reviewed flow.
const HEADERS={'content-type':'application/json; charset=utf-8','cache-control':'private, no-store','x-robots-tag':'noindex, nofollow','x-content-type-options':'nosniff'};
export async function staffPrivacyRequests(req,db){
 if(new URL(req.url).pathname!=='/api/privacy-requests'||req.method!=='GET')return new Response(JSON.stringify({error:'Not found'}),{status:404,headers:HEADERS});
 const rows=await db.prepare(`SELECT r.id,r.state,r.requested_at AS requestedAt,r.updated_at AS updatedAt,a.email,c.handle
  FROM member_deletion_requests r JOIN member_accounts a ON a.id=r.member_id
  LEFT JOIN creator_profiles c ON c.member_id=a.id
  WHERE r.state IN ('requested','processing') ORDER BY r.requested_at ASC,r.id ASC LIMIT 50`).all();
 if(rows?.success===false||!Array.isArray(rows?.results))return new Response(JSON.stringify({error:'Queue unavailable'}),{status:503,headers:HEADERS});
 return new Response(JSON.stringify({requests:rows.results,notice:'Review queue only. No permanent erasure has been authorized or implemented.'}),{status:200,headers:HEADERS});
}