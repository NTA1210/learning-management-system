import { useTheme } from "../../hooks/useTheme";

interface SkeletonProps {
    width?: string;
    height?: string;
    borderRadius?: string;
    className?: string;
}

export function Skeleton({ width = "100%", height = "20px", borderRadius = "4px", className = "" }: SkeletonProps) {
    const { darkMode } = useTheme();

    return (
        <div
            className={`animate-pulse ${className}`}
            style={{
                width,
                height,
                borderRadius,
                backgroundColor: darkMode ? "rgba(148, 163, 184, 0.2)" : "rgba(148, 163, 184, 0.15)",
            }}
        />
    );
}

interface CourseCardSkeletonProps {
    count?: number;
}

export function CourseCardSkeleton({ count = 6 }: CourseCardSkeletonProps) {
    const { darkMode } = useTheme();

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: count }).map((_, index) => (
                <div
                    key={index}
                    className="p-4 rounded-lg"
                    style={{
                        backgroundColor: darkMode ? "rgba(30, 41, 59, 0.5)" : "#ffffff",
                        border: darkMode
                            ? "1px solid rgba(148, 163, 184, 0.1)"
                            : "1px solid rgba(148, 163, 184, 0.2)",
                    }}
                >
                    <div className="flex items-start gap-3">
                        {/* Logo skeleton */}
                        <Skeleton width="48px" height="48px" borderRadius="8px" className="flex-shrink-0" />

                        <div className="flex-1 space-y-2">
                            {/* Title skeleton */}
                            <Skeleton height="16px" width="70%" />

                            {/* Subject skeleton */}
                            <Skeleton height="14px" width="50%" />

                            {/* Progress bar skeleton */}
                            <div className="mt-3">
                                <Skeleton height="4px" width="100%" borderRadius="2px" />
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

interface AttendanceStatsSkeletonProps { }

export function AttendanceStatsSkeleton({ }: AttendanceStatsSkeletonProps) {
    const { darkMode } = useTheme();

    return (
        <div className="space-y-6">
            {/* Stats Overview Skeleton */}
            <div
                className="p-6 rounded-lg"
                style={{
                    backgroundColor: darkMode ? "rgba(30, 41, 59, 0.5)" : "#ffffff",
                    border: darkMode
                        ? "1px solid rgba(148, 163, 184, 0.1)"
                        : "1px solid rgba(148, 163, 184, 0.2)",
                }}
            >
                <Skeleton height="24px" width="200px" className="mb-4" />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className="space-y-2">
                            <Skeleton height="14px" width="40%" />
                            <Skeleton height="32px" width="60%" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Attendance Form Skeleton */}
            <div
                className="p-6 rounded-lg"
                style={{
                    backgroundColor: darkMode ? "rgba(30, 41, 59, 0.5)" : "#ffffff",
                    border: darkMode
                        ? "1px solid rgba(148, 163, 184, 0.1)"
                        : "1px solid rgba(148, 163, 184, 0.2)",
                }}
            >
                <Skeleton height="24px" width="250px" className="mb-6" />

                <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, index) => (
                        <div key={index} className="flex items-center gap-4">
                            <Skeleton width="40px" height="40px" borderRadius="50%" />
                            <div className="flex-1">
                                <Skeleton height="16px" width="30%" className="mb-2" />
                                <Skeleton height="12px" width="20%" />
                            </div>
                            <Skeleton width="100px" height="36px" borderRadius="8px" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
