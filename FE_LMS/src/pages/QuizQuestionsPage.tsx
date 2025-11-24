import { useEffect, useState, useRef, type ChangeEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { quizService } from "../services";
import type { QuizResponse, SnapshotQuestion } from "../services/quizService";
import type { EditFormState } from "../types/quiz";
import { EditQuestionModal } from "../components/quiz/EditQuestionModal";
import { ArrowLeft, Trash2, Edit2 } from "lucide-react";
import { useTheme } from "../hooks/useTheme";

export default function QuizQuestionsPage() {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const { darkMode } = useTheme();

  const [quiz, setQuiz] = useState<QuizResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingQuestionId, setDeletingQuestionId] = useState<string | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<SnapshotQuestion | null>(null);
  const [editForm, setEditForm] = useState<EditFormState | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const newImageInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!quizId) {
      setError("Quiz ID is required");
      setLoading(false);
      return;
    }

    const fetchQuiz = async () => {
      try {
        setLoading(true);
        setError(null);
        const quizData = await quizService.getQuizById(quizId);
        setQuiz(quizData);
      } catch (err) {
        console.error("Failed to fetch quiz:", err);
        const message =
          typeof err === "object" && err !== null && "message" in err
            ? String((err as { message?: string }).message)
            : "Failed to load quiz";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId]);

  const handleDeleteQuestion = async (questionId: string) => {
    if (!quiz || !window.confirm("Are you sure you want to delete this question?")) {
      return;
    }

    try {
      setDeletingQuestionId(questionId);
      
      // Call API to delete question
      await quizService.deleteQuestionById(quiz._id, questionId);
      
      // Refresh quiz data
      const updatedQuiz = await quizService.getQuizById(quiz._id);
      setQuiz(updatedQuiz);
    } catch (err) {
      console.error("Failed to delete question:", err);
      const message =
        typeof err === "object" && err !== null && "message" in err
          ? String((err as { message?: string }).message)
          : "Failed to delete question. Please try again.";
      alert(message);
    } finally {
      setDeletingQuestionId(null);
    }
  };

  const determineCorrectFlags = (question: SnapshotQuestion, options: string[]) => {
    const correctOptions = question.correctOptions || [];
    const isBinary =
      correctOptions.length === options.length && correctOptions.every((val) => val === 0 || val === 1);

    if (isBinary) {
      return correctOptions.map((val) => val === 1);
    }

    return options.map((_, idx) => correctOptions.includes(idx));
  };

  const normalizeQuestionImages = (question: SnapshotQuestion) => {
    if (!question.images || !Array.isArray(question.images)) return [];
    return question.images.map((img) => {
      if (typeof img === "string") {
        return { url: img, fromDB: true };
      }
      return { url: img.url, fromDB: img.fromDB ?? true };
    });
  };

  const handleOpenEditQuestion = (question: SnapshotQuestion) => {
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

  const handleRemoveOption = (index: number) => {
    if (!editForm || editForm.options.length <= 2) return;
    setEditForm({
      ...editForm,
      options: editForm.options.filter((_, idx) => idx !== index),
      correctFlags: editForm.correctFlags.filter((_, idx) => idx !== index),
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

  const handleSubmitEdit = async () => {
    if (!editingQuestion || !editForm || !quiz) return;

    const trimmedText = editForm.text.trim();
    const cleanedOptions = editForm.options.map((opt) => opt.trim());
    const hasValidOptions = cleanedOptions.every((opt) => opt.length > 0);
    const hasCorrectAnswer = editForm.correctFlags.some(Boolean);

    if (!trimmedText) {
      alert("Vui lòng nhập nội dung câu hỏi.");
      return;
    }

    if (cleanedOptions.length < 2 || !hasValidOptions) {
      alert("Mỗi câu hỏi phải có ít nhất 2 lựa chọn hợp lệ.");
      return;
    }

    if (!hasCorrectAnswer) {
      alert("Please select at least one correct option.");
      return;
    }

    const selectedCorrectCount = editForm.correctFlags.filter(Boolean).length;
    const originalType = editingQuestion.type || "mcq";
    const canBecomeMulti = originalType === "mcq" || originalType === "multichoice";

    if (selectedCorrectCount > 1 && !canBecomeMulti) {
      alert("This question type allows only one correct option.");
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

      // Prepare images - keep existing (not deleted) and add new ones
      const existingImages = editForm.existingImages
        .filter((img) => !editForm.deletedImageUrls.includes(img.url))
        .map((img) => ({ url: img.url, fromDB: img.fromDB ?? true }));

      const newImages = editForm.newImageFiles.map((file) => {
        // For new images, we'll need to upload them first
        // For now, we'll create a placeholder - in real implementation, upload first
        return { url: URL.createObjectURL(file), fromDB: false };
      });

      const allImages = [...existingImages, ...newImages];

      // Update question in quiz
      await quizService.updateQuestionById(quiz._id, editingQuestion.id || "", {
        text: trimmedText,
        type: nextType,
        options: cleanedOptions,
        correctOptions: editForm.correctFlags.map((flag) => (flag ? 1 : 0)),
        points: editForm.points,
        explanation: editForm.explanation || undefined,
        images: allImages.length > 0 ? allImages : undefined,
      });

      // Refresh quiz data
      const updatedQuiz = await quizService.getQuizById(quiz._id);
      setQuiz(updatedQuiz);
      
      alert("Question updated successfully.");
      handleCloseEdit();
    } catch (error) {
      console.error("Error updating question:", error);
      const message =
        typeof error === "object" && error !== null && "message" in error
          ? String((error as { message?: string }).message)
          : "Failed to update question. Please try again.";
      alert(message);
    } finally {
      setSavingEdit(false);
    }
  };

  const questions = quiz?.snapshotQuestions?.filter((q) => !q.isDeleted) || [];
  const textColor = darkMode ? "#e2e8f0" : "#1e293b";
  const borderColor = darkMode ? "rgba(148,163,184,0.2)" : "rgba(148,163,184,0.2)";

  // Convert SnapshotQuestion to QuizQuestion-like format for EditQuestionModal
  const editingQuestionForModal = editingQuestion
    ? {
        _id: editingQuestion.id || "",
        text: editingQuestion.text,
        type: editingQuestion.type,
        options: editingQuestion.options || [],
        correctOptions: editingQuestion.correctOptions || [],
        points: editingQuestion.points || 1,
        explanation: editingQuestion.explanation,
        images: editingQuestion.images,
        subjectId: "",
      }
    : null;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6" style={{ backgroundColor: "var(--page-bg)", color: "var(--page-text)" }}>
          <div className="max-w-6xl mx-auto">
            {/* Header with Back Button */}
            <div className="mb-6">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-sm mb-4 hover:underline"
                style={{ color: "var(--muted-text)" }}
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--heading-text)" }}>
                {quiz ? quiz.title : "Loading..."}
              </h1>
              {quiz?.description && (
                <p className="text-sm mb-4" style={{ color: "var(--muted-text)" }}>
                  {quiz.description}
                </p>
              )}
            </div>

            {/* Loading State */}
            {loading && (
              <div className="text-center py-12">
                <p style={{ color: "var(--muted-text)" }}>Loading questions...</p>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div
                className="rounded-lg p-4 mb-6"
                style={{ backgroundColor: "var(--error-bg)", color: "var(--error-text)" }}
              >
                {error}
              </div>
            )}

            {/* Questions List */}
            {!loading && !error && (
              <>
                {questions.length === 0 ? (
                  <div
                    className="rounded-lg p-8 text-center"
                    style={{ backgroundColor: "var(--card-surface)", border: "1px solid var(--card-border)" }}
                  >
                    <p style={{ color: "var(--muted-text)" }}>No questions available.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {questions.map((question, index) => (
                      <div
                        key={question.id || index}
                        className="border rounded-xl p-4 relative"
                        style={{ borderColor: "var(--card-row-border)", backgroundColor: "var(--card-row-bg)" }}
                      >
                        <div className="flex items-start gap-3">
                          <span className="font-semibold text-lg" style={{ color: "var(--heading-text)" }}>
                            {index + 1}.
                          </span>
                          <div className="flex-1">
                            <p className="mb-3" style={{ color: "var(--heading-text)" }}>
                              {question.text}
                            </p>
                            {Array.isArray(question.options) && question.options.length > 0 && (
                              <ul className="space-y-2">
                                {question.options.map((opt, idx) => (
                                  <li
                                    key={idx}
                                    className={`text-sm ${
                                      question.correctOptions?.[idx] === 1
                                        ? "font-semibold text-emerald-600"
                                        : ""
                                    }`}
                                    style={{
                                      color:
                                        question.correctOptions?.[idx] === 1
                                          ? "#10b981"
                                          : "var(--muted-text)",
                                    }}
                                  >
                                    {String.fromCharCode(65 + idx)}. {opt}
                                    {question.correctOptions?.[idx] === 1 && (
                                      <span className="ml-2 text-xs">✓ Correct</span>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            )}
                            {question.explanation && (
                              <div className="mt-3 p-2 rounded" style={{ backgroundColor: "var(--card-surface)" }}>
                                <p className="text-xs font-medium mb-1" style={{ color: "var(--muted-text)" }}>
                                  Explanation:
                                </p>
                                <p className="text-sm" style={{ color: "var(--heading-text)" }}>
                                  {question.explanation}
                                </p>
                              </div>
                            )}
                          </div>
                          {/* Action buttons */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleOpenEditQuestion(question)}
                              className="p-2 rounded hover:bg-blue-50"
                              style={{ color: "#3b82f6" }}
                              title="Edit question"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteQuestion(question.id || String(index))}
                              disabled={deletingQuestionId === question.id}
                              className="p-2 rounded hover:bg-red-50 disabled:opacity-50"
                              style={{ color: "#ef4444" }}
                              title="Delete question"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      <EditQuestionModal
        question={editingQuestionForModal}
        editForm={editForm}
        darkMode={darkMode}
        textColor={textColor}
        borderColor={borderColor}
        savingEdit={savingEdit}
        newImageInputRef={newImageInputRef}
        onClose={handleCloseEdit}
        onInputChange={handleEditInputChange}
        onOptionChange={handleOptionChange}
        onToggleCorrect={handleToggleCorrect}
        onAddOption={handleAddOption}
        onRemoveOption={handleRemoveOption}
        onToggleExistingImage={handleToggleExistingImage}
        onSelectNewImages={handleSelectNewImages}
        onRemoveNewImage={handleRemoveNewImage}
        onSubmit={handleSubmitEdit}
      />
    </div>
  );
}
