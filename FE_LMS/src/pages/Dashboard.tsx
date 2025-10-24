import { useTheme } from "../hooks/useTheme";
import { userStats, distributionSummary } from "../services/mock.ts";
import StudentsByBatchChart from "../components/StudentsByBatchChart.tsx";
import StudentsByCampusChart from "../components/StudentsByCampusChart.tsx";
import StudentsPerClassChart from "../components/StudentsPerClassChart.tsx";
import StudentsByMajorChart from "../components/StudentsByMajorChart.tsx";

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
            <a className="flex items-center space-x-3" href="/admin/dashboard">
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
                placeholder="Search..." 
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
            <button className="md:hidden text-white hover:text-gray-200">
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
                alt="admin" 
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
                  className="absolute right-0 top-4/5 transform translate-x-1/2 -translate-y-1/2 px-2 py-0 text-xs font-semibold rounded-md backdrop-blur-sm text-purple-800"
                  style={{
                    backgroundColor: darkMode ? 'rgba(168, 85, 247, 0.7)' : 'rgba(168, 85, 247, 0.7)',
                    backdropFilter: 'blur(16px)'
                  }}
                >
                  admin
                </div>
              </div>
              <h2 className="text-sm font-semibold truncate max-w-full" style={{ color: darkMode ? '#ffffff' : '#1f2937' }}>admin</h2>
              <p className="text-xs truncate max-w-full" style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}>admin@fpt.vn</p>
            </div>
            <nav className="space-y-2">
              <a 
                className="flex items-center px-3 py-2 text-sm rounded-md w-full"
                style={{
                  backgroundColor: darkMode ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.3)',
                  color: darkMode ? '#a5b4fc' : '#4338ca'
                }}
                href="/admin/dashboard"
              >
                <svg className="w-5 h-5 min-w-[1.25rem]" style={{ color: darkMode ? '#9ca3af' : '#6b7280' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                </svg>
              </a>
              <a 
                className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-gray-600/20 w-full"
                style={{ color: darkMode ? '#9ca3af' : '#374151' }}
                href="/admin/classes"
              >
                <svg className="w-5 h-5 min-w-[1.25rem]" style={{ color: darkMode ? '#9ca3af' : '#6b7280' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                </svg>
              </a>
              <a 
                className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-gray-600/20 w-full"
                style={{ color: darkMode ? '#9ca3af' : '#374151' }}
                href="/my-courses"
              >
                <svg className="w-5 h-5 min-w-[1.25rem]" style={{ color: darkMode ? '#9ca3af' : '#6b7280' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path>
                </svg>
              </a>
              <a 
                className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-gray-600/20 w-full"
                style={{ color: darkMode ? '#9ca3af' : '#374151' }}
                href="/calendar"
              >
                <svg className="w-5 h-5 min-w-[1.25rem]" style={{ color: darkMode ? '#9ca3af' : '#6b7280' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
              </a>
              <a 
                className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-gray-600/20 w-full"
                style={{ color: darkMode ? '#9ca3af' : '#374151' }}
                href="/quiz"
              >
                <svg className="w-5 h-5 min-w-[1.25rem]" style={{ color: darkMode ? '#9ca3af' : '#6b7280' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
                </svg>
              </a>
              <a 
                className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-gray-600/20 w-full"
                style={{ color: darkMode ? '#9ca3af' : '#374151' }}
                href="/materials"
              >
                <svg className="w-5 h-5 min-w-[1.25rem]" style={{ color: darkMode ? '#9ca3af' : '#6b7280' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                </svg>
              </a>
              <div className="relative">
                <button 
                  className="flex items-center w-full px-3 py-2 text-sm rounded-md justify-between"
                  style={{ color: darkMode ? '#9ca3af' : '#374151' }}
                >
                  <div className="flex items-center">
                    <svg className="w-5 h-5 min-w-[1.25rem]" style={{ color: darkMode ? '#9ca3af' : '#6b7280' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </div>
                </button>
              </div>
              <div className="relative">
                <button 
                  className="flex items-center w-full px-3 py-2 text-sm rounded-md justify-between"
                  style={{ color: darkMode ? '#9ca3af' : '#374151' }}
                >
                  <div className="flex items-center">
                    <svg className="w-5 h-5 min-w-[1.25rem]" style={{ color: darkMode ? '#9ca3af' : '#6b7280' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                  </div>
                </button>
              </div>
              <a 
                className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-gray-600/20 w-full"
                style={{ color: darkMode ? '#9ca3af' : '#374151' }}
                href="/admin/users"
              >
                <svg className="w-5 h-5 min-w-[1.25rem]" style={{ color: darkMode ? '#9ca3af' : '#6b7280' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                </svg>
              </a>
              <a 
                className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-gray-600/20 w-full"
                style={{ color: darkMode ? '#9ca3af' : '#374151' }}
                href="/admin/room-management"
              >
                <svg className="w-5 h-5 min-w-[1.25rem]" style={{ color: darkMode ? '#9ca3af' : '#6b7280' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                </svg>
              </a>
              <a 
                className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-gray-600/20 w-full"
                style={{ color: darkMode ? '#9ca3af' : '#374151' }}
                href="/admin/room-control"
              >
                <svg className="w-5 h-5 min-w-[1.25rem]" style={{ color: darkMode ? '#9ca3af' : '#6b7280' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path>
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
