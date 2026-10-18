// IREN staff command is an independent viewport app.
// No public homepage, creator routes or fallback shell are mounted here.
import {StrictMode} from "react";
import {createRoot} from "react-dom/client";
import {BrowserRouter,Route,Routes,Navigate} from "react-router-dom";
import {StaffCommandPage} from "./pages/StaffCommandPage";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
 <StrictMode>
  <BrowserRouter basename="/staff">
   <Routes>
    <Route index element={<StaffCommandPage/>}/>
    <Route path="*" element={<Navigate to="/" replace/>}/>
   </Routes>
  </BrowserRouter>
 </StrictMode>
);
