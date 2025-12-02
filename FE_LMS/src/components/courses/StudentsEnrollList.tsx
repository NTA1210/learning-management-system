import React, { useEffect, useState } from "react";
import http from "../../utils/http";
import StudentStatisticsModal from "./StudentStatisticsModal";

interface StudentsEnrollListProps {
  courseId: string;
  darkMode: boolean;
}

const StudentsEnrollList: React.FC<StudentsEnrollListProps> = ({
  courseId,
  darkMode,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState<
    string | null
  >(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await http.get(`/enrollments?courseId=${courseId}`);
        const data = (res as any)?.data || [];
        if (mounted) {
          setEnrollments(Array.isArray(data) ? data : data.docs || []);
          setError("");
        }
      } catch (e: any) {
        if (mounted) setError(e?.message || "Failed to load enrollments");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [courseId]);

  if (loading)
    return (
      <div className="py-6 text-center">
        <div
          className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto"
          style={{ borderColor: darkMode ? "#6366f1" : "#4f46e5" }}
        />
      </div>
    );

  if (error)
    return (
      <div
        className="py-6 text-center text-sm"
        style={{ color: darkMode ? "#fca5a5" : "#dc2626" }}
      >
        {error}
      </div>
    );

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3
          className="text-lg font-semibold"
          style={{ color: darkMode ? "#fff" : "#111827" }}
        >
          Enrolled Students
        </h3>
        <div
          className="text-sm"
          style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}
        >
          {enrollments.length} students
        </div>
      </div>

      <div className="space-y-2">
        {enrollments.map((e) => {
          const student = e.studentId || e.student || {};
          const progress = e.progress || e.details || {};
          const lessonsPercent =
            progress?.lessonsPercent ?? progress?.lessons?.percent ?? 0;
          const quizzesPercent =
            progress?.quizAvg ?? progress?.quizzes?.avg ?? 0;
          const assignmentsPercent =
            progress?.assignmentAvg ?? progress?.assignments?.avg ?? 0;

          return (
            <button
              key={e._id}
              onClick={() => setSelectedEnrollmentId(e._id)}
              className={`w-full text-left rounded-lg p-3 flex items-center justify-between transition-colors ${
                darkMode ? "hover:bg-gray-800" : "hover:bg-gray-50"
              }`}
            >
              <div>
                <div
                  className="font-medium flex items-center gap-2"
                  style={{ color: darkMode ? "#fff" : "#111827" }}
                >
                  <span>
                    {student.fullname || student.username || student.email}
                  </span>
                  {/* status badge */}
                  {(() => {
                    const st = (e.status || e.role || "").toLowerCase();
                    let label = st
                      ? st.charAt(0).toUpperCase() + st.slice(1)
                      : "";
                    let bg = darkMode ? "rgba(255,255,255,0.04)" : "#f3f4f6";
                    let color = darkMode ? "#9ca3af" : "#374151";
                    if (st === "completed") {
                      label = "Pass";
                      bg = darkMode ? "rgba(16,185,129,0.12)" : "#d1fae5";
                      color = darkMode ? "#6ee7b7" : "#059669";
                    } else if (st === "dropped") {
                      label = "Not pass";
                      bg = darkMode ? "rgba(239,68,68,0.12)" : "#fee2e2";
                      color = darkMode ? "#fca5a5" : "#dc2626";
                    }

                    return (
                      <span
                        className="text-xs px-2 py-0.5 rounded"
                        style={{ background: bg, color }}
                      >
                        {label}
                      </span>
                    );
                  })()}
                </div>
                <div
                  className="text-xs"
                  style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}
                >
                  {student.email || ""}
                </div>
              </div>

              <div
                className="text-right text-xs"
                style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}
              >
                <div>
                  Final:{" "}
                  <span
                    className="font-semibold"
                    style={{ color: darkMode ? "#fff" : "#111827" }}
                  >
                    {e.finalGrade ?? 0}
                  </span>
                </div>
                <div className="mt-1">
                  L:{Math.round(lessonsPercent)}% Q:{Math.round(quizzesPercent)}
                  % A:{Math.round(assignmentsPercent)}%
                </div>
              </div>
            </button>
          );
        })}

        {enrollments.length === 0 && (
          <div
            className="py-6 text-center text-sm"
            style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}
          >
            No enrollments found for this course.
          </div>
        )}
      </div>

      {selectedEnrollmentId && (
        <StudentStatisticsModal
          enrollmentId={selectedEnrollmentId}
          onClose={() => setSelectedEnrollmentId(null)}
          darkMode={darkMode}
        />
      )}
    </div>
  );
};

export default StudentsEnrollList;
