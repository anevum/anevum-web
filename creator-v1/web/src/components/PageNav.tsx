import { Link } from "react-router-dom";
import { cursorRoute } from "../lib/navigation";

export function PageNav({route,search,nextCursor,label}:{
  route:string;search:URLSearchParams;nextCursor:string|null;label:string;
}) {
  if (!search.has("cursor") && !nextCursor) return null;
  return <nav className="public-pagination" aria-label={label+" pagination"}>
    {search.has("cursor") ? <Link className="button secondary" to={cursorRoute(route,search,null)}>FIRST PAGE</Link> : <span aria-hidden="true"/>}
    {nextCursor ? <Link className="button secondary" to={cursorRoute(route,search,nextCursor)}>NEXT PAGE →</Link> : <span className="page-end">END OF PUBLISHED RESULTS</span>}
  </nav>;
}
