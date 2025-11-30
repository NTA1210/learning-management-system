import React, { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { useTheme } from "../hooks/useTheme";
import { useAuth } from "../hooks/useAuth";
import type { Course } from "../types/course";
import { courseService } from "../services";
import { forumService, type CreateForumPayload, type ForumType } from "../services/forumService";
import { Flame, Loader2, MessageSquareText, Sparkles, Users } from "lucide-react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

type SidebarRole = "admin" | "teacher" | "student";

interface ForumActivity {
  id: string;
  title: string;
  courseTitle: string;
  preview: string;
  author: string;
  replies: number;
  forumType: ForumType;
  updatedAt: string;
}

const forumTypeOptions: Array<{
  value: ForumType;
  label: string;
  hint: string;
}> = [
  {
    value: "discussion",
    label: "Open discussion",
    hint: "Share ideas, experiences, and learning resources with classmates.",
  },
  {
    value: "announcement",
    label: "Announcement",
    hint: "Post important reminders or updates for the whole class.",
  },
];

interface ForumLocationState {
  preselectedCourseId?: string;
  preselectedCourseTitle?: string;
}

interface CreateForumFormState extends CreateForumPayload {
  file: File | null;
}

const ForumPage: React.FC = () => {
  const { darkMode } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams();
  const locationState = (location.state as ForumLocationState | null) ?? null;
  const searchCourseId = searchParams.get("courseId") ?? "";
  const searchCourseTitle = searchParams.get("courseTitle") ?? "";
  const initialCourseId = locationState?.preselectedCourseId || searchCourseId;
  const initialCourseTitle = locationState?.preselectedCourseTitle || searchCourseTitle;
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseLoading, setCourseLoading] = useState(true);
  const [courseError, setCourseError] = useState<string | null>(null);
  const [form, setForm] = useState<CreateForumFormState>({
    courseId: initialCourseId || "",
    title: "",
    description: "",
    forumType: "discussion",
    isActive: true,
    file: null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const formatFileSize = (size: number) => {
    if (!size || Number.isNaN(size)) return "0 B";
    const units = ["B", "KB", "MB", "GB"];
    const exponent = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1);
    const value = size / 1024 ** exponent;
    const formatted = exponent === 0 || value >= 10 ? value.toFixed(0) : value.toFixed(1);
    return `${formatted} ${units[exponent]}`;
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setCourseLoading(true);
        const response = await courseService.getAllCourses({ limit: 100, sortBy: "title", sortOrder: "asc" });
        const normalized = Array.isArray(response.courses) ? response.courses.filter(Boolean) : [];
        if (!mounted) return;
        setCourses(normalized);
        setCourseError(null);
      } catch (error) {
        if (!mounted) return;
        const message = error instanceof Error ? error.message : "Unable to load course list";
        setCourseError(message);
        setCourses([]);
      } finally {
        if (mounted) setCourseLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!feedback) return;
    const timeout = setTimeout(() => setFeedback(null), 4000);
    return () => clearTimeout(timeout);
  }, [feedback]);

  const selectedCourse = useMemo(
    () => courses.find((course) => course._id === form.courseId) ?? null,
    [courses, form.courseId]
  );
  const hasLockedCourse = Boolean(form.courseId);
  const lockedCourseTitle = selectedCourse?.title || initialCourseTitle || "";
  const courseTitleDisplay = lockedCourseTitle || (hasLockedCourse ? "Course" : "");
  const courseDescriptionDisplay =
    selectedCourse?.description ||
    (hasLockedCourse ? "Forum topics are visible to every participant enrolled in this course." : "");

  useEffect(() => {
    if (!initialCourseId) return;
    setForm((prev) => (prev.courseId === initialCourseId ? prev : { ...prev, courseId: initialCourseId }));
  }, [initialCourseId]);

  // Keep URL in sync so reloads preserve the locked course context.
  useEffect(() => {
    if (!initialCourseId) return;
    const shouldUpdateCourseId = searchCourseId !== initialCourseId;
    const shouldUpdateTitle = lockedCourseTitle ? searchCourseTitle !== lockedCourseTitle : Boolean(searchCourseTitle);
    if (!shouldUpdateCourseId && !shouldUpdateTitle) return;

    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("courseId", initialCourseId);
    if (lockedCourseTitle) {
      nextParams.set("courseTitle", lockedCourseTitle);
    } else {
      nextParams.delete("courseTitle");
    }
    setSearchParams(nextParams, { replace: true });
  }, [initialCourseId, lockedCourseTitle, searchCourseId, searchCourseTitle, searchParams, setSearchParams]);

  const sidebarRole: SidebarRole =
    user && ["admin", "teacher", "student"].includes(user.role)
      ? (user.role as SidebarRole)
      : "student";
  const isStudent = user?.role === "student";

  useEffect(() => {
    if (!isStudent) return;
    setForm((prev) => (prev.forumType === "discussion" ? prev : { ...prev, forumType: "discussion" }));
  }, [isStudent]);

  const setFormValue = <K extends keyof CreateForumFormState>(key: K, value: CreateForumFormState[K]) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);

    if (!form.courseId) {
      setFeedback({ type: "error", message: "Open the course detail page and use \"Create Forum Post\" to start a topic." });
      return;
    }

    if (!form.title.trim() || !form.description.trim()) {
      setFeedback({ type: "error", message: "Please enter both a title and a description." });
      return;
    }

    try {
      setSubmitting(true);
      const payload: CreateForumPayload = {
        courseId: form.courseId,
        title: form.title.trim(),
        description: form.description.trim(),
        forumType: form.forumType,
        isActive: form.isActive,
      };
      await forumService.createForum(payload, form.file || undefined);

      setFeedback({ type: "success", message: "Forum topic created successfully." });
      setForm((prev) => ({
        ...prev,
        title: "",
        description: "",
        file: null,
      }));

      const courseTitle = courseTitleDisplay || "Course";
      const newActivity: ForumActivity = {
        id: `${Date.now()}`,
        title: payload.title,
        courseTitle,
        preview: payload.description.slice(0, 140).concat(payload.description.length > 140 ? "..." : ""),
        author: user?.fullname || user?.username || "You",
        replies: 0,
        forumType: payload.forumType,
        updatedAt: "Just now",
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to create forum topic";
      setFeedback({ type: "error", message });
    } finally {
      setSubmitting(false);
    }
  };

  const containerStyles = {
    backgroundColor: darkMode ? "#0f172a" : "#f8fafc",
    color: darkMode ? "#e2e8f0" : "#0f172a",
  };

  const panelStyles = darkMode
    ? "bg-slate-900/70 border border-slate-700/60"
    : "bg-white border border-slate-100";

  return (
    <div className="flex h-screen overflow-hidden relative" style={containerStyles}>
      <Navbar />
      <Sidebar role={sidebarRole} />

      <div className="flex flex-col flex-1 w-0 overflow-hidden">
        <main className="flex-1 relative overflow-y-auto focus:outline-none p-4 mt-16 sm:pl-24 md:pl-28">
          <div className="max-w-6xl mx-auto space-y-6 pb-12">
            <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm uppercase tracking-wide text-indigo-500 font-semibold">Community Hub</p>
                <h1 className="text-3xl font-bold mt-1">
                  Connect &amp; collaborate with your cohort
                </h1>
                <p className="text-slate-500 dark:text-slate-300 max-w-2xl mt-2">
                  Create topics, ask for help, and share learning tips with everyone enrolled in the course you are working on.
                </p>
              </div>
              <div
                className={`flex items-center gap-3 rounded-2xl px-5 py-3 shadow-lg ${darkMode ? "bg-indigo-600/20 border border-indigo-500/30" : "bg-indigo-50 border border-indigo-100"}`}
              >
                <Sparkles className="w-5 h-5 text-indigo-500" />
                <div>
                  <p className="text-xs text-slate-500 uppercase">Active members</p>
                  <p className="text-lg font-semibold">+24 in 24h</p>
                </div>
              </div>
            </header>

            {feedback && (
              <div
                className={`rounded-xl border px-4 py-3 flex items-start gap-3 ${
                  feedback.type === "success"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                    : "bg-rose-50 border-rose-200 text-rose-700"
                }`}
              >
                <MessageSquareText className="w-5 h-5 mt-0.5" />
                <div>
                  <p className="font-semibold">{feedback.type === "success" ? "Success" : "Something went wrong"}</p>
                  <p className="text-sm">{feedback.message}</p>
                </div>
              </div>
            )}

            <div className="grid gap-6 xl:grid-cols-[2fr,1fr]">
              <section className="space-y-6">
                <div className={`rounded-2xl p-6 shadow-sm ${panelStyles}`}>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <p className="text-sm text-slate-400 uppercase">Create a topic</p>
                      <h2 className="text-2xl font-semibold mt-1">Share what matters to your class</h2>
                    </div>
                    <Users className="w-10 h-10 text-indigo-400" />
                  </div>

                  <form className="space-y-5" onSubmit={handleSubmit}>
                    <div>
                      <label className="block text-sm font-medium mb-2">Course</label>
                      {courseLoading ? (
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Loading course list...
                        </div>
                      ) : hasLockedCourse ? (
                        <div
                          className={`rounded-xl border px-4 py-3 ${
                            darkMode ? "bg-slate-900 border-slate-700" : "bg-slate-50 border-slate-200"
                          }`}
                        >
                          <p className="text-xs uppercase tracking-wide text-slate-400">Creating topic for</p>
                          <p className="text-lg font-semibold">{courseTitleDisplay}</p>
                          <p className="text-xs text-slate-500 mt-1 break-all">ID: {form.courseId}</p>
                        </div>
                      ) : (
                        <div
                          className={`rounded-xl border px-4 py-4 space-y-3 ${
                            darkMode ? "bg-slate-900 border-slate-700" : "bg-slate-50 border-slate-200"
                          }`}
                        >
                          <p className="font-semibold">No course selected</p>
                          <p className="text-sm text-slate-500">
                            Open a course detail page and click <span className="font-medium">"Create Forum Post"</span> to open this screen with that course locked in.
                          </p>
                          <button
                            type="button"
                            onClick={() => navigate("/courses")}
                            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-white text-sm font-semibold hover:bg-indigo-500"
                          >
                            Back to courses
                          </button>
                        </div>
                      )}
                      {courseError && <p className="text-sm text-rose-500 mt-1">{courseError}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Title</label>
                      <input
                        type="text"
                        className={`w-full rounded-xl border px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
                          darkMode ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200"
                        } ${hasLockedCourse ? "" : "opacity-50 cursor-not-allowed"}`}
                        placeholder="Example: Discussion for project week 5"
                        value={form.title}
                        onChange={(event) => setFormValue("title", event.target.value)}
                        disabled={!hasLockedCourse}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Description</label>
                      <textarea
                        className={`w-full h-32 rounded-xl border px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
                          darkMode ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200"
                        } ${hasLockedCourse ? "" : "opacity-50 cursor-not-allowed"}`}
                        placeholder="Share context, questions, or any resources the class should review together..."
                        value={form.description}
                        onChange={(event) => setFormValue("description", event.target.value)}
                        disabled={!hasLockedCourse}
                      ></textarea>
                    </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Cover image (optional)</label>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={!hasLockedCourse}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        file: event.target.files?.[0] || null,
                      }))
                    }
                    className={`w-full rounded-xl border px-4 py-2.5 text-sm file:mr-4 file:rounded-full file:border-0 file:bg-indigo-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-indigo-500 cursor-pointer ${
                      hasLockedCourse ? "" : "opacity-50 cursor-not-allowed"
                    }`}
                  />
                  {form.file && (
                    <div
                      className={`mt-2 flex items-center justify-between rounded-xl px-3 py-2 text-xs ${
                        darkMode ? "bg-slate-800 text-slate-200" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      <span className="truncate pr-2">
                        {form.file.name} • {formatFileSize(form.file.size)}
                      </span>
                      <button
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, file: null }))}
                        className="text-rose-500 font-semibold hover:text-rose-400"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Topic type</label>
                      <div className="grid gap-3 md:grid-cols-2">
                        {forumTypeOptions.map((option) => {
                          const isActive = form.forumType === option.value;
                          const disabledOption = !hasLockedCourse || (isStudent && option.value !== "discussion");
                          return (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => {
                                if (disabledOption) return;
                                setFormValue("forumType", option.value);
                              }}
                              disabled={disabledOption}
                              className={`text-left p-4 rounded-xl border transition-all ${
                                isActive
                                  ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-500/20"
                                  : darkMode
                                  ? "border-slate-700 hover:border-slate-500"
                                  : "border-slate-200 hover:border-slate-300"
                              } ${disabledOption ? "opacity-50 cursor-not-allowed" : ""}`}
                            >
                              <p className="font-semibold">{option.label}</p>
                              <p className="text-sm text-slate-500 mt-1">{option.hint}</p>
                            </button>
                          );
                        })}
                      </div>
                      {isStudent && (
                        <p className="text-sm text-slate-500 mt-1">
                          Students can only create open discussions. Announcements are reserved for teachers and admins.
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between border-t pt-4 border-dashed border-slate-200 dark:border-slate-700">
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          className="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          checked={form.isActive}
                          onChange={(event) => setFormValue("isActive", event.target.checked)}
                          disabled={!hasLockedCourse}
                        />
                        <span className="text-sm">Allow everyone in the course to participate (active)</span>
                      </label>
                      <button
                        type="submit"
                        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-white font-semibold hover:bg-indigo-500 disabled:opacity-50"
                        disabled={submitting || courseLoading || !hasLockedCourse}
                      >
                        {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                        Publish topic
                      </button>
                    </div>
                  </form>
                </div>

              </section>

              <aside className="space-y-6">
                <div className={`rounded-2xl p-6 shadow-sm ${panelStyles}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-slate-400 uppercase">Current course</p>
                      <h3 className="text-xl font-semibold mt-1">Your discussion space</h3>
                    </div>
                    <Flame className="w-8 h-8 text-rose-400" />
                  </div>
                  {selectedCourse ? (
                    <>
                      <p className="font-semibold text-lg">{selectedCourse.title}</p>
                      <p className="text-sm text-slate-500 mt-2 line-clamp-3">
                        {courseDescriptionDisplay}
                      </p>
                      <div className="mt-4 rounded-xl bg-gradient-to-r from-indigo-500/10 to-sky-500/10 p-4 text-sm text-slate-500">
                        Tip: concise titles and clear descriptions help classmates respond faster.
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-slate-500">There is no course selected to create a topic yet.</p>
                  )}
                </div>

                <div className={`rounded-2xl p-6 shadow-sm ${panelStyles}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <Sparkles className="w-5 h-5 text-indigo-400" />
                    <h3 className="font-semibold">Quick guide</h3>
                  </div>
                  <p className="text-sm text-slate-500">
                    Only admins or teachers can launch the forum from a course page. To create a topic, open the course, click
                    <span className="font-medium"> "Create Forum Post"</span>, and you will be redirected here with that course preselected.
                  </p>
                </div>

                <div className={`rounded-2xl p-6 shadow-sm ${panelStyles}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <Sparkles className="w-5 h-5 text-indigo-400" />
                    <h3 className="font-semibold">Community rules</h3>
                  </div>
                  <ul className="space-y-3 text-sm text-slate-500">
                    <li>• Stay on learning topics and respect classmates.</li>
                    <li>• Link to the course material or resources when relevant.</li>
                    <li>• Mark resolved questions so others can find answers quickly.</li>
                  </ul>
                </div>
              </aside>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ForumPage;

