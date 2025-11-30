import React from "react";
import { Calendar } from "lucide-react";
import type { Assignment } from "../../types/assignment";

interface SimpleAssignmentCardProps {
  assignment: Assignment;
  darkMode: boolean;
  onNavigate: (assignmentId: string) => void;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const getDaysUntilDue = (dueDate: string) => {
  const due = new Date(dueDate);
  const now = new Date();
  const diffTime = due.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const getDueDateStatus = (dueDate: string, darkMode: boolean) => {
  const daysUntilDue = getDaysUntilDue(dueDate);
  if (daysUntilDue < 0) {
    return {
      text: "Overdue",
      color: darkMode ? "#fca5a5" : "#dc2626",
      bg: darkMode ? "rgba(239, 68, 68, 0.2)" : "rgba(239, 68, 68, 0.1)",
    };
  }
  if (daysUntilDue === 0) {
    return {
      text: "Due today",
      color: darkMode ? "#fbbf24" : "#d97706",
      bg: darkMode ? "rgba(251, 191, 36, 0.2)" : "rgba(251, 191, 36, 0.1)",
    };
  }
  if (daysUntilDue <= 3) {
    return {
      text: `Due in ${daysUntilDue} day${daysUntilDue > 1 ? "s" : ""}`,
      color: darkMode ? "#fbbf24" : "#d97706",
      bg: darkMode ? "rgba(251, 191, 36, 0.2)" : "rgba(251, 191, 36, 0.1)",
    };
  }
  return {
    text: `Due in ${daysUntilDue} days`,
    color: darkMode ? "#86efac" : "#16a34a",
    bg: darkMode ? "rgba(34, 197, 94, 0.2)" : "rgba(34, 197, 94, 0.1)",
  };
};

const SimpleAssignmentCard: React.FC<SimpleAssignmentCardProps> = ({
  assignment,
  darkMode,
  onNavigate,
}) => {
  const dueStatus = getDueDateStatus(assignment.dueDate, darkMode);

  return (
    <div
      className="rounded-lg p-4 cursor-pointer transition-all hover:shadow-lg"
      style={{
        backgroundColor: darkMode ? "rgba(31, 41, 55, 0.6)" : "rgba(249, 250, 251, 0.8)",
        border: darkMode ? "1px solid rgba(75, 85, 99, 0.3)" : "1px solid rgba(229, 231, 235, 0.5)",
      }}
      onClick={() => onNavigate(assignment._id)}
    >
      <h3
        className="text-lg font-semibold mb-2 hover:underline"
        style={{ color: darkMode ? "#ffffff" : "#1f2937" }}
      >
        {assignment.title}
      </h3>
      <p
        className="text-sm mb-3 line-clamp-2"
        style={{ color: darkMode ? "#d1d5db" : "#6b7280" }}
      >
        {assignment.description}
      </p>
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2" style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>
          <Calendar className="w-4 h-4" />
          <span>Due: {formatDate(assignment.dueDate)}</span>
        </div>
        <span
          className="px-2 py-1 rounded text-xs font-semibold"
          style={{
            backgroundColor: dueStatus.bg,
            color: dueStatus.color,
          }}
        >
          {dueStatus.text}
        </span>
      </div>
    </div>
  );
};

export default SimpleAssignmentCard;

