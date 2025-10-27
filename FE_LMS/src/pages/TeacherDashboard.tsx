import { useState } from "react";
import { useTheme } from "../hooks/useTheme";
import Navbar from "../components/Navbar.tsx";
import Sidebar from "../components/Sidebar.tsx";

// Mock data for teacher dashboard
const teacherStats = {
  teachingCourses: 6,
  totalStudents: 145,
  pendingGrading: 23,
  publishedContent: 18
};

const myTeachingCourses = [
  {
    id: 1,
    name: 'Java Programming',
    code: 'SE1501',
    students: 32,
    assignments: 3,
    icon: '☕',
    color: '#6366f1'
  },
  {
    id: 2,
    name: 'Database Systems',
    code: 'DB2501',
    students: 28,
    assignments: 2,
    icon: '💾',
    color: '#8b5cf6'
  },
  {
    id: 3,
    name: 'Web Development',
    code: 'WD3001',
    students: 35,
    assignments: 4,
    icon: '🌐',
    color: '#06b6d4'
  }
];

const recentAssignments = [
  {
    id: 1,
    title: 'Assignment 3: OOP Design',
    course: 'Java Programming',
    submissions: 28,
    graded: 12,
    dueDate: '2024-01-20',
    totalStudents: 32
  },
  {
    id: 2,
    title: 'Lab Exercise 5',
    course: 'Database Systems',
    submissions: 24,
    graded: 24,
    dueDate: '2024-01-22',
    totalStudents: 28
  },
  {
    id: 3,
    title: 'Project Proposal',
    course: 'Web Development',
    submissions: 30,
    graded: 8,
    dueDate: '2024-01-25',
    totalStudents: 35
  }
];

const pendingQuizzes = [
  {
    id: 1,
    title: 'Quiz 2: SQL Basics',
    course: 'Database Systems',
    date: '2024-01-18',
    questions: 15,
    isPublished: true
  },
  {
    id: 2,
    title: 'Midterm Quiz',
    course: 'Java Programming',
    date: '2024-01-20',
    questions: 25,
    isPublished: false
  },
  {
    id: 3,
    title: 'Final Assessment',
    course: 'Web Development',
    date: '2024-01-28',
    questions: 30,
    isPublished: true
  }
];

const gradingQueue = [
  {
    id: 1,
    studentName: 'John Doe',
    assignment: 'OOP Design Assignment',
    course: 'Java Programming',
    submittedAt: '2024-01-19',
    status: 'pending',
    type: 'essay'
  },
  {
    id: 2,
    studentName: 'Jane Smith',
    assignment: 'Lab Exercise 5',
    course: 'Database Systems',
    submittedAt: '2024-01-20',
    status: 'pending',
    type: 'essay'
  },
  {
    id: 3,
    studentName: 'Mike Johnson',
    assignment: 'Project Proposal',
    course: 'Web Development',
    submittedAt: '2024-01-23',
    status: 'pending',
    type: 'essay'
  },
  {
    id: 4,
    studentName: 'Sarah Williams',
    assignment: 'OOP Design Assignment',
    course: 'Java Programming',
    submittedAt: '2024-01-18',
    status: 'graded',
    grade: 85,
    type: 'essay'
  }
];

const recentActivities = [
  {
    id: 1,
    type: 'assignment',
    title: 'Created new assignment',
    course: 'Java Programming',
    time: '2 hours ago'
  },
  {
    id: 2,
    type: 'quiz',
    title: 'Published quiz',
    course: 'Database Systems',
    time: '5 hours ago'
  },
  {
    id: 3,
    type: 'grading',
    title: 'Graded 12 submissions',
    course: 'Web Development',
    time: '1 day ago'
  },
  {
    id: 4,
    type: 'course',
    title: 'Updated course materials',
    course: 'Java Programming',
    time: '2 days ago'
  }
];

