import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { quizService, courseService } from "../services";
import type { QuizResponse } from "../services/quizService";
import type { Course } from "../types/course";
import { Clock, Calendar, CheckCircle, ArrowLeft, Trash2, Edit2, X } from "lucide-react";
import QuizCoursePage from "./QuizCoursePage";
import { useTheme } from "../hooks/useTheme";
import { useAuth } from "../hooks/useAuth";

interface EditQuizForm {
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  isPublished: boolean;
}

export default function CourseQuizzesPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const { user } = useAuth();
  const role = (user?.role as "admin" | "teacher" | "student") || "teacher";
  const isStudent = role === "student";

  const [course, setCourse] = useState<Course | null>(null);
  const [quizzes, setQuizzes] = useState<QuizResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingQuizId, setDeletingQuizId] = useState<string | null>(null);
  const [isSubjectId, setIsSubjectId] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<QuizResponse | null>(null);
  const [editForm, setEditForm] = useState<EditQuizForm | null>(null);
  const [updatingQuizId, setUpdatingQuizId] = useState<string | null>(null);

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

  useEffect(() => {
    if (!courseId) {
      setError("Course ID is required");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // First, try to fetch as a course
        try {
          console.log("Fetching course with ID:", courseId);
          const courseData = await courseService.getCourseById(courseId);
          console.log("Course found:", courseData);
          setCourse(courseData);

          // Fetch quizzes for this course (don't send isDeleted: false, let backend use default)
          const result = await quizService.getQuizzesByCourseId(courseId, {
            isPublished: isStudent ? true : undefined,
          });
          console.log("Quizzes fetched:", result.data);
          setQuizzes(result.data || []);
          setIsSubjectId(false);
        } catch (courseErr: any) {
          // If course not found (404), treat it as a subjectId and render QuizCoursePage
          // http.ts throws error with status field, not response.status
          const status = courseErr?.status || courseErr?.response?.status;
          const errorMessage = courseErr?.message || courseErr?.response?.data?.message || "";
          const isNotFound = status === 404 || 
                            errorMessage.toLowerCase().includes("not found") ||
                            errorMessage.toLowerCase().includes("course not found");
          
          if (isNotFound) {
            console.log("Course not found, treating as subjectId:", courseId);
            setIsSubjectId(true);
            setError(null); // Clear error since we'll render QuizCoursePage
            setLoading(false); // Stop loading since we're switching to QuizCoursePage
            return; // Exit early, don't throw error
          } else {
            // Some other error occurred (network, server error, etc.)
            throw courseErr;
          }
        }
      } catch (err) {
        console.error("Failed to fetch course quizzes:", err);
        const message =
          typeof err === "object" && err !== null && "message" in err
            ? String((err as { message?: string }).message)
            : "Failed to load quizzes";
        setError(message);
        setIsSubjectId(false);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [courseId]);

  const getQuizStatus = (quiz: QuizResponse) => {
    const now = new Date();
    const startTime = new Date(quiz.startTime);
    const endTime = new Date(quiz.endTime);

    if (now < startTime) {
      return { label: "Upcoming", color: "#3b82f6" };
    } else if (now >= startTime && now <= endTime) {
      return { label: "Active", color: "#10b981" };
    } else {
      return { label: "Ended", color: "#6b7280" };
    }
  };

  const canTakeQuiz = (quiz: QuizResponse) => {
    const now = new Date();
    const startTime = new Date(quiz.startTime);
    const endTime = new Date(quiz.endTime);
    return Boolean(quiz.isPublished) && now >= startTime && now <= endTime;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Convert ISO string to datetime-local format
  const isoToDatetimeLocal = (isoString: string): string => {
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Convert datetime-local to ISO UTC string
  const datetimeLocalToISO = (datetimeLocal: string): string => {
    if (!datetimeLocal) return "";
    const localDate = new Date(datetimeLocal);
    return localDate.toISOString();
  };

  const handleOpenEditQuiz = (quiz: QuizResponse) => {
    setEditingQuiz(quiz);
    setEditForm({
      title: quiz.title,
      description: quiz.description || "",
      startTime: isoToDatetimeLocal(quiz.startTime),
      endTime: isoToDatetimeLocal(quiz.endTime),
      isPublished: quiz.isPublished ?? false,
    });
  };

  const handleCloseEdit = () => {
    setEditingQuiz(null);
    setEditForm(null);
  };

  const handleUpdateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuiz || !editForm) return;

    try {
      setUpdatingQuizId(editingQuiz._id);
      await quizService.updateQuiz(editingQuiz._id, {
        title: editForm.title.trim(),
        description: editForm.description.trim() || undefined,
        startTime: datetimeLocalToISO(editForm.startTime),
        endTime: datetimeLocalToISO(editForm.endTime),
        isPublished: editForm.isPublished,
      });

      // Update the quiz in state immediately with the new values
      setQuizzes((prevQuizzes) =>
        prevQuizzes.map((q) =>
          q._id === editingQuiz._id
            ? {
                ...q,
                title: editForm.title.trim(),
                description: editForm.description.trim() || undefined,
                startTime: datetimeLocalToISO(editForm.startTime),
                endTime: datetimeLocalToISO(editForm.endTime),
                isPublished: editForm.isPublished,
              }
            : q
        )
      );

      // Small delay to ensure backend has processed the update
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Refresh quizzes list to get latest data from backend
      const result = await quizService.getQuizzesByCourseId(courseId!);
      console.log("Refreshed quizzes after update:", result.data);
      const updatedQuiz = result.data?.find((q) => q._id === editingQuiz._id);
      console.log("Updated quiz isPublished:", updatedQuiz?.isPublished);
      setQuizzes(result.data || []);
      
      handleCloseEdit();
      await showSwalSuccess("Quiz updated successfully");
    } catch (err) {
      console.error("Failed to update quiz:", err);
      const message =
        typeof err === "object" && err !== null && "message" in err
          ? String((err as { message?: string }).message)
          : "Failed to update quiz";
      await showSwalError(message);
    } finally {
      setUpdatingQuizId(null);
    }
  };

  const handleDeleteQuiz = async (quizId: string) => {
    const confirmed = await showSwalConfirm("Are you sure you want to delete this quiz? This action cannot be undone.");
    if (!confirmed) {
      return;
    }

    try {
      setDeletingQuizId(quizId);
      await quizService.deleteQuiz(quizId);
      
      // Refresh quizzes list
      const result = await quizService.getQuizzesByCourseId(courseId!);
      setQuizzes(result.data || []);
      await showSwalSuccess("Quiz deleted successfully");
    } catch (err) {
      console.error("Failed to delete quiz:", err);
      const message =
        typeof err === "object" && err !== null && "message" in err
          ? String((err as { message?: string }).message)
          : "Failed to delete quiz";
      await showSwalError(message);
    } finally {
      setDeletingQuizId(null);
    }
  };

  // If it's a subjectId, render QuizCoursePage instead
  if (isSubjectId) {
    return <QuizCoursePage />;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6" style={{ backgroundColor: "var(--page-bg)", color: "var(--page-text)" }}>
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <button
                onClick={() => navigate("/quizz")}
                className="flex items-center gap-2 text-sm mb-4 hover:underline"
                style={{ color: "var(--muted-text)" }}
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Courses
              </button>
              <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--heading-text)" }}>
                {course ? course.title : "Loading..."}
              </h1>
              {course?.code && (
                <p className="text-sm" style={{ color: "var(--muted-text)" }}>
                  {course.code}
                </p>
              )}
            </div>

            {/* Loading State */}
            {loading && (
              <div className="text-center py-12">
                <p style={{ color: "var(--muted-text)" }}>Loading quizzes...</p>
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

            {/* Quizzes List */}
            {!loading && !error && (
              <>
                {quizzes.length === 0 ? (
                  <div
                    className="rounded-lg p-8 text-center"
                    style={{ backgroundColor: "var(--card-surface)", border: "1px solid var(--card-border)" }}
                  >
                    <p style={{ color: "var(--muted-text)" }}>No quizzes available for this course.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {quizzes.map((quiz) => {
                      const status = getQuizStatus(quiz);
                      return (
                        <div
                          key={quiz._id}
                          className="rounded-lg shadow-md overflow-hidden transition-all duration-200 hover:shadow-lg cursor-pointer"
                          style={{
                            backgroundColor: "var(--card-surface)",
                            border: `1px solid var(--card-border)`,
                          }}
                          onClick={() => {
                            if (isStudent) {
                              navigate(`/quizz/${courseId}/quiz/${quiz._id}`, {
                                state: { quiz },
                              });
                            } else {
                              navigate(`/questionbank/questions/${quiz._id}`);
                            }
                          }}
                        >
                          <div className="p-6">
                            {/* Quiz Title */}
                            <h3 className="text-xl font-semibold mb-2" style={{ color: "var(--heading-text)" }}>
                              {quiz.title}
                            </h3>

                            {/* Quiz Description */}
                            {quiz.description && (
                              <p className="text-sm mb-4 line-clamp-2" style={{ color: "var(--muted-text)" }}>
                                {quiz.description}
                              </p>
                            )}

                            {/* Quiz Details */}
                            <div className="space-y-2 mb-4">
                              <div className="flex items-center gap-2 text-sm">
                                <Calendar className="w-4 h-4" style={{ color: "var(--muted-text)" }} />
                                <span style={{ color: "var(--muted-text)" }}>
                                  Start: {formatDate(quiz.startTime)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <Clock className="w-4 h-4" style={{ color: "var(--muted-text)" }} />
                                <span style={{ color: "var(--muted-text)" }}>
                                  End: {formatDate(quiz.endTime)}
                                </span>
                              </div>
                            </div>

                            {/* Status Badge and Actions */}
                              <div className="flex items-center justify-between">
                                <span
                                  className="text-xs font-semibold px-3 py-1 rounded-full"
                                  style={{ backgroundColor: `${status.color}20`, color: status.color }}
                                >
                                  {status.label}
                                </span>
                                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                  {quiz.isPublished && (
                                    <span className="text-xs flex items-center gap-1" style={{ color: "#10b981" }}>
                                      <CheckCircle className="w-4 h-4" />
                                      Published
                                    </span>
                                  )}
                                  {isStudent ? (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (canTakeQuiz(quiz)) {
                                          navigate(`/quizz/${courseId}/quiz/${quiz._id}`, {
                                            state: { quiz },
                                          });
                                        }
                                      }}
                                      disabled={!canTakeQuiz(quiz)}
                                      className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
                                      style={{ backgroundColor: "#6d28d9" }}
                                    >
                                      {canTakeQuiz(quiz) ? "Take Quiz" : "Unavailable"}
                                    </button>
                                  ) : (
                                    <>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleOpenEditQuiz(quiz);
                                        }}
                                        className="p-2 rounded hover:bg-blue-50 transition-colors"
                                        style={{ color: "#3b82f6" }}
                                        title="Edit quiz"
                                      >
                                        <Edit2 className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteQuiz(quiz._id);
                                        }}
                                        disabled={deletingQuizId === quiz._id}
                                        className="p-2 rounded hover:bg-red-50 transition-colors disabled:opacity-50"
                                        style={{ color: "#ef4444" }}
                                        title="Delete quiz"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Edit Quiz Modal */}
      {!isStudent && editingQuiz && editForm && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={handleCloseEdit} />
          <div
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl p-6 space-y-4"
            style={{
              backgroundColor: "var(--card-surface)",
              color: "var(--heading-text)",
              border: "1px solid var(--card-border)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Edit Quiz</h2>
              <button
                onClick={handleCloseEdit}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                style={{ color: "var(--heading-text)" }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateQuiz} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--muted-text)" }}>
                  Title
                </label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border"
                  style={{
                    backgroundColor: "var(--input-bg)",
                    borderColor: "var(--input-border)",
                    color: "var(--input-text)",
                  }}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--muted-text)" }}>
                  Description
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border"
                  style={{
                    backgroundColor: "var(--input-bg)",
                    borderColor: "var(--input-border)",
                    color: "var(--input-text)",
                  }}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: "var(--muted-text)" }}>
                    Start Time
                  </label>
                  <input
                    type="datetime-local"
                    value={editForm.startTime}
                    onChange={(e) => setEditForm({ ...editForm, startTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border"
                    style={{
                      backgroundColor: "var(--input-bg)",
                      borderColor: "var(--input-border)",
                      color: "var(--input-text)",
                    }}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: "var(--muted-text)" }}>
                    End Time
                  </label>
                  <input
                    type="datetime-local"
                    value={editForm.endTime}
                    onChange={(e) => setEditForm({ ...editForm, endTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border"
                    style={{
                      backgroundColor: "var(--input-bg)",
                      borderColor: "var(--input-border)",
                      color: "var(--input-text)",
                    }}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.isPublished}
                    onChange={(e) => setEditForm({ ...editForm, isPublished: e.target.checked })}
                    className="w-4 h-4 rounded border"
                    style={{
                      backgroundColor: editForm.isPublished ? "var(--primary-color)" : "var(--input-bg)",
                      borderColor: "var(--input-border)",
                    }}
                  />
                  <span className="text-sm font-medium" style={{ color: "var(--muted-text)" }}>
                    Published
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={handleCloseEdit}
                  className="px-4 py-2 rounded-lg text-sm font-medium"
                  style={{ backgroundColor: "var(--divider-color)", color: "var(--heading-text)" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingQuizId === editingQuiz._id}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white disabled:opacity-50"
                >
                  {updatingQuizId === editingQuiz._id ? "Updating..." : "Update Quiz"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

