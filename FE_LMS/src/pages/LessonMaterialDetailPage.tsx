import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTheme } from "../hooks/useTheme";
import { useAuth } from "../hooks/useAuth";
import Navbar from "../components/Navbar.tsx";
import Sidebar from "../components/Sidebar.tsx";
import { httpClient } from "../utils/http";
import { ArrowLeft, Download, FileText, Video, Presentation, Link as LinkIcon, File, Eye, X, Minimize2, Maximize2, GripVertical } from "lucide-react";

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
  const [selectedMaterial, setSelectedMaterial] = useState<LessonMaterial | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [viewerObjectUrl, setViewerObjectUrl] = useState<string | null>(null);
  const [viewerLoading, setViewerLoading] = useState<boolean>(false);
  const [viewerMinimized, setViewerMinimized] = useState<boolean>(false);
  const [popupSize, setPopupSize] = useState({ width: 0, height: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });

  const showSwalError = async (message: string) => {
    try {
      const Swal = (await import("sweetalert2")).default;
      await Swal.fire({
        icon: "error",
        title: "Oops...",
        text: message,
        confirmButtonColor: "#4f46e5",
      });
    } catch {
      alert(message);
    }
  };

  useEffect(() => {
    if (lessonId) {
      fetchLesson();
      fetchMaterials();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId]);

  // Close modal on ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isViewerOpen && !viewerMinimized) {
        closeViewer();
      }
    };

    if (isViewerOpen && !viewerMinimized) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isViewerOpen, viewerMinimized]);

  // Initialize popup size when opened
  useEffect(() => {
    if (isViewerOpen && !viewerMinimized && popupSize.width === 0) {
      // Set default size (90% of viewport)
      setPopupSize({
        width: window.innerWidth * 0.9,
        height: window.innerHeight * 0.9,
      });
    }
  }, [isViewerOpen, viewerMinimized, popupSize.width]);

  // Handle resize
  useEffect(() => {
    if (!isResizing) {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      return;
    }

    // Disable text selection and set cursor during resize
    document.body.style.cursor = 'nwse-resize';
    document.body.style.userSelect = 'none';

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      const deltaX = e.clientX - resizeStart.x;
      const deltaY = e.clientY - resizeStart.y;
      
      const newWidth = Math.max(600, Math.min(window.innerWidth - 40, resizeStart.width + deltaX));
      const newHeight = Math.max(400, Math.min(window.innerHeight - 40, resizeStart.height + deltaY));
      
      setPopupSize({ width: newWidth, height: newHeight });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, resizeStart]);

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
      await showSwalError("Failed to download material");
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

  const handleView = async (material: LessonMaterial) => {
    if (!material.hasAccess) {
      await showSwalError("You don't have access to view this material");
      return;
    }

    setViewerLoading(true);
    setIsViewerOpen(true);
    setViewerMinimized(false);

    try {
      // Ensure we have a signed URL
      let signedUrl = material.signedUrl;
      if (!signedUrl) {
        const response = await httpClient.get(`/lesson-material/download/${material._id}`, {
          withCredentials: true,
        });
        if (response.data?.success && response.data?.data?.signedUrl) {
          signedUrl = response.data.data.signedUrl;
        } else {
          throw new Error("No signed URL returned");
        }
      }

      // For Office docs we will use Google Docs viewer with direct signed URL (cannot use blob URL)
      const mimeType = (material.mimeType || "").toLowerCase();
      const isOfficeDoc =
        mimeType.includes("word") ||
        mimeType.includes("excel") ||
        mimeType.includes("powerpoint") ||
        mimeType.includes("presentation") ||
        mimeType.includes("spreadsheet") ||
        !!material.originalName?.match(/\.(doc|docx|xls|xlsx|ppt|pptx)$/i);

      setSelectedMaterial({ ...material, signedUrl });

      if (isOfficeDoc) {
        // No need to create blob URL for Office docs
        setViewerObjectUrl(null);
      } else {
        // Fetch as blob to avoid download disposition and create an object URL
        const res = await fetch(signedUrl);
        if (!res.ok) {
          throw new Error(`Failed to fetch file: ${res.status}`);
        }
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        // Cleanup existing URL if any
        if (viewerObjectUrl) {
          URL.revokeObjectURL(viewerObjectUrl);
        }
        setViewerObjectUrl(url);
      }
    } catch (err) {
      console.error("Error preparing material for viewing:", err);
      await showSwalError("Failed to load material for viewing");
      setIsViewerOpen(false);
      setSelectedMaterial(null);
    } finally {
      setViewerLoading(false);
    }
  };

  const closeViewer = () => {
    setIsViewerOpen(false);
    setSelectedMaterial(null);
    setViewerMinimized(false);
    setPopupSize({ width: 0, height: 0 });
    if (viewerObjectUrl) {
      URL.revokeObjectURL(viewerObjectUrl);
      setViewerObjectUrl(null);
    }
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: popupSize.width || window.innerWidth * 0.9,
      height: popupSize.height || window.innerHeight * 0.9,
    });
  };

  const getViewerContent = (material: LessonMaterial) => {
    if (viewerLoading) {
      return (
        <div className="flex items-center justify-center p-10">
          <div
            className="animate-spin rounded-full h-10 w-10 border-b-2"
            style={{ borderColor: darkMode ? "#a5b4fc" : "#4f46e5" }}
          />
        </div>
      );
    }

    // If still no URL at this point
    if (!material.signedUrl && !viewerObjectUrl) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-8" style={{ minHeight: '500px' }}>
          <FileText size={64} style={{ color: darkMode ? '#9ca3af' : '#6b7280', marginBottom: '1rem' }} />
          <p style={{ color: darkMode ? '#d1d5db' : '#6b7280', marginBottom: '1rem' }}>
            No preview available for this material.
          </p>
        </div>
      );
    }

    const mimeType = material.mimeType?.toLowerCase() || '';
    
    // PDF files
    if (mimeType.includes('pdf')) {
      return (
        <iframe
          src={viewerObjectUrl || material.signedUrl!}
          className="w-full border-0"
          title={material.title || 'PDF Viewer'}
          style={{ 
            height: 'calc(100vh - 200px)',
            minHeight: '600px',
            width: '100%'
          }}
        />
      );
    }
    
    // Images
    if (mimeType.startsWith('image/')) {
      return (
        <div className="flex items-center justify-center p-4" style={{ minHeight: 'calc(100vh - 200px)' }}>
          <img
            src={viewerObjectUrl || material.signedUrl!}
            alt={material.title || 'Image'}
            className="max-w-full max-h-full object-contain"
            style={{ 
              maxHeight: 'calc(100vh - 200px)',
              maxWidth: '100%'
            }}
          />
        </div>
      );
    }
    
    // Videos
    if (mimeType.startsWith('video/')) {
      return (
        <div className="flex items-center justify-center p-4" style={{ minHeight: 'calc(100vh - 200px)' }}>
          <video
            src={viewerObjectUrl || material.signedUrl!}
            controls
            className="max-w-full max-h-full"
            style={{ 
              maxHeight: 'calc(100vh - 200px)',
              maxWidth: '100%'
            }}
          >
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }
    
    // Text files
    if (mimeType.startsWith('text/')) {
      return (
        <iframe
          src={viewerObjectUrl || material.signedUrl!}
          className="w-full border-0"
          title={material.title || 'Text Viewer'}
          style={{ 
            height: 'calc(100vh - 200px)',
            minHeight: '600px',
            width: '100%'
          }}
        />
      );
    }
    
    // Office documents - use Google Docs Viewer
    if (
      mimeType.includes('word') ||
      mimeType.includes('excel') ||
      mimeType.includes('powerpoint') ||
      mimeType.includes('presentation') ||
      mimeType.includes('spreadsheet') ||
      material.originalName?.match(/\.(doc|docx|xls|xlsx|ppt|pptx)$/i)
    ) {
      const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(material.signedUrl!)}&embedded=true`;
      return (
        <iframe
          src={viewerUrl}
          className="w-full border-0"
          title={material.title || 'Document Viewer'}
          style={{ 
            height: 'calc(100vh - 200px)',
            minHeight: '600px',
            width: '100%'
          }}
        />
      );
    }
    
    // Default: try to embed or show download link
    return (
      <div className="flex flex-col items-center justify-center p-8" style={{ minHeight: 'calc(100vh - 200px)' }}>
        <FileText size={64} style={{ color: darkMode ? '#9ca3af' : '#6b7280', marginBottom: '1rem' }} />
        <p 
          className="text-center mb-4"
          style={{ color: darkMode ? '#d1d5db' : '#6b7280' }}
        >
          This file type cannot be previewed directly.
        </p>
        <p 
          className="text-center text-sm mb-4"
          style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}
        >
          Please download the file to view it.
        </p>
        <button
          onClick={() => handleDownload(material._id)}
          className="px-4 py-2 rounded-lg text-white transition-all duration-200 hover:shadow-lg flex items-center"
          style={{ backgroundColor: darkMode ? '#059669' : '#10b981' }}
        >
          <Download size={20} className="mr-2" />
          Download to view
        </button>
      </div>
    );
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

      <div
        className="flex flex-col flex-1 w-0 overflow-hidden"
        style={{
          filter: isViewerOpen && !viewerMinimized ? 'blur(2px)' : 'none',
          transition: 'filter 120ms ease',
        }}
      >
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

                        {material.hasAccess && (
                          <div className="ml-4 flex items-center gap-2">
                            <button
                              onClick={() => handleView(material)}
                              className="px-4 py-2 rounded-lg transition-all duration-200 hover:shadow-lg flex items-center"
                              style={{
                                backgroundColor: darkMode ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.1)',
                                color: darkMode ? '#a5b4fc' : '#4f46e5',
                                border: darkMode ? '1px solid rgba(99, 102, 241, 0.35)' : '1px solid rgba(79, 70, 229, 0.25)',
                              }}
                            >
                              <Eye size={18} className="mr-2" />
                              View
                            </button>
                            <button
                              onClick={() => handleDownload(material._id)}
                              className="px-4 py-2 rounded-lg text-white transition-all duration-200 hover:shadow-lg flex items-center"
                              style={{ backgroundColor: darkMode ? '#059669' : '#10b981' }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = darkMode ? '#047857' : '#059669';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = darkMode ? '#059669' : '#10b981';
                              }}
                            >
                              <Download size={18} className="mr-2" />
                              Download
                            </button>
                          </div>
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

      {/* Material Viewer Modal */}
      {isViewerOpen && !viewerMinimized && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
          }}
          onClick={(e) => {
            // Close modal when clicking on backdrop
            if (e.target === e.currentTarget) {
              closeViewer();
            }
          }}
        >
          <div
            className="relative rounded-lg overflow-hidden flex flex-col"
            style={{
              backgroundColor: darkMode ? '#1f2937' : '#ffffff',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
              width: popupSize.width || '90%',
              height: popupSize.height || '90%',
              maxWidth: '95vw',
              maxHeight: '95vh',
              minWidth: '600px',
              minHeight: '400px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              className="flex items-center justify-between p-4 border-b"
              style={{
                borderColor: darkMode ? 'rgba(75, 85, 99, 0.3)' : 'rgba(229, 231, 235, 0.5)',
                position: 'sticky',
                top: 0,
                zIndex: 10,
                backgroundColor: darkMode ? '#1f2937' : '#ffffff',
              }}
            >
              <div className="flex-1 min-w-0">
                <h3
                  className="text-xl font-semibold truncate"
                  style={{ color: darkMode ? '#ffffff' : '#1f2937' }}
                >
                  {selectedMaterial?.title || selectedMaterial?.originalName || 'View Material'}
                </h3>
                {selectedMaterial?.originalName && selectedMaterial?.originalName !== selectedMaterial?.title && (
                  <p
                    className="text-sm truncate mt-1"
                    style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}
                  >
                    {selectedMaterial?.originalName}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => setViewerMinimized(true)}
                  className="p-2 rounded-lg transition-all duration-200 hover:shadow-lg"
                  style={{
                    backgroundColor: darkMode ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.1)',
                    color: darkMode ? '#a5b4fc' : '#4f46e5',
                  }}
                  title="Minimize"
                >
                  <Minimize2 size={20} />
                </button>
                <button
                  onClick={() => selectedMaterial && handleDownload(selectedMaterial._id)}
                  className="p-2 rounded-lg transition-all duration-200 hover:shadow-lg"
                  style={{
                    backgroundColor: darkMode ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                    color: darkMode ? '#10b981' : '#059669',
                  }}
                  title="Download"
                  disabled={!selectedMaterial}
                >
                  <Download size={20} />
                </button>
                <button
                  onClick={closeViewer}
                  className="p-2 rounded-lg transition-all duration-200 hover:shadow-lg"
                  style={{
                    backgroundColor: darkMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    color: darkMode ? '#fca5a5' : '#dc2626',
                  }}
                  title="Close (ESC)"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div 
              className="flex-1 overflow-auto" 
              style={{ 
                minHeight: 0,
                backgroundColor: darkMode ? '#111827' : '#f9fafb',
              }}
            >
              {!selectedMaterial ? (
                <div className="flex items-center justify-center p-10">
                  <div
                    className="animate-spin rounded-full h-10 w-10 border-b-2"
                    style={{ borderColor: darkMode ? "#a5b4fc" : "#4f46e5" }}
                  />
                </div>
              ) : (
                getViewerContent(selectedMaterial)
              )}
            </div>

            {/* Resize Handle */}
            <div
              onMouseDown={handleResizeStart}
              className="absolute bottom-0 right-0 w-8 h-8 cursor-nwse-resize flex items-center justify-center group"
              style={{
                backgroundColor: darkMode ? 'rgba(75, 85, 99, 0.4)' : 'rgba(229, 231, 235, 0.6)',
                borderTopLeftRadius: '8px',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = darkMode ? 'rgba(99, 102, 241, 0.4)' : 'rgba(99, 102, 241, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = darkMode ? 'rgba(75, 85, 99, 0.4)' : 'rgba(229, 231, 235, 0.6)';
              }}
              title="Drag to resize"
            >
              <div className="flex flex-col gap-0.5">
                <div className="flex gap-0.5">
                  <div 
                    className="w-1 h-1 rounded-full"
                    style={{ backgroundColor: darkMode ? '#9ca3af' : '#6b7280' }}
                  />
                  <div 
                    className="w-1 h-1 rounded-full"
                    style={{ backgroundColor: darkMode ? '#9ca3af' : '#6b7280' }}
                  />
                </div>
                <div className="flex gap-0.5">
                  <div 
                    className="w-1 h-1 rounded-full"
                    style={{ backgroundColor: darkMode ? '#9ca3af' : '#6b7280' }}
                  />
                  <div 
                    className="w-1 h-1 rounded-full"
                    style={{ backgroundColor: darkMode ? '#9ca3af' : '#6b7280' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Minimized Dock */}
      {isViewerOpen && selectedMaterial && viewerMinimized && (
        <div
          className="fixed z-50 right-4 bottom-4 rounded-lg shadow-lg border flex items-center gap-3 px-3 py-2"
          style={{
            backgroundColor: darkMode ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            borderColor: darkMode ? 'rgba(75, 85, 99, 0.6)' : 'rgba(229, 231, 235, 0.9)',
          }}
        >
          <div className="truncate max-w-[280px]" style={{ color: darkMode ? '#e5e7eb' : '#111827' }}>
            {selectedMaterial.title || selectedMaterial.originalName || 'Viewer'}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewerMinimized(false)}
              className="p-2 rounded-md transition-all"
              style={{
                backgroundColor: darkMode ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.12)',
                color: darkMode ? '#a5b4fc' : '#4f46e5',
              }}
              title="Restore"
            >
              <Maximize2 size={18} />
            </button>
            <button
              onClick={closeViewer}
              className="p-2 rounded-md transition-all"
              style={{
                backgroundColor: darkMode ? 'rgba(239, 68, 68, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                color: darkMode ? '#fca5a5' : '#dc2626',
              }}
              title="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LessonMaterialDetailPage;
