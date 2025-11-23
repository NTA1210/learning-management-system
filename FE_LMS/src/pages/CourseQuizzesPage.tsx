import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { quizService, courseService } from "../services";
import type { QuizResponse } from "../services/quizService";
import type { Course } from "../types/course";
import { Clock, Calendar, CheckCircle, Eye, ArrowLeft, Trash2 } from "lucide-react";

export default function CourseQuizzesPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  const [course, setCourse] = useState<Course | null>(null);
  const [quizzes, setQuizzes] = useState<QuizResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingQuizId, setDeletingQuizId] = useState<string | null>(null);

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

        // Fetch course info
        const courseData = await courseService.getCourseById(courseId);
        setCourse(courseData);

        // Fetch quizzes for this course (don't send isDeleted: false, let backend use default)
        const result = await quizService.getQuizzesByCourseId(courseId);
        setQuizzes(result.data || []);
      } catch (err) {
        console.error("Failed to fetch course quizzes:", err);
        const message =
          typeof err === "object" && err !== null && "message" in err
            ? String((err as { message?: string }).message)
            : "Failed to load quizzes";
        setError(message);
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

  const handleDeleteQuiz = async (quizId: string) => {
    if (!window.confirm("Are you sure you want to delete this quiz? This action cannot be undone.")) {
      return;
    }

    try {
      setDeletingQuizId(quizId);
      await quizService.deleteQuiz(quizId);
      
      // Refresh quizzes list
      const result = await quizService.getQuizzesByCourseId(courseId!);
      setQuizzes(result.data || []);
    } catch (err) {
      console.error("Failed to delete quiz:", err);
      const message =
        typeof err === "object" && err !== null && "message" in err
          ? String((err as { message?: string }).message)
          : "Failed to delete quiz";
      alert(message);
    } finally {
      setDeletingQuizId(null);
    }
  };

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
                          className="rounded-lg shadow-md overflow-hidden transition-all duration-200 hover:shadow-lg"
                          style={{
                            backgroundColor: "var(--card-surface)",
                            border: `1px solid var(--card-border)`,
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

                            {/* Status Badge */}
                            <div className="flex items-center justify-between">
                              <span
                                className="text-xs font-semibold px-3 py-1 rounded-full"
                                style={{ backgroundColor: `${status.color}20`, color: status.color }}
                              >
                                {status.label}
                              </span>
                              <div className="flex items-center gap-2">
                                {quiz.isPublished && (
                                  <span className="text-xs flex items-center gap-1" style={{ color: "#10b981" }}>
                                    <CheckCircle className="w-4 h-4" />
                                    Published
                                  </span>
                                )}
                                <button
                                  onClick={() => {
                                    navigate(`/quiz/questions/${quiz._id}`);
                                  }}
                                  className="px-3 py-1 rounded text-xs font-medium flex items-center gap-1"
                                  style={{ backgroundColor: "#3b82f6", color: "#fff" }}
                                >
                                  <Eye className="w-4 h-4" />
                                  View Questions
                                </button>
                                <button
                                  onClick={() => handleDeleteQuiz(quiz._id)}
                                  disabled={deletingQuizId === quiz._id}
                                  className="px-3 py-1 rounded text-xs font-medium flex items-center gap-1 disabled:opacity-50"
                                  style={{ backgroundColor: "#ef4444", color: "#fff" }}
                                  title="Delete quiz"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Delete
                                </button>
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
    </div>
  );
}

