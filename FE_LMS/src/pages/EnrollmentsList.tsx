// FE_LMS/src/pages/EnrollmentsList.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useTheme } from "../hooks/useTheme";
import { useAuth } from "../hooks/useAuth";
import Navbar from "../components/Navbar.tsx";
import Sidebar from "../components/Sidebar.tsx";
import { enrollmentService, courseService } from "../services";
import http from "../utils/http";
import { userService } from "../services/userService";

type Status =
    | "pending"
    | "approved"
    | "rejected"
    | "cancelled"
    | "dropped"
    | "completed";

const STATUS_OPTIONS: { value: Status | ""; label: string }[] = [
    { value: "", label: "All" },
    { value: "pending", label: "Pending" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
    { value: "cancelled", label: "Cancelled" },
    { value: "dropped", label: "Dropped" },
    { value: "completed", label: "Completed" },
];

function statusColors(s?: string, dark?: boolean) {
    switch (s) {
        case "approved":
            return dark ? "bg-green-900 text-green-100" : "bg-green-100 text-green-800";
        case "pending":
            return dark ? "bg-yellow-900 text-yellow-100" : "bg-yellow-100 text-yellow-800";
        case "rejected":
            return dark ? "bg-red-900 text-red-100" : "bg-red-100 text-red-800";
        case "cancelled":
            return dark ? "bg-gray-800 text-gray-100" : "bg-gray-100 text-gray-800";
        case "dropped":
            return dark ? "bg-rose-900 text-rose-100" : "bg-rose-100 text-rose-800";
        case "completed":
            return dark ? "bg-blue-900 text-blue-100" : "bg-blue-100 text-blue-800";
        default:
            return dark ? "bg-slate-800 text-slate-100" : "bg-slate-100 text-slate-800";
    }
}

const EnrollmentsListPage: React.FC = () => {
    const { darkMode } = useTheme();
    const { user } = useAuth();

    const [items, setItems] = useState<ReturnType<typeof useState> extends never ? never : any[]>([]);
    const [pagination, setPagination] = useState<{ total?: number; page?: number; limit?: number; totalPages?: number } | undefined>(undefined);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [status, setStatus] = useState<Status | "">("");
    const [search, setSearch] = useState("");
const [showCreateModal, setShowCreateModal] = useState(false);
const [creating, setCreating] = useState(false);
const [createError, setCreateError] = useState("");
const [form, setForm] = useState<{ userId: string; courseId: string; status: "pending" | "approved"; role: string }>({
  userId: "",
  courseId: "",
  status: "pending",
  role: "student",
});
const [users, setUsers] = useState<Array<{ _id: string; username: string; email: string; fullname?: string }>>([]);
const [courses, setCourses] = useState<Array<{ _id: string; title: string; description?: string }>>([]);
const [courseTeachers, setCourseTeachers] = useState<Record<string, string[]>>({});
const [updating, setUpdating] = useState<Record<string, boolean>>({});

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return items;
        return items.filter((it: any) => {
            const student = it?.studentId;
            const course = it?.courseId;
            const s1 = `${student?.username ?? ""} ${student?.email ?? ""} ${student?.fullname ?? ""}`.toLowerCase();
            const c1 = `${course?.title ?? ""} ${course?.description ?? ""}`.toLowerCase();
            return s1.includes(term) || c1.includes(term);
        });
    }, [items, search]);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                setLoading(true);
                const { items: data, pagination: pg } = await enrollmentService.listAll({
                    page,
                    limit,
                    status: status || undefined,
                });
                if (mounted) {
                    setItems(Array.isArray(data) ? data : []);
                    setPagination(pg);
                    setError("");
                }
            } catch (e: any) {
                if (mounted) setError(e?.message || "Failed to load enrollments");
            } finally {
                if (mounted) setLoading(false);
            }
        })();


return () => {
            mounted = false;
        };
    }, [page, limit, status]);

    useEffect(() => {
        const ids = Array.from(new Set(items.map((it: any) => it?.courseId?._id).filter(Boolean)));
        const missing = ids.filter((id) => !(courseTeachers[id]));
        if (!missing.length) return;
        (async () => {
            const results = await Promise.all(missing.map((id) => courseService.getCourseById(id).catch(() => null)));
            const mapUpdate: Record<string, string[]> = {};
            results.forEach((course, idx) => {
                const id = missing[idx];
                const arr = Array.isArray((course as any)?.teacherIds)
                    ? (course as any).teacherIds.map((t: any) => (typeof t === 'string' ? t : t?._id)).filter(Boolean)
                    : Array.isArray((course as any)?.teachers)
                    ? (course as any).teachers.map((t: any) => t?._id).filter(Boolean)
                    : [];
                mapUpdate[id] = arr;
            });
            setCourseTeachers((prev) => ({ ...prev, ...mapUpdate }));
        })();
    }, [items]);

