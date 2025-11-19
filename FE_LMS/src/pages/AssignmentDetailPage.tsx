import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTheme } from "../hooks/useTheme";
import { useAuth } from "../hooks/useAuth";
import Navbar from "../components/Navbar.tsx";
import Sidebar from "../components/Sidebar.tsx";
import { httpClient } from "../utils/http";
import { ArrowLeft, Calendar, User, Award, Clock, FileText } from "lucide-react";

interface Course {
  _id: string;
  title: string;
  code?: string;
}

interface CreatedBy {
  _id: string;
  username: string;
  email: string;
  fullname: string;
}

interface Assignment {
  _id: string;
  courseId: Course;
  title: string;
  description: string;
  createdBy: CreatedBy;
  maxScore: number;
  dueDate: string;
  allowLate: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data: Assignment;
}

const AssignmentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const { user } = useAuth();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (id) {
      fetchAssignment();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchAssignment = async () => {
    if (!id) return;
    
    setLoading(true);
    setError("");
    try {
      const response = await httpClient.get<ApiResponse>(`/assignments/${id}`, {
        withCredentials: true,
      });

      const data = response.data;
      if (data.success && data.data) {
        setAssignment(data.data);
      } else {
        setError(data.message || "Failed to load assignment");
      }
    } catch (err) {
      console.error("Error fetching assignment:", err);
      let errorMessage = "An error occurred while fetching assignment";
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { message?: string } }; message?: string };
        errorMessage = axiosError.response?.data?.message || axiosError.message || errorMessage;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getDueDateStatus = (dueDate: string) => {
    const daysUntilDue = getDaysUntilDue(dueDate);
    if (daysUntilDue < 0) {
      return { text: "Overdue", color: darkMode ? "#fca5a5" : "#dc2626", bg: darkMode ? "rgba(239, 68, 68, 0.2)" : "rgba(239, 68, 68, 0.1)" };
    } else if (daysUntilDue === 0) {
      return { text: "Due today", color: darkMode ? "#fbbf24" : "#d97706", bg: darkMode ? "rgba(251, 191, 36, 0.2)" : "rgba(251, 191, 36, 0.1)" };
    } else if (daysUntilDue <= 3) {
      return { text: `Due in ${daysUntilDue} day${daysUntilDue > 1 ? 's' : ''}`, color: darkMode ? "#fbbf24" : "#d97706", bg: darkMode ? "rgba(251, 191, 36, 0.2)" : "rgba(251, 191, 36, 0.1)" };
    } else {
      return { text: `Due in ${daysUntilDue} days`, color: darkMode ? "#86efac" : "#16a34a", bg: darkMode ? "rgba(34, 197, 94, 0.2)" : "rgba(34, 197, 94, 0.1)" };
    }
  };

  return (
    <div
      className="flex h-screen overflow-hidden relative"
      style={{
        backgroundColor: darkMode ? "#1a202c" : "#f8fafc",
        color: darkMode ? "#ffffff" : "#1e293b",
      }}
    >
      <Navbar />
      <Sidebar role={(user?.role as "admin" | "teacher" | "student") || "student"} />

      <div className="flex flex-col flex-1 w-0 overflow-hidden">
        <main className="flex-1 relative overflow-y-auto focus:outline-none p-4 mt-16 sm:pl-24 md:pl-28">
          <div className="max-w-4xl mx-auto px-4">
            {/* Header */}
            <div className="mb-8">
              <button
                onClick={() => navigate("/assignments")}
                className="flex items-center mb-4 text-sm hover:opacity-80 transition-opacity"
                style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}
              >
                <ArrowLeft size={20} className="mr-2" />
                Back to Assignments
              </button>
              
              {/* Assignment Information */}
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: darkMode ? "#6366f1" : "#4f46e5" }}></div>
                </div>
              ) : error ? (
                <div
                  className="p-4 rounded-lg mb-6 flex items-center"
                  style={{
                    backgroundColor: darkMode ? 'rgba(239, 68, 68, 0.1)' : '#fee2e2',
                    color: darkMode ? '#fca5a5' : '#dc2626'
                  }}
                >
                  <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              ) : assignment ? (
                <div
                  className="rounded-lg shadow-md overflow-hidden mb-6 p-6"
                  style={{
                    backgroundColor: darkMode ? "rgba(31, 41, 55, 0.8)" : "rgba(255, 255, 255, 0.9)",
                    border: darkMode ? "1px solid rgba(75, 85, 99, 0.3)" : "1px solid rgba(229, 231, 235, 0.5)",
                  }}
                >
                  <div className="mb-3">
                    <span
                      className="inline-block px-3 py-1 text-xs font-semibold rounded-full"
                      style={{
                        backgroundColor: darkMode ? "rgba(99, 102, 241, 0.2)" : "rgba(99, 102, 241, 0.1)",
                        color: darkMode ? "#a5b4fc" : "#6366f1",
                      }}
                    >
                      {assignment.courseId.title}
                    </span>
                  </div>
                  <h1
                    className="text-3xl font-bold mb-4"
                    style={{ color: darkMode ? "#ffffff" : "#1f2937" }}
                  >
                    {assignment.title}
                  </h1>
                  {assignment.description && (
                    <div className="mb-6">
                      <div className="flex items-center mb-2">
                        <FileText className="w-5 h-5 mr-2" style={{ color: darkMode ? "#9ca3af" : "#6b7280" }} />
                        <h2 className="text-lg font-semibold" style={{ color: darkMode ? "#ffffff" : "#1f2937" }}>
                          Description
                        </h2>
                      </div>
                      <p
                        className="text-base whitespace-pre-wrap break-words"
                        style={{ color: darkMode ? "#d1d5db" : "#6b7280" }}
                      >
                        {assignment.description}
                      </p>
                    </div>
                  )}
                  
                  {/* Assignment Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t mb-4" style={{ borderColor: darkMode ? "rgba(75, 85, 99, 0.3)" : "rgba(229, 231, 235, 0.5)" }}>
                    <div className="flex items-center text-sm" style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>
                      <Award className="w-5 h-5 mr-3 flex-shrink-0" />
                      <div>
                        <span className="font-semibold block">Max Score</span>
                        <span>{assignment.maxScore} points</span>
                      </div>
                    </div>
                    <div className="flex items-center text-sm" style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>
                      <Calendar className="w-5 h-5 mr-3 flex-shrink-0" />
                      <div>
                        <span className="font-semibold block">Due Date</span>
                        <span>{formatDate(assignment.dueDate)}</span>
                      </div>
                    </div>
                    <div className="flex items-center text-sm" style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>
                      <User className="w-5 h-5 mr-3 flex-shrink-0" />
                      <div>
                        <span className="font-semibold block">Created By</span>
                        <span>{assignment.createdBy.fullname || assignment.createdBy.username}</span>
                      </div>
                    </div>
                    <div className="flex items-center text-sm" style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>
                      <Clock className="w-5 h-5 mr-3 flex-shrink-0" />
                      <div>
                        <span className="font-semibold block">Late Submissions</span>
                        <span>{assignment.allowLate ? "Allowed" : "Not Allowed"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status and Actions */}
                  <div className="flex items-center justify-between pt-4 border-t gap-4" style={{ borderColor: darkMode ? "rgba(75, 85, 99, 0.3)" : "rgba(229, 231, 235, 0.5)" }}>
                    <span
                      className="inline-flex items-center px-3 py-2 text-sm font-semibold rounded whitespace-nowrap"
                      style={{
                        backgroundColor: getDueDateStatus(assignment.dueDate).bg,
                        color: getDueDateStatus(assignment.dueDate).color,
                      }}
                    >
                      {getDueDateStatus(assignment.dueDate).text}
                    </span>
                    <div className="text-xs" style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>
                      Created: {formatDate(assignment.createdAt)}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AssignmentDetailPage;

