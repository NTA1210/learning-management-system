import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { LandingPage, NotFoundPage, EmailVerifyPage, ForgotPasswordPage, ResetPasswordPage } from "../pages";

function AppRoutes() {
  return (
    <Router>
      <Routes>
        {/* /*layout */}
        {/* <Route element={<></>}> */}
        <Route path="/">
          <Route index element={<LandingPage />} />
        </Route>

        {/* Auth pages */}
        <Route path="/email-verify" element={<EmailVerifyPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* 404 page */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
}

export default AppRoutes;
