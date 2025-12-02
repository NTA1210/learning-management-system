import React, { useEffect, useState, useMemo } from "react";
import { Calendar, CheckCircle, XCircle, Clock, TrendingUp, TrendingDown, Users, AlertTriangle } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import {
  attendanceService,
  enrollmentService,
  type AttendanceRecord,
  type AttendanceSummary,
  type CourseAttendanceStats,
  type StudentAttendanceStat,
} from "../../services";
import type { EnrollmentItem } from "../../services/enrollmentService";
import { scheduleService } from "../../services/scheduleService";
import type { Schedule, DayOfWeek } from "../../types/schedule";
import AttendanceForm from "../attendance/AttendanceForm";
import AttendanceStatsOverview from "../attendance/AttendanceStatsOverview";
import StudentAttendanceModal from "../attendance/StudentAttendanceModal";
import ScheduleDatePicker from "../common/ScheduleDatePicker";
import { getCurrentDateUTC7, formatDateUTC7 } from "../../utils/dateUtils";
import { format, parseISO, isWithinInterval } from "date-fns";
import toast from "react-hot-toast";

interface AttendanceTabProps {
  courseId: string;
  darkMode: boolean;
  courseTitle?: string;
}

const AttendanceTab: React.FC<AttendanceTabProps> = ({ courseId, darkMode, courseTitle }) => {
  const { user } = useAuth();
  const isStudent = user?.role === "student";
  const isAdmin = user?.role === "admin";
  const isTeacher = user?.role === "teacher";

  // Student view state
  const [studentRecords, setStudentRecords] = useState<AttendanceRecord[]>([]);
  const [studentSummary, setStudentSummary] = useState<AttendanceSummary | null>(null);
  const [loadingStudent, setLoadingStudent] = useState(false);

  // Admin/Teacher view state
  const [attendanceStats, setAttendanceStats] = useState<CourseAttendanceStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<{ id: string; name: string } | null>(null);

  // Schedule validation state
  const [courseSchedules, setCourseSchedules] = useState<Schedule[]>([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [attendanceDate, setAttendanceDate] = useState<string>(getCurrentDateUTC7());

  // Check if the selected date is today (for teacher edit permission)
  const isToday = attendanceDate === getCurrentDateUTC7();

  // Map day index (0=Sunday) to DayOfWeek
  const indexToDayOfWeek: DayOfWeek[] = [
    'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'
  ];

  // Check if schedule is effective on a given date
  const isScheduleEffectiveOnDate = (schedule: Schedule, date: Date): boolean => {
    try {
      const effectiveFrom = parseISO(schedule.effectiveFrom);
      if (schedule.effectiveTo) {
        const effectiveTo = parseISO(schedule.effectiveTo);
        return isWithinInterval(date, { start: effectiveFrom, end: effectiveTo });
      }
      return date >= effectiveFrom;
    } catch {
      return false;
    }
  };

  // Check if the selected date has a valid schedule
  const scheduleValidation = useMemo(() => {
    if (courseSchedules.length === 0) {
      return { hasSchedule: false, scheduleForDay: null, message: "No schedule found for this course" };
    }

    const selectedDateObj = parseISO(attendanceDate);
    const dayIndex = selectedDateObj.getDay();
    const dayOfWeek = indexToDayOfWeek[dayIndex];

    // Find schedules for this day that are approved/active and effective on the selected date
    const schedulesForDay = courseSchedules.filter(schedule => {
      const matchesDay = schedule.dayOfWeek === dayOfWeek;
      const isApproved = schedule.status === 'approved' || schedule.status === 'active';
      const isEffective = isScheduleEffectiveOnDate(schedule, selectedDateObj);
      return matchesDay && isApproved && isEffective;
    });

    if (schedulesForDay.length === 0) {
      const dayName = dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1);
      return {
        hasSchedule: false,
        scheduleForDay: null,
        message: `No class scheduled for ${dayName} (${format(selectedDateObj, 'MMM dd, yyyy')})`
      };
    }

    return {
      hasSchedule: true,
      scheduleForDay: schedulesForDay[0],
      message: null
    };
  }, [courseSchedules, attendanceDate, indexToDayOfWeek]);

  // Fetch student's own attendance
  useEffect(() => {
    if (!isStudent || !courseId) return;

    const fetchSelfAttendance = async () => {
      try {
        setLoadingStudent(true);
        const result = await attendanceService.getSelfAttendance({ courseId, limit: 100 });
        setStudentRecords(result.data);
        setStudentSummary(result.summary || null);
      } catch (err: any) {
        console.error("Failed to fetch self attendance:", err);
        setError(err.message || "Failed to fetch attendance");
      } finally {
        setLoadingStudent(false);
      }
    };

    fetchSelfAttendance();
  }, [isStudent, courseId]);

  // Fetch course schedules for admin/teacher
  useEffect(() => {
    if (isStudent || !courseId) return;

    const fetchCourseSchedules = async () => {
      try {
        setLoadingSchedules(true);
        const schedules = await scheduleService.getCourseSchedule(courseId, ['approved', 'active']);
        setCourseSchedules(schedules);
      } catch (err) {
        console.error('Failed to fetch course schedules:', err);
        setCourseSchedules([]);
      } finally {
        setLoadingSchedules(false);
      }
    };

    fetchCourseSchedules();
  }, [isStudent, courseId]);

  // Fetch attendance stats and enrollments for admin/teacher
  useEffect(() => {
    if (isStudent || !courseId) return;

    const fetchAttendanceData = async () => {
      try {
        setLoadingStats(true);
        setError(null);

        const [enrollmentsResult, stats] = await Promise.all([
          enrollmentService.getByCourse(courseId, { limit: 1000 }),
          attendanceService.getCourseStats(courseId)
        ]);

        const mergedStudentStats = mergeEnrollmentsWithStats(enrollmentsResult.enrollments, stats);

        setAttendanceStats({
          ...stats,
          studentStats: mergedStudentStats,
          totalStudents: mergedStudentStats.length,
        });
      } catch (err: any) {
        setError(err.message || "Failed to fetch attendance data");
        setAttendanceStats(null);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchAttendanceData();
  }, [isStudent, courseId]);

  // Helper function to merge enrollments with stats
  const mergeEnrollmentsWithStats = (
    enrollments: EnrollmentItem[],
    stats: CourseAttendanceStats | null
  ): StudentAttendanceStat[] => {
    const enrollmentMap = new Map<string, EnrollmentItem>();
    const result: StudentAttendanceStat[] = [];

    enrollments
      .filter(enrollment => {
        const student = enrollment.studentId || enrollment.userId;
        return enrollment.status === 'approved' && student?._id;
      })
      .forEach(enrollment => {
        const student = enrollment.studentId || enrollment.userId;
        if (student?._id) {
          enrollmentMap.set(student._id, enrollment);
        }
      });

    if (stats?.studentStats) {
      stats.studentStats.forEach(stat => {
        const isEnrolled = enrollmentMap.has(stat.studentId);
        result.push({
          ...stat,
          isCurrentlyEnrolled: isEnrolled,
        });
        if (isEnrolled) {
          enrollmentMap.delete(stat.studentId);
        }
      });
    }

    enrollmentMap.forEach(enrollment => {
      const student = enrollment.studentId || enrollment.userId;
      if (!student?._id) return;

      result.push({
        studentId: student._id,
        student: {
          _id: student._id,
          username: student.username || 'Unknown',
          email: student.email || '',
          fullname: student.fullname,
          avatar_url: undefined,
        },
        totalSessions: 0,
        counts: {
          present: 0,
          absent: 0,
          notyet: 0,
        },
        attendanceRate: 0,
        absentRate: 0,
        longestAbsentStreak: 0,
        alerts: {
          highAbsence: false,
        },
        isCurrentlyEnrolled: true,
      } as StudentAttendanceStat);
    });

    return result.sort((a, b) => {
      if (a.isCurrentlyEnrolled === b.isCurrentlyEnrolled) {
        const nameA = a.student?.fullname || a.student?.username || '';
        const nameB = b.student?.fullname || b.student?.username || '';
        return nameA.localeCompare(nameB);
      }
      return (b.isCurrentlyEnrolled ? 1 : 0) - (a.isCurrentlyEnrolled ? 1 : 0);
    });
  };

  const handleSaveAttendance = async (entries: Array<{ studentId: string; status: "present" | "absent" | "notyet" }>) => {
    const validEntries = entries.filter(e => e.status !== "notyet") as Array<{ studentId: string; status: "present" | "absent" }>;
    if (validEntries.length === 0) {
      toast.error("No attendance changes to save", { position: "bottom-center" });
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await attendanceService.createAttendance({
        courseId,
        date: attendanceDate,
        entries: validEntries,
      });
      toast.success("Attendance saved successfully!", { position: "bottom-center" });

      // Refresh stats
      const [enrollmentsResult, stats] = await Promise.all([
        enrollmentService.getByCourse(courseId, { limit: 1000 }),
        attendanceService.getCourseStats(courseId)
      ]);

      const mergedStudentStats = mergeEnrollmentsWithStats(enrollmentsResult.enrollments, stats);

      setAttendanceStats({
        ...stats,
        studentStats: mergedStudentStats,
        totalStudents: mergedStudentStats.length,
      });
    } catch (err: any) {
      toast.error(err.message || "Failed to save attendance", { position: "bottom-center" });
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const handleStudentClick = (studentId: string, studentName: string) => {
    setSelectedStudent({ id: studentId, name: studentName });
  };

  const handleAttendanceUpdate = async () => {
    const stats = await attendanceService.getCourseStats(courseId);
    const enrollmentsResult = await enrollmentService.getByCourse(courseId, { limit: 1000 });
    const mergedStudentStats = mergeEnrollmentsWithStats(enrollmentsResult.enrollments, stats);
    setAttendanceStats({
      ...stats,
      studentStats: mergedStudentStats,
      totalStudents: mergedStudentStats.length,
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "present":
        return <CheckCircle className="w-4 h-4" style={{ color: "#22c55e" }} />;
      case "absent":
        return <XCircle className="w-4 h-4" style={{ color: "#ef4444" }} />;
      case "late":
        return <Clock className="w-4 h-4" style={{ color: "#f59e0b" }} />;
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
      case "late":
        return "#f59e0b";
      default:
        return "#94a3b8";
    }
  };

  // Student View
  if (isStudent) {
    if (loadingStudent) {
      return (
        <div className="py-12 text-center">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>Loading attendance...</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        {studentSummary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div
              className="p-4 rounded-lg text-center"
              style={{
                backgroundColor: darkMode ? "rgba(15, 23, 42, 0.5)" : "rgba(248, 250, 252, 0.8)",
                border: darkMode ? "1px solid rgba(148, 163, 184, 0.1)" : "1px solid rgba(148, 163, 184, 0.2)",
              }}
            >
              <p className="text-xs mb-1" style={{ color: darkMode ? "#94a3b8" : "#64748b" }}>Total Sessions</p>
              <p className="text-2xl font-bold" style={{ color: darkMode ? "#ffffff" : "#1e293b" }}>{studentSummary.total}</p>
            </div>
            <div
              className="p-4 rounded-lg text-center"
              style={{
                backgroundColor: darkMode ? "rgba(34, 197, 94, 0.1)" : "rgba(34, 197, 94, 0.05)",
                border: "1px solid rgba(34, 197, 94, 0.2)",
              }}
            >
              <p className="text-xs mb-1" style={{ color: darkMode ? "#94a3b8" : "#64748b" }}>Present</p>
              <p className="text-2xl font-bold" style={{ color: "#22c55e" }}>{studentSummary.present}</p>
            </div>
            <div
              className="p-4 rounded-lg text-center"
              style={{
                backgroundColor: darkMode ? "rgba(239, 68, 68, 0.1)" : "rgba(239, 68, 68, 0.05)",
                border: "1px solid rgba(239, 68, 68, 0.2)",
              }}
            >
              <p className="text-xs mb-1" style={{ color: darkMode ? "#94a3b8" : "#64748b" }}>Absent</p>
              <p className="text-2xl font-bold" style={{ color: "#ef4444" }}>{studentSummary.absent}</p>
            </div>
            <div
              className="p-4 rounded-lg text-center"
              style={{
                backgroundColor: darkMode ? "rgba(148, 163, 184, 0.1)" : "rgba(148, 163, 184, 0.05)",
                border: "1px solid rgba(148, 163, 184, 0.2)",
              }}
            >
              <p className="text-xs mb-1" style={{ color: darkMode ? "#94a3b8" : "#64748b" }}>Attendance Rate</p>
              <p
                className="text-2xl font-bold flex items-center justify-center gap-1"
                style={{
                  color: studentSummary.total > 0
                    ? (studentSummary.present / studentSummary.total * 100) >= 80
                      ? "#22c55e"
                      : (studentSummary.present / studentSummary.total * 100) >= 60
                        ? "#f59e0b"
                        : "#ef4444"
                    : darkMode ? "#ffffff" : "#1e293b"
                }}
              >
                {studentSummary.total > 0 ? Math.round((studentSummary.present / studentSummary.total) * 100) : 0}%
                {studentSummary.total > 0 && (
                  (studentSummary.present / studentSummary.total * 100) >= 80
                    ? <TrendingUp className="w-5 h-5" />
                    : <TrendingDown className="w-5 h-5" />
                )}
              </p>
            </div>
          </div>
        )}

        {/* Attendance Records List */}
        <div
          className="p-4 rounded-lg"
          style={{
            backgroundColor: darkMode ? "rgba(30, 41, 59, 0.5)" : "#ffffff",
            border: darkMode ? "1px solid rgba(148, 163, 184, 0.1)" : "1px solid rgba(148, 163, 184, 0.2)",
          }}
        >
          <h3 className="text-lg font-semibold mb-4" style={{ color: darkMode ? "#ffffff" : "#1e293b" }}>
            Attendance History
          </h3>

          {studentRecords.length === 0 ? (
            <div className="py-8 text-center">
              <Calendar className="w-12 h-12 mx-auto mb-4" style={{ color: darkMode ? "#4b5563" : "#9ca3af" }} />
              <p style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>No attendance records yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {studentRecords.map((record) => (
                <div
                  key={record._id}
                  className="p-4 rounded-lg flex items-center justify-between"
                  style={{
                    backgroundColor: darkMode ? "rgba(15, 23, 42, 0.5)" : "rgba(248, 250, 252, 0.8)",
                    border: darkMode ? "1px solid rgba(148, 163, 184, 0.1)" : "1px solid rgba(148, 163, 184, 0.1)",
                  }}
                >
                  <div className="flex items-center gap-4">
                    {getStatusIcon(record.status)}
                    <div>
                      <p className="font-medium" style={{ color: darkMode ? "#ffffff" : "#1e293b" }}>
                        {formatDateUTC7(record.date)}
                      </p>
                      {record.markedBy && (
                        <p className="text-sm" style={{ color: darkMode ? "#94a3b8" : "#64748b" }}>
                          Marked by: {record.markedBy.fullname || record.markedBy.email}
                        </p>
                      )}
                    </div>
                  </div>
                  <span
                    className="px-3 py-1.5 rounded-lg text-sm font-medium capitalize"
                    style={{
                      backgroundColor: getStatusColor(record.status) + "20",
                      color: getStatusColor(record.status),
                    }}
                  >
                    {record.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Admin/Teacher View
  if (loadingStats) {
    return (
      <div className="py-12 text-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>Loading attendance data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="p-4 rounded-lg"
        style={{
          backgroundColor: darkMode ? "rgba(239, 68, 68, 0.1)" : "rgba(239, 68, 68, 0.1)",
          border: "1px solid rgba(239, 68, 68, 0.3)",
          color: "#ef4444",
        }}
      >
        {error}
      </div>
    );
  }

  if (!attendanceStats) {
    return (
      <div className="py-12 text-center">
        <Users className="w-12 h-12 mx-auto mb-4" style={{ color: "#94a3b8" }} />
        <p style={{ color: darkMode ? "#94a3b8" : "#64748b" }}>No attendance data found for this course</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AttendanceStatsOverview stats={attendanceStats} />

      {/* Date Selection for Admin and Teacher */}
      {(isAdmin || isTeacher) && (
        <div
          className="p-4 rounded-lg"
          style={{
            backgroundColor: darkMode ? "rgba(30, 41, 59, 0.5)" : "#ffffff",
            border: darkMode ? "1px solid rgba(148, 163, 184, 0.1)" : "1px solid rgba(148, 163, 184, 0.2)",
          }}
        >
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5" style={{ color: darkMode ? "#94a3b8" : "#64748b" }} />
              <label className="text-sm font-medium" style={{ color: darkMode ? "#e2e8f0" : "#475569" }}>
                Attendance Date:
              </label>
            </div>
            <ScheduleDatePicker
              value={attendanceDate}
              onChange={setAttendanceDate}
              schedules={courseSchedules}
              darkMode={darkMode}
              max={isTeacher ? getCurrentDateUTC7() : undefined}
            />
            <span className="text-xs" style={{ color: darkMode ? "#94a3b8" : "#64748b" }}>
              {isAdmin 
                ? "(Admin can modify attendance for any date)" 
                : isToday 
                  ? "(You can take attendance for today)" 
                  : "(View only - can only edit today's attendance)"}
            </span>
            {isTeacher && !isToday && (
              <span
                className="px-2 py-1 rounded text-xs font-medium"
                style={{
                  backgroundColor: darkMode ? "rgba(245, 158, 11, 0.2)" : "rgba(245, 158, 11, 0.1)",
                  color: "#f59e0b",
                  border: "1px solid rgba(245, 158, 11, 0.3)",
                }}
              >
                View Only
              </span>
            )}
          </div>
        </div>
      )}

      {/* Schedule Validation Warning */}
      {loadingSchedules ? (
        <div
          className="p-4 rounded-lg flex items-center gap-3"
          style={{
            backgroundColor: darkMode ? "rgba(30, 41, 59, 0.5)" : "#ffffff",
            border: darkMode ? "1px solid rgba(148, 163, 184, 0.1)" : "1px solid rgba(148, 163, 184, 0.2)",
          }}
        >
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span style={{ color: darkMode ? "#94a3b8" : "#64748b" }}>Checking course schedule...</span>
        </div>
      ) : !scheduleValidation.hasSchedule ? (
        <div
          className="p-4 rounded-lg flex items-start gap-3"
          style={{
            backgroundColor: darkMode ? "rgba(245, 158, 11, 0.1)" : "rgba(245, 158, 11, 0.1)",
            border: "1px solid rgba(245, 158, 11, 0.3)",
          }}
        >
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "#f59e0b" }} />
          <div>
            <p className="font-medium" style={{ color: "#f59e0b" }}>Attendance Not Available</p>
            <p className="text-sm mt-1" style={{ color: darkMode ? "#fbbf24" : "#d97706" }}>
              {scheduleValidation.message}
            </p>
            {courseSchedules.length > 0 && (
              <p className="text-sm mt-2" style={{ color: darkMode ? "#94a3b8" : "#64748b" }}>
                This course has classes on:{" "}
                {Array.from(new Set(courseSchedules.map(s => s.dayOfWeek)))
                  .map(day => day.charAt(0).toUpperCase() + day.slice(1))
                  .join(", ")}
              </p>
            )}
          </div>
        </div>
      ) : (
        <AttendanceForm
          stats={attendanceStats.studentStats}
          courseId={courseId}
          courseTitle={courseTitle || "Course"}
          onSave={handleSaveAttendance}
          onStudentClick={handleStudentClick}
          saving={saving}
          attendanceDate={attendanceDate}
          viewOnly={isTeacher && !isToday}
        />
      )}

      {/* Student Attendance Modal */}
      {selectedStudent && (
        <StudentAttendanceModal
          isOpen={!!selectedStudent}
          onClose={() => setSelectedStudent(null)}
          studentId={selectedStudent.id}
          studentName={selectedStudent.name}
          courseId={courseId}
          courseTitle={courseTitle}
          onUpdate={handleAttendanceUpdate}
        />
      )}
    </div>
  );
};

export default AttendanceTab;

