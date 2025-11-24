import { useEffect, useState } from "react";
import { useTheme } from "../../hooks/useTheme";
import { useAuth } from "../../hooks/useAuth";
import { attendanceService, type AttendanceRecord } from "../../services";
import { X, CheckCircle, XCircle, Calendar, User, Trash2, Edit2 } from "lucide-react";
import { formatDateUTC7, isTodayUTC7 } from "../../utils/dateUtils";

interface StudentAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  studentName: string;
  courseId?: string;
  onUpdate?: () => void;
}

export default function StudentAttendanceModal({
  isOpen,
  onClose,
  studentId,
  studentName,
  courseId,
  onUpdate,
}: StudentAttendanceModalProps) {
  const { darkMode } = useTheme();
  const { user } = useAuth();
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [summary, setSummary] = useState<{
    total: number;
    notyet: number;
    present: number;
    absent: number;
  } | null>(null);

  useEffect(() => {
    if (isOpen && studentId) {
      fetchAttendance();
    }
  }, [isOpen, studentId, courseId]);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await attendanceService.getStudentAttendance(studentId, {
        courseId,
        limit: 100,
      });
      setAttendanceRecords(result.data);
      setSummary(result.summary || null);
    } catch (err: any) {
      setError(err.message || "Failed to fetch attendance records");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "present":
        return <CheckCircle className="w-4 h-4" style={{ color: "#22c55e" }} />;
      case "absent":
        return <XCircle className="w-4 h-4" style={{ color: "#ef4444" }} />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present":
        return "#22c55e";
      case "absent":
        return "#ef4444";
      default:
        return "#94a3b8";
    }
  };

  const canDelete = (record: AttendanceRecord): boolean => {
    if (user?.role === "admin") return true;
    if (user?.role === "teacher") {
      const recordDate = formatDateUTC7(record.date);
      return isTodayUTC7(recordDate);
    }
    return false;
  };

  const handleDelete = async (attendanceId: string) => {
    if (!window.confirm("Are you sure you want to delete this attendance record?")) {
      return;
    }

    try {
      await attendanceService.deleteAttendance(attendanceId);
      await fetchAttendance();
      onUpdate?.();
    } catch (err: any) {
      setError(err.message || "Failed to delete attendance");
    }
  };

  const handleUpdate = async (attendanceId: string, status: "notyet" | "present" | "absent") => {
    try {
      await attendanceService.updateAttendance(attendanceId, { status });
      setEditingId(null);
      await fetchAttendance();
      onUpdate?.();
    } catch (err: any) {
      setError(err.message || "Failed to update attendance");
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-[9999] p-4"
      style={{
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        backdropFilter: "blur(4px)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto"
        style={{
          backgroundColor: darkMode ? "#1f2937" : "#ffffff",
          border: darkMode ? "1px solid rgba(75, 85, 99, 0.3)" : "1px solid #e5e7eb",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <User className="w-6 h-6" style={{ color: darkMode ? "#ffffff" : "#1f2937" }} />
            <h2
              className="text-2xl font-bold"
              style={{ color: darkMode ? "#ffffff" : "#1f2937" }}
            >
              Attendance History - {studentName}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-opacity-20 transition-colors"
            style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Summary */}
        {summary && (
          <div className="mb-6 grid grid-cols-4 gap-4">
            <div
              className="p-3 rounded-lg text-center"
              style={{
                backgroundColor: darkMode ? "rgba(15, 23, 42, 0.5)" : "rgba(248, 250, 252, 0.8)",
              }}
            >
              <p
                className="text-xs mb-1"
                style={{ color: darkMode ? "#94a3b8" : "#64748b" }}
              >
                Total
              </p>
              <p
                className="text-lg font-bold"
                style={{ color: darkMode ? "#ffffff" : "#1e293b" }}
              >
                {summary.total}
              </p>
            </div>
            <div
              className="p-3 rounded-lg text-center"
              style={{
                backgroundColor: darkMode ? "rgba(34, 197, 94, 0.1)" : "rgba(34, 197, 94, 0.05)",
              }}
            >
              <p
                className="text-xs mb-1"
                style={{ color: darkMode ? "#94a3b8" : "#64748b" }}
              >
                Present
              </p>
              <p
                className="text-lg font-bold"
                style={{ color: "#22c55e" }}
              >
                {summary.present}
              </p>
            </div>
            <div
              className="p-3 rounded-lg text-center"
              style={{
                backgroundColor: darkMode ? "rgba(239, 68, 68, 0.1)" : "rgba(239, 68, 68, 0.05)",
              }}
            >
              <p
                className="text-xs mb-1"
                style={{ color: darkMode ? "#94a3b8" : "#64748b" }}
              >
                Absent
              </p>
              <p
                className="text-lg font-bold"
                style={{ color: "#ef4444" }}
              >
                {summary.absent}
              </p>
            </div>
            <div
              className="p-3 rounded-lg text-center"
              style={{
                backgroundColor: darkMode ? "rgba(148, 163, 184, 0.1)" : "rgba(148, 163, 184, 0.05)",
              }}
            >
              <p
                className="text-xs mb-1"
                style={{ color: darkMode ? "#94a3b8" : "#64748b" }}
              >
                Not Yet
              </p>
              <p
                className="text-lg font-bold"
                style={{ color: darkMode ? "#ffffff" : "#1e293b" }}
              >
                {summary.notyet}
              </p>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p style={{ color: darkMode ? "#94a3b8" : "#64748b" }}>Loading attendance records...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            className="p-4 rounded-lg mb-4"
            style={{
              backgroundColor: darkMode ? "rgba(239, 68, 68, 0.1)" : "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              color: "#ef4444",
            }}
          >
            {error}
          </div>
        )}

        {/* Attendance Records */}
        {!loading && !error && (
          <div className="space-y-2">
            {attendanceRecords.length === 0 ? (
              <div className="text-center py-8">
                <p style={{ color: darkMode ? "#94a3b8" : "#64748b" }}>
                  No attendance records found
                </p>
              </div>
            ) : (
              attendanceRecords.map((record) => {
                const isEditing = editingId === record._id;
                const canDeleteRecord = canDelete(record);
                
                return (
                  <div
                    key={record._id}
                    className="p-4 rounded-lg"
                    style={{
                      backgroundColor: darkMode
                        ? "rgba(15, 23, 42, 0.5)"
                        : "rgba(248, 250, 252, 0.8)",
                      border: darkMode
                        ? "1px solid rgba(148, 163, 184, 0.1)"
                        : "1px solid rgba(148, 163, 184, 0.1)",
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        {getStatusIcon(record.status)}
                        <div className="flex-1">
                          <p
                            className="font-medium"
                            style={{ color: darkMode ? "#ffffff" : "#1e293b" }}
                          >
                            {record.courseId.title}
                          </p>
                          <div className="flex items-center gap-4 mt-1 text-sm">
                            <span
                              className="flex items-center gap-1"
                              style={{ color: getStatusColor(record.status) }}
                            >
                              <Calendar className="w-3 h-3" />
                              {formatDateUTC7(record.date)}
                            </span>
                            {record.markedBy && (
                              <span
                                style={{ color: darkMode ? "#94a3b8" : "#64748b" }}
                              >
                                Marked by: {record.markedBy.fullname || record.markedBy.email} ({record.markedBy.role})
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            {(["notyet", "present", "absent"] as const).map((status) => (
                              <button
                                key={status}
                                onClick={() => handleUpdate(record._id, status)}
                                className="px-2 py-1 rounded text-xs font-medium capitalize"
                                style={{
                                  backgroundColor: getStatusColor(status) + "20",
                                  color: getStatusColor(status),
                                }}
                              >
                                {status}
                              </button>
                            ))}
                            <button
                              onClick={() => setEditingId(null)}
                              className="px-2 py-1 rounded text-xs"
                              style={{
                                backgroundColor: darkMode ? "rgba(148, 163, 184, 0.2)" : "rgba(148, 163, 184, 0.1)",
                                color: darkMode ? "#94a3b8" : "#64748b",
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <>
                            <span
                              className="px-3 py-1 rounded-lg text-sm font-medium capitalize"
                              style={{
                                backgroundColor: getStatusColor(record.status) + "20",
                                color: getStatusColor(record.status),
                              }}
                            >
                              {record.status}
                            </span>
                            <button
                              onClick={() => setEditingId(record._id)}
                              className="p-2 rounded-lg hover:bg-opacity-20 transition-colors"
                              style={{
                                color: darkMode ? "#9ca3af" : "#6b7280",
                                backgroundColor: darkMode ? "rgba(148, 163, 184, 0.1)" : "rgba(148, 163, 184, 0.1)",
                              }}
                              title="Edit attendance"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            {canDeleteRecord && (
                              <button
                                onClick={() => handleDelete(record._id)}
                                className="p-2 rounded-lg hover:bg-opacity-20 transition-colors"
                                style={{
                                  color: "#ef4444",
                                  backgroundColor: darkMode ? "rgba(239, 68, 68, 0.1)" : "rgba(239, 68, 68, 0.1)",
                                }}
                                title="Delete attendance"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}

