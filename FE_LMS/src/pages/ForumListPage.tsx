import React, { useCallback, useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { useTheme } from "../hooks/useTheme";
import { useAuth } from "../hooks/useAuth";
import type { Course } from "../types/course";
import { courseService } from "../services";
import { forumService, type ForumResponse, type ForumType } from "../services/forumService";
import { Book, BookOpen, Edit3, Eye, Loader2, RefreshCcw, Trash2, X } from "lucide-react";
import { Link } from "react-router-dom";

type SidebarRole = "admin" | "teacher" | "student";

const forumTypeLabels: Record<ForumType, string> = {
  discussion: "Discussion",
  announcement: "Announcement",
};

const ForumListPage: React.FC = () => {
  const { darkMode } = useTheme();
  const { user } = useAuth();
  const sidebarRole: SidebarRole =
    user && ["admin", "teacher", "student"].includes(user.role) ? (user.role as SidebarRole) : "student";
  const canManage = user?.role === "admin" || user?.role === "teacher";

  const [courses, setCourses] = useState<Course[]>([]);
  const [courseLoading, setCourseLoading] = useState(true);
  const [courseError, setCourseError] = useState<string | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");

  const [forums, setForums] = useState<ForumResponse[]>([]);
  const [forumsLoading, setForumsLoading] = useState(false);
  const [forumsError, setForumsError] = useState<string | null>(null);

  const [detailModal, setDetailModal] = useState<{ loading: boolean; forum: ForumResponse | null }>({
    loading: false,
    forum: null,
  });
  const [editModal, setEditModal] = useState<{
    open: boolean;
    forum: ForumResponse | null;
    title: string;
    description: string;
    forumType: ForumType;
    isActive: boolean;
    saving: boolean;
    error?: string | null;
  }>({
    open: false,
    forum: null,
    title: "",
    description: "",
    forumType: "discussion",
    isActive: true,
    saving: false,
    error: null,
  });

  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    forum: ForumResponse | null;
    loading: boolean;
    error: string | null;
  }>({
    open: false,
    forum: null,
    loading: false,
    error: null,
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setCourseLoading(true);
        const result = await courseService.getAllCourses({ limit: 100, sortBy: "title", sortOrder: "asc" });
        const normalized = Array.isArray(result.courses) ? result.courses.filter(Boolean) : [];
        if (!mounted) return;
        setCourses(normalized);
        setCourseError(null);
        if (normalized.length > 0) {
          setSelectedCourseId((prev) => prev || normalized[0]._id);
        }
      } catch (error) {
        if (!mounted) return;
        const message = error instanceof Error ? error.message : "Unable to load courses";
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

  const refreshForums = useCallback(async () => {
    if (!selectedCourseId) {
      setForums([]);
      return;
    }
    try {
      setForumsLoading(true);
      const data = await forumService.getForums({ courseId: selectedCourseId, isActive: true });
      setForums(data);
      setForumsError(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load forums";
      setForums([]);
      setForumsError(message);
    } finally {
      setForumsLoading(false);
    }
  }, [selectedCourseId]);

  useEffect(() => {
    refreshForums();
  }, [refreshForums]);

  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timeout);
  }, [toast]);

  const selectedCourse = useMemo(
    () => courses.find((course) => course._id === selectedCourseId) ?? null,
    [courses, selectedCourseId]
  );

  const openDetailModal = async (forumId: string) => {
    setDetailModal({ loading: true, forum: null });
    try {
      const data = await forumService.getForumById(forumId);
      setDetailModal({ loading: false, forum: data });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load forum detail";
      setDetailModal({ loading: false, forum: null });
      setToast({ type: "error", message });
    }
  };

  const closeDetailModal = () => setDetailModal({ loading: false, forum: null });

  const openEditModal = (forum: ForumResponse) => {
    if (!canManage) return;
    setEditModal({
      open: true,
      forum,
      title: forum.title,
      description: forum.description,
      forumType: forum.forumType,
      isActive: forum.isActive,
      saving: false,
      error: null,
    });
  };

  const closeEditModal = () =>
    setEditModal({
      open: false,
      forum: null,
      title: "",
      description: "",
      forumType: "discussion",
      isActive: true,
      saving: false,
      error: null,
    });

  const handleUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editModal.forum) return;
    try {
      setEditModal((prev) => ({ ...prev, saving: true, error: null }));
      await forumService.updateForum(editModal.forum._id, {
        title: editModal.title.trim(),
        description: editModal.description.trim(),
        forumType: editModal.forumType,
        isActive: editModal.isActive,
      });
      setToast({ type: "success", message: "Forum updated successfully." });
      closeEditModal();
      refreshForums();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update forum";
      setEditModal((prev) => ({ ...prev, saving: false, error: message }));
    }
  };

  const openDeleteModal = (forum: ForumResponse) => {
    if (!canManage) return;
    setDeleteModal({ open: true, forum, loading: false, error: null });
  };

  const closeDeleteModal = () =>
    setDeleteModal({ open: false, forum: null, loading: false, error: null });

  const handleConfirmDelete = async () => {
    if (!canManage || !deleteModal.forum) return;
    try {
      setDeleteModal((prev) => ({ ...prev, loading: true, error: null }));
      await forumService.deleteForum(deleteModal.forum._id);
      setToast({ type: "success", message: "Forum deleted." });
      closeDeleteModal();
      refreshForums();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to delete forum";
      setDeleteModal((prev) => ({ ...prev, loading: false, error: message }));
    }
  };

  const pageBackground = {
    backgroundColor: darkMode ? "#0f172a" : "#f8fafc",
    color: darkMode ? "#e2e8f0" : "#0f172a",
  };

  const panelStyles = darkMode
    ? "bg-slate-900/70 border border-slate-700/60"
    : "bg-white border border-slate-100";
  const formatDate = (value?: string | number | Date) => {
    if (!value) return "—";
    return new Date(value).toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  };
  const getInitials = (title?: string) =>
    title
      ?.split(" ")
      .filter(Boolean)
      .map((segment) => segment[0]?.toUpperCase())
      .slice(0, 2)
      .join("") || "F";

  return (
    <div className="flex h-screen overflow-hidden relative" style={pageBackground}>
      <Navbar />
      <Sidebar role={sidebarRole} />

      <div className="flex flex-col flex-1 w-0 overflow-hidden">
        <main className="flex-1 relative overflow-y-auto focus:outline-none p-4 mt-16 sm:pl-24 md:pl-28">
          <div className="max-w-6xl mx-auto space-y-6 pb-16">
            <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm uppercase tracking-wide text-indigo-500 font-semibold">Forums</p>
                <h1 className="text-3xl font-bold mt-1">All topics for your courses</h1>
                <p className="text-slate-500 dark:text-slate-300 max-w-2xl mt-2">
                  Filter by course, review existing conversations, and keep your class informed. Teachers and admins can
                  edit or archive topics directly from here.
                </p>
              </div>
              <button
                type="button"
                onClick={refreshForums}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-white font-semibold hover:bg-indigo-500 disabled:opacity-60"
                disabled={forumsLoading || !selectedCourseId}
              >
                <RefreshCcw className={`w-4 h-4 ${forumsLoading ? "animate-spin" : ""}`} />
                Refresh list
              </button>
            </header>

            {toast && (
              <div
                className={`rounded-xl border px-4 py-3 flex items-center gap-3 ${
                  toast.type === "success"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                    : "bg-rose-50 border-rose-200 text-rose-700"
                }`}
              >
                <Book className="w-5 h-5" />
                <span>{toast.message}</span>
              </div>
            )}

            <section className={`rounded-2xl p-6 shadow-sm ${panelStyles}`}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm text-slate-400 uppercase">Course filter</p>
                  <h2 className="text-xl font-semibold">{selectedCourse?.title || "Select a course"}</h2>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <select
                    className={`w-full sm:w-64 rounded-xl border px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
                      darkMode ? "bg-slate-900 border-slate-700 text-slate-100" : "bg-white border-slate-200 text-slate-900"
                    }`}
                    value={selectedCourseId}
                    onChange={(event) => setSelectedCourseId(event.target.value)}
                    disabled={courseLoading || !courses.length}
                  >
                    {!courses.length && <option>No courses available</option>}
                    {courses.map((course) => (
                      <option key={course._id} value={course._id}>
                        {course.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {courseError && <p className="text-sm text-rose-500 mt-2">{courseError}</p>}
            </section>

            <section className={`rounded-2xl p-6 shadow-sm space-y-4 ${panelStyles}`}>
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">Active topics</h3>
                <span className="text-sm text-slate-500">{forums.length} forum(s)</span>
              </div>
              {forumsLoading ? (
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading forums...
                </div>
              ) : forumsError ? (
                <p className="text-sm text-rose-500">{forumsError}</p>
              ) : forums.length === 0 ? (
                <div
                  className={`border-2 border-dashed rounded-2xl p-8 text-center ${
                    darkMode ? "border-slate-700 text-slate-400" : "border-slate-200 text-slate-500"
                  }`}
                >
                  <p className="font-semibold mb-2">No topics yet</p>
                  <p className="text-sm">
                    Start from a course detail page using the <span className="font-medium">"Create Forum Post"</span> button.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {forums.map((forum) => {
                    const initials = getInitials(forum.title);
                    return (
                      <div
                        key={forum._id}
                        className={`rounded-3xl border p-5 flex flex-col gap-4 transition hover:-translate-y-0.5 ${
                          darkMode ? "border-slate-700 bg-slate-900/60" : "border-slate-200 bg-white"
                        }`}
                      >
                        <div className="flex gap-4">
                          <div
                            className={`h-12 w-12 rounded-2xl flex items-center justify-center text-lg font-semibold ${
                              darkMode ? "bg-slate-800 text-slate-100" : "bg-indigo-50 text-indigo-600"
                            }`}
                          >
                            {initials}
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              <span
                                className={`font-semibold px-3 py-1 rounded-full ${
                                  forum.forumType === "announcement"
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-emerald-100 text-emerald-700"
                                }`}
                              >
                                {forumTypeLabels[forum.forumType]}
                              </span>
                              <span
                                className={`px-3 py-1 rounded-full font-semibold ${
                                  forum.isActive
                                    ? "bg-indigo-100 text-indigo-700"
                                    : "bg-slate-100 text-slate-500"
                                }`}
                              >
                                {forum.isActive ? "Active" : "Archived"}
                              </span>
                              <span className="text-slate-400">{formatDate(forum.createdAt)}</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 justify-between">
                              <h4 className="text-xl font-semibold">{forum.title}</h4>
                              <div className="flex gap-2 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => openDetailModal(forum._id)}
                                  className="inline-flex items-center justify-center rounded-full p-2 border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <Link
                                  to={`/forums/${forum._id}`}
                                  className="inline-flex items-center justify-center rounded-full p-2 border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                                >
                                  <BookOpen className="w-4 h-4" />
                                </Link>
                                {canManage && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => openEditModal(forum)}
                                      className="inline-flex items-center justify-center rounded-full p-2 border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                                    >
                                      <Edit3 className="w-4 h-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => openDeleteModal(forum)}
                                      className="inline-flex items-center justify-center rounded-full p-2 border border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-500/40 dark:text-rose-300 dark:hover:bg-rose-500/10"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                            <p className="text-sm text-slate-500 line-clamp-3">{forum.description}</p>
                            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                              {forum.createdBy && (
                                <span>By {forum.createdBy.fullname || forum.createdBy.username}</span>
                              )}
                              {forum.updatedAt && <span>Updated {formatDate(forum.updatedAt)}</span>}
                              <span>ID: {forum._id}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </main>
      </div>

      {detailModal.forum && (
        <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center px-4">
          <div
            className={`max-w-lg w-full rounded-2xl p-6 relative ${
              darkMode ? "bg-slate-900 text-slate-100" : "bg-white text-slate-900"
            }`}
          >
            <button className="absolute top-4 right-4" onClick={closeDetailModal}>
              <X className="w-5 h-5" />
            </button>
            <p className="text-xs uppercase tracking-wide text-indigo-400 mb-1">
              {forumTypeLabels[detailModal.forum.forumType]}
            </p>
            <h3 className="text-2xl font-semibold mb-2">{detailModal.forum.title}</h3>
            <p className="text-sm text-slate-500 mb-4">{detailModal.forum.description}</p>
            <div className="text-sm text-slate-500 space-y-1">
              <p>ID: {detailModal.forum._id}</p>
              <p>Active: {detailModal.forum.isActive ? "Yes" : "No"}</p>
              <p>Created at: {formatDate(detailModal.forum.createdAt)}</p>
              {detailModal.forum.updatedAt && (
                <p>Updated at: {formatDate(detailModal.forum.updatedAt)}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {detailModal.loading && (
        <div className="fixed inset-0 z-30 bg-black/40 flex items-center justify-center">
          <div className="rounded-xl bg-white px-6 py-4 flex items-center gap-3 shadow-lg dark:bg-slate-900">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading forum details...</span>
          </div>
        </div>
      )}

      {editModal.open && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
          <div
            className={`max-w-lg w-full rounded-2xl p-6 relative ${
              darkMode ? "bg-slate-900 text-slate-100" : "bg-white text-slate-900"
            }`}
          >
            <button className="absolute top-4 right-4" onClick={closeEditModal}>
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-2xl font-semibold mb-4">Update forum</h3>
            <form className="space-y-4" onSubmit={handleUpdate}>
              <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <input
                  type="text"
                  className={`w-full rounded-xl border px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
                    darkMode ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200"
                  }`}
                  value={editModal.title}
                  onChange={(event) => setEditModal((prev) => ({ ...prev, title: event.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  className={`w-full h-28 rounded-xl border px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
                    darkMode ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200"
                  }`}
                  value={editModal.description}
                  onChange={(event) => setEditModal((prev) => ({ ...prev, description: event.target.value }))}
                ></textarea>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {(["discussion", "announcement"] as ForumType[]).map((type) => {
                  const isActive = editModal.forumType === type;
                  return (
                    <button
                      type="button"
                      key={type}
                      onClick={() => setEditModal((prev) => ({ ...prev, forumType: type }))}
                      className={`text-left p-4 rounded-xl border transition-all ${
                        isActive
                          ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-500/20"
                          : darkMode
                          ? "border-slate-700 hover:border-slate-500"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <p className="font-semibold">{forumTypeLabels[type]}</p>
                    </button>
                  );
                })}
              </div>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  className="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  checked={editModal.isActive}
                  onChange={(event) => setEditModal((prev) => ({ ...prev, isActive: event.target.checked }))}
                />
                <span className="text-sm">Active (visible to everyone in the course)</span>
              </label>
              {editModal.error && <p className="text-sm text-rose-500">{editModal.error}</p>}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="rounded-xl border px-4 py-2 text-sm font-semibold border-slate-300 hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-white font-semibold hover:bg-indigo-500 disabled:opacity-50"
                  disabled={editModal.saving}
                >
                  {editModal.saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteModal.open && deleteModal.forum && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
          <div
            className={`max-w-md w-full rounded-2xl p-6 relative ${
              darkMode ? "bg-slate-900 text-slate-100" : "bg-white text-slate-900"
            }`}
          >
            <button className="absolute top-4 right-4" onClick={closeDeleteModal}>
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-2xl font-semibold mb-2">Delete forum</h3>
            <p className="text-sm text-slate-500">
              This action cannot be undone. The topic and all of its posts will be removed for everyone.
            </p>
            <div
              className={`mt-4 rounded-2xl border px-4 py-3 ${
                darkMode ? "border-rose-500/40 bg-rose-500/10" : "border-rose-100 bg-rose-50"
              }`}
            >
              <p className="font-semibold">{deleteModal.forum.title}</p>
              <p className="text-xs text-slate-500 line-clamp-2">{deleteModal.forum.description}</p>
            </div>
            {deleteModal.error && <p className="text-sm text-rose-500 mt-3">{deleteModal.error}</p>}
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={closeDeleteModal}
                className="rounded-xl border px-4 py-2 text-sm font-semibold border-slate-300 hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800"
                disabled={deleteModal.loading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2 text-white text-sm font-semibold hover:bg-rose-500 disabled:opacity-50"
                disabled={deleteModal.loading}
              >
                {deleteModal.loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ForumListPage;


