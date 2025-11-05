import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import {DashboardPage ,
  StudentDashboardPage,
  TeacherDashboardPage,
  LandingPage,
  NotFoundPage,
  EmailVerifyPage,
  ForgotPasswordPage,
  ResetPasswordPage,
  LoginPage,
  RegisterPage,
  CourseManagementPage,
  AboutUsPage,
  FAQPage,
  CourseDetailPage,
} from "../pages";
import EmailVerificationPage from "../pages/EmailVerificationPage";
import ProtectedRoute from "../components/ProtectedRoute";
import Profile from "../pages/profile";
import Calendar from "../components/Calendar";

function AppRoutes() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/courses/:slug" element={<CourseDetailPage />} />
        {/* Auth routes */}
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
        <Route path="/admin/courses" element={
          <ProtectedRoute requiredRole="admin">
            <CourseManagementPage />
          </ProtectedRoute>
        } />
        <Route path="/courses" element={
          <ProtectedRoute>
            <CourseManagementPage />
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
        <Route path="/teacher-dashboard" element={
          <ProtectedRoute requiredRole="teacher">
            <TeacherDashboardPage />
          </ProtectedRoute>
        } />

        {/* Calendar */}
        <Route path="/calendar" element={
          <ProtectedRoute>
            <Calendar />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />

        {/* About Us */}
        <Route path="/help/about" element={
          <ProtectedRoute>
            <AboutUsPage />
          </ProtectedRoute>
        } />

        {/* FAQ */}
        <Route path="/help/faq" element={
          <ProtectedRoute>
            <FAQPage />
          </ProtectedRoute>
        } />

        {/* Not found */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
}

export default AppRoutes;
