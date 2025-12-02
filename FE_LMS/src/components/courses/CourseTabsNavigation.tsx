import React from "react";

export type TabType = "lessons" | "assignments" | "attendance" | "quiz" | "schedule" | "static";

interface CourseTabsNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  darkMode: boolean;
  quizCount?: number;
}

const CourseTabsNavigation: React.FC<CourseTabsNavigationProps> = ({
  activeTab,
  onTabChange,
  darkMode,
  quizCount,
}) => {
  const tabs: { id: TabType; label: string; count?: number; icon?: React.ReactNode }[] = [
    { id: "lessons", label: "Lessons" },
    { id: "assignments", label: "Assignments" },
    { id: "attendance", label: "Attendance" },
    { id: "quiz", label: "Quizzes", count: quizCount },
    { id: "schedule", label: "Schedule" },
    { id: "static", label: "Static course" },
  ];

  return (
    <div
      className="border-b"
      style={{
        borderColor: darkMode ? "rgba(255,255,255,0.1)" : "#e5e7eb",
        backgroundColor: darkMode ? "#0f172a" : "#ffffff",
      }}
    >
      <nav className="flex -mb-px" style={{ backgroundColor: darkMode ? "#0f172a" : "#ffffff" }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className="px-4 py-3 text-sm font-medium border-b-2 transition-colors relative flex items-center gap-2"
            style={{
              color:
                activeTab === tab.id
                  ? darkMode
                    ? "#ffffff"
                    : "#111827"
                  : darkMode
                  ? "#9ca3af"
                  : "#6b7280",
              borderColor:
                activeTab === tab.id
                  ? "#f97316"
                  : "transparent",
              backgroundColor: darkMode ? "#0f172a" : "#ffffff",
            }}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span
                className="px-2 py-0.5 text-xs font-semibold rounded-full"
                style={{
                  backgroundColor: darkMode ? "rgba(99, 102, 241, 0.2)" : "rgba(99, 102, 241, 0.1)",
                  color: darkMode ? "#818cf8" : "#6366f1",
                }}
              >
                {tab.count}
              </span>
            )}
            {activeTab === tab.id && (
              <div
                className="absolute bottom-0 left-0 right-0 h-0.5"
                style={{ backgroundColor: "#f97316" }}
              />
            )}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default CourseTabsNavigation;

