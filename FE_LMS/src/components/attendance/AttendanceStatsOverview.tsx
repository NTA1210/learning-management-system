import { useTheme } from "../../hooks/useTheme";
import type { CourseAttendanceStats } from "../../services";
import { TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";

interface AttendanceStatsOverviewProps {
  stats: CourseAttendanceStats;
}

export default function AttendanceStatsOverview({ stats }: AttendanceStatsOverviewProps) {
  const { darkMode } = useTheme();

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
        Attendance Overview
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div
          className="p-4 rounded-lg"
          style={{
            backgroundColor: darkMode ? "rgba(15, 23, 42, 0.5)" : "rgba(248, 250, 252, 0.8)",
          }}
        >
          <p
            className="text-sm mb-1"
            style={{ color: darkMode ? "#94a3b8" : "#64748b" }}
          >
            Total Students
          </p>
          <p
            className="text-2xl font-bold"
            style={{ color: darkMode ? "#ffffff" : "#1e293b" }}
          >
            {stats.totalStudents}
          </p>
        </div>
        <div
          className="p-4 rounded-lg"
          style={{
            backgroundColor: darkMode ? "rgba(15, 23, 42, 0.5)" : "rgba(248, 250, 252, 0.8)",
          }}
        >
          <p
            className="text-sm mb-1"
            style={{ color: darkMode ? "#94a3b8" : "#64748b" }}
          >
            Class Attendance Rate
          </p>
          <p
            className="text-2xl font-bold flex items-center gap-2"
            style={{ 
              color: stats.classAttendanceRate >= 80 
                ? "#22c55e" 
                : stats.classAttendanceRate >= 60 
                ? "#eab308" 
                : "#ef4444" 
            }}
          >
            {stats.classAttendanceRate}%
            {stats.classAttendanceRate >= 80 ? (
              <TrendingUp className="w-5 h-5" />
            ) : (
              <TrendingDown className="w-5 h-5" />
            )}
          </p>
        </div>
        <div
          className="p-4 rounded-lg"
          style={{
            backgroundColor: darkMode ? "rgba(15, 23, 42, 0.5)" : "rgba(248, 250, 252, 0.8)",
          }}
        >
          <p
            className="text-sm mb-1"
            style={{ color: darkMode ? "#94a3b8" : "#64748b" }}
          >
            Total Records
          </p>
          <p
            className="text-2xl font-bold"
            style={{ color: darkMode ? "#ffffff" : "#1e293b" }}
          >
            {stats.totalRecords}
          </p>
        </div>
      </div>

      {/* Students at Risk */}
      {stats.studentsAtRisk.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5" style={{ color: "#ef4444" }} />
            <h3
              className="font-semibold"
              style={{ color: "#ef4444" }}
            >
              Students at Risk ({stats.studentsAtRisk.length})
            </h3>
          </div>
          <div className="space-y-2">
            {stats.studentsAtRisk.map((stat) => (
              <div
                key={stat.studentId}
                className="p-3 rounded-lg flex items-center justify-between"
                style={{
                  backgroundColor: darkMode
                    ? "rgba(239, 68, 68, 0.1)"
                    : "rgba(239, 68, 68, 0.05)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                }}
              >
                <div className="flex items-center gap-3">
                  {stat.student.avatar_url ? (
                    <img
                      src={stat.student.avatar_url}
                      alt={stat.student.username}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: "#6366f1" }}
                    >
                      <span className="text-white text-xs font-semibold">
                        {stat.student.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <p
                      className="font-medium text-sm"
                      style={{ color: darkMode ? "#ffffff" : "#1e293b" }}
                    >
                      {stat.student.fullname || stat.student.username}
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: darkMode ? "#94a3b8" : "#64748b" }}
                    >
                      Attendance: {stat.attendanceRate}% | Absent: {stat.counts.absent} times
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

