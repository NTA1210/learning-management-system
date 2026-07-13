// FE_LMS/src/pages/MyCourses.tsx
import React, { useEffect, useState } from "react";
import { useTheme } from "../../hooks/useTheme";
import { useAuth } from "../../hooks/useAuth";
import Navbar from "../../components/layout/Navbar.tsx";
import Sidebar from "../../components/layout/Sidebar.tsx";
import http from "../../utils/http";
import useDebounce from "../../hooks/useDebounce";
import type { Course } from "../../types/course";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { userService } from "../../services/userService";

const MyCoursesPage: React.FC = () => {
    const { darkMode } = useTheme();
    const { user } = useAuth();
    const navigate = useNavigate();
      const [searchParams, setSearchParams] = useSearchParams();
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState(searchParams.get("search") ?? "");
    const debouncedSearchTerm = useDebounce(searchTerm, 500);
    const [currentPage, setCurrentPage] = useState(Number(searchParams.get("page") ?? "1"));
    const [pageLimit, setPageLimit] = useState(Number(searchParams.get("limit") ?? "25"));
    const [totalCourses, setTotalCourses] = useState(0);
    const [sortOption, setSortOption] = useState<'name_asc' | 'name_desc' | 'date_asc' | 'date_desc'>((searchParams.get("sort") as 'name_asc' | 'name_desc' | 'date_asc' | 'date_desc') || 'date_desc');
    const [mySubjects, setMySubjects] = useState<Array<{ _id: string; name: string }>>([]);
    const [selectedSubjectId, setSelectedSubjectId] = useState(searchParams.get("subjectId") ?? "");
    const [semesters, setSemesters] = useState<Array<{ _id: string; name: string }>>([]);
    const [selectedSemesterId, setSelectedSemesterId] = useState(searchParams.get("semesterId") ?? "");
    const [teachers, setTeachers] = useState<Array<{ _id: string; fullname?: string; username?: string }>>([]);
    const [selectedTeacherId, setSelectedTeacherId] = useState(searchParams.get("teacherId") ?? "");

    const fetchMyCourses = async () => {
        try {
            setLoading(true);
            const isName = sortOption === 'name_asc' || sortOption === 'name_desc';
            const order = (sortOption.endsWith('asc') ? 'asc' : 'desc') as 'asc' | 'desc';
            const params: any = {
                page: currentPage,
                limit: pageLimit,
                ...(debouncedSearchTerm ? { search: debouncedSearchTerm } : {}),
                ...(selectedSubjectId ? { subjectId: selectedSubjectId } : {}),
                ...(selectedSemesterId ? { semesterId: selectedSemesterId } : {}),
                ...(selectedTeacherId ? { teacherId: selectedTeacherId } : {}),
                ...(isName ? { sortBy: 'title' } : {}),
                ...(order ? { sortOrder: order } : {}),
            };
            const res = await http.get("/courses/my-courses", { params });
            const dataAny: any = res as any;
            const list: Course[] = Array.isArray(dataAny?.data)
                ? dataAny.data
                : Array.isArray(dataAny?.data?.data)
                ? dataAny.data.data
                : Array.isArray(dataAny)
                ? dataAny
                : [];
            const pagination: any = dataAny?.pagination || dataAny?.meta?.pagination;
            setCourses(list);
            setError("");
            setTotalCourses(pagination?.total ?? list.length);
        } catch (e: any) {
            setError(e?.message || "Failed to load courses");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMyCourses();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, pageLimit, sortOption, debouncedSearchTerm, selectedSubjectId, selectedSemesterId, selectedTeacherId]);

    useEffect(() => {
        (async () => {
            try {
                const [subjectsRes, semestersRes, teachersRes] = await Promise.allSettled([
                    http.get('/subjects/my-subjects'),
                    http.get('/semesters'),
                    userService.getUsers({ role: 'teacher', limit: 100 } as any),
                ]);
                if (subjectsRes.status === 'fulfilled') {
                    const list = Array.isArray((subjectsRes.value as any)?.data) ? (subjectsRes.value as any).data : [];
                    setMySubjects(list.map((s: any) => ({ _id: s._id, name: s.name })));
                }
                if (semestersRes.status === 'fulfilled') {
                    const body: any = semestersRes.value as any;
                    const list = Array.isArray(body?.data) ? body.data : Array.isArray(body?.data?.data) ? body.data.data : Array.isArray(body) ? body : [];
                    setSemesters(list.map((x: any) => ({ _id: x._id, name: x.name })));
                }
                if (teachersRes.status === 'fulfilled') {
                    const list = teachersRes.value.users || [];
                    setTeachers(list.map((u: any) => ({ _id: u._id, fullname: u.fullname, username: u.username })));
                }
            } catch {}
        })();
    }, []);

    useEffect(() => {
        const params: Record<string, string> = {};
        if (debouncedSearchTerm) params.search = debouncedSearchTerm;
        if (sortOption) params.sort = sortOption;
        if (selectedSubjectId) params.subjectId = selectedSubjectId;
        if (selectedSemesterId) params.semesterId = selectedSemesterId;
        if (selectedTeacherId) params.teacherId = selectedTeacherId;
        params.page = String(currentPage);
        params.limit = String(pageLimit);
        setSearchParams(params);
    }, [debouncedSearchTerm, sortOption, selectedSubjectId, selectedSemesterId, selectedTeacherId, currentPage, pageLimit, setSearchParams]);

    return (
        <div
            className="app-page min-h-screen transition-colors duration-300"
            style={{
                backgroundColor: "var(--app-bg)",
                color: darkMode ? "#ffffff" : "#0f172a",
            }}
        >
            <Navbar />
                  <Sidebar role={user?.role as 'admin' | 'teacher' | 'student'} />
            <div className="app-shell-main">
              <div className="app-content">
                <div className="ui-panel p-5 sm:p-6 mb-6">
                    <p className="section-eyebrow mb-2">Learning</p>
                    <h1
                        className="text-3xl font-bold mb-2"
                        style={{ color: darkMode ? "#ffffff" : "#111827" }}
                    >
                        My Courses
                    </h1>
                    <p style={{ color: darkMode ? "#9ca3af" : "#64748b" }}>
                        Track your enrolled courses, subjects, semesters, and teachers in one place.
                    </p>
                </div>

                <div
                    className="p-5 rounded-2xl mb-8 border flex flex-col gap-5 transition-all duration-300"
                    style={{
                        backgroundColor: darkMode ? "rgba(15, 23, 42, 0.45)" : "#ffffff",
                        borderColor: darkMode ? "rgba(255, 255, 255, 0.06)" : "rgba(226, 232, 240, 0.8)",
                        boxShadow: darkMode
                            ? "0 4px 20px -2px rgba(0, 0, 0, 0.2)"
                            : "0 4px 20px -2px rgba(0, 0, 0, 0.03)",
                    }}
                >
                    {/* Row 1: Search and Limit */}
                    <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
                        {/* Search Input with nested icon */}
                        <div className="relative flex-1 max-w-xl">
                            <Search
                                size={18}
                                className="absolute left-3.5 top-1/2 -translate-y-1/2"
                                style={{ color: darkMode ? "#64748b" : "#94a3b8" }}
                            />
                            <input
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search courses by title or description..."
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                                style={{
                                    backgroundColor: darkMode ? "rgba(30, 41, 59, 0.5)" : "#ffffff",
                                    borderColor: darkMode ? "rgba(255, 255, 255, 0.08)" : "#e2e8f0",
                                    color: darkMode ? "#ffffff" : "#1f2937",
                                }}
                            />
                        </div>

                        {/* Page Limit Select */}
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <select
                                    value={pageLimit}
                                    onChange={(e) => {
                                        setCurrentPage(1);
                                        setPageLimit(Number(e.target.value));
                                    }}
                                    className="appearance-none rounded-xl px-4 py-2 pr-10 border text-xs font-semibold focus:outline-none focus:ring-2 transition-all duration-200 cursor-pointer"
                                    style={{
                                        width: 120,
                                        background: darkMode ? "rgba(30, 41, 59, 0.5)" : "#ffffff",
                                        color: darkMode ? "#cbd5e1" : "#475569",
                                        borderColor: darkMode ? "rgba(255, 255, 255, 0.08)" : "#e2e8f0",
                                    }}
                                >
                                    {[10, 20, 25, 50].map((n) => (
                                        <option key={n} value={n}>{n} / page</option>
                                    ))}
                                </select>
                                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                                    <ChevronDown size={14} style={{ color: darkMode ? "#64748b" : "#94a3b8" }} />
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Row 2: Filters Grid */}
                    <div
                        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t"
                        style={{ borderColor: darkMode ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.05)" }}
                    >
                        {/* Sort Select */}
                        <div className="relative">
                            <select
                                value={sortOption}
                                onChange={(e) => setSortOption(e.target.value as 'name_asc' | 'name_desc' | 'date_asc' | 'date_desc')}
                                className="w-full appearance-none rounded-xl px-4 py-2 pr-10 border text-xs font-semibold focus:outline-none focus:ring-2 transition-all duration-200 cursor-pointer"
                                style={{
                                    background: darkMode ? "rgba(30, 41, 59, 0.5)" : "#ffffff",
                                    color: darkMode ? "#cbd5e1" : "#475569",
                                    borderColor: darkMode ? "rgba(255, 255, 255, 0.08)" : "#e2e8f0",
                                }}
                            >
                                <option value="date_desc">Sort: Newest</option>
                                <option value="date_asc">Sort: Oldest</option>
                                <option value="name_asc">Sort: Title A-Z</option>
                                <option value="name_desc">Sort: Title Z-A</option>
                            </select>
                            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                                <ChevronDown size={14} style={{ color: darkMode ? "#64748b" : "#94a3b8" }} />
                            </span>
                        </div>

                        {/* Subject Select */}
                        <div className="relative">
                            <select
                                value={selectedSubjectId}
                                onChange={(e) => { setSelectedSubjectId(e.target.value); setCurrentPage(1); }}
                                className="w-full appearance-none rounded-xl px-4 py-2 pr-10 border text-xs font-semibold focus:outline-none focus:ring-2 transition-all duration-200 cursor-pointer"
                                style={{
                                    background: darkMode ? "rgba(30, 41, 59, 0.5)" : "#ffffff",
                                    color: darkMode ? "#cbd5e1" : "#475569",
                                    borderColor: darkMode ? "rgba(255, 255, 255, 0.08)" : "#e2e8f0",
                                }}
                            >
                                <option value="">All My Subjects</option>
                                {mySubjects.map((s) => (
                                    <option key={s._id} value={s._id}>{s.name}</option>
                                ))}
                            </select>
                            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                                <ChevronDown size={14} style={{ color: darkMode ? "#64748b" : "#94a3b8" }} />
                            </span>
                        </div>

                        {/* Semester Select */}
                        <div className="relative">
                            <select
                                value={selectedSemesterId}
                                onChange={(e) => { setSelectedSemesterId(e.target.value); setCurrentPage(1); }}
                                className="w-full appearance-none rounded-xl px-4 py-2 pr-10 border text-xs font-semibold focus:outline-none focus:ring-2 transition-all duration-200 cursor-pointer"
                                style={{
                                    background: darkMode ? "rgba(30, 41, 59, 0.5)" : "#ffffff",
                                    color: darkMode ? "#cbd5e1" : "#475569",
                                    borderColor: darkMode ? "rgba(255, 255, 255, 0.08)" : "#e2e8f0",
                                }}
                            >
                                <option value="">All Semesters</option>
                                {semesters.map((s) => (
                                    <option key={s._id} value={s._id}>{s.name}</option>
                                ))}
                            </select>
                            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                                <ChevronDown size={14} style={{ color: darkMode ? "#64748b" : "#94a3b8" }} />
                            </span>
                        </div>

                        {/* Teacher Select */}
                        <div className="relative">
                            <select
                                value={selectedTeacherId}
                                onChange={(e) => { setSelectedTeacherId(e.target.value); setCurrentPage(1); }}
                                className="w-full appearance-none rounded-xl px-4 py-2 pr-10 border text-xs font-semibold focus:outline-none focus:ring-2 transition-all duration-200 cursor-pointer"
                                style={{
                                    background: darkMode ? "rgba(30, 41, 59, 0.5)" : "#ffffff",
                                    color: darkMode ? "#cbd5e1" : "#475569",
                                    borderColor: darkMode ? "rgba(255, 255, 255, 0.08)" : "#e2e8f0",
                                }}
                            >
                                <option value="">All Teachers</option>
                                {teachers.map((t) => (
                                    <option key={t._id} value={t._id}>{t.fullname || t.username}</option>
                                ))}
                            </select>
                            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                                <ChevronDown size={14} style={{ color: darkMode ? "#64748b" : "#94a3b8" }} />
                            </span>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-16">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: darkMode ? '#6366f1' : '#4f46e5' }} />
                    </div>
                ) : error ? (
                    <div
                        className="p-4 rounded-lg mb-6"
                        style={{
                            backgroundColor: darkMode ? 'rgba(239, 68, 68, 0.1)' : '#fee2e2',
                            color: darkMode ? '#fca5a5' : '#dc2626'
                        }}
                    >
                        {error}
                    </div>
                ) : (
                    <>
                                {courses.length === 0 ? (
                                    <div className="text-center py-12">
                                        <svg className="w-24 h-24 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: darkMode ? '#6b7280' : '#9ca3af' }}>
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                        </svg>
                                        <h3 className="text-xl font-semibold mb-2" style={{ color: darkMode ? '#ffffff' : '#1f2937' }}>No courses available</h3>
                                        <p style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}>There are no courses available for enrollment at the moment</p>
                                    </div>
                                ) : (
                                    <><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                                        {courses.map((course) => (
                                            <div
                                                key={course._id}
                                                className="ui-card ui-card-hover p-5 sm:p-6 transition-all duration-300 flex flex-col h-full"
                                                style={{
                                                    backgroundColor: darkMode
                                                        ? "rgba(30, 41, 59, 0.75)"
                                                        : "#ffffff",
                                                    borderColor: darkMode
                                                        ? "rgba(255, 255, 255, 0.06)"
                                                        : "rgba(226, 232, 240, 0.8)",
                                                    backdropFilter: "blur(8px)",
                                                    boxShadow: darkMode
                                                        ? "0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -4px rgba(0, 0, 0, 0.3)"
                                                        : "0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -4px rgba(0, 0, 0, 0.05)",
                                                    minHeight: '340px',
                                                }}
                                            >
                                                {/* Course Header */}
                                                <div className="flex items-start justify-between mb-4">
                                                    <div className="flex-1">
                                                        <div className="flex flex-wrap gap-1.5 items-center mb-3">
                                                            {course.code && (
                                                                <span
                                                                    className="px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide shadow-sm"
                                                                    style={{
                                                                        backgroundColor: darkMode ? 'rgba(99, 102, 241, 0.15)' : '#eef2ff',
                                                                        color: darkMode ? '#cbd5e1' : '#4f46e5',
                                                                        border: darkMode ? '1px solid rgba(99, 102, 241, 0.25)' : '1px solid rgba(99, 102, 241, 0.4)'
                                                                    }}
                                                                >
                                                                    {course.code}
                                                                </span>
                                                            )}
                                                            {course.isPublished ? (
                                                                <span
                                                                    className="px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide shadow-sm"
                                                                    style={{
                                                                        backgroundColor: darkMode ? 'rgba(16, 185, 129, 0.15)' : '#e6fffa',
                                                                        color: darkMode ? '#34d399' : '#047857',
                                                                        border: darkMode ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(16, 185, 129, 0.4)'
                                                                    }}
                                                                >
                                                                    Published
                                                                </span>
                                                            ) : (
                                                                <span
                                                                    className="px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide shadow-sm"
                                                                    style={{
                                                                        backgroundColor: darkMode ? 'rgba(156, 163, 175, 0.15)' : '#f3f4f6',
                                                                        color: darkMode ? '#cbd5e1' : '#6b7280',
                                                                        border: darkMode ? '1px solid rgba(156, 163, 175, 0.25)' : '1px solid rgba(156, 163, 175, 0.4)'
                                                                    }}
                                                                >
                                                                    Draft
                                                                </span>
                                                            )}
                                                        </div>
                                                        <h3 className="text-xl font-bold tracking-tight mb-2 line-clamp-2" style={{ color: darkMode ? '#ffffff' : '#1f2937' }}>
                                                            {course.title}
                                                        </h3>
                                                    </div>
                                                </div>

                                                {/* Course Body (grows to push buttons to the bottom) */}
                                                <div className="flex-1 flex flex-col justify-between mb-5">
                                                    <div className="space-y-4">
                                                        {/* Course Description */}
                                                        <p className="text-sm line-clamp-2" style={{ color: darkMode ? '#94a3b8' : '#64748b' }}>
                                                            {course.description}
                                                        </p>

                                                        {/* Course Details (Semester & Capacity) */}
                                                        <div
                                                            className="space-y-2.5 py-3 border-t border-b"
                                                            style={{
                                                                borderColor: darkMode
                                                                    ? "rgba(255, 255, 255, 0.06)"
                                                                    : "rgba(0, 0, 0, 0.05)"
                                                            }}
                                                        >
                                                            <div className="flex items-center text-sm">
                                                                <div
                                                                    className="w-7 h-7 rounded-lg flex items-center justify-center mr-2.5"
                                                                    style={{
                                                                        backgroundColor: darkMode ? 'rgba(99, 102, 241, 0.1)' : '#eef2ff'
                                                                    }}
                                                                >
                                                                    <svg
                                                                        className="w-4 h-4"
                                                                        fill="none"
                                                                        stroke="currentColor"
                                                                        viewBox="0 0 24 24"
                                                                        style={{ color: darkMode ? '#818cf8' : '#4f46e5' }}
                                                                    >
                                                                        <path
                                                                            strokeLinecap="round"
                                                                            strokeLinejoin="round"
                                                                            strokeWidth="2"
                                                                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                                        />
                                                                    </svg>
                                                                </div>
                                                                <span style={{ color: darkMode ? '#cbd5e1' : '#475569' }}>
                                                                    {(() => {
                                                                        const sem: any = (course as any).semesterId;
                                                                        return typeof sem === 'object' && sem ? (sem.name || 'No Semester') : 'No Semester';
                                                                    })()}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center text-sm">
                                                                <div
                                                                    className="w-7 h-7 rounded-lg flex items-center justify-center mr-2.5"
                                                                    style={{
                                                                        backgroundColor: darkMode ? 'rgba(16, 185, 129, 0.1)' : '#ecfdf5'
                                                                    }}
                                                                >
                                                                    <svg
                                                                        className="w-4 h-4"
                                                                        fill="none"
                                                                        stroke="currentColor"
                                                                        viewBox="0 0 24 24"
                                                                        style={{ color: darkMode ? '#34d399' : '#059669' }}
                                                                    >
                                                                        <path
                                                                            strokeLinecap="round"
                                                                            strokeLinejoin="round"
                                                                            strokeWidth="2"
                                                                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                                                        />
                                                                    </svg>
                                                                </div>
                                                                <span style={{ color: darkMode ? '#cbd5e1' : '#475569' }}>
                                                                    Capacity: <span className="font-semibold" style={{ color: darkMode ? '#f3f4f6' : '#1f2937' }}>{course.capacity}</span> students
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Instructors list */}
                                                        {(() => {
                                                            const list = Array.isArray((course as any).teacherIds)
                                                                ? (course as any).teacherIds
                                                                : Array.isArray(course.teachers)
                                                                    ? course.teachers
                                                                    : [];
                                                            return list.length > 0 ? (
                                                                <div>
                                                                    <div
                                                                        className="text-[10px] uppercase tracking-wider font-bold mb-1.5"
                                                                        style={{ color: darkMode ? "#64748b" : "#94a3b8" }}
                                                                    >
                                                                        Instructors
                                                                    </div>
                                                                    <div className="flex flex-wrap gap-1.5">
                                                                        {list.map((teacher: any) => (
                                                                            <span
                                                                                key={
                                                                                    typeof teacher === "string"
                                                                                        ? teacher
                                                                                        : teacher?._id
                                                                                }
                                                                                className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium"
                                                                                style={{
                                                                                    backgroundColor: darkMode
                                                                                        ? "rgba(100, 116, 139, 0.15)"
                                                                                        : "#f1f5f9",
                                                                                    color: darkMode ? "#cbd5e1" : "#475569",
                                                                                    border: darkMode
                                                                                        ? "1px solid rgba(255, 255, 255, 0.04)"
                                                                                        : "1px solid #e2e8f0"
                                                                                }}
                                                                            >
                                                                                <svg
                                                                                    className="w-3 h-3 mr-1"
                                                                                    fill="currentColor"
                                                                                    viewBox="0 0 20 20"
                                                                                    style={{ color: darkMode ? "#94a3b8" : "#64748b" }}
                                                                                >
                                                                                    <path
                                                                                        fillRule="evenodd"
                                                                                        d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                                                                                        clipRule="evenodd"
                                                                                    />
                                                                                </svg>
                                                                                {typeof teacher === "object" && teacher !== null
                                                                                    ? teacher.fullname || teacher.username || "Teacher"
                                                                                    : "Teacher"}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            ) : null;
                                                        })()}
                                                    </div>
                                                </div>

                                                {/* Action Buttons */}
                                                <div
                                                    className="mt-auto pt-4 border-t"
                                                    style={{
                                                        borderColor: darkMode
                                                            ? "rgba(255, 255, 255, 0.08)"
                                                            : "rgba(226, 232, 240, 0.8)",
                                                    }}
                                                >
                                                    <button
                                                        className="w-full px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 hover:opacity-90 active:scale-95 flex items-center justify-center"
                                                        style={{
                                                            backgroundColor: darkMode ? 'rgba(99, 102, 241, 0.15)' : '#eef2ff',
                                                            color: darkMode ? '#c7d2fe' : '#4f46e5',
                                                            border: darkMode
                                                                ? "1px solid rgba(99, 102, 241, 0.25)"
                                                                : "1px solid #e2e8f0",
                                                        }}
                                                        onClick={() => navigate(`/courses/${course._id}`)}
                                                    >
                                                        View Course
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div><div className="flex items-center justify-between px-4 py-4 mt-2">
                                        <div className="text-sm" style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>
                                            Total: {totalCourses}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                                className="px-3 py-2 rounded-lg disabled:opacity-50 flex items-center gap-1"
                                                style={{
                                                    backgroundColor: darkMode ? "#111827" : "#ffffff",
                                                    border: darkMode ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e5e7eb",
                                                }}
                                                disabled={currentPage <= 1}
                                            >
                                                <ChevronLeft size={16} /> Prev
                                            </button>
                                            <span
                                                className="px-3 py-1 rounded-full text-sm"
                                                style={{
                                                    backgroundColor: darkMode ? 'rgba(55, 65, 81, 0.6)' : '#f3f4f6',
                                                    color: darkMode ? '#e5e7eb' : '#374151'
                                                }}
                                            >
                                                {currentPage} / {Math.max(1, Math.ceil(totalCourses / pageLimit))}
                                            </span>
                                            <button
                                                onClick={() => setCurrentPage((p) => p + 1)}
                                                className="px-3 py-2 rounded-lg disabled:opacity-50 flex items-center gap-1"
                                                style={{
                                                    backgroundColor: darkMode ? "#111827" : "#ffffff",
                                                    border: darkMode ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e5e7eb",
                                                }}
                                                disabled={currentPage >= Math.max(1, Math.ceil(totalCourses / pageLimit))}
                                            >
                                                Next <ChevronRight size={16} />
                                            </button>
                                        </div>
                                    </div></>
                                )
                                }
                    </>
                    
                )}
              </div>
            </div>
        </div>
    );
};

export default MyCoursesPage;
