// Same Worker, same bindings. All non-catalog routes keep the existing handler.
import legacy from './worker.mjs';
import {makeMemberAuth,memberConfigured,safeMutation} from './src/server/member.mjs';
import {resolveMemberOrigin} from './src/server/member-preflight.mjs';
import {createCatalogWorker} from './src/server/creator-dispatch.mjs';
export default createCatalogWorker({legacy,makeMemberAuth,memberConfigured,safeMutation,resolveMemberOrigin});
