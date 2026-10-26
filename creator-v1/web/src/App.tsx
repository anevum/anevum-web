import { Navigate, Route, Routes, useLocation, useParams } from "react-router-dom";
import { lazy, Suspense } from "react";
import { Shell } from "./components/Shell";
import {PublicPageMetadata} from "./components/PublicPageMetadata";
import { CinematicLandingPage } from "./pages/CinematicLandingPage";
import { FieldGuidePage } from "./pages/FieldGuidePage";
import { StartPage } from "./pages/StartPage";
import { DiscoverPage } from "./pages/DiscoverPage";
import { ProjectPage } from "./pages/ProjectPage";
import { CreatorPage, CreatorsPage } from "./pages/CreatorsPage";
import { StatusPage } from "./pages/StatusPage";
import { LevelsPage } from "./pages/LevelsPage";
import { RecognitionRegistryPage } from "./pages/RecognitionRegistryPage";
import { AuraCodexPage } from "./pages/AuraCodexPage";
import { CommunityPage } from "./pages/CommunityPage";
import {CommunityThread} from "./pages/CanonicalForums";
import {ForumReviewPage} from "./pages/ForumReviewPage";
import {CommunityPostPage} from "./pages/CommunityPostPage";
import {CommunityPostEditorPage} from "./pages/CommunityPostEditorPage";
import { MemberGate } from "./components/MemberGate";
import { LoadingState } from "./components/States";
import { MemberLibraryPage } from "./pages/MemberLibraryPage";
import {CanonicalSavedWorksPage} from "./pages/CanonicalSavedWorksPage";
import {nativeCreatorEnabled} from "./lib/native-creator-v095";
import { CanonicalStudioPage } from "./pages/CanonicalStudioPage";
import {PublicCreatorAlphaPage} from "./pages/PublicCreatorAlphaPage";
import {Phase1JoinPage} from "./pages/Phase1JoinPage";
import {Phase1MemberPage} from "./pages/Phase1MemberPage";
import {Phase1PublicMemberPage} from "./pages/Phase1PublicMemberPage";

import {AnevumNotifications} from './components/AnevumNotifications';
// Retired test XP calibration remains disabled.
import {SupporterPage} from './pages/SupporterPage';
import SupporterTransparencyPage from './pages/SupporterTransparencyPage';
import SupporterCollectionPage from './pages/SupporterCollectionPage';

const WorkbenchAlphaPage=lazy(()=>import("./pages/WorkbenchAlpha").then(m=>({default:m.WorkbenchAlphaPage})));
const NativeCreatorStudioPage=lazy(()=>import("./pages/NativeCreatorStudio").then(m=>({default:m.NativeCreatorStudioPage})));
const NativePackagePlayerPage=lazy(()=>import("./pages/NativeCreatorStudio").then(m=>({default:m.NativePackagePlayerPage})));
const creatorFallback=<LoadingState label="Opening Creator Studio"/>;
const PublicBoardsPage = lazy(() => import("./pages/PublicBoardsPage").then(mod=>({default:mod.PublicBoardsPage})));
const pageFallback=<LoadingState label="Opening approved public boards"/>;

/** Historical Atlas links return to the canonical public experience.
 * Retains experimental files without mounting a second site theme. */
