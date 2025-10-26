import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import {DashboardPage ,
  StudentDashboardPage,
  LandingPage,
  NotFoundPage,
  EmailVerifyPage,
  ForgotPasswordPage,
  ResetPasswordPage,
  LoginPage,
  RegisterPage,
} from "../pages";
import EmailVerificationPage from "../pages/EmailVerificationPage";
import ProtectedRoute from "../components/ProtectedRoute";

function AppRoutes() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        
        {/* Auth pages */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/email-verify" element={<EmailVerifyPage />} />
        <Route path="/auth/verify-email/:code" element={<EmailVerificationPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:code" element={<ResetPasswordPage />} />
        <Route path="/dashboard" element={
          <ProtectedRoute requiredRole="admin">
            <DashboardPage />
          </ProtectedRoute>
        } />
        <Route path="/admin/dashboard" element={
          <ProtectedRoute requiredRole="admin">
            <DashboardPage />
          </ProtectedRoute>
        } />
        <Route path="/student-dashboard" element={
          <ProtectedRoute requiredRole="student">
            <StudentDashboardPage />
          </ProtectedRoute>
        } />

        {/* Not found */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
}

export default AppRoutes;
