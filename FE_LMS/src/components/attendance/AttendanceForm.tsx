import { useState } from "react";
import { useTheme } from "../../hooks/useTheme";
import type { StudentAttendanceStat } from "../../services";
import { Calendar, CheckCircle, XCircle, Save, AlertTriangle } from "lucide-react";
import { getCurrentDateUTC7, isTodayUTC7 } from "../../utils/dateUtils";

type AttendanceStatus = "present" | "absent";

interface AttendanceFormProps {
  stats: StudentAttendanceStat[];
  courseId: string;
  courseTitle: string;
  onSave: (entries: Array<{ studentId: string; status: AttendanceStatus }>) => Promise<void>;
  onStudentClick?: (studentId: string, studentName: string) => void;
  saving?: boolean;
}

export default function AttendanceForm({
  stats,
  courseId,
  courseTitle,
  onSave,
  onStudentClick,
  saving = false,
}: AttendanceFormProps) {
  const { darkMode } = useTheme();
  const [attendanceDate, setAttendanceDate] = useState<string>(getCurrentDateUTC7());
  const [studentAttendances, setStudentAttendances] = useState<Record<string, AttendanceStatus>>(() => {
    const initial: Record<string, AttendanceStatus> = {};
    stats.forEach(stat => {
      initial[stat.studentId] = "present";
    });
    return initial;
  });
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setStudentAttendances(prev => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleSelectAll = (status: AttendanceStatus) => {
    const newAttendances: Record<string, AttendanceStatus> = {};
    stats.forEach(stat => {
      newAttendances[stat.studentId] = status;
    });
    setStudentAttendances(newAttendances);
  };

  const handleSave = async () => {
    if (!isTodayUTC7(attendanceDate)) {
      setError("Attendance can only be submitted for today's date");
      return;
    }

    const entries = Object.entries(studentAttendances).map(([studentId, status]) => ({
      studentId,
      status,
    }));

    if (entries.length === 0) {
      setError("No students to mark attendance for");
      return;
    }

    try {
      setError(null);
      await onSave(entries);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to save attendance");
    }
  };

  const getStatusColor = (status: AttendanceStatus) => {
    return status === "present" ? "bg-green-500" : "bg-red-500";
  };

  const getStatusIcon = (status: AttendanceStatus) => {
    return status === "present" ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />;
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
      
      {/* Error Message */}
      {error && (
        <div
          className="mb-4 p-4 rounded-lg flex items-center gap-2"
          style={{
            backgroundColor: darkMode ? "rgba(239, 68, 68, 0.1)" : "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            color: "#ef4444",
          }}
        >
          <AlertTriangle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Success Message */}
      {showSuccess && (
        <div
          className="mb-4 p-4 rounded-lg flex items-center gap-2"
          style={{
            backgroundColor: darkMode ? "rgba(34, 197, 94, 0.1)" : "rgba(34, 197, 94, 0.1)",
            border: "1px solid rgba(34, 197, 94, 0.3)",
            color: "#22c55e",
          }}
        >
          <CheckCircle className="w-5 h-5" />
          <span>Attendance saved successfully!</span>
        </div>
      )}

      {/* Date Selection */}
      <div className="mb-4">
        <label
          className="block text-sm font-medium mb-2"
          style={{ color: darkMode ? "#e2e8f0" : "#475569" }}
        >
          <Calendar className="inline w-4 h-4 mr-2" />
          Attendance Date (Today Only - UTC+7)
        </label>
        <input
          type="date"
          value={attendanceDate}
          onChange={(e) => {
            const newDate = e.target.value;
            if (isTodayUTC7(newDate)) {
              setAttendanceDate(newDate);
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
            opacity: isTodayUTC7(attendanceDate) ? 1 : 0.6,
          }}
          disabled={!isTodayUTC7(attendanceDate)}
        />
        {!isTodayUTC7(attendanceDate) && (
          <p
            className="text-xs mt-1"
            style={{ color: "#ef4444" }}
          >
            Only today's date can be selected for attendance submission
          </p>
        )}
      </div>

      {/* Select All Buttons */}
      <div className="mb-4 flex gap-2">
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
                    <div className="flex items-center gap-2">
                      <p
                        className="font-medium truncate hover:underline"
                        style={{ color: darkMode ? "#ffffff" : "#1e293b" }}
                      >
                        {student.fullname || student.username}
                      </p>
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
                
                <div className="flex items-center gap-2">
                  {(["present", "absent"] as AttendanceStatus[]).map((status) => (
                    <button
                      key={status}
                      onClick={() => handleStatusChange(stat.studentId, status)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1 ${
                        currentStatus === status
                          ? "ring-2 ring-indigo-500"
                          : ""
                      }`}
                      style={{
                        backgroundColor:
                          currentStatus === status
                            ? getStatusColor(status)
                            : darkMode
                            ? "rgba(148, 163, 184, 0.1)"
                            : "rgba(148, 163, 184, 0.1)",
                        color:
                          currentStatus === status
                            ? "#ffffff"
                            : darkMode
                            ? "#94a3b8"
                            : "#64748b",
                      }}
                    >
                      {currentStatus === status && getStatusIcon(status)}
                      <span className="capitalize">{status}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Save Button */}
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
    </div>
  );
}

