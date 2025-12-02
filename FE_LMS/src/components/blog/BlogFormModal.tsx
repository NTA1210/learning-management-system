import React, { useState, useEffect } from "react";
import { X, Upload, Loader2 } from "lucide-react";
import type { BlogPost } from "../../types/blog";
import { useTheme } from "../../hooks/useTheme";

interface BlogFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData) => Promise<void>;
  initialData?: BlogPost | null;
  isLoading?: boolean;
}

const BlogFormModal: React.FC<BlogFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading = false,
}) => {
  const { darkMode } = useTheme();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [category, setCategory] = useState("");
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [avatar, setAvatar] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>("");
  const [avatarPreview, setAvatarPreview] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setTitle(initialData.title);
        setContent(initialData.content);
        setAuthorName(initialData.authorName);
        setCategory(initialData.category || "");
        setThumbnailPreview(initialData.thumbnailUrl);
        setAvatarPreview(initialData.avatar);
      } else {
        resetForm();
      }
    }
  }, [isOpen, initialData]);

  const resetForm = () => {
    setTitle("");
    setContent("");
    setAuthorName("");
    setCategory("");
    setThumbnail(null);
    setAvatar(null);
    setThumbnailPreview("");
    setAvatarPreview("");
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setFile: (file: File | null) => void,
    setPreview: (url: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      setFile(file);
      const url = URL.createObjectURL(file);
      setPreview(url);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);
    formData.append("authorName", authorName);
    if (category) formData.append("category", category);
    if (thumbnail) formData.append("thumbnailUrl", thumbnail);
    if (avatar) formData.append("avatar", avatar);

    await onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div
        className={`w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-xl ${
          darkMode ? "bg-slate-900 text-slate-50" : "bg-white text-slate-900"
        }`}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b px-6 py-4 backdrop-blur-md bg-inherit border-slate-200 dark:border-slate-800">
          <h2 className="text-xl font-bold">
            {initialData ? "Edit Blog" : "Create New Blog"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="mb-2 block text-sm font-medium">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className={`w-full rounded-xl border px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 ${
                darkMode
                  ? "bg-slate-800 border-slate-700"
                  : "bg-white border-slate-200"
              }`}
              placeholder="Enter blog title"
            />
          </div>

          {/* Author & Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="mb-2 block text-sm font-medium">
                Author Name
              </label>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                required
                className={`w-full rounded-xl border px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 ${
                  darkMode
                    ? "bg-slate-800 border-slate-700"
                    : "bg-white border-slate-200"
                }`}
                placeholder="Enter author name"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Category</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={`w-full rounded-xl border px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 ${
                  darkMode
                    ? "bg-slate-800 border-slate-700"
                    : "bg-white border-slate-200"
                }`}
                placeholder="e.g. Technology, Education"
              />
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="mb-2 block text-sm font-medium">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={10}
              className={`w-full rounded-xl border px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 ${
                darkMode
                  ? "bg-slate-800 border-slate-700"
                  : "bg-white border-slate-200"
              }`}
              placeholder="Write your blog content here..."
            />
          </div>

          {/* Images */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Thumbnail */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                Thumbnail
              </label>
              <div
                className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition-colors ${
                  darkMode
                    ? "border-slate-700 hover:border-indigo-500 hover:bg-slate-800/50"
                    : "border-slate-200 hover:border-indigo-500 hover:bg-slate-50"
                }`}
              >
                {thumbnailPreview ? (
                  <div className="relative w-full aspect-video rounded-lg overflow-hidden">
                    <img
                      src={thumbnailPreview}
                      alt="Thumbnail preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setThumbnail(null);
                        setThumbnailPreview("");
                      }}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="text-center">
                    <Upload className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                    <p className="text-sm text-slate-500">
                      Click to upload thumbnail
                    </p>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    handleFileChange(e, setThumbnail, setThumbnailPreview)
                  }
                  className="absolute inset-0 cursor-pointer opacity-0"
                />
              </div>
            </div>

            {/* Avatar */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                Author Avatar
              </label>
              <div
                className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition-colors ${
                  darkMode
                    ? "border-slate-700 hover:border-indigo-500 hover:bg-slate-800/50"
                    : "border-slate-200 hover:border-indigo-500 hover:bg-slate-50"
                }`}
              >
                {avatarPreview ? (
                  <div className="relative w-24 h-24 rounded-full overflow-hidden">
                    <img
                      src={avatarPreview}
                      alt="Avatar preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setAvatar(null);
                        setAvatarPreview("");
                      }}
                      className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="text-center">
                    <Upload className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                    <p className="text-sm text-slate-500">
                      Click to upload avatar
                    </p>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    handleFileChange(e, setAvatar, setAvatarPreview)
                  }
                  className="absolute inset-0 cursor-pointer opacity-0"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                darkMode
                  ? "bg-slate-800 hover:bg-slate-700 text-slate-300"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 px-6 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {initialData ? "Update Blog" : "Create Blog"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BlogFormModal;
