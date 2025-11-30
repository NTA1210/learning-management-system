import React from "react";
import { Calendar } from "lucide-react";

interface AttendanceTabProps {
  courseId: string;
  darkMode: boolean;
}

const AttendanceTab: React.FC<AttendanceTabProps> = ({ courseId, darkMode }) => {
  return (
    <div className="py-12 text-center">
      <Calendar
        className="w-16 h-16 mx-auto mb-4"
        style={{ color: darkMode ? "#4b5563" : "#9ca3af" }}
      />
      <p style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>
        Attendance feature coming soon
      </p>
    </div>
  );
};

export default AttendanceTab;

