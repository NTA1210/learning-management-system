import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Info } from "lucide-react";

import { useTheme } from "../hooks/useTheme";
import { useAuth } from "../hooks/useAuth";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import CourseTabsNavigation from "../components/courses/CourseTabsNavigation";
import type { TabType } from "../components/courses/CourseTabsNavigation";
import LessonsTab from "../components/courses/LessonsTab";
import AssignmentsTab from "../components/courses/AssignmentsTab";
import AttendanceTab from "../components/courses/AttendanceTab";
import ScheduleTab from "../components/courses/ScheduleTab";
import StaticCourseTab from "../components/courses/StaticCourseTab";
import { courseService } from "../services";
import type { Course } from "../types/course";
import { httpClient } from "../utils/http";

type ApiCourse = Partial<Course> & {
  subjectId?: {
    _id: string;
    name: string;
    description?: string;
    code?: string;
    slug?: string;
    credits?: number;
  };
  teacherIds?: Array<{
    _id: string;
    username?: string;
    email?: string;
    fullname?: string;
  }>;
  startDate?: string;
  endDate?: string;
  status?: string;
  meta?: { level?: string; duration?: string };
  createdBy?: { _id: string; username?: string; email?: string };
  enrollRequiresApproval?: boolean;
  logo?: string;
  key?: string;
};

function sanitizeLogo(logo?: string): string | undefined {
  if (!logo) return undefined;
  const cleaned = logo.trim().replace(/^`+|`+$/g, "").trim();
  return cleaned || undefined;
}

