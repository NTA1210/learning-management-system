import React, { useEffect, useState } from "react";
import { File } from "lucide-react";
import http from "../../utils/http";

interface StaticCourseTabProps {
  courseId: string;
  darkMode: boolean;
}

const StaticCourseTab: React.FC<StaticCourseTabProps> = ({ courseId, darkMode }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState<any>(null);

  const sanitizeUrl = (url?: string) => (url || "").replace(/`/g, "").trim();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await http.get(`/courses/${courseId}/statistics`);
        const data = (res as any)?.data || null;
        if (mounted) {
          setStats(data);
          setError("");
        }
      } catch (e: any) {
        if (mounted) setError(e?.message || "Failed to load statistics");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [courseId]);

  if (loading) {
    return (
      <div className="py-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{ borderColor: darkMode ? '#6366f1' : '#4f46e5' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 text-center">
        <File className="w-16 h-16 mx-auto mb-4" style={{ color: darkMode ? "#4b5563" : "#9ca3af" }} />
        <p style={{ color: darkMode ? "#fca5a5" : "#dc2626" }}>{error}</p>
      </div>
    );
  }

  const statistics = stats?.statistics || {};
  const semester = stats?.semester;
  const teachers = Array.isArray(stats?.teachers) ? stats.teachers : [];
  const totalLessons = Number(statistics.totalLessons ?? 0) || 0;
  const totalQuizzes = Number(statistics.totalQuizzes ?? 0) || 0;
  const totalAssignments = Number(statistics.totalAssignments ?? 0) || 0;
  const totalAttendances = Number(statistics.totalAttendances ?? 0) || 0;
  const maxTotal = Math.max(1, totalLessons || 0, totalQuizzes || 0, totalAssignments || 0, totalAttendances || 0);
  const passRate = Number(statistics.passRate ?? 0);
  const droppedRate = Number(statistics.droppedRate ?? Math.max(0, 100 - passRate));
  const avgQuiz = Number(statistics.averageQuizScore ?? 0);
  const avgAssignment = Number(statistics.averageAssignmentScore ?? 0);
  const avgFinal = Number(statistics.averageFinalGrade ?? 0);
  const maxAvg = Math.max(1, avgQuiz, avgAssignment, avgFinal);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-2" style={{ color: darkMode ? "#ffffff" : "#111827" }}>Statistics Overview</h2>
        <div className="text-sm" style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>{stats?.courseName}</div>
        {semester && (
          <div className="mt-2 inline-flex items-center gap-2">
            <span className="px-2 py-1 rounded text-xs" style={{ backgroundColor: darkMode ? 'rgba(16, 185, 129, 0.2)' : '#d1fae5', color: darkMode ? '#6ee7b7' : '#059669' }}>{semester.type?.toUpperCase()} {semester.year}</span>
          </div>
        )}
      </div>

      {teachers.length > 0 && (
        <div>
          <div className="text-sm font-semibold mb-2" style={{ color: darkMode ? "#ffffff" : "#111827" }}>Teachers</div>
          <div className="flex flex-wrap gap-4">
            {teachers.map((t: any) => (
              <div key={t._id} className="flex items-center gap-3">
                {t.avatar_url ? (
                  <img src={sanitizeUrl(t.avatar_url)} alt={t.fullname || t.username} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-700 dark:text-indigo-100">
                    {(t.fullname || t.username || "T").slice(0,1).toUpperCase()}
                  </div>
                )}
                <div className="text-sm">
                  <div className="font-semibold" style={{ color: darkMode ? "#ffffff" : "#111827" }}>{t.fullname || t.username}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="rounded-lg p-4" style={{ backgroundColor: darkMode ? "rgba(31,41,55,0.8)" : "#f9fafb", border: darkMode ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e5e7eb" }}>
          <div className="text-sm opacity-70">Total Students</div>
          <div className="text-xl font-bold">{statistics.totalStudents ?? 0}</div>
        </div>
        <div className="rounded-lg p-4" style={{ backgroundColor: darkMode ? "rgba(31,41,55,0.8)" : "#f9fafb", border: darkMode ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e5e7eb" }}>
          <div className="text-sm opacity-70">Total Lessons</div>
          <div className="text-xl font-bold">{totalLessons}</div>
        </div>
        <div className="rounded-lg p-4" style={{ backgroundColor: darkMode ? "rgba(31,41,55,0.8)" : "#f9fafb", border: darkMode ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e5e7eb" }}>
          <div className="text-sm opacity-70">Total Quizzes</div>
          <div className="text-xl font-bold">{totalQuizzes}</div>
        </div>
        <div className="rounded-lg p-4" style={{ backgroundColor: darkMode ? "rgba(31,41,55,0.8)" : "#f9fafb", border: darkMode ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e5e7eb" }}>
          <div className="text-sm opacity-70">Total Assignments</div>
          <div className="text-xl font-bold">{totalAssignments}</div>
        </div>
        <div className="rounded-lg p-4" style={{ backgroundColor: darkMode ? "rgba(31,41,55,0.8)" : "#f9fafb", border: darkMode ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e5e7eb" }}>
          <div className="text-sm opacity-70">Total Attendances</div>
          <div className="text-xl font-bold">{totalAttendances}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div className="rounded-lg p-4 flex items-center justify-center" style={{ backgroundColor: darkMode ? "#0b132b" : "#ffffff", border: darkMode ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e5e7eb" }}>
          <svg width="180" height="180" viewBox="0 0 180 180">
            <circle cx="90" cy="90" r="70" fill={darkMode ? "#111827" : "#f3f4f6"} />
            <circle cx="90" cy="90" r="60" fill={darkMode ? "#0b132b" : "#ffffff"} />
            <circle cx="90" cy="90" r="60" fill="transparent" stroke={darkMode ? "#374151" : "#e5e7eb"} strokeWidth="20" />
            {(() => {
              const circumference = 2 * Math.PI * 60;
              const offset = circumference * (1 - passRate / 100);
              return (
                <circle cx="90" cy="90" r="60" fill="transparent" stroke={darkMode ? "#6ee7b7" : "#10b981"} strokeWidth="20" strokeDasharray={`${circumference} ${circumference}`} strokeDashoffset={offset} transform="rotate(-90 90 90)" />
              );
            })()}
            <text x="90" y="90" textAnchor="middle" dominantBaseline="middle" fontSize="18" fontWeight="700" fill={darkMode ? "#ffffff" : "#111827"}>{passRate}%</text>
            <text x="90" y="115" textAnchor="middle" dominantBaseline="middle" fontSize="12" fill={darkMode ? "#9ca3af" : "#6b7280"}>Pass Rate</text>
          </svg>
        </div>

        <div className="rounded-lg p-4" style={{ backgroundColor: darkMode ? "#0b132b" : "#ffffff", border: darkMode ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e5e7eb" }}>
          <div className="font-semibold mb-3" style={{ color: darkMode ? "#ffffff" : "#111827" }}>Average Scores</div>
          <svg width="100%" height="160" viewBox="0 0 320 160">
            {(() => {
              const pad = 20;
              const pts = [avgQuiz, avgAssignment, avgFinal];
              const xs = [pad, 160, 320 - pad];
              const ys = pts.map(v => 160 - pad - (v / maxAvg) * (160 - 2 * pad));
              return (
                <>
                  <polyline points={`${xs[0]},${ys[0]} ${xs[1]},${ys[1]} ${xs[2]},${ys[2]}`} fill="none" stroke={darkMode ? "#a5b4fc" : "#4f46e5"} strokeWidth="3" />
                  {xs.map((x, i) => (
                    <circle key={i} cx={x} cy={ys[i]} r={4} fill={darkMode ? "#a5b4fc" : "#4f46e5"} />
                  ))}
                </>
              );
            })()}
          </svg>
          <div className="mt-2 flex justify-between text-xs" style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>
            <span>Quiz</span>
            <span>Assignment</span>
            <span>Final</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaticCourseTab;

