import React from "react";
import { File } from "lucide-react";

interface StaticCourseTabProps {
  courseId: string;
  darkMode: boolean;
}

const StaticCourseTab: React.FC<StaticCourseTabProps> = ({ courseId, darkMode }) => {
  return (
    <div className="py-12 text-center">
      <File
        className="w-16 h-16 mx-auto mb-4"
        style={{ color: darkMode ? "#4b5563" : "#9ca3af" }}
      />
      <p style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>
        Static course content coming soon
      </p>
    </div>
  );
};

export default StaticCourseTab;

