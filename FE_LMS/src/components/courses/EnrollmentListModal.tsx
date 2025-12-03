import { useState, useEffect, useCallback } from "react";
import { httpClient } from "../../utils/http";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface EnrollmentUser {
  _id: string;
  username: string;
  email: string;
  fullname?: string;
  avatar_url?: string;
}

interface EnrollmentItem {
  _id: string;
  studentId?: EnrollmentUser;
  userId?: EnrollmentUser;
  status: string;
  role: string;
  method?: string;
  createdAt?: string;
  enrolledAt?: string;
}

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
}

interface EnrollmentListModalProps {
  courseId: string;
  darkMode: boolean;
  isOpen: boolean;
  onClose: () => void;
  onEnrollmentChange?: () => void;
  /** User role - determines what actions and filters are shown */
  userRole?: "admin" | "teacher" | "student";
  /** Course status - Force Logout only visible for ongoing courses */
  courseStatus?: string;
}

export default function EnrollmentListModal({
  courseId,
  darkMode,
  isOpen,
  onClose,
  onEnrollmentChange,
  userRole = "student",
  courseStatus,
}: EnrollmentListModalProps) {
  const [enrollments, setEnrollments] = useState<EnrollmentItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">(
    userRole === "student" ? "approved" : "all"
  );
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  const isAdminOrTeacher = userRole === "admin" || userRole === "teacher";

  const fetchEnrollments = useCallback(async () => {
    if (!courseId) return;
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      params.append("page", String(page));
      params.append("limit", "10");
      // For students, always filter by approved only
      if (userRole === "student") {
        params.append("status", "approved");
      } else if (filter !== "all") {
        params.append("status", filter);
      }
      
      const response = await httpClient.get(
        `/enrollments/course/${courseId}?${params.toString()}`,
        { withCredentials: true }
      );
      
      const data = response.data as any;
      const items = data?.data?.enrollments || data?.enrollments || data?.data || [];
      setEnrollments(Array.isArray(items) ? items : []);
      setPagination(data?.data?.pagination || data?.pagination || null);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to load enrollments");
    } finally {
      setLoading(false);
    }
  }, [courseId, page, filter, userRole]);

  useEffect(() => {
    if (isOpen) {
      // Reset filter based on role when modal opens
      setFilter(userRole === "student" ? "approved" : "all");
      setPage(1);
    }
  }, [isOpen, userRole]);

  useEffect(() => {
    if (isOpen) {
      fetchEnrollments();
    }
  }, [isOpen, fetchEnrollments]);

  const handleApprove = async (enrollmentId: string) => {
    setProcessingIds((prev) => new Set(prev).add(enrollmentId));
    try {
      await httpClient.put(
        `/enrollments/${enrollmentId}`,
        { status: "approved" },
        { withCredentials: true }
      );
      const Swal = (await import("sweetalert2")).default;
      await Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Enrollment approved",
        showConfirmButton: false,
        timer: 2000,
      });
      fetchEnrollments();
      onEnrollmentChange?.();
    } catch (err: any) {
      const Swal = (await import("sweetalert2")).default;
      await Swal.fire({
        toast: true,
        position: "top-end",
        icon: "error",
        title: err?.response?.data?.message || "Failed to approve",
        showConfirmButton: false,
        timer: 2000,
      });
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(enrollmentId);
        return next;
      });
    }
  };

  const handleReject = async (enrollmentId: string) => {
    setProcessingIds((prev) => new Set(prev).add(enrollmentId));
    try {
      await httpClient.put(
        `/enrollments/${enrollmentId}`,
        { status: "rejected" },
        { withCredentials: true }
      );
      const Swal = (await import("sweetalert2")).default;
      await Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Enrollment rejected",
        showConfirmButton: false,
        timer: 2000,
      });
      fetchEnrollments();
      onEnrollmentChange?.();
    } catch (err: any) {
      const Swal = (await import("sweetalert2")).default;
      await Swal.fire({
        toast: true,
        position: "top-end",
        icon: "error",
        title: err?.response?.data?.message || "Failed to reject",
        showConfirmButton: false,
        timer: 2000,
      });
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(enrollmentId);
        return next;
      });
    }
  };

  const handleKick = async (enrollmentId: string) => {
    const Swal = (await import("sweetalert2")).default;
    const confirm = await Swal.fire({
      title: "Kick student?",
      text: "This will remove the student from the course.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, kick",
      cancelButtonText: "Cancel",
    });
    if (!confirm.isConfirmed) return;

    setProcessingIds((prev) => new Set(prev).add(enrollmentId));
    try {
      await httpClient.post(
        `/enrollments/${enrollmentId}/kick`,
        {},
        { withCredentials: true }
      );
      await Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Student kicked from course",
        showConfirmButton: false,
        timer: 2000,
      });
      fetchEnrollments();
      onEnrollmentChange?.();
    } catch (err: any) {
      await Swal.fire({
        toast: true,
        position: "top-end",
        icon: "error",
        title: err?.response?.data?.message || "Failed to kick student",
        showConfirmButton: false,
        timer: 2000,
      });
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(enrollmentId);
        return next;
      });
    }
  };

  const handleForceLogout = async (userId: string, userName: string) => {
    const Swal = (await import("sweetalert2")).default;
    const confirm = await Swal.fire({
      title: "Force logout user?",
      text: `This will terminate all sessions for ${userName}. They will need to log in again.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, force logout",
      confirmButtonColor: "#dc2626",
      cancelButtonText: "Cancel",
    });
    if (!confirm.isConfirmed) return;

    setProcessingIds((prev) => new Set(prev).add(userId));
    try {
      await httpClient.delete(
        `/sessions/user/${userId}`,
        { withCredentials: true }
      );
      await Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: `${userName} has been logged out`,
        showConfirmButton: false,
        timer: 2000,
      });
    } catch (err: any) {
      await Swal.fire({
        toast: true,
        position: "top-end",
        icon: "error",
        title: err?.response?.data?.message || "Failed to force logout",
        showConfirmButton: false,
        timer: 2000,
      });
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusStyles: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
      approved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
      rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
      dropped: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100",
    };
    return statusStyles[status] || statusStyles.pending;
  };

  if (!isOpen) return null;

  const modalTitle = userRole === "student" ? "My Classmates" : "Enrollment List";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-3xl max-h-[85vh] rounded-xl shadow-lg overflow-hidden flex flex-col"
        style={{
          backgroundColor: darkMode ? "#0b132b" : "#ffffff",
          border: darkMode ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e5e7eb",
        }}
      >
        {/* Header */}
        <div
          className="px-6 py-4 border-b flex items-center justify-between"
          style={{
            borderColor: darkMode ? "rgba(255,255,255,0.08)" : "#e5e7eb",
          }}
        >
          <h2
            className="text-xl font-semibold"
            style={{ color: darkMode ? "#ffffff" : "#111827" }}
          >
            {modalTitle}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Filter Tabs - Only show for admin/teacher */}
        {isAdminOrTeacher && (
          <div
            className="px-6 py-3 border-b flex gap-2"
            style={{
              borderColor: darkMode ? "rgba(255,255,255,0.08)" : "#e5e7eb",
            }}
          >
            {(["all", "pending", "approved", "rejected"] as const).map((f) => (
              <button
                key={f}
                onClick={() => {
                  setFilter(f);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  filter === f
                    ? "bg-[#525fe1] text-white"
                    : darkMode
                    ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#525fe1]"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-500">{error}</div>
          ) : enrollments.length === 0 ? (
            <div
              className="text-center py-12"
              style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}
            >
              {userRole === "student" ? "No classmates found" : "No enrollments found"}
            </div>
          ) : (
            <div className="space-y-3">
              {enrollments.map((enrollment) => {
                const student = enrollment.studentId || enrollment.userId;
                const studentId = student?._id;
                const isProcessing = processingIds.has(enrollment._id) || (studentId ? processingIds.has(studentId) : false);
                
                return (
                  <div
                    key={enrollment._id}
                    className="p-4 rounded-lg flex items-center justify-between gap-4"
                    style={{
                      backgroundColor: darkMode ? "rgba(31,41,55,0.6)" : "#f9fafb",
                      border: darkMode ? "1px solid rgba(255,255,255,0.05)" : "1px solid #e5e7eb",
                    }}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium shrink-0"
                        style={{
                          backgroundColor: darkMode ? "#374151" : "#e5e7eb",
                          color: darkMode ? "#ffffff" : "#374151",
                        }}
                      >
                        {(student?.fullname || student?.username || "?").charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div
                          className="font-medium truncate"
                          style={{ color: darkMode ? "#ffffff" : "#111827" }}
                        >
                          {student?.fullname || student?.username || "Unknown"}
                        </div>
                        <div
                          className="text-sm truncate"
                          style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}
                        >
                          {student?.email || "No email"}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                      {/* Status badge - always show for admin/teacher, hide for student (all are approved) */}
                      {isAdminOrTeacher && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(enrollment.status)}`}>
                          {enrollment.status}
                        </span>
                      )}
                      
                      {/* Admin/Teacher actions */}
                      {isAdminOrTeacher && (
                        <>
                          {enrollment.status === "pending" && (
                            <>
                              <button
                                onClick={() => handleApprove(enrollment._id)}
                                disabled={isProcessing}
                                className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition disabled:opacity-50"
                              >
                                {isProcessing ? "..." : "Approve"}
                              </button>
                              <button
                                onClick={() => handleReject(enrollment._id)}
                                disabled={isProcessing}
                                className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition disabled:opacity-50"
                              >
                                {isProcessing ? "..." : "Reject"}
                              </button>
                            </>
                          )}
                          
                          {enrollment.status === "approved" && (
                            <>
                              <button
                                onClick={() => handleKick(enrollment._id)}
                                disabled={isProcessing}
                                className="px-3 py-1.5 rounded-lg bg-gray-600 text-white text-sm font-medium hover:bg-gray-700 transition disabled:opacity-50"
                              >
                                {isProcessing ? "..." : "Kick"}
                              </button>
                              {/* Force Logout only visible for ongoing courses */}
                              {student?._id && courseStatus === "ongoing" && (
                                <button
                                  onClick={() => handleForceLogout(student._id, student.fullname || student.username || "User")}
                                  disabled={isProcessing}
                                  className="px-3 py-1.5 rounded-lg bg-red-700 text-white text-sm font-medium hover:bg-red-800 transition disabled:opacity-50"
                                  title="Force user to log out from all devices"
                                >
                                  {isProcessing ? "..." : "Force Logout"}
                                </button>
                              )}
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages && pagination.totalPages > 1 && (
          <div
            className="px-6 py-3 border-t flex items-center justify-between"
            style={{
              borderColor: darkMode ? "rgba(255,255,255,0.08)" : "#e5e7eb",
            }}
          >
            <div
              className="text-sm"
              style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}
            >
              Page {page} of {pagination.totalPages} ({pagination.total} total)
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 rounded-lg text-sm font-medium transition disabled:opacity-50"
                style={{
                  backgroundColor: darkMode ? "#374151" : "#f3f4f6",
                  color: darkMode ? "#ffffff" : "#374151",
                }}
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages || p, p + 1))}
                disabled={page >= (pagination.totalPages || 1)}
                className="px-3 py-1.5 rounded-lg text-sm font-medium transition disabled:opacity-50"
                style={{
                  backgroundColor: darkMode ? "#374151" : "#f3f4f6",
                  color: darkMode ? "#ffffff" : "#374151",
                }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
