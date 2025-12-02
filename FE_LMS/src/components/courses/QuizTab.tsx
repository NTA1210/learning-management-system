import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { quizService } from "../../services";
import type { QuizResponse } from "../../services/quizService";
import { Clock, FileText, Calendar, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";

interface QuizTabProps {
  courseId: string;
  darkMode: boolean;
  onQuizCountChange?: (count: number) => void;
}

const QuizTab: React.FC<QuizTabProps> = ({ courseId, darkMode, onQuizCountChange }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState<QuizResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const fetchQuizzes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Don't pass pagination params - backend will use defaults (same as QuizPage)
      const result = await quizService.getQuizzesByCourseId(courseId, {
        isPublished: true,
      });
      setQuizzes(result.data || []);
      setPagination(result.pagination);
      
      // Notify parent of total count
      if (onQuizCountChange) {
        onQuizCountChange(result.pagination.total);
      }
    } catch (err: unknown) {
      console.error("Error fetching quizzes:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to load quizzes";
      setError(errorMessage);
      setQuizzes([]);
    } finally {
      setLoading(false);
    }
  }, [courseId, onQuizCountChange]);

  useEffect(() => {
    if (courseId) {
      fetchQuizzes();
    }
  }, [courseId, fetchQuizzes]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getQuizStatus = (quiz: QuizResponse) => {
    const now = new Date();
    const startTime = new Date(quiz.startTime);
    const endTime = new Date(quiz.endTime);

    if (startTime > now) {
      return { text: "Not Started", color: "#9ca3af", bg: darkMode ? "rgba(156, 163, 175, 0.2)" : "rgba(156, 163, 175, 0.1)" };
    }
    if (endTime < now) {
      return { text: "Closed", color: "#ef4444", bg: darkMode ? "rgba(239, 68, 68, 0.2)" : "rgba(239, 68, 68, 0.1)" };
    }
    if (quiz.isPublished) {
      return { text: "Available", color: "#22c55e", bg: darkMode ? "rgba(34, 197, 94, 0.2)" : "rgba(34, 197, 94, 0.1)" };
    }
    return { text: "Unavailable", color: "#9ca3af", bg: darkMode ? "rgba(156, 163, 175, 0.2)" : "rgba(156, 163, 175, 0.1)" };
  };

  const handleQuizClick = (quizId: string) => {
    // Student: navigate to take quiz
    // Teacher/Admin: navigate to question bank
    if (user?.role === "student") {
      navigate(`/quizz/${courseId}/quiz/${quizId}`);
    } else {
      navigate(`/questionbank/questions/${quizId}`);
    }
  };

  const handlePageChange = (newPage: number) => {
    // Pagination not implemented yet - backend needs to support it
    console.log("Page change requested:", newPage);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div
          className="animate-spin rounded-full h-10 w-10 border-b-2"
          style={{ borderColor: "#6366f1" }}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="p-4 rounded-lg flex items-center gap-2"
        style={{
          backgroundColor: darkMode ? "rgba(239, 68, 68, 0.1)" : "rgba(239, 68, 68, 0.1)",
          border: "1px solid rgba(239, 68, 68, 0.3)",
          color: "#ef4444",
        }}
      >
        <span>{error}</span>
      </div>
    );
  }

  if (quizzes.length === 0) {
    return (
      <div
        className="text-center py-12 rounded-lg"
        style={{
          backgroundColor: darkMode ? "rgba(30, 41, 59, 0.5)" : "#f9fafb",
          border: darkMode ? "1px solid rgba(148, 163, 184, 0.1)" : "1px solid #e5e7eb",
        }}
      >
        <FileText
          className="w-12 h-12 mx-auto mb-4"
          style={{ color: darkMode ? "#6b7280" : "#9ca3af" }}
        />
        <p style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>
          No quizzes available for this course.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* View All Quizzes Button */}
      <div className="flex justify-end">
        <button
          onClick={() => navigate(`/quizz/${courseId}`)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:opacity-90"
          style={{
            backgroundColor: "#6366f1",
            color: "#ffffff",
          }}
        >
          <ExternalLink className="w-4 h-4" />
          View all quizzes for this course
        </button>
      </div>

      {/* Quiz List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {quizzes.map((quiz) => {
          const status = getQuizStatus(quiz);
          const questionCount = quiz.snapshotQuestions?.filter((q) => !q.isDeleted).length || 0;

          return (
            <div
              key={quiz._id}
              onClick={() => handleQuizClick(quiz._id)}
              className="rounded-lg overflow-hidden transition-all duration-200 hover:shadow-lg cursor-pointer"
              style={{
                backgroundColor: darkMode ? "rgba(30, 41, 59, 0.8)" : "#ffffff",
                border: darkMode ? "1px solid rgba(148, 163, 184, 0.1)" : "1px solid #e5e7eb",
              }}
            >
              <div className="p-5">
                {/* Quiz Title */}
                <h3
                  className="text-lg font-semibold mb-2 line-clamp-1"
                  style={{ color: darkMode ? "#ffffff" : "#111827" }}
                >
                  {quiz.title}
                </h3>

                {/* Quiz Description */}
                {quiz.description && (
                  <p
                    className="text-sm mb-4 line-clamp-2"
                    style={{ color: darkMode ? "#94a3b8" : "#6b7280" }}
                  >
                    {quiz.description}
                  </p>
                )}

                {/* Quiz Details */}
                <div className="space-y-2 mb-4">
                  <div
                    className="flex items-center text-sm"
                    style={{ color: darkMode ? "#94a3b8" : "#6b7280" }}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    {questionCount} question{questionCount !== 1 ? "s" : ""}
                  </div>
                  <div
                    className="flex items-center text-sm"
                    style={{ color: darkMode ? "#94a3b8" : "#6b7280" }}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Start: {formatDate(quiz.startTime)}
                  </div>
                  <div
                    className="flex items-center text-sm"
                    style={{ color: darkMode ? "#94a3b8" : "#6b7280" }}
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    End: {formatDate(quiz.endTime)}
                  </div>
                </div>

                {/* Status Badge */}
                <div
                  className="pt-3 border-t"
                  style={{ borderColor: darkMode ? "rgba(148, 163, 184, 0.1)" : "#e5e7eb" }}
                >
                  <span
                    className="inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full"
                    style={{
                      backgroundColor: status.bg,
                      color: status.color,
                    }}
                  >
                    {status.text}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <div
            className="text-sm"
            style={{ color: darkMode ? "#94a3b8" : "#6b7280" }}
          >
            Showing {(pagination.page - 1) * pagination.limit + 1} -{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {pagination.total} quizzes
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={!pagination.hasPrevPage}
              className="p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: darkMode ? "rgba(148, 163, 184, 0.1)" : "#f3f4f6",
                color: darkMode ? "#e2e8f0" : "#374151",
              }}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span
              className="px-3 py-1 text-sm"
              style={{ color: darkMode ? "#e2e8f0" : "#374151" }}
            >
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={!pagination.hasNextPage}
              className="p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: darkMode ? "rgba(148, 163, 184, 0.1)" : "#f3f4f6",
                color: darkMode ? "#e2e8f0" : "#374151",
              }}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizTab;
