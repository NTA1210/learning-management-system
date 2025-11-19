import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../hooks/useTheme";
import { feedbackService } from "../services/feedbackService";
import type { Feedback, FeedbackMeta, FeedbackPagination } from "../types/feedback";

function formatDate(value: string, timezone?: string) {
  try {
    const options: Intl.DateTimeFormatOptions = {
      dateStyle: "medium",
      timeStyle: "short",
    };

    if (timezone) {
      options.timeZone = timezone;
    }

    return new Intl.DateTimeFormat("vi-VN", options).format(new Date(value));
  } catch {
    return value;
  }
}

export default function FeedbackList() {
  const { darkMode } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin";
  const isStudent = user?.role === "student";
  const canCreateFeedback = !isAdmin;
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [pagination, setPagination] = useState<FeedbackPagination | undefined>();
  const [meta, setMeta] = useState<FeedbackMeta | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchFeedbacks = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await feedbackService.getFeedbacks();
      setFeedbacks(response.feedbacks);
      setPagination(response.pagination);
      setMeta(response.meta);
    } catch (err) {
      console.error(err);
      setError("Unable to load feedbacks. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this feedback?")) return;
    setDeletingId(id);
    try {
      await feedbackService.deleteFeedback(id);
      setFeedbacks((prev) => prev.filter((fb) => fb._id !== id));
    } catch (err) {
      console.error(err);
      setError("Failed to delete feedback. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    void fetchFeedbacks();
  }, []);

  const heroDescription = isStudent
    ? "Xem lại toàn bộ phản hồi mà bạn đã gửi cho hệ thống."
    : "Review the latest suggestions from learners and spot trends quickly.";

  const summary = useMemo(() => {
    if (!feedbacks.length) return null;
    const count = feedbacks.length;
    const average =
      feedbacks.reduce((acc, fb) => acc + (fb.rating || 0), 0) / Math.max(count, 1);
    const byType = feedbacks.reduce<Record<string, number>>((acc, fb) => {
      acc[fb.type] = (acc[fb.type] || 0) + 1;
      return acc;
    }, {});
    return { count, average: Number(average.toFixed(1)), byType };
  }, [feedbacks]);

  return (
    <div
      className="flex h-screen overflow-hidden relative"
      style={{
        backgroundColor: darkMode ? "#0b1220" : "#f5f7fb",
        color: darkMode ? "#e5e7eb" : "#1f2937",
      }}
    >
      <Navbar />
      <Sidebar role={(user?.role as "admin" | "teacher" | "student") || "student"} />
      <main className="flex-1 overflow-y-auto pt-24 px-6 sm:px-10">
        <style>
          {`
            @keyframes fadeUp {
              from { opacity: 0; transform: translateY(12px); }
              to { opacity: 1; transform: translateY(0); }
            }
            @keyframes floaty {
              0% { transform: translateY(0); }
              50% { transform: translateY(-6px); }
              100% { transform: translateY(0); }
            }
            @keyframes shimmerBar {
              0% { background-position: -200% 0; }
              100% { background-position: 200% 0; }
            }
            @keyframes pulseRing {
              0% { box-shadow: 0 0 0 0 rgba(82, 95, 225, 0.45); }
              70% { box-shadow: 0 0 0 16px rgba(82, 95, 225, 0); }
              100% { box-shadow: 0 0 0 0 rgba(82, 95, 225, 0); }
            }
            @keyframes ratingGlow {
              0% { box-shadow: 0 5px 18px rgba(250, 204, 21, 0.25); transform: translateY(0); }
              50% { box-shadow: 0 8px 24px rgba(251, 191, 36, 0.45); transform: translateY(-1px); }
              100% { box-shadow: 0 5px 18px rgba(250, 204, 21, 0.25); transform: translateY(0); }
            }
            @keyframes starPulse {
              0% { transform: scale(1); filter: drop-shadow(0 0 0 rgba(251,191,36,0.45)); }
              50% { transform: scale(1.12); filter: drop-shadow(0 0 6px rgba(251,191,36,0.65)); }
              100% { transform: scale(1); filter: drop-shadow(0 0 0 rgba(251,191,36,0.45)); }
            }
            .rating-pill {
              background-image: linear-gradient(120deg, #facc15, #f97316);
              color: #78350f;
              padding: 0.35rem 0.8rem;
              border-radius: 999px;
              box-shadow: 0 5px 18px rgba(250, 204, 21, 0.25);
              animation: ratingGlow 3s ease-in-out infinite;
            }
            .rating-pill svg {
              animation: starPulse 2.8s ease-in-out infinite;
            }
            @keyframes infoGlow {
              0% { opacity: 0.85; transform: translateY(0); }
              50% { opacity: 1; transform: translateY(-1px); }
              100% { opacity: 0.85; transform: translateY(0); }
            }
            .info-line {
              color: #1d4ed8;
              animation: infoGlow 5s ease-in-out infinite;
            }
            .info-chip {
              background: rgba(59,130,246,0.08);
              border: 1px solid rgba(59,130,246,0.25);
              padding: 0.35rem 0.75rem;
              border-radius: 999px;
              color: inherit;
              display: inline-flex;
              align-items: center;
              gap: 0.25rem;
            }
            .fade-up { animation: fadeUp 400ms ease forwards; }
            .float-card { animation: floaty 6s ease-in-out infinite; }
            .shimmer-line {
              position: relative;
              overflow: hidden;
            }
            .shimmer-line::after {
              content: "";
              position: absolute;
              inset: 0;
              background-image: linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.25) 50%, transparent 100%);
              background-size: 200% 100%;
              animation: shimmerBar 2s linear infinite;
            }
            .pulse-button {
              animation: pulseRing 2.4s ease-out infinite;
            }
            .pulse-button::after {
              content: "";
              position: absolute;
              inset: 0;
              border-radius: inherit;
              background-image: linear-gradient(135deg, rgba(255,255,255,0.2), transparent);
              opacity: 0;
              transition: opacity 200ms ease;
            }
            .pulse-button:hover::after {
              opacity: 1;
            }
          `}
        </style>
        <div className="max-w-5xl mx-auto">
          <div
            className="h-1.5 w-24 rounded-full mb-4 shimmer-line"
            style={{
              background: "linear-gradient(90deg, #525fe1, #7c3aed, #14b8a6)",
              backgroundSize: "200% 100%",
            }}
          />
          <div className="flex items-center justify-between mb-6 fade-up" style={{ animationDelay: "60ms" }}>
            <div>
              <p className="text-sm uppercase tracking-wide text-indigo-400 font-semibold">
                Feedback Center
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold mt-1">Feedback overview</h1>
              <p className="text-sm mt-1" style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>
                {heroDescription}
              </p>
            </div>
            <div className="flex gap-3 flex-wrap justify-end">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-4 py-2 rounded-xl font-semibold border transition-all hover:-translate-y-0.5 pulse-button relative"
                style={{
                  background: darkMode ? "rgba(30,41,59,0.75)" : "rgba(82,95,225,0.12)",
                  color: darkMode ? "#e5e7eb" : "#4f46e5",
                  borderColor: darkMode ? "rgba(148,163,184,0.4)" : "rgba(99,102,241,0.4)",
                }}
              >
                Go back
              </button>
              {canCreateFeedback && (
                <button
                  type="button"
                  onClick={() => navigate("/help/feedback")}
                  className="px-4 py-2 rounded-xl font-semibold border border-transparent transition-all hover:-translate-y-0.5"
                  style={{
                    background: darkMode ? "#1f2937" : "#eef2ff",
                    color: darkMode ? "#e5e7eb" : "#4338ca",
                  }}
                >
                  Create new feedback
                </button>
              )}
              <button
                type="button"
                onClick={() => void fetchFeedbacks()}
                className="px-4 py-2 rounded-xl font-semibold border border-transparent transition-all hover:-translate-y-0.5"
                style={{
                  background: "linear-gradient(135deg, #525fe1 0%, #7c3aed 100%)",
                  color: "#fff",
                }}
                disabled={loading}
              >
                {loading ? "Loading..." : "Refresh"}
              </button>
            </div>
          </div>

          {summary && (
            <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 fade-up" style={{ animationDelay: "120ms" }}>
              <div
                className="rounded-2xl p-4 shadow float-card"
                style={{ background: darkMode ? "rgba(17,24,39,0.8)" : "#fff" }}
              >
                <p className="text-xs uppercase tracking-wide text-gray-400">Total feedback</p>
                <p className="text-2xl font-bold mt-2">{summary.count}</p>
              </div>
              <div
                className="rounded-2xl p-4 shadow float-card"
                style={{ background: darkMode ? "rgba(17,24,39,0.8)" : "#fff" }}
              >
                <p className="text-xs uppercase tracking-wide text-gray-400">Average rating</p>
                <p className="text-2xl font-bold mt-2">{summary.average}/5</p>
              </div>
              <div
                className="rounded-2xl p-4 shadow float-card"
                style={{ background: darkMode ? "rgba(17,24,39,0.8)" : "#fff" }}
              >
                <p className="text-xs uppercase tracking-wide text-gray-400">By type</p>
                <div className="flex flex-wrap gap-2 mt-2 text-sm">
                  {Object.entries(summary.byType).map(([type, count]) => (
                    <span
                      key={type}
                      className="px-3 py-1 rounded-full"
                      style={{
                        background: darkMode ? "rgba(79,70,229,0.15)" : "rgba(79,70,229,0.1)",
                        color: darkMode ? "#c7d2fe" : "#4338ca",
                      }}
                    >
                      {type}: {count}
                    </span>
                  ))}
                </div>
              </div>
            </section>
          )}

          <section
            className="rounded-2xl shadow-lg p-6 space-y-4 fade-up"
            style={{
              animationDelay: "180ms",
              background: darkMode ? "rgba(17, 24, 39, 0.8)" : "rgba(255,255,255,0.95)",
              border: "1px solid rgba(148, 163, 184, 0.15)",
              backdropFilter: "blur(8px)",
            }}
          >
            {error && (
              <div className="p-3 rounded-lg text-sm" style={{ background: "#fee2e2", color: "#b91c1c" }}>
                {error}
              </div>
            )}

            {loading && (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="animate-pulse h-20 rounded-xl"
                    style={{ background: darkMode ? "rgba(30,41,59,0.7)" : "#f3f4f6" }}
                  />
                ))}
              </div>
            )}

            {!loading && feedbacks.length === 0 && (
              <div className="text-center py-12">
                <p className="text-lg font-semibold">No feedback yet.</p>
                <p className="text-sm mt-2" style={{ color: darkMode ? "#94a3b8" : "#6b7280" }}>
                  {isStudent ? "Bạn chưa gửi phản hồi nào. Hãy chia sẻ trải nghiệm của bạn khi sẵn sàng." : "Be the first one to share your experience with us."}
                </p>
                {canCreateFeedback && (
                  <button
                    type="button"
                    onClick={() => navigate("/help/feedback")}
                    className="mt-4 px-4 py-2 rounded-xl font-semibold border border-transparent transition-all hover:-translate-y-0.5"
                    style={{
                      background: darkMode ? "#1f2937" : "#eef2ff",
                      color: darkMode ? "#e5e7eb" : "#4338ca",
                    }}
                  >
                    Create new feedback
                  </button>
                )}
              </div>
            )}

            {!loading &&
              feedbacks.map((fb, index) => (
                <article
                  key={fb._id}
                  className="rounded-2xl p-4 border transition hover:-translate-y-0.5 fade-up"
                  style={{
                    animationDelay: `${220 + index * 60}ms`,
                    borderColor: darkMode ? "rgba(148,163,184,0.2)" : "rgba(148,163,184,0.4)",
                    background: darkMode ? "rgba(15,23,42,0.9)" : "#fff",
                  }}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-xs uppercase tracking-wide" style={{ color: "#7c3aed" }}>
                        {fb.type}
                      </p>
                      <h3 className="text-lg font-semibold mt-1 text-red-700">{fb.title}</h3>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="rating-pill flex items-center gap-1 text-sm font-semibold">
                        <span>{fb.rating}/5</span>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="#fde047"
                          stroke="#f59e0b"
                          className="w-4 h-4"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="1.5"
                            d="M11.48 3.499a.562.562 0 011.04 0l2.012 5.111a.563.563 0 00.475.354l5.518.403c.499.036.701.663.322.988l-4.204 3.57a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0l-4.725 2.885a.562.562 0 01-.84-.61l1.285-5.386a.563.563 0 00-.182-.557l-4.204-3.57a.563.563 0 01.322-.988l5.518-.403a.563.563 0 00.475-.354l2.012-5.11z"
                          />
                        </svg>
                      </div>
                      <p className="text-xs" style={{ color: darkMode ? "#94a3b8" : "#6b7280" }}>
                        {formatDate(fb.createdAt, meta?.timezone)}
                      </p>
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => void handleDelete(fb._id)}
                          disabled={deletingId === fb._id}
                          className="text-xs px-3 py-1 rounded-full border transition-all"
                          style={{
                            borderColor: "rgba(248,113,113,0.4)",
                            color: "#dc2626",
                            opacity: deletingId === fb._id ? 0.6 : 1,
                          }}
                        >
                          {deletingId === fb._id ? "Deleting..." : "Delete"}
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm mt-3" style={{ color: darkMode ? "#cbd5e1" : "#374151" }}>
                    {fb.description}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 mt-4 text-xs info-line">
                    <span className="info-chip">
                      Submitted by:{" "}
                      <strong style={{ color: darkMode ? "#fff" : "#1e40af" }}>
                        {fb.userId?.fullname || fb.userId?.username}
                      </strong>
                    </span>
                    <span className="info-chip">Email: {fb.userId?.email}</span>
                    {fb.size !== undefined && <span className="info-chip">Attachment size: {fb.size} KB</span>}
                  </div>
                </article>
              ))}
          </section>

          {pagination && (
            <div className="mt-6 text-sm flex flex-wrap items-center gap-4" style={{ color: darkMode ? "#94a3b8" : "#6b7280" }}>
              <span>
                Page {pagination.page}/{pagination.totalPages} • Total {pagination.total} feedback
              </span>
              <span>Page size: {pagination.limit}</span>
            </div>
          )}

          {meta && (
            <div className="mt-2 text-xs" style={{ color: darkMode ? "#6b7280" : "#9ca3af" }}>
              Last updated: {meta.timestamp ? formatDate(meta.timestamp, meta.timezone) : "Unknown"}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

