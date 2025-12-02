import React from "react";

export type TabType = "lessons" | "assignments" | "attendance" | "schedule" | "static";

interface CourseTabsNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  darkMode: boolean;
}

const CourseTabsNavigation: React.FC<CourseTabsNavigationProps> = ({
  activeTab,
  onTabChange,
  darkMode,
}) => {
  const tabs: { id: TabType; label: string; icon?: React.ReactNode }[] = [
    { id: "lessons", label: "Lessons" },
    { id: "assignments", label: "Assignments" },
    { id: "attendance", label: "Attendance" },
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
            className="px-4 py-3 text-sm font-medium border-b-2 transition-colors relative"
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

