import React from "react";
import { useTheme } from "../../hooks/useTheme";
import { X } from "lucide-react";

interface SubmissionDetails {
  status: string;
  isLate?: boolean;
  grade?: number;
  feedback?: string;
  submittedAt?: string;
}

interface Assignment {
  maxScore: number;
  allowLate: boolean;
}

interface ViewSubmissionModalProps {
  isOpen: boolean;
  submissionDetails: SubmissionDetails;
  assignment: Assignment | null;
  onClose: () => void;
  onResubmit: () => void;
  formatDate: (date: string) => string;
}

const ViewSubmissionModal: React.FC<ViewSubmissionModalProps> = ({
  isOpen,
  submissionDetails,
  assignment,
  onClose,
  onResubmit,
  formatDate,
}) => {
  const { darkMode } = useTheme();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        style={{
          backgroundColor: darkMode ? "rgba(31, 41, 55, 0.95)" : "rgba(255, 255, 255, 0.95)",
          border: darkMode ? "1px solid rgba(75, 85, 99, 0.3)" : "1px solid rgba(229, 231, 235, 0.5)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b sticky top-0" style={{ 
          backgroundColor: darkMode ? "rgba(31, 41, 55, 0.95)" : "rgba(255, 255, 255, 0.95)",
          borderColor: darkMode ? "rgba(75, 85, 99, 0.3)" : "rgba(229, 231, 235, 0.5)" 
        }}>
          <h2 className="text-xl font-semibold" style={{ color: darkMode ? "#ffffff" : "#1f2937" }}>
            My Submission
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-opacity-20 transition-colors"
            style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Submission Status */}
          <div>
            <h3 className="text-sm font-medium mb-2" style={{ color: darkMode ? "#cbd5e1" : "#374151" }}>
              Status
            </h3>
            <span
              className="inline-block px-3 py-1 text-xs font-semibold rounded"
              style={{
                backgroundColor: 
                  submissionDetails.status === "graded" 
                    ? (darkMode ? "rgba(34, 197, 94, 0.2)" : "rgba(34, 197, 94, 0.1)")
                    : submissionDetails.status === "submitted" || submissionDetails.status === "resubmitted"
                    ? (darkMode ? "rgba(59, 130, 246, 0.2)" : "rgba(59, 130, 246, 0.1)")
                    : (darkMode ? "rgba(239, 68, 68, 0.2)" : "rgba(239, 68, 68, 0.1)"),
                color: 
                  submissionDetails.status === "graded"
                    ? (darkMode ? "#86efac" : "#16a34a")
                    : submissionDetails.status === "submitted" || submissionDetails.status === "resubmitted"
                    ? (darkMode ? "#93c5fd" : "#2563eb")
                    : (darkMode ? "#fca5a5" : "#dc2626"),
              }}
            >
              {submissionDetails.status?.toUpperCase().replace("_", " ") || "Unknown"}
              {submissionDetails.isLate && " (Late)"}
            </span>
          </div>

          {/* Submitted Date */}
          {submissionDetails.submittedAt && (
            <div>
              <h3 className="text-sm font-medium mb-1" style={{ color: darkMode ? "#cbd5e1" : "#374151" }}>
                Submitted At
              </h3>
              <p className="text-sm" style={{ color: darkMode ? "#d1d5db" : "#6b7280" }}>
                {formatDate(submissionDetails.submittedAt)}
              </p>
            </div>
          )}

          {/* Grade */}
          {submissionDetails.grade !== undefined && submissionDetails.grade !== null && (
            <div>
              <h3 className="text-sm font-medium mb-1" style={{ color: darkMode ? "#cbd5e1" : "#374151" }}>
                Grade
              </h3>
              <p className="text-lg font-semibold" style={{ color: darkMode ? "#ffffff" : "#1f2937" }}>
                {submissionDetails.grade} / {assignment?.maxScore || 10}
              </p>
            </div>
          )}

          {/* Feedback */}
          {submissionDetails.feedback && (
            <div>
              <h3 className="text-sm font-medium mb-2" style={{ color: darkMode ? "#cbd5e1" : "#374151" }}>
                Feedback
              </h3>
              <div
                className="p-3 rounded-lg"
                style={{
                  backgroundColor: darkMode ? "rgba(55, 65, 81, 0.5)" : "#f3f4f6",
                  color: darkMode ? "#d1d5db" : "#6b7280",
                }}
              >
                <p className="text-sm whitespace-pre-wrap">{submissionDetails.feedback}</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t" style={{ borderColor: darkMode ? "rgba(75, 85, 99, 0.3)" : "rgba(229, 231, 235, 0.5)" }}>
            {assignment?.allowLate && (
              <button
                onClick={onResubmit}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{
                  backgroundColor: darkMode ? "rgba(99, 102, 241, 0.2)" : "#4f46e5",
                  color: darkMode ? "#a5b4fc" : "#ffffff",
                }}
              >
                Resubmit
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                backgroundColor: darkMode ? "rgba(75, 85, 99, 0.3)" : "#e5e7eb",
                color: darkMode ? "#d1d5db" : "#6b7280",
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewSubmissionModal;

