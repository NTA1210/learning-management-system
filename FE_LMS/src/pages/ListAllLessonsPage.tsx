import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../hooks/useTheme";
import { useAuth } from "../hooks/useAuth";
import Navbar from "../components/Navbar.tsx";
import Sidebar from "../components/Sidebar.tsx";
import { httpClient } from "../utils/http";
import { Search, Trash, Pencil } from "lucide-react";
import { courseService } from "../services";

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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [availableCourses, setAvailableCourses] = useState<{ _id: string; title: string }[]>([]);
  const [formData, setFormData] = useState({
    courseId: "",
    title: "",
    content: "",
    order: 0,
    durationMinutes: 0,
    publishedAt: "",
  });

  useEffect(() => {
    fetchLessons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageLimit, sortOption]);

  useEffect(() => {
    if (showCreateModal || showEditModal) {
      fetchCourses();
    }
  }, [showCreateModal, showEditModal]);

  const fetchCourses = async () => {
    try {
      const result = await courseService.getAllCourses({ page: 1, limit: 100 });
      setAvailableCourses(result.courses.map(c => ({ _id: c._id, title: c.title })));
    } catch (err) {
      console.error("Error fetching courses:", err);
    }
  };

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

  const showSwalError = async (message: string) => {
    try {
      const Swal = (await import("sweetalert2")).default;
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: message,
        confirmButtonColor: darkMode ? "#4c1d95" : "#4f46e5",
        background: darkMode ? "#1f2937" : "#ffffff",
        color: darkMode ? "#ffffff" : "#1e293b",
      });
    } catch (err) {
      console.error("Error loading SweetAlert2:", err);
      alert(message);
    }
  };

  const showSwalConfirm = async (message: string): Promise<boolean> => {
    try {
      const Swal = (await import("sweetalert2")).default;
      const result = await Swal.fire({
        icon: "warning",
        title: "Confirm",
        text: message,
        showCancelButton: true,
        confirmButtonColor: darkMode ? "#dc2626" : "#ef4444",
        cancelButtonColor: darkMode ? "#4b5563" : "#6b7280",
        confirmButtonText: "Yes",
        cancelButtonText: "No",
        background: darkMode ? "#1f2937" : "#ffffff",
        color: darkMode ? "#ffffff" : "#1e293b",
      });
      return result.isConfirmed;
    } catch (err) {
      console.error("Error loading SweetAlert2:", err);
      return confirm(message);
    }
  };

  const showSwalSuccess = async (message: string) => {
    try {
      const Swal = (await import("sweetalert2")).default;
      await Swal.fire({
        icon: "success",
        title: "Success",
        text: message,
        confirmButtonColor: darkMode ? "#4c1d95" : "#4f46e5",
        background: darkMode ? "#1f2937" : "#ffffff",
        color: darkMode ? "#ffffff" : "#1e293b",
      });
    } catch (err) {
      console.error("Error loading SweetAlert2:", err);
      alert(message);
    }
  };

  const isAdmin = user?.role === 'admin';
  const isTeacher = user?.role === 'teacher';
  const canCreate = isAdmin || isTeacher;

  const handleCreate = () => {
    setFormData({
      courseId: "",
      title: "",
      content: "",
      order: 0,
      durationMinutes: 0,
      publishedAt: "",
    });
    setShowCreateModal(true);
  };

  const handleEdit = (lesson: Lesson) => {
    setEditingLesson(lesson);
    let formattedPublishedAt = "";
    if (lesson.publishedAt) {
      const date = new Date(lesson.publishedAt);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      formattedPublishedAt = `${year}-${month}-${day}`;
    }
    setFormData({
      courseId: lesson.courseId._id,
      title: lesson.title,
      content: lesson.content || "",
      order: lesson.order || 0,
      durationMinutes: lesson.durationMinutes || 0,
      publishedAt: formattedPublishedAt,
    });
    setShowEditModal(true);
  };

  const handleDelete = async (lessonId: string) => {
    const confirmed = await showSwalConfirm("Are you sure you want to delete this lesson?");
    if (!confirmed) return;
    
    try {
      await httpClient.delete(`/lesson/deleteLessons/${lessonId}`, {
        withCredentials: true,
      });
      await showSwalSuccess("Lesson deleted successfully");
      await fetchLessons();
    } catch (err) {
      console.error("Error deleting lesson:", err);
      let errorMessage = "Failed to delete lesson";
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { message?: string } }; message?: string };
        errorMessage = axiosError.response?.data?.message || axiosError.message || errorMessage;
      }
      await showSwalError(errorMessage);
    }
  };

  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: {
        courseId: string;
        title: string;
        content?: string;
        order?: number;
        durationMinutes?: number;
        publishedAt?: string;
      } = {
        courseId: formData.courseId,
        title: formData.title,
      };
      if (formData.content) payload.content = formData.content;
      if (formData.order > 0) payload.order = formData.order;
      if (formData.durationMinutes > 0) payload.durationMinutes = formData.durationMinutes;
      if (formData.publishedAt) payload.publishedAt = new Date(formData.publishedAt).toISOString();

      await httpClient.post("/lesson/createLessons", payload, {
        withCredentials: true,
      });
      await showSwalSuccess("Lesson created successfully");
      setShowCreateModal(false);
      setFormData({
        courseId: "",
        title: "",
        content: "",
        order: 0,
        durationMinutes: 0,
        publishedAt: "",
      });
      await fetchLessons();
    } catch (err) {
      console.error("Error creating lesson:", err);
      let errorMessage = "Failed to create lesson";
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { message?: string } }; message?: string };
        errorMessage = axiosError.response?.data?.message || axiosError.message || errorMessage;
      }
      await showSwalError(errorMessage);
    }
  };

  const handleUpdateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLesson) return;
    
    try {
      const payload: {
        courseId: string;
        title: string;
        content?: string;
        order?: number;
        durationMinutes?: number;
        publishedAt?: string;
      } = {
        courseId: formData.courseId,
        title: formData.title,
      };
      if (formData.content) payload.content = formData.content;
      if (formData.order > 0) payload.order = formData.order;
      if (formData.durationMinutes > 0) payload.durationMinutes = formData.durationMinutes;
      if (formData.publishedAt) payload.publishedAt = new Date(formData.publishedAt).toISOString();

      await httpClient.put(`/lesson/updateLessons/${editingLesson._id}`, payload, {
        withCredentials: true,
      });
      await showSwalSuccess("Lesson updated successfully");
      setShowEditModal(false);
      setEditingLesson(null);
      setFormData({
        courseId: "",
        title: "",
        content: "",
        order: 0,
        durationMinutes: 0,
        publishedAt: "",
      });
      await fetchLessons();
    } catch (err) {
      console.error("Error updating lesson:", err);
      let errorMessage = "Failed to update lesson";
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { message?: string } }; message?: string };
        errorMessage = axiosError.response?.data?.message || axiosError.message || errorMessage;
      }
      await showSwalError(errorMessage);
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
      <Sidebar
        role={(user?.role as "admin" | "teacher" | "student") || "student"}
      />

      <div className="flex flex-col flex-1 w-0 overflow-hidden">
        <main className="flex-1 relative overflow-y-auto focus:outline-none p-4 mt-16 sm:pl-24 md:pl-28">
          <div className="max-w-7xl mx-auto px-4">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <div>
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
                {canCreate && (
                  <button
                    onClick={handleCreate}
                    className="px-6 py-2 rounded-lg text-white transition-all duration-200 hover:shadow-lg"
                    style={{
                      backgroundColor: darkMode ? "#059669" : "#10b981",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = darkMode
                        ? "#047857"
                        : "#059669";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = darkMode
                        ? "#059669"
                        : "#10b981";
                    }}
                  >
                    + Create Lesson
                  </button>
                )}
              </div>
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
                    if (newValue === "") {
                      setCurrentPage(1);
                      fetchLessons("", 1);
                    }
                  }}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  className="w-full px-4 py-2 rounded-lg border transition-colors duration-300"
                  style={{
                    backgroundColor: darkMode
                      ? "rgba(55, 65, 81, 0.8)"
                      : "#ffffff",
                    borderColor: darkMode ? "rgba(75, 85, 99, 0.3)" : "#e5e7eb",
                    color: darkMode ? "#ffffff" : "#000000",
                  }}
                />
              </div>
              <button
                onClick={handleSearch}
                className="p-2 rounded-lg text-white transition-all duration-200 flex items-center justify-center"
                style={{ backgroundColor: darkMode ? "#4c1d95" : "#4f46e5" }}
                onMouseEnter={(e) =>
                  ((e.target as HTMLElement).style.backgroundColor = darkMode
                    ? "#5b21b6"
                    : "#4338ca")
                }
                onMouseLeave={(e) =>
                  ((e.target as HTMLElement).style.backgroundColor = darkMode
                    ? "#4c1d95"
                    : "#4f46e5")
                }
              >
                <Search size={20} />
              </button>
              {/* Sort options: a-z, z-a, old->new, new->old */}
              <div className="relative">
                <select
                  value={sortOption}
                  onChange={(e) =>
                    setSortOption(
                      e.target.value as
                        | "name_asc"
                        | "name_desc"
                        | "date_asc"
                        | "date_desc"
                    )
                  }
                  className="appearance-none rounded-lg px-4 py-2 pr-10 border focus:outline-none focus:ring-2 transition-colors duration-200 shadow-sm"
                  style={{
                    width: 120,
                    fontWeight: 600,
                    background: darkMode ? "#152632" : "#ffffff",
                    color: darkMode ? "#ffffff" : "#111827",
                    borderColor: darkMode ? "#334155" : "#e5e7eb",
                    boxShadow: darkMode
                      ? "0 1px 2px rgba(0,0,0,0.25)"
                      : "0 1px 2px rgba(0,0,0,0.06)",
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
                    style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.23 7.21a.75.75 0 011.06.02L10 10.939l3.71-3.71a.75.75 0 111.06 1.062l-4.24 4.24a.75.75 0 01-1.06 0L5.25 8.29a.75.75 0 01-.02-1.08z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center gap-3 mr-3 flex-wrap">
                <div className="relative">
                  <select
                    value={pageLimit}
                    onChange={(e) => changePageLimit(Number(e.target.value))}
                    className="appearance-none rounded-lg px-4 py-2 pr-10 border focus:outline-none focus:ring-2 transition-colors duration-200 shadow-sm"
                    style={{
                      width: 135,
                      fontWeight: 600,
                      background: darkMode ? "#152632" : "#ffffff",
                      color: darkMode ? "#ffffff" : "#111827",
                      borderColor: darkMode ? "#334155" : "#e5e7eb",
                      boxShadow: darkMode
                        ? "0 1px 2px rgba(0,0,0,0.25)"
                        : "0 1px 2px rgba(0,0,0,0.06)",
                    }}
                  >
                    {[5, 25, 50, 75, 100].map((l) => (
                      <option key={l} value={l}>
                        {l} / page
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.23 7.21a.75.75 0 011.06.02L10 10.939l3.71-3.71a.75.75 0 111.06 1.062l-4.24 4.24a.75.75 0 01-1.06 0L5.25 8.29a.75.75 0 01-.02-1.08z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                </div>
                <span
                  style={{
                    minWidth: 100,
                    fontVariantNumeric: "tabular-nums",
                    color: darkMode ? "#e5e7eb" : "#223344",
                  }}
                >
                  {`${pageLimit * (currentPage - 1) + 1} – ${Math.min(
                    pageLimit * currentPage,
                    totalLessons
                  )} of ${totalLessons}`}
                </span>
                <button
                  className="px-4 py-1 rounded border mx-1 disabled:opacity-40"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage <= 1}
                  title="Previous page"
                  style={{
                    background: darkMode ? "#223344" : "#ffffff",
                    color: darkMode ? "#fff" : "#223344",
                    borderColor: darkMode ? "#334155" : "#e5e7eb",
                  }}
                >
                  &#x2039;
                </button>
                <button
                  className="px-4 py-1 rounded border mx-1 disabled:opacity-40"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={pageLimit * currentPage >= totalLessons}
                  title="Next page"
                  style={{
                    background: darkMode ? "#223344" : "#ffffff",
                    color: darkMode ? "#fff" : "#223344",
                    borderColor: darkMode ? "#334155" : "#e5e7eb",
                  }}
                >
                  &#x203A;
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div
                className="p-4 rounded-lg mb-6 flex items-center"
                style={{
                  backgroundColor: darkMode
                    ? "rgba(239, 68, 68, 0.1)"
                    : "#fee2e2",
                  color: darkMode ? "#fca5a5" : "#dc2626",
                }}
              >
                <svg
                  className="w-5 h-5 mr-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                {error}
              </div>
            )}

            {/* Loading State */}
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div
                  className="animate-spin rounded-full h-12 w-12 border-b-2"
                  style={{ borderColor: darkMode ? "#6366f1" : "#4f46e5" }}
                ></div>
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
                        backgroundColor: darkMode
                          ? "rgba(31, 41, 55, 0.8)"
                          : "rgba(255, 255, 255, 0.9)",
                        border: darkMode
                          ? "1px solid rgba(75, 85, 99, 0.3)"
                          : "1px solid rgba(229, 231, 235, 0.5)",
                      }}
                    >
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          {/* Course Badge */}
                          <span
                            className="inline-block px-3 py-1 text-xs font-semibold rounded-full"
                            style={{
                              backgroundColor: darkMode
                                ? "rgba(99, 102, 241, 0.2)"
                                : "rgba(99, 102, 241, 0.1)",
                              color: darkMode ? "#a5b4fc" : "#6366f1",
                            }}
                          >
                            {lesson.courseId.title}
                          </span>
                          {canCreate && (
                            <div
                              className="flex items-center gap-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEdit(lesson);
                                }}
                                className="p-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105 hover:shadow-md flex items-center gap-1"
                                style={{
                                  backgroundColor: darkMode
                                    ? "rgba(99, 102, 241, 0.2)"
                                    : "#eef2ff",
                                  color: darkMode ? "#a5b4fc" : "#4f46e5",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor =
                                    darkMode
                                      ? "rgba(99, 102, 241, 0.3)"
                                      : "#e0e7ff";
                                  e.currentTarget.style.transform =
                                    "scale(1.05)";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor =
                                    darkMode
                                      ? "rgba(99, 102, 241, 0.2)"
                                      : "#eef2ff";
                                  e.currentTarget.style.transform = "scale(1)";
                                }}
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(lesson._id);
                                }}
                                className="p-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105 hover:shadow-md flex items-center gap-1"
                                style={{
                                  backgroundColor: darkMode
                                    ? "rgba(239, 68, 68, 0.2)"
                                    : "#fee2e2",
                                  color: darkMode ? "#fca5a5" : "#dc2626",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor =
                                    darkMode
                                      ? "rgba(239, 68, 68, 0.3)"
                                      : "#fecaca";
                                  e.currentTarget.style.transform =
                                    "scale(1.05)";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor =
                                    darkMode
                                      ? "rgba(239, 68, 68, 0.2)"
                                      : "#fee2e2";
                                  e.currentTarget.style.transform = "scale(1)";
                                }}
                              >
                                <Trash size={14} />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Lesson Title */}
                        <h3
                          onClick={() => navigate(`/materials/${lesson._id}`)}
                          className="text-xl font-semibold mb-2 cursor-pointer hover:underline"
                          style={{ color: darkMode ? "#ffffff" : "#1f2937" }}
                        >
                          {lesson.title}
                        </h3>

                        {/* Lesson Content Preview */}
                        <p
                          onClick={() => navigate(`/materials/${lesson._id}`)}
                          className="text-sm mb-4 line-clamp-2 cursor-pointer"
                          style={{ color: darkMode ? "#d1d5db" : "#6b7280" }}
                        >
                          {lesson.content}
                        </p>

                        {/* Lesson Details */}
                        <div className="space-y-2 mb-4">
                          <div
                            className="flex items-center text-sm"
                            style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}
                          >
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
                          <div
                            className="flex items-center text-sm"
                            style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}
                          >
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
                          <div
                            className="flex items-center text-sm"
                            style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}
                          >
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
                        <div
                          className="flex items-center justify-between pt-4 border-t"
                          style={{
                            borderColor: darkMode
                              ? "rgba(75, 85, 99, 0.3)"
                              : "rgba(229, 231, 235, 0.5)",
                          }}
                        >
                          <div className="flex items-center">
                            {lesson.hasAccess ? (
                              <span
                                className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded"
                                style={{
                                  backgroundColor: darkMode
                                    ? "rgba(34, 197, 94, 0.2)"
                                    : "rgba(34, 197, 94, 0.1)",
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
                                  backgroundColor: darkMode
                                    ? "rgba(239, 68, 68, 0.2)"
                                    : "rgba(239, 68, 68, 0.1)",
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
                                backgroundColor: darkMode
                                  ? "rgba(59, 130, 246, 0.2)"
                                  : "rgba(59, 130, 246, 0.1)",
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

      {/* Create Lesson Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-[9999] p-4 flex items-center justify-center transition-all duration-300 bg-black/40"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCreateModal(false);
            }
          }}
        >
          <div
            className="w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto"
            style={{
              backgroundColor: darkMode ? "#0b132b" : "#ffffff",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex items-center justify-between px-6 py-4 sticky top-0"
              style={{
                borderBottom: darkMode
                  ? "1px solid rgba(255,255,255,0.06)"
                  : "1px solid #eee",
                backgroundColor: darkMode ? "#0b132b" : "#ffffff",
              }}
            >
              <h3
                className="text-xl font-semibold"
                style={{ color: darkMode ? "#ffffff" : "#111827" }}
              >
                Create Lesson
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-3 py-1 rounded-lg text-sm"
                style={{
                  backgroundColor: darkMode ? "#1f2937" : "#f3f4f6",
                  color: darkMode ? "#e5e7eb" : "#111827",
                }}
              >
                Close
              </button>
            </div>

            <form onSubmit={handleCreateLesson} className="px-6 py-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="md:col-span-2">
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: darkMode ? "#cbd5e1" : "#374151" }}
                  >
                    LessionLession *
                  </label>
                  <input
                    type="text"
                    value={formData.courseId}
                    onChange={(e) =>
                      setFormData({ ...formData, courseId: e.target.value })
                    }
                    className="w-full px-4 py-2 rounded-lg border"
                    style={{
                      backgroundColor: darkMode
                        ? "rgba(55, 65, 81, 0.8)"
                        : "#ffffff",
                      borderColor: darkMode
                        ? "rgba(75, 85, 99, 0.3)"
                        : "#e5e7eb",
                      color: darkMode ? "#ffffff" : "#000000",
                    }}
                    placeholder="Enter lession (e.g. ReactJS... )"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: darkMode ? "#cbd5e1" : "#374151" }}
                  >
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full px-4 py-2 rounded-lg border"
                    style={{
                      backgroundColor: darkMode
                        ? "rgba(55, 65, 81, 0.8)"
                        : "#ffffff",
                      borderColor: darkMode
                        ? "rgba(75, 85, 99, 0.3)"
                        : "#e5e7eb",
                      color: darkMode ? "#ffffff" : "#000000",
                    }}
                    placeholder="Lesson Title"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: darkMode ? "#cbd5e1" : "#374151" }}
                  >
                    Content
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) =>
                      setFormData({ ...formData, content: e.target.value })
                    }
                    className="w-full px-4 py-2 rounded-lg border h-32"
                    style={{
                      backgroundColor: darkMode
                        ? "rgba(55, 65, 81, 0.8)"
                        : "#ffffff",
                      borderColor: darkMode
                        ? "rgba(75, 85, 99, 0.3)"
                        : "#e5e7eb",
                      color: darkMode ? "#ffffff" : "#000000",
                    }}
                    placeholder="Lesson content..."
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: darkMode ? "#cbd5e1" : "#374151" }}
                  >
                    Order
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.order}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        order: Number(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 rounded-lg border"
                    style={{
                      backgroundColor: darkMode
                        ? "rgba(55, 65, 81, 0.8)"
                        : "#ffffff",
                      borderColor: darkMode
                        ? "rgba(75, 85, 99, 0.3)"
                        : "#e5e7eb",
                      color: darkMode ? "#ffffff" : "#000000",
                    }}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: darkMode ? "#cbd5e1" : "#374151" }}
                  >
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.durationMinutes}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        durationMinutes: Number(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 rounded-lg border"
                    style={{
                      backgroundColor: darkMode
                        ? "rgba(55, 65, 81, 0.8)"
                        : "#ffffff",
                      borderColor: darkMode
                        ? "rgba(75, 85, 99, 0.3)"
                        : "#e5e7eb",
                      color: darkMode ? "#ffffff" : "#000000",
                    }}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: darkMode ? "#cbd5e1" : "#374151" }}
                  >
                    Published At
                  </label>
                  <input
                    type="date"
                    value={formData.publishedAt}
                    onChange={(e) =>
                      setFormData({ ...formData, publishedAt: e.target.value })
                    }
                    className="w-full px-4 py-2 rounded-lg border"
                    style={{
                      backgroundColor: darkMode
                        ? "rgba(55, 65, 81, 0.8)"
                        : "#ffffff",
                      borderColor: darkMode
                        ? "rgba(75, 85, 99, 0.3)"
                        : "#e5e7eb",
                      color: darkMode ? "#ffffff" : "#000000",
                    }}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 px-1">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg"
                  style={{
                    backgroundColor: darkMode ? "#1f2937" : "#e5e7eb",
                    color: darkMode ? "#e5e7eb" : "#111827",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg text-white font-medium transition-all duration-200"
                  style={{ backgroundColor: darkMode ? "#4c1d95" : "#4f46e5" }}
                  onMouseEnter={(e) => {
                    (
                      e.currentTarget as HTMLButtonElement
                    ).style.backgroundColor = darkMode ? "#5b21b6" : "#4338ca";
                  }}
                  onMouseLeave={(e) => {
                    (
                      e.currentTarget as HTMLButtonElement
                    ).style.backgroundColor = darkMode ? "#4c1d95" : "#4f46e5";
                  }}
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Lesson Modal */}
      {showEditModal && editingLesson && (
        <div
          className="fixed inset-0 z-[9999] p-4 flex items-center justify-center transition-all duration-300 bg-black/40"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowEditModal(false);
              setEditingLesson(null);
            }
          }}
        >
          <div
            className="w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto"
            style={{
              backgroundColor: darkMode ? "#0b132b" : "#ffffff",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex items-center justify-between px-6 py-4 sticky top-0"
              style={{
                borderBottom: darkMode
                  ? "1px solid rgba(255,255,255,0.06)"
                  : "1px solid #eee",
                backgroundColor: darkMode ? "#0b132b" : "#ffffff",
              }}
            >
              <h3
                className="text-xl font-semibold"
                style={{ color: darkMode ? "#ffffff" : "#111827" }}
              >
                Edit Lesson
              </h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingLesson(null);
                }}
                className="px-3 py-1 rounded-lg text-sm"
                style={{
                  backgroundColor: darkMode ? "#1f2937" : "#f3f4f6",
                  color: darkMode ? "#e5e7eb" : "#111827",
                }}
              >
                Close
              </button>
            </div>

            <form onSubmit={handleUpdateLesson} className="px-6 py-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="md:col-span-2">
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: darkMode ? "#cbd5e1" : "#374151" }}
                  >
                    Course *
                  </label>
                  <select
                    value={formData.courseId}
                    onChange={(e) =>
                      setFormData({ ...formData, courseId: e.target.value })
                    }
                    className="w-full px-4 py-2 rounded-lg border"
                    style={{
                      backgroundColor: darkMode
                        ? "rgba(55, 65, 81, 0.8)"
                        : "#ffffff",
                      borderColor: darkMode
                        ? "rgba(75, 85, 99, 0.3)"
                        : "#e5e7eb",
                      color: darkMode ? "#ffffff" : "#000000",
                    }}
                    required
                  >
                    <option value="">Select a course</option>
                    {availableCourses.map((course) => (
                      <option key={course._id} value={course._id}>
                        {course.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: darkMode ? "#cbd5e1" : "#374151" }}
                  >
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full px-4 py-2 rounded-lg border"
                    style={{
                      backgroundColor: darkMode
                        ? "rgba(55, 65, 81, 0.8)"
                        : "#ffffff",
                      borderColor: darkMode
                        ? "rgba(75, 85, 99, 0.3)"
                        : "#e5e7eb",
                      color: darkMode ? "#ffffff" : "#000000",
                    }}
                    placeholder="Lesson Title"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: darkMode ? "#cbd5e1" : "#374151" }}
                  >
                    Content
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) =>
                      setFormData({ ...formData, content: e.target.value })
                    }
                    className="w-full px-4 py-2 rounded-lg border h-32"
                    style={{
                      backgroundColor: darkMode
                        ? "rgba(55, 65, 81, 0.8)"
                        : "#ffffff",
                      borderColor: darkMode
                        ? "rgba(75, 85, 99, 0.3)"
                        : "#e5e7eb",
                      color: darkMode ? "#ffffff" : "#000000",
                    }}
                    placeholder="Lesson content..."
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: darkMode ? "#cbd5e1" : "#374151" }}
                  >
                    Order
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.order}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        order: Number(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 rounded-lg border"
                    style={{
                      backgroundColor: darkMode
                        ? "rgba(55, 65, 81, 0.8)"
                        : "#ffffff",
                      borderColor: darkMode
                        ? "rgba(75, 85, 99, 0.3)"
                        : "#e5e7eb",
                      color: darkMode ? "#ffffff" : "#000000",
                    }}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: darkMode ? "#cbd5e1" : "#374151" }}
                  >
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.durationMinutes}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        durationMinutes: Number(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 rounded-lg border"
                    style={{
                      backgroundColor: darkMode
                        ? "rgba(55, 65, 81, 0.8)"
                        : "#ffffff",
                      borderColor: darkMode
                        ? "rgba(75, 85, 99, 0.3)"
                        : "#e5e7eb",
                      color: darkMode ? "#ffffff" : "#000000",
                    }}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: darkMode ? "#cbd5e1" : "#374151" }}
                  >
                    Published At
                  </label>
                  <input
                    type="date"
                    value={formData.publishedAt}
                    onChange={(e) =>
                      setFormData({ ...formData, publishedAt: e.target.value })
                    }
                    className="w-full px-4 py-2 rounded-lg border"
                    style={{
                      backgroundColor: darkMode
                        ? "rgba(55, 65, 81, 0.8)"
                        : "#ffffff",
                      borderColor: darkMode
                        ? "rgba(75, 85, 99, 0.3)"
                        : "#e5e7eb",
                      color: darkMode ? "#ffffff" : "#000000",
                    }}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 px-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingLesson(null);
                  }}
                  className="px-4 py-2 rounded-lg"
                  style={{
                    backgroundColor: darkMode ? "#1f2937" : "#e5e7eb",
                    color: darkMode ? "#e5e7eb" : "#111827",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg text-white font-medium transition-all duration-200"
                  style={{ backgroundColor: darkMode ? "#4c1d95" : "#4f46e5" }}
                  onMouseEnter={(e) => {
                    (
                      e.currentTarget as HTMLButtonElement
                    ).style.backgroundColor = darkMode ? "#5b21b6" : "#4338ca";
                  }}
                  onMouseLeave={(e) => {
                    (
                      e.currentTarget as HTMLButtonElement
                    ).style.backgroundColor = darkMode ? "#4c1d95" : "#4f46e5";
                  }}
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListAllLessonsPage;

