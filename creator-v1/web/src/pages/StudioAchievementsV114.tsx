import {Link,Navigate,useParams} from 'react-router-dom';
import {canonicalAuthClient} from '../lib/canonical-beta';
import {studioAchievementApi} from '../lib/studio-achievements-v114';
import {CreatorAchievementBuilderV114} from './CreatorAchievementBuilderV114';
import {UUID_V4} from '../../../shared/creator-achievements-v114.mjs';
export function StudioAchievementEntry(){
 const {data:session,isPending}=canonicalAuthClient.useSession();const {projectId=''}=useParams();
 if(import.meta.env.VITE_CREATOR_ACHIEVEMENTS_V114!=='true'||isPending||!session?.user?.emailVerified||!UUID_V4.test(projectId))return null;
 return <nav className="cav-entry" aria-label="Project achievement tools"><Link to={'/studio/'+projectId+'/achievements'}>Design achievements &amp; rewards</Link><small>Private definitions only. No player awards or XP.</small></nav>;
}
export function StudioAchievementsPage(){
 const {data:session,isPending}=canonicalAuthClient.useSession();const {projectId=''}=useParams();
 if(import.meta.env.VITE_CREATOR_ACHIEVEMENTS_V114!=='true')return <Navigate to="/studio" replace/>;
 if(isPending)return <section className="st-status" role="status">Verifying private Creator Studio identity...</section>;
 if(!session?.user?.id||session.user.emailVerified!==true)return <section className="st-status"><h1>Sign in to design project achievements.</h1><Link to="/join">Member sign-in</Link></section>;
 if(!UUID_V4.test(projectId))return <section className="st-status"><h1>Project unavailable.</h1><Link to="/studio/records">Return to private projects</Link></section>;
 return <><nav className="cav-entry"><Link to={'/studio/'+projectId}>Return to project record</Link><Link to="/studio/workspace">Creator workspace</Link></nav>
  <CreatorAchievementBuilderV114 key={session.user.id+':'+projectId} projectId={projectId} api={studioAchievementApi}/></>;
}
