import React from "react";
import { useTheme } from "../../hooks/useTheme";

interface MajorFormData {
  name: string;
  description: string;
}

interface MajorModalProps {
  isOpen: boolean;
  title: string;
  submitLabel: string;
  formData: MajorFormData;
  onFormDataChange: (data: MajorFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

const MajorModal: React.FC<MajorModalProps> = ({
  isOpen,
  title,
  submitLabel,
  formData,
  onFormDataChange,
  onSubmit,
  onClose,
}) => {
  const { darkMode } = useTheme();

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
        className="bg-white rounded-lg p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto"
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
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label
              className="block mb-2 font-semibold"
              style={{ color: darkMode ? "#ffffff" : "#1f2937" }}
            >
              Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => onFormDataChange({ ...formData, name: e.target.value })}
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

          <div className="flex space-x-4 pt-2">
            <button
              type="submit"
              className="flex-1 px-4 py-2 rounded-lg text-white transition-all duration-200"
              style={{ backgroundColor: darkMode ? "#4c1d95" : "#4f46e5" }}
            >
              {submitLabel}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg text-white transition-all duration-200"
              style={{ backgroundColor: darkMode ? "#6b7280" : "#9ca3af" }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MajorModal;

