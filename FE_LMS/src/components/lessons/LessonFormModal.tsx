import React, { useEffect, useState } from "react";
import type { LessonFormValues } from "../../types/lesson";
import SearchableSelect from "../common/SearchableSelect";

interface LessonFormModalProps {
  darkMode: boolean;
  isOpen: boolean;
  mode: "create" | "edit";
  courses: { _id: string; title: string }[];
  initialValues: LessonFormValues;
  onClose: () => void;
  onSubmit: (values: LessonFormValues) => Promise<void> | void;
}

const defaultValues: LessonFormValues = {
  courseId: "",
  title: "",
  content: "",
  order: 0,
  durationMinutes: 0,
  publishedAt: "",
};

const LessonFormModal: React.FC<LessonFormModalProps> = ({
  darkMode,
  isOpen,
  mode,
  courses,
  initialValues,
  onClose,
  onSubmit,
}) => {
  const [values, setValues] = useState<LessonFormValues>(initialValues || defaultValues);

  useEffect(() => {
    setValues(initialValues || defaultValues);
  }, [initialValues]);

  if (!isOpen) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await onSubmit(values);
  };

  const modalTitle = mode === "create" ? "Create Lesson" : "Edit Lesson";
  const submitLabel = mode === "create" ? "Create" : "Update";

  const numberInputHandler =
    (field: "durationMinutes") =>
    (value: string): void => {
      if (value.trim() === "") {
        setValues((prev) => ({ ...prev, [field]: 0 }));
        return;
      }
      if (/^\d+$/.test(value)) {
        const parsed = Number(value);
        if (!Number.isNaN(parsed) && parsed >= 0) {
          setValues((prev) => ({ ...prev, [field]: parsed }));
        }
      }
    };

  const displayValue = (val: number) => (val === 0 ? "" : String(val));

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
        className="w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: darkMode ? "#0b132b" : "#ffffff", border: "1px solid rgba(255,255,255,0.08)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between px-6 py-4 sticky top-0"
          style={{
            borderBottom: darkMode ? "1px solid rgba(255,255,255,0.06)" : "1px solid #eee",
            backgroundColor: darkMode ? "#0b132b" : "#ffffff",
          }}
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
                placeholder="Lesson Title"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2" style={{ color: darkMode ? "#cbd5e1" : "#374151" }}>
                Content
              </label>
              <textarea
                value={values.content}
                onChange={(e) => setValues((prev) => ({ ...prev, content: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg border h-32"
                style={{
                  backgroundColor: darkMode ? "rgba(55, 65, 81, 0.8)" : "#ffffff",
                  borderColor: darkMode ? "rgba(75, 85, 99, 0.3)" : "#e5e7eb",
                  color: darkMode ? "#ffffff" : "#000000",
                }}
                placeholder="Lesson content..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: darkMode ? "#cbd5e1" : "#374151" }}>
                Duration (minutes)
              </label>
              <input
                type="text"
                value={displayValue(values.durationMinutes)}
                onChange={(e) => numberInputHandler("durationMinutes")(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border"
                style={{
                  backgroundColor: darkMode ? "rgba(55, 65, 81, 0.8)" : "#ffffff",
                  borderColor: darkMode ? "rgba(75, 85, 99, 0.3)" : "#e5e7eb",
                  color: darkMode ? "#ffffff" : "#000000",
                }}
                placeholder="Enter duration in minutes"
              />
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

export default LessonFormModal;

