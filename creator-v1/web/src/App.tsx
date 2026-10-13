import { Navigate, Route, Routes } from "react-router-dom";
import { Shell } from "./components/Shell";
import { HomePage } from "./pages/HomePage";
import { DiscoverPage } from "./pages/DiscoverPage";
import { ProjectPage } from "./pages/ProjectPage";
import { CreatorPage, CreatorsPage } from "./pages/CreatorsPage";
import { StatusPage } from "./pages/StatusPage";
import { LevelsPage } from "./pages/LevelsPage";
import { ComingPage } from "./pages/ComingPage";
import { MemberGate } from "./components/MemberGate";
import { MemberAccountPage } from "./pages/MemberAccountPage";
import { MemberLibraryPage } from "./pages/MemberLibraryPage";
import { MemberProjectsPage } from "./pages/MemberProjectsPage";
import { ProjectEditorPage } from "./pages/ProjectEditorPage";

export default function App(){
  return <Routes><Route element={<Shell/>}>
    <Route index element={<HomePage/>}/>
    <Route path="discover" element={<DiscoverPage/>}/>
    <Route path="projects/:id" element={<ProjectPage/>}/>
    <Route path="creators" element={<CreatorsPage/>}/>
    <Route path="creators/:handle" element={<CreatorPage/>}/>
    <Route path="community" element={<ComingPage kind="community"/>}/>
    <Route element={<MemberGate/>}>
      <Route path="create" element={<MemberProjectsPage/>}/>
      <Route path="create/new" element={<ProjectEditorPage/>}/>
      <Route path="create/:projectId" element={<ProjectEditorPage/>}/>
      <Route path="library" element={<MemberLibraryPage/>}/>
      <Route path="account" element={<MemberAccountPage/>}/>
    </Route>
    <Route path="levels" element={<LevelsPage/>}/>
    <Route path="status" element={<StatusPage/>}/>
    <Route path="*" element={<Navigate to="/" replace/>}/>
  </Route></Routes>;
}