export default function CourseDetail() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { darkMode: isDarkMode } = useTheme();
  const { user } = useAuth();

  const [course, setCourse] = useState<ApiCourse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [enrolling, setEnrolling] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("lessons");

  const showToastSuccess = async (message: string) => {
    try {
      const Swal = (await import("sweetalert2")).default;
      await Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: message,
        showConfirmButton: false,
        timer: 2000,
      });
      } catch {
        // Ignore error
      }
  };

  const showToastInfo = async (message: string) => {
    try {
      const Swal = (await import("sweetalert2")).default;
      await Swal.fire({
        toast: true,
        position: "top-end",
        icon: "info",
        title: message,
        showConfirmButton: false,
        timer: 2000,
      });
    } catch {
      // Ignore error
    }
  };
  const handleEnroll = async () => {
    try {
      setEnrolling(true);
      await httpClient.post("/enrollments/enroll", { courseId: id, role: "student" }, { withCredentials: true });
      await showToastSuccess("Enroll thành công");
    } catch (e: unknown) {
      const error = e as { response?: { status?: number; data?: { message?: string } } };
      const status = error?.response?.status;
      if (status === 409) {
        const message = error?.response?.data?.message || "You are already enrolled in this course.";
        await showToastInfo(message);
      } else {
        console.error(e);
      }
    } finally {
      setEnrolling(false);
    }
  };

  const handleCreateForumPost = () => {
    if (!course?._id) return;
    navigate("/forum", {
      state: {
        preselectedCourseId: course._id,
        preselectedCourseTitle: course.title ?? course.code ?? "Course",
      },
    });
  };

  // const handleViewForumList = () => {
  //   if (!course?._id) return;
  //   const courseTitle = course.title ?? course.code ?? "Course";
  //   const params = new URLSearchParams({ courseId: course._id });
  //   if (courseTitle) {
  //     params.set("courseTitle", courseTitle);
  //   }
  //   navigate(`/forum-list?${params.toString()}`, {
  //     state: {
  //       preselectedCourseId: course._id,
  //       preselectedCourseTitle: courseTitle,
  //     },
  //   });
  // };
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const data = await courseService.getCourseById(id);
        if (mounted) {
          const anyData = data as unknown as ApiCourse;
          setCourse(anyData);
          setError("");
        }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load course");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  const logoUrl = useMemo(() => sanitizeLogo(course?.logo), [course?.logo]);

  const teachers = useMemo(() => {
    // Hỗ trợ cả course.teachers (types/course) và course.teacherIds (backend thực tế)
    const list =
      (Array.isArray(course?.teachers) ? course?.teachers : []) as Array<{
        _id: string;
        username?: string;
        email?: string;
        fullname?: string;
      }>;
    const list2 =
      (Array.isArray(course?.teacherIds) ? course?.teacherIds : []) as Array<{
        _id: string;
        username?: string;
        email?: string;
        fullname?: string;
      }>;
    const merged = [...list, ...list2];
    // unique theo _id
    const seen = new Set<string>();
    return merged.filter(t => {
      if (!t?._id) return false;
      if (seen.has(t._id)) return false;
      seen.add(t._id);
      return true;
    });
  }, [course?.teachers, course?.teacherIds]);

  const subject = course?.subjectId;
  const startDate = course?.startDate ? new Date(course.startDate) : null;
  const endDate = course?.endDate ? new Date(course.endDate) : null;

  return (
    <div
      className="min-h-screen transition-colors duration-300"
      style={{
        backgroundColor: isDarkMode ? "#0f172a" : "#f8fafc",
        color: isDarkMode ? "#ffffff" : "#0f172a",
      }}
    >
      <Navbar />
      <Sidebar role={(user?.role as "admin" | "teacher" | "student") || "student"} />

      <div className="max-w-[1200px] mx-auto px-4 py-10 mt-16 sm:pl-24 md:pl-28">
        {loading ? (
          <div className="animate-pulse">
            <div className="h-8 w-48 bg-gray-300 dark:bg-gray-700 rounded mb-6" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded" />
              <div className="lg:col-span-2 space-y-4">
                <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
                <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
                <div className="h-24 bg-gray-200 dark:bg-gray-800 rounded" />
              </div>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <h1
              className="text-3xl font-bold mb-4"
              style={{ color: isDarkMode ? "#ffffff" : "#1c1c1c" }}
            >
              Không thể tải khóa học
            </h1>
            <p
              className="mb-6"
              style={{ color: isDarkMode ? "#d1d5db" : "#4b5563" }}
            >
              {error}
            </p>
            <button
              onClick={() => navigate(-1)}
              className="bg-[#525fe1] text-white px-5 py-2 rounded-lg hover:scale-105 transition"
            >
              Back
            </button>
          </div>
        ) : !course ? (
          <div className="text-center py-20">
            <h1
              className="text-3xl font-bold mb-4"
              style={{ color: isDarkMode ? "#ffffff" : "#1c1c1c" }}
            >
              Không tìm thấy khóa học
            </h1>
            <button
              onClick={() => navigate("/")}
              className="bg-[#525fe1] text-white px-5 py-2 rounded-lg hover:scale-105 transition"
            >
              Về trang chủ
            </button>
          </div>
        ) : (
          <>
            {/* Hero */}
            <div
              className="relative rounded-2xl overflow-visible mb-8 shadow-xl"
              style={{
                background:
                  "linear-gradient(135deg, rgba(82,95,225,0.15), rgba(255,207,89,0.15))",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
                <div
                  className="p-6 flex items-center justify-center"
                  style={{
                    backgroundColor: isDarkMode ? "#0b132b" : "#ffffff",
                  }}
                >
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt={course.title ?? "Course Logo"}
                      className="rounded-xl w-full h-[260px] object-cover"
                    />
                  ) : (
                    <div className="w-full h-[260px] rounded-xl bg-gradient-to-br from-indigo-200 via-purple-200 to-pink-200 dark:from-indigo-900 dark:via-purple-900 dark:to-pink-900 flex items-center justify-center">
                      <span className="text-lg opacity-80">No Cover</span>
                    </div>
                  )}
                </div>
                <div className="lg:col-span-2 p-8">
                  <div className="flex items-center gap-2 mb-3">
                    <h1
                      className="text-4xl font-bold"
                      style={{ color: isDarkMode ? "#ffffff" : "#111827" }}
                    >
                      {course.title}
                    </h1>
                    <div className="relative group">
                      <Info 
                        className="w-5 h-5 cursor-pointer" 
                        style={{ color: isDarkMode ? "#9ca3af" : "#6b7280" }}
                      />
                      <div
                        className="fixed left-1/2 top-1/2 w-[500px] max-h-[600px] overflow-y-auto p-6 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none"
                        style={{
                          backgroundColor: isDarkMode ? "#0b132b" : "#ffffff",
                          border: `1px solid ${isDarkMode ? "rgba(255,255,255,0.08)" : "#e5e7eb"}`,
                          transform: "translate(-50%, -50%)",
                        }}
                      >
                        <div className="grid grid-cols-3 gap-6 text-sm">
                          {/* Instructors */}
                          <div>
                            <h2
                              className="text-xl font-semibold mb-3"
                              style={{ color: isDarkMode ? "#ffffff" : "#111827" }}
                            >
                              Instructors
                            </h2>
                            {teachers.length === 0 ? (
                              <p style={{ color: isDarkMode ? "#9ca3af" : "#6b7280" }}>
                                Chưa có thông tin giảng viên
                              </p>
                            ) : (
                              <ul className="space-y-2">
                                {teachers.map((t) => (
                                  <li key={t._id} className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-700 dark:text-indigo-100 text-xs">
                                      {(t.fullname || t.username || "T")
                                        .slice(0, 1)
                                        .toUpperCase()}
                                    </div>
                                    <div>
                                      <div className="font-semibold text-xs">
                                        {t.fullname || t.username}
                                      </div>
                                      <div
                                        className="text-xs"
                                        style={{
                                          color: isDarkMode ? "#9ca3af" : "#6b7280",
                                        }}
                                      >
                                        {t.email}
                                      </div>
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>

                          {/* Subject Detail */}
                          <div>
                            <h2
                              className="text-xl font-semibold mb-3"
                              style={{ color: isDarkMode ? "#ffffff" : "#111827" }}
                            >
                              Subject Detail
                            </h2>
                            {subject ? (
                              <div className="space-y-1.5">
                                <div className="flex gap-2 text-xs">
                                  <span className="opacity-70">Name:</span>
                                  <span>{subject.name}</span>
                                </div>
                                {subject.description && (
                                  <p
                                    className="text-xs line-clamp-2"
                                    style={{
                                      color: isDarkMode ? "#cbd5e1" : "#4b5563",
                                    }}
                                  >
                                    {subject.description}
                                  </p>
                                )}
                                {subject.code && (
                                  <div className="flex gap-2 text-xs">
                                    <span className="opacity-70">Code:</span>
                                    <span>{subject.code}</span>
                                  </div>
                                )}
                                {subject.slug && (
                                  <div className="flex gap-2 text-xs">
                                    <span className="opacity-70">Slug:</span>
                                    <span className="truncate">{subject.slug}</span>
                                  </div>
                                )}
                                {typeof subject.credits === "number" && (
                                  <div className="flex gap-2 text-xs">
                                    <span className="opacity-70">Credits:</span>
                                    <span>{subject.credits}</span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <p className="text-xs" style={{ color: isDarkMode ? "#9ca3af" : "#6b7280" }}>
                                Chưa có thông tin môn học
                              </p>
                            )}
                          </div>

                          {/* Info */}
                          <div>
                            <h2
                              className="text-xl font-semibold mb-3"
                              style={{ color: isDarkMode ? "#ffffff" : "#111827" }}
                            >
                              Info
                            </h2>
                            <div className="space-y-1.5 text-xs">
                              {course.createdBy && (
                                <div className="flex flex-col gap-1">
                                  <span className="opacity-70">Created By:</span>
                                  <span>{course.createdBy.username}</span>
                                  <span className="opacity-70">{course.createdBy.email}</span>
                                </div>
                              )}
                              {course.createdAt && (
                                <div className="flex gap-2">
                                  <span className="opacity-70">Created:</span>
                                  <span>
                                    {new Date(course.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                              )}
                              {course.updatedAt && (
                                <div className="flex gap-2">
                                  <span className="opacity-70">Updated:</span>
                                  <span>
                                    {new Date(course.updatedAt).toLocaleDateString()}
                                  </span>
                                </div>
                              )}
                              {course.key && (
                                <div className="flex flex-col gap-1">
                                  <span className="opacity-70">Storage Key:</span>
                                  <span className="truncate text-xs">{course.key}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 mb-5">
                    {course.status && (
                      <span className="px-3 py-1 text-sm rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                        {course.status}
                      </span>
                    )}
                    {course.isPublished !== undefined && (
                      <span className="px-3 py-1 text-sm rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                        {course.isPublished ? "Published" : "Unpublished"}
                      </span>
                    )}
                    {course.meta?.level && (
                      <span className="px-3 py-1 text-sm rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">
                        Level: {course.meta.level}
                      </span>
                    )}
                    {course.meta?.duration && (
                      <span className="px-3 py-1 text-sm rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100">
                        Duration: {course.meta.duration}
                      </span>
                    )}
                  </div>
                  {subject && (
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-sm font-semibold">Subject:</span>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-100 text-xs">
                          {subject.name}
                        </span>
                        {subject.code && (
                          <span className="px-2 py-1 rounded bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100 text-xs">
                            {subject.code}
                          </span>
                        )}
                        {typeof subject.credits === "number" && (
                          <span className="px-2 py-1 rounded bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-100 text-xs">
                            {subject.credits} credits
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  <p
                    className="text-base mb-4"
                    style={{ color: isDarkMode ? "#d1d5db" : "#374151" }}
                  >
                    {course.description}
                  </p>
                  <div className="flex flex-wrap gap-4 text-sm">
                    {startDate && (
                      <div className="flex items-center gap-2">
                        <span className="opacity-70">Start:</span>
                        <span>
                          {startDate.toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {endDate && (
                      <div className="flex items-center gap-2">
                        <span className="opacity-70">End:</span>
                        <span>
                          {endDate.toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {typeof course.capacity === "number" && (
                      <div className="flex items-center gap-2">
                        <span className="opacity-70">Capacity:</span>
                        <span>{course.capacity}</span>
                      </div>
                    )}
                    {course.enrollRequiresApproval !== undefined && (
                      <div className="flex items-center gap-2">
                        <span className="opacity-70">Enroll Approval:</span>
                        <span>
                          {course.enrollRequiresApproval ? "Required" : "Open"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs Navigation */}
            <div
              className="rounded-xl shadow-lg mb-8 overflow-hidden"
              style={{
                backgroundColor: isDarkMode ? "#0b132b" : "#ffffff",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <CourseTabsNavigation
                activeTab={activeTab}
                onTabChange={setActiveTab}
                darkMode={isDarkMode}
              />
              <div className="p-6">
                {activeTab === "lessons" && course?._id && (
                  <LessonsTab courseId={course._id} darkMode={isDarkMode} />
                )}
                {activeTab === "assignments" && course?._id && (
                  <AssignmentsTab courseId={course._id} darkMode={isDarkMode} />
                )}
                {activeTab === "attendance" && course?._id && (
                  <AttendanceTab courseId={course._id} darkMode={isDarkMode} />
                )}
                {activeTab === "schedule" && course?._id && (
                  <ScheduleTab courseId={course._id} darkMode={isDarkMode} />
                )}
                {activeTab === "static" && course?._id && (
                  <StaticCourseTab courseId={course._id} darkMode={isDarkMode} />
                )}
              </div>
            </div>
            
          </>
        )}
      </div>

      {user?.role === 'student' ? null : (
      <div className="fixed bottom-4 left-0 right-0 pointer-events-none">
        <div className="max-w-[1200px] mx-auto px-4">
          <div
            className="pointer-events-auto rounded-xl shadow-lg border flex items-center justify-between px-4 py-3"
            style={{
              backgroundColor: isDarkMode ? "#111827" : "#ffffff",
              borderColor: isDarkMode ? "rgba(255,255,255,0.08)" : "#e5e7eb",
            }}
          >
            <div className="truncate">
              <span className="text-sm opacity-70">{course?.title}</span>
            </div>
          
              <div className="flex gap-2">
                <button
                  onClick={handleCreateForumPost}
                  disabled={!course?._id}
                  className="bg-[#ffcf59] text-[#1c1c1c] font-semibold px-4 py-2 rounded-lg hover:scale-105 transition disabled:opacity-50"
                >
                  Create Forum Post
                </button>
                <button
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className="bg-[#ffcf59] text-[#1c1c1c] font-semibold px-4 py-2 rounded-lg hover:scale-105 transition disabled:opacity-50"
                >
                 {enrolling ? "Enrolling..." : "Enroll"}
                </button>
                <button
                  onClick={() => navigate(-1)}
                  className="bg-[#eaedff] text-[#1c1c1c] font-semibold px-4 py-2 rounded-lg hover:scale-105 transition"
                >
                  Back
                </button>
              </div>
          </div>
        </div>
        </div>
      )}

    </div>
  );
}
