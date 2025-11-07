import React, { useState, useEffect } from "react";
import { useTheme } from "../hooks/useTheme";
import { useAuth } from "../hooks/useAuth";
import Navbar from "../components/Navbar.tsx";
import Sidebar from "../components/Sidebar.tsx";
import { httpClient } from "../utils/http";

interface Course {
  _id: string;
  title: string;
  description: string;
  teacherIds: string[];
  isPublished: boolean;
}

interface Lesson {
  _id: string;
  title: string;
  courseId: Course;
  content: string;
  order: number;
  durationMinutes: number;
  isPublished: boolean;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
  hasAccess: boolean;
  accessReason: string;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data: Lesson[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

const ListAllLessonsPage: React.FC = () => {
  const { darkMode } = useTheme();
  const { user } = useAuth();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });

  useEffect(() => {
    fetchLessons();
  }, []);

  const fetchLessons = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await httpClient.get<ApiResponse>("/lesson/listAllLessons", {
        withCredentials: true,
      });

      const data = response.data;
      if (data.success && data.data) {
        setLessons(data.data);
        if (data.pagination) {
          setPagination(data.pagination);
        }
      } else {
        setError(data.message || "Failed to load lessons");
      }
    } catch (err) {
      console.error("Error fetching lessons:", err);
      let errorMessage = "An error occurred while fetching lessons";
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { message?: string } }; message?: string };
        errorMessage = axiosError.response?.data?.message || axiosError.message || errorMessage;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div
      className="flex h-screen overflow-hidden relative"
      style={{
        backgroundColor: darkMode ? "#1a202c" : "#f8fafc",
        color: darkMode ? "#ffffff" : "#1e293b",
      }}
    >
      <Navbar />
      <Sidebar role={(user?.role as "admin" | "teacher" | "student") || "student"} />

      <div className="flex flex-col flex-1 w-0 overflow-hidden">
        <main className="flex-1 relative overflow-y-auto focus:outline-none p-4 mt-16 sm:pl-24 md:pl-28">
          <div className="max-w-7xl mx-auto px-4">
            {/* Header */}
            <div className="mb-8">
              <h1
                className="text-3xl font-bold mb-2"
                style={{ color: darkMode ? "#ffffff" : "#1f2937" }}
              >
                Lesson Materials
              </h1>
              <p style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>
                Browse all available lessons across courses
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div
                className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded"
                role="alert"
              >
                <p>{error}</p>
              </div>
            )}

            {/* Loading State */}
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: darkMode ? "#6366f1" : "#4f46e5" }}></div>
              </div>
            ) : lessons.length === 0 ? (
              <div className="text-center py-12">
                <p style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>
                  No lessons available at the moment.
                </p>
              </div>
            ) : (
              <>
                {/* Lessons Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {lessons.map((lesson) => (
                    <div
                      key={lesson._id}
                      className="rounded-lg shadow-md overflow-hidden transition-all duration-200 hover:shadow-lg"
                      style={{
                        backgroundColor: darkMode ? "rgba(31, 41, 55, 0.8)" : "rgba(255, 255, 255, 0.9)",
                        border: darkMode ? "1px solid rgba(75, 85, 99, 0.3)" : "1px solid rgba(229, 231, 235, 0.5)",
                      }}
                    >
                      <div className="p-6">
                        {/* Course Badge */}
                        <div className="mb-3">
                          <span
                            className="inline-block px-3 py-1 text-xs font-semibold rounded-full"
                            style={{
                              backgroundColor: darkMode ? "rgba(99, 102, 241, 0.2)" : "rgba(99, 102, 241, 0.1)",
                              color: darkMode ? "#a5b4fc" : "#6366f1",
                            }}
                          >
                            {lesson.courseId.title}
                          </span>
                        </div>

                        {/* Lesson Title */}
                        <h3
                          className="text-xl font-semibold mb-2"
                          style={{ color: darkMode ? "#ffffff" : "#1f2937" }}
                        >
                          {lesson.title}
                        </h3>

                        {/* Lesson Content Preview */}
                        <p
                          className="text-sm mb-4 line-clamp-2"
                          style={{ color: darkMode ? "#d1d5db" : "#6b7280" }}
                        >
                          {lesson.content}
                        </p>

                        {/* Lesson Details */}
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center text-sm" style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>
                            <svg
                              className="w-4 h-4 mr-2"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            {formatDuration(lesson.durationMinutes)}
                          </div>
                          <div className="flex items-center text-sm" style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>
                            <svg
                              className="w-4 h-4 mr-2"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                              />
                            </svg>
                            Order: {lesson.order}
                          </div>
                          <div className="flex items-center text-sm" style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>
                            <svg
                              className="w-4 h-4 mr-2"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                            {formatDate(lesson.publishedAt)}
                          </div>
                        </div>

                        {/* Access Status */}
                        <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: darkMode ? "rgba(75, 85, 99, 0.3)" : "rgba(229, 231, 235, 0.5)" }}>
                          <div className="flex items-center">
                            {lesson.hasAccess ? (
                              <span
                                className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded"
                                style={{
                                  backgroundColor: darkMode ? "rgba(34, 197, 94, 0.2)" : "rgba(34, 197, 94, 0.1)",
                                  color: darkMode ? "#86efac" : "#16a34a",
                                }}
                              >
                                <svg
                                  className="w-3 h-3 mr-1"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                Accessible
                              </span>
                            ) : (
                              <span
                                className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded"
                                style={{
                                  backgroundColor: darkMode ? "rgba(239, 68, 68, 0.2)" : "rgba(239, 68, 68, 0.1)",
                                  color: darkMode ? "#fca5a5" : "#dc2626",
                                }}
                              >
                                <svg
                                  className="w-3 h-3 mr-1"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                No Access
                              </span>
                            )}
                          </div>
                          {lesson.isPublished && (
                            <span
                              className="text-xs px-2 py-1 rounded"
                              style={{
                                backgroundColor: darkMode ? "rgba(59, 130, 246, 0.2)" : "rgba(59, 130, 246, 0.1)",
                                color: darkMode ? "#93c5fd" : "#2563eb",
                              }}
                            >
                              Published
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination Info */}
                {pagination.totalPages > 1 && (
                  <div
                    className="flex items-center justify-between p-4 rounded-lg"
                    style={{
                      backgroundColor: darkMode ? "rgba(31, 41, 55, 0.8)" : "rgba(255, 255, 255, 0.9)",
                      border: darkMode ? "1px solid rgba(75, 85, 99, 0.3)" : "1px solid rgba(229, 231, 235, 0.5)",
                    }}
                  >
                    <p style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>
                      Showing {((pagination.page - 1) * pagination.limit) + 1} to{" "}
                      {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                      {pagination.total} lessons
                    </p>
                    <div className="flex gap-2">
                      <button
                        disabled={!pagination.hasPrev}
                        className="px-4 py-2 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{
                          backgroundColor: darkMode ? "#4f46e5" : "#6366f1",
                          color: "#ffffff",
                        }}
                      >
                        Previous
                      </button>
                      <button
                        disabled={!pagination.hasNext}
                        className="px-4 py-2 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{
                          backgroundColor: darkMode ? "#4f46e5" : "#6366f1",
                          color: "#ffffff",
                        }}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ListAllLessonsPage;

