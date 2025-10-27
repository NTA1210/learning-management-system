import { useTheme } from "../hooks/useTheme";
import { userStats, distributionSummary } from "../services/mock.ts";
import StudentsByBatchChart from "../components/StudentsByBatchChart.tsx";
import StudentsByCampusChart from "../components/StudentsByCampusChart.tsx";
import StudentsPerClassChart from "../components/StudentsPerClassChart.tsx";
import StudentsByMajorChart from "../components/StudentsByMajorChart.tsx";
import Navbar from "../components/Navbar.tsx";
import Sidebar from "../components/Sidebar.tsx";

export default function Dashboard() {
  const { darkMode, toggleDarkMode } = useTheme();

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
      <Sidebar role="admin" />

      {/* Main Content */}
      <div className="flex flex-col flex-1 w-0 overflow-hidden">
        <main className="flex-1 relative overflow-y-auto focus:outline-none p-4 mt-16 sm:pl-24 md:pl-28">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h1 
                className="text-2xl font-bold"
                style={{ color: darkMode ? '#ffffff' : '#1f2937' }}
              >
                Admin Dashboard
              </h1>
              <button 
                className="px-4 py-2 rounded-lg text-white flex items-center"
                style={{ backgroundColor: darkMode ? '#4c1d95' : '#4f46e5' }}
                onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = darkMode ? '#5b21b6' : '#4338ca'}
                onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = darkMode ? '#4c1d95' : '#4f46e5'}
              >
                <svg className="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
                Refresh Data
              </button>
            </div>
            
            <div className="mb-8">
              <h2 
                className="text-xl font-semibold mb-4"
                style={{ color: darkMode ? '#ffffff' : '#1f2937' }}
              >
                Welcome back, admin!
              </h2>
              <p 
                style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}
              >
                Manage all aspects of the platform from this admin panel.
              </p>
            </div>

            <div className="mb-6">
              <div 
                className="border-b"
                style={{ borderColor: darkMode ? '#374151' : '#e5e7eb' }}
              >
                <nav className="-mb-px flex space-x-8 overflow-x-auto">
                  <button 
                    className="whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2"
                    style={{
                      borderColor: darkMode ? '#8b5cf6' : '#4f46e5',
                      color: darkMode ? '#a78bfa' : '#4f46e5'
                    }}
                  >
                    <span>📊</span>
                    <span>Overview</span>
                  </button>
                  <button 
                    className="whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 border-transparent"
                    style={{
                      color: darkMode ? '#9ca3af' : '#6b7280',
                      borderColor: 'transparent'
                    }}
                    onMouseEnter={(e) => {
                      (e.target as HTMLElement).style.color = darkMode ? '#d1d5db' : '#374151';
                      (e.target as HTMLElement).style.borderColor = darkMode ? '#4b5563' : '#d1d5db';
                    }}
                    onMouseLeave={(e) => {
                      (e.target as HTMLElement).style.color = darkMode ? '#9ca3af' : '#6b7280';
                      (e.target as HTMLElement).style.borderColor = 'transparent';
                    }}
                  >
                    <span>👥</span>
                    <span>Users</span>
                  </button>
                  <button 
                    className="whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 border-transparent"
                    style={{
                      color: darkMode ? '#9ca3af' : '#6b7280',
                      borderColor: 'transparent'
                    }}
                    onMouseEnter={(e) => {
                      (e.target as HTMLElement).style.color = darkMode ? '#d1d5db' : '#374151';
                      (e.target as HTMLElement).style.borderColor = darkMode ? '#4b5563' : '#d1d5db';
                    }}
                    onMouseLeave={(e) => {
                      (e.target as HTMLElement).style.color = darkMode ? '#9ca3af' : '#6b7280';
                      (e.target as HTMLElement).style.borderColor = 'transparent';
                    }}
                  >
                    <span>🔐</span>
                    <span>Sessions</span>
                  </button>
                  <button 
                    className="whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 border-transparent"
                    style={{
                      color: darkMode ? '#9ca3af' : '#6b7280',
                      borderColor: 'transparent'
                    }}
                    onMouseEnter={(e) => {
                      (e.target as HTMLElement).style.color = darkMode ? '#d1d5db' : '#374151';
                      (e.target as HTMLElement).style.borderColor = darkMode ? '#4b5563' : '#d1d5db';
                    }}
                    onMouseLeave={(e) => {
                      (e.target as HTMLElement).style.color = darkMode ? '#9ca3af' : '#6b7280';
                      (e.target as HTMLElement).style.borderColor = 'transparent';
                    }}
                  >
                    <span>⚠️</span>
                    <span>Alerts</span>
                  </button>
                  <button 
                    className="whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 border-transparent"
                    style={{
                      color: darkMode ? '#9ca3af' : '#6b7280',
                      borderColor: 'transparent'
                    }}
                    onMouseEnter={(e) => {
                      (e.target as HTMLElement).style.color = darkMode ? '#d1d5db' : '#374151';
                      (e.target as HTMLElement).style.borderColor = darkMode ? '#4b5563' : '#d1d5db';
                    }}
                    onMouseLeave={(e) => {
                      (e.target as HTMLElement).style.color = darkMode ? '#9ca3af' : '#6b7280';
                      (e.target as HTMLElement).style.borderColor = 'transparent';
                    }}
                  >
                    <span>⚙️</span>
                    <span>System</span>
                  </button>
                  <button 
                    className="whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 border-transparent"
                    style={{
                      color: darkMode ? '#9ca3af' : '#6b7280',
                      borderColor: 'transparent'
                    }}
                    onMouseEnter={(e) => {
                      (e.target as HTMLElement).style.color = darkMode ? '#d1d5db' : '#374151';
                      (e.target as HTMLElement).style.borderColor = darkMode ? '#4b5563' : '#d1d5db';
                    }}
                    onMouseLeave={(e) => {
                      (e.target as HTMLElement).style.color = darkMode ? '#9ca3af' : '#6b7280';
                      (e.target as HTMLElement).style.borderColor = 'transparent';
                    }}
                  >
                    <span>🛠️</span>
                    <span>Actions</span>
                  </button>
                </nav>
              </div>
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                    </svg>
                  </div>
                  <div 
                    className="text-xs px-2 py-1 rounded-full"
                    style={{ 
                      backgroundColor: darkMode ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                      color: darkMode ? '#10b981' : '#059669'
                    }}
                  >
                    +1 today
                  </div>
                </div>
                <p 
                  className="text-sm font-medium mb-1"
                  style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}
                >
                  Total Users
                </p>
                <p 
                  className="text-3xl font-bold"
                  style={{ color: darkMode ? '#ffffff' : '#1e293b' }}
                >
                  {userStats.totalUsers}
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
                    style={{ backgroundColor: darkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.1)' }}
                  >
                    <svg className="w-6 h-6" style={{ color: darkMode ? '#93c5fd' : '#2563eb' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                    </svg>
                  </div>
                  <div 
                    className="text-xs px-2 py-1 rounded-full"
                    style={{ 
                      backgroundColor: darkMode ? 'rgba(107, 114, 128, 0.1)' : 'rgba(107, 114, 128, 0.1)',
                      color: darkMode ? '#9ca3af' : '#6b7280'
                    }}
                  >
                    0.0%
                  </div>
                </div>
                <p 
                  className="text-sm font-medium mb-1"
                  style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}
                >
                  Active Users
                </p>
                <p 
                  className="text-3xl font-bold"
                  style={{ color: darkMode ? '#ffffff' : '#1e293b' }}
                >
                  {userStats.activeUsers}
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </div>
                </div>
                <p 
                  className="text-sm font-medium mb-1"
                  style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}
                >
                  Avg. Session Time
                </p>
                <p 
                  className="text-3xl font-bold"
                  style={{ color: darkMode ? '#ffffff' : '#1e293b' }}
                >
                  {userStats.avgSessionMin} min
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                    </svg>
                  </div>
                  <div 
                    className="text-xs px-2 py-1 rounded-full"
                    style={{ 
                      backgroundColor: darkMode ? 'rgba(245, 158, 11, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                      color: darkMode ? '#fcd34d' : '#d97706'
                    }}
                  >
                    Last 24h
                  </div>
                </div>
                <p 
                  className="text-sm font-medium mb-1"
                  style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}
                >
                  Expired Sessions
                </p>
                <p 
                  className="text-3xl font-bold"
                  style={{ color: darkMode ? '#ffffff' : '#1e293b' }}
                >
                  {userStats.expiredSessions}
                </p>
              </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
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
                    Students by Batch
                  </h2>
                  <div 
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: darkMode ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.1)' }}
                  >
                    <svg className="w-5 h-5" style={{ color: darkMode ? '#a5b4fc' : '#6366f1' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                    </svg>
                  </div>
                </div>
                <div className="p-4">
                  <StudentsByBatchChart />
                </div>
              </div>
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
                    Students by Campus
                  </h2>
                  <div 
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: darkMode ? 'rgba(139, 92, 246, 0.1)' : 'rgba(139, 92, 246, 0.1)' }}
                  >
                    <svg className="w-5 h-5" style={{ color: darkMode ? '#c4b5fd' : '#8b5cf6' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"></path>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"></path>
                    </svg>
                  </div>
                </div>
                <div className="p-4">
                  <StudentsByCampusChart />
                </div>
              </div>
            </div>

            {/* Additional Charts */}
            <div 
              className="rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 mb-8"
              style={{
                backgroundColor: darkMode ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.9)',
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
                  Students per Class
                </h2>
                <div 
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: darkMode ? 'rgba(6, 182, 212, 0.1)' : 'rgba(6, 182, 212, 0.1)' }}
                >
                  <svg className="w-5 h-5" style={{ color: darkMode ? '#67e8f9' : '#06b6d4' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                  </svg>
                </div>
              </div>
              <div className="p-4">
                <StudentsPerClassChart />
              </div>
            </div>

            <div 
              className="rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 mb-8"
              style={{
                backgroundColor: darkMode ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.9)',
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
                  Students by Major
                </h2>
                <div 
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: darkMode ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.1)' }}
                >
                  <svg className="w-5 h-5" style={{ color: darkMode ? '#86efac' : '#10b981' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"></path>
                  </svg>
                </div>
              </div>
              <div className="p-4">
                <StudentsByMajorChart />
              </div>
            </div>

            {/* Summary Cards */}
            <div 
              className="rounded-lg shadow mb-8"
              style={{
                backgroundColor: darkMode ? '#2d3748' : '#ffffff',
                borderColor: darkMode ? '#374151' : '#e5e7eb'
              }}
            >
              <div 
                className="px-4 py-3 border-b"
                style={{
                  backgroundColor: darkMode ? '#374151' : '#f9fafb',
                  borderColor: darkMode ? '#4b5563' : '#e5e7eb'
                }}
              >
                <h2 
                  className="text-lg font-semibold"
                  style={{ color: darkMode ? '#ffffff' : '#1f2937' }}
                >
                  Student Distribution Summary
                </h2>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div 
                    className="p-4 rounded-md"
                    style={{ backgroundColor: darkMode ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)' }}
                  >
                    <div 
                      className="text-sm"
                      style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}
                    >
                      Total Students
                    </div>
                    <div 
                      className="font-bold text-xl"
                      style={{ color: darkMode ? '#a5b4fc' : '#4338ca' }}
                    >
                      {distributionSummary.totalStudents}
                    </div>
                  </div>
                  <div 
                    className="p-4 rounded-md"
                    style={{ backgroundColor: darkMode ? 'rgba(168, 85, 247, 0.1)' : 'rgba(168, 85, 247, 0.05)' }}
                  >
                    <div 
                      className="text-sm"
                      style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}
                    >
                      Unique Batches
                    </div>
                    <div 
                      className="font-bold text-xl"
                      style={{ color: darkMode ? '#c4b5fd' : '#7c3aed' }}
                    >
                      {distributionSummary.uniqueBatches}
                    </div>
                  </div>
                  <div 
                    className="p-4 rounded-md"
                    style={{ backgroundColor: darkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)' }}
                  >
                    <div 
                      className="text-sm"
                      style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}
                    >
                      Active Campuses
                    </div>
                    <div 
                      className="font-bold text-xl"
                      style={{ color: darkMode ? '#93c5fd' : '#2563eb' }}
                    >
                      {distributionSummary.activeCampuses}
                    </div>
                  </div>
                  <div 
                    className="p-4 rounded-md"
                    style={{ backgroundColor: darkMode ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.05)' }}
                  >
                    <div 
                      className="text-sm"
                      style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}
                    >
                      Active Classes
                    </div>
                    <div 
                      className="font-bold text-xl"
                      style={{ color: darkMode ? '#86efac' : '#16a34a' }}
                    >
                      {distributionSummary.activeClasses}
                    </div>
                  </div>
                  <div 
                    className="p-4 rounded-md"
                    style={{ backgroundColor: darkMode ? 'rgba(245, 158, 11, 0.1)' : 'rgba(245, 158, 11, 0.05)' }}
                  >
                    <div 
                      className="text-sm"
                      style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}
                    >
                      Unique Majors
                    </div>
                    <div 
                      className="font-bold text-xl"
                      style={{ color: darkMode ? '#fcd34d' : '#d97706' }}
                    >
                      {distributionSummary.uniqueMajors}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-4 right-4 z-[90] flex flex-col space-y-3">
        <button 
          className="text-white p-3 rounded-full shadow-xl focus:outline-none relative"
          style={{ backgroundColor: darkMode ? '#f59e0b' : '#f59e0b' }}
          onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = darkMode ? '#d97706' : '#d97706'}
          onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = darkMode ? '#f59e0b' : '#f59e0b'}
          title="Send Notification"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
          </svg>
        </button>
        <button 
          className="text-white p-3 rounded-full shadow-xl focus:outline-none relative"
          style={{ backgroundColor: darkMode ? '#7c3aed' : '#7c3aed' }}
          onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = darkMode ? '#6d28d9' : '#6d28d9'}
          onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = darkMode ? '#7c3aed' : '#7c3aed'}
          title="AI Chat Assistant"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714a2.25 2.25 0 001.357 2.051l.884.442c.396.198.598.628.425 1.04l-.774 1.84m0-7.106a24.301 24.301 0 00-4.5 0m0 0l.774 1.84c.173.412-.029.842-.425 1.04l-.884.442a2.25 2.25 0 00-1.357 2.051v5.714m7.5 0a2.25 2.25 0 001.591-.659l5.091-5.092m-5.091 5.092a2.25 2.25 0 01-1.591.659H9.75m0-6.75v6.75m3-12h-6"></path>
          </svg>
        </button>
        <button 
          className="text-white p-3 rounded-full shadow-xl focus:outline-none relative"
          style={{ backgroundColor: darkMode ? '#16a34a' : '#16a34a' }}
          onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = darkMode ? '#15803d' : '#15803d'}
          onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = darkMode ? '#16a34a' : '#16a34a'}
          title="Group Chat"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
          </svg>
          <span 
            className="absolute -top-1 -right-1 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center"
            style={{ backgroundColor: darkMode ? '#10b981' : '#10b981' }}
          >
            14
          </span>
        </button>
        <button 
          className="text-white p-3 rounded-full shadow-xl focus:outline-none relative"
          style={{ backgroundColor: darkMode ? '#4f46e5' : '#4f46e5' }}
          onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = darkMode ? '#4338ca' : '#4338ca'}
          onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = darkMode ? '#4f46e5' : '#4f46e5'}
          title="Private Chat"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
          </svg>
        </button>
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
