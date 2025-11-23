import React, { useRef } from "react";
import { useTheme } from "../../hooks/useTheme";
import { X } from "lucide-react";

interface SubmissionModalProps {
  isOpen: boolean;
  isResubmit: boolean;
  selectedFile: File | null;
  submitting: boolean;
  onClose: () => void;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: () => void;
  onClearFile: () => void;
}

const SubmissionModal: React.FC<SubmissionModalProps> = ({
  isOpen,
  isResubmit,
  selectedFile,
  submitting,
  onClose,
  onFileChange,
  onSubmit,
  onClearFile,
}) => {
  const { darkMode } = useTheme();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
        className="rounded-lg shadow-xl max-w-md w-full"
        style={{
          backgroundColor: darkMode ? "rgba(31, 41, 55, 0.95)" : "rgba(255, 255, 255, 0.95)",
          border: darkMode ? "1px solid rgba(75, 85, 99, 0.3)" : "1px solid rgba(229, 231, 235, 0.5)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: darkMode ? "rgba(75, 85, 99, 0.3)" : "rgba(229, 231, 235, 0.5)" }}>
          <h2 className="text-xl font-semibold" style={{ color: darkMode ? "#ffffff" : "#1f2937" }}>
            {isResubmit ? "Resubmit Assignment" : "Submit Assignment"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-opacity-20 transition-colors"
            style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {isResubmit && (
            <div
              className="mb-4 p-3 rounded-lg"
              style={{
                backgroundColor: darkMode ? "rgba(251, 191, 36, 0.1)" : "rgba(251, 191, 36, 0.1)",
                color: darkMode ? "#fbbf24" : "#d97706",
              }}
            >
              <p className="text-sm">
                You have already submitted this assignment. You can resubmit by uploading a new file.
              </p>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2" style={{ color: darkMode ? "#cbd5e1" : "#374151" }}>
              Select File <span className="text-red-500">*</span>
            </label>
            <input
              ref={fileInputRef}
              type="file"
              onChange={onFileChange}
              className="w-full px-4 py-2 rounded-lg border"
              style={{
                backgroundColor: darkMode ? "rgba(55, 65, 81, 0.8)" : "#ffffff",
                borderColor: darkMode ? "rgba(75, 85, 99, 0.3)" : "#e5e7eb",
                color: darkMode ? "#ffffff" : "#000000",
              }}
              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip,.rar,.jpg,.jpeg,.png,.mp4,.mp3,.xml"
            />
            <div className="mt-2 text-xs" style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>
              <p className="mb-1">
                <strong>Allowed file types:</strong> PDF, Word (.doc, .docx), PowerPoint (.ppt, .pptx), Excel (.xls, .xlsx), Text (.txt), 
                Archives (.zip, .rar), Images (.jpg, .jpeg, .png), Video (.mp4), Audio (.mp3), XML (.xml)
              </p>
              <p>
                <strong>Maximum file size:</strong> 5MB
              </p>
            </div>
            {selectedFile && (
              <div className="mt-2 flex items-center justify-between p-2 rounded" style={{ backgroundColor: darkMode ? "rgba(55, 65, 81, 0.5)" : "#f3f4f6" }}>
                <span className="text-sm" style={{ color: darkMode ? "#d1d5db" : "#6b7280" }}>
                  {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                </span>
                <button
                  onClick={onClearFile}
                  className="text-sm hover:underline"
                  style={{ color: darkMode ? "#fca5a5" : "#dc2626" }}
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                backgroundColor: darkMode ? "rgba(75, 85, 99, 0.3)" : "#e5e7eb",
                color: darkMode ? "#d1d5db" : "#6b7280",
              }}
            >
              Cancel
            </button>
            <button
              onClick={onSubmit}
              disabled={!selectedFile || submitting}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: darkMode ? "rgba(99, 102, 241, 0.2)" : "#4f46e5",
                color: darkMode ? "#a5b4fc" : "#ffffff",
              }}
            >
              {submitting ? "Submitting..." : isResubmit ? "Resubmit" : "Submit"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmissionModal;

