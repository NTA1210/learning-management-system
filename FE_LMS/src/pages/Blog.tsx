import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useTheme } from "../hooks/useTheme";

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  thumbnailUrl: string;
  createdAt: string;
  category?: string;
}

// ---- Fake data fetcher (replace with real API) ----
async function getBlogs(
  pageNumber: number,
  pageSize: number
): Promise<{ items: BlogPost[]; total: number }> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  const demo: BlogPost[] = [
    {
      id: "1",
      slug: "khoa-hoc-react-co-ban",
      title: "Khoá học React cơ bản dành cho người mới",
      excerpt:
        "Tìm hiểu cách xây dựng ứng dụng web hiện đại với React, từ component, props đến hook...",
      thumbnailUrl:
        "https://cdn.jsdelivr.net/gh/ftesedu/funnycode-images-1757352873747@main/images/tintucFtes.png_1757754180109.png?v=1757754181512",
      createdAt: "2025-11-20T10:00:00.000Z",
      category: "Khóa học",
    },
    {
      id: "2",
      slug: "funnycode-cap-nhat-tinh-nang-moi",
      title: "FunnyCode ra mắt tính năng học tập mới",
      excerpt:
        "Nền tảng FunnyCode tiếp tục được nâng cấp với trải nghiệm học code tương tác hơn.",
      thumbnailUrl:
        "https://cdn.jsdelivr.net/gh/ftesedu/funnycode-images-1757352873747@main/images/tintucFtes.png_1757754180109.png?v=1757754181512",
      createdAt: "2025-11-25T09:00:00.000Z",
      category: "Cập nhật",
    },
  ];

  const start = (pageNumber - 1) * pageSize;
  const items = demo.slice(start, start + pageSize);
  return { items, total: demo.length };
}

