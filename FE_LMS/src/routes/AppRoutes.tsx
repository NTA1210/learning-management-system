import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import {
  DashboardPage,
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
  CourseDetailPage,
  ListAllLessonsPage,
  AboutUsPage,
  FAQPage,
  AssignmentPage,
  QuizManagementPage,
  QuizCoursePage,
  FeedbackPage,
} from "../pages";

import EmailVerificationPage from "../pages/EmailVerificationPage";
import LessonMaterialDetailPage from "../pages/LessonMaterialDetailPage";
import AssignmentDetailPage from "../pages/AssignmentDetailPage";
import ProtectedRoute from "../components/ProtectedRoute";
import Profile from "../pages/profile";
import Calendar from "../components/Calendar";

function AppRoutes() {
  return (
    <Router>
      <Routes>
        {/* Landing page */}
        <Route path="/" element={<LandingPage />} />

        {/* Course detail */}
        <Route
          path="/courses/:id"
          element={
            <ProtectedRoute>
              <CourseDetailPage />
            </ProtectedRoute>
          }
        />

        {/* Auth routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/email-verify" element={<EmailVerifyPage />} />
        <Route
          path="/auth/verify-email/:code"
          element={<EmailVerificationPage />}
        />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:code" element={<ResetPasswordPage />} />

        {/* Admin routes */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute requiredRole="admin">
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/courses"
          element={
            <ProtectedRoute requiredRole="admin">
              <CourseManagementPage />
            </ProtectedRoute>
          }
        />

        {/* Shared course route */}
        <Route
          path="/courses"
          element={
            <ProtectedRoute>
              <CourseManagementPage />
            </ProtectedRoute>
          }
        />

        {/* Student dashboard */}
        <Route
          path="/student-dashboard"
          element={
            <ProtectedRoute requiredRole="student">
              <StudentDashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Teacher dashboard */}
        <Route
          path="/teacher-dashboard"
          element={
            <ProtectedRoute requiredRole="teacher">
              <TeacherDashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Calendar */}
        <Route
          path="/calendar"
          element={
            <ProtectedRoute>
              <Calendar />
            </ProtectedRoute>
          }
        />

        {/* Profile */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* Lesson Materials */}
        <Route
          path="/materials"
          element={
            <ProtectedRoute>
              <ListAllLessonsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/materials/:lessonId"
          element={
            <ProtectedRoute>
              <LessonMaterialDetailPage />
            </ProtectedRoute>
          }
        />

        {/* Assignments */}
        <Route
          path="/assignments"
          element={
            <ProtectedRoute>
              <AssignmentPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/assignments/:id"
          element={
            <ProtectedRoute>
              <AssignmentDetailPage />
            </ProtectedRoute>
          }
        />

        {/* Quiz management */}
        <Route
          path="/quiz"
          element={
            <ProtectedRoute>
              <QuizManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/quiz/:courseId"
          element={
            <ProtectedRoute>
              <QuizCoursePage />
            </ProtectedRoute>
          }
        />

        {/* Help pages */}
        <Route
          path="/help/about"
          element={
            <ProtectedRoute>
              <AboutUsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/help/faq"
          element={
            <ProtectedRoute>
              <FAQPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/help/feedback"
          element={
            <ProtectedRoute>
              <FeedbackPage />
            </ProtectedRoute>
          }
        />

        {/* 404 Page */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
}

export default AppRoutes;
