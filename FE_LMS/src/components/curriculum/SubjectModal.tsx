import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useTheme } from "../../hooks/useTheme";
import { Search } from "lucide-react";

interface SubjectFormData {
  name: string;
  code: string;
  credits: number | "";
  description: string;
  isActive: boolean;
  specialistId?: string;
}

interface Specialist {
  _id: string;
  name: string;
}

interface SubjectModalProps {
  isOpen: boolean;
  title: string;
  submitLabel: string;
  specialistName?: string;
  specialistId?: string;
  specialists?: Specialist[];
  formData: SubjectFormData;
  onFormDataChange: (data: SubjectFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

const SubjectModal: React.FC<SubjectModalProps> = ({
  isOpen,
  title,
  submitLabel,
  specialistName,
  specialistId,
  specialists = [],
  formData,
  onFormDataChange,
  onSubmit,
  onClose,
}) => {
  const { darkMode } = useTheme();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Auto-fill specialist if provided
  useEffect(() => {
    if (specialistId && !formData.specialistId) {
      onFormDataChange({ ...formData, specialistId });
    }
  }, [specialistId]);

  if (!isOpen) return null;

  const filteredSpecialists = specialists.filter((specialist) =>
    specialist.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedSpecialist = specialists.find(
    (s) => s._id === formData.specialistId
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validate specialist selection
    if (!formData.specialistId) {
      toast.error("Please select a specialist");
      return;
    }
    onSubmit(e);
  };

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
        className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        style={{
          backgroundColor: darkMode ? "#1f2937" : "#ffffff",
          border: darkMode
            ? "1px solid rgba(75, 85, 99, 0.3)"
            : "1px solid #e5e7eb",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          className="text-2xl font-bold mb-4"
          style={{ color: darkMode ? "#ffffff" : "#1f2937" }}
        >
          {title}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                onChange={(e) =>
                  onFormDataChange({ ...formData, name: e.target.value })
                }
                className="w-full px-4 py-2 rounded-lg border transition-colors duration-300"
                style={{
                  backgroundColor: darkMode
                    ? "rgba(55, 65, 81, 0.8)"
                    : "#ffffff",
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
                Code *
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) =>
                  onFormDataChange({ ...formData, code: e.target.value })
                }
                className="w-full px-4 py-2 rounded-lg border transition-colors duration-300"
                style={{
                  backgroundColor: darkMode
                    ? "rgba(55, 65, 81, 0.8)"
                    : "#ffffff",
                  borderColor: darkMode ? "rgba(75, 85, 99, 0.3)" : "#e5e7eb",
                  color: darkMode ? "#ffffff" : "#000000",
                }}
                required
              />
            </div>
          </div>
          {/* Specialist Selection */}
          <div>
            <label
              className="block mb-2 font-semibold"
              style={{ color: darkMode ? "#ffffff" : "#1f2937" }}
            >
              Specialist *
            </label>
            <div className="relative">
              <div
                className="w-full px-4 py-2 rounded-lg border cursor-pointer transition-colors duration-300 flex items-center justify-between"
                style={{
                  backgroundColor: darkMode
                    ? "rgba(55, 65, 81, 0.8)"
                    : "#ffffff",
                  borderColor: darkMode ? "rgba(75, 85, 99, 0.3)" : "#e5e7eb",
                  color: darkMode ? "#ffffff" : "#000000",
                }}
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <span>
                  {selectedSpecialist
                    ? selectedSpecialist.name
                    : "Select a specialist..."}
                </span>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>

              {isDropdownOpen && (
                <div
                  className="absolute z-10 w-full mt-1 rounded-lg border shadow-lg"
                  style={{
                    backgroundColor: darkMode ? "#1f2937" : "#ffffff",
                    borderColor: darkMode ? "rgba(75, 85, 99, 0.3)" : "#e5e7eb",
                    maxHeight: "300px",
                    overflow: "hidden",
                  }}
                >
                  {/* Search Bar */}
                  <div
                    className="p-2 border-b"
                    style={{
                      borderColor: darkMode
                        ? "rgba(75, 85, 99, 0.3)"
                        : "#e5e7eb",
                    }}
                  >
                    <div className="relative">
                      <Search
                        size={16}
                        style={{
                          position: "absolute",
                          left: "8px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          color: darkMode ? "#9ca3af" : "#6b7280",
                        }}
                      />
                      <input
                        type="text"
                        placeholder="Search specialists..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 rounded border text-sm"
                        style={{
                          backgroundColor: darkMode
                            ? "rgba(55, 65, 81, 0.8)"
                            : "#ffffff",
                          borderColor: darkMode
                            ? "rgba(75, 85, 99, 0.3)"
                            : "#e5e7eb",
                          color: darkMode ? "#ffffff" : "#000000",
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>

                  {/* Dropdown List */}
                  <div style={{ maxHeight: "240px", overflowY: "auto" }}>
                    {filteredSpecialists.length === 0 ? (
                      <div
                        className="px-4 py-3 text-sm text-center"
                        style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}
                      >
                        No specialists found
                      </div>
                    ) : (
                      filteredSpecialists.map((specialist) => (
                        <div
                          key={specialist._id}
                          className="px-4 py-2 cursor-pointer transition-colors text-sm"
                          style={{
                            backgroundColor:
                              formData.specialistId === specialist._id
                                ? darkMode
                                  ? "rgba(16, 185, 129, 0.2)"
                                  : "rgba(16, 185, 129, 0.1)"
                                : "transparent",
                            color: darkMode ? "#ffffff" : "#000000",
                          }}
                          onMouseEnter={(e) => {
                            if (formData.specialistId !== specialist._id) {
                              e.currentTarget.style.backgroundColor = darkMode
                                ? "rgba(55, 65, 81, 0.8)"
                                : "#f3f4f6";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (formData.specialistId !== specialist._id) {
                              e.currentTarget.style.backgroundColor =
                                "transparent";
                            }
                          }}
                          onClick={() => {
                            onFormDataChange({
                              ...formData,
                              specialistId: specialist._id,
                            });
                            setIsDropdownOpen(false);
                            setSearchTerm("");
                          }}
                        >
                          {specialist.name}
                          {formData.specialistId === specialist._id && (
                            <span className="ml-2" style={{ color: "#10b981" }}>
                              ✓
                            </span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div>
            <label
              className="block mb-2 font-semibold"
              style={{ color: darkMode ? "#ffffff" : "#1f2937" }}
            >
              Credits
            </label>
            <input
              type="number"
              min={0}
              value={formData.credits}
              onChange={(e) =>
                onFormDataChange({
                  ...formData,
                  credits: e.target.value === "" ? "" : Number(e.target.value),
                })
              }
              className="w-full px-4 py-2 rounded-lg border transition-colors duration-300"
              style={{
                backgroundColor: darkMode ? "rgba(55, 65, 81, 0.8)" : "#ffffff",
                borderColor: darkMode ? "rgba(75, 85, 99, 0.3)" : "#e5e7eb",
                color: darkMode ? "#ffffff" : "#000000",
              }}
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
              onChange={(e) =>
                onFormDataChange({ ...formData, description: e.target.value })
              }
              className="w-full px-4 py-2 rounded-lg border transition-colors duration-300"
              style={{
                backgroundColor: darkMode ? "rgba(55, 65, 81, 0.8)" : "#ffffff",
                borderColor: darkMode ? "rgba(75, 85, 99, 0.3)" : "#e5e7eb",
                color: darkMode ? "#ffffff" : "#000000",
              }}
              rows={4}
            />
          </div>

          <div className="flex items-center gap-3">
            <label
              className="font-semibold"
              style={{ color: darkMode ? "#ffffff" : "#1f2937" }}
            >
              Active
            </label>
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) =>
                onFormDataChange({ ...formData, isActive: e.target.checked })
              }
              className="w-4 h-4"
            />
          </div>

          <div className="flex space-x-4 pt-2">
            <button
              type="submit"
              className="flex-1 px-4 py-2 rounded-lg text-white transition-all duration-200"
              style={{ backgroundColor: darkMode ? "#059669" : "#10b981" }}
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

export default SubjectModal;