useEffect(() => {
  if (!showCreateModal) return;
  let mounted = true;
  (async () => {
    try {
      const [{ users: userList }, { courses: courseList }] = await Promise.all([
        userService.getUsers({ role: "student", limit: 50 }),
        courseService.getAllCourses({ limit: 50 }),
      ]);
      if (mounted) {
        setUsers(Array.isArray(userList) ? userList.map(u => ({ _id: u._id, username: u.username, email: (u as any)?.email ?? "", fullname: (u as any)?.fullname })) : []);
        setCourses(Array.isArray(courseList) ? courseList.map(c => ({ _id: c._id, title: c.title, description: c.description })) : []);
      }
    } catch {}
  })();
  return () => { mounted = false; };
}, [showCreateModal]);
    async function submitCreate() {
        setCreating(true);
        setCreateError("");
        try {
            await enrollmentService.create({
                userId: form.userId,
                courseId: form.courseId,
                status: form.status,
                role: form.role,
            });
            setShowCreateModal(false);
            setForm({ userId: "", courseId: "", status: "pending", role: "student" });
            setPage(1);
            const { items: data, pagination: pg } = await enrollmentService.listAll({ page: 1, limit, status: status || undefined });
            setItems(Array.isArray(data) ? data : []);
            setPagination(pg);
        } catch (e: any) {
            setCreateError(e?.message || "Failed to create enrollment");
        } finally {
            setCreating(false);
        }
    }
    const isAdmin = user?.role === 'admin';
    const isTeacher = user?.role === 'teacher';

    const canUpdateEnrollment = (it: any) => {
        if (isAdmin) return true;
        if (isTeacher && user?._id) {
            const courseId = it?.courseId?._id;
            const ids = courseId ? (courseTeachers[courseId] || []) : [];
            return ids.includes(user._id);
        }
        return false;
    };

    async function handleApprove(id: string) {
        setUpdating(prev => ({ ...prev, [id]: true }));
        try {
            await http.put(`/enrollments/${id}`, { status: 'approved' });
            setItems(prev => prev.map((it: any) => it._id === id ? { ...it, status: 'approved', updatedAt: new Date().toISOString() } : it));
        } finally {
            setUpdating(prev => ({ ...prev, [id]: false }));
        }
    }

    return (
        <div
            className="min-h-screen transition-colors duration-300"
            style={{
                backgroundColor: darkMode ? "#0f172a" : "#f8fafc",
                color: darkMode ? "#ffffff" : "#0f172a",
            }}
        >
            <Navbar />
            <Sidebar />
            <div className="max-w-[1600px] mt-[100px] mx-auto px-4 sm:pl-[93px] py-6">
                <div className="flex items-center justify-between mb-4">
                    <h1
                        className="text-2xl font-semibold"
                        style={{ color: darkMode ? "#ffffff" : "#111827" }}
                    >
                        Enrollments
                    </h1>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-[#525fe1] text-white px-4 py-2 rounded-lg hover:opacity-90"
                        >
                            Create Enrollment
                        </button>
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by student or course"
                            className="px-3 py-2 rounded-lg outline-none"
                            style={{
                                backgroundColor: darkMode ? "#1f2937" : "#ffffff",
                                color: darkMode ? "#ffffff" : "#111827",
                                border: darkMode ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e5e7eb",
                            }}
                        />
                        <select
                            value={status}
                            onChange={(e) => {
                                setPage(1);
                                setStatus(e.target.value as Status | "");
                            }}
                            className="px-3 py-2 rounded-lg"
                            style={{
                                backgroundColor: darkMode ? "#1f2937" : "#ffffff",
                                color: darkMode ? "#ffffff" : "#111827",
                                border: darkMode ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e5e7eb",
                            }}
                        >
                            {STATUS_OPTIONS.map((opt) => (
                                <option key={opt.label} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                        <select
                            value={limit}
                            onChange={(e) => {
                                setPage(1);
                                setLimit(Number(e.target.value));
                            }}
                            className="px-3 py-2 rounded-lg"
                            style={{
                                backgroundColor: darkMode ? "#1f2937" : "#ffffff",
                                color: darkMode ? "#ffffff" : "#111827",
                                border: darkMode ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e5e7eb",
                            }}
                        >
                            {[10, 20, 50].map((n) => (
                                <option key={n} value={n}>
                                    {n}/page
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {showCreateModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center">
                        <div className="absolute inset-0 bg-black/50" onClick={() => !creating && setShowCreateModal(false)} />
                        <div
                            className="relative w-full max-w-lg rounded-xl shadow-lg p-6"
                            style={{
                                backgroundColor: darkMode ? "#0b132b" : "#ffffff",
                                border: darkMode ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e5e7eb",
                            }}
                        >
                            <div className="text-lg font-semibold mb-4" style={{ color: darkMode ? "#ffffff" : "#111827" }}>Create Enrollment</div>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm mb-1 block">Student</label>
                                    <select
                                        value={form.userId}
                                        onChange={(e) => setForm({ ...form, userId: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg"
                                        style={{ backgroundColor: darkMode ? "#1f2937" : "#ffffff", color: darkMode ? "#ffffff" : "#111827", border: darkMode ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e5e7eb" }}
                                    >
                                        <option value="">Select student</option>
                                        {users.map(u => (
                                            <option key={u._id} value={u._id}>{u.fullname || u.username} - {u.email}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm mb-1 block">Course</label>
                                    <select
                                        value={form.courseId}
                                        onChange={(e) => setForm({ ...form, courseId: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg"
                                        style={{ backgroundColor: darkMode ? "#1f2937" : "#ffffff", color: darkMode ? "#ffffff" : "#111827", border: darkMode ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e5e7eb" }}
                                    >
                                        <option value="">Select course</option>
                                        {courses.map(c => (
                                            <option key={c._id} value={c._id}>{c.title}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-sm mb-1 block">Status</label>
                                        <select
                                            value={form.status}
                                            onChange={(e) => setForm({ ...form, status: e.target.value as "pending" | "approved" })}
                                            className="w-full px-3 py-2 rounded-lg"
                                            style={{ backgroundColor: darkMode ? "#1f2937" : "#ffffff", color: darkMode ? "#ffffff" : "#111827", border: darkMode ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e5e7eb" }}
                                        >
                                            <option value="pending">pending</option>
                                            <option value="approved">approved</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-sm mb-1 block">Role</label>
                                        <select
                                            value={form.role}
                                            onChange={(e) => setForm({ ...form, role: e.target.value })}
                                            className="w-full px-3 py-2 rounded-lg"
                                            style={{ backgroundColor: darkMode ? "#1f2937" : "#ffffff", color: darkMode ? "#ffffff" : "#111827", border: darkMode ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e5e7eb" }}
                                        >
                                            <option value="student">student</option>
                                            <option value="teaching_assistant">teaching_assistant</option>
                                            <option value="instructor">instructor</option>
                                        </select>
                                    </div>
                                </div>
                                {createError && <div className="text-sm text-red-500">{createError}</div>}
                                <div className="flex justify-end gap-2 pt-2">
                                    <button
                                        onClick={() => setShowCreateModal(false)}
                                        disabled={creating}
                                        className="px-4 py-2 rounded-lg"
                                        style={{ backgroundColor: darkMode ? "#111827" : "#ffffff", border: darkMode ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e5e7eb" }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={submitCreate}
                                        disabled={creating || !form.userId || !form.courseId}
                                        className="bg-[#525fe1] text-white px-4 py-2 rounded-lg disabled:opacity-50"
                                    >
                                        {creating ? "Creating..." : "Create"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="animate-pulse space-y-3">
                        <div className="h-8 w-56 bg-gray-300 dark:bg-gray-700 rounded" />
                        <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded" />
                        <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded" />
                    </div>
                ) : error ? (
                    <div className="rounded-lg p-4"
                        style={{
                            backgroundColor: darkMode ? "#1f2937" : "#ffffff",
                            border: darkMode ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e5e7eb",
                        }}
                    >
                        <div className="text-red-500 mb-2">Không thể tải danh sách enrollment</div>
                        <div className="text-sm" style={{ color: darkMode ? "#cbd5e1" : "#4b5563" }}>{error}</div>
                    </div>
                ) : (
                    <div
                        className="rounded-lg shadow w-full"
                        style={{
                            backgroundColor: darkMode ? "#0b132b" : "#ffffff",
                            border: darkMode ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e5e7eb",
                        }}
                    >
                        <div className="">
                            <table className="min-w-full">
                                <thead>
                                    <tr
                                        className="text-left text-sm"
                                        style={{ backgroundColor: darkMode ? "#111827" : "#f9fafb" }}
                                    >
                                        <th className="px-4 py-3">Student</th>
                                        <th className="px-4 py-3">Course</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3">Method</th>
                                        <th className="px-4 py-3">Role</th>
                                        <th className="px-4 py-3">Progress</th>
                                        <th className="px-4 py-3">Created</th>
                                        <th className="px-4 py-3">Updated</th>
                                        <th className="px-4 py-3">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.length === 0 ? (
                                        <tr>
                                            <td className="px-4 py-6 text-center" colSpan={9}
                                                style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}
                                            >
                                                Không có dữ liệu
                                            </td>
                                        </tr>
                                    ) : (
                                        filtered.map((it: any) => {
                                            const prog = it?.progress || { totalLessons: 0, completedLessons: 0 };
                                            const percent = prog.totalLessons > 0 ? Math.round((prog.completedLessons / prog.totalLessons) * 100) : 0;
                                            return (
                                                <tr key={it._id} className="border-t"
                                                    style={{ borderColor: darkMode ? "rgba(255,255,255,0.08)" : "#e5e7eb" }}
                                                >
                                                    <td className="px-4 py-3">
                                                        <div className="font-medium">{it?.studentId?.fullname || it?.studentId?.username}</div>
                                                        <div className="text-sm" style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>{it?.studentId?.email}</div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="font-medium">{it?.courseId?.title}</div>
                                                        <div className="text-sm break-words" style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>{it?.courseId?.description}</div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className={`px-2 py-1 rounded-full text-xs ${statusColors(it?.status, darkMode)}`}>{it?.status}</span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="text-sm">{it?.method || "-"}</span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="text-sm">{it?.role || "-"}</span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="text-sm mb-1">{prog.completedLessons}/{prog.totalLessons}</div>
                                                        <div className="h-2 rounded-full" style={{ backgroundColor: darkMode ? "#1f2937" : "#e5e7eb" }}>
                                                            <div className="h-2 rounded-full" style={{ width: `${percent}%`, backgroundColor: darkMode ? "#525fe1" : "#525fe1" }} />
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="text-sm">{it?.createdAt ? new Date(it.createdAt).toLocaleString() : "-"}</div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="text-sm">{it?.updatedAt ? new Date(it.updatedAt).toLocaleString() : "-"}</div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {user?.role === 'student' ? null : (
                                                          <button
                                                            onClick={() => handleApprove(it._id)}
                                                            disabled={it?.status !== 'pending' || !canUpdateEnrollment(it) || !!updating[it._id]}
                                                            className="px-3 py-1 rounded-lg text-sm bg-[#525fe1] text-white disabled:opacity-50"
                                                          >
                                                            Approve
                                                          </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex items-center justify-between px-4 py-3">
                            <div className="text-sm" style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>
                                Total: {pagination?.total ?? filtered.length}
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    // disabled={!pagination?.hasPrev && page <= 1}
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    className="px-3 py-2 rounded-lg disabled:opacity-50"
                                    style={{
                                        backgroundColor: darkMode ? "#111827" : "#ffffff",
                                        border: darkMode ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e5e7eb",
                                    }}
                                >
                                    Prev
                                </button>
                                <span className="text-sm">{page} / {pagination?.totalPages ?? Math.max(1, Math.ceil((pagination?.total ?? filtered.length) / limit))}</span>
                                <button
                                    // disabled={!pagination?.hasNext && page >= (pagination?.totalPages ?? 1)}
                                    onClick={() => setPage((p) => p + 1)}
                                    className="px-3 py-2 rounded-lg disabled:opacity-50"
                                    style={{
                                        backgroundColor: darkMode ? "#111827" : "#ffffff",
                                        border: darkMode ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e5e7eb",
                                    }}
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EnrollmentsListPage;