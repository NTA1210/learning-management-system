import React from "react";
import { useTheme } from "../../hooks/useTheme";
import { FileText, Download, Star, Eye } from "lucide-react";

interface Student {
  fullname?: string;
  email: string;
}

interface Submission {
  _id: string;
  studentId: Student;
  originalName?: string;
  size?: number;
  submittedAt?: string;
  isLate?: boolean;
  status?: string;
  grade?: number;
  feedback?: string;
  key?: string;
}

interface Assignment {
  maxScore: number;
}

interface SubmissionCardProps {
  submission: Submission;
  assignment: Assignment | null;
  onDownload: (submissionId: string) => void;
  onGrade: (submission: Submission) => void;
  onView: (submission: Submission) => void;
  formatDate: (date: string) => string;
}

const SubmissionCard: React.FC<SubmissionCardProps> = ({
  submission,
  assignment,
  onDownload,
  onGrade,
  onView,
  formatDate,
}) => {
  const { darkMode } = useTheme();
  const student = submission.studentId || {};

  return (
    <div
      className="p-4 rounded-lg border"
      style={{
        backgroundColor: darkMode ? "rgba(55, 65, 81, 0.5)" : "#f9fafb",
        borderColor: darkMode ? "rgba(75, 85, 99, 0.3)" : "#e5e7eb",
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3
            className="font-semibold mb-1"
            style={{ color: darkMode ? "#ffffff" : "#1f2937" }}
          >
            {student.fullname || student.email || "Unknown Student"}
          </h3>
          <p
            className="text-sm mb-2"
            style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}
          >
            {student.email}
          </p>
          {submission.originalName && (
            <div className="flex items-center gap-2 mb-2">
              <FileText
                size={16}
                style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}
              />
              <span
                className="text-sm"
                style={{ color: darkMode ? "#d1d5db" : "#6b7280" }}
              >
                {submission.originalName}
                {submission.size &&
                  ` (${(submission.size / 1024).toFixed(2)} KB)`}
              </span>
            </div>
          )}
          <div
            className="flex items-center gap-4 text-xs"
            style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}
          >
            {submission.submittedAt && (
              <span>Submitted: {formatDate(submission.submittedAt)}</span>
            )}
            {submission.isLate && <span className="text-red-500">Late</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="px-2 py-1 text-xs font-semibold rounded"
            style={{
              backgroundColor:
                submission.status === "graded"
                  ? darkMode
                    ? "rgba(34, 197, 94, 0.2)"
                    : "rgba(34, 197, 94, 0.1)"
                  : darkMode
                  ? "rgba(59, 130, 246, 0.2)"
                  : "rgba(59, 130, 246, 0.1)",
              color:
                submission.status === "graded"
                  ? darkMode
                    ? "#86efac"
                    : "#16a34a"
                  : darkMode
                  ? "#93c5fd"
                  : "#2563eb",
            }}
          >
            {submission.status?.toUpperCase().replace("_", " ") || "UNKNOWN"}
          </span>
        </div>
      </div>

      {submission.grade !== undefined && submission.grade !== null && (
        <div className="mb-2">
          <span
            className="text-sm font-medium"
            style={{ color: darkMode ? "#cbd5e1" : "#374151" }}
          >
            Grade:
          </span>
          <span
            className="text-sm font-semibold ml-2"
            style={{ color: darkMode ? "#ffffff" : "#1f2937" }}
          >
            {submission.grade} / {assignment?.maxScore || 10}
          </span>
        </div>
      )}

      {submission.feedback && (
        <div
          className="mb-3 p-2 rounded"
          style={{
            backgroundColor: darkMode ? "rgba(31, 41, 55, 0.5)" : "#f3f4f6",
          }}
        >
          <p
            className="text-sm"
            style={{ color: darkMode ? "#d1d5db" : "#6b7280" }}
          >
            <strong>Feedback:</strong> {submission.feedback}
          </p>
        </div>
      )}

      <div
        className="flex items-center justify-end gap-2 pt-2 border-t"
        style={{
          borderColor: darkMode
            ? "rgba(75, 85, 99, 0.3)"
            : "rgba(229, 231, 235, 0.5)",
        }}
      >
        {submission.key && (
          <>
            <button
              onClick={() => onDownload(submission._id)}
              className="flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-colors hover:opacity-80"
              style={{
                backgroundColor: darkMode
                  ? "rgba(59, 130, 246, 0.2)"
                  : "#3b82f6",
                color: darkMode ? "#93c5fd" : "#ffffff",
              }}
            >
              <Download size={14} />
              Download
            </button>
            <button
              onClick={() => onView(submission)}
              className="flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-colors hover:opacity-80"
              style={{
                backgroundColor: darkMode
                  ? "rgba(16, 185, 129, 0.2)"
                  : "#10b981",
                color: darkMode ? "#6ee7b7" : "#ffffff",
              }}
            >
              <Eye size={14} />
              View
            </button>
          </>
        )}
        <button
          onClick={() => onGrade(submission)}
          className="flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-colors hover:opacity-80"
          style={{
            backgroundColor: darkMode ? "rgba(251, 191, 36, 0.2)" : "#f59e0b",
            color: darkMode ? "#fde047" : "#ffffff",
          }}
        >
          <Star size={14} />
          {submission.grade !== undefined && submission.grade !== null
            ? "Grade"
            : "Re-Grade"}
        </button>
      </div>
    </div>
  );
};

export default SubmissionCard;
