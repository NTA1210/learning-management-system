import { useState } from "react";
import { useTheme } from "../hooks/useTheme";
import { 
  studentStats, 
  myCourses, 
  recentAssignments, 
  upcomingQuizzes,
  attendanceData,
  gradeSummary,
  availableCourses,
  lessonMaterials
} from "../services/mock.ts";

export default function StudentDashboard() {
  const { darkMode, toggleDarkMode } = useTheme();
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<number[]>([1, 2, 3]);

  const handleEnroll = (courseId: number) => {
    setEnrolledCourseIds([...enrolledCourseIds, courseId]);
  };

  const handleUnenroll = (courseId: number) => {
    setEnrolledCourseIds(enrolledCourseIds.filter(id => id !== courseId));
  };

  return (
    <div 
      className="flex h-screen overflow-hidden relative"
      style={{
        backgroundColor: darkMode ? '#1a202c' : '#f8fafc',
        color: darkMode ? '#ffffff' : '#1e293b'
      }}
    >
      {/* Navigation */}
      <nav 
        className="shadow-lg py-3 px-6 fixed top-0 left-0 right-0 z-[95] backdrop-blur-md transition-colors duration-300"
        style={{ 
          backgroundColor: darkMode ? 'rgba(26, 32, 44, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          borderBottom: darkMode ? '1px solid rgba(148, 163, 184, 0.1)' : '1px solid rgba(148, 163, 184, 0.1)',
          color: darkMode ? '#ffffff' : '#1e293b'
        }}
      >
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <button 
              className="mr-4 p-2 rounded-lg transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white/20"
              style={{ 
                backgroundColor: darkMode ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.1)',
                color: darkMode ? '#a5b4fc' : '#4f46e5'
              }}
              onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = darkMode ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.2)'}
              onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = darkMode ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.1)'}
              aria-label="Toggle sidebar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </button>
            <a className="flex items-center space-x-3" href="/student-dashboard">
              <div 
                className="h-10 w-10 rounded-xl flex items-center justify-center shadow-lg"
                style={{ backgroundColor: darkMode ? '#6366f1' : '#6366f1' }}
              >
                <span className="text-white font-bold text-lg">F</span>
              </div>
              <span 
                className="text-xl font-bold"
                style={{ color: darkMode ? '#ffffff' : '#1e293b' }}
              >
                FStudyMate
              </span>
            </a>
          </div>
          <div className="hidden md:flex md:flex-1 mx-4">
            <div className="relative w-full max-w-lg mx-auto">
              <input 
                type="text" 
                placeholder="Search courses, assignments..." 
                className="w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
                style={{
                  borderColor: darkMode ? 'rgba(148, 163, 184, 0.2)' : 'rgba(148, 163, 184, 0.3)',
                  backgroundColor: darkMode ? 'rgba(15, 23, 42, 0.5)' : 'rgba(255, 255, 255, 0.8)',
                  color: darkMode ? '#ffffff' : '#1e293b',
                  backdropFilter: 'blur(10px)'
                }}
              />
              <div className="absolute right-2 top-2.5" style={{ color: darkMode ? '#9ca3af' : '#9ca3af' }}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button 
              className="md:hidden text-white hover:text-gray-200"
              style={{ color: darkMode ? '#ffffff' : '#1e293b' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </button>
            <div className="relative text-white hover:text-gray-200">
              <div>
                <span className="ant-badge ant-dropdown-trigger css-16dneet">
                  <span role="img" aria-label="bell" className="anticon anticon-bell" style={{ fontSize: '20px', cursor: 'pointer' }}>
                    <svg viewBox="64 64 896 896" focusable="false" data-icon="bell" width="1em" height="1em" fill="currentColor" aria-hidden="true">
                      <path d="M816 768h-24V428c0-141.1-104.3-257.7-240-277.1V112c0-22.1-17.9-40-40-40s-40 17.9-40 40v38.9c-135.7 19.4-240 136-240 277.1v340h-24c-17.7 0-32 14.3-32 32v32c0 4.4 3.6 8 8 8h216c0 61.8 50.2 112 112 112s112-50.2 112-112h216c4.4 0 8-3.6 8-8v-32c0-17.7-14.3-32-32-32zM512 888c-26.5 0-48-21.5-48-48h96c0 26.5-21.5 48-48 48zM304 768V428c0-55.6 21.6-107.8 60.9-147.1S456.4 220 512 220c55.6 0 107.8 21.6 147.1 60.9S720 372.4 720 428v340H304z"></path>
                    </svg>
                  </span>
                </span>
              </div>
            </div>
            <a className="flex items-center space-x-2" href="/profile">
              <img 
                src="https://media.tenor.com/AN83u7YyqwUAAAAM/maxwell-the-cat.gif" 
                alt="student" 
                className="h-8 w-8 rounded-full object-cover border-2 border-white"
              />
            </a>
          </div>
        </div>
      </nav>

      {/* Sidebar */}
      <div className="hidden sm:block">
        <div 
          className="fixed left-4 top-1/2 -translate-y-1/2 z-[9002] flex flex-col rounded-xl shadow-xl transition-all duration-300 overflow-hidden sm:flex w-14"
          style={{
            backgroundColor: darkMode ? 'rgba(31, 41, 55, 0.9)' : 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(5px)'
          }}
        >
          <div className="flex-1 overflow-y-auto py-4 px-1.5 w-14 transition-all duration-300 hide-scrollbar">
            <style>
              {`.hide-scrollbar::-webkit-scrollbar {
                display: none;
              }`}
            </style>
            <div className="flex flex-col items-center p-2 mb-4 border-b border-gray-200/50 transition-opacity duration-300 opacity-0 h-0 overflow-hidden m-0 p-0">
              <div className="relative mb-2">
                <img 
                  className="h-16 w-16 rounded-full object-cover" 
                  src="https://media.tenor.com/AN83u7YyqwUAAAAM/maxwell-the-cat.gif" 
                  alt="Profile"
                />
                <div 
                  className="absolute right-0 top-4/5 transform translate-x-1/2 -translate-y-1/2 px-2 py-0 text-xs font-semibold rounded-md backdrop-blur-sm text-green-800"
                  style={{
                    backgroundColor: darkMode ? 'rgba(34, 197, 94, 0.7)' : 'rgba(34, 197, 94, 0.7)',
                    backdropFilter: 'blur(16px)'
                  }}
                >
                  student
                </div>
              </div>
              <h2 className="text-sm font-semibold truncate max-w-full" style={{ color: darkMode ? '#ffffff' : '#1f2937' }}>student</h2>
              <p className="text-xs truncate max-w-full" style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}>student@fpt.edu.vn</p>
            </div>
            <nav className="space-y-2">
              <a 
                className="flex items-center px-3 py-2 text-sm rounded-md w-full"
                style={{
                  backgroundColor: darkMode ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.3)',
                  color: darkMode ? '#a5b4fc' : '#4338ca'
                }}
                href="/student-dashboard"
              >
                <svg className="w-5 h-5 min-w-[1.25rem]" style={{ color: darkMode ? '#9ca3af' : '#6b7280' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                </svg>
              </a>
              <a 
                className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-gray-600/20 w-full"
                style={{ color: darkMode ? '#9ca3af' : '#374151' }}
                href="/my-courses"
              >
                <svg className="w-5 h-5 min-w-[1.25rem]" style={{ color: darkMode ? '#9ca3af' : '#6b7280' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                </svg>
              </a>
              <a 
                className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-gray-600/20 w-full"
                style={{ color: darkMode ? '#9ca3af' : '#374151' }}
                href="/assignments"
              >
                <svg className="w-5 h-5 min-w-[1.25rem]" style={{ color: darkMode ? '#9ca3af' : '#6b7280' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                </svg>
              </a>
              <a 
                className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-gray-600/20 w-full"
                style={{ color: darkMode ? '#9ca3af' : '#374151' }}
                href="/quiz"
              >
                <svg className="w-5 h-5 min-w-[1.25rem]" style={{ color: darkMode ? '#9ca3af' : '#6b7280' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </a>
              <a 
                className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-gray-600/20 w-full"
                style={{ color: darkMode ? '#9ca3af' : '#374151' }}
                href="/grades"
              >
                <svg className="w-5 h-5 min-w-[1.25rem]" style={{ color: darkMode ? '#9ca3af' : '#6b7280' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path>
                </svg>
              </a>
              <a 
                className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-gray-600/20 w-full"
                style={{ color: darkMode ? '#9ca3af' : '#374151' }}
                href="/attendance"
              >
                <svg className="w-5 h-5 min-w-[1.25rem]" style={{ color: darkMode ? '#9ca3af' : '#6b7280' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
                </svg>
              </a>
              <a 
                className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-gray-600/20 w-full"
                style={{ color: darkMode ? '#9ca3af' : '#374151' }}
                href="/forum"
              >
                <svg className="w-5 h-5 min-w-[1.25rem]" style={{ color: darkMode ? '#9ca3af' : '#6b7280' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
                </svg>
              </a>
            </nav>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col flex-1 w-0 overflow-hidden">
        <main className="flex-1 relative overflow-y-auto focus:outline-none p-4 mt-16 sm:pl-24 md:pl-28">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h1 
                className="text-2xl font-bold"
                style={{ color: darkMode ? '#ffffff' : '#1f2937' }}
              >
                Student Dashboard
              </h1>
            </div>
            
            <div className="mb-8">
              <h2 
                className="text-xl font-semibold mb-4"
                style={{ color: darkMode ? '#ffffff' : '#1f2937' }}
              >
                Welcome back! 📚
              </h2>
              <p 
                style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}
              >
                Track your progress and stay organized with your courses.
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
                  Enrolled Courses
                </p>
                <p 
                  className="text-3xl font-bold"
                  style={{ color: darkMode ? '#ffffff' : '#1e293b' }}
                >
                  {studentStats.enrolledCourses}
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
                    </svg>
                  </div>
                </div>
                <p 
                  className="text-sm font-medium mb-1"
                  style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}
                >
                  Pending Assignments
                </p>
                <p 
                  className="text-3xl font-bold"
                  style={{ color: darkMode ? '#ffffff' : '#1e293b' }}
                >
                  {studentStats.pendingAssignments}
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
                    style={{ backgroundColor: darkMode ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.1)' }}
                  >
                    <svg className="w-6 h-6" style={{ color: darkMode ? '#86efac' : '#16a34a' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </div>
                </div>
                <p 
                  className="text-sm font-medium mb-1"
                  style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}
                >
                  Upcoming Quizzes
                </p>
                <p 
                  className="text-3xl font-bold"
                  style={{ color: darkMode ? '#ffffff' : '#1e293b' }}
                >
                  {studentStats.upcomingQuizzes}
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path>
                    </svg>
                  </div>
                </div>
                <p 
                  className="text-sm font-medium mb-1"
                  style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}
                >
                  Average Grade
                </p>
                <p 
                  className="text-3xl font-bold"
                  style={{ color: darkMode ? '#ffffff' : '#1e293b' }}
                >
                  {gradeSummary.averageGrade}%
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
                  My Courses
                </h2>
                <a 
                  href="/my-courses" 
                  className="text-sm font-medium hover:underline"
                  style={{ color: darkMode ? '#a5b4fc' : '#6366f1' }}
                >
                  View All →
                </a>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myCourses.map((course) => (
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
                        {course.instructor}
                      </p>
                      <div className="flex items-center justify-between text-sm">
                        <span 
                          style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}
                        >
                          Progress: {course.progress}%
                        </span>
                        <button 
                          className="px-3 py-1 rounded-lg text-white text-sm font-medium"
                          style={{ backgroundColor: darkMode ? '#4f46e5' : '#6366f1' }}
                          onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = darkMode ? '#4338ca' : '#4f46e5'}
                          onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = darkMode ? '#4f46e5' : '#6366f1'}
                        >
                          Open
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Available Courses for Enrollment */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 
                  className="text-xl font-semibold"
                  style={{ color: darkMode ? '#ffffff' : '#1e293b' }}
                >
                  Available Courses
                </h2>
                <a 
                  href="/courses" 
                  className="text-sm font-medium hover:underline"
                  style={{ color: darkMode ? '#a5b4fc' : '#6366f1' }}
                >
                  Browse All →
                </a>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableCourses.map((course) => {
                  const isEnrolled = enrolledCourseIds.includes(course.id);
                  return (
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
                          className="text-sm mb-2"
                          style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}
                        >
                          {course.instructor}
                        </p>
                        <p 
                          className="text-xs mb-4"
                          style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}
                        >
                          {course.description}
                        </p>
                        <div className="flex items-center justify-between text-sm mb-4">
                          <span 
                            style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}
                          >
                            {course.enrolled}/{course.capacity} enrolled
                          </span>
                        </div>
                        {isEnrolled ? (
                          <button 
                            className="w-full px-4 py-2 rounded-lg text-sm font-medium"
                            style={{ 
                              backgroundColor: darkMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                              color: darkMode ? '#fca5a5' : '#dc2626',
                              border: '1px solid',
                              borderColor: darkMode ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.3)'
                            }}
                            onClick={() => handleUnenroll(course.id)}
                            onMouseEnter={(e) => {
                              (e.target as HTMLElement).style.backgroundColor = darkMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.2)';
                            }}
                            onMouseLeave={(e) => {
                              (e.target as HTMLElement).style.backgroundColor = darkMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.1)';
                            }}
                          >
                            Unenroll
                          </button>
                        ) : (
                          <button 
                            className="w-full px-4 py-2 rounded-lg text-white text-sm font-medium"
                            style={{ backgroundColor: darkMode ? '#4f46e5' : '#6366f1' }}
                            onClick={() => handleEnroll(course.id)}
                            onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = darkMode ? '#4338ca' : '#4f46e5'}
                            onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = darkMode ? '#4f46e5' : '#6366f1'}
                          >
                            Enroll
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Lesson Materials */}
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
                  Learning Materials
                </h2>
                <div 
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: darkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.1)' }}
                >
                  <svg className="w-5 h-5" style={{ color: darkMode ? '#93c5fd' : '#2563eb' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                  </svg>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {lessonMaterials.map((material) => (
                    <div 
                      key={material.id}
                      className="p-4 rounded-xl border flex items-start space-x-4 hover:shadow-md transition-all cursor-pointer"
                      style={{
                        backgroundColor: darkMode ? 'rgba(55, 65, 81, 0.3)' : 'rgba(249, 250, 251, 0.5)',
                        borderColor: darkMode ? 'rgba(75, 85, 99, 0.2)' : 'rgba(229, 231, 235, 0.5)'
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.backgroundColor = darkMode ? 'rgba(55, 65, 81, 0.5)' : 'rgba(249, 250, 251, 0.8)';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.backgroundColor = darkMode ? 'rgba(55, 65, 81, 0.3)' : 'rgba(249, 250, 251, 0.5)';
                      }}
                    >
                      <div 
                        className="p-3 rounded-lg flex-shrink-0"
                        style={{ 
                          backgroundColor: material.type === 'video' 
                            ? (darkMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.1)')
                            : (darkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.1)')
                        }}
                      >
                        {material.type === 'video' ? (
                          <svg className="w-6 h-6" style={{ color: darkMode ? '#fca5a5' : '#dc2626' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                          </svg>
                        ) : (
                          <svg className="w-6 h-6" style={{ color: darkMode ? '#93c5fd' : '#2563eb' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1">
                          <h3 
                            className="font-semibold truncate"
                            style={{ color: darkMode ? '#ffffff' : '#1e293b' }}
                          >
                            {material.title}
                          </h3>
                          {material.completed && (
                            <svg className="w-5 h-5 flex-shrink-0 ml-2" style={{ color: darkMode ? '#86efac' : '#16a34a' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                          )}
                        </div>
                        <p 
                          className="text-sm mb-2"
                          style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}
                        >
                          {material.course}
                        </p>
                        <div className="flex items-center text-xs">
                          {material.type === 'video' && (
                            <span 
                              style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}
                            >
                              📹 {material.duration}
                            </span>
                          )}
                          {material.type === 'pdf' && (
                            <span 
                              style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}
                            >
                              📄 {material.pages} pages
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
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
                    Recent Assignments
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
                  {recentAssignments.map((assignment) => (
                    <div 
                      key={assignment.id}
                      className="mb-4 pb-4 border-b last:border-b-0"
                      style={{
                        borderColor: darkMode ? 'rgba(75, 85, 99, 0.2)' : 'rgba(229, 231, 235, 0.5)'
                      }}
                    >
                      <div className="flex items-start justify-between">
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
                          <div className="flex items-center space-x-4 text-xs">
                            <span 
                              style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}
                            >
                              Due: {assignment.dueDate}
                            </span>
                            {assignment.status === 'pending' && (
                              <span 
                                className="px-2 py-1 rounded-full"
                                style={{ 
                                  backgroundColor: 'rgba(245, 158, 11, 0.1)',
                                  color: darkMode ? '#fcd34d' : '#d97706'
                                }}
                              >
                                Pending
                              </span>
                            )}
                            {assignment.status === 'submitted' && (
                              <span 
                                className="px-2 py-1 rounded-full"
                                style={{ 
                                  backgroundColor: 'rgba(34, 197, 94, 0.1)',
                                  color: darkMode ? '#86efac' : '#16a34a'
                                }}
                              >
                                Submitted
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
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
                    Upcoming Quizzes
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
                  {upcomingQuizzes.map((quiz) => (
                    <div 
                      key={quiz.id}
                      className="mb-4 pb-4 border-b last:border-b-0"
                      style={{
                        borderColor: darkMode ? 'rgba(75, 85, 99, 0.2)' : 'rgba(229, 231, 235, 0.5)'
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 
                            className="font-semibold mb-1"
                            style={{ color: darkMode ? '#ffffff' : '#1e293b' }}
                          >
                            {quiz.title}
                          </h3>
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
                              {quiz.date}
                            </span>
                            <span 
                              style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}
                            >
                              Duration: {quiz.duration}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Attendance Summary */}
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
                  Attendance Summary
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {attendanceData.map((item) => (
                    <div 
                      key={item.course}
                      className="p-4 rounded-xl"
                      style={{
                        backgroundColor: darkMode ? 'rgba(55, 65, 81, 0.3)' : 'rgba(249, 250, 251, 0.5)',
                        borderColor: darkMode ? 'rgba(75, 85, 99, 0.2)' : 'rgba(229, 231, 235, 0.5)'
                      }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 
                          className="font-semibold"
                          style={{ color: darkMode ? '#ffffff' : '#1e293b' }}
                        >
                          {item.course}
                        </h3>
                        <span 
                          className="text-lg font-bold"
                          style={{ color: darkMode ? '#a5b4fc' : '#6366f1' }}
                        >
                          {item.percentage}%
                        </span>
                      </div>
                      <p 
                        className="text-sm"
                        style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}
                      >
                        {item.present}/{item.total} classes attended
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Dark Mode Toggle */}
      <button 
        onClick={toggleDarkMode}
        className={`fixed bottom-4 right-4 z-[100] w-12 h-12 rounded-full flex items-center justify-center transition-colors duration-300 shadow-lg hover:scale-110 ${
          darkMode 
            ? 'bg-yellow-400 text-gray-900 hover:bg-yellow-300' 
            : 'bg-indigo-600 text-white hover:bg-indigo-700'
        }`}
        aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {darkMode ? (
          // Sun icon (light mode)
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        ) : (
          // Moon icon (dark mode)
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        )}
      </button>
    </div>
  );
}

