import React from "react";
import { useTheme } from "../../hooks/useTheme";
import { X } from "lucide-react";

interface GradeSubmissionModalProps {
  isOpen: boolean;
  maxScore: number;
  grading: boolean;
  grade: string;
  feedback: string;
  onClose: () => void;
  onGradeChange: (grade: string) => void;
  onFeedbackChange: (feedback: string) => void;
  onSubmit: () => void;
}

const GradeSubmissionModal: React.FC<GradeSubmissionModalProps> = ({
  isOpen,
  maxScore,
  grading,
  grade,
  feedback,
  onClose,
  onGradeChange,
  onFeedbackChange,
  onSubmit,
}) => {
  const { darkMode } = useTheme();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)", zIndex: 10000 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="w-full max-w-md rounded-lg shadow-xl"
        style={{
          backgroundColor: darkMode
            ? "rgba(31, 41, 55, 0.95)"
            : "rgba(255, 255, 255, 0.95)",
          border: darkMode
            ? "1px solid rgba(75, 85, 99, 0.3)"
            : "1px solid rgba(229, 231, 235, 0.5)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between p-6 border-b"
          style={{
            borderColor: darkMode
              ? "rgba(75, 85, 99, 0.3)"
              : "rgba(229, 231, 235, 0.5)",
          }}
        >
          <h2
            className="text-xl font-semibold"
            style={{ color: darkMode ? "#ffffff" : "#1f2937" }}
          >
            Grade Submission
          </h2>
          <button
            onClick={onClose}
            className="p-2 transition-colors rounded-lg hover:bg-opacity-20"
            style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label
              className="block mb-2 text-sm font-medium"
              style={{ color: darkMode ? "#cbd5e1" : "#374151" }}
            >
              Grade <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              max={maxScore}
              step="0.1"
              value={grade}
              onChange={(e) => onGradeChange(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
              style={{
                backgroundColor: darkMode ? "rgba(55, 65, 81, 0.8)" : "#ffffff",
                borderColor: darkMode ? "rgba(75, 85, 99, 0.3)" : "#e5e7eb",
                color: darkMode ? "#ffffff" : "#000000",
              }}
              placeholder={`0 - ${maxScore}`}
            />
            <p
              className="mt-1 text-xs"
              style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}
            >
              Maximum score: {maxScore}
            </p>
          </div>

          <div>
            <label
              className="block mb-2 text-sm font-medium"
              style={{ color: darkMode ? "#cbd5e1" : "#374151" }}
            >
              Feedback (Optional)
            </label>
            <textarea
              value={feedback}
              onChange={(e) => onFeedbackChange(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border rounded-lg resize-none"
              style={{
                backgroundColor: darkMode ? "rgba(55, 65, 81, 0.8)" : "#ffffff",
                borderColor: darkMode ? "rgba(75, 85, 99, 0.3)" : "#e5e7eb",
                color: darkMode ? "#ffffff" : "#000000",
              }}
              placeholder="Enter feedback for the student..."
            />
          </div>

          <div
            className="flex items-center justify-end gap-3 pt-4 border-t"
            style={{
              borderColor: darkMode
                ? "rgba(75, 85, 99, 0.3)"
                : "rgba(229, 231, 235, 0.5)",
            }}
          >
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium transition-colors rounded-lg"
              style={{
                backgroundColor: darkMode ? "rgba(75, 85, 99, 0.3)" : "#e5e7eb",
                color: darkMode ? "#d1d5db" : "#6b7280",
              }}
            >
              Cancel
            </button>
            <button
              onClick={onSubmit}
              disabled={grading || !grade}
              className="px-4 py-2 text-sm font-medium transition-colors rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: darkMode
                  ? "rgba(251, 191, 36, 0.2)"
                  : "#f59e0b",
                color: darkMode ? "#fde047" : "#ffffff",
              }}
            >
              {grading ? "Grading..." : "Grade"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GradeSubmissionModal;
