import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../hooks/useTheme";
import { useAuth } from "../hooks/useAuth";
import Navbar from "../components/Navbar.tsx";
import Sidebar from "../components/Sidebar.tsx";
import { httpClient } from "../utils/http";
import { Search, Calendar, User, Award, Clock, Trash } from "lucide-react";
import { courseService } from "../services";

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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [availableCourses, setAvailableCourses] = useState<{ _id: string; title: string }[]>([]);
  const [formData, setFormData] = useState({
    courseId: "",
    title: "",
    description: "",
    maxScore: 100,
    dueDate: "",
    allowLate: false,
  });

  useEffect(() => {
    fetchAssignments();
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
        didOpen: () => {
          const swalContainer = document.querySelector(".swal2-container") as HTMLElement;
          const swalBackdrop = document.querySelector(".swal2-backdrop-show") as HTMLElement;
          if (swalContainer) {
            swalContainer.style.zIndex = "99999";
          }
          if (swalBackdrop) {
            swalBackdrop.style.zIndex = "99998";
          }
        },
      });
    } catch (err) {
      console.error("Error loading SweetAlert2:", err);
      alert(message); // Fallback to alert if swal fails to load
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
        didOpen: () => {
          const swalContainer = document.querySelector(".swal2-container") as HTMLElement;
          const swalBackdrop = document.querySelector(".swal2-backdrop-show") as HTMLElement;
          if (swalContainer) {
            swalContainer.style.zIndex = "99999";
          }
          if (swalBackdrop) {
            swalBackdrop.style.zIndex = "99998";
          }
        },
      });
      return result.isConfirmed;
    } catch (err) {
      console.error("Error loading SweetAlert2:", err);
      return confirm(message); // Fallback to confirm if swal fails to load
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
        didOpen: () => {
          const swalContainer = document.querySelector(".swal2-container") as HTMLElement;
          const swalBackdrop = document.querySelector(".swal2-backdrop-show") as HTMLElement;
          if (swalContainer) {
            swalContainer.style.zIndex = "99999";
          }
          if (swalBackdrop) {
            swalBackdrop.style.zIndex = "99998";
          }
        },
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
      description: "",
      maxScore: 100,
      dueDate: "",
      allowLate: false,
    });
    setShowCreateModal(true);
  };

  const handleEdit = (assignment: Assignment) => {
    setEditingAssignment(assignment);
    let formattedDueDate = "";
    if (assignment.dueDate) {
      const date = new Date(assignment.dueDate);
      // Format as YYYY-MM-DDTHH:mm for datetime-local input
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      formattedDueDate = `${year}-${month}-${day}T${hours}:${minutes}`;
    }
    setFormData({
      courseId: assignment.courseId._id,
      title: assignment.title,
      description: assignment.description || "",
      maxScore: assignment.maxScore,
      dueDate: formattedDueDate,
      allowLate: assignment.allowLate || false,
    });
    setShowEditModal(true);
  };

  const handleDelete = async (assignmentId: string) => {
    const confirmed = await showSwalConfirm("Are you sure you want to delete this assignment?");
    if (!confirmed) return;
    
    try {
      await httpClient.delete(`/assignments/${assignmentId}`, {
        withCredentials: true,
      });
      await showSwalSuccess("Assignment deleted successfully");
      await fetchAssignments();
    } catch (err) {
      console.error("Error deleting assignment:", err);
      await showSwalError("Failed to delete assignment");
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await httpClient.post(`/assignments/course/${formData.courseId}`, {
        ...formData,
        withCredentials: true,
      });
      await showSwalSuccess("Assignment created successfully");
      setShowCreateModal(false);
      setFormData({
        courseId: "",
        title: "",
        description: "",
        maxScore: 100,
        dueDate: "",
        allowLate: false,
      });
      await fetchAssignments();
    } catch (err) {
      console.error("Error creating assignment:", err);
      let errorMessage = "Failed to create assignment";
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { message?: string } }; message?: string };
        errorMessage = axiosError.response?.data?.message || axiosError.message || errorMessage;
      }
      await showSwalError(errorMessage);
    }
  };

  const handleUpdateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAssignment) return;
    
    try {
      await httpClient.put(`/assignments/${editingAssignment._id}`, formData, {
        withCredentials: true,
      });
      await showSwalSuccess("Assignment updated successfully");
      setShowEditModal(false);
      setEditingAssignment(null);
      setFormData({
        courseId: "",
        title: "",
        description: "",
        maxScore: 100,
        dueDate: "",
        allowLate: false,
      });
      await fetchAssignments();
    } catch (err) {
      console.error("Error updating assignment:", err);
      let errorMessage = "Failed to update assignment";
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

              {canCreate && (
                <button
                  onClick={handleCreate}
                  className="px-6 py-2 rounded-lg text-white transition-all duration-200 hover:shadow-lg"
                  style={{ 
                    backgroundColor: darkMode ? '#059669' : '#10b981'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = darkMode ? '#047857' : '#059669';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = darkMode ? '#059669' : '#10b981';
                  }}
                >
                  + Create Assignment
                </button>
              )}
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
                        className="rounded-lg shadow-md overflow-hidden transition-all duration-200 hover:shadow-lg flex flex-col"
                        style={{
                          backgroundColor: darkMode ? "rgba(31, 41, 55, 0.8)" : "rgba(255, 255, 255, 0.9)",
                          border: darkMode ? "1px solid rgba(75, 85, 99, 0.3)" : "1px solid rgba(229, 231, 235, 0.5)",
                        }}
                      >
                        <div 
                          className="p-6 flex flex-col flex-1 cursor-pointer"
                          onClick={() => navigate(`/assignments/${assignment._id}`)}
                        >
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
                              {/* Created by: {assignment.createdBy.fullname || assignment.createdBy.username} */}
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

                        {/* Action Buttons */}
                        {canCreate && (
                          <div className="flex space-x-2 p-4 pt-0 border-t" style={{ borderColor: darkMode ? "rgba(75, 85, 99, 0.3)" : "rgba(229, 231, 235, 0.5)" }} onClick={(e) => e.stopPropagation()}>
                            <button
                              className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105 hover:shadow-md"
                              style={{
                                backgroundColor: darkMode ? 'rgba(99, 102, 241, 0.2)' : '#eef2ff',
                                color: darkMode ? '#a5b4fc' : '#4f46e5'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = darkMode ? 'rgba(99, 102, 241, 0.3)' : '#e0e7ff';
                                e.currentTarget.style.transform = 'scale(1.05)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = darkMode ? 'rgba(99, 102, 241, 0.2)' : '#eef2ff';
                                e.currentTarget.style.transform = 'scale(1)';
                              }}
                              onClick={() => handleEdit(assignment)}
                            >
                              Edit
                            </button>
                            <button
                              className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105 hover:shadow-md flex items-center gap-2"
                              style={{
                                backgroundColor: darkMode ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2',
                                color: darkMode ? '#fca5a5' : '#dc2626'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = darkMode ? 'rgba(239, 68, 68, 0.3)' : '#fecaca';
                                e.currentTarget.style.transform = 'scale(1.05)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = darkMode ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2';
                                e.currentTarget.style.transform = 'scale(1)';
                              }}
                              onClick={() => handleDelete(assignment._id)}
                            >
                              <Trash size={16} />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </main>
      </div>

      {/* Create Assignment Modal */}
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
            className="w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl"
            style={{ backgroundColor: darkMode ? '#0b132b' : '#ffffff', border: '1px solid rgba(255,255,255,0.08)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: darkMode ? '1px solid rgba(255,255,255,0.06)' : '1px solid #eee' }}>
              <h3 className="text-xl font-semibold" style={{ color: darkMode ? '#ffffff' : '#111827' }}>
                Create Assignment
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-3 py-1 rounded-lg text-sm"
                style={{ backgroundColor: darkMode ? '#1f2937' : '#f3f4f6', color: darkMode ? '#e5e7eb' : '#111827' }}
              >
                Close
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="px-6 py-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2" style={{ color: darkMode ? '#cbd5e1' : '#374151' }}>
                    Course *
                  </label>
                  <select
                    value={formData.courseId}
                    onChange={e => setFormData({ ...formData, courseId: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border"
                    style={{
                      backgroundColor: darkMode ? 'rgba(55, 65, 81, 0.8)' : '#ffffff',
                      borderColor: darkMode ? 'rgba(75, 85, 99, 0.3)' : '#e5e7eb',
                      color: darkMode ? '#ffffff' : '#000000',
                    }}
                    required
                  >
                    <option value="">Select a course</option>
                    {availableCourses.map(course => (
                      <option key={course._id} value={course._id}>{course.title}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2" style={{ color: darkMode ? '#cbd5e1' : '#374151' }}>
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border"
                    style={{
                      backgroundColor: darkMode ? 'rgba(55, 65, 81, 0.8)' : '#ffffff',
                      borderColor: darkMode ? 'rgba(75, 85, 99, 0.3)' : '#e5e7eb',
                      color: darkMode ? '#ffffff' : '#000000',
                    }}
                    placeholder="Assignment Title"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2" style={{ color: darkMode ? '#cbd5e1' : '#374151' }}>
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border h-24"
                    style={{
                      backgroundColor: darkMode ? 'rgba(55, 65, 81, 0.8)' : '#ffffff',
                      borderColor: darkMode ? 'rgba(75, 85, 99, 0.3)' : '#e5e7eb',
                      color: darkMode ? '#ffffff' : '#000000',
                    }}
                    placeholder="Assignment description..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: darkMode ? '#cbd5e1' : '#374151' }}>
                    Max Score
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formData.maxScore}
                    onChange={e => setFormData({ ...formData, maxScore: Number(e.target.value) })}
                    className="w-full px-4 py-2 rounded-lg border"
                    style={{
                      backgroundColor: darkMode ? 'rgba(55, 65, 81, 0.8)' : '#ffffff',
                      borderColor: darkMode ? 'rgba(75, 85, 99, 0.3)' : '#e5e7eb',
                      color: darkMode ? '#ffffff' : '#000000',
                    }}
                    placeholder="100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: darkMode ? '#cbd5e1' : '#374151' }}>
                    Due Date
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.dueDate}
                    onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border"
                    style={{
                      backgroundColor: darkMode ? 'rgba(55, 65, 81, 0.8)' : '#ffffff',
                      borderColor: darkMode ? 'rgba(75, 85, 99, 0.3)' : '#e5e7eb',
                      color: darkMode ? '#ffffff' : '#000000',
                    }}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={formData.allowLate}
                      onChange={e => setFormData({ ...formData, allowLate: e.target.checked })}
                    />
                    <span style={{ color: darkMode ? '#cbd5e1' : '#374151' }}>Allow late submissions</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 px-1">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg"
                  style={{ backgroundColor: darkMode ? '#1f2937' : '#e5e7eb', color: darkMode ? '#e5e7eb' : '#111827' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg text-white font-medium transition-all duration-200"
                  style={{ backgroundColor: darkMode ? '#4c1d95' : '#4f46e5' }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = darkMode ? '#5b21b6' : '#4338ca';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = darkMode ? '#4c1d95' : '#4f46e5';
                  }}
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Assignment Modal */}
      {showEditModal && editingAssignment && (
        <div 
          className="fixed inset-0 z-[9999] p-4 flex items-center justify-center transition-all duration-300 bg-black/40"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowEditModal(false);
              setEditingAssignment(null);
            }
          }}
        >
          <div
            className="w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl"
            style={{ backgroundColor: darkMode ? '#0b132b' : '#ffffff', border: '1px solid rgba(255,255,255,0.08)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: darkMode ? '1px solid rgba(255,255,255,0.06)' : '1px solid #eee' }}>
              <h3 className="text-xl font-semibold" style={{ color: darkMode ? '#ffffff' : '#111827' }}>
                Edit Assignment
              </h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingAssignment(null);
                }}
                className="px-3 py-1 rounded-lg text-sm"
                style={{ backgroundColor: darkMode ? '#1f2937' : '#f3f4f6', color: darkMode ? '#e5e7eb' : '#111827' }}
              >
                Close
              </button>
            </div>

            <form onSubmit={handleUpdateAssignment} className="px-6 py-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2" style={{ color: darkMode ? '#cbd5e1' : '#374151' }}>
                    Course *
                  </label>
                  <select
                    value={formData.courseId}
                    onChange={e => setFormData({ ...formData, courseId: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border"
                    style={{
                      backgroundColor: darkMode ? 'rgba(55, 65, 81, 0.8)' : '#ffffff',
                      borderColor: darkMode ? 'rgba(75, 85, 99, 0.3)' : '#e5e7eb',
                      color: darkMode ? '#ffffff' : '#000000',
                    }}
                    required
                  >
                    <option value="">Select a course</option>
                    {availableCourses.map(course => (
                      <option key={course._id} value={course._id}>{course.title}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2" style={{ color: darkMode ? '#cbd5e1' : '#374151' }}>
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border"
                    style={{
                      backgroundColor: darkMode ? 'rgba(55, 65, 81, 0.8)' : '#ffffff',
                      borderColor: darkMode ? 'rgba(75, 85, 99, 0.3)' : '#e5e7eb',
                      color: darkMode ? '#ffffff' : '#000000',
                    }}
                    placeholder="Assignment Title"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2" style={{ color: darkMode ? '#cbd5e1' : '#374151' }}>
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border h-24"
                    style={{
                      backgroundColor: darkMode ? 'rgba(55, 65, 81, 0.8)' : '#ffffff',
                      borderColor: darkMode ? 'rgba(75, 85, 99, 0.3)' : '#e5e7eb',
                      color: darkMode ? '#ffffff' : '#000000',
                    }}
                    placeholder="Assignment description..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: darkMode ? '#cbd5e1' : '#374151' }}>
                    Max Score
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formData.maxScore}
                    onChange={e => setFormData({ ...formData, maxScore: Number(e.target.value) })}
                    className="w-full px-4 py-2 rounded-lg border"
                    style={{
                      backgroundColor: darkMode ? 'rgba(55, 65, 81, 0.8)' : '#ffffff',
                      borderColor: darkMode ? 'rgba(75, 85, 99, 0.3)' : '#e5e7eb',
                      color: darkMode ? '#ffffff' : '#000000',
                    }}
                    placeholder="100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: darkMode ? '#cbd5e1' : '#374151' }}>
                    Due Date
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.dueDate}
                    onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border"
                    style={{
                      backgroundColor: darkMode ? 'rgba(55, 65, 81, 0.8)' : '#ffffff',
                      borderColor: darkMode ? 'rgba(75, 85, 99, 0.3)' : '#e5e7eb',
                      color: darkMode ? '#ffffff' : '#000000',
                    }}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={formData.allowLate}
                      onChange={e => setFormData({ ...formData, allowLate: e.target.checked })}
                    />
                    <span style={{ color: darkMode ? '#cbd5e1' : '#374151' }}>Allow late submissions</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 px-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingAssignment(null);
                  }}
                  className="px-4 py-2 rounded-lg"
                  style={{ backgroundColor: darkMode ? '#1f2937' : '#e5e7eb', color: darkMode ? '#e5e7eb' : '#111827' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg text-white font-medium transition-all duration-200"
                  style={{ backgroundColor: darkMode ? '#4c1d95' : '#4f46e5' }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = darkMode ? '#5b21b6' : '#4338ca';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = darkMode ? '#4c1d95' : '#4f46e5';
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

export default AssignmentPage;

