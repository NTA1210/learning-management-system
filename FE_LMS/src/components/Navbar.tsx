import { useTheme } from "../hooks/useTheme";
import { useAuth } from "../hooks/useAuth";
import { Link } from "react-router-dom";

interface NavbarProps {
  onToggleSidebar?: () => void;
}

export default function Navbar({ onToggleSidebar }: NavbarProps) {
  const { darkMode } = useTheme();
  const { user } = useAuth();

  return (
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
            onClick={onToggleSidebar}
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
          {user && (
            <Link to="/profile" className="flex items-center space-x-2">
              <img 
                src={(user as { profileImageUrl?: string; avatar_url?: string }).profileImageUrl || (user as { profileImageUrl?: string; avatar_url?: string }).avatar_url || "https://media.tenor.com/AN83u7YyqwUAAAAM/maxwell-the-cat.gif"}
                alt={(user as { fullName?: string; fullname?: string }).fullName || (user as { fullName?: string; fullname?: string }).fullname || "profile"}
                className="h-8 w-8 rounded-full object-cover border-2 border-white"
              />
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
