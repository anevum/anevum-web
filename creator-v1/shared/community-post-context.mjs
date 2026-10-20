// Public context is derived from the current catalogue, never a copied title.
// Missing context schema preserves general posts but cannot accept project links.
export async function communityContextEnabled(db) {
  const result=await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('community_post_projects','schema_migrations')").all();
  if(result.success===false||!Array.isArray(result.results))throw Error("Context storage unavailable");
  if(result.results.some(row=>row.name==='community_post_projects'))return true;
  if(result.results.some(row=>row.name==='schema_migrations')){
    const marker=await db.prepare("SELECT version FROM schema_migrations WHERE version='0013_community_post_projects'").all();
    if(marker.success===false||!Array.isArray(marker.results)||marker.results.length)throw Error('Context schema missing');
  }
  return false;
}
export function communityContextJoins(enabled) {
  return enabled ? " LEFT JOIN community_post_projects link ON link.post_id=p.id LEFT JOIN projects contextProject ON contextProject.id=link.project_id LEFT JOIN creator_profiles contextCreator ON contextCreator.member_id=contextProject.owner_member_id" : "";
}
export function communityContextVisible(enabled) {
  return enabled ? " AND (link.post_id IS NULL OR (contextProject.status='published' AND contextCreator.status='active' AND julianday(contextProject.published_at)<=julianday('now')))" : "";
}
export function communityPostFrom(enabled,status='published') {
  // status is a trusted implementation constant, never request input.
  return "FROM community_posts p JOIN creator_profiles c ON c.member_id=p.author_member_id JOIN member_accounts a ON a.id=p.author_member_id"+communityContextJoins(enabled)+" WHERE p.status='"+status+"' AND c.status='active' AND a.status='active'"+(status==='published'?" AND julianday(p.published_at)<=julianday('now')":"")+communityContextVisible(enabled);
}
export function communityContextFields(enabled) {
  return enabled ? ",contextProject.id AS projectId,contextProject.title AS projectTitle,contextProject.category AS projectCategory,contextCreator.handle AS projectCreatorHandle,contextCreator.display_name AS projectCreatorName" : ",NULL AS projectId";
}
export function communityProjectDto(row) {
  return row.projectId ? {id:row.projectId,title:row.projectTitle,category:row.projectCategory,creatorHandle:row.projectCreatorHandle,creatorName:row.projectCreatorName} : null;
}
