import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../hooks/useTheme";
import { useAuth } from "../hooks/useAuth";
import Navbar from "../components/Navbar.tsx";
import Sidebar from "../components/Sidebar.tsx";
import { httpClient } from "../utils/http";
import { Search, Calendar, User, Award, Clock } from "lucide-react";

interface Course {
  _id: string;
  title: string;
}

interface CreatedBy {
  _id: string;
  username: string;
  email: string;
  fullname: string;
}

interface Assignment {
  _id: string;
  courseId: Course;
  title: string;
  description: string;
  createdBy: CreatedBy;
  maxScore: number;
  dueDate: string;
  allowLate: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data: Assignment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

const AssignmentPage: React.FC = () => {
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState<'name_asc' | 'name_desc' | 'date_asc' | 'date_desc'>('date_desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLimit, setPageLimit] = useState(25);
  const [totalAssignments, setTotalAssignments] = useState(0);

  useEffect(() => {
    fetchAssignments();
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
    fetchAssignments();
  };

  const fetchAssignments = async (customSearchTerm?: string, customPage?: number) => {
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

      const response = await httpClient.get<ApiResponse>("/assignments", {
        params,
        withCredentials: true,
      });

      const data = response.data;
      if (data.success && data.data) {
        setAssignments(data.data);
        if (data.pagination) {
          setTotalAssignments(data.pagination.total || 0);
        }
      } else {
        setError(data.message || "Failed to load assignments");
      }
    } catch (err) {
      console.error("Error fetching assignments:", err);
      let errorMessage = "An error occurred while fetching assignments";
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

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getDueDateStatus = (dueDate: string) => {
    const daysUntilDue = getDaysUntilDue(dueDate);
    if (daysUntilDue < 0) {
      return { text: "Overdue", color: darkMode ? "#fca5a5" : "#dc2626", bg: darkMode ? "rgba(239, 68, 68, 0.2)" : "rgba(239, 68, 68, 0.1)" };
    } else if (daysUntilDue === 0) {
      return { text: "Due today", color: darkMode ? "#fbbf24" : "#d97706", bg: darkMode ? "rgba(251, 191, 36, 0.2)" : "rgba(251, 191, 36, 0.1)" };
    } else if (daysUntilDue <= 3) {
      return { text: `Due in ${daysUntilDue} day${daysUntilDue > 1 ? 's' : ''}`, color: darkMode ? "#fbbf24" : "#d97706", bg: darkMode ? "rgba(251, 191, 36, 0.2)" : "rgba(251, 191, 36, 0.1)" };
    } else {
      return { text: `Due in ${daysUntilDue} days`, color: darkMode ? "#86efac" : "#16a34a", bg: darkMode ? "rgba(34, 197, 94, 0.2)" : "rgba(34, 197, 94, 0.1)" };
    }
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
                Assignments
              </h1>
              <p style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>
                Browse all available assignments across courses
              </p>
            </div>

            {/* Search and Filter Controls */}
            <div className="mb-6 flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search assignments..."
                  value={searchTerm}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    setSearchTerm(newValue);
                    // Auto search when input is cleared
                    if (newValue === '') {
                      setCurrentPage(1);
                      fetchAssignments('', 1);
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
                  {`${(pageLimit * (currentPage - 1)) + 1} – ${Math.min(pageLimit * currentPage, totalAssignments)} of ${totalAssignments}`}
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
                  disabled={(pageLimit * currentPage) >= totalAssignments}
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
            ) : assignments.length === 0 ? (
              <div className="text-center py-12">
                <p style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>
                  No assignments available at the moment.
                </p>
              </div>
            ) : (
              <>
                {/* Assignments Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {assignments.map((assignment) => {
                    const dueStatus = getDueDateStatus(assignment.dueDate);
                    return (
                      <div
                        key={assignment._id}
                        onClick={() => navigate(`/assignments/${assignment._id}`)}
                        className="rounded-lg shadow-md overflow-hidden transition-all duration-200 hover:shadow-lg cursor-pointer flex flex-col"
                        style={{
                          backgroundColor: darkMode ? "rgba(31, 41, 55, 0.8)" : "rgba(255, 255, 255, 0.9)",
                          border: darkMode ? "1px solid rgba(75, 85, 99, 0.3)" : "1px solid rgba(229, 231, 235, 0.5)",
                        }}
                      >
                        <div className="p-6 flex flex-col flex-1">
                          {/* Course Badge */}
                          <div className="mb-3">
                            <span
                              className="inline-block px-3 py-1 text-xs font-semibold rounded-full"
                              style={{
                                backgroundColor: darkMode ? "rgba(99, 102, 241, 0.2)" : "rgba(99, 102, 241, 0.1)",
                                color: darkMode ? "#a5b4fc" : "#6366f1",
                              }}
                            >
                              {assignment.courseId.title}
                            </span>
                          </div>

                          {/* Assignment Title */}
                          <h3
                            className="text-xl font-semibold mb-2"
                            style={{ color: darkMode ? "#ffffff" : "#1f2937" }}
                          >
                            {assignment.title}
                          </h3>

                          {/* Assignment Description */}
                          <p
                            className="text-sm mb-4 line-clamp-2"
                            style={{ color: darkMode ? "#d1d5db" : "#6b7280" }}
                          >
                            {assignment.description}
                          </p>

                          {/* Assignment Details */}
                          <div className="space-y-2 mb-4">
                            <div className="flex items-center text-sm" style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>
                              <Award className="w-4 h-4 mr-2" />
                              Max Score: {assignment.maxScore} points
                            </div>
                            <div className="flex items-center text-sm" style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>
                              <Calendar className="w-4 h-4 mr-2" />
                              Due: {formatDate(assignment.dueDate)}
                            </div>
                            <div className="flex items-center text-sm" style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>
                              <User className="w-4 h-4 mr-2" />
                              Created by: {assignment.createdBy.fullname || assignment.createdBy.username}
                            </div>
                            {assignment.allowLate && (
                              <div className="flex items-center text-sm" style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>
                                <Clock className="w-4 h-4 mr-2" />
                                Late submissions allowed
                              </div>
                            )}
                          </div>

                          {/* Due Date Status */}
                          <div className="flex items-center justify-between pt-4 mt-auto border-t gap-2 min-h-[32px]" style={{ borderColor: darkMode ? "rgba(75, 85, 99, 0.3)" : "rgba(229, 231, 235, 0.5)" }}>
                            <span
                              className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded whitespace-nowrap flex-shrink-0"
                              style={{
                                backgroundColor: dueStatus.bg,
                                color: dueStatus.color,
                                minHeight: '24px',
                                maxWidth: '100%',
                              }}
                            >
                              {dueStatus.text}
                            </span>
                            {!assignment.allowLate ? (
                              <span
                                className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded whitespace-nowrap flex-shrink-0"
                                style={{
                                  backgroundColor: darkMode ? "rgba(239, 68, 68, 0.2)" : "rgba(239, 68, 68, 0.1)",
                                  color: darkMode ? "#fca5a5" : "#dc2626",
                                  minHeight: '24px',
                                }}
                              >
                                No late submissions
                              </span>
                            ) : (
                              <span className="inline-flex items-center flex-shrink-0" style={{ minHeight: '24px', width: '0' }}></span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AssignmentPage;

