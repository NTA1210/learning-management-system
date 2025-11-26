import React, { useCallback, useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { useTheme } from "../hooks/useTheme";
import { useAuth } from "../hooks/useAuth";
import { forumService, type ForumResponse, type ForumPost } from "../services/forumService";
import {
  Loader2,
  ArrowLeft,
  UploadCloud,
  CheckCircle2,
  Edit3,
  Trash2,
  Eye,
  X,
} from "lucide-react";

type SidebarRole = "admin" | "teacher" | "student";
interface PostFormState {
  title: string;
  content: string;
  pinned: boolean;
}

const ForumDetailPage: React.FC = () => {
  const { forumId = "" } = useParams();
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const { user } = useAuth();

  const sidebarRole: SidebarRole =
    user && ["admin", "teacher", "student"].includes(user.role) ? (user.role as SidebarRole) : "student";
  const canPin = user?.role === "admin" || user?.role === "teacher";

  const [forum, setForum] = useState<ForumResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [form, setForm] = useState<PostFormState>({
    title: "",
    content: "",
    pinned: false,
  });
  const [pinnedPosts, setPinnedPosts] = useState<ForumPost[]>([]);
  const [unpinnedPosts, setUnpinnedPosts] = useState<ForumPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsError, setPostsError] = useState<string | null>(null);

  const [editModal, setEditModal] = useState<{
    open: boolean;
    post: ForumPost | null;
    title: string;
    content: string;
    pinned: boolean;
    saving: boolean;
    error: string | null;
  }>({
    open: false,
    post: null,
    title: "",
    content: "",
    pinned: false,
    saving: false,
    error: null,
  });
  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    post: ForumPost | null;
    loading: boolean;
    error: string | null;
  }>({
    open: false,
    post: null,
    loading: false,
    error: null,
  });

  const fetchForum = useCallback(async () => {
    if (!forumId) return;
    try {
      setLoading(true);
      const data = await forumService.getForumById(forumId);
      setForum(data);
      setError("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to load forum";
      setError(message);
      setForum(null);
    } finally {
      setLoading(false);
    }
  }, [forumId]);

  const fetchPosts = useCallback(async () => {
    if (!forumId) return;
    try {
      setPostsLoading(true);
      const [pinned, regular] = await Promise.all([
        forumService.getForumPosts(forumId, { pinned: true }),
        forumService.getForumPosts(forumId, { pinned: false }),
      ]);
      setPinnedPosts(pinned);
      setUnpinnedPosts(regular);
      setPostsError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to load posts";
      setPinnedPosts([]);
      setUnpinnedPosts([]);
      setPostsError(message);
    } finally {
      setPostsLoading(false);
    }
  }, [forumId]);

  useEffect(() => {
    fetchForum();
    fetchPosts();
  }, [fetchForum, fetchPosts]);

  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timeout);
  }, [toast]);

  const handleInputChange = (field: keyof PostFormState, value: string | boolean) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!forumId) return;
    if (!form.title.trim() || !form.content.trim()) {
      setToast({ type: "error", message: "Please provide both a title and content." });
      return;
    }

    try {
      setSubmitting(true);
      await forumService.createForumPost(forumId, {
        title: form.title.trim(),
        content: form.content,
        pinned: canPin ? form.pinned : false,
      });
      setToast({ type: "success", message: "Post published successfully." });
      setForm({ title: "", content: "", pinned: false });
      fetchForum();
      fetchPosts();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to create post";
      setToast({ type: "error", message });
    } finally {
      setSubmitting(false);
    }
  };

  const openPostDetail = (postId: string) => {
    if (!forumId) return;
    navigate(`/forums/${forumId}/posts/${postId}`);
  };

  const openEditPost = (post: ForumPost) => {
    if (!canManagePosts) return;
    setEditModal({
      open: true,
      post,
      title: post.title,
      content: post.content,
      pinned: Boolean(post.pinned),
      saving: false,
      error: null,
    });
  };

  const closeEditModal = () =>
    setEditModal({
      open: false,
      post: null,
      title: "",
      content: "",
      pinned: false,
      saving: false,
      error: null,
    });

  const handleUpdatePost = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!forumId || !editModal.post) return;
    try {
      setEditModal((prev) => ({ ...prev, saving: true, error: null }));
      await forumService.updateForumPost(forumId, editModal.post._id, {
        title: editModal.title.trim(),
        content: editModal.content,
        pinned: editModal.pinned,
      });
      setToast({ type: "success", message: "Post updated." });
      closeEditModal();
      fetchPosts();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to update post";
      setEditModal((prev) => ({ ...prev, saving: false, error: message }));
    }
  };

  const openDeletePostModal = (post: ForumPost) => {
    if (!canManagePosts) return;
    setDeleteModal({ open: true, post, loading: false, error: null });
  };

  const closeDeletePostModal = () => {
    setDeleteModal({ open: false, post: null, loading: false, error: null });
  };

  const handleConfirmDeletePost = async () => {
    if (!canManagePosts || !forumId || !deleteModal.post) return;
    try {
      setDeleteModal((prev) => ({ ...prev, loading: true, error: null }));
      await forumService.deleteForumPost(forumId, deleteModal.post._id);
      setToast({ type: "success", message: "Post deleted." });
      closeDeletePostModal();
      fetchPosts();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to delete post";
      setDeleteModal((prev) => ({ ...prev, loading: false, error: message }));
    }
  };

  if (!forumId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-slate-500">Forum not found.</p>
      </div>
    );
  }

  const backgroundStyles = {
    backgroundColor: darkMode ? "#0f172a" : "#f8fafc",
    color: darkMode ? "#e2e8f0" : "#0f172a",
  };
  const canManagePosts = user?.role === "admin" || user?.role === "teacher";
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
  const totalPosts = pinnedPosts.length + unpinnedPosts.length;
  const orderedPosts = [...pinnedPosts, ...unpinnedPosts];
  return (
    <>
    <div className="flex h-screen overflow-hidden relative" style={backgroundStyles}>
      <Navbar />
      <Sidebar role={sidebarRole} />

      <div className="flex flex-col flex-1 w-0 overflow-hidden">
        <main className="flex-1 relative overflow-y-auto focus:outline-none p-4 mt-16 sm:pl-24 md:pl-28">
          <div className="max-w-5xl mx-auto space-y-6 pb-16">
            <div className="flex items-center gap-3">
              <Link
                to="/forum-list"
                className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 dark:border-slate-700"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to forums
              </Link>
              {toast && (
                <div
                  className={`ml-auto rounded-xl border px-4 py-2 text-sm flex items-center gap-2 ${
                    toast.type === "success"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-rose-200 bg-rose-50 text-rose-700"
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {toast.message}
                </div>
              )}
            </div>

            {loading ? (
              <div className="flex items-center gap-3 text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin" />
                Loading forum...
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
                <p className="font-semibold mb-2">Unable to load forum</p>
                <p className="text-sm">{error}</p>
              </div>
            ) : forum ? (
              <>
                <section
                  className={`rounded-2xl p-6 shadow-sm ${
                    darkMode ? "bg-slate-900/70 border border-slate-700/60" : "bg-white border border-slate-100"
                  }`}
                >
                  <p className="text-xs uppercase tracking-wide text-indigo-500 font-semibold">
                    {forum.forumType === "announcement" ? "Announcement" : "Discussion"}
                  </p>
                  <h1 className="text-3xl font-bold mt-2">{forum.title}</h1>
                  <p className="text-slate-500 dark:text-slate-300 mt-3">{forum.description}</p>
                  <div className="mt-4 text-xs text-slate-500 flex flex-wrap gap-4">
                    <span>Forum ID: {forum._id}</span>
                    <span>Active: {forum.isActive ? "Yes" : "No"}</span>
                    {forum.createdAt && <span>Created: {formatDate(forum.createdAt)}</span>}
                    {forum.updatedAt && <span>Updated: {formatDate(forum.updatedAt)}</span>}
                  </div>
                </section>

                <section className="grid gap-6 lg:grid-cols-2">
                  <div
                    className={`rounded-2xl p-6 shadow-sm ${
                      darkMode ? "bg-slate-900/70 border border-slate-700/60" : "bg-white border border-slate-100"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm text-slate-400 uppercase">Create post</p>
                        <h2 className="text-xl font-semibold">Share resources or questions</h2>
                      </div>
                      <UploadCloud className="w-8 h-8 text-indigo-400" />
                    </div>
                    <form className="space-y-4" onSubmit={handleSubmit}>
                      <div>
                        <label className="block text-sm font-medium mb-2">Title</label>
                        <input
                          type="text"
                          className={`w-full rounded-xl border px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
                            darkMode ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200"
                          }`}
                          placeholder="Example: UI design materials"
                          value={form.title}
                          onChange={(event) => handleInputChange("title", event.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Content (Markdown supported)</label>
                        <textarea
                          className={`w-full h-40 rounded-xl border px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
                            darkMode ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200"
                          }`}
                          placeholder={"Share context, add bullet lists, or embed images using Markdown.\nExample:\n![Prototype](https://...)"}
                          value={form.content}
                          onChange={(event) => handleInputChange("content", event.target.value)}
                        ></textarea>
                        <p className="text-xs text-slate-500 mt-1">
                          Tip: use <code>![alt text](https://image-url)</code> to attach screenshots.
                        </p>
                      </div>
                      <label className={`flex items-center gap-3 ${canPin ? "" : "opacity-50"}`}>
                        <input
                          type="checkbox"
                          className="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          checked={form.pinned && canPin}
                          onChange={(event) => handleInputChange("pinned", event.target.checked)}
                          disabled={!canPin}
                        />
                        <span className="text-sm">Pin this post to highlight important updates</span>
                      </label>
                      <button
                        type="submit"
                        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-white font-semibold hover:bg-indigo-500 disabled:opacity-50"
                        disabled={submitting}
                      >
                        {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                        Publish post
                      </button>
                    </form>
                  </div>

                  <div
                    className={`rounded-2xl p-6 shadow-sm space-y-4 ${
                      darkMode ? "bg-slate-900/70 border border-slate-700/60" : "bg-white border border-slate-100"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-400 uppercase">Live preview</p>
                        <h2 className="text-xl font-semibold">What learners will see</h2>
                      </div>
                    </div>
                    {form.content.trim() ? (
                      <div
                        className={`rounded-xl border p-4 prose max-w-none ${
                          darkMode ? "border-slate-700 prose-invert" : "border-slate-200"
                        }`}
                      >
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{`# ${form.title || "Post title"}\n\n${form.content}`}</ReactMarkdown>
                      </div>
                    ) : (
                      <div
                        className={`rounded-xl border border-dashed p-4 text-sm text-slate-500 ${
                          darkMode ? "border-slate-700" : "border-slate-200"
                        }`}
                      >
                        Start typing to preview your Markdown formatting, code blocks, and images.
                      </div>
                    )}
                  </div>
                </section>

                <section
                  className={`rounded-2xl p-6 shadow-sm ${
                    darkMode ? "bg-slate-900/70 border border-slate-700/60" : "bg-white border border-slate-100"
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">Latest posts</h2>
                    <span className="text-sm text-slate-500">{totalPosts} item(s)</span>
                  </div>
                  {postsLoading ? (
                    <div className="flex items-center gap-2 text-slate-400">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading posts...
                    </div>
                  ) : postsError ? (
                    <p className="text-sm text-rose-500">{postsError}</p>
                  ) : totalPosts === 0 ? (
                    <div
                      className={`border-2 border-dashed rounded-2xl p-8 text-center ${
                        darkMode ? "border-slate-700 text-slate-400" : "border-slate-200 text-slate-500"
                      }`}
                    >
                      <p className="font-semibold mb-2">No posts yet</p>
                      <p className="text-sm">Be the first to share materials or questions with your classmates.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orderedPosts.map((post) => (
                        <div
                          key={post._id}
                          className={`rounded-3xl p-5 shadow-sm border ${
                            darkMode ? "bg-slate-900/50 border-slate-800" : "bg-white border-slate-100"
                          }`}
                        >
                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                            <span className="font-semibold">{formatDate(post.createdAt)}</span>
                            {post.pinned && (
                              <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 font-semibold bg-amber-50 text-amber-700 text-[11px]">
                                Pinned
                              </span>
                            )}
                            <span className="ml-auto text-slate-400">{post.replyCount ?? 0} replies</span>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-3 justify-between">
                            <div className="space-y-2 flex-1 min-w-[200px]">
                              <h3 className="text-lg font-semibold">{post.title}</h3>
                              <div className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
                              </div>
                              {post.author && (
                                <p className="text-xs text-slate-400">
                                  By {post.author.fullname || post.author.username}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => openPostDetail(post._id)}
                                className="h-9 w-9 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800 flex items-center justify-center"
                                title="View post"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {canManagePosts && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => openEditPost(post)}
                                    className="h-9 w-9 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800 flex items-center justify-center"
                                    title="Edit post"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => openDeletePostModal(post)}
                                    className="h-9 w-9 rounded-full border border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-500/40 dark:text-rose-300 dark:hover:bg-rose-500/10 flex items-center justify-center"
                                    title="Delete post"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </>
            ) : null}
          </div>
        </main>
      </div>
    </div>

    {editModal.open && editModal.post && (
      <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
        <div
          className={`max-w-xl w-full rounded-2xl p-6 relative ${
            darkMode ? "bg-slate-900 text-slate-100" : "bg-white text-slate-900"
          }`}
        >
          <button className="absolute top-4 right-4" onClick={closeEditModal}>
            <X className="w-5 h-5" />
          </button>
          <h3 className="text-2xl font-semibold mb-4">Edit post</h3>
          <form className="space-y-4" onSubmit={handleUpdatePost}>
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
              <label className="block text-sm font-medium mb-2">Content</label>
              <textarea
                className={`w-full h-32 rounded-xl border px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
                  darkMode ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200"
                }`}
                value={editModal.content}
                onChange={(event) => setEditModal((prev) => ({ ...prev, content: event.target.value }))}
              ></textarea>
            </div>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                className="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                checked={editModal.pinned}
                onChange={(event) => setEditModal((prev) => ({ ...prev, pinned: event.target.checked }))}
              />
              <span className="text-sm">Pinned</span>
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

    {deleteModal.open && deleteModal.post && (
      <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
        <div
          className={`max-w-md w-full rounded-2xl p-6 relative ${
            darkMode ? "bg-slate-900 text-slate-100" : "bg-white text-slate-900"
          }`}
        >
          <button className="absolute top-4 right-4" onClick={closeDeletePostModal}>
            <X className="w-5 h-5" />
          </button>
          <h3 className="text-xl font-semibold mb-2">Delete post</h3>
          <p className="text-sm text-slate-500 mb-3">
            Are you sure you want to permanently delete this post? This action cannot be undone.
          </p>
          <div className="rounded-xl border px-3 py-2 text-sm mb-4 border-slate-200 dark:border-slate-700">
            <p className="font-semibold line-clamp-1">{deleteModal.post.title}</p>
            <p className="text-xs text-slate-500 line-clamp-2 mt-1">{deleteModal.post.content}</p>
          </div>
          {deleteModal.error && <p className="text-sm text-rose-500 mb-3">{deleteModal.error}</p>}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={closeDeletePostModal}
              className="rounded-xl border px-4 py-2 text-sm font-semibold border-slate-300 hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800"
              disabled={deleteModal.loading}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmDeletePost}
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
    </>
  );
};

export default ForumDetailPage;

