import React from "react";
import { Award, Calendar, User, Clock, Trash } from "lucide-react";
import type { Assignment } from "../../types/assignment";

interface AssignmentCardProps {
  assignment: Assignment;
  darkMode: boolean;
  canManage: boolean;
  onNavigate: (assignmentId: string) => void;
  onEdit: (assignment: Assignment) => void;
  onDelete: (assignmentId: string) => void;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
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

const AssignmentCard: React.FC<AssignmentCardProps> = ({
  assignment,
  darkMode,
  canManage,
  onNavigate,
  onEdit,
  onDelete,
}) => {
  const dueStatus = getDueDateStatus(assignment.dueDate, darkMode);
  const handleCardHover = (
    event: React.MouseEvent<HTMLDivElement>,
    entering: boolean
  ) => {
    const el = event.currentTarget;
    if (entering) {
      el.style.transform = "translateY(-6px) scale(1.02)";
      el.style.boxShadow = darkMode
        ? "24px 24px 38px rgba(0,0,0,0.45), -24px -24px 38px rgba(255,255,255,0.05)"
        : "18px 18px 32px rgba(0,0,0,0.12), -18px -18px 32px rgba(255,255,255,0.7)";
    } else {
      el.style.transform = "translateY(0) scale(1)";
      el.style.boxShadow = "";
    }
  };

  return (
    <div
      className="rounded-lg shadow-md overflow-hidden flex flex-col"
      style={{
        backgroundColor: darkMode
          ? "rgba(31, 41, 55, 0.8)"
          : "rgba(255, 255, 255, 0.9)",
        border: darkMode
          ? "1px solid rgba(75, 85, 99, 0.3)"
          : "1px solid rgba(229, 231, 235, 0.5)",
        transition: "transform 0.3s ease, box-shadow 0.3s ease",
      }}
      onMouseEnter={(e) => handleCardHover(e, true)}
      onMouseLeave={(e) => handleCardHover(e, false)}
    >
      <div
        className="p-6 flex flex-col flex-1 cursor-pointer"
        onClick={() => onNavigate(assignment._id)}
      >
        <div className="mb-3">
          <span
            className="inline-block px-3 py-1 text-xs font-semibold rounded-full"
            style={{
              backgroundColor: darkMode
                ? "rgba(99, 102, 241, 0.2)"
                : "rgba(99, 102, 241, 0.1)",
              color: darkMode ? "#a5b4fc" : "#6366f1",
            }}
          >
            {assignment.courseId?.title || "Unknown Course"}
          </span>
        </div>

        <h3
          className="text-xl font-semibold mb-2"
          style={{ color: darkMode ? "#ffffff" : "#1f2937" }}
        >
          {assignment.title}
        </h3>

        <p
          className="text-sm mb-4 line-clamp-2"
          style={{ color: darkMode ? "#d1d5db" : "#6b7280" }}
        >
          {assignment.description}
        </p>

        <div className="space-y-2 mb-4">
          <div
            className="flex items-center text-sm"
            style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}
          >
            <Award className="w-4 h-4 mr-2" />
            Max Score: {assignment.maxScore} points
          </div>
          <div
            className="flex items-center text-sm"
            style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Due: {formatDate(assignment.dueDate)}
          </div>
          <div
            className="flex items-center text-sm"
            style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}
          >
            <User className="w-4 h-4 mr-2" />
            Created by:{" "}
            {assignment.createdBy?.fullname ||
              assignment.createdBy?.username ||
              "Unknown"}
          </div>
        </div>

        <div
          className="flex items-center justify-between pt-4 mt-auto border-t gap-2 min-h-[32px]"
          style={{
            borderColor: darkMode
              ? "rgba(75, 85, 99, 0.3)"
              : "rgba(229, 231, 235, 0.5)",
          }}
        >
          <span
            className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded whitespace-nowrap flex-shrink-0"
            style={{
              backgroundColor: dueStatus.bg,
              color: dueStatus.color,
              minHeight: "24px",
            }}
          >
            {dueStatus.text}
          </span>
          {!assignment.allowLate ? (
            <span
              className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded whitespace-nowrap flex-shrink-0"
              style={{
                backgroundColor: darkMode
                  ? "rgba(239, 68, 68, 0.2)"
                  : "rgba(239, 68, 68, 0.1)",
                color: darkMode ? "#fca5a5" : "#dc2626",
                minHeight: "24px",
              }}
            >
              No late submissions
            </span>
          ) : (
            <span
              className="inline-flex items-center flex-shrink-0"
              style={{ minHeight: "24px", width: "0" }}
            />
          )}
        </div>
      </div>

      {canManage && (
        <div
          className="flex space-x-2 p-4 pt-0 border-t"
          style={{
            borderColor: darkMode
              ? "rgba(75, 85, 99, 0.3)"
              : "rgba(229, 231, 235, 0.5)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105 hover:shadow-md"
            style={{
              backgroundColor: darkMode ? "rgba(99, 102, 241, 0.2)" : "#eef2ff",
              color: darkMode ? "#a5b4fc" : "#4f46e5",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = darkMode
                ? "rgba(99, 102, 241, 0.3)"
                : "#e0e7ff";
              e.currentTarget.style.transform = "scale(1.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = darkMode
                ? "rgba(99, 102, 241, 0.2)"
                : "#eef2ff";
              e.currentTarget.style.transform = "scale(1)";
            }}
            onClick={() => onEdit(assignment)}
          >
            Edit
          </button>
          <button
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105 hover:shadow-md flex items-center gap-2"
            style={{
              backgroundColor: darkMode ? "rgba(239, 68, 68, 0.2)" : "#fee2e2",
              color: darkMode ? "#fca5a5" : "#dc2626",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = darkMode
                ? "rgba(239, 68, 68, 0.3)"
                : "#fecaca";
              e.currentTarget.style.transform = "scale(1.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = darkMode
                ? "rgba(239, 68, 68, 0.2)"
                : "#fee2e2";
              e.currentTarget.style.transform = "scale(1)";
            }}
            onClick={() => onDelete(assignment._id)}
          >
            <Trash size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default AssignmentCard;
