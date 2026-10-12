import { Navigate, Route, Routes } from "react-router-dom";
import { Shell } from "./components/Shell";
import { HomePage } from "./pages/HomePage";
import { DiscoverPage } from "./pages/DiscoverPage";
import { ProjectPage } from "./pages/ProjectPage";
import { CreatorPage, CreatorsPage } from "./pages/CreatorsPage";
import { StatusPage } from "./pages/StatusPage";
import { ComingPage } from "./pages/ComingPage";

export default function App(){
  return <Routes><Route element={<Shell/>}>
    <Route index element={<HomePage/>}/>
    <Route path="discover" element={<DiscoverPage/>}/>
    <Route path="projects/:id" element={<ProjectPage/>}/>
    <Route path="creators" element={<CreatorsPage/>}/>
    <Route path="creators/:handle" element={<CreatorPage/>}/>
    <Route path="community" element={<ComingPage kind="community"/>}/>
    <Route path="create" element={<ComingPage kind="create"/>}/>
    <Route path="library" element={<ComingPage kind="library"/>}/>
    <Route path="account" element={<ComingPage kind="account"/>}/>
    <Route path="status" element={<StatusPage/>}/>
    <Route path="*" element={<Navigate to="/" replace/>}/>
  </Route></Routes>;
}
