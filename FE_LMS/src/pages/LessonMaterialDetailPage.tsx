import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTheme } from "../hooks/useTheme";
import { useAuth } from "../hooks/useAuth";
import Navbar from "../components/Navbar.tsx";
import Sidebar from "../components/Sidebar.tsx";
import { httpClient } from "../utils/http";
import { ArrowLeft, Download, FileText, Video, Presentation, Link as LinkIcon, File } from "lucide-react";

interface Lesson {
  _id: string;
  title: string;
  content: string;
  order: number;
  durationMinutes: number;
  isPublished: boolean;
  publishedAt?: string;
  courseId: {
    _id: string;
    title: string;
    description?: string;
  };
  createdAt: string;
  updatedAt: string;
  hasAccess: boolean;
  accessReason: string;
}

interface LessonMaterial {
  _id: string;
  lessonId: {
    _id: string;
    title: string;
    courseId: string;
  };
  title: string;
  note?: string;
  originalName?: string;
  mimeType?: string;
  key?: string;
  size?: number;
  uploadedBy: {
    _id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  createdAt: string;
  updatedAt: string;
  signedUrl?: string;
  hasAccess: boolean;
  accessReason: string;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data: LessonMaterial[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

const LessonMaterialDetailPage: React.FC = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const { user } = useAuth();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [materials, setMaterials] = useState<LessonMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [materialsLoading, setMaterialsLoading] = useState(true);
  const [error, setError] = useState("");
  const [materialsError, setMaterialsError] = useState("");

  useEffect(() => {
    if (lessonId) {
      fetchLesson();
      fetchMaterials();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId]);

  const fetchLesson = async () => {
    if (!lessonId) return;
    
    setLoading(true);
    setError("");
    try {
      const response = await httpClient.get(`/lesson/getLessonById/${lessonId}`, {
        withCredentials: true,
      });

      const data = response.data;
      if (data.success && data.data) {
        setLesson(data.data);
      } else {
        setError(data.message || "Failed to load lesson");
      }
    } catch (err) {
      console.error("Error fetching lesson:", err);
      let errorMessage = "An error occurred while fetching lesson";
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

  const fetchMaterials = async () => {
    if (!lessonId) return;
    
    setMaterialsLoading(true);
    setMaterialsError("");
    try {
      const response = await httpClient.get<ApiResponse>(`/lesson-material/byLesson/${lessonId}`, {
        withCredentials: true,
      });

      const data = response.data;
      if (data.success && data.data) {
        setMaterials(data.data);
      } else {
        setMaterialsError(data.message || "Failed to load materials");
      }
    } catch (err) {
      console.error("Error fetching materials:", err);
      let errorMessage = "An error occurred while fetching materials";
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { message?: string } }; message?: string };
        errorMessage = axiosError.response?.data?.message || axiosError.message || errorMessage;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      setMaterialsError(errorMessage);
    } finally {
      setMaterialsLoading(false);
    }
  };

  const handleDownload = async (materialId: string) => {
    try {
      const response = await httpClient.get(`/lesson-material/download/${materialId}`, {
        withCredentials: true,
      });
      
      if (response.data.success && response.data.data.signedUrl) {
        window.open(response.data.data.signedUrl, '_blank');
      }
    } catch (err) {
      console.error("Error downloading material:", err);
      alert("Failed to download material");
    }
  };

  const getFileIcon = (mimeType?: string) => {
    if (!mimeType) return <File size={24} />;
    
    if (mimeType.includes('pdf')) return <FileText size={24} />;
    if (mimeType.includes('video')) return <Video size={24} />;
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return <Presentation size={24} />;
    if (mimeType.includes('link')) return <LinkIcon size={24} />;
    return <File size={24} />;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "Unknown size";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
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

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
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
          <div className="max-w-7xl mx-auto px-4">
            {/* Header */}
            <div className="mb-8">
              <button
                onClick={() => navigate("/materials")}
                className="flex items-center mb-4 text-sm hover:opacity-80 transition-opacity"
                style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}
              >
                <ArrowLeft size={20} className="mr-2" />
                Back to Lessons
              </button>
              
              {/* Lesson Information */}
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
              ) : lesson ? (
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
                      {lesson.courseId.title}
                    </span>
                  </div>
                  <h1
                    className="text-3xl font-bold mb-4"
                    style={{ color: darkMode ? "#ffffff" : "#1f2937" }}
                  >
                    {lesson.title}
                  </h1>
                  {lesson.content && (
                    <p
                      className="text-base mb-4 whitespace-pre-wrap"
                      style={{ color: darkMode ? "#d1d5db" : "#6b7280" }}
                    >
                      {lesson.content}
                    </p>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t" style={{ borderColor: darkMode ? "rgba(75, 85, 99, 0.3)" : "rgba(229, 231, 235, 0.5)" }}>
                    <div className="flex items-center text-sm" style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Duration: {formatDuration(lesson.durationMinutes)}
                    </div>
                    <div className="flex items-center text-sm" style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                      Order: {lesson.order}
                    </div>
                    <div className="flex items-center text-sm" style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>
                      {lesson.hasAccess ? (
                        <span
                          className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded"
                          style={{
                            backgroundColor: darkMode ? "rgba(34, 197, 94, 0.2)" : "rgba(34, 197, 94, 0.1)",
                            color: darkMode ? "#86efac" : "#16a34a",
                          }}
                        >
                          Accessible
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded"
                          style={{
                            backgroundColor: darkMode ? "rgba(239, 68, 68, 0.2)" : "rgba(239, 68, 68, 0.1)",
                            color: darkMode ? "#fca5a5" : "#dc2626",
                          }}
                        >
                          No Access
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}

              <h2
                className="text-2xl font-bold mb-2"
                style={{ color: darkMode ? "#ffffff" : "#1f2937" }}
              >
                Lesson Materials
              </h2>
              <p style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>
                {materials.length} material{materials.length !== 1 ? 's' : ''} available
              </p>
            </div>

            {/* Materials Error Message */}
            {materialsError && (
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
                {materialsError}
              </div>
            )}

            {/* Materials Loading State */}
            {materialsLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: darkMode ? "#6366f1" : "#4f46e5" }}></div>
              </div>
            ) : materials.length === 0 ? (
              <div className="text-center py-12">
                <p style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>
                  No materials available for this lesson.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {materials.map((material) => (
                  <div
                    key={material._id}
                    className="rounded-lg shadow-md overflow-hidden transition-all duration-200 hover:shadow-lg"
                    style={{
                      backgroundColor: darkMode ? "rgba(31, 41, 55, 0.8)" : "rgba(255, 255, 255, 0.9)",
                      border: darkMode ? "1px solid rgba(75, 85, 99, 0.3)" : "1px solid rgba(229, 231, 235, 0.5)",
                    }}
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-3">
                            <div
                              className="p-2 rounded-lg mr-3"
                              style={{
                                backgroundColor: darkMode ? "rgba(99, 102, 241, 0.2)" : "rgba(99, 102, 241, 0.1)",
                                color: darkMode ? "#a5b4fc" : "#6366f1",
                              }}
                            >
                              {getFileIcon(material.mimeType)}
                            </div>
                            <div className="flex-1">
                              <h3
                                className="text-xl font-semibold mb-1"
                                style={{ color: darkMode ? "#ffffff" : "#1f2937" }}
                              >
                                {material.title}
                              </h3>
                              {material.originalName && (
                                <p
                                  className="text-sm mb-2"
                                  style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}
                                >
                                  {material.originalName}
                                </p>
                              )}
                            </div>
                          </div>

                          {material.note && (
                            <p
                              className="text-sm mb-4"
                              style={{ color: darkMode ? "#d1d5db" : "#6b7280" }}
                            >
                              {material.note}
                            </p>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div className="flex items-center text-sm" style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>
                              <span className="font-semibold mr-2">Size:</span>
                              {formatFileSize(material.size)}
                            </div>
                            <div className="flex items-center text-sm" style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>
                              <span className="font-semibold mr-2">Type:</span>
                              {material.mimeType || "N/A"}
                            </div>
                            <div className="flex items-center text-sm" style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>
                              <span className="font-semibold mr-2">Uploaded by:</span>
                              {material.uploadedBy.email}
                            </div>
                            <div className="flex items-center text-sm" style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>
                              <span className="font-semibold mr-2">Created:</span>
                              {formatDate(material.createdAt)}
                            </div>
                          </div>

                          <div className="flex items-center pt-4 border-t" style={{ borderColor: darkMode ? "rgba(75, 85, 99, 0.3)" : "rgba(229, 231, 235, 0.5)" }}>
                            {material.hasAccess ? (
                              <span
                                className="inline-flex items-center px-3 py-1 text-xs font-semibold rounded mr-3"
                                style={{
                                  backgroundColor: darkMode ? "rgba(34, 197, 94, 0.2)" : "rgba(34, 197, 94, 0.1)",
                                  color: darkMode ? "#86efac" : "#16a34a",
                                }}
                              >
                                Accessible ({material.accessReason})
                              </span>
                            ) : (
                              <span
                                className="inline-flex items-center px-3 py-1 text-xs font-semibold rounded mr-3"
                                style={{
                                  backgroundColor: darkMode ? "rgba(239, 68, 68, 0.2)" : "rgba(239, 68, 68, 0.1)",
                                  color: darkMode ? "#fca5a5" : "#dc2626",
                                }}
                              >
                                No Access
                              </span>
                            )}
                          </div>
                        </div>

                        {material.hasAccess && material.signedUrl && (
                          <button
                            onClick={() => handleDownload(material._id)}
                            className="ml-4 px-4 py-2 rounded-lg text-white transition-all duration-200 hover:shadow-lg flex items-center"
                            style={{ backgroundColor: darkMode ? '#059669' : '#10b981' }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = darkMode ? '#047857' : '#059669';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = darkMode ? '#059669' : '#10b981';
                            }}
                          >
                            <Download size={20} className="mr-2" />
                            Download
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default LessonMaterialDetailPage;
