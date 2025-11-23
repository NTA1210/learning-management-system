import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTheme } from "../hooks/useTheme";
import { useAuth } from "../hooks/useAuth";
import Navbar from "../components/Navbar.tsx";
import Sidebar from "../components/Sidebar.tsx";
import { 
  SubmissionModal, 
  ViewSubmissionModal, 
  AllSubmissionsModal, 
  GradeSubmissionModal 
} from "../components";
import { httpClient } from "../utils/http";
import { ArrowLeft, Calendar, User, Award, Clock, FileText, Upload, Eye } from "lucide-react";

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
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [showViewSubmissionModal, setShowViewSubmissionModal] = useState(false);
  const [showAllSubmissionsModal, setShowAllSubmissionsModal] = useState(false);
  const [allSubmissions, setAllSubmissions] = useState<Array<{
    _id: string;
    studentId: { fullname?: string; email: string };
    originalName?: string;
    size?: number;
    submittedAt?: string;
    isLate?: boolean;
    status?: string;
    grade?: number;
    feedback?: string;
    key?: string;
  }>>([]);
  const [loadingAllSubmissions, setLoadingAllSubmissions] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<{ 
    status: string; 
    message?: string;
    isLate?: boolean;
    grade?: number;
    feedback?: string;
    submittedAt?: string;
  } | null>(null);
  const [submissionDetails, setSubmissionDetails] = useState<{
    status: string;
    isLate?: boolean;
    grade?: number;
    feedback?: string;
    submittedAt?: string;
  } | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingSubmission, setLoadingSubmission] = useState(false);
  const [gradingSubmission, setGradingSubmission] = useState<{ _id: string; grade?: number; feedback?: string } | null>(null);
  const [gradingGrade, setGradingGrade] = useState<string>("");
  const [gradingFeedback, setGradingFeedback] = useState<string>("");
  const [grading, setGrading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Utility function to scrub URLs from messages
  const scrubMessage = (message: string): string => {
    if (!message) return "";
    // Remove URLs (http://, https://, localhost, etc.)
    return message
      .replace(/https?:\/\/[^\s]+/gi, "")
      .replace(/localhost[^\s]*/gi, "")
      .replace(/[^\s]+\.(com|net|org|edu|io|dev)[^\s]*/gi, "")
      .trim()
      .replace(/\s+/g, " ");
  };

  const showSwalError = async (message: string) => {
    try {
      const Swal = (await import("sweetalert2")).default;
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: scrubMessage(message),
        confirmButtonColor: darkMode ? "#4c1d95" : "#4f46e5",
        background: darkMode ? "#1f2937" : "#ffffff",
        color: darkMode ? "#ffffff" : "#1e293b",
        didOpen: () => {
          const swalContainer = document.querySelector(".swal2-container") as HTMLElement;
          const swalBackdrop = document.querySelector(".swal2-backdrop-show") as HTMLElement;
          if (swalContainer) swalContainer.style.zIndex = "99999";
          if (swalBackdrop) swalBackdrop.style.zIndex = "99998";
        },
      });
    } catch {
      alert(scrubMessage(message));
    }
  };

  const showSwalSuccess = async (message: string) => {
    try {
      const Swal = (await import("sweetalert2")).default;
      await Swal.fire({
        icon: "success",
        title: "Success",
        text: scrubMessage(message),
        confirmButtonColor: darkMode ? "#4c1d95" : "#4f46e5",
        background: darkMode ? "#1f2937" : "#ffffff",
        color: darkMode ? "#ffffff" : "#1e293b",
        didOpen: () => {
          const swalContainer = document.querySelector(".swal2-container") as HTMLElement;
          const swalBackdrop = document.querySelector(".swal2-backdrop-show") as HTMLElement;
          if (swalContainer) swalContainer.style.zIndex = "99999";
          if (swalBackdrop) swalBackdrop.style.zIndex = "99998";
        },
      });
    } catch {
      alert(scrubMessage(message));
    }
  };

  useEffect(() => {
    if (id) {
      fetchAssignment();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    // Debug: Log user và role
    console.log("AssignmentDetailPage - User:", user);
    console.log("AssignmentDetailPage - User role:", user?.role);
    
    if (assignment?._id && user?.role?.toLowerCase() === "student") {
      fetchSubmissionStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignment?._id, user?.role]);

  const fetchSubmissionStatus = async () => {
    if (!assignment?._id) return;
    try {
      const response = await httpClient.get(`/submissions/${assignment._id}/status`, {
        withCredentials: true,
      });
      if (response.data?.success) {
        setSubmissionStatus(response.data.data);
        // Nếu đã có submission, lưu thông tin chi tiết
        if (response.data.data.status !== "not_submitted") {
          setSubmissionDetails(response.data.data);
        }
      }
    } catch (error) {
      console.error("Error fetching submission status:", error);
      // Nếu lỗi là "Student not found", có thể user không phải là student
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as { response?: { data?: { message?: string } } };
        const errorMessage = axiosError.response?.data?.message || "";
        if (errorMessage.includes("Student not found") || errorMessage.includes("Missing user ID")) {
          console.warn("User may not be a student or authentication issue");
        }
      }
    }
  };

  const handleViewSubmission = async () => {
    if (!assignment?._id) return;
    setLoadingSubmission(true);
    try {
      const response = await httpClient.get(`/submissions/${assignment._id}/status`, {
        withCredentials: true,
      });
      if (response.data?.success && response.data.data.status !== "not_submitted") {
        setSubmissionDetails(response.data.data);
        setShowViewSubmissionModal(true);
      } else {
        await showSwalError("You haven't submitted this assignment yet.");
      }
    } catch (error) {
      console.error("Error fetching submission:", error);
      let errorMessage = "Failed to load submission";
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as { response?: { data?: { message?: string } }; message?: string };
        errorMessage = axiosError.response?.data?.message || axiosError.message || errorMessage;
      }
      await showSwalError(errorMessage);
    } finally {
      setLoadingSubmission(false);
    }
  };

  const handleViewAllSubmissions = async () => {
    if (!assignment?._id) {
      console.error("Assignment ID is missing");
      return;
    }
    console.log("handleViewAllSubmissions called for assignment:", assignment._id);
    setLoadingAllSubmissions(true);
    setShowAllSubmissionsModal(true);
    try {
      console.log("Fetching submissions from:", `/submissions/${assignment._id}/all`);
      const response = await httpClient.get(`/submissions/${assignment._id}/all`, {
        withCredentials: true,
      });
      console.log("Submissions response:", response.data);
      if (response.data?.success) {
        const submissions = Array.isArray(response.data.data) ? response.data.data : [];
        console.log("Setting submissions:", submissions.length);
        setAllSubmissions(submissions);
      } else {
        console.warn("Response success is false:", response.data);
        setAllSubmissions([]);
      }
    } catch (error) {
      console.error("Error fetching all submissions:", error);
      let errorMessage = "Failed to load submissions";
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as { response?: { data?: { message?: string } }; message?: string };
        errorMessage = axiosError.response?.data?.message || axiosError.message || errorMessage;
        console.error("Error details:", axiosError.response?.data);
      }
      await showSwalError(errorMessage);
      setAllSubmissions([]);
    } finally {
      setLoadingAllSubmissions(false);
    }
  };

  const handleDownloadSubmission = async (submissionId: string) => {
    try {
      const response = await httpClient.get(`/submissions/by-submission/${submissionId}/download`, {
        withCredentials: true,
      });
      if (response.data?.success && response.data.data?.signedUrl) {
        // Mở signed URL trong tab mới để download
        window.open(response.data.data.signedUrl, "_blank");
      } else {
        await showSwalError("Failed to get download URL");
      }
    } catch (error) {
      console.error("Error downloading submission:", error);
      let errorMessage = "Failed to download file";
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as { response?: { data?: { message?: string } }; message?: string };
        errorMessage = axiosError.response?.data?.message || axiosError.message || errorMessage;
      }
      await showSwalError(errorMessage);
    }
  };

  const handleGradeSubmission = async (submissionId: string) => {
    if (!gradingGrade || gradingGrade === "") {
      await showSwalError("Please enter a grade");
      return;
    }

    const grade = parseFloat(gradingGrade);
    if (isNaN(grade) || grade < 0) {
      await showSwalError("Please enter a valid grade (>= 0)");
      return;
    }

    if (assignment && grade > assignment.maxScore) {
      await showSwalError(`Grade cannot exceed maximum score of ${assignment.maxScore}`);
      return;
    }

    setGrading(true);
    try {
      await httpClient.put(`/submissions/by-submission/${submissionId}/grade`, {
        grade,
        feedback: gradingFeedback || undefined,
      }, {
        withCredentials: true,
      });

      await showSwalSuccess("Submission graded successfully!");
      setGradingSubmission(null);
      setGradingGrade("");
      setGradingFeedback("");
      // Refresh submissions list
      await handleViewAllSubmissions();
    } catch (error) {
      console.error("Error grading submission:", error);
      let errorMessage = "Failed to grade submission";
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as { response?: { data?: { message?: string } }; message?: string };
        errorMessage = axiosError.response?.data?.message || axiosError.message || errorMessage;
      }
      await showSwalError(errorMessage);
    } finally {
      setGrading(false);
    }
  };

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

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Kiểm tra kích thước file (5MB = 5 * 1024 * 1024 bytes)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        await showSwalError(`File size exceeds the maximum limit of 5MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB.`);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }
      setSelectedFile(file);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmitAssignment = async () => {
    if (!selectedFile || !assignment?._id) {
      await showSwalError("Please select a file to submit.");
      return;
    }

    // Debug: Kiểm tra user object
    console.log("User object:", user);
    console.log("User role:", user?.role);
    console.log("User role type:", typeof user?.role);

    // Kiểm tra user có tồn tại không
    if (!user) {
      await showSwalError("You must be logged in to submit assignments. Please log in and try again.");
      return;
    }

    // Kiểm tra role của user (normalize để đảm bảo case-insensitive)
    const userRole = user.role?.toLowerCase();
    if (userRole !== "student") {
      console.error("User role mismatch:", { expected: "student", actual: userRole, raw: user.role });
      await showSwalError(`Only students can submit assignments. Your current role is: ${user.role || "unknown"}. Please contact an administrator if you believe this is an error.`);
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("assignmentId", assignment._id);

      // Kiểm tra nếu đã nộp bài thì dùng PUT (resubmit), nếu chưa thì dùng POST
      const isResubmit = submissionStatus?.status && submissionStatus.status !== "not_submitted";
      const method = isResubmit ? "put" : "post";

      const response = await httpClient[method]("/submissions", formData, {
        withCredentials: true,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data?.success) {
        await showSwalSuccess(isResubmit ? "Assignment resubmitted successfully!" : "Assignment submitted successfully!");
        setShowSubmissionModal(false);
        setSelectedFile(null);
        clearFile();
        await fetchSubmissionStatus();
      } else {
        throw new Error(response.data?.message || "Failed to submit assignment");
      }
    } catch (error) {
      console.error("Error submitting assignment:", error);
      let errorMessage = "Failed to submit assignment";
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as { response?: { data?: { message?: string } }; message?: string };
        errorMessage = axiosError.response?.data?.message || axiosError.message || errorMessage;
        
        // Thông báo lỗi cụ thể hơn
        if (errorMessage.includes("Student not found") || errorMessage.includes("Missing user ID")) {
          errorMessage = "You must be logged in as a student to submit assignments. Please check your account role.";
        } else if (errorMessage.includes("deadline has expired")) {
          errorMessage = "The submission deadline has expired. Late submissions are not allowed.";
        } else if (errorMessage.includes("already submitted")) {
          errorMessage = "You have already submitted this assignment. Resubmission is not allowed.";
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      await showSwalError(errorMessage);
    } finally {
      setSubmitting(false);
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
                  <div className="flex items-start justify-between mb-3">
                    <span
                      className="inline-block px-3 py-1 text-xs font-semibold rounded-full"
                      style={{
                        backgroundColor: darkMode ? "rgba(99, 102, 241, 0.2)" : "rgba(99, 102, 241, 0.1)",
                        color: darkMode ? "#a5b4fc" : "#6366f1",
                      }}
                    >
                      {assignment.courseId.title}
                    </span>
                    <div className="flex items-center gap-2">
                      {user?.role?.toLowerCase() === "student" && submissionStatus?.status && submissionStatus.status !== "not_submitted" && (
                        <button
                          onClick={handleViewSubmission}
                          disabled={loadingSubmission}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{
                            backgroundColor: darkMode ? "rgba(34, 197, 94, 0.2)" : "#10b981",
                            color: darkMode ? "#86efac" : "#ffffff",
                          }}
                          onMouseEnter={(e) => {
                            if (!loadingSubmission) {
                              e.currentTarget.style.backgroundColor = darkMode ? "rgba(34, 197, 94, 0.3)" : "#059669";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!loadingSubmission) {
                              e.currentTarget.style.backgroundColor = darkMode ? "rgba(34, 197, 94, 0.2)" : "#10b981";
                            }
                          }}
                        >
                          <Eye size={16} />
                          {loadingSubmission ? "Loading..." : "View Submit"}
                        </button>
                      )}
                      <button
                        onClick={async () => {
                          const userRole = user?.role?.toLowerCase();
                          console.log("Button clicked - User role:", userRole);
                          if (userRole === "admin" || userRole === "teacher") {
                            // Teacher/Admin: mở modal để xem danh sách tất cả submissions
                            console.log("Opening all submissions modal for teacher/admin");
                            await handleViewAllSubmissions();
                          } else if (userRole === "student") {
                            // Student: mở modal để nộp bài
                            setShowSubmissionModal(true);
                          } else {
                            await showSwalError(`Please log in to access assignments. Your current role is: ${user?.role || "unknown"}.`);
                          }
                        }}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105 hover:shadow-md"
                        style={{
                          backgroundColor: darkMode ? "rgba(99, 102, 241, 0.2)" : "#4f46e5",
                          color: darkMode ? "#a5b4fc" : "#ffffff",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = darkMode ? "rgba(99, 102, 241, 0.3)" : "#4338ca";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = darkMode ? "rgba(99, 102, 241, 0.2)" : "#4f46e5";
                        }}
                      >
                        {user?.role?.toLowerCase() === "admin" || user?.role?.toLowerCase() === "teacher" ? (
                          <>
                            <Eye size={16} />
                            View Submit
                          </>
                        ) : (
                          <>
                            <Upload size={16} />
                            {submissionStatus?.status && submissionStatus.status !== "not_submitted" ? "Resubmit" : "Submit"}
                          </>
                        )}
                      </button>
                    </div>
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

      {/* Submission Modal */}
      <SubmissionModal
        isOpen={showSubmissionModal}
        isResubmit={submissionStatus?.status !== undefined && submissionStatus.status !== "not_submitted"}
        selectedFile={selectedFile}
        submitting={submitting}
        onClose={() => {
          setShowSubmissionModal(false);
          clearFile();
        }}
        onFileChange={handleFileChange}
        onSubmit={handleSubmitAssignment}
        onClearFile={clearFile}
      />

      {/* View Submission Modal */}
      {submissionDetails && (
        <ViewSubmissionModal
          isOpen={showViewSubmissionModal}
          submissionDetails={submissionDetails}
          assignment={assignment}
          onClose={() => setShowViewSubmissionModal(false)}
          onResubmit={() => {
            setShowViewSubmissionModal(false);
            setShowSubmissionModal(true);
          }}
          formatDate={formatDate}
        />
      )}

      {/* All Submissions Modal (for Teacher/Admin) */}
      <AllSubmissionsModal
        isOpen={showAllSubmissionsModal}
        submissions={allSubmissions}
        assignment={assignment}
        loading={loadingAllSubmissions}
        onClose={() => setShowAllSubmissionsModal(false)}
        onDownload={handleDownloadSubmission}
        onGrade={(submission) => {
          setGradingSubmission(submission);
          setGradingGrade(submission.grade?.toString() || "");
          setGradingFeedback(submission.feedback || "");
        }}
        formatDate={formatDate}
      />

      {/* Grade Submission Modal */}
      <GradeSubmissionModal
        isOpen={!!gradingSubmission}
        maxScore={assignment?.maxScore || 10}
        grading={grading}
        grade={gradingGrade}
        feedback={gradingFeedback}
        onClose={() => {
          setGradingSubmission(null);
          setGradingGrade("");
          setGradingFeedback("");
        }}
        onGradeChange={setGradingGrade}
        onFeedbackChange={setGradingFeedback}
        onSubmit={() => gradingSubmission && handleGradeSubmission(gradingSubmission._id)}
      />
    </div>
  );
};

export default AssignmentDetailPage;

