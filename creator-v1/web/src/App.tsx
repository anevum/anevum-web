import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { lazy, Suspense } from "react";
import { Shell } from "./components/Shell";
import { CinematicLandingPage } from "./pages/CinematicLandingPage";
import { FieldGuidePage } from "./pages/FieldGuidePage";
import { StartPage } from "./pages/StartPage";
import { DiscoverPage } from "./pages/DiscoverPage";
import { ProjectPage } from "./pages/ProjectPage";
import { CreatorPage, CreatorsPage } from "./pages/CreatorsPage";
import { StatusPage } from "./pages/StatusPage";
import { LevelsPage } from "./pages/LevelsPage";
import { CommunityPage } from "./pages/CommunityPage";
import {CommunityPostPage} from "./pages/CommunityPostPage";
import {CommunityPostEditorPage} from "./pages/CommunityPostEditorPage";
import { MemberGate } from "./components/MemberGate";
import { LoadingState } from "./components/States";
import { MemberAccountPage } from "./pages/MemberAccountPage";
import { MemberProfileEditorPage } from "./pages/MemberProfileEditorPage";
import { MemberLibraryPage } from "./pages/MemberLibraryPage";
import { MemberProjectsPage } from "./pages/MemberProjectsPage";
import { ProjectEditorPage } from "./pages/ProjectEditorPage";

const PublicBoardsPage = lazy(() => import("./pages/PublicBoardsPage").then(mod=>({default:mod.PublicBoardsPage})));
const pageFallback=<LoadingState label="Opening approved public boards"/>;

/** Historical Atlas links return to the canonical public experience.
 * Retains experimental files without mounting a second site theme. */
function LegacyAtlasRedirect(){
  const {pathname,search}=useLocation();
  const raw=pathname.replace(/^\/atlas(?=\/|$)/,"")||"/";
  const candidate=raw==="/orbit"?"/":
    raw==="/workspace"?"/account":
    raw==="/collaborate"||raw==="/signals"?"/community":
    raw.replace(/^\/experience\//,"/projects/");
  const safe=/^\/(?:|start|guide|discover|creators|community|boards|levels|status|account|account\/edit|library|create|create\/new|community\/write)$/.test(candidate)
    || /^\/(?:projects|creators|community\/posts|create)\/[A-Za-z0-9_-]{1,80}$/.test(candidate);
  return <Navigate to={safe?candidate+search:"/"} replace/>;
}

export default function App(){
  return <Routes>
    <Route path="atlas/*" element={<LegacyAtlasRedirect/>}/>
    <Route element={<Shell/>}>
    <Route index element={<CinematicLandingPage/>}/>
    <Route path="start" element={<StartPage/>}/>
    <Route path="guide" element={<FieldGuidePage/>}/>
    <Route path="discover" element={<DiscoverPage/>}/>
    <Route path="projects/:id" element={<ProjectPage/>}/>
    <Route path="creators" element={<CreatorsPage/>}/>
    <Route path="creators/:handle" element={<CreatorPage/>}/>
    <Route path="community" element={<CommunityPage/>}/>
      <Route path="boards" element={<Suspense fallback={pageFallback}><PublicBoardsPage/></Suspense>}/>
    <Route path="community/posts/:id" element={<CommunityPostPage/>}/>
    <Route path="workspace" element={<Navigate to="/account" replace/>}/>
    <Route element={<MemberGate/>}>
      <Route path="create" element={<MemberProjectsPage/>}/>
      <Route path="create/new" element={<ProjectEditorPage/>}/>
    <Route path="community/write" element={<CommunityPostEditorPage/>}/>
      <Route path="create/:projectId" element={<ProjectEditorPage/>}/>
      <Route path="library" element={<MemberLibraryPage/>}/>
      <Route path="account" element={<MemberAccountPage/>}/>
      <Route path="account/edit" element={<MemberProfileEditorPage/>}/>
    </Route>
    <Route path="levels" element={<LevelsPage/>}/>
    <Route path="status" element={<StatusPage/>}/>
    <Route path="*" element={<Navigate to="/" replace/>}/>
  </Route></Routes>;
}
