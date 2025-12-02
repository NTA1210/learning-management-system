import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useTheme } from "../hooks/useTheme";
import type { BlogPost } from "../types/blog";
import { getBlogBySlug } from "../services/blogService";
import { Loader2, ArrowLeft, Calendar } from "lucide-react";

const BlogDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { darkMode } = useTheme();
  const [blog, setBlog] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBlog = async () => {
      if (!slug) return;
      setLoading(true);
      try {
        const response = await getBlogBySlug(slug);
        setBlog(response.data);
      } catch (err) {
        console.error("Failed to fetch blog detail", err);
        setError("Failed to load blog post.");
      } finally {
        setLoading(false);
      }
    };
    fetchBlog();
  }, [slug]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center pt-20">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      </>
    );
  }

  if (error || !blog) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex flex-col items-center justify-center pt-20 gap-4">
          <p className="text-lg text-red-500">
            {error || "Blog post not found"}
          </p>
          <Link
            to="/blog"
            className="flex items-center gap-2 text-indigo-600 hover:underline"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Blogs
          </Link>
        </div>
      </>
    );
  }

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
        <main className="mx-auto w-full max-w-4xl px-4 pb-16 pt-10 sm:px-6 lg:px-8">
          <Link
            to="/blog"
            className={`inline-flex items-center gap-2 mb-8 text-sm font-medium transition-colors ${
              darkMode
                ? "text-slate-400 hover:text-indigo-400"
                : "text-slate-600 hover:text-indigo-600"
            }`}
          >
            <ArrowLeft className="h-4 w-4" /> Back to Blogs
          </Link>

          <article
            className={`rounded-3xl border overflow-hidden ${
              darkMode
                ? "bg-[#1a202c] border-slate-700 shadow-2xl"
                : "bg-white border-slate-200 shadow-xl"
            }`}
          >
            {/* Hero Image */}
            <div className="w-full aspect-video md:aspect-[21/9] relative">
              <img
                src={blog.thumbnailUrl}
                alt={blog.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <div className="absolute bottom-0 left-0 p-6 md:p-10 w-full">
                {blog.category && (
                  <span className="inline-block px-3 py-1 mb-4 text-xs font-semibold tracking-wider text-white uppercase bg-indigo-600 rounded-full">
                    {blog.category}
                  </span>
                )}
                <h1 className="text-2xl md:text-4xl font-bold text-white mb-4 leading-tight">
                  {blog.title}
                </h1>
                <div className="flex items-center gap-6 text-slate-200 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white/20">
                      <img
                        src={
                          blog.avatar ||
                          "https://ui-avatars.com/api/?name=" + blog.authorName
                        }
                        alt={blog.authorName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="font-medium">{blog.authorName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {new Date(blog.createdAt).toLocaleDateString("vi-VN", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div
              className={`p-6 md:p-10 ${
                darkMode ? "text-slate-300" : "text-slate-700"
              }`}
            >
              <div
                className="prose prose-lg max-w-none dark:prose-invert prose-indigo prose-img:rounded-xl prose-headings:font-bold"
                dangerouslySetInnerHTML={{ __html: blog.content }}
              />
            </div>
          </article>
        </main>
      </div>
    </>
  );
};

export default BlogDetailPage;