// ---- Card component ----
function BlogCard({ post }: { post: BlogPost }) {
  const { darkMode } = useTheme();
  const date = new Date(post.createdAt).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <article
      className={`group flex flex-col md:flex-row gap-6 md:gap-8 p-6 rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
        darkMode
          ? "bg-[#1a202c] border-slate-700 hover:border-indigo-500/50 hover:shadow-indigo-500/10"
          : "bg-white border-slate-200 hover:border-indigo-300 hover:shadow-indigo-100"
      }`}
    >
      {/* Image Section */}
      <div className="w-full md:w-5/12 shrink-0">
        <div className="relative aspect-video w-full overflow-hidden rounded-xl">
          <img
            src={post.thumbnailUrl}
            alt={post.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      </div>

      {/* Content Section */}
      <div className="flex flex-1 flex-col">
        {/* Category */}
        {post.category && (
          <div className="mb-3">
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                darkMode
                  ? "bg-indigo-950/40 text-indigo-300 border border-indigo-900/60"
                  : "bg-indigo-50 text-indigo-700 border border-indigo-100"
              }`}
            >
              {post.category}
            </span>
          </div>
        )}

        {/* Title */}
        <h2 className="mb-2 text-xl font-bold md:text-2xl">
          <Link
            to={`/blog/${post.slug}`}
            className={`transition-colors ${
              darkMode
                ? "text-slate-50 group-hover:text-indigo-400"
                : "text-slate-900 group-hover:text-indigo-600"
            }`}
          >
            {post.title}
          </Link>
        </h2>

        {/* Meta */}
        <div
          className={`mb-4 flex items-center gap-4 text-xs ${
            darkMode ? "text-slate-400" : "text-slate-500"
          }`}
        >
          <span className="flex items-center gap-1">
            <i className="bi bi-calendar3"></i> {date}
          </span>
          <span className="flex items-center gap-1">
            <i className="bi bi-share"></i> Chia sẻ
          </span>
        </div>

        {/* Description */}
        <p
          className={`mb-4 line-clamp-3 text-sm leading-relaxed ${
            darkMode ? "text-slate-400" : "text-slate-600"
          }`}
        >
          {post.excerpt}
        </p>

        {/* Read More Button */}
        <div className="mt-auto flex justify-end">
          <Link
            to={`/blog/${post.slug}`}
            className={`group/btn inline-flex items-center gap-1 text-sm font-medium transition-colors ${
              darkMode
                ? "text-indigo-400 hover:text-indigo-300"
                : "text-indigo-600 hover:text-indigo-700"
            }`}
          >
            Xem thêm
            <span className="transition-transform group-hover/btn:translate-x-1">
              →
            </span>
          </Link>
        </div>
      </div>
    </article>
  );
}

// ---- Pagination component ----
function Pagination({
  pageNumber,
  pageSize,
  total,
  basePath,
}: {
  pageNumber: number;
  pageSize: number;
  total: number;
  basePath: string;
}) {
  const { darkMode } = useTheme();
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const hasPrev = pageNumber > 1;
  const hasNext = pageNumber < totalPages;

  if (totalPages <= 1) return null;

  return (
    <div className="mt-12 flex items-center justify-center gap-4">
      <Link
        to={`${basePath}?pageNumber=${pageNumber - 1}&pageSize=${pageSize}`}
        className={`inline-flex items-center rounded-lg border px-4 py-2 text-sm font-medium transition ${
          hasPrev
            ? darkMode
              ? "border-slate-700 bg-slate-800 text-slate-100 hover:bg-slate-700"
              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            : darkMode
            ? "cursor-not-allowed border-slate-800 bg-slate-900 text-slate-600"
            : "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300"
        }`}
        aria-disabled={!hasPrev}
        onClick={(e) => !hasPrev && e.preventDefault()}
      >
        ← Trước
      </Link>

      <span
        className={`text-sm font-medium ${
          darkMode ? "text-slate-400" : "text-slate-600"
        }`}
      >
        Trang {pageNumber} / {totalPages}
      </span>

      <Link
        to={`${basePath}?pageNumber=${pageNumber + 1}&pageSize=${pageSize}`}
        className={`inline-flex items-center rounded-lg border px-4 py-2 text-sm font-medium transition ${
          hasNext
            ? darkMode
              ? "border-slate-700 bg-slate-800 text-slate-100 hover:bg-slate-700"
              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            : darkMode
            ? "cursor-not-allowed border-slate-800 bg-slate-900 text-slate-600"
            : "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300"
        }`}
        aria-disabled={!hasNext}
        onClick={(e) => !hasNext && e.preventDefault()}
      >
        Sau →
      </Link>
    </div>
  );
}

// ---- Page component ----
const BlogPage: React.FC = () => {
  const { darkMode } = useTheme();
  const [searchParams] = useSearchParams();
  const pageNumber = Number(searchParams.get("pageNumber") ?? "1") || 1;
  const pageSize = Number(searchParams.get("pageSize") ?? "10") || 10;

  const [items, setItems] = useState<BlogPost[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { items, total } = await getBlogs(pageNumber, pageSize);
        setItems(items);
        setTotal(total);
      } catch (error) {
        console.error("Failed to fetch blogs", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [pageNumber, pageSize]);

  return (
    <>
      <Navbar />
      <div
        className="min-h-screen transition-colors duration-200"
        style={{
          paddingTop: 80,
          backgroundColor: darkMode ? "rgb(26, 32, 44)" : "#f8fafc",
        }}
      >
        <main className="mx-auto w-full max-w-[1000px] px-4 pb-16 pt-10 sm:px-6 lg:px-8">
          <div
            className={`rounded-3xl border p-6 md:p-10 ${
              darkMode
                ? "border-slate-700 shadow-2xl"
                : "bg-white/80 border-slate-200 shadow-xl"
            }`}
            style={{
              backgroundColor: darkMode ? "rgba(30, 41, 59, 0.85)" : undefined,
              backdropFilter: "blur(12px)",
            }}
          >
            {/* Header */}
            <section className="mb-12">
              {/* Search (Centered) */}
              <form
                className="w-full max-w-2xl mx-auto"
                onSubmit={(e) => e.preventDefault()}
              >
                <label className="sr-only" htmlFor="blog-search">
                  Tìm kiếm bài viết
                </label>
                <div className="relative group">
                  <input
                    id="blog-search"
                    type="search"
                    placeholder="Tìm kiếm bài viết..."
                    className={`w-full rounded-2xl border px-6 py-4 pl-12 text-base shadow-sm outline-none ring-0 transition-all focus:ring-2 focus:-translate-y-0.5 focus:shadow-lg ${
                      darkMode
                        ? "border-slate-600 bg-slate-900/50 text-slate-50 focus:border-indigo-500 focus:ring-indigo-500/20 placeholder-slate-400"
                        : "border-slate-200 bg-white text-slate-900 focus:border-indigo-500 focus:ring-indigo-500/20 placeholder-slate-400"
                    }`}
                  />
                  <span
                    className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg transition-colors ${
                      darkMode
                        ? "text-slate-500 group-focus-within:text-indigo-400"
                        : "text-slate-400 group-focus-within:text-indigo-600"
                    }`}
                  >
                    <i className="bi bi-search"></i>
                  </span>
                </div>
              </form>
            </section>

            {/* Blog List */}
            {loading ? (
              <div className="flex justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent"></div>
              </div>
            ) : items.length === 0 ? (
              <div
                className={`rounded-2xl border border-dashed p-12 text-center text-sm ${
                  darkMode
                    ? "border-slate-800 bg-slate-800/30 text-slate-400"
                    : "border-slate-300 bg-slate-50 text-slate-500"
                }`}
              >
                <i className="bi bi-journal-text mb-3 block text-2xl"></i>
                Hiện chưa có bài viết nào.
              </div>
            ) : (
              <>
                <section className="flex flex-col gap-6">
                  {items.map((post) => (
                    <BlogCard key={post.id} post={post} />
                  ))}
                </section>

                <Pagination
                  pageNumber={pageNumber}
                  pageSize={pageSize}
                  total={total}
                  basePath="/blog"
                />
              </>
            )}
          </div>
        </main>
      </div>
    </>
  );
};

export default BlogPage;
