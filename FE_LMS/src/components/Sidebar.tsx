import { useTheme } from "../hooks/useTheme";

interface SidebarProps {
  isOpen?: boolean;
  role?: 'admin' | 'teacher' | 'student';
  userInfo?: {
    name: string;
    email: string;
    avatar?: string;
  };
}

interface MenuItem {
  href: string;
  icon: JSX.Element;
  label?: string;
}

const getMenuItems = (role: 'admin' | 'teacher' | 'student'): MenuItem[] => {
  const baseItems: MenuItem[] = [
    {
      href: `/${role}-dashboard`,
      icon: (
        <svg className="w-5 h-5 min-w-[1.25rem]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
        </svg>
      )
    },
    {
      href: "/my-courses",
      icon: (
        <svg className="w-5 h-5 min-w-[1.25rem]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
        </svg>
      )
    },
    {
      href: "/assignments",
      icon: (
        <svg className="w-5 h-5 min-w-[1.25rem]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
        </svg>
      )
    },
    {
      href: "/quiz",
      icon: (
        <svg className="w-5 h-5 min-w-[1.25rem]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
      )
    },
    {
      href: "/materials",
      icon: (
        <svg className="w-5 h-5 min-w-[1.25rem]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
        </svg>
      )
    }
  ];

  if (role === 'admin') {
    return [
      ...baseItems,
      {
        href: "/calendar",
        icon: (
          <svg className="w-5 h-5 min-w-[1.25rem]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
          </svg>
        )
      },
      {
        href: "/admin/users",
        icon: (
          <svg className="w-5 h-5 min-w-[1.25rem]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
          </svg>
        )
      },
      {
        href: "/admin/room-management",
        icon: (
          <svg className="w-5 h-5 min-w-[1.25rem]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
          </svg>
        )
      },
      {
        href: "/admin/room-control",
        icon: (
          <svg className="w-5 h-5 min-w-[1.25rem]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        )
      }
    ];
  }

  if (role === 'teacher') {
    return [
      ...baseItems,
      {
        href: "/grading",
        icon: (
          <svg className="w-5 h-5 min-w-[1.25rem]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
          </svg>
        )
      },
      {
        href: "/students",
        icon: (
          <svg className="w-5 h-5 min-w-[1.25rem]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
          </svg>
        )
      }
    ];
  }

  if (role === 'student') {
    return [
      ...baseItems,
      {
        href: "/grades",
        icon: (
          <svg className="w-5 h-5 min-w-[1.25rem]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path>
          </svg>
        )
      },
      {
        href: "/calendar",
        icon: (
          <svg className="w-5 h-5 min-w-[1.25rem]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
          </svg>
        )
      }
    ];
  }

  return baseItems;
};

export default function Sidebar({ isOpen = true, role = 'admin', userInfo }: SidebarProps) {
  const { darkMode } = useTheme();
  const menuItems = getMenuItems(role);

  if (!isOpen) return null;

  const defaultUserInfo = {
    name: role,
    email: `${role}@fpt.edu.vn`,
    avatar: "https://media.tenor.com/AN83u7YyqwUAAAAM/maxwell-the-cat.gif"
  };

  const user = userInfo || defaultUserInfo;
  const roleColors = {
    admin: 'rgba(168, 85, 247, 0.7)',
    teacher: 'rgba(59, 130, 246, 0.7)',
    student: 'rgba(34, 197, 94, 0.7)'
  };

  return (
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
                src={user.avatar} 
                alt="Profile"
              />
              <div 
                className="absolute right-0 top-4/5 transform translate-x-1/2 -translate-y-1/2 px-2 py-0 text-xs font-semibold rounded-md backdrop-blur-sm"
                style={{
                  backgroundColor: roleColors[role],
                  backdropFilter: 'blur(16px)'
                }}
              >
                {role}
              </div>
            </div>
            <h2 className="text-sm font-semibold truncate max-w-full" style={{ color: darkMode ? '#ffffff' : '#1f2937' }}>{user.name}</h2>
            <p className="text-xs truncate max-w-full" style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}>{user.email}</p>
          </div>
          <nav className="space-y-2">
            {menuItems.map((item, index) => {
              const isActive = item.href === `/${role}-dashboard`;
              return (
                <a 
                  key={index}
                  className="flex items-center px-3 py-2 text-sm rounded-md w-full"
                  style={{
                    backgroundColor: isActive ? (darkMode ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.3)') : 'transparent',
                    color: isActive ? (darkMode ? '#a5b4fc' : '#4338ca') : (darkMode ? '#9ca3af' : '#374151')
                  }}
                  href={item.href}
                >
                  <div style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}>
                    {item.icon}
                  </div>
                </a>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}
