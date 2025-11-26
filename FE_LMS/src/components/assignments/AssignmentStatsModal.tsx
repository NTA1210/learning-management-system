import React from "react";
import { X } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { useTheme } from "../../hooks/useTheme";

interface AssignmentStats {
  totalStudents?: number;
  submissionRate?: string | number;
  onTimeRate?: string | number;
  averageGrade?: number;
}

interface AssignmentStatsModalProps {
  isOpen: boolean;
  loading: boolean;
  data: AssignmentStats | null;
  onClose: () => void;
}

const parsePercentage = (value?: string | number) => {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const num = parseFloat(value.replace("%", ""));
    return Number.isFinite(num) ? num : 0;
  }
  return 0;
};

const AssignmentStatsModal: React.FC<AssignmentStatsModalProps> = ({ isOpen, loading, data, onClose }) => {
  const { darkMode } = useTheme();

  if (!isOpen) return null;

  const chartData = [
    { label: "Total Students", value: data?.totalStudents ?? 0 },
    { label: "Submission Rate", value: parsePercentage(data?.submissionRate) },
    { label: "On-time Rate", value: parsePercentage(data?.onTimeRate) },
    { label: "Average Grade", value: data?.averageGrade ?? 0 },
  ];

  const summaryItems = [
    { label: "Total Students", value: data?.totalStudents ?? 0 },
    { label: "Submission Rate", value: data?.submissionRate ?? "N/A" },
    { label: "On-time Rate", value: data?.onTimeRate ?? "N/A" },
    { label: "Average Grade", value: data?.averageGrade ?? "N/A" },
  ];

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)", zIndex: 9999 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
        style={{
          backgroundColor: darkMode ? "rgba(31, 41, 55, 0.95)" : "#ffffff",
          border: darkMode ? "1px solid rgba(75, 85, 99, 0.4)" : "1px solid rgba(229, 231, 235, 0.8)",
        }}
      >
        <div
          className="flex items-center justify-between p-6 border-b"
          style={{ borderColor: darkMode ? "rgba(75, 85, 99, 0.4)" : "rgba(229, 231, 235, 0.8)" }}
        >
          <div>
            <h2 className="text-xl font-semibold" style={{ color: darkMode ? "#ffffff" : "#1f2937" }}>
              Submission Statistics
            </h2>
            <p className="text-sm" style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>
              Bar chart summary based on the latest submissions
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded hover:bg-black/10"
            style={{ color: darkMode ? "#f3f4f6" : "#1f2937" }}
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div
                className="animate-spin rounded-full h-10 w-10 border-b-2"
                style={{ borderColor: darkMode ? "#6366f1" : "#4f46e5" }}
              />
            </div>
          ) : data ? (
            <>
              <div className="grid grid-cols-2 gap-4 mb-6">
                {summaryItems.map((item) => (
                  <div
                    key={item.label}
                    className="p-4 rounded-lg"
                    style={{
                      backgroundColor: darkMode ? "rgba(55, 65, 81, 0.6)" : "#f8fafc",
                      border: darkMode ? "1px solid rgba(75, 85, 99, 0.4)" : "1px solid rgba(229, 231, 235, 0.8)",
                    }}
                  >
                    <p className="text-sm mb-1" style={{ color: darkMode ? "#cbd5f5" : "#6b7280" }}>
                      {item.label}
                    </p>
                    <p className="text-2xl font-semibold" style={{ color: darkMode ? "#ffffff" : "#111827" }}>
                      {typeof item.value === "number" ? item.value : item.value}
                    </p>
                  </div>
                ))}
              </div>

              <div style={{ width: "100%", height: 320 }}>
                <ResponsiveContainer>
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "rgba(148, 163, 184, 0.2)" : "#e5e7eb"} />
                    <XAxis dataKey="label" tick={{ fill: darkMode ? "#e2e8f0" : "#475569" }} interval={0} angle={-15} textAnchor="end" height={60} />
                    <YAxis tick={{ fill: darkMode ? "#e2e8f0" : "#475569" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: darkMode ? "#1f2937" : "#ffffff",
                        borderColor: darkMode ? "rgba(75, 85, 99, 0.6)" : "#e5e7eb",
                        color: darkMode ? "#f8fafc" : "#111827",
                      }}
                    />
                    <Bar dataKey="value" fill={darkMode ? "#c084fc" : "#6366f1"} radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            <div className="text-center py-12" style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>
              No statistics available for this assignment.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssignmentStatsModal;


