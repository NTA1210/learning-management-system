import React, { useEffect, useRef, useState } from "react";
import type { MaterialFormValues } from "../../types/lessonMaterial";

interface MaterialFormModalProps {
  darkMode: boolean;
  isOpen: boolean;
  mode: "create" | "edit";
  initialValues: MaterialFormValues;
  onClose: () => void;
  onSubmit: (values: MaterialFormValues, file?: File | null) => Promise<void> | void;
}

const defaultValues: MaterialFormValues = {
  title: "",
  note: "",
  originalName: "",
  mimeType: "",
  size: 0,
};

const MaterialFormModal: React.FC<MaterialFormModalProps> = ({
  darkMode,
  isOpen,
  mode,
  initialValues,
  onClose,
  onSubmit,
}) => {
  const [values, setValues] = useState<MaterialFormValues>(initialValues || defaultValues);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setValues(initialValues || defaultValues);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [initialValues, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await onSubmit(values, selectedFile);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setValues((prev) => ({
        ...prev,
        originalName: file.name,
        mimeType: file.type || "",
        size: file.size,
        title: prev.title || file.name.replace(/\.[^/.]+$/, ""),
      }));
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setValues((prev) => ({
      ...prev,
      originalName: mode === "edit" ? initialValues?.originalName || "" : "",
      mimeType: mode === "edit" ? initialValues?.mimeType || "" : "",
      size: mode === "edit" ? initialValues?.size || 0 : 0,
    }));
  };

  const modalTitle = mode === "create" ? "Create Material" : "Edit Material";
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

        <form onSubmit={handleSubmit} className="px-6 py-6" encType="multipart/form-data">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {mode === "create" && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2" style={{ color: darkMode ? "#cbd5e1" : "#374151" }}>
                  File (Optional)
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  className="w-full px-4 py-2 rounded-lg border"
                  style={{
                    backgroundColor: darkMode ? "rgba(55, 65, 81, 0.8)" : "#ffffff",
                    borderColor: darkMode ? "rgba(75, 85, 99, 0.3)" : "#e5e7eb",
                    color: darkMode ? "#ffffff" : "#000000",
                  }}
                  accept="*/*"
                />
                {selectedFile && (
                  <div
                    className="flex items-center justify-between mt-2 p-3 rounded-lg"
                    style={{ backgroundColor: darkMode ? "rgba(99, 102, 241, 0.1)" : "rgba(99, 102, 241, 0.05)" }}
                  >
                    <p className="text-sm flex-1" style={{ color: darkMode ? "#a5b4fc" : "#6366f1" }}>
                      <span className="font-medium">{selectedFile.name}</span>{" "}
                      ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                    <button
                      type="button"
                      onClick={clearFile}
                      className="ml-2 px-2 py-1 rounded text-sm"
                      style={{
                        backgroundColor: darkMode ? "rgba(239, 68, 68, 0.2)" : "#fee2e2",
                        color: darkMode ? "#fca5a5" : "#dc2626",
                      }}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            )}
            {mode === "edit" && (
              <div className="md:col-span-2 space-y-4">
                <div
                  className="rounded-lg px-4 py-3 border"
                  style={{
                    backgroundColor: darkMode ? "rgba(55, 65, 81, 0.4)" : "#f9fafb",
                    borderColor: darkMode ? "rgba(75, 85, 99, 0.5)" : "#e5e7eb",
                  }}
                >
                  <p className="text-sm font-medium mb-1" style={{ color: darkMode ? "#cbd5e1" : "#374151" }}>
                    Current File
                  </p>
                  <p className="text-sm" style={{ color: darkMode ? "#e5e7eb" : "#111827" }}>
                    {initialValues?.originalName || "No file"}
                  </p>
                  <p className="text-xs mt-1" style={{ color: darkMode ? "#94a3b8" : "#6b7280" }}>
                    {initialValues?.mimeType || "Unknown type"} • {(initialValues?.size || 0).toLocaleString()} bytes
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: darkMode ? "#cbd5e1" : "#374151" }}>
                    Replace File (Optional)
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileChange}
                    className="w-full px-4 py-2 rounded-lg border"
                    style={{
                      backgroundColor: darkMode ? "rgba(55, 65, 81, 0.8)" : "#ffffff",
                      borderColor: darkMode ? "rgba(75, 85, 99, 0.3)" : "#e5e7eb",
                      color: darkMode ? "#ffffff" : "#000000",
                    }}
                    accept="*/*"
                  />
                  {selectedFile && (
                    <div
                      className="flex items-center justify-between mt-2 p-3 rounded-lg"
                      style={{ backgroundColor: darkMode ? "rgba(99, 102, 241, 0.1)" : "rgba(99, 102, 241, 0.05)" }}
                    >
                      <p className="text-sm flex-1" style={{ color: darkMode ? "#a5b4fc" : "#6366f1" }}>
                        <span className="font-medium">{selectedFile.name}</span> ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                      <button
                        type="button"
                        onClick={clearFile}
                        className="ml-2 px-2 py-1 rounded text-sm"
                        style={{
                          backgroundColor: darkMode ? "rgba(239, 68, 68, 0.2)" : "#fee2e2",
                          color: darkMode ? "#fca5a5" : "#dc2626",
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
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
                placeholder="Material Title"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2" style={{ color: darkMode ? "#cbd5e1" : "#374151" }}>
                Note
              </label>
              <textarea
                value={values.note}
                onChange={(e) => setValues((prev) => ({ ...prev, note: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg border h-24"
                style={{
                  backgroundColor: darkMode ? "rgba(55, 65, 81, 0.8)" : "#ffffff",
                  borderColor: darkMode ? "rgba(75, 85, 99, 0.3)" : "#e5e7eb",
                  color: darkMode ? "#ffffff" : "#000000",
                }}
                placeholder="Optional note about this material..."
              />
            </div>
            {mode === "create" && !selectedFile && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: darkMode ? "#cbd5e1" : "#374151" }}>
                    Original Name
                  </label>
                  <input
                    type="text"
                    value={values.originalName}
                    onChange={(e) => setValues((prev) => ({ ...prev, originalName: e.target.value }))}
                    className="w-full px-4 py-2 rounded-lg border"
                    style={{
                      backgroundColor: darkMode ? "rgba(55, 65, 81, 0.8)" : "#ffffff",
                      borderColor: darkMode ? "rgba(75, 85, 99, 0.3)" : "#e5e7eb",
                      color: darkMode ? "#ffffff" : "#000000",
                    }}
                    placeholder="filename.pdf"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: darkMode ? "#cbd5e1" : "#374151" }}>
                    MIME Type
                  </label>
                  <input
                    type="text"
                    value={values.mimeType}
                    onChange={(e) => setValues((prev) => ({ ...prev, mimeType: e.target.value }))}
                    className="w-full px-4 py-2 rounded-lg border"
                    style={{
                      backgroundColor: darkMode ? "rgba(55, 65, 81, 0.8)" : "#ffffff",
                      borderColor: darkMode ? "rgba(75, 85, 99, 0.3)" : "#e5e7eb",
                      color: darkMode ? "#ffffff" : "#000000",
                    }}
                    placeholder="application/pdf"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: darkMode ? "#cbd5e1" : "#374151" }}>
                    Size (bytes)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={values.size}
                    onChange={(e) => setValues((prev) => ({ ...prev, size: Number(e.target.value) }))}
                    className="w-full px-4 py-2 rounded-lg border"
                    style={{
                      backgroundColor: darkMode ? "rgba(55, 65, 81, 0.8)" : "#ffffff",
                      borderColor: darkMode ? "rgba(75, 85, 99, 0.3)" : "#e5e7eb",
                      color: darkMode ? "#ffffff" : "#000000",
                    }}
                    placeholder="0"
                  />
                </div>
              </>
            )}
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

export default MaterialFormModal;

