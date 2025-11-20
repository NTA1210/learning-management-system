import { useTheme } from "../hooks/useTheme";
import { useAuth } from "../hooks/useAuth";
import { Link } from "react-router-dom";
import NotificationDropdown from "./NotificationDropdown";

interface NavbarProps {
  onToggleSidebar?: () => void;
}

export default function Navbar({ onToggleSidebar }: NavbarProps) {
  const { darkMode } = useTheme();
  const { user } = useAuth();

  return (
    <nav
      className="shadow-lg py-3 px-4 sm:px-6 fixed top-0 left-0 right-0 z-[95] backdrop-blur-md transition-colors duration-300"
      style={{
        backgroundColor: darkMode ? "rgba(26, 32, 44, 0.95)" : "rgba(255, 255, 255, 0.95)",
        borderBottom: darkMode ? "1px solid rgba(148, 163, 184, 0.1)" : "1px solid rgba(148, 163, 184, 0.1)",
        color: darkMode ? "#ffffff" : "#1e293b",
      }}
    >
      <div className="max-w-7xl mx-auto flex flex-col gap-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center">
            <button
              className="mr-3 p-2 rounded-lg transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white/20 md:hidden"
              style={{
                backgroundColor: darkMode ? "rgba(99, 102, 241, 0.15)" : "rgba(99, 102, 241, 0.1)",
                color: darkMode ? "#a5b4fc" : "#4f46e5",
              }}
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
                style={{ backgroundColor: "#6366f1" }}
              >
                <span className="text-white font-bold text-lg">F</span>
              </div>
              <span className="text-xl font-bold" style={{ color: darkMode ? "#ffffff" : "#1e293b" }}>
                FStudyMate
              </span>
            </a>
          </div>
          <div className="hidden md:flex md:flex-1 mx-4">
            <div className="relative w-full max-w-xl mx-auto">
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
                style={{
                  borderColor: darkMode ? "rgba(148, 163, 184, 0.2)" : "rgba(148, 163, 184, 0.3)",
                  backgroundColor: darkMode ? "rgba(15, 23, 42, 0.5)" : "rgba(255, 255, 255, 0.85)",
                  color: darkMode ? "#ffffff" : "#1e293b",
                  backdropFilter: "blur(10px)",
                }}
              />
              <div className="absolute right-3 top-2.5" style={{ color: darkMode ? "#9ca3af" : "#9ca3af" }}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 md:gap-4">
            <NotificationDropdown isDarkMode={darkMode} />
            {user && (
              <Link to="/profile" className="flex items-center">
                <img
                  src={
                    (user as { profileImageUrl?: string; avatar_url?: string }).profileImageUrl ||
                    (user as { profileImageUrl?: string; avatar_url?: string }).avatar_url ||
                    "https://media.tenor.com/AN83u7YyqwUAAAAM/maxwell-the-cat.gif"
                  }
                  alt={
                    (user as { fullName?: string; fullname?: string }).fullName ||
                    (user as { fullName?: string; fullname?: string }).fullname ||
                    "profile"
                  }
                  className="h-8 w-8 md:h-9 md:w-9 rounded-full object-cover border border-white/70"
                />
              </Link>
            )}
          </div>
        </div>
        <div className="md:hidden">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
              style={{
                borderColor: darkMode ? "rgba(148, 163, 184, 0.3)" : "rgba(148, 163, 184, 0.35)",
                backgroundColor: darkMode ? "rgba(15, 23, 42, 0.6)" : "rgba(255, 255, 255, 0.95)",
                color: darkMode ? "#ffffff" : "#1e293b",
              }}
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: darkMode ? "#9ca3af" : "#94a3b8" }}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
