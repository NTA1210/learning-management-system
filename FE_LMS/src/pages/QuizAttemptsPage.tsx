import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Eye, ShieldOff } from "lucide-react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { useTheme } from "../hooks/useTheme";
import { quizAttemptService } from "../services";
import type { QuizAttemptSummary, GetQuizAttemptsParams } from "../types/quizAttemptGrading";
import Swal from "sweetalert2";

export default function QuizAttemptsPage() {
    const { quizId } = useParams<{ quizId: string }>();
    const navigate = useNavigate();
    const { darkMode } = useTheme();

    const [attempts, setAttempts] = useState<QuizAttemptSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [banProcessingId, setBanProcessingId] = useState<string | null>(null);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

    const handleToggleSidebar = () => {
        setMobileSidebarOpen(prev => !prev);
    };

    const handleCloseSidebar = () => {
        setMobileSidebarOpen(false);
    };

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);



    useEffect(() => {
        if (quizId) {
            loadAttempts();
        }
    }, [quizId, currentPage]);

    const loadAttempts = async () => {
        if (!quizId) return;

        try {
            setLoading(true);
            setError(null);

            const params: GetQuizAttemptsParams = {
                page: currentPage,
                limit: 10,
                sortBy: 'createdAt',
                order: 'desc',
            };
            const response = await quizAttemptService.getQuizAttemptsForGrading(quizId, params);

            setAttempts(response.data || []);
            if (response.pagination) {
                setTotalPages(response.pagination.totalPages);
                setTotal(response.pagination.total);
            }
        } catch (err: any) {
            console.error("Failed to load attempts:", err);
            setError(err.message || "Failed to load quiz attempts");
            Swal.fire({
                icon: "error",
                title: "Error",
                text: "Failed to load quiz attempts",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleViewAttempt = (attemptId: string) => {
        navigate(`/quiz-attempts/${attemptId}`);
    };

    const handleBanAttempt = async (attempt: QuizAttemptSummary) => {
        const result = await Swal.fire({
            title: "Ban Attempt?",
            text: `Are you sure you want to ban ${attempt.student?.fullname || "this student"}? This will immediately end their attempt.`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#dc2626",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "Yes, Ban Attempt",
            background: darkMode ? "#1e293b" : "#ffffff",
            color: darkMode ? "#f8fafc" : "#1e293b",
        });

        if (result.isConfirmed) {
            try {
                setBanProcessingId(attempt._id);
                await quizAttemptService.banQuizAttempt(attempt._id);
                await Swal.fire({
                    icon: "success",
                    title: "Banned",
                    text: "The attempt has been banned successfully.",
                    timer: 1500,
                    showConfirmButton: false,
                    background: darkMode ? "#1e293b" : "#ffffff",
                    color: darkMode ? "#f8fafc" : "#1e293b",
                });
                loadAttempts(); // Refresh list
            } catch (error: any) {
                console.error("Failed to ban attempt:", error);
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: error.message || "Failed to ban attempt",
                    background: darkMode ? "#1e293b" : "#ffffff",
                    color: darkMode ? "#f8fafc" : "#1e293b",
                });
            } finally {
                setBanProcessingId(null);
            }
        }
    };



    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString();
    };

    const getStatusBadgeColor = (status: string) => {
        switch (status) {
            case 'in_progress':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
            case 'submitted':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
            case 'graded':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case 'regraded':
                return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
        }
    };

    return (
        <div className="flex h-screen overflow-hidden" style={{ backgroundColor: darkMode ? "#0f172a" : "#f8fafc" }}>
            <Sidebar variant="mobile" isOpen={mobileSidebarOpen} onClose={handleCloseSidebar} />
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Navbar onToggleSidebar={handleToggleSidebar} />
                <main className="flex-1 overflow-y-auto p-6 pt-28" style={{ backgroundColor: "var(--page-bg)", color: "var(--page-text)" }}>
                    <div className="max-w-7xl mx-auto">
                        {/* Header */}
                        <div className="mb-6">
                            <button
                                onClick={() => navigate(-1)}
                                className="flex items-center gap-2 text-sm hover:underline mb-4"
                                style={{ color: "var(--muted-text)" }}
                            >
                                ← Back
                            </button>
                            <h1 className="text-3xl font-bold" style={{ color: "var(--heading-text)" }}>
                                Quiz Attempts
                            </h1>
                            <p className="text-sm mt-2" style={{ color: "var(--muted-text)" }}>
                                View student attempts and manage active sessions
                            </p>
                        </div>



                        {/* Loading State */}
                        {loading && (
                            <div className="text-center py-12">
                                <p style={{ color: "var(--muted-text)" }}>Loading attempts...</p>
                            </div>
                        )}

                        {/* Error State */}
                        {error && !loading && (
                            <div className="rounded-lg p-4 mb-6" style={{ backgroundColor: "var(--error-bg)", color: "var(--error-text)" }}>
                                {error}
                            </div>
                        )}

                        {/* Attempts Table */}
                        {!loading && !error && (
                            <>
                                <div className="rounded-lg overflow-hidden" style={{ backgroundColor: "var(--card-surface)", border: "1px solid var(--card-border)" }}>
                                    <table className="w-full">
                                        <thead style={{ backgroundColor: darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)" }}>
                                            <tr>
                                                <th className="text-left p-4 text-sm font-semibold" style={{ color: "var(--heading-text)" }}>Student</th>
                                                <th className="text-left p-4 text-sm font-semibold" style={{ color: "var(--heading-text)" }}>Email</th>
                                                <th className="text-left p-4 text-sm font-semibold" style={{ color: "var(--heading-text)" }}>Score</th>
                                                <th className="text-left p-4 text-sm font-semibold" style={{ color: "var(--heading-text)" }}>Status</th>
                                                <th className="text-left p-4 text-sm font-semibold" style={{ color: "var(--heading-text)" }}>Time</th>
                                                <th className="text-left p-4 text-sm font-semibold" style={{ color: "var(--heading-text)" }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {attempts.length === 0 ? (
                                                <tr>
                                                    <td colSpan={6} className="p-8 text-center" style={{ color: "var(--muted-text)" }}>
                                                        No attempts found
                                                    </td>
                                                </tr>
                                            ) : (
                                                attempts.map((attempt) => (
                                                    <tr
                                                        key={attempt._id}
                                                        className="border-t hover:bg-opacity-50"
                                                        style={{ borderColor: "var(--card-border)" }}
                                                    >
                                                        <td className="p-4 text-sm" style={{ color: "var(--page-text)" }}>
                                                            {attempt.student?.fullname || "N/A"}
                                                        </td>
                                                        <td className="p-4 text-sm" style={{ color: "var(--muted-text)" }}>
                                                            {attempt.student?.email || "N/A"}
                                                        </td>
                                                        <td className="p-4 text-sm font-semibold" style={{ color: "var(--heading-text)" }}>
                                                            {attempt.status === 'in_progress' ? (
                                                                <span className="italic text-gray-400">In Progress</span>
                                                            ) : (
                                                                <>
                                                                    {attempt.score.toFixed(1)} {attempt.totalQuizScore ? `/ ${attempt.totalQuizScore}` : ""}
                                                                    {attempt.scorePercentage !== undefined && (
                                                                        <span className="ml-2 text-xs" style={{ color: "var(--muted-text)" }}>
                                                                            ({attempt.scorePercentage.toFixed(0)}%)
                                                                        </span>
                                                                    )}
                                                                </>
                                                            )}
                                                        </td>
                                                        <td className="p-4">
                                                            <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeColor(attempt.status)}`}>
                                                                {attempt.status === 'in_progress' ? 'In Progress' : attempt.status}
                                                            </span>
                                                        </td>
                                                        <td className="p-4 text-sm" style={{ color: "var(--muted-text)" }}>
                                                            {formatDate(attempt.createdAt)}
                                                        </td>
                                                        <td className="p-4">
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    onClick={() => handleViewAttempt(attempt._id)}
                                                                    className="flex items-center gap-2 px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-700 text-sm"
                                                                >
                                                                    <Eye className="w-4 h-4" />
                                                                    View
                                                                </button>
                                                                {attempt.status === 'in_progress' && (
                                                                    <button
                                                                        onClick={() => handleBanAttempt(attempt)}
                                                                        disabled={banProcessingId === attempt._id}
                                                                        className="flex items-center gap-2 px-3 py-1.5 rounded bg-red-600 text-white hover:bg-red-700 text-sm disabled:opacity-50"
                                                                    >
                                                                        <ShieldOff className="w-4 h-4" />
                                                                        {banProcessingId === attempt._id ? "Banning..." : "Ban"}
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="flex items-center justify-between mt-6">
                                        <p className="text-sm" style={{ color: "var(--muted-text)" }}>
                                            Showing page {currentPage} of {totalPages} ({total} total)
                                        </p>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                disabled={currentPage === 1}
                                                className="px-4 py-2 rounded border disabled:opacity-50 disabled:cursor-not-allowed"
                                                style={{ backgroundColor: "var(--card-surface)", borderColor: "var(--card-border)" }}
                                            >
                                                Previous
                                            </button>
                                            <button
                                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                                disabled={currentPage === totalPages}
                                                className="px-4 py-2 rounded border disabled:opacity-50 disabled:cursor-not-allowed"
                                                style={{ backgroundColor: "var(--card-surface)", borderColor: "var(--card-border)" }}
                                            >
                                                Next
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
