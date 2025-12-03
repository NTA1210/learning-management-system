import React from "react";
import { useTheme } from "../../hooks/useTheme";
import { X, Users } from "lucide-react";
import SubmissionCard from "./SubmissionCard";

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

interface AllSubmissionsModalProps {
  isOpen: boolean;
  submissions: Submission[];
  assignment: Assignment | null;
  loading: boolean;
  onClose: () => void;
  onDownload: (submissionId: string) => void;
  onGrade: (submission: Submission) => void;
  onView: (submission: Submission) => void;
  formatDate: (date: string) => string;
}

const AllSubmissionsModal: React.FC<AllSubmissionsModalProps> = ({
  isOpen,
  submissions,
  assignment,
  loading,
  onClose,
  onDownload,
  onGrade,
  onView,
  formatDate,
}) => {
  const { darkMode } = useTheme();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        zIndex: 9999,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
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
          className="flex items-center justify-between p-6 border-b sticky top-0"
          style={{
            backgroundColor: darkMode
              ? "rgba(31, 41, 55, 0.95)"
              : "rgba(255, 255, 255, 0.95)",
            borderColor: darkMode
              ? "rgba(75, 85, 99, 0.3)"
              : "rgba(229, 231, 235, 0.5)",
          }}
        >
          <div className="flex items-center gap-3">
            <Users
              size={24}
              style={{ color: darkMode ? "#ffffff" : "#1f2937" }}
            />
            <h2
              className="text-xl font-semibold"
              style={{ color: darkMode ? "#ffffff" : "#1f2937" }}
            >
              All Submissions ({submissions.length})
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-opacity-20 transition-colors"
            style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div
                className="animate-spin rounded-full h-8 w-8 border-b-2"
                style={{ borderColor: darkMode ? "#6366f1" : "#4f46e5" }}
              ></div>
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-8">
              <p style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>
                No submissions found for this assignment.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {submissions.map((submission) => (
                <SubmissionCard
                  key={submission._id}
                  submission={submission}
                  assignment={assignment}
                  onDownload={onDownload}
                  onGrade={onGrade}
                  onView={onView}
                  formatDate={formatDate}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AllSubmissionsModal;
