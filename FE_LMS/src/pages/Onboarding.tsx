import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../hooks/useTheme";
import { useAuth } from "../hooks/useAuth";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { majorService, specialistService, userService } from "../services";
import type { Major } from "../types/specialist";
import type { UserDetail } from "../services/userService";

interface SpecialistOption {
  _id: string;
  name: string;
  description?: string;
  majorId?: string | { _id: string; name: string };
}

const STUDENT_SPECIALIST_KEY = "lms:studentSpecialistIds";

const Onboarding: React.FC = () => {
  const { darkMode } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [contentPaddingLeft, setContentPaddingLeft] = useState(
    window.innerWidth >= 640 ? 93 : 0
  );

  const [majors, setMajors] = useState<Major[]>([]);
  const [specialists, setSpecialists] = useState<SpecialistOption[]>([]);
  const [selectedMajorId, setSelectedMajorId] = useState<string>("");
  const [selectedSpecialistId, setSelectedSpecialistId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Responsive padding like other pages
  useEffect(() => {
    const handleResize = () => {
      setContentPaddingLeft(window.innerWidth >= 640 ? 93 : 0);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Guard: only students without specialistIds should see this
  useEffect(() => {
    if (!user) {
      return;
    }

    // Non-students skip onboarding
    if (user.role !== "student") {
      navigate("/dashboard");
      return;
    }

    try {
      // Check stored user detail (from /users/me) first
      const rawStored = localStorage.getItem("lms:user");
      if (rawStored) {
        const storedUser = JSON.parse(rawStored) as UserDetail;
        const hasSpecialists =
          Array.isArray(storedUser.specialistIds) &&
          storedUser.specialistIds.length > 0;
        if (hasSpecialists) {
          navigate("/student-dashboard");
          return;
        }
      }

      // Fallback: explicit local key
      const localSpec = localStorage.getItem(STUDENT_SPECIALIST_KEY);
      if (localSpec) {
        const parsed = JSON.parse(localSpec) as string[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          navigate("/student-dashboard");
        }
      }
    } catch {
      // ignore parse errors, just stay on onboarding
    }
  }, [navigate, user]);

  // Load majors on mount
  useEffect(() => {
    const fetchMajors = async () => {
      try {
        setLoading(true);
        setError(null);
        const { majors: majorList } = await majorService.getAllMajors({
          limit: 100,
          sortBy: "title",
          sortOrder: "asc",
        } as any);
        setMajors(majorList);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load majors";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchMajors();
  }, []);

  // Load specialists when major changes
  useEffect(() => {
    if (!selectedMajorId) {
      setSpecialists([]);
      setSelectedSpecialistId("");
      return;
    }

    const fetchSpecialists = async () => {
      try {
        setLoading(true);
        setError(null);
        const { specialists: specialistList } =
          await specialistService.getAllSpecialists({
            majorId: selectedMajorId,
            // isActive: true,  //  expected boolean, received string  uncomment this if you want to filter by active specialists
            limit: 100,
            sortBy: "title",
            sortOrder: "asc",
          } as any);
        setSpecialists(specialistList as SpecialistOption[]);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load specialists";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchSpecialists();
  }, [selectedMajorId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || user.role !== "student") {
      return;
    }
    if (!selectedMajorId || !selectedSpecialistId) {
      setError("Please choose both a major and a specialist to continue.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const updated = await userService.updateUserSpecialists(user._id, [
        selectedSpecialistId,
      ]);

      // Persist to dedicated key
      try {
        localStorage.setItem(
          STUDENT_SPECIALIST_KEY,
          JSON.stringify(updated.specialistIds ?? [selectedSpecialistId])
        );
      } catch {
        // ignore storage errors
      }

      // Also refresh stored current user if present
      try {
        const rawStored = localStorage.getItem("lms:user");
        if (rawStored) {
          const storedUser = JSON.parse(rawStored) as UserDetail;
          const merged = {
            ...storedUser,
            specialistIds: updated.specialistIds ?? [selectedSpecialistId],
          };
            localStorage.setItem("lms:user", JSON.stringify(merged));
        }
      } catch {
        // ignore
      }

      navigate("/student-dashboard");
    } catch (err) {
      const message =
        (err as any)?.message || "Failed to save your specialist selection";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex h-screen overflow-hidden relative"
      style={{
        backgroundColor: darkMode ? "#0f172a" : "#f3f4f6",
        color: darkMode ? "#e5e7eb" : "#111827",
      }}
    >
      <Navbar />
      <Sidebar
        role={(user?.role as "admin" | "teacher" | "student") || "student"}
      />

      <div
        className="flex flex-col flex-1 w-0 overflow-hidden"
        style={{
          paddingLeft: contentPaddingLeft,
          background:
            "radial-gradient(circle at top left, rgba(59,130,246,0.12), transparent 55%), radial-gradient(circle at bottom right, rgba(16,185,129,0.12), transparent 55%)",
        }}
      >
        <main className="flex-1 relative overflow-y-auto focus:outline-none p-4 mt-16">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <span
                className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold mb-3"
                style={{
                  backgroundColor: darkMode
                    ? "rgba(59,130,246,0.15)"
                    : "rgba(59,130,246,0.08)",
                  color: darkMode ? "#bfdbfe" : "#1d4ed8",
                }}
              >
                Welcome, new student
              </span>
              <h1
                className="text-3xl font-bold mb-2"
                style={{ color: darkMode ? "#f9fafb" : "#111827" }}
              >
                Choose your major and specialist
              </h1>
              <p
                className="text-sm max-w-2xl"
                style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}
              >
                To personalize your learning journey, pick the major you are
                enrolled in and the specialist track you want to follow. You
                can always discuss changes with your academic advisor later.
              </p>
            </div>

            <div
              className="rounded-2xl shadow-lg border overflow-hidden"
              style={{
                backgroundColor: darkMode ? "#020617" : "#ffffff",
                borderColor: darkMode ? "#1e293b" : "#e5e7eb",
              }}
            >
              <div
                className="px-6 py-4 border-b flex items-center justify-between"
                style={{
                  borderColor: darkMode ? "#1e293b" : "#e5e7eb",
                  background: darkMode
                    ? "linear-gradient(to right, #020617, #0f172a)"
                    : "linear-gradient(to right, #eff6ff, #ecfdf5)",
                }}
              >
                <div>
                  <h2
                    className="text-lg font-semibold"
                    style={{ color: darkMode ? "#e5e7eb" : "#111827" }}
                  >
                    Academic profile
                  </h2>
                  <p
                    className="text-xs"
                    style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}
                  >
                    This helps us show you the most relevant courses,
                    announcements, and resources.
                  </p>
                </div>
                {user && (
                  <div className="hidden sm:flex items-center gap-2 text-xs">
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.fullname}
                        className="h-8 w-8 rounded-full object-cover border"
                      />
                    ) : (
                      <div
                        className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold"
                        style={{
                          backgroundColor: darkMode ? "#1d4ed8" : "#3b82f6",
                          color: "#ffffff",
                        }}
                      >
                        {user.fullname?.charAt(0)?.toUpperCase() ??
                          user.username?.charAt(0)?.toUpperCase() ??
                          "S"}
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span
                        className="font-medium"
                        style={{ color: darkMode ? "#e5e7eb" : "#111827" }}
                      >
                        {user.fullname || user.username}
                      </span>
                      <span
                        style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}
                      >
                        Student
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {error && (
                  <div
                    className="text-sm rounded-lg px-4 py-3 flex items-start gap-2"
                    style={{
                      backgroundColor: darkMode
                        ? "rgba(248,113,113,0.12)"
                        : "#fee2e2",
                      color: darkMode ? "#fecaca" : "#b91c1c",
                    }}
                  >
                    <svg
                      className="w-4 h-4 mt-0.5 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.5a.75.75 0 00-1.5 0v4a.75.75 0 001.5 0v-4zM10 13a1 1 0 100 2 1 1 0 000-2z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-1">
                  <label
                    className="block text-sm font-medium mb-1"
                    htmlFor="major"
                    style={{ color: darkMode ? "#e5e7eb" : "#111827" }}
                  >
                    Major
                  </label>
                  <select
                    id="major"
                    value={selectedMajorId}
                    onChange={(e) => {
                      setSelectedMajorId(e.target.value);
                      setSelectedSpecialistId("");
                    }}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{
                      backgroundColor: darkMode ? "#020617" : "#ffffff",
                      borderColor: darkMode ? "#1e293b" : "#d1d5db",
                      color: darkMode ? "#e5e7eb" : "#111827",
                    }}
                  >
                    <option value="">Select your major</option>
                    {majors.map((major) => (
                      <option key={major._id} value={major._id}>
                        {major.name}
                      </option>
                    ))}
                  </select>
                  <p
                    className="text-xs"
                    style={{ color: darkMode ? "#6b7280" : "#9ca3af" }}
                  >
                    Your major defines the broad field of study for your
                    program.
                  </p>
                </div>

                <div className="space-y-1">
                  <label
                    className="block text-sm font-medium mb-1"
                    htmlFor="specialist"
                    style={{ color: darkMode ? "#e5e7eb" : "#111827" }}
                  >
                    Specialist
                  </label>
                  <select
                    id="specialist"
                    value={selectedSpecialistId}
                    onChange={(e) => setSelectedSpecialistId(e.target.value)}
                    disabled={!selectedMajorId || specialists.length === 0}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                    style={{
                      backgroundColor: darkMode ? "#020617" : "#ffffff",
                      borderColor: darkMode ? "#1e293b" : "#d1d5db",
                      color: darkMode ? "#e5e7eb" : "#111827",
                    }}
                  >
                    {!selectedMajorId ? (
                      <option value="">
                        Select a major first to see specialists
                      </option>
                    ) : specialists.length === 0 ? (
                      <option value="">
                        No specialists found for this major yet
                      </option>
                    ) : (
                      <>
                        <option value="">Select your specialist</option>
                        {specialists.map((spec) => (
                          <option key={spec._id} value={spec._id}>
                            {spec.name}
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                  <p
                    className="text-xs"
                    style={{ color: darkMode ? "#6b7280" : "#9ca3af" }}
                  >
                    Specialists are focused tracks within a major, such as
                    AI, Web Development, or Data Science.
                  </p>

                  {selectedSpecialistId && (
                    <div
                      className="mt-3 rounded-lg border px-3 py-2 text-xs"
                      style={{
                        backgroundColor: darkMode
                          ? "rgba(37,99,235,0.12)"
                          : "#eff6ff",
                        borderColor: darkMode ? "#1d4ed8" : "#bfdbfe",
                        color: darkMode ? "#bfdbfe" : "#1d4ed8",
                      }}
                    >
                      <span className="font-semibold">Great choice!</span>{" "}
                      We’ll use this to recommend courses and materials that
                      match your specialist track.
                    </div>
                  )}
                </div>

                <div className="pt-4 flex items-center justify-between">
                  <p
                    className="text-xs"
                    style={{ color: darkMode ? "#6b7280" : "#9ca3af" }}
                  >
                    You can update your specialist later by contacting an
                    administrator.
                  </p>
                  <button
                    type="submit"
                    disabled={
                      loading || !selectedMajorId || !selectedSpecialistId
                    }
                    className="px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 disabled:opacity-60"
                    style={{
                      backgroundColor: darkMode ? "#2563eb" : "#3b82f6",
                      color: "#ffffff",
                    }}
                  >
                    {loading ? (
                      <>
                        <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        Continue to dashboard
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Onboarding;


