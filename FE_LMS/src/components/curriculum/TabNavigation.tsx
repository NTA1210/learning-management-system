import React from "react";
import { useTheme } from "../../hooks/useTheme";

type TabType = "tree" | "majors" | "specialists" | "subjects" | "semester";

interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab,
  onTabChange,
}) => {
  const { darkMode } = useTheme();

  const tabs: { id: TabType; label: string }[] = [
    { id: "tree", label: "Tree View" },
    { id: "majors", label: "Majors" },
    { id: "specialists", label: "Specialists" },
    { id: "subjects", label: "Subjects" },
    { id: "semester", label: "Semester" },
  ];

  return (
    <div
      className="flex gap-1 mb-6 border-b"
      style={{
        borderColor: darkMode ? "#374151" : "#e5e7eb",
      }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className="px-4 py-2 font-medium text-sm transition-all relative"
            style={{
              color: isActive
                ? darkMode
                  ? "#6366f1"
                  : "#4f46e5"
                : darkMode
                ? "#9ca3af"
                : "#6b7280",
              borderBottom: isActive ? "2px solid" : "2px solid transparent",
              borderColor: isActive
                ? darkMode
                  ? "#6366f1"
                  : "#4f46e5"
                : "transparent",
              backgroundColor: isActive
                ? darkMode
                  ? "rgba(99, 102, 241, 0.1)"
                  : "rgba(79, 70, 229, 0.05)"
                : "transparent",
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.backgroundColor = darkMode
                  ? "#1f2937"
                  : "#f9fafb";
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.backgroundColor = "transparent";
              }
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};

export default TabNavigation;
