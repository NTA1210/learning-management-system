import { useTheme } from "../../hooks/useTheme";
import type { Course } from "../../types/course";
import AttendanceProgressIndicator from "../attendance/AttendanceProgressIndicator.tsx";

interface CourseGridProps {
    courses: Course[];
    loading: boolean;
    emptyMessage?: string;
    onCourseClick: (course: Course) => void;
    selectedCourseId?: string;
    showProgress?: boolean;
    showDescription?: boolean;
    showCode?: boolean;
}

export default function CourseGrid({
    courses,
    loading,
    emptyMessage = "No courses available",
    onCourseClick,
    selectedCourseId,
    showProgress = true,
    showDescription = true,
    showCode = true,
}: CourseGridProps) {
    const { darkMode } = useTheme();

    if (loading) {
        return (
            <div className="text-center py-8">
                <div
                    className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"
                />
                <p className="mt-4" style={{ color: darkMode ? "#94a3b8" : "#64748b" }}>
                    Loading courses...
                </p>
            </div>
        );
    }

    if (courses.length === 0) {
        return (
            <div className="text-center py-8">
                <p style={{ color: darkMode ? "#94a3b8" : "#64748b" }}>
                    {emptyMessage}
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((course) => (
                <button
                    key={course._id}
                    onClick={() => onCourseClick(course)}
                    className={`p-4 rounded-lg text-left transition-all hover:scale-[1.02] hover:shadow-lg ${selectedCourseId && selectedCourseId === course._id
                            ? "ring-2 ring-indigo-500"
                            : ""
                        }`}
                    style={{
                        backgroundColor:
                            selectedCourseId && selectedCourseId === course._id
                                ? darkMode
                                    ? "rgba(99, 102, 241, 0.2)"
                                    : "rgba(99, 102, 241, 0.1)"
                                : darkMode
                                    ? "rgba(30, 41, 59, 0.5)"
                                    : "#ffffff",
                        border: darkMode
                            ? "1px solid rgba(148, 163, 184, 0.1)"
                            : "1px solid rgba(148, 163, 184, 0.2)",
                    }}
                >
                    <div className="flex items-start gap-3">
                        {course.logo && (
                            <img
                                src={course.logo}
                                alt={course.title}
                                className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                            />
                        )}
                        <div className="flex-1 min-w-0">
                            <h3
                                className="font-semibold truncate mb-1"
                                style={{ color: darkMode ? "#ffffff" : "#1e293b" }}
                            >
                                {course.title}
                            </h3>
                            {course.subjectId && typeof course.subjectId === "object" && (
                                <p
                                    className="text-sm truncate mb-2"
                                    style={{ color: darkMode ? "#94a3b8" : "#64748b" }}
                                >
                                    {course.subjectId.name}
                                </p>
                            )}
                            {showCode && course.code && (
                                <span
                                    className="inline-block px-2 py-1 rounded text-xs font-medium mb-2"
                                    style={{
                                        backgroundColor: darkMode ? "rgba(99, 102, 241, 0.2)" : "rgba(99, 102, 241, 0.1)",
                                        color: darkMode ? "#a5b4fc" : "#4f46e5",
                                    }}
                                >
                                    {course.code}
                                </span>
                            )}
                            {showDescription && course.description && (
                                <p
                                    className="text-xs line-clamp-2 mt-2"
                                    style={{ color: darkMode ? "#94a3b8" : "#64748b" }}
                                >
                                    {course.description}
                                </p>
                            )}
                            {showProgress && course.startDate && course.endDate && (
                                <div className="mt-3">
                                    <AttendanceProgressIndicator
                                        startDate={course.startDate}
                                        endDate={course.endDate}
                                        label=""
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </button>
            ))}
        </div>
    );
}
