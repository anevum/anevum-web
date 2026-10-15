import { Navigate, Route, Routes } from "react-router-dom";
import { lazy, Suspense } from "react";
import { Shell } from "./components/Shell";
import { InstallPage } from "./pages/InstallPage";
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
import { MemberAccountPage } from "./pages/MemberAccountPage";
import { MemberProfileEditorPage } from "./pages/MemberProfileEditorPage";
import { MemberLibraryPage } from "./pages/MemberLibraryPage";
import { MemberProjectsPage } from "./pages/MemberProjectsPage";
import { ProjectEditorPage } from "./pages/ProjectEditorPage";
import { WorkspacePage } from "./pages/WorkspacePage";

const PublicBoardsPage = lazy(() => import("./pages/PublicBoardsPage").then(mod=>({default:mod.PublicBoardsPage})));
const AtlasPage = lazy(() => import("./pages/AtlasPage").then(mod => ({default:mod.AtlasPage})));
const FeaturedExperiencePage = lazy(() => import("./pages/FeaturedExperiencePage").then(mod=>({default:mod.FeaturedExperiencePage})));
const AtlasMorphLayout = lazy(() => import("./pages/AtlasMorphPage").then(mod => ({default:mod.AtlasMorphLayout})));
const AtlasCollaboration = lazy(() => import("./pages/AtlasMorphPage").then(mod => ({default:()=><mod.AtlasFuture kind="collaborate"/>})));
const AtlasSignals = lazy(() => import("./pages/AtlasMorphPage").then(mod => ({default:()=><mod.AtlasFuture kind="signals"/>})));
const atlasFallback=<div role="status" style={{minHeight:"100dvh",display:"grid",placeItems:"center",background:"#071022",color:"#f2d7a8"}}>OPENING THE ANEVUM UNIVERSE…</div>;
export default function App(){
  return <Routes>
    <Route path="atlas/orbit" element={<Suspense fallback={atlasFallback}><AtlasPage/></Suspense>}/>
    <Route path="atlas" element={<Suspense fallback={atlasFallback}><AtlasMorphLayout/></Suspense>}>
      <Route index element={<></>}/>
      <Route path="discover" element={<DiscoverPage immersive/>}/>
      <Route path="experience/:id" element={<Suspense fallback={<div role="status" className="fx-focus-await">ENTERING THE PROJECT EXPERIENCE…</div>}><FeaturedExperiencePage/></Suspense>}/>
      <Route path="projects/:id" element={<ProjectPage/>}/>
      <Route path="creators" element={<CreatorsPage/>}/>
      <Route path="creators/:handle" element={<CreatorPage/>}/>
      <Route path="community" element={<CommunityPage/>}/>
      <Route path="boards" element={<Suspense fallback={atlasFallback}><PublicBoardsPage/></Suspense>}/>
    <Route path="community/posts/:id" element={<CommunityPostPage/>}/>
      <Route path="workspace" element={<WorkspacePage/>}/>
      <Route path="collaborate" element={<AtlasCollaboration/>}/>
      <Route path="signals" element={<AtlasSignals/>}/>
      <Route path="start" element={<StartPage/>}/>
      <Route path="guide" element={<FieldGuidePage/>}/>
      <Route path="status" element={<StatusPage/>}/>
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
      <Route path="install" element={<InstallPage/>}/>
      <Route path="*" element={<Navigate to="/atlas" replace/>}/>
    </Route>
    <Route element={<Shell/>}>
    <Route index element={<CinematicLandingPage/>}/>
    <Route path="start" element={<StartPage/>}/>
    <Route path="guide" element={<FieldGuidePage/>}/>
    <Route path="discover" element={<DiscoverPage/>}/>
    <Route path="projects/:id" element={<ProjectPage/>}/>
    <Route path="creators" element={<CreatorsPage/>}/>
    <Route path="creators/:handle" element={<CreatorPage/>}/>
    <Route path="community" element={<CommunityPage/>}/>
      <Route path="boards" element={<Suspense fallback={atlasFallback}><PublicBoardsPage/></Suspense>}/>
    <Route path="community/posts/:id" element={<CommunityPostPage/>}/>
    <Route path="workspace" element={<WorkspacePage/>}/>
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