function LegacyAtlasRedirect(){
  const {pathname,search}=useLocation();
  const raw=pathname.replace(/^\/atlas(?=\/|$)/,"")||"/";
  const candidate=raw==="/orbit"?"/":
    raw==="/workspace"?"/account":
    raw==="/join"?"/join":
    raw==="/member"?"/member":
    raw==="/account/studio"?"/account/studio":
    raw==="/collaborate"||raw==="/signals"?"/community":
    raw.replace(/^\/experience\//,"/projects/");
  const safe=/^\/(?:|join|sign-in|member|member\/setup|start|guide|discover|creators|community|boards|levels|status|account|account\/edit|account\/studio|library|create|create\/new|community\/write)$/.test(candidate)
    || /^\/(?:projects|creators|community\/posts|create)\/[A-Za-z0-9_-]{1,80}$/.test(candidate);
  return <Navigate to={safe?candidate+search:"/"} replace/>;
}

function LegacyStudioRedirect(){
  const {projectId=""}=useParams<{projectId:string}>();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(projectId)
    ?<Navigate to={"/studio/"+projectId} replace/>:<Navigate to="/studio" replace/>;
}
function CanonicalPublicHandle(){
  const {memberHandle=""}=useParams<{memberHandle:string}>();
  return /^@[a-z][a-z0-9_]{2,29}$/.test(memberHandle)
    ? <Phase1PublicMemberPage/> : <Navigate to="/" replace/>;
}
export default function App(){
  return <AnevumNotifications><PublicPageMetadata/><Routes>
    <Route path="atlas/*" element={<LegacyAtlasRedirect/>}/>
    <Route element={<Shell/>}>
    <Route index element={<CinematicLandingPage/>}/>
    <Route path="join" element={<Phase1JoinPage/>}/>
    <Route path="sign-in" element={<Navigate to="/join" replace/>}/>
    <Route path="member" element={<Phase1MemberPage/>}/>
    <Route path="member/setup" element={<Navigate to="/member" replace/>}/>
    <Route path="start" element={<StartPage/>}/>
    <Route path="guide" element={<FieldGuidePage/>}/>
    <Route path="discover" element={<DiscoverPage/>}/>
    <Route path="projects/:id" element={<ProjectPage/>}/>
    <Route path="saved" element={<CanonicalSavedWorksPage/>}/>
    <Route path="creators" element={<CreatorsPage/>}/>
    <Route path="creators/:handle" element={<CreatorPage/>}/>
    <Route path="community" element={<CommunityPage/>}/>
      <Route path="boards" element={<Suspense fallback={pageFallback}><PublicBoardsPage/></Suspense>}/>
    <Route path="community/posts/:id" element={<CommunityPostPage/>}/>
    <Route path="community/threads/:id" element={<CommunityThread/>}/>
    <Route path="community/review" element={<ForumReviewPage/>}/>
    <Route path="workspace" element={<Navigate to="/account" replace/>}/>
    <Route path="account" element={<Navigate to="/member" replace/>}/>
    <Route path="account/edit" element={<Navigate to="/member" replace/>}/>
    <Route path="account/studio" element={<Navigate to="/studio" replace/>}/>
    <Route path="create" element={<Navigate to="/studio" replace/>}/>
    <Route path="create/new" element={<Navigate to="/studio/new" replace/>}/>
    <Route path="create/:projectId" element={<LegacyStudioRedirect/>}/>
    <Route path="studio/alpha" element={<PublicCreatorAlphaPage/>}/>
    <Route path="studio/workbench" element={<Suspense fallback={creatorFallback}><WorkbenchAlphaPage/></Suspense>}/>
    <Route path="studio/packages" element={<Suspense fallback={creatorFallback}><NativeCreatorStudioPage/></Suspense>}/>
    <Route path="studio/packages/new" element={<Suspense fallback={creatorFallback}><NativeCreatorStudioPage mode="new"/></Suspense>}/>
    <Route path="studio/packages/review" element={<Suspense fallback={creatorFallback}><NativeCreatorStudioPage mode="review"/></Suspense>}/>
    <Route path="studio/packages/:projectId" element={<Suspense fallback={creatorFallback}><NativeCreatorStudioPage mode="edit"/></Suspense>}/>
    <Route path="projects/package/:projectId" element={<Suspense fallback={creatorFallback}><NativePackagePlayerPage/></Suspense>}/>
    <Route path="studio" element={nativeCreatorEnabled?<Suspense fallback={creatorFallback}><NativeCreatorStudioPage/></Suspense>:<CanonicalStudioPage/>}/>
    <Route path="studio/records" element={<CanonicalStudioPage/>}/>
    <Route path="studio/new" element={<CanonicalStudioPage mode="new"/>}/>
    <Route path="studio/review" element={<CanonicalStudioPage mode="review"/>}/>
    <Route path="studio/:projectId" element={<CanonicalStudioPage mode="edit"/>}/>
    <Route element={<MemberGate/>}>
      <Route path="community/write" element={<CommunityPostEditorPage/>}/>
      <Route path="library" element={<MemberLibraryPage/>}/>

    </Route>
    <Route path="thebutton" element={<Navigate to="/levels" replace/>}/>
    <Route path="levels" element={<LevelsPage/>}/>
    <Route path="recognition" element={<RecognitionRegistryPage/>}/>
    <Route path="auras" element={<AuraCodexPage/>}/>
    <Route path="support" element={<SupporterPage/>}/>
    <Route path="support/transparency" element={<SupporterTransparencyPage/>}/>
    <Route path="support/collection" element={<SupporterCollectionPage/>}/>
    <Route path="status" element={<StatusPage/>}/>
    <Route path=":memberHandle" element={<CanonicalPublicHandle/>}/>
    <Route path="*" element={<Navigate to="/" replace/>}/>
  </Route></Routes></AnevumNotifications>;
}
