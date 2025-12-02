import type { ChangeEvent, RefObject } from "react";
import type { QuizQuestion } from "../../services";
import type { EditFormState } from "../../types/quiz";

interface EditQuestionModalProps {
  question: QuizQuestion | null;
  editForm: EditFormState | null;
  darkMode: boolean;
  textColor: string;
  borderColor: string;
  savingEdit: boolean;
  newImageInputRef: RefObject<HTMLInputElement | null>;
  onClose: () => void;
  onInputChange: (field: keyof EditFormState, value: string | number) => void;
  onOptionChange: (index: number, value: string) => void;
  onToggleCorrect: (index: number) => void;
  onAddOption: () => void;
  onRemoveOption: (index: number) => void;
  onToggleExistingImage: (url: string) => void;
  onSelectNewImages: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemoveNewImage: (index: number) => void;
  onSubmit: () => void;
}

export function EditQuestionModal({
  question,
  editForm,
  darkMode,
  textColor,
  borderColor,
  savingEdit,
  newImageInputRef,
  onClose,
  onInputChange,
  onOptionChange,
  onToggleCorrect,
  onAddOption,
  onRemoveOption,
  onToggleExistingImage,
  onSelectNewImages,
  onRemoveNewImage,
  onSubmit,
}: EditQuestionModalProps) {
  if (!question || !editForm) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} aria-hidden="true"></div>
      <div
        className="relative w-full max-w-3xl rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: darkMode ? "#0f172a" : "#ffffff" }}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold" style={{ color: textColor }}>
              Edit question
            </h2>
            <button
              onClick={onClose}
              className="text-sm font-semibold"
              style={{ color: darkMode ? "#94a3b8" : "#475569" }}
              disabled={savingEdit}
            >
              Close
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: textColor }}>
                Question
              </label>
              <textarea
                value={editForm.text}
                onChange={(e) => onInputChange("text", e.target.value)}
                className="w-full rounded-lg border px-3 py-2"
                rows={3}
                style={{
                  backgroundColor: darkMode ? "rgba(15,23,42,0.6)" : "#ffffff",
                  borderColor: borderColor,
                  color: textColor,
                }}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: textColor }}>
                  Points
                </label>
                <input
                  type="number"
                  step="any"
                  value={editForm.points}
                  onChange={(e) => onInputChange("points", e.target.value)}
                  className="w-full rounded-lg border px-3 py-2"
                  style={{
                    backgroundColor: darkMode ? "rgba(15,23,42,0.6)" : "#ffffff",
                    borderColor: borderColor,
                    color: textColor,
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: textColor }}>
                  Explanation (optional)
                </label>
                <input
                  type="text"
                  value={editForm.explanation}
                  onChange={(e) => onInputChange("explanation", e.target.value)}
                  className="w-full rounded-lg border px-3 py-2"
                  style={{
                    backgroundColor: darkMode ? "rgba(15,23,42,0.6)" : "#ffffff",
                    borderColor: borderColor,
                    color: textColor,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium" style={{ color: textColor }}>
                  Images
                </label>
                <button
                  type="button"
                  onClick={() => newImageInputRef.current?.click()}
                  className="px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
                  style={{
                    backgroundColor: darkMode ? "rgba(59,130,246,0.2)" : "#dbeafe",
                    color: darkMode ? "#bfdbfe" : "#1d4ed8",
                  }}
                >
                  Upload images
                </button>
              </div>
              <p className="text-xs mb-3" style={{ color: darkMode ? "#94a3b8" : "#64748b" }}>
                Supported formats: JPG, PNG, GIF. You can add images even if the question does not have any yet.
              </p>
              <input ref={newImageInputRef} type="file" accept="image/*" multiple onChange={onSelectNewImages} className="hidden" />

              {editForm.existingImages.length === 0 ? (
                <p className="text-sm mb-4" style={{ color: darkMode ? "#cbd5f5" : "#475569" }}>
                  No images yet. Use the button above to upload new images.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  {editForm.existingImages.map((img) => {
                    const isRemoved = editForm.deletedImageUrls.includes(img.url);
                    return (
                      <div
                        key={img.url}
                        className="relative rounded-lg overflow-hidden border"
                        style={{
                          borderColor: isRemoved ? "#f87171" : borderColor,
                          backgroundColor: darkMode ? "rgba(15,23,42,0.6)" : "#f8fafc",
                        }}
                      >
                        <img src={img.url} alt="Question" className="w-full h-40 object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => onToggleExistingImage(img.url)}
                            className="px-4 py-2 rounded-full text-sm font-semibold"
                            style={{
                              backgroundColor: isRemoved ? "#22c55e" : "#ef4444",
                              color: "#ffffff",
                            }}
                          >
                            {isRemoved ? "Restore" : "Remove"}
                          </button>
                        </div>
                        {isRemoved && (
                          <div className="absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-semibold bg-red-500 text-white">
                            Will delete
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {editForm.newImagePreviews.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2" style={{ color: textColor }}>
                    Images to upload
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {editForm.newImagePreviews.map((preview, idx) => (
                      <div
                        key={`${preview}-${idx}`}
                        className="relative rounded-lg overflow-hidden border"
                        style={{
                          borderColor: borderColor,
                          backgroundColor: darkMode ? "rgba(15,23,42,0.6)" : "#f8fafc",
                        }}
                      >
                        <img src={preview} alt={`New image ${idx + 1}`} className="w-full h-40 object-cover" />
                        <button
                          onClick={() => onRemoveNewImage(idx)}
                          className="absolute top-2 right-2 px-3 py-1 rounded-full text-xs font-semibold"
                          style={{
                            backgroundColor: darkMode ? "rgba(239,68,68,0.9)" : "#ef4444",
                            color: "#ffffff",
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium" style={{ color: textColor }}>
                  Options & correct
                </label>
                <button
                  onClick={onAddOption}
                  className="text-sm font-semibold"
                  style={{ color: darkMode ? "#93c5fd" : "#2563eb" }}
                  type="button"
                >
                  + Add option
                </button>
              </div>
              <div className="space-y-3">
                {editForm.options.map((option, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => onOptionChange(idx, e.target.value)}
                      className="flex-1 rounded-lg border px-3 py-2"
                      style={{
                        backgroundColor: darkMode ? "rgba(15,23,42,0.6)" : "#ffffff",
                        borderColor: borderColor,
                        color: textColor,
                      }}
                    />
                    <label className="flex items-center gap-2 text-sm" style={{ color: textColor }}>
                      <input type="checkbox" checked={editForm.correctFlags[idx]} onChange={() => onToggleCorrect(idx)} className="h-4 w-4" />
                      Correct
                    </label>
                    {editForm.options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => onRemoveOption(idx)}
                        className="text-sm font-semibold"
                        style={{ color: darkMode ? "#fca5a5" : "#dc2626" }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg font-semibold"
                style={{
                  border: `1px solid ${borderColor}`,
                  color: textColor,
                }}
                disabled={savingEdit}
              >
                Cancel
              </button>
              <button
                onClick={onSubmit}
                className="px-4 py-2 rounded-lg font-semibold"
                style={{
                  backgroundColor: darkMode ? "#4f46e5" : "#6366f1",
                  color: "#ffffff",
                  opacity: savingEdit ? 0.7 : 1,
                }}
                disabled={savingEdit}
              >
                {savingEdit ? "Saving..." : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

