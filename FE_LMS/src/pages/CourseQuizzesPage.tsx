import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../hooks/useTheme";
import { quizService, courseService } from "../services";
import type { QuizResponse, SnapshotQuestion } from "../services/quizService";
import type { Course } from "../types/course";
import { Clock, Calendar, CheckCircle, XCircle, Eye, X } from "lucide-react";

export default function CourseQuizzesPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { darkMode } = useTheme();

  const [course, setCourse] = useState<Course | null>(null);
  const [quizzes, setQuizzes] = useState<QuizResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuiz, setSelectedQuiz] = useState<QuizResponse | null>(null);
  const [showQuestionsModal, setShowQuestionsModal] = useState(false);

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
                className="text-sm mb-4 hover:underline"
                style={{ color: "var(--muted-text)" }}
              >
                ← Back to Courses
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
                                  onClick={async () => {
                                    try {
                                      const quizDetails = await quizService.getQuizById(quiz._id);
                                      setSelectedQuiz(quizDetails);
                                      setShowQuestionsModal(true);
                                    } catch (err) {
                                      console.error("Failed to load quiz details:", err);
                                    }
                                  }}
                                  className="px-3 py-1 rounded text-xs font-medium flex items-center gap-1"
                                  style={{ backgroundColor: "#3b82f6", color: "#fff" }}
                                >
                                  <Eye className="w-4 h-4" />
                                  View Questions
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

      {/* Questions Modal */}
      {showQuestionsModal && selectedQuiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div
            className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl p-6"
            style={{ backgroundColor: "var(--card-surface)", border: "1px solid var(--card-border)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold" style={{ color: "var(--heading-text)" }}>
                {selectedQuiz.title} - Questions
              </h2>
              <button
                onClick={() => {
                  setShowQuestionsModal(false);
                  setSelectedQuiz(null);
                }}
                className="p-2 rounded-lg hover:bg-gray-100"
                style={{ color: "var(--muted-text)" }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {selectedQuiz.snapshotQuestions && selectedQuiz.snapshotQuestions.length > 0 ? (
              <div className="space-y-4">
                {selectedQuiz.snapshotQuestions
                  .filter((q) => !q.isDeleted)
                  .map((question, index) => (
                    <div
                      key={question.id || index}
                      className="border rounded-xl p-4"
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
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-center py-8" style={{ color: "var(--muted-text)" }}>
                No questions available.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

