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
      MyCoursesPage,
      CourseDetailPage,
      ListAllLessonsPage,
      AboutUsPage,
      FAQPage,
      AssignmentPage,
      QuizManagementPage,
      QuizCreatePage,
      CourseQuizzesPage,
      QuizQuestionsPage,
      FeedbackPage,
      FeedbackListPage,
      EnrollmentsListPage,
      CurriculumPage,
      UserManagementPage,
      UserBioPage,
      AttendancePage,
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
        <Route path="/" element={<LandingPage />} />
        
        {/* Course detail */}
        <Route path="/courses/:id" element={
          <ProtectedRoute>
            <CourseDetailPage />
          </ProtectedRoute>
        } />
        
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
        <Route path="/my-courses" element={
          <ProtectedRoute requiredRole="student">
            <MyCoursesPage />
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

        {/* Profile */}
        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />

        {/* Lesson Materials */}
        <Route path="/materials" element={
          <ProtectedRoute>
            <ListAllLessonsPage />
          </ProtectedRoute>
        } />
        <Route path="/materials/:lessonId" element={
          <ProtectedRoute>
            <LessonMaterialDetailPage />
          </ProtectedRoute>
        } />

        {/* Assignments */}
        <Route path="/assignments" element={
          <ProtectedRoute>
            <AssignmentPage />
          </ProtectedRoute>
        } />
        <Route path="/assignments/:id" element={
          <ProtectedRoute>
            <AssignmentDetailPage />
          </ProtectedRoute>
        } />

        {/* Quiz Management */}
        <Route path="/quiz" element={
          <ProtectedRoute>
            <QuizManagementPage />
          </ProtectedRoute>
        } />
        <Route path="/quiz/:courseId" element={
          <ProtectedRoute>
            <CourseQuizzesPage />
          </ProtectedRoute>
        } />
        <Route path="/quiz/questions/:quizId" element={
          <ProtectedRoute>
            <QuizQuestionsPage />
          </ProtectedRoute>
        } />
        <Route path="/quizz" element={
          <ProtectedRoute>
            <QuizCreatePage />
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

        {/* Feedback */}
        <Route path="/help/feedback" element={
          <ProtectedRoute>
            <FeedbackPage />
          </ProtectedRoute>
        } />
        <Route path="/help/feedback-list" element={
          <ProtectedRoute>
            <FeedbackListPage />
          </ProtectedRoute>
        } />

        {/* Enrollments */}
        <Route path="/enrollments-list" element={
          <ProtectedRoute>
            <EnrollmentsListPage />
          </ProtectedRoute>
        } />
        {/* Curriculum */}
        <Route path="/curriculum" element={
          <ProtectedRoute>
            <CurriculumPage />
          </ProtectedRoute>
        } />

        {/* User Bio - must come before /user to avoid route conflict */}
        <Route path="/user/:userId" element={
          <ProtectedRoute>
            <UserBioPage />
          </ProtectedRoute>
        } />

        {/* User Management */}
        <Route path="/user" element={
          <ProtectedRoute requiredRole="admin">
            <UserManagementPage />
          </ProtectedRoute>
        } />

        {/* Attendance */}
        <Route path="/attendance" element={
          <ProtectedRoute>
            <AttendancePage />
          </ProtectedRoute>
        } />
        <Route path="/attendance/:semesterId" element={
          <ProtectedRoute>
            <AttendancePage />
          </ProtectedRoute>
        } />
        <Route path="/attendance/:semesterId/:courseId" element={
          <ProtectedRoute>
            <AttendancePage />
          </ProtectedRoute>
        } />

        {/* Not found */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
}

export default AppRoutes;
