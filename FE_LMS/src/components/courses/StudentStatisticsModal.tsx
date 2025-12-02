import React, { useEffect, useState } from "react";
import http from "../../utils/http";

interface Props {
  enrollmentId: string;
  onClose: () => void;
  darkMode: boolean;
}

const StudentStatisticsModal: React.FC<Props> = ({
  enrollmentId,
  onClose,
  darkMode,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<any | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await http.get(`/enrollments/${enrollmentId}/statistics`);
        const d = (res as any)?.data || null;
        if (mounted) {
          setData(d);
          setError("");
        }
      } catch (e: any) {
        if (mounted)
          setError(e?.message || "Failed to load student statistics");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [enrollmentId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0"
        style={{ background: darkMode ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.4)" }}
        onClick={onClose}
      />
      <div
        className={`relative w-full max-w-2xl mx-4 rounded-lg p-6`}
        style={{
          background: darkMode ? "#0b1220" : "#ffffff",
          border: darkMode
            ? "1px solid rgba(255,255,255,0.06)"
            : "1px solid #e5e7eb",
        }}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <h4
              className="text-lg font-semibold"
              style={{ color: darkMode ? "#fff" : "#111827" }}
            >
              Student Progress
            </h4>
          </div>
          <button
            onClick={onClose}
            className="text-sm px-2 py-1 rounded"
            style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}
          >
            Close
          </button>
        </div>

        {loading && (
          <div className="py-6 text-center">
            <div
              className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto"
              style={{ borderColor: darkMode ? "#6366f1" : "#4f46e5" }}
            />
          </div>
        )}

        {error && (
          <div
            className="py-4 text-sm"
            style={{ color: darkMode ? "#fca5a5" : "#dc2626" }}
          >
            {error}
          </div>
        )}

        {!loading && data && (
          <div
            className="mt-4 space-y-4 text-sm"
            style={{ color: darkMode ? "#9ca3af" : "#374151" }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="text-xs opacity-70">Student</div>
                <div
                  className="font-medium"
                  style={{ color: darkMode ? "#fff" : "#111827" }}
                >
                  {data.student?.username || data.student?.email}
                </div>
                <div
                  className="text-xs"
                  style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}
                >
                  {data.student?._id}
                </div>
              </div>
              <div>
                <div className="text-xs opacity-70">Course</div>
                <div
                  className="font-medium"
                  style={{ color: darkMode ? "#fff" : "#111827" }}
                >
                  {data.course?.title}
                </div>
                <div
                  className="text-xs"
                  style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}
                >
                  {data.enrollmentId}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div
                className="rounded p-3"
                style={{
                  background: darkMode ? "#071022" : "#f9fafb",
                  border: darkMode
                    ? "1px solid rgba(255,255,255,0.04)"
                    : "1px solid #e5e7eb",
                }}
              >
                <div className="text-xs opacity-70">Lessons</div>
                <div
                  className="font-semibold"
                  style={{ color: darkMode ? "#fff" : "#111827" }}
                >
                  {data.summary?.lessonsPercent ??
                    data.details?.lessons?.total ??
                    0}
                  %
                </div>
              </div>
              <div
                className="rounded p-3"
                style={{
                  background: darkMode ? "#071022" : "#f9fafb",
                  border: darkMode
                    ? "1px solid rgba(255,255,255,0.04)"
                    : "1px solid #e5e7eb",
                }}
              >
                <div className="text-xs opacity-70">Attendance</div>
                <div
                  className="font-semibold"
                  style={{ color: darkMode ? "#fff" : "#111827" }}
                >
                  {data.summary?.attendancePercent ?? 0}%
                </div>
              </div>
            </div>

            <div>
              <div
                className="text-sm font-semibold mb-2"
                style={{ color: darkMode ? "#fff" : "#111827" }}
              >
                Quizzes
              </div>
              <div className="space-y-2">
                {Array.isArray(data.details?.quizzes?.items) &&
                  data.details.quizzes.items.map((q: any, idx: number) => (
                    <div
                      key={q.quizId}
                      className="flex items-center justify-between rounded p-2"
                      style={{ background: darkMode ? "#061224" : "#fff" }}
                    >
                      <div>
                        <div
                          className="font-medium"
                          style={{ color: darkMode ? "#fff" : "#111827" }}
                        >
                          {`Quiz ${idx + 1}`}
                        </div>
                        <div
                          className="text-xs"
                          style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}
                        >
                          {q.isCompleted ? "Completed" : "Not completed"}
                        </div>
                      </div>
                      <div className="font-semibold">{q.score ?? 0}</div>
                    </div>
                  ))}
                {(!Array.isArray(data.details?.quizzes?.items) ||
                  data.details.quizzes.items.length === 0) && (
                  <div
                    className="text-xs"
                    style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}
                  >
                    No quizzes
                  </div>
                )}
              </div>
            </div>

            <div>
              <div
                className="text-sm font-semibold mb-2"
                style={{ color: darkMode ? "#fff" : "#111827" }}
              >
                Assignments
              </div>
              <div className="space-y-2">
                {Array.isArray(data.details?.assignments?.items) &&
                  data.details.assignments.items.map((a: any, idx: number) => (
                    <div
                      key={a.assignmentId}
                      className="flex items-center justify-between rounded p-2"
                      style={{ background: darkMode ? "#061224" : "#fff" }}
                    >
                      <div>
                        <div
                          className="font-medium"
                          style={{ color: darkMode ? "#fff" : "#111827" }}
                        >
                          {`Assignment ${idx + 1}`}
                        </div>
                        <div
                          className="text-xs"
                          style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}
                        >
                          {a.isCompleted ? "Completed" : "Not completed"}
                        </div>
                      </div>
                      <div className="font-semibold">{a.score ?? 0}</div>
                    </div>
                  ))}
                {(!Array.isArray(data.details?.assignments?.items) ||
                  data.details.assignments.items.length === 0) && (
                  <div
                    className="text-xs"
                    style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}
                  >
                    No assignments
                  </div>
                )}
              </div>
              {data &&
                (() => {
                  const st = (data.status || "").toString().toLowerCase();
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
                    <div className="flex justify-end">
                      <span
                        className="text-xl font-semibold px-2 py-0.5 rounded"
                        style={{ background: bg, color }}
                      >
                        {label}
                      </span>
                    </div>
                  );
                })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentStatisticsModal;
