import React, { useEffect, useState } from "react";
import type { AssignmentFormValues } from "../../types/assignment";
import SearchableSelect from "../common/SearchableSelect";

interface AssignmentFormModalProps {
  darkMode: boolean;
  isOpen: boolean;
  mode: "create" | "edit";
  courses: { _id: string; title: string }[];
  initialValues: AssignmentFormValues;
  onClose: () => void;
  onSubmit: (values: AssignmentFormValues) => Promise<void> | void;
}

const defaultValues: AssignmentFormValues = {
  courseId: "",
  title: "",
  description: "",
  maxScore: 10,
  dueDate: "",
  allowLate: false,
  file: null,
};

const AssignmentFormModal: React.FC<AssignmentFormModalProps> = ({
  darkMode,
  isOpen,
  mode,
  courses,
  initialValues,
  onClose,
  onSubmit,
}) => {
  const [values, setValues] = useState<AssignmentFormValues>(initialValues || defaultValues);

  useEffect(() => {
    setValues(initialValues || defaultValues);
  }, [initialValues, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await onSubmit(values);
  };

  const modalTitle = mode === "create" ? "Create Assignment" : "Edit Assignment";
  const submitLabel = mode === "create" ? "Create" : "Update";

  return (
    <div
      className="fixed inset-0 z-[9999] p-4 flex items-center justify-center transition-all duration-300 bg-black/40"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl"
        style={{ backgroundColor: darkMode ? "#0b132b" : "#ffffff", border: "1px solid rgba(255,255,255,0.08)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: darkMode ? "1px solid rgba(255,255,255,0.06)" : "1px solid #eee" }}
        >
          <h3 className="text-xl font-semibold" style={{ color: darkMode ? "#ffffff" : "#111827" }}>
            {modalTitle}
          </h3>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg text-sm"
            style={{ backgroundColor: darkMode ? "#1f2937" : "#f3f4f6", color: darkMode ? "#e5e7eb" : "#111827" }}
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="md:col-span-2">
              <SearchableSelect
                value={values.courseId}
                options={courses}
                placeholder="Select a course"
                darkMode={darkMode}
                onChange={(courseId) => setValues((prev) => ({ ...prev, courseId }))}
                required
                label="Course"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2" style={{ color: darkMode ? "#cbd5e1" : "#374151" }}>
                Title *
              </label>
              <input
                type="text"
                value={values.title}
                onChange={(e) => setValues((prev) => ({ ...prev, title: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg border"
                style={{
                  backgroundColor: darkMode ? "rgba(55, 65, 81, 0.8)" : "#ffffff",
                  borderColor: darkMode ? "rgba(75, 85, 99, 0.3)" : "#e5e7eb",
                  color: darkMode ? "#ffffff" : "#000000",
                }}
                placeholder="Assignment Title"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2" style={{ color: darkMode ? "#cbd5e1" : "#374151" }}>
                Attachment (optional)
              </label>
              <input
                type="file"
                onChange={(e) =>
                  setValues((prev) => ({
                    ...prev,
                    file: e.target.files && e.target.files[0] ? e.target.files[0] : null,
                  }))
                }
                className="w-full px-4 py-2 rounded-lg border"
                style={{
                  backgroundColor: darkMode ? "rgba(55, 65, 81, 0.8)" : "#ffffff",
                  borderColor: darkMode ? "rgba(75, 85, 99, 0.3)" : "#e5e7eb",
                  color: darkMode ? "#ffffff" : "#000000",
                }}
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip,.rar,.jpg,.jpeg,.png,.mp4,.mp3,.xml"
              />
              {values.file && (
                <p className="mt-2 text-xs" style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>
                  Selected: {values.file.name} ({(values.file.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2" style={{ color: darkMode ? "#cbd5e1" : "#374151" }}>
                Description
              </label>
              <textarea
                value={values.description}
                onChange={(e) => setValues((prev) => ({ ...prev, description: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg border h-24"
                style={{
                  backgroundColor: darkMode ? "rgba(55, 65, 81, 0.8)" : "#ffffff",
                  borderColor: darkMode ? "rgba(75, 85, 99, 0.3)" : "#e5e7eb",
                  color: darkMode ? "#ffffff" : "#000000",
                }}
                placeholder="Assignment description..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: darkMode ? "#cbd5e1" : "#374151" }}>
                Max Score
              </label>
              <input
                type="number"
                min={1}
                value={values.maxScore}
                onChange={(e) => setValues((prev) => ({ ...prev, maxScore: Number(e.target.value) }))}
                className="w-full px-4 py-2 rounded-lg border"
                style={{
                  backgroundColor: darkMode ? "rgba(55, 65, 81, 0.8)" : "#ffffff",
                  borderColor: darkMode ? "rgba(75, 85, 99, 0.3)" : "#e5e7eb",
                  color: darkMode ? "#ffffff" : "#000000",
                }}
                placeholder="10"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: darkMode ? "#cbd5e1" : "#374151" }}>
                Due Date
              </label>
              <input
                type="datetime-local"
                value={values.dueDate}
                onChange={(e) => setValues((prev) => ({ ...prev, dueDate: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg border"
                style={{
                  backgroundColor: darkMode ? "rgba(55, 65, 81, 0.8)" : "#ffffff",
                  borderColor: darkMode ? "rgba(75, 85, 99, 0.3)" : "#e5e7eb",
                  color: darkMode ? "#ffffff" : "#000000",
                }}
              />
            </div>
            <div className="md:col-span-2">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={values.allowLate}
                  onChange={(e) => setValues((prev) => ({ ...prev, allowLate: e.target.checked }))}
                />
                <span style={{ color: darkMode ? "#cbd5e1" : "#374151" }}>Allow late submissions</span>
              </label>
            </div>
            
          </div>

          <div className="flex justify-end gap-3 px-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg"
              style={{ backgroundColor: darkMode ? "#1f2937" : "#e5e7eb", color: darkMode ? "#e5e7eb" : "#111827" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg text-white font-medium transition-all duration-200"
              style={{ backgroundColor: darkMode ? "#4c1d95" : "#4f46e5" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = darkMode ? "#5b21b6" : "#4338ca";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = darkMode ? "#4c1d95" : "#4f46e5";
              }}
            >
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssignmentFormModal;