export default function TeacherDashboard() {
  const { darkMode, toggleDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div
      className="flex h-screen overflow-hidden relative"
      style={{
        backgroundColor: darkMode ? '#1a202c' : '#f8fafc',
        color: darkMode ? '#ffffff' : '#1e293b'
      }}
    >
      {/* Navigation */}
      <Navbar />


      {/* Sidebar */}
      <Sidebar role="teacher" />

      {/* Main Content */}
      <div className="flex flex-col flex-1 w-0 overflow-hidden">
        <main className="flex-1 relative overflow-y-auto focus:outline-none p-4 mt-16 sm:pl-24 md:pl-28">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h1
                className="text-2xl font-bold"
                style={{ color: darkMode ? '#ffffff' : '#1f2937' }}
              >
                Teacher Dashboard
              </h1>
              <button
                className="px-4 py-2 rounded-lg text-white flex items-center"
                style={{ backgroundColor: darkMode ? '#4c1d95' : '#4f46e5' }}
                onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = darkMode ? '#5b21b6' : '#4338ca'}
                onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = darkMode ? '#4c1d95' : '#4f46e5'}
              >
                <svg className="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                Create New
              </button>
            </div>

            <div className="mb-8">
              <h2
                className="text-xl font-semibold mb-4"
                style={{ color: darkMode ? '#ffffff' : '#1f2937' }}
              >
                Welcome back! 👨‍🏫
              </h2>
              <p
                style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}
              >
                Manage your courses, assignments, and track student progress.
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div
                className="p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                style={{
                  backgroundColor: darkMode ? 'rgba(26, 32, 44, 0.8)' : 'rgba(255, 255, 255, 0.9)',
                  border: darkMode ? '1px solid rgba(148, 163, 184, 0.1)' : '1px solid rgba(148, 163, 184, 0.1)',
                  backdropFilter: 'blur(10px)'
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div
                    className="p-3 rounded-xl"
                    style={{ backgroundColor: darkMode ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.1)' }}
                  >
                    <svg className="w-6 h-6" style={{ color: darkMode ? '#a5b4fc' : '#6366f1' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                    </svg>
                  </div>
                </div>
                <p
                  className="text-sm font-medium mb-1"
                  style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}
                >
                  Teaching Courses
                </p>
                <p
                  className="text-3xl font-bold"
                  style={{ color: darkMode ? '#ffffff' : '#1e293b' }}
                >
                  {teacherStats.teachingCourses}
                </p>
              </div>
              <div
                className="p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                style={{
                  backgroundColor: darkMode ? 'rgba(26, 32, 44, 0.8)' : 'rgba(255, 255, 255, 0.9)',
                  border: darkMode ? '1px solid rgba(148, 163, 184, 0.1)' : '1px solid rgba(148, 163, 184, 0.1)',
                  backdropFilter: 'blur(10px)'
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div
                    className="p-3 rounded-xl"
                    style={{ backgroundColor: darkMode ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.1)' }}
                  >
                    <svg className="w-6 h-6" style={{ color: darkMode ? '#86efac' : '#16a34a' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                    </svg>
                  </div>
                </div>
                <p
                  className="text-sm font-medium mb-1"
                  style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}
                >
                  Total Students
                </p>
                <p
                  className="text-3xl font-bold"
                  style={{ color: darkMode ? '#ffffff' : '#1e293b' }}
                >
                  {teacherStats.totalStudents}
                </p>
              </div>
              <div
                className="p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                style={{
                  backgroundColor: darkMode ? 'rgba(26, 32, 44, 0.8)' : 'rgba(255, 255, 255, 0.9)',
                  border: darkMode ? '1px solid rgba(148, 163, 184, 0.1)' : '1px solid rgba(148, 163, 184, 0.1)',
                  backdropFilter: 'blur(10px)'
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div
                    className="p-3 rounded-xl"
                    style={{ backgroundColor: darkMode ? 'rgba(245, 158, 11, 0.1)' : 'rgba(245, 158, 11, 0.1)' }}
                  >
                    <svg className="w-6 h-6" style={{ color: darkMode ? '#fcd34d' : '#d97706' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
                    </svg>
                  </div>
                </div>
                <p
                  className="text-sm font-medium mb-1"
                  style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}
                >
                  Pending Grading
                </p>
                <p
                  className="text-3xl font-bold"
                  style={{ color: darkMode ? '#ffffff' : '#1e293b' }}
                >
                  {teacherStats.pendingGrading}
                </p>
              </div>
              <div
                className="p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                style={{
                  backgroundColor: darkMode ? 'rgba(26, 32, 44, 0.8)' : 'rgba(255, 255, 255, 0.9)',
                  border: darkMode ? '1px solid rgba(148, 163, 184, 0.1)' : '1px solid rgba(148, 163, 184, 0.1)',
                  backdropFilter: 'blur(10px)'
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div
                    className="p-3 rounded-xl"
                    style={{ backgroundColor: darkMode ? 'rgba(139, 92, 246, 0.1)' : 'rgba(139, 92, 246, 0.1)' }}
                  >
                    <svg className="w-6 h-6" style={{ color: darkMode ? '#c4b5fd' : '#8b5cf6' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                    </svg>
                  </div>
                </div>
                <p
                  className="text-sm font-medium mb-1"
                  style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}
                >
                  Published Content
                </p>
                <p
                  className="text-3xl font-bold"
                  style={{ color: darkMode ? '#ffffff' : '#1e293b' }}
                >
                  {teacherStats.publishedContent}
                </p>
              </div>
            </div>

            {/* My Courses Grid */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2
                  className="text-xl font-semibold"
                  style={{ color: darkMode ? '#ffffff' : '#1e293b' }}
                >
                  My Teaching Courses
                </h2>
                <a
                  href="/my-courses"
                  className="text-sm font-medium hover:underline"
                  style={{ color: darkMode ? '#a5b4fc' : '#6366f1' }}
                >
                  Manage All →
                </a>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myTeachingCourses.map((course) => (
                  <div
                    key={course.id}
                    className="rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                    style={{
                      backgroundColor: darkMode ? 'rgba(26, 32, 44, 0.8)' : 'rgba(255, 255, 255, 0.9)',
                      border: darkMode ? '1px solid rgba(148, 163, 184, 0.1)' : '1px solid rgba(148, 163, 184, 0.1)',
                      backdropFilter: 'blur(10px)'
                    }}
                  >
                    <div
                      className="h-32 relative"
                      style={{ backgroundColor: course.color }}
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-4xl">{course.icon}</span>
                      </div>
                    </div>
                    <div className="p-6">
                      <h3
                        className="text-lg font-semibold mb-2"
                        style={{ color: darkMode ? '#ffffff' : '#1e293b' }}
                      >
                        {course.name}
                      </h3>
                      <p
                        className="text-sm mb-4"
                        style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}
                      >
                        {course.code}
                      </p>
                      <div className="flex items-center justify-between text-sm mb-4">
                        <span
                          style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}
                        >
                          👥 {course.students} students
                        </span>
                        <span
                          style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}
                        >
                          📝 {course.assignments} assignments
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          className="flex-1 px-3 py-2 rounded-lg text-white text-sm font-medium"
                          style={{ backgroundColor: darkMode ? '#4f46e5' : '#6366f1' }}
                          onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = darkMode ? '#4338ca' : '#4f46e5'}
                          onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = darkMode ? '#4f46e5' : '#6366f1'}
                        >
                          Manage
                        </button>
                        <button
                          className="px-3 py-2 rounded-lg text-sm font-medium border"
                          style={{
                            borderColor: darkMode ? 'rgba(148, 163, 184, 0.3)' : 'rgba(148, 163, 184, 0.3)',
                            color: darkMode ? '#a5b4fc' : '#6366f1',
                            backgroundColor: darkMode ? 'transparent' : 'transparent'
                          }}
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Assignments and Quizzes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Recent Assignments */}
              <div
                className="rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
                style={{
                  backgroundColor: darkMode ? 'rgba(26, 32, 44, 0.8)' : 'rgba(255, 255, 255, 0.9)',
                  border: darkMode ? '1px solid rgba(148, 163, 184, 0.1)' : '1px solid rgba(148, 163, 184, 0.1)',
                  backdropFilter: 'blur(10px)'
                }}
              >
                <div
                  className="px-6 py-4 border-b flex justify-between items-center"
                  style={{
                    backgroundColor: darkMode ? 'rgba(55, 65, 81, 0.3)' : 'rgba(249, 250, 251, 0.5)',
                    borderColor: darkMode ? 'rgba(75, 85, 99, 0.2)' : 'rgba(229, 231, 235, 0.5)'
                  }}
                >
                  <h2
                    className="text-lg font-semibold"
                    style={{ color: darkMode ? '#ffffff' : '#1e293b' }}
                  >
                    Assignments
                  </h2>
                  <div
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: darkMode ? 'rgba(245, 158, 11, 0.1)' : 'rgba(245, 158, 11, 0.1)' }}
                  >
                    <svg className="w-5 h-5" style={{ color: darkMode ? '#fcd34d' : '#d97706' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                    </svg>
                  </div>
                </div>
                <div className="p-6">
                  {recentAssignments.map((assignment) => {
                    const progress = (assignment.graded / assignment.totalStudents) * 100;
                    return (
                      <div
                        key={assignment.id}
                        className="mb-4 pb-4 border-b last:border-b-0"
                        style={{
                          borderColor: darkMode ? 'rgba(75, 85, 99, 0.2)' : 'rgba(229, 231, 235, 0.5)'
                        }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h3
                              className="font-semibold mb-1"
                              style={{ color: darkMode ? '#ffffff' : '#1e293b' }}
                            >
                              {assignment.title}
                            </h3>
                            <p
                              className="text-sm mb-2"
                              style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}
                            >
                              {assignment.course}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4 text-xs mb-2">
                          <span
                            style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}
                          >
                            📥 {assignment.submissions}/{assignment.totalStudents} submitted
                          </span>
                          <span
                            style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}
                          >
                            ✓ {assignment.graded} graded
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 h-2 rounded-full overflow-hidden"
                            style={{ backgroundColor: darkMode ? 'rgba(55, 65, 81, 0.5)' : 'rgba(229, 231, 235, 0.5)' }}
                          >
                            <div
                              className="h-full"
                              style={{
                                width: `${progress}%`,
                                backgroundColor: darkMode ? '#8b5cf6' : '#6366f1'
                              }}
                            />
                          </div>
                          <span
                            className="text-xs"
                            style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}
                          >
                            {Math.round(progress)}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Upcoming Quizzes */}
              <div
                className="rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
                style={{
                  backgroundColor: darkMode ? 'rgba(26, 32, 44, 0.8)' : 'rgba(255, 255, 255, 0.9)',
                  border: darkMode ? '1px solid rgba(148, 163, 184, 0.1)' : '1px solid rgba(148, 163, 184, 0.1)',
                  backdropFilter: 'blur(10px)'
                }}
              >
                <div
                  className="px-6 py-4 border-b flex justify-between items-center"
                  style={{
                    backgroundColor: darkMode ? 'rgba(55, 65, 81, 0.3)' : 'rgba(249, 250, 251, 0.5)',
                    borderColor: darkMode ? 'rgba(75, 85, 99, 0.2)' : 'rgba(229, 231, 235, 0.5)'
                  }}
                >
                  <h2
                    className="text-lg font-semibold"
                    style={{ color: darkMode ? '#ffffff' : '#1e293b' }}
                  >
                    Quizzes
                  </h2>
                  <div
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: darkMode ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.1)' }}
                  >
                    <svg className="w-5 h-5" style={{ color: darkMode ? '#86efac' : '#10b981' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </div>
                </div>
                <div className="p-6">
                  {pendingQuizzes.map((quiz) => (
                    <div
                      key={quiz.id}
                      className="mb-4 pb-4 border-b last:border-b-0"
                      style={{
                        borderColor: darkMode ? 'rgba(75, 85, 99, 0.2)' : 'rgba(229, 231, 235, 0.5)'
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3
                              className="font-semibold"
                              style={{ color: darkMode ? '#ffffff' : '#1e293b' }}
                            >
                              {quiz.title}
                            </h3>
                            {quiz.isPublished && (
                              <span
                                className="text-xs px-2 py-0.5 rounded-full"
                                style={{
                                  backgroundColor: 'rgba(34, 197, 94, 0.1)',
                                  color: darkMode ? '#86efac' : '#16a34a'
                                }}
                              >
                                Published
                              </span>
                            )}
                            {!quiz.isPublished && (
                              <span
                                className="text-xs px-2 py-0.5 rounded-full"
                                style={{
                                  backgroundColor: 'rgba(245, 158, 11, 0.1)',
                                  color: darkMode ? '#fcd34d' : '#d97706'
                                }}
                              >
                                Draft
                              </span>
                            )}
                          </div>
                          <p
                            className="text-sm mb-2"
                            style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}
                          >
                            {quiz.course}
                          </p>
                          <div className="flex items-center space-x-4 text-xs">
                            <span
                              style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}
                            >
                              📝 {quiz.questions} questions
                            </span>
                            <span
                              style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}
                            >
                              📅 {quiz.date}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Grading Queue */}
            <div
              className="rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 mb-8"
              style={{
                backgroundColor: darkMode ? 'rgba(26, 32, 44, 0.8)' : 'rgba(255, 255, 255, 0.9)',
                border: darkMode ? '1px solid rgba(148, 163, 184, 0.1)' : '1px solid rgba(148, 163, 184, 0.1)',
                backdropFilter: 'blur(10px)'
              }}
            >
              <div
                className="px-6 py-4 border-b flex justify-between items-center"
                style={{
                  backgroundColor: darkMode ? 'rgba(55, 65, 81, 0.3)' : 'rgba(249, 250, 251, 0.5)',
                  borderColor: darkMode ? 'rgba(75, 85, 99, 0.2)' : 'rgba(229, 231, 235, 0.5)'
                }}
              >
                <h2
                  className="text-lg font-semibold"
                  style={{ color: darkMode ? '#ffffff' : '#1e293b' }}
                >
                  Grading Queue
                </h2>
                <a
                  href="/grading"
                  className="text-sm font-medium hover:underline"
                  style={{ color: darkMode ? '#a5b4fc' : '#6366f1' }}
                >
                  View All →
                </a>
              </div>
              <div className="p-6">
                {gradingQueue.slice(0, 4).map((item) => (
                  <div
                    key={item.id}
                    className="mb-4 pb-4 border-b last:border-b-0 flex items-center justify-between"
                    style={{
                      borderColor: darkMode ? 'rgba(75, 85, 99, 0.2)' : 'rgba(229, 231, 235, 0.5)'
                    }}
                  >
                    <div className="flex-1">
                      <h3
                        className="font-semibold mb-1"
                        style={{ color: darkMode ? '#ffffff' : '#1e293b' }}
                      >
                        {item.studentName}
                      </h3>
                      <p
                        className="text-sm mb-1"
                        style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}
                      >
                        {item.assignment}
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}
                      >
                        {item.course} • 📅 {item.submittedAt}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {item.status === 'pending' ? (
                        <button
                          className="px-4 py-2 rounded-lg text-white text-sm font-medium"
                          style={{ backgroundColor: darkMode ? '#4f46e5' : '#6366f1' }}
                          onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = darkMode ? '#4338ca' : '#4f46e5'}
                          onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = darkMode ? '#4f46e5' : '#6366f1'}
                        >
                          Grade Now
                        </button>
                      ) : (
                        <span
                          className="px-3 py-1 rounded-lg text-sm font-medium"
                          style={{
                            backgroundColor: 'rgba(34, 197, 94, 0.1)',
                            color: darkMode ? '#86efac' : '#16a34a'
                          }}
                        >
                          ✓ {item.grade}%
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activities */}
            <div
              className="rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
              style={{
                backgroundColor: darkMode ? 'rgba(26, 32, 44, 0.8)' : 'rgba(255, 255, 255, 0.9)',
                border: darkMode ? '1px solid rgba(148, 163, 184, 0.1)' : '1px solid rgba(148, 163, 184, 0.1)',
                backdropFilter: 'blur(10px)'
              }}
            >
              <div
                className="px-6 py-4 border-b flex justify-between items-center"
                style={{
                  backgroundColor: darkMode ? 'rgba(55, 65, 81, 0.3)' : 'rgba(249, 250, 251, 0.5)',
                  borderColor: darkMode ? 'rgba(75, 85, 99, 0.2)' : 'rgba(229, 231, 235, 0.5)'
                }}
              >
                <h2
                  className="text-lg font-semibold"
                  style={{ color: darkMode ? '#ffffff' : '#1e293b' }}
                >
                  Recent Activities
                </h2>
              </div>
              <div className="p-6">
                {recentActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="mb-4 pb-4 border-b last:border-b-0 flex items-start space-x-3"
                    style={{
                      borderColor: darkMode ? 'rgba(75, 85, 99, 0.2)' : 'rgba(229, 231, 235, 0.5)'
                    }}
                  >
                    <div
                      className="p-2 rounded-lg"
                      style={{
                        backgroundColor: activity.type === 'assignment'
                          ? (darkMode ? 'rgba(245, 158, 11, 0.1)' : 'rgba(245, 158, 11, 0.1)')
                          : activity.type === 'quiz'
                            ? (darkMode ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.1)')
                            : activity.type === 'grading'
                              ? (darkMode ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.1)')
                              : (darkMode ? 'rgba(139, 92, 246, 0.1)' : 'rgba(139, 92, 246, 0.1)')
                      }}
                    >
                      {activity.type === 'assignment' && (
                        <svg className="w-5 h-5" style={{ color: darkMode ? '#fcd34d' : '#d97706' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                        </svg>
                      )}
                      {activity.type === 'quiz' && (
                        <svg className="w-5 h-5" style={{ color: darkMode ? '#86efac' : '#16a34a' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                      )}
                      {activity.type === 'grading' && (
                        <svg className="w-5 h-5" style={{ color: darkMode ? '#a5b4fc' : '#6366f1' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
                        </svg>
                      )}
                      {activity.type === 'course' && (
                        <svg className="w-5 h-5" style={{ color: darkMode ? '#c4b5fd' : '#8b5cf6' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                        </svg>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3
                        className="font-semibold"
                        style={{ color: darkMode ? '#ffffff' : '#1e293b' }}
                      >
                        {activity.title}
                      </h3>
                      <p
                        className="text-sm"
                        style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}
                      >
                        {activity.course}
                      </p>
                      <p
                        className="text-xs mt-1"
                        style={{ color: darkMode ? '#6b7280' : '#9ca3af' }}
                      >
                        {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Dark Mode Toggle */}
      <button
        onClick={toggleDarkMode}
        className={`fixed bottom-4 right-4 z-[100] w-12 h-12 rounded-full flex items-center justify-center transition-colors duration-300 shadow-lg hover:scale-110 ${darkMode
          ? 'bg-yellow-400 text-gray-900 hover:bg-yellow-300'
          : 'bg-indigo-600 text-white hover:bg-indigo-700'
          }`}
        aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {darkMode ? (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        ) : (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        )}
      </button>
    </div>
  );
}

