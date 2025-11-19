import { useState, useEffect, useRef, type ChangeEvent } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "../hooks/useTheme";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { ChevronLeft, ChevronRight, Trash2, Edit3, ArrowLeft } from "lucide-react";
import { quizQuestionService, type QuizQuestion, type QuizQuestionImage } from "../services";

type EditFormState = {
  text: string;
  points: number;
  options: string[];
  correctFlags: boolean[];
  explanation: string;
  existingImages: QuizQuestionImage[];
  deletedImageUrls: string[];
  newImageFiles: File[];
  newImagePreviews: string[];
};

export default function QuizCoursePage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { darkMode } = useTheme();
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("Quiz Questions");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<QuizQuestion | null>(null);
  const [editForm, setEditForm] = useState<EditFormState | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const newImageInputRef = useRef<HTMLInputElement | null>(null);
  // Track current image index for each question
  const [currentImageIndices, setCurrentImageIndices] = useState<Record<string, number>>({});

  const apiBase = import.meta.env.VITE_BASE_API || "";

  // Resolve image source from various possible fields
  const resolveImageSrc = (q: QuizQuestion): string[] => {
    const obj = q as unknown as Record<string, unknown>;
    const images: string[] = [];

    // Check for images array
    if (Array.isArray(obj["images"])) {
      const imageArray = obj["images"] as unknown[];
      imageArray.forEach((img) => {
        if (typeof img === "string") {
          images.push(img);
        } else if (typeof img === "object" && img !== null) {
          const imgObj = img as Record<string, unknown>;
          const url = imgObj["url"] || imgObj["publicUrl"] || imgObj["imageUrl"];
          if (typeof url === "string") {
            images.push(url);
          }
        }
      });
    }

    // Check for single image field
    const singleImage = obj["image"] || obj["imageUrl"] || obj["fileUrl"];
    if (typeof singleImage === "string" && !images.includes(singleImage)) {
      images.push(singleImage);
    }

    // Check for file object
    const fileObj = obj["file"] as Record<string, unknown> | undefined;
    if (fileObj) {
      const fileUrl = fileObj["url"] || fileObj["publicUrl"];
      if (typeof fileUrl === "string" && !images.includes(fileUrl)) {
        images.push(fileUrl);
      }
    }

    // Normalize URLs - add base URL if relative
    return images.map((img) => {
      if (!img) return "";
      return img.startsWith("http") ? img : (apiBase ? `${apiBase}/${img.replace(/^\/+/, "")}` : img);
    }).filter(Boolean);
  };

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        const subjectId = courseId; // courseId is actually subjectId from route /quiz/:courseId

        if (!subjectId) {
          console.warn("QuizCoursePage: No subjectId provided");
          if (mounted) {
            setTitle("Quiz Questions");
            setQuizQuestions([]);
            setLoading(false);
          }
          return;
        }

        console.log("QuizCoursePage: Fetching quiz questions for subjectId:", subjectId);

        // Fetch all quiz questions and filter by subjectId on client side
        const result = await quizQuestionService.getAllQuizQuestions({
          limit: 1000, // Get all questions
          option: "subjectId", // Populate subjectId
        });

        console.log("QuizCoursePage: All quiz questions result:", result);
        console.log("QuizCoursePage: Total questions:", result.data?.length || 0);

        // Filter by subjectId on client side
        let filteredQuestions = (result.data || []).filter((q) => {
          const qSubjectId = typeof q.subjectId === "object" && q.subjectId ? q.subjectId._id : q.subjectId;
          return qSubjectId === subjectId;
        });

        // If navigated from import with importedIds, only show those
        const state = location.state as { importedIds?: string[] } | null;
        const importedIds = state?.importedIds;
        if (importedIds && importedIds.length > 0) {
          filteredQuestions = filteredQuestions.filter((q) => importedIds.includes(q._id));
        }

        console.log("QuizCoursePage: Filtered questions for subjectId:", filteredQuestions.length);

        if (mounted) {
          setQuizQuestions(filteredQuestions);
          setTitle(`Quiz Questions (${filteredQuestions.length} questions)`);
        }
      } catch (error) {
        console.error("QuizCoursePage: Error fetching quiz questions:", error);
        if (mounted) {
          setQuizQuestions([]);
          setTitle("Quiz Questions");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [courseId, location.state]);

  const getSwalBaseOptions = () => ({
    width: 360,
    background: darkMode ? "rgba(15,23,42,0.95)" : "#ffffff",
    color: darkMode ? "#e2e8f0" : "#1f2937",
    confirmButtonColor: "#6366f1",
  });

  const showSwalConfirm = async (message: string): Promise<boolean> => {
    const Swal = (await import("sweetalert2")).default;
    const base = getSwalBaseOptions();
    const result = await Swal.fire({
      ...base,
      title: "Confirm",
      text: message,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: darkMode ? "#334155" : "#e2e8f0",
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
      reverseButtons: true,
      heightAuto: false,
    });
    return result.isConfirmed;
  };

  const showSwalError = async (message: string) => {
    const Swal = (await import("sweetalert2")).default;
    const base = getSwalBaseOptions();
    await Swal.fire({
      ...base,
      icon: "error",
      title: "Error",
      text: message,
      confirmButtonText: "Close",
      heightAuto: false,
    });
  };

  const showSwalSuccess = async (message: string) => {
    const Swal = (await import("sweetalert2")).default;
    const base = getSwalBaseOptions();
    await Swal.fire({
      ...base,
      icon: "success",
      title: "Success",
      text: message,
      timer: 1500,
      showConfirmButton: false,
      heightAuto: false,
    });
  };

  const handleDeleteQuestion = async (questionId: string) => {
    const confirmed = await showSwalConfirm("Delete this question?");
    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(questionId);
      // Get question from current state to pass to delete function
      const question = quizQuestions.find((q) => q._id === questionId);
      await quizQuestionService.deleteQuizQuestion(questionId, question);
      
      // Remove question from state
      setQuizQuestions((prev) => {
        const updated = prev.filter((q) => q._id !== questionId);
        setTitle(`Quiz Questions (${updated.length} questions)`);
        return updated;
      });
      await showSwalSuccess("Question deleted.");
    } catch (error) {
      console.error("Error deleting question:", error);
      await showSwalError("Failed to delete question. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const determineCorrectFlags = (question: QuizQuestion, options: string[]) => {
    const correctOptions = question.correctOptions || [];
    const isBinary =
      correctOptions.length === options.length && correctOptions.every((val) => val === 0 || val === 1);

    if (isBinary) {
      return correctOptions.map((val) => val === 1);
    }

    return options.map((_, idx) => correctOptions.includes(idx));
  };

  const normalizeQuestionImages = (question: QuizQuestion): QuizQuestionImage[] => {
    if (!question.images || !Array.isArray(question.images)) return [];
    const normalized: QuizQuestionImage[] = [];
    question.images.forEach((img) => {
      if (!img) return;
      if (typeof img === "string") {
        normalized.push({ url: img, fromDB: true });
        return;
      }
      if (typeof img === "object" && img !== null) {
        const candidate = img as Partial<QuizQuestionImage>;
        if (typeof candidate.url === "string") {
          normalized.push({ url: candidate.url, fromDB: candidate.fromDB });
        }
      }
    });
    return normalized;
  };

  const handleOpenEditQuestion = (question: QuizQuestion) => {
    const existingOptions = question.options && question.options.length > 0 ? [...question.options] : ["", ""];
    const flags = determineCorrectFlags(question, existingOptions);

    setEditForm({
      text: question.text,
      points: question.points || 1,
      options: existingOptions,
      correctFlags: flags.length === existingOptions.length ? flags : new Array(existingOptions.length).fill(false),
      explanation: question.explanation || "",
      existingImages: normalizeQuestionImages(question),
      deletedImageUrls: [],
      newImageFiles: [],
      newImagePreviews: [],
    });
    setEditingQuestion(question);
  };

  const handleCloseEdit = () => {
    if (savingEdit) return;
    setEditingQuestion(null);
    setEditForm(null);
  };

  const handleEditInputChange = (field: keyof EditFormState, value: string | number) => {
    if (!editForm) return;
    setEditForm({
      ...editForm,
      [field]: field === "points" ? Number(value) : value,
    });
  };

  const handleOptionChange = (index: number, value: string) => {
    if (!editForm) return;
    const updatedOptions = [...editForm.options];
    updatedOptions[index] = value;
    setEditForm({
      ...editForm,
      options: updatedOptions,
    });
  };

  const handleToggleCorrect = (index: number) => {
    if (!editForm) return;
    const updatedFlags = [...editForm.correctFlags];
    updatedFlags[index] = !updatedFlags[index];
    setEditForm({
      ...editForm,
      correctFlags: updatedFlags,
    });
  };

  const handleAddOption = () => {
    if (!editForm) return;
    setEditForm({
      ...editForm,
      options: [...editForm.options, ""],
      correctFlags: [...editForm.correctFlags, false],
    });
  };

  const handleToggleExistingImage = (url: string) => {
    if (!editForm) return;
    const isMarked = editForm.deletedImageUrls.includes(url);
    setEditForm({
      ...editForm,
      deletedImageUrls: isMarked
        ? editForm.deletedImageUrls.filter((item) => item !== url)
        : [...editForm.deletedImageUrls, url],
    });
  };

  const handleSelectNewImages = (event: ChangeEvent<HTMLInputElement>) => {
    if (!editForm) return;
    const files = event.target.files ? Array.from(event.target.files) : [];
    if (files.length === 0) return;

    const readers = files.map(
      (file) =>
        new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(typeof reader.result === "string" ? reader.result : "");
          reader.readAsDataURL(file);
        })
    );

    Promise.all(readers).then((previews) => {
      setEditForm((prev) =>
        prev
          ? {
              ...prev,
              newImageFiles: [...prev.newImageFiles, ...files],
              newImagePreviews: [...prev.newImagePreviews, ...previews.filter(Boolean)],
            }
          : prev
      );
    });

    if (event.target) {
      event.target.value = "";
    }
  };

  const handleRemoveNewImage = (index: number) => {
    if (!editForm) return;
    setEditForm({
      ...editForm,
      newImageFiles: editForm.newImageFiles.filter((_, idx) => idx !== index),
      newImagePreviews: editForm.newImagePreviews.filter((_, idx) => idx !== index),
    });
  };

  const handleRemoveOption = (index: number) => {
    if (!editForm || editForm.options.length <= 2) return;
    setEditForm({
      ...editForm,
      options: editForm.options.filter((_, idx) => idx !== index),
      correctFlags: editForm.correctFlags.filter((_, idx) => idx !== index),
    });
  };

  const handleSubmitEdit = async () => {
    if (!editingQuestion || !editForm) return;

    const trimmedText = editForm.text.trim();
    const cleanedOptions = editForm.options.map((opt) => opt.trim());
    const hasValidOptions = cleanedOptions.every((opt) => opt.length > 0);
    const hasCorrectAnswer = editForm.correctFlags.some(Boolean);

    if (!trimmedText) {
      await showSwalError("Vui lòng nhập nội dung câu hỏi.");
      return;
    }

    if (cleanedOptions.length < 2 || !hasValidOptions) {
      await showSwalError("Mỗi câu hỏi phải có ít nhất 2 lựa chọn hợp lệ.");
      return;
    }

    if (!hasCorrectAnswer) {
      await showSwalError("Please select at least one correct option.");
      return;
    }

    const selectedCorrectCount = editForm.correctFlags.filter(Boolean).length;
    const originalType = editingQuestion.type || "mcq";
    const canBecomeMulti = originalType === "mcq" || originalType === "multichoice";

    if (selectedCorrectCount > 1 && !canBecomeMulti) {
      await showSwalError("This question type allows only one correct option.");
      return;
    }

    let nextType = originalType;
    if (selectedCorrectCount > 1 && canBecomeMulti) {
      nextType = "multichoice";
    } else if (selectedCorrectCount <= 1 && originalType === "multichoice") {
      nextType = "mcq";
    }

    try {
      setSavingEdit(true);
      const subjectId =
        typeof editingQuestion.subjectId === "object" && editingQuestion.subjectId
          ? editingQuestion.subjectId._id
          : (editingQuestion.subjectId as string);

      const updatedQuestion = await quizQuestionService.updateQuizQuestion(editingQuestion._id, {
        subjectId,
        text: trimmedText,
        points: editForm.points,
        options: cleanedOptions,
        correctOptions: editForm.correctFlags.map((flag) => (flag ? 1 : 0)),
        type: nextType,
        explanation: editForm.explanation,
        deletedKeys: editForm.deletedImageUrls,
        newImages: editForm.newImageFiles,
      });

      setQuizQuestions((prev) =>
        prev.map((q) => (q._id === updatedQuestion._id ? { ...q, ...updatedQuestion } : q))
      );

      await showSwalSuccess("Question updated.");
      handleCloseEdit();
    } catch (error) {
      console.error("Error updating question:", error);
      await showSwalError("Failed to update question. Please try again.");
    } finally {
      setSavingEdit(false);
    }
  };

  const textColor = darkMode ? "#e2e8f0" : "#1e293b";
  const bgColor = darkMode ? "#0f172a" : "#f8fafc";
  const cardBg = darkMode ? "rgba(15,23,42,0.6)" : "#ffffff";
  const borderColor = darkMode ? "rgba(148,163,184,0.2)" : "rgba(148,163,184,0.2)";

  return (
    <div className="min-h-screen" style={{ backgroundColor: bgColor }}>
      <Navbar />
      <div className="flex relative">
        <Sidebar />
        <div className="flex-1 p-6 md:ml-64 relative">
          <div className="max-w-6xl mx-auto">
            <div className="mb-6 flex items-center justify-between">
              <h1 className="text-3xl font-bold" style={{ color: textColor }}>
                {title}
              </h1>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <p style={{ color: textColor }}>Loading...</p>
              </div>
            ) : quizQuestions.length === 0 ? (
              <div className="text-center py-12">
                <p style={{ color: textColor }}>No questions.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="mb-4">
                  <button
                    onClick={() => navigate(-1)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors"
                    style={{
                      backgroundColor: darkMode ? "rgba(99,102,241,0.2)" : "#6366f1",
                      color: darkMode ? "#a5b4fc" : "#ffffff",
                    }}
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back subject</span>
                  </button>
                </div>
                {quizQuestions.map((question, index) => {
                  const images = resolveImageSrc(question);
                  return (
                    <div
                      key={question._id}
                      className="rounded-2xl p-6"
                      style={{
                        backgroundColor: cardBg,
                        border: `1px solid ${borderColor}`,
                      }}
                    >
                      <div className="mb-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3
                            className="text-xl font-semibold break-words flex-1"
                            style={{ color: textColor }}
                          >
                            <span className="mr-2">Question {index + 1}:</span>
                            <span
                              dangerouslySetInnerHTML={{ __html: question.text }}
                            />
                          </h3>
                          <div className="flex items-center gap-2 ml-4">
                            <button
                              onClick={() => handleOpenEditQuestion(question)}
                              className="p-2 rounded-lg transition-colors flex-shrink-0"
                              style={{
                                backgroundColor: darkMode ? "rgba(59,130,246,0.2)" : "#e0f2fe",
                                color: darkMode ? "#93c5fd" : "#0369a1",
                              }}
                              title="Edit question"
                            >
                              <Edit3 className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteQuestion(question._id)}
                              disabled={deletingId === question._id}
                              className="p-2 rounded-lg transition-colors flex-shrink-0"
                              style={{
                                backgroundColor: darkMode ? "rgba(239, 68, 68, 0.2)" : "#fee2e2",
                                color: darkMode ? "#fca5a5" : "#dc2626",
                                opacity: deletingId === question._id ? 0.5 : 1,
                                cursor: deletingId === question._id ? "not-allowed" : "pointer",
                              }}
                              title="Xóa câu hỏi"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                        {images.length > 0 && (() => {
                          const currentIndex = currentImageIndices[question._id] || 0;
                          const currentImage = images[currentIndex];
                          const hasNext = currentIndex < images.length - 1;
                          const hasPrev = currentIndex > 0;

                          const handleNext = () => {
                            if (hasNext) {
                              setCurrentImageIndices(prev => ({
                                ...prev,
                                [question._id]: currentIndex + 1
                              }));
                            }
                          };

                          const handlePrev = () => {
                            if (hasPrev) {
                              setCurrentImageIndices(prev => ({
                                ...prev,
                                [question._id]: currentIndex - 1
                              }));
                            }
                          };

                          return (
                            <div className="mt-4 relative">
                              <div className="relative flex items-center justify-center group">
                                {hasPrev && (
                                  <button
                                    onClick={handlePrev}
                                    className="absolute left-2 z-10 p-2 rounded-full shadow-lg transition-all hover:scale-110"
                                    style={{
                                      backgroundColor: darkMode ? "rgba(99,102,241,0.9)" : "#6366f1",
                                      color: "#ffffff",
                                    }}
                                  >
                                    <ChevronLeft className="w-5 h-5" />
                                  </button>
                                )}
                                <img
                                  src={currentImage}
                                  alt={`Question ${index + 1} image ${currentIndex + 1}`}
                                  className="max-w-full max-h-96 object-contain rounded-lg border transition-opacity"
                                  style={{ borderColor: borderColor }}
                                  onError={(e) => {
                                    console.error("Failed to load image:", currentImage);
                                    (e.target as HTMLImageElement).style.display = "none";
                                  }}
                                />
                                {hasNext && (
                                  <button
                                    onClick={handleNext}
                                    className="absolute right-2 z-10 p-2 rounded-full shadow-lg transition-all hover:scale-110"
                                    style={{
                                      backgroundColor: darkMode ? "rgba(99,102,241,0.9)" : "#6366f1",
                                      color: "#ffffff",
                                    }}
                                  >
                                    <ChevronRight className="w-5 h-5" />
                                  </button>
                                )}
                              </div>
                              {images.length > 1 && (
                                <div className="mt-2 text-center">
                                  <span className="text-sm px-3 py-1 rounded-full inline-block" style={{ 
                                    color: textColor,
                                    backgroundColor: darkMode ? "rgba(99,102,241,0.2)" : "rgba(99,102,241,0.1)"
                                  }}>
                                    {currentIndex + 1} / {images.length}
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>

                      {question.options && question.options.length > 0 && (
                        <div className="space-y-2">
                          <p className="font-semibold mb-2" style={{ color: textColor }}>
                            Options:
                          </p>
                          {question.options.map((option, optIndex) => {
                            const correctOptions = question.correctOptions || [];
                            const isBinaryCorrect =
                              correctOptions.length === question.options?.length &&
                              correctOptions.every((val) => val === 0 || val === 1);
                            const isCorrect = isBinaryCorrect
                              ? correctOptions[optIndex] === 1
                              : correctOptions.includes(optIndex);

                            return (
                              <div
                                key={optIndex}
                                className="p-3 rounded-lg break-words"
                                style={{
                                  backgroundColor: isCorrect
                                    ? darkMode
                                      ? "rgba(16,185,129,0.2)"
                                      : "rgba(16,185,129,0.1)"
                                    : darkMode
                                    ? "rgba(15,23,42,0.4)"
                                    : "#f1f5f9",
                                  border: `1px solid ${
                                    isCorrect
                                      ? darkMode
                                        ? "rgba(16,185,129,0.5)"
                                        : "rgba(16,185,129,0.3)"
                                      : borderColor
                                  }`,
                                  color: textColor,
                                }}
                              >
                                <span className="font-semibold">
                                  {String.fromCharCode(65 + optIndex)}.{" "}
                                </span>
                                {option}
                                {isCorrect && (
                                  <span className="ml-2 text-green-500">✓ (Đúng)</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {question.points && (
                        <div className="mt-4">
                          <span className="text-sm" style={{ color: textColor }}>
                            Points: {question.points}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      {editingQuestion && editForm && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={handleCloseEdit}
            aria-hidden="true"
          ></div>
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
                  onClick={handleCloseEdit}
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
                    onChange={(e) => handleEditInputChange("text", e.target.value)}
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
                      min={1}
                      value={editForm.points}
                      onChange={(e) => handleEditInputChange("points", e.target.value)}
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
                      onChange={(e) => handleEditInputChange("explanation", e.target.value)}
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
                  <input
                    ref={newImageInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleSelectNewImages}
                    className="hidden"
                  />

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
                            <img
                              src={img.url}
                              alt="Question"
                              className="w-full h-40 object-cover"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleToggleExistingImage(img.url)}
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
                              onClick={() => handleRemoveNewImage(idx)}
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
                      onClick={handleAddOption}
                      className="text-sm font-semibold"
                      style={{ color: darkMode ? "#93c5fd" : "#2563eb" }}
                      type="button"
                    >
                      + Add option
                    </button>
                  </div>
                  <div className="space-y-3">
                    {editForm.options.map((option, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3"
                      >
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => handleOptionChange(idx, e.target.value)}
                          className="flex-1 rounded-lg border px-3 py-2"
                          style={{
                            backgroundColor: darkMode ? "rgba(15,23,42,0.6)" : "#ffffff",
                            borderColor: borderColor,
                            color: textColor,
                          }}
                        />
                        <label className="flex items-center gap-2 text-sm" style={{ color: textColor }}>
                          <input
                            type="checkbox"
                            checked={editForm.correctFlags[idx]}
                            onChange={() => handleToggleCorrect(idx)}
                            className="h-4 w-4"
                          />
                          Correct
                        </label>
                        {editForm.options.length > 2 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveOption(idx)}
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
                    onClick={handleCloseEdit}
                    className="px-4 py-2 rounded-lg font-semibold"
                    style={{
                      backgroundColor: darkMode ? "rgba(15,23,42,0.6)" : "#e2e8f0",
                      color: darkMode ? "#cbd5f5" : "#1e293b",
                    }}
                    disabled={savingEdit}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitEdit}
                    className="px-4 py-2 rounded-lg font-semibold text-white"
                    style={{ backgroundColor: savingEdit ? "#94a3b8" : "#2563eb" }}
                    disabled={savingEdit}
                  >
                    {savingEdit ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
