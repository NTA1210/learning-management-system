import { useState, useEffect } from "react";
import { useTheme } from "../../hooks/useTheme";
import { attendanceService, type StudentAttendanceStat } from "../../services";
import { Calendar, CheckCircle, XCircle, Save, AlertTriangle, MinusCircle } from "lucide-react";
import { getCurrentDateUTC7, isTodayUTC7 } from "../../utils/dateUtils";
import toast from "react-hot-toast";

type AttendanceStatus = "notyet" | "present" | "absent";

interface AttendanceFormProps {
  stats: StudentAttendanceStat[];
  courseId: string;
  courseTitle: string;
  onSave: (entries: Array<{ studentId: string; status: AttendanceStatus }>) => Promise<void>;
  onStudentClick?: (studentId: string, studentName: string) => void;
  saving?: boolean;
  attendanceDate?: string; // Optional: if provided, use this date instead of internal state
}

export default function AttendanceForm({
  stats,
  courseId,
  courseTitle,
  onSave,
  onStudentClick,
  saving = false,
  attendanceDate: externalDate,
}: AttendanceFormProps) {
  const { darkMode } = useTheme();
  // Use external date if provided, otherwise use internal state
  const [internalDate, setInternalDate] = useState<string>(getCurrentDateUTC7());
  const attendanceDate = externalDate || internalDate;
  const [studentAttendances, setStudentAttendances] = useState<Record<string, AttendanceStatus>>({});
  const [, setLoadingStatus] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [savedState, setSavedState] = useState<Record<string, AttendanceStatus>>({});

  // Fetch current attendance status for the selected date
  useEffect(() => {
    const fetchDateStatus = async () => {
      try {
        setLoadingStatus(true);
        // Fetch stats for the specific date
        const statsForDate = await attendanceService.getCourseStats(
          courseId,
          { from: attendanceDate, to: attendanceDate }
        );

        // Create a map of student statuses from the fetched stats
        const statusMap: Record<string, AttendanceStatus> = {};

        // First, mark all students as "notyet"
        stats.forEach(stat => {
          statusMap[stat.studentId] = "notyet";
        });

        // Then update with actual statuses from the API
        if (statsForDate?.studentStats) {
          statsForDate.studentStats.forEach(stat => {
            // Determine status based on counts
            if (stat.counts.present > 0) {
              statusMap[stat.studentId] = "present";
            } else if (stat.counts.absent > 0) {
              statusMap[stat.studentId] = "absent";
            }
            // If both are 0, it stays as "notyet"
          });
        }

        setStudentAttendances(statusMap);
      } catch (err) {
        console.error("Failed to fetch date status:", err);
        // Initialize all as notyet on error
        const initial: Record<string, AttendanceStatus> = {};
        stats.forEach(stat => {
          initial[stat.studentId] = "notyet";
        });
        setStudentAttendances(initial);
      } finally {
        setLoadingStatus(false);
      }
    };

    if (courseId && attendanceDate) {
      fetchDateStatus();
    }
  }, [attendanceDate, courseId, stats]);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setStudentAttendances(prev => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleSelectAll = (status: "present" | "absent") => {
    if (!isEditMode) return; // Only allow in edit mode
    const newAttendances: Record<string, AttendanceStatus> = {};
    stats.forEach(stat => {
      if (stat.isCurrentlyEnrolled !== false) {
        newAttendances[stat.studentId] = status;
      }
    });
    setStudentAttendances(newAttendances);
  };

  const handleStartEditing = () => {
    // Save current state before editing
    setSavedState({ ...studentAttendances });

    // Enter edit mode - only default "notyet" students to absent, preserve others
    const newAttendances: Record<string, AttendanceStatus> = {};
    stats.forEach(stat => {
      if (stat.isCurrentlyEnrolled !== false) {
        const currentStatus = studentAttendances[stat.studentId] || "notyet";
        // If notyet, default to absent; otherwise keep current status
        newAttendances[stat.studentId] = currentStatus === "notyet" ? "absent" : currentStatus;
      }
    });
    setStudentAttendances(newAttendances);
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    // Restore original state
    setStudentAttendances(savedState);
    setIsEditMode(false);
  };

  const handleSave = async () => {
    if (!isTodayUTC7(attendanceDate)) {
      toast.error("Attendance can only be submitted for today's date", { position: "bottom-center" });
      return;
    }

    // Filter out unenrolled students and "notyet" status before creating entries
    const enrolledStudentIds = new Set(
      stats.filter(stat => stat.isCurrentlyEnrolled !== false).map(stat => stat.studentId)
    );

    const entries = Object.entries(studentAttendances)
      .filter(([studentId, status]) =>
        enrolledStudentIds.has(studentId) && status !== "notyet"  // Exclude notyet
      )
      .map(([studentId, status]) => ({
        studentId,
        status: status as "present" | "absent", // Type assertion since we filtered out notyet
      }));

    if (entries.length === 0) {
      toast.error("No students to mark attendance for", { position: "bottom-center" });
      return;
    }

    try {
      await onSave(entries);
      toast.success("Attendance saved successfully!", { position: "bottom-center" });

      // Exit edit mode after successful save
      setIsEditMode(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save attendance", { position: "bottom-center" });
    }
  };

  const getStatusIcon = (status: AttendanceStatus) => {
    switch (status) {
      case "present":
        return <CheckCircle className="w-5 h-5" />;
      case "absent":
        return <XCircle className="w-5 h-5" />;
      case "notyet":
        return <MinusCircle className="w-5 h-5" />;
      default:
        return null;
    }
  };

  return (
    <div
      className="p-6 rounded-lg"
      style={{
        backgroundColor: darkMode ? "rgba(30, 41, 59, 0.5)" : "#ffffff",
        border: darkMode
          ? "1px solid rgba(148, 163, 184, 0.1)"
          : "1px solid rgba(148, 163, 184, 0.2)",
      }}
    >
      <h2
        className="text-xl font-semibold mb-4"
        style={{ color: darkMode ? "#ffffff" : "#1e293b" }}
      >
        Mark Attendance - {courseTitle}
      </h2>

      {/* Date Selection - Only show if external date is not provided */}
      {!externalDate && (
        <div className="mb-4">
          <label
            className="block text-sm font-medium mb-2"
            style={{ color: darkMode ? "#e2e8f0" : "#475569" }}
          >
            Attendance Date (Today Only - UTC+7)
          </label>
          <input
            type="date"
            value={internalDate}
            onChange={(e) => {
              const newDate = e.target.value;
              if (newDate === getCurrentDateUTC7()) {
                setInternalDate(newDate);
              }
            }}
            max={getCurrentDateUTC7()}
            className="px-4 py-2 rounded-lg border"
            style={{
              backgroundColor: darkMode ? "rgba(30, 41, 59, 0.8)" : "#ffffff",
              borderColor: darkMode
                ? "rgba(148, 163, 184, 0.3)"
                : "rgba(148, 163, 184, 0.3)",
              color: darkMode ? "#ffffff" : "#1e293b",
              opacity: internalDate === getCurrentDateUTC7() ? 1 : 0.6,
            }}
            disabled={internalDate !== getCurrentDateUTC7()}
          />
          {internalDate !== getCurrentDateUTC7() && (
            <p
              className="text-xs mt-1"
              style={{ color: "#ef4444" }}
            >
              Only today's date can be selected for attendance submission
            </p>
          )}
        </div>
      )}

      {/* Select All Buttons */}
      <div className="mb-4 flex gap-2 justify-end">
        {!isEditMode ? (
          <button
            onClick={handleStartEditing}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
            style={{
              backgroundColor: darkMode ? "rgba(99, 102, 241, 0.2)" : "rgba(99, 102, 241, 0.1)",
              color: "#6366f1",
              border: "1px solid rgba(99, 102, 241, 0.3)",
            }}
          >
            <Calendar className="w-4 h-4" />
            Take Attendance
          </button>
        ) : (
          <>
            <button
              onClick={() => handleSelectAll("present")}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
              style={{
                backgroundColor: darkMode ? "rgba(34, 197, 94, 0.2)" : "rgba(34, 197, 94, 0.1)",
                color: "#22c55e",
                border: "1px solid rgba(34, 197, 94, 0.3)",
              }}
            >
              <CheckCircle className="w-4 h-4" />
              Mark All Present
            </button>
            <button
              onClick={() => handleSelectAll("absent")}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
              style={{
                backgroundColor: darkMode ? "rgba(239, 68, 68, 0.2)" : "rgba(239, 68, 68, 0.1)",
                color: "#ef4444",
                border: "1px solid rgba(239, 68, 68, 0.3)",
              }}
            >
              <XCircle className="w-4 h-4" />
              Mark All Absent
            </button>
            <button
              onClick={handleCancelEdit}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
              style={{
                backgroundColor: darkMode ? "rgba(148, 163, 184, 0.2)" : "rgba(148, 163, 184, 0.1)",
                color: darkMode ? "#94a3b8" : "#64748b",
                border: `1px solid rgba(148, 163, 184, 0.3)`,
              }}
            >
              <XCircle className="w-4 h-4" />
              Cancel
            </button>
          </>
        )}
      </div>

      {/* Students List */}
      <div className="space-y-2 mb-6">
        {stats.map((stat) => {
          const student = stat.student;
          const currentStatus = studentAttendances[stat.studentId] || "present";

          return (
            <div
              key={stat.studentId}
              className="p-4 rounded-lg"
              style={{
                backgroundColor: darkMode
                  ? "rgba(15, 23, 42, 0.5)"
                  : "rgba(248, 250, 252, 0.8)",
                border: darkMode
                  ? "1px solid rgba(148, 163, 184, 0.1)"
                  : "1px solid rgba(148, 163, 184, 0.1)",
                opacity: stat.isCurrentlyEnrolled === false ? 0.6 : 1,
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3 flex-1">
                  {student.avatar_url ? (
                    <img
                      src={student.avatar_url}
                      alt={student.username}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: "#6366f1" }}
                    >
                      <span className="text-white font-semibold">
                        {student.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => onStudentClick?.(stat.studentId, student.fullname || student.username)}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <p
                        className="font-medium truncate hover:underline"
                        style={{ color: darkMode ? "#ffffff" : "#1e293b" }}
                      >
                        {student.fullname || student.username}
                      </p>
                      {stat.isCurrentlyEnrolled === false && (
                        <span
                          className="inline-block px-2 py-0.5 rounded text-xs font-medium"
                          style={{
                            backgroundColor: darkMode ? "rgba(249, 115, 22, 0.2)" : "rgba(249, 115, 22, 0.1)",
                            color: "#f97316",
                            border: "1px solid rgba(249, 115, 22, 0.3)",
                          }}
                        >
                          No longer in course
                        </span>
                      )}
                      {stat.alerts.highAbsence && (
                        <AlertTriangle className="w-4 h-4" style={{ color: "#ef4444" }} />
                      )}
                    </div>
                    <p
                      className="text-sm truncate"
                      style={{ color: darkMode ? "#94a3b8" : "#64748b" }}
                    >
                      {student.email}
                    </p>
                    <div className="flex items-center gap-4 mt-1">
                      <span
                        className="text-xs"
                        style={{ color: darkMode ? "#94a3b8" : "#64748b" }}
                      >
                        Rate: <strong>{stat.attendanceRate}%</strong>
                      </span>
                      <span
                        className="text-xs"
                        style={{ color: darkMode ? "#94a3b8" : "#64748b" }}
                      >
                        Sessions: {stat.totalSessions}
                      </span>
                      <span
                        className="text-xs"
                        style={{ color: darkMode ? "#94a3b8" : "#64748b" }}
                      >
                        P:{stat.counts.present} A:{stat.counts.absent}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Only show attendance buttons for currently enrolled students */}
                {stat.isCurrentlyEnrolled !== false && (
                  <div className="flex items-center gap-2">
                    {!isEditMode ? (
                      // View mode - show status label  
                      <span className="px-3 py-1.5 rounded-lg text-sm font-medium capitalize"
                        style={{
                          backgroundColor: currentStatus === "present" ? "rgba(34, 197, 94, 0.2)" : currentStatus === "absent" ? "rgba(239, 68, 68, 0.2)" : "rgba(148, 163, 184, 0.2)",
                          color: currentStatus === "present" ? "#22c55e" : currentStatus === "absent" ? "#ef4444" : darkMode ? "#94a3b8" : "#64748b",
                          border: currentStatus === "present" ? "1px solid rgba(34, 197, 94, 0.3)" : currentStatus === "absent" ? "1px solid rgba(239, 68, 68, 0.3)" : `1px solid rgba(148, 163, 184, 0.3)`,
                        }}>
                        {currentStatus === "notyet" ? "Not Yet" : currentStatus}
                      </span>
                    ) : (["present", "absent"] as const).map((status) => {
                      const isSelected = currentStatus === status;
                      const getButtonColor = () => {
                        if (status === "present") return { bg: "#22c55e", text: "#22c55e" };
                        return { bg: "#ef4444", text: "#ef4444" }; // absent
                      };
                      const colors = getButtonColor();

                      return (
                        <button
                          key={status}
                          onClick={() => handleStatusChange(stat.studentId, status)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1 ${isSelected ? "ring-2" : ""
                            }`}
                          style={{
                            backgroundColor: isSelected
                              ? colors.bg
                              : darkMode
                                ? "rgba(148, 163, 184, 0.1)"
                                : "rgba(148, 163, 184, 0.1)",
                            color: isSelected
                              ? "#ffffff"
                              : colors.text,
                            border: isSelected
                              ? "none"
                              : `1px solid ${colors.text}`,
                            boxShadow: isSelected
                              ? `0 0 0 2px ${colors.bg}`
                              : "none",
                          }}
                        >
                          {isSelected && getStatusIcon(status)}
                          <span className="capitalize">{status}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Save Button - only show in edit mode */}
      {isEditMode && (
        <button
          onClick={handleSave}
          disabled={saving || !isTodayUTC7(attendanceDate)}
          className="w-full py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: saving || !isTodayUTC7(attendanceDate) ? "#94a3b8" : "#6366f1",
            color: "#ffffff",
          }}
        >
          {saving ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              <span>Save Attendance</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}

