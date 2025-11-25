import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTheme } from "../hooks/useTheme";
import { useAuth } from "../hooks/useAuth";
import { Navbar, Sidebar, LessonSummary, MaterialCard, MaterialFormModal } from "../components";
import { httpClient } from "../utils/http";
import { ArrowLeft, Download, FileText, X, Minimize2, Maximize2 } from "lucide-react";
import type { LessonSummary as LessonInfo, LessonMaterial, MaterialFormValues } from "../types/lessonMaterial";

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

type MaterialModalState =
  | { mode: "create" }
  | {
      mode: "edit";
      material: LessonMaterial;
    }
  | null;

const defaultMaterialValues: MaterialFormValues = {
  title: "",
  note: "",
  originalName: "",
  mimeType: "",
  size: 0,
};

const LessonMaterialDetailPage: React.FC = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const { user } = useAuth();
  const [lesson, setLesson] = useState<LessonInfo | null>(null);
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
  const [resizeMode, setResizeMode] = useState<"horizontal" | "vertical" | null>(null);
  const [materialModal, setMaterialModal] = useState<MaterialModalState>(null);

  // >>> ADDED: refs & raf helpers for smooth resize
  const popupRef = React.useRef<HTMLDivElement | null>(null);
  const contentRef = React.useRef<HTMLDivElement | null>(null);
  const sizeRef = React.useRef({ width: 0, height: 0 });
  const rafRef = React.useRef<number | null>(null);
  const resizingRef = React.useRef(false);
  // <<< ADDED

  const scrubMessage = (message: string) => {
    if (!message) return "";
    const cleaned = message.replace(/https?:\/\/[^\s]+/g, "").trim();
    return cleaned || "Something went wrong";
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
          const swalContainer = document.querySelector('.swal2-container') as HTMLElement;
          const swalBackdrop = document.querySelector('.swal2-backdrop-show') as HTMLElement;
          if (swalContainer) {
            swalContainer.style.zIndex = '99999';
          }
          if (swalBackdrop) {
            swalBackdrop.style.zIndex = '99998';
          }
        },
      });
    } catch {
      alert(scrubMessage(message));
    }
  };

  const showSwalConfirm = async (message: string): Promise<boolean> => {
    try {
      const Swal = (await import("sweetalert2")).default;
      const result = await Swal.fire({
        icon: "warning",
        title: "Confirm",
        text: scrubMessage(message),
        showCancelButton: true,
        confirmButtonColor: darkMode ? "#dc2626" : "#ef4444",
        cancelButtonColor: darkMode ? "#4b5563" : "#6b7280",
        confirmButtonText: "Yes",
        cancelButtonText: "No",
        background: darkMode ? "#1f2937" : "#ffffff",
        color: darkMode ? "#ffffff" : "#1e293b",
        didOpen: () => {
          const swalContainer = document.querySelector('.swal2-container') as HTMLElement;
          const swalBackdrop = document.querySelector('.swal2-backdrop-show') as HTMLElement;
          if (swalContainer) {
            swalContainer.style.zIndex = '99999';
          }
          if (swalBackdrop) {
            swalBackdrop.style.zIndex = '99998';
          }
        },
      });
      return result.isConfirmed;
    } catch {
      return confirm(scrubMessage(message));
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
          const swalContainer = document.querySelector('.swal2-container') as HTMLElement;
          const swalBackdrop = document.querySelector('.swal2-backdrop-show') as HTMLElement;
          if (swalContainer) {
            swalContainer.style.zIndex = '99999';
          }
          if (swalBackdrop) {
            swalBackdrop.style.zIndex = '99998';
          }
        },
      });
    } catch {
      alert(scrubMessage(message));
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isViewerOpen, viewerMinimized]);

  // Initialize popup size when opened
  useEffect(() => {
    if (isViewerOpen && !viewerMinimized && popupSize.width === 0) {
      // Set default size (90% of viewport)
      const w = window.innerWidth * 0.9;
      const h = window.innerHeight * 0.9;
      setPopupSize({
        width: w,
        height: h,
      });
      // >>> ADDED: keep a ref mirror for rAF sizing
      sizeRef.current = { width: w, height: h };
      // <<< ADDED
    }
  }, [isViewerOpen, viewerMinimized, popupSize.width]);

  // >>> REPLACED: Handle resize with rAF + direct DOM writes (no setState thrash)
  useEffect(() => {
    if (!isResizing || !resizeMode) {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      return;
    }

    document.body.style.cursor = resizeMode === "horizontal" ? 'ew-resize' : 'ns-resize';
    document.body.style.userSelect = 'none';
    resizingRef.current = true;

    // Freeze heavy content while resizing (FIX: dùng opacity thay visibility để không "đen")
    if (contentRef.current) {
      contentRef.current.style.pointerEvents = 'none';
      contentRef.current.style.willChange = 'opacity';
      contentRef.current.style.transform = 'translateZ(0)';
    }

    const frameUpdate = (nextWidth?: number, nextHeight?: number) => {
      if (!popupRef.current) return;
      if (typeof nextWidth === 'number') popupRef.current.style.width = `${nextWidth}px`;
      if (typeof nextHeight === 'number') popupRef.current.style.height = `${nextHeight}px`;
    };

    const onMove = (e: MouseEvent) => {
      e.preventDefault();
      const deltaX = e.clientX - resizeStart.x;
      const deltaY = e.clientY - resizeStart.y;

      const baseW = resizeStart.width || sizeRef.current.width || window.innerWidth * 0.9;
      const baseH = resizeStart.height || sizeRef.current.height || window.innerHeight * 0.9;

      let w = sizeRef.current.width || baseW;
      let h = sizeRef.current.height || baseH;

      if (resizeMode === "horizontal") {
        w = Math.max(400, Math.min(window.innerWidth - 40, baseW + deltaX));
      }
      if (resizeMode === "vertical") {
        h = Math.max(300, Math.min(window.innerHeight - 40, baseH + deltaY));
      }

      sizeRef.current = { width: w, height: h };

      if (rafRef.current == null) {
        rafRef.current = requestAnimationFrame(() => {
          rafRef.current = null;
          frameUpdate(
            resizeMode === "horizontal" ? w : undefined,
            resizeMode === "vertical" ? h : undefined
          );
        });
      }
    };

    const onUp = () => {
      resizingRef.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';

      // Khôi phục lại sau khi thả chuột
      if (contentRef.current) {
        contentRef.current.style.pointerEvents = '';
        contentRef.current.style.willChange = '';
        contentRef.current.style.transform = '';
      }

      // Sync final size to React state once after resize ends
      setPopupSize({ ...sizeRef.current });

      setIsResizing(false);
      setResizeMode(null);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);

    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, resizeStart, resizeMode]);
  // <<< REPLACED

  const fetchLesson = async () => {
    if (!lessonId) return;
    
    setLoading(true);
    setError("");
    try {
      const response = await httpClient.get(`/lessons/${lessonId}`, {
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
      const response = await httpClient.get<ApiResponse>(`/lesson-materials/lessons/${lessonId}`, {
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
      const response = await httpClient.get(`/lesson-materials/${materialId}/download`, {
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
        const response = await httpClient.get(`/lesson-materials/${material._id}/download`, {
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
      } else if (signedUrl) {
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

  const handleResizeStart = (e: React.MouseEvent, mode: "horizontal" | "vertical") => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeMode(mode);
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
        <div className="flex flex-col items-center justify-center h-full p-8">
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
          className="w-full h-full border-0"
          title={material.title || 'PDF Viewer'}
          style={{ backgroundColor: '#fff' }}
        />
      );
    }
    
    // Images
    if (mimeType.startsWith('image/')) {
      return (
        <div className="flex items-center justify-center p-4 h-full">
          <img
            src={viewerObjectUrl || material.signedUrl!}
            alt={material.title || 'Image'}
            className="max-w-full max-h-full object-contain"
          />
        </div>
      );
    }
    
    // Videos
    if (mimeType.startsWith('video/')) {
      return (
        <div className="flex items-center justify-center p-4 h-full">
          <video
            src={viewerObjectUrl || material.signedUrl!}
            controls
            className="max-w-full max-h-full"
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
          className="w-full h-full border-0"
          title={material.title || 'Text Viewer'}
          style={{ backgroundColor: '#fff' }}
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
          className="w-full h-full border-0"
          title={material.title || 'Document Viewer'}
          style={{ backgroundColor: '#fff' }}
        />
      );
    }
    
    // Default: try to embed or show download link
    return (
      <div className="flex flex-col items-center justify-center p-8 h-full">
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

  const isAdmin = user?.role === 'admin';
  const isTeacher = user?.role === 'teacher';
  const canCreate = isAdmin || isTeacher;

  const handleCreate = () => {
    setMaterialModal({ mode: "create" });
  };

  const handleEdit = (material: LessonMaterial) => {
    setMaterialModal({ mode: "edit", material });
  };

  const handleDelete = async (materialId: string) => {
    const confirmed = await showSwalConfirm("Are you sure you want to delete this material?");
    if (!confirmed) return;
    
    try {
      await httpClient.delete(`/lesson-materials/${materialId}`, {
        withCredentials: true,
      });
      await showSwalSuccess("Material deleted successfully");
      await fetchMaterials();
    } catch (err) {
      console.error("Error deleting material:", err);
      let errorMessage = "Failed to delete material";
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { message?: string } }; message?: string };
        errorMessage = axiosError.response?.data?.message || axiosError.message || errorMessage;
      }
      await showSwalError(errorMessage);
    }
  };

  const getMaterialInitialValues = (): MaterialFormValues => {
    if (materialModal?.mode === "edit" && materialModal.material) {
      const material = materialModal.material;
      return {
        title: material.title,
        note: material.note || "",
        originalName: material.originalName || "",
        mimeType: material.mimeType || "",
        size: material.size || 0,
      };
    }
    return defaultMaterialValues;
  };

  const handleMaterialSubmit = async (values: MaterialFormValues, file?: File | null) => {
    if (!lessonId) return;
    
    try {
      if (materialModal?.mode === "create") {
        if (file) {
        const formDataToSend = new FormData();
          formDataToSend.append("file", file);
          formDataToSend.append("lessonId", lessonId);
          formDataToSend.append("title", values.title);
          if (values.note) {
            formDataToSend.append("note", values.note);
        }
          let materialType = "other";
          if (values.mimeType) {
            if (values.mimeType.includes("pdf")) materialType = "pdf";
            else if (values.mimeType.includes("video")) materialType = "video";
            else if (values.mimeType.includes("presentation") || values.mimeType.includes("powerpoint")) materialType = "ppt";
            else if (values.mimeType.includes("link")) materialType = "link";
        }
          formDataToSend.append("type", materialType);

        await httpClient.post("/lesson-materials/upload", formDataToSend, {
          withCredentials: true,
          headers: {
              "Content-Type": "multipart/form-data",
          },
        });
      } else {
          await httpClient.post(
            "/lesson-material/createMaterial",
            {
          lessonId,
              ...values,
            },
            {
          withCredentials: true,
            }
          );
      }
      await showSwalSuccess("Material created successfully");
      } else if (materialModal?.mode === "edit" && materialModal.material) {
        await httpClient.patch(`/lesson-materials/${materialModal.material._id}`, values, {
        withCredentials: true,
      });
      await showSwalSuccess("Material updated successfully");
      }

      setMaterialModal(null);
      await fetchMaterials();
    } catch (err) {
      console.error("Error saving material:", err);
      let errorMessage = "Failed to save material";
      if (err && typeof err === "object" && "response" in err) {
        const axiosError = err as { response?: { data?: { message?: string } }; message?: string };
        errorMessage = axiosError.response?.data?.message || axiosError.message || errorMessage;
      }
      await showSwalError(errorMessage);
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
                <LessonSummary lesson={lesson} darkMode={darkMode} formatDuration={formatDuration} />
              ) : null}

              <div className="flex items-center justify-between mb-4">
                <div>
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
                {canCreate && (
                  <button
                    onClick={handleCreate}
                    className="px-6 py-2 rounded-lg text-white transition-all duration-200 hover:shadow-lg"
                    style={{ 
                      backgroundColor: darkMode ? '#059669' : '#10b981'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = darkMode ? '#047857' : '#059669';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = darkMode ? '#059669' : '#10b981';
                    }}
                  >
                    + Create Material
                  </button>
                )}
              </div>
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
                  <MaterialCard
                    key={material._id}
                    material={material}
                    darkMode={darkMode}
                    canManage={canCreate}
                    onView={handleView}
                    onDownload={handleDownload}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
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
            ref={popupRef} /* ADDED */
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
              willChange: 'width, height',         /* ADDED */
              contain: 'layout paint size',        /* ADDED */
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
              ref={contentRef} /* ADDED */
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

            {/* Resize Handle - Horizontal (Right Edge) */}
            <div
              onMouseDown={(e) => handleResizeStart(e, "horizontal")}
              className="absolute top-0 right-0 h-full w-3 cursor-ew-resize flex items-center justify-center"
              style={{
                backgroundColor: 'transparent',
              }}
            >
              <div
                className="w-1 rounded-full"
                style={{
                  height: '60px',
                  background: darkMode ? 'rgba(148, 163, 184, 0.6)' : 'rgba(71, 85, 105, 0.4)',
                }}
              />
            </div>

            {/* Resize Handle - Vertical (Bottom Edge) */}
            <div
              onMouseDown={(e) => handleResizeStart(e, "vertical")}
              className="absolute bottom-0 left-0 w-full h-3 cursor-ns-resize flex items-center justify-center"
              style={{
                backgroundColor: 'transparent',
              }}
            >
              <div
                className="h-1 rounded-full"
                style={{
                  width: '60px',
                  background: darkMode ? 'rgba(148, 163, 184, 0.6)' : 'rgba(71, 85, 105, 0.4)',
                }}
              />
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

      <MaterialFormModal
        darkMode={darkMode}
        isOpen={Boolean(materialModal)}
        mode={materialModal?.mode === "edit" ? "edit" : "create"}
        initialValues={getMaterialInitialValues()}
        onClose={() => setMaterialModal(null)}
        onSubmit={handleMaterialSubmit}
      />
    </div>
  );
};

export default LessonMaterialDetailPage;
