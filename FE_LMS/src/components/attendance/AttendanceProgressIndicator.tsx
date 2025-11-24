import { useTheme } from "../../hooks/useTheme";
import { calculateProgressPercentage, calculateTotalDays } from "../../utils/dateUtils";
import { Calendar } from "lucide-react";

interface AttendanceProgressIndicatorProps {
  startDate: string;
  endDate: string;
  label?: string;
}

export default function AttendanceProgressIndicator({
  startDate,
  endDate,
  label = "Course Progress",
}: AttendanceProgressIndicatorProps) {
  const { darkMode } = useTheme();
  const progress = calculateProgressPercentage(startDate, endDate);
  const totalDays = calculateTotalDays(startDate, endDate);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" style={{ color: darkMode ? "#94a3b8" : "#64748b" }} />
          <span
            className="text-sm font-medium"
            style={{ color: darkMode ? "#e2e8f0" : "#475569" }}
          >
            {label}
          </span>
        </div>
        <span
          className="text-sm font-semibold"
          style={{ color: darkMode ? "#ffffff" : "#1e293b" }}
        >
          {progress}%
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2" style={{ backgroundColor: darkMode ? "rgba(148, 163, 184, 0.2)" : "rgba(148, 163, 184, 0.2)" }}>
        <div
          className="h-2 rounded-full transition-all duration-300"
          style={{
            width: `${progress}%`,
            backgroundColor: progress >= 80 ? "#22c55e" : progress >= 50 ? "#eab308" : "#6366f1",
          }}
        />
      </div>
      <div className="flex items-center justify-between text-xs" style={{ color: darkMode ? "#94a3b8" : "#64748b" }}>
        <span>Total Days: {totalDays}</span>
        <span>
          {new Date(startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} -{" "}
          {new Date(endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </span>
      </div>
    </div>
  );
}

