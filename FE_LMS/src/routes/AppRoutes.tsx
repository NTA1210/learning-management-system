import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { LandingPage, NotFoundPage } from "../pages";

function AppRoutes() {
  return (
    <Router>
      <Routes>
        {/* /*layout */}
        {/* <Route element={<></>}> */}
        <Route path="/">
          <Route index element={<LandingPage />} />
        </Route>

        {/* 404 page */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
}

export default AppRoutes;
