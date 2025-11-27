import React from "react";
import { X } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { useTheme } from "../../hooks/useTheme";

interface DistributionItem {
  range: string;
  count: number;
  percentage: string;
}

interface ReportDetail {
  _id: string;
  grade?: number;
  submittedAt?: string;
  studentId?: {
    fullname?: string;
    email?: string;
  };
}

interface SubmissionReport {
  stats?: {
    totalStudents?: number;
    submissionRate?: string;
    onTimeRate?: string;
    averageGrade?: number;
  };
  distribution?: DistributionItem[];
  details?: ReportDetail[];
}

interface AssignmentReportModalProps {
  isOpen: boolean;
  loading: boolean;
  data: SubmissionReport | null;
  onClose: () => void;
  formatDate: (date: string) => string;
}

const COLORS = ["#6366f1", "#14b8a6", "#f97316", "#ec4899", "#10b981", "#8b5cf6"];

const AssignmentReportModal: React.FC<AssignmentReportModalProps> = ({ isOpen, loading, data, onClose, formatDate }) => {
  const { darkMode } = useTheme();

  if (!isOpen) return null;

  const distributionData = Array.isArray(data?.distribution)
    ? data?.distribution.map((item) => ({
        name: item.range,
        value: item.count,
        percentage: item.percentage,
      }))
    : [];

  const summaryStats = [
    { label: "Total Students", value: data?.stats?.totalStudents ?? "N/A" },
    { label: "Submission Rate", value: data?.stats?.submissionRate ?? "N/A" },
    { label: "On-time Rate", value: data?.stats?.onTimeRate ?? "N/A" },
    { label: "Average Grade", value: data?.stats?.averageGrade ?? "N/A" },
  ];

  const recentDetails = Array.isArray(data?.details) ? data.details.slice(0, 5) : [];

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)", zIndex: 9999 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
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
              Submission Report
            </h2>
            <p className="text-sm" style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>
              Doughnut chart with grade distribution and latest submission details
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
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {summaryStats.map((item) => (
                  <div
                    key={item.label}
                    className="p-4 rounded-lg text-center"
                    style={{
                      backgroundColor: darkMode ? "rgba(55, 65, 81, 0.6)" : "#f8fafc",
                      border: darkMode ? "1px solid rgba(75, 85, 99, 0.4)" : "1px solid rgba(229, 231, 235, 0.8)",
                    }}
                  >
                    <p className="text-xs uppercase tracking-wide mb-1" style={{ color: darkMode ? "#cbd5f5" : "#94a3b8" }}>
                      {item.label}
                    </p>
                    <p className="text-xl font-semibold" style={{ color: darkMode ? "#ffffff" : "#111827" }}>
                      {typeof item.value === "number" ? item.value : item.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div
                  className="p-4 rounded-lg"
                  style={{
                    backgroundColor: darkMode ? "rgba(55, 65, 81, 0.6)" : "#f9fafb",
                    border: darkMode ? "1px solid rgba(75, 85, 99, 0.4)" : "1px solid rgba(229, 231, 235, 0.8)",
                  }}
                >
                  <h3 className="text-lg font-semibold mb-4" style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}>
                    Grade Distribution
                  </h3>
                  {distributionData.length ? (
                    <div style={{ width: "100%", height: 260 }}>
                      <ResponsiveContainer>
                        <PieChart>
                          <Pie
                            data={distributionData}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={2}
                          >
                            {distributionData.map((entry, index) => (
                              <Cell key={`cell-${entry.name}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value: number, name: string, props) => [
                              `${value} submissions (${props.payload.percentage})`,
                              name,
                            ]}
                            contentStyle={{
                              backgroundColor: darkMode ? "#1f2937" : "#ffffff",
                              borderColor: darkMode ? "rgba(75, 85, 99, 0.6)" : "#e5e7eb",
                              color: darkMode ? "#f8fafc" : "#111827",
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>No distribution data available.</p>
                  )}

                  <div className="mt-4 space-y-1 text-sm">
                    {distributionData.map((item, index) => (
                      <div key={item.name} className="flex items-center gap-2" style={{ color: darkMode ? "#cbd5f5" : "#475569" }}>
                        <span
                          className="inline-block w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="flex-1">{item.name}</span>
                        <span>{item.percentage}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div
                  className="p-4 rounded-lg"
                  style={{
                    backgroundColor: darkMode ? "rgba(31, 41, 55, 0.7)" : "#ffffff",
                    border: darkMode ? "1px solid rgba(75, 85, 99, 0.4)" : "1px solid rgba(229, 231, 235, 0.8)",
                  }}
                >
                  <h3 className="text-lg font-semibold mb-4" style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}>
                    Recent Submissions
                  </h3>
                  {recentDetails.length ? (
                    <div className="space-y-3">
                      {recentDetails.map((detail) => (
                        <div
                          key={detail._id}
                          className="p-3 rounded border"
                          style={{
                            borderColor: darkMode ? "rgba(75, 85, 99, 0.4)" : "rgba(226, 232, 240, 1)",
                            backgroundColor: darkMode ? "rgba(15, 23, 42, 0.4)" : "#f8fafc",
                          }}
                        >
                          <p className="font-semibold" style={{ color: darkMode ? "#f8fafc" : "#0f172a" }}>
                            {detail.studentId?.fullname || detail.studentId?.email || "Unknown Student"}
                          </p>
                          <p className="text-sm" style={{ color: darkMode ? "#cbd5f5" : "#475569" }}>
                            Grade: <strong>{detail.grade ?? "N/A"}</strong>
                          </p>
                          {detail.submittedAt && (
                            <p className="text-xs" style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>
                              Submitted: {formatDate(detail.submittedAt)}
                            </p>
                          )}
                        </div>
                      ))}
                      {data?.details && data.details.length > recentDetails.length && (
                        <p className="text-xs" style={{ color: darkMode ? "#cbd5f5" : "#475569" }}>
                          +{data.details.length - recentDetails.length} more submissions
                        </p>
                      )}
                    </div>
                  ) : (
                    <p style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>No submission details available.</p>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12" style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>
              No report data available for this assignment.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssignmentReportModal;


