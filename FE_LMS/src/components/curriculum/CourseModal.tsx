import React, { useState, useEffect } from "react";
import { useTheme } from "../../hooks/useTheme";
import { userService } from "../../services";

interface CourseFormData {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  teacherIds: string[];
  status: 'ongoing' | 'draft' | 'completed';
  isPublished: boolean;
  capacity: number;
  enrollRequiresApproval: boolean;
  semesterId?: string;
  logo?: File | null;
}

interface CourseModalProps {
  isOpen: boolean;
  title: string;
  submitLabel: string;
  subjectName?: string;
  subjectId: string;
  formData: CourseFormData;
  onFormDataChange: (data: CourseFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  availableTeachers?: Array<{ _id: string; username: string; fullname?: string }>;
}

const CourseModal: React.FC<CourseModalProps> = ({
  isOpen,
  title,
  submitLabel,
  subjectName,
  subjectId,
  formData,
  onFormDataChange,
  onSubmit,
  onClose,
  availableTeachers = [],
}) => {
  const { darkMode } = useTheme();
  const [teachers, setTeachers] = useState<Array<{ _id: string; username: string; fullname?: string }>>(availableTeachers);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && teachers.length === 0) {
      loadTeachers();
    }
  }, [isOpen]);

  const loadTeachers = async () => {
    setLoadingTeachers(true);
    try {
      const response = await userService.getUsers({ role: "teacher", limit: 100 });
      setTeachers(response.users || []);
    } catch (err) {
      console.error("Failed to load teachers:", err);
    } finally {
      setLoadingTeachers(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFormDataChange({ ...formData, logo: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleTeacher = (teacherId: string) => {
    const newTeacherIds = formData.teacherIds.includes(teacherId)
      ? formData.teacherIds.filter(id => id !== teacherId)
      : [...formData.teacherIds, teacherId];
    onFormDataChange({ ...formData, teacherIds: newTeacherIds });
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-[9999] p-4"
      style={{
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        backdropFilter: "blur(4px)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto"
        style={{
          backgroundColor: darkMode ? "#1f2937" : "#ffffff",
          border: darkMode ? "1px solid rgba(75, 85, 99, 0.3)" : "1px solid #e5e7eb",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          className="text-2xl font-bold mb-4"
          style={{ color: darkMode ? "#ffffff" : "#1f2937" }}
        >
          {title}
        </h2>

        {subjectName && (
          <div
            className="mb-4 text-sm font-medium"
            style={{ color: darkMode ? "#9ca3af" : "#4b5563" }}
          >
            Subject: <span style={{ color: darkMode ? "#e5e7eb" : "#111827" }}>{subjectName}</span>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label
              className="block mb-2 font-semibold"
              style={{ color: darkMode ? "#ffffff" : "#1f2937" }}
            >
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => onFormDataChange({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border transition-colors duration-300"
              style={{
                backgroundColor: darkMode ? "rgba(55, 65, 81, 0.8)" : "#ffffff",
                borderColor: darkMode ? "rgba(75, 85, 99, 0.3)" : "#e5e7eb",
                color: darkMode ? "#ffffff" : "#000000",
              }}
              required
            />
          </div>

          <div>
            <label
              className="block mb-2 font-semibold"
              style={{ color: darkMode ? "#ffffff" : "#1f2937" }}
            >
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => onFormDataChange({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border transition-colors duration-300"
              style={{
                backgroundColor: darkMode ? "rgba(55, 65, 81, 0.8)" : "#ffffff",
                borderColor: darkMode ? "rgba(75, 85, 99, 0.3)" : "#e5e7eb",
                color: darkMode ? "#ffffff" : "#000000",
              }}
              rows={4}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                className="block mb-2 font-semibold"
                style={{ color: darkMode ? "#ffffff" : "#1f2937" }}
              >
                Start Date *
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => onFormDataChange({ ...formData, startDate: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border transition-colors duration-300"
                style={{
                  backgroundColor: darkMode ? "rgba(55, 65, 81, 0.8)" : "#ffffff",
                  borderColor: darkMode ? "rgba(75, 85, 99, 0.3)" : "#e5e7eb",
                  color: darkMode ? "#ffffff" : "#000000",
                }}
                required
              />
            </div>

            <div>
              <label
                className="block mb-2 font-semibold"
                style={{ color: darkMode ? "#ffffff" : "#1f2937" }}
              >
                End Date *
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => onFormDataChange({ ...formData, endDate: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border transition-colors duration-300"
                style={{
                  backgroundColor: darkMode ? "rgba(55, 65, 81, 0.8)" : "#ffffff",
                  borderColor: darkMode ? "rgba(75, 85, 99, 0.3)" : "#e5e7eb",
                  color: darkMode ? "#ffffff" : "#000000",
                }}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                className="block mb-2 font-semibold"
                style={{ color: darkMode ? "#ffffff" : "#1f2937" }}
              >
                Status *
              </label>
              <select
                value={formData.status}
                onChange={(e) => onFormDataChange({ ...formData, status: e.target.value as 'ongoing' | 'draft' | 'completed' })}
                className="w-full px-4 py-2 rounded-lg border transition-colors duration-300"
                style={{
                  backgroundColor: darkMode ? "rgba(55, 65, 81, 0.8)" : "#ffffff",
                  borderColor: darkMode ? "rgba(75, 85, 99, 0.3)" : "#e5e7eb",
                  color: darkMode ? "#ffffff" : "#000000",
                }}
                required
              >
                <option value="draft">Draft</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div>
              <label
                className="block mb-2 font-semibold"
                style={{ color: darkMode ? "#ffffff" : "#1f2937" }}
              >
                Capacity
              </label>
              <input
                type="number"
                min={1}
                max={500}
                value={formData.capacity}
                onChange={(e) => onFormDataChange({ ...formData, capacity: Number(e.target.value) })}
                className="w-full px-4 py-2 rounded-lg border transition-colors duration-300"
                style={{
                  backgroundColor: darkMode ? "rgba(55, 65, 81, 0.8)" : "#ffffff",
                  borderColor: darkMode ? "rgba(75, 85, 99, 0.3)" : "#e5e7eb",
                  color: darkMode ? "#ffffff" : "#000000",
                }}
              />
            </div>
          </div>

          <div>
            <label
              className="block mb-2 font-semibold"
              style={{ color: darkMode ? "#ffffff" : "#1f2937" }}
            >
              Teachers *
            </label>
            {loadingTeachers ? (
              <p style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>Loading teachers...</p>
            ) : (
              <div className="max-h-40 overflow-y-auto border rounded-lg p-2" style={{
                backgroundColor: darkMode ? "rgba(55, 65, 81, 0.8)" : "#ffffff",
                borderColor: darkMode ? "rgba(75, 85, 99, 0.3)" : "#e5e7eb",
              }}>
                {teachers.length === 0 ? (
                  <p style={{ color: darkMode ? "#9ca3af" : "#6b7280", fontSize: "14px" }}>No teachers available</p>
                ) : (
                  teachers.map((teacher) => (
                    <label
                      key={teacher._id}
                      className="flex items-center gap-2 p-2 hover:bg-opacity-20 cursor-pointer rounded"
                      style={{
                        backgroundColor: formData.teacherIds.includes(teacher._id)
                          ? (darkMode ? "rgba(76, 29, 149, 0.3)" : "rgba(79, 70, 229, 0.1)")
                          : "transparent",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={formData.teacherIds.includes(teacher._id)}
                        onChange={() => toggleTeacher(teacher._id)}
                        style={{ cursor: "pointer" }}
                      />
                      <span style={{ color: darkMode ? "#e5e7eb" : "#1f2937", fontSize: "14px" }}>
                        {teacher.fullname || teacher.username}
                      </span>
                    </label>
                  ))
                )}
              </div>
            )}
          </div>

          <div>
            <label
              className="block mb-2 font-semibold"
              style={{ color: darkMode ? "#ffffff" : "#1f2937" }}
            >
              Logo
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoChange}
              className="w-full px-4 py-2 rounded-lg border transition-colors duration-300"
              style={{
                backgroundColor: darkMode ? "rgba(55, 65, 81, 0.8)" : "#ffffff",
                borderColor: darkMode ? "rgba(75, 85, 99, 0.3)" : "#e5e7eb",
                color: darkMode ? "#ffffff" : "#000000",
              }}
            />
            {logoPreview && (
              <img
                src={logoPreview}
                alt="Logo preview"
                style={{
                  width: "100px",
                  height: "100px",
                  objectFit: "cover",
                  borderRadius: "8px",
                  marginTop: "8px",
                }}
              />
            )}
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isPublished}
                onChange={(e) => onFormDataChange({ ...formData, isPublished: e.target.checked })}
                style={{ cursor: "pointer", width: "16px", height: "16px" }}
              />
              <span style={{ color: darkMode ? "#ffffff" : "#1f2937", fontWeight: 500 }}>
                Published
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.enrollRequiresApproval}
                onChange={(e) => onFormDataChange({ ...formData, enrollRequiresApproval: e.target.checked })}
                style={{ cursor: "pointer", width: "16px", height: "16px" }}
              />
              <span style={{ color: darkMode ? "#ffffff" : "#1f2937", fontWeight: 500 }}>
                Requires Approval
              </span>
            </label>
          </div>

          <div className="flex space-x-4 pt-2">
            <button
              type="submit"
              className="flex-1 px-4 py-2 rounded-lg text-white transition-all duration-200"
              style={{ backgroundColor: darkMode ? (submitLabel === 'Create' ? '#059669' : '#4c1d95') : (submitLabel === 'Create' ? '#10b981' : '#4f46e5') }}
            >
              {submitLabel}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg text-white transition-all duration-200"
              style={{ backgroundColor: darkMode ? '#6b7280' : '#9ca3af' }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CourseModal;

