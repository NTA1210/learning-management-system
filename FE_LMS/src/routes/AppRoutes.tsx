import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { HelloPage, NotFoundPage, LoginPage, RegisterPage } from "../pages";

function AppRoutes() {
  return (
    <Router>
      <Routes>
        {/* /*layout */}
        {/* <Route element={<></>}> */}
        <Route path="/">
          <Route index element={<HelloPage />} />
        </Route>

        {/* Auth routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* 404 page */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
}

export default AppRoutes;
