import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../hooks/useTheme";
import { useAuth } from "../hooks/useAuth";
import Navbar from "../components/Navbar.tsx";
import Sidebar from "../components/Sidebar.tsx";
import { httpClient } from "../utils/http";
import { Search } from "lucide-react";

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
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const { user } = useAuth();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState<'name_asc' | 'name_desc' | 'date_asc' | 'date_desc'>('date_desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLimit, setPageLimit] = useState(25);
  const [totalLessons, setTotalLessons] = useState(0);

  useEffect(() => {
    fetchLessons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageLimit, sortOption]);

  const changePageLimit = (limit: number) => {
    setPageLimit(limit);
    setCurrentPage(1);
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchLessons();
  };

  const fetchLessons = async (customSearchTerm?: string, customPage?: number) => {
    setLoading(true);
    setError("");
    try {
      // Build query params
      const pageToUse = customPage !== undefined ? customPage : currentPage;
      const params: Record<string, string | number> = {
        page: pageToUse,
        limit: pageLimit,
      };

      const termToUse = customSearchTerm !== undefined ? customSearchTerm : searchTerm;
      if (termToUse) {
        params.search = termToUse;
      }

      // Map sort option to API params
      const isName = sortOption === 'name_asc' || sortOption === 'name_desc';
      const order = sortOption.endsWith('asc') ? 'asc' : 'desc';
      if (isName) {
        params.sortBy = 'title';
      } else {
        params.sortBy = 'createdAt';
      }
      params.sortOrder = order;

      const response = await httpClient.get<ApiResponse>("/lesson/listAllLessons", {
        params,
        withCredentials: true,
      });

      const data = response.data;
      if (data.success && data.data) {
        setLessons(data.data);
        if (data.pagination) {
          setTotalLessons(data.pagination.total || 0);
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

            {/* Search and Filter Controls */}
            <div className="mb-6 flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search lessons..."
                  value={searchTerm}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    setSearchTerm(newValue);
                    // Auto search when input is cleared
                    if (newValue === '') {
                      setCurrentPage(1);
                      fetchLessons('', 1);
                    }
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full px-4 py-2 rounded-lg border transition-colors duration-300"
                  style={{
                    backgroundColor: darkMode ? 'rgba(55, 65, 81, 0.8)' : '#ffffff',
                    borderColor: darkMode ? 'rgba(75, 85, 99, 0.3)' : '#e5e7eb',
                    color: darkMode ? '#ffffff' : '#000000',
                  }}
                />
              </div>
              <button
                onClick={handleSearch}
                className="p-2 rounded-lg text-white transition-all duration-200 flex items-center justify-center"
                style={{ backgroundColor: darkMode ? '#4c1d95' : '#4f46e5' }}
                onMouseEnter={(e) =>
                  ((e.target as HTMLElement).style.backgroundColor = darkMode ? '#5b21b6' : '#4338ca')
                }
                onMouseLeave={(e) =>
                  ((e.target as HTMLElement).style.backgroundColor = darkMode ? '#4c1d95' : '#4f46e5')
                }
              >
                <Search size={20} />
              </button>
              {/* Sort options: a-z, z-a, old->new, new->old */}
              <div className="relative">
                <select
                  value={sortOption}
                  onChange={e => setSortOption(e.target.value as 'name_asc'|'name_desc'|'date_asc'|'date_desc')}
                  className="appearance-none rounded-lg px-4 py-2 pr-10 border focus:outline-none focus:ring-2 transition-colors duration-200 shadow-sm"
                  style={{
                    width: 120,
                    fontWeight: 600,
                    background: darkMode ? '#152632' : '#ffffff',
                    color: darkMode ? '#ffffff' : '#111827',
                    borderColor: darkMode ? '#334155' : '#e5e7eb',
                    boxShadow: darkMode ? '0 1px 2px rgba(0,0,0,0.25)' : '0 1px 2px rgba(0,0,0,0.06)'
                  }}
                >
                  <option value="name_asc">A-Z</option>
                  <option value="name_desc">Z-A</option>
                  <option value="date_asc">Oldest</option>
                  <option value="date_desc">Newest</option>
                </select>
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}
                    aria-hidden="true"
                  >
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.939l3.71-3.71a.75.75 0 111.06 1.062l-4.24 4.24a.75.75 0 01-1.06 0L5.25 8.29a.75.75 0 01-.02-1.08z" clipRule="evenodd" />
                  </svg>
                </span>
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center gap-3 mr-3 flex-wrap">
                <div className="relative">
                  <select
                    value={pageLimit}
                    onChange={e => changePageLimit(Number(e.target.value))}
                    className="appearance-none rounded-lg px-4 py-2 pr-10 border focus:outline-none focus:ring-2 transition-colors duration-200 shadow-sm"
                    style={{
                      width: 135,
                      fontWeight: 600,
                      background: darkMode ? '#152632' : '#ffffff',
                      color: darkMode ? '#ffffff' : '#111827',
                      borderColor: darkMode ? '#334155' : '#e5e7eb',
                      boxShadow: darkMode ? '0 1px 2px rgba(0,0,0,0.25)' : '0 1px 2px rgba(0,0,0,0.06)'
                    }}
                  >
                    {[5, 25, 50, 75, 100].map(l => (
                      <option key={l} value={l}>{l} / page</option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}
                      aria-hidden="true"
                    >
                      <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.939l3.71-3.71a.75.75 0 111.06 1.062l-4.24 4.24a.75.75 0 01-1.06 0L5.25 8.29a.75.75 0 01-.02-1.08z" clipRule="evenodd" />
                    </svg>
                  </span>
                </div>
                <span style={{
                  minWidth: 100,
                  fontVariantNumeric: 'tabular-nums',
                  color: darkMode ? '#e5e7eb' : '#223344'
                }}>
                  {`${(pageLimit * (currentPage - 1)) + 1} – ${Math.min(pageLimit * currentPage, totalLessons)} of ${totalLessons}`}
                </span>
                <button
                  className="px-4 py-1 rounded border mx-1 disabled:opacity-40"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage <= 1}
                  title="Previous page"
                  style={{
                    background: darkMode ? '#223344' : '#ffffff',
                    color: darkMode ? '#fff' : '#223344',
                    borderColor: darkMode ? '#334155' : '#e5e7eb'
                  }}
                >&#x2039;</button>
                <button
                  className="px-4 py-1 rounded border mx-1 disabled:opacity-40"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={(pageLimit * currentPage) >= totalLessons}
                  title="Next page"
                  style={{
                    background: darkMode ? '#223344' : '#ffffff',
                    color: darkMode ? '#fff' : '#223344',
                    borderColor: darkMode ? '#334155' : '#e5e7eb'
                  }}
                >&#x203A;</button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div
                className="p-4 rounded-lg mb-6 flex items-center"
                style={{
                  backgroundColor: darkMode ? 'rgba(239, 68, 68, 0.1)' : '#fee2e2',
                  color: darkMode ? '#fca5a5' : '#dc2626'
                }}
              >
                <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
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
                      onClick={() => navigate(`/materials/${lesson._id}`)}
                      className="rounded-lg shadow-md overflow-hidden transition-all duration-200 hover:shadow-lg cursor-pointer"
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

              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ListAllLessonsPage;

