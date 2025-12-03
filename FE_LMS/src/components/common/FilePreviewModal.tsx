import React, { useEffect, useState, useRef } from "react";
import { X, Download, Minimize2, Maximize2, FileText, ExternalLink } from "lucide-react";
import { useTheme } from "../../hooks/useTheme";

interface FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: {
    url: string;
    originalName: string;
    mimeType?: string;
    size?: number;
  };
}

const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  isOpen,
  onClose,
  file,
}) => {
  const { darkMode } = useTheme();
  const [isMinimized, setIsMinimized] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeMode, setResizeMode] = useState<"horizontal" | "vertical" | null>(null);
  const [popupSize, setPopupSize] = useState<{ width: number; height: number }>({
    width: window.innerWidth * 0.8,
    height: window.innerHeight * 0.85,
  });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const popupRef = useRef<HTMLDivElement>(null);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  // Handle resize
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (resizeMode === "horizontal") {
        const newWidth = resizeStart.width + (e.clientX - resizeStart.x);
        setPopupSize((prev) => ({
          ...prev,
          width: Math.max(400, Math.min(newWidth, window.innerWidth * 0.95)),
        }));
      } else if (resizeMode === "vertical") {
        const newHeight = resizeStart.height + (e.clientY - resizeStart.y);
        setPopupSize((prev) => ({
          ...prev,
          height: Math.max(300, Math.min(newHeight, window.innerHeight * 0.95)),
        }));
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setResizeMode(null);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, resizeMode, resizeStart]);

  const handleResizeStart = (
    e: React.MouseEvent,
    mode: "horizontal" | "vertical"
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeMode(mode);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: popupSize.width,
      height: popupSize.height,
    });
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = file.url;
    link.download = file.originalName;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getFileExtension = (filename: string): string => {
    return filename.split(".").pop()?.toLowerCase() || "";
  };

  const getViewerContent = () => {
    const mimeType = file.mimeType?.toLowerCase() || "";
    const extension = getFileExtension(file.originalName);

    // PDF files
    if (mimeType.includes("pdf") || extension === "pdf") {
      return (
        <iframe
          src={file.url}
          className="w-full h-full border-0"
          title={file.originalName}
          style={{ backgroundColor: "#fff" }}
        />
      );
    }

    // Images
    if (mimeType.startsWith("image/")) {
      return (
        <div className="flex items-center justify-center p-4 h-full">
          <img
            src={file.url}
            alt={file.originalName}
            className="max-w-full max-h-full object-contain"
          />
        </div>
      );
    }

    // Videos
    if (mimeType.startsWith("video/")) {
      return (
        <div className="flex items-center justify-center p-4 h-full">
          <video src={file.url} controls className="max-w-full max-h-full">
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }

    // Text files (txt, md, etc.)
    if (
      mimeType.startsWith("text/") ||
      extension === "txt" ||
      extension === "md"
    ) {
      return (
        <iframe
          src={file.url}
          className="w-full h-full border-0"
          title={file.originalName}
          style={{ backgroundColor: "#fff" }}
        />
      );
    }

    // Office documents - use Microsoft Office Online Viewer or Google Docs Viewer
    const isOfficeDoc =
      mimeType.includes("word") ||
      mimeType.includes("excel") ||
      mimeType.includes("powerpoint") ||
      mimeType.includes("presentation") ||
      mimeType.includes("spreadsheet") ||
      mimeType.includes("msword") ||
      mimeType.includes("ms-excel") ||
      mimeType.includes("ms-powerpoint") ||
      mimeType.includes("vnd.openxmlformats-officedocument") ||
      ["doc", "docx", "xls", "xlsx", "ppt", "pptx"].includes(extension);

    if (isOfficeDoc) {
      const encodedUrl = encodeURIComponent(file.url);
      let viewerUrl = "";

      if (["docx", "doc"].includes(extension)) {
        viewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodedUrl}`;
      } else if (["xlsx", "xls"].includes(extension)) {
        viewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodedUrl}`;
      } else if (["pptx", "ppt"].includes(extension)) {
        viewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodedUrl}`;
      } else {
        // Fallback to Google Docs Viewer
        viewerUrl = `https://docs.google.com/viewer?url=${encodedUrl}&embedded=true`;
      }

      return (
        <div className="w-full h-full flex flex-col">
          <iframe
            src={viewerUrl}
            className="w-full flex-1 border-0"
            title={file.originalName}
            style={{ backgroundColor: "#fff", minHeight: "500px" }}
            allow="fullscreen"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
          />
          <div
            className="p-2 text-xs text-center border-t"
            style={{
              color: darkMode ? "#9ca3af" : "#6b7280",
              borderColor: darkMode
                ? "rgba(75, 85, 99, 0.3)"
                : "rgba(229, 231, 235, 0.5)",
            }}
          >
            If the document doesn't load, try downloading the file or{" "}
            <a
              href={file.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-500 hover:underline"
            >
              opening in a new tab
            </a>
            .
          </div>
        </div>
      );
    }

    // Default: show download prompt
    return (
      <div className="flex flex-col items-center justify-center p-8 h-full">
        <FileText
          size={64}
          style={{
            color: darkMode ? "#9ca3af" : "#6b7280",
            marginBottom: "1rem",
          }}
        />
        <p
          className="text-center mb-2 text-lg font-medium"
          style={{ color: darkMode ? "#e5e7eb" : "#374151" }}
        >
          {file.originalName}
        </p>
        <p
          className="text-center text-sm mb-4"
          style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}
        >
          This file type cannot be previewed directly.
        </p>
        <div className="flex gap-3">
          <button
            onClick={handleDownload}
            className="px-4 py-2 rounded-lg text-white transition-all duration-200 hover:shadow-lg flex items-center gap-2"
            style={{ backgroundColor: darkMode ? "#059669" : "#10b981" }}
          >
            <Download size={18} />
            Download
          </button>
          <a
            href={file.url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-lg transition-all duration-200 hover:shadow-lg flex items-center gap-2"
            style={{
              backgroundColor: darkMode ? "#4f46e5" : "#6366f1",
              color: "#fff",
            }}
          >
            <ExternalLink size={18} />
            Open in new tab
          </a>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  // Minimized dock
  if (isMinimized) {
    return (
      <div
        className="fixed z-[200] right-4 bottom-4 rounded-lg shadow-lg border flex items-center gap-3 px-3 py-2"
        style={{
          backgroundColor: darkMode
            ? "rgba(31, 41, 55, 0.95)"
            : "rgba(255, 255, 255, 0.95)",
          borderColor: darkMode
            ? "rgba(75, 85, 99, 0.5)"
            : "rgba(229, 231, 235, 0.8)",
        }}
      >
        <FileText
          size={20}
          style={{ color: darkMode ? "#a5b4fc" : "#4f46e5" }}
        />
        <span
          className="text-sm font-medium truncate max-w-[200px]"
          style={{ color: darkMode ? "#e5e7eb" : "#374151" }}
        >
          {file.originalName}
        </span>
        <button
          onClick={() => setIsMinimized(false)}
          className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          title="Restore"
        >
          <Maximize2
            size={16}
            style={{ color: darkMode ? "#94a3b8" : "#64748b" }}
          />
        </button>
        <button
          onClick={onClose}
          className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
          title="Close"
        >
          <X size={16} style={{ color: "#ef4444" }} />
        </button>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        backdropFilter: "blur(4px)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={popupRef}
        className="relative rounded-lg overflow-hidden flex flex-col"
        style={{
          backgroundColor: darkMode ? "#1f2937" : "#ffffff",
          boxShadow:
            "0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)",
          width: popupSize.width,
          height: popupSize.height,
          maxWidth: "95vw",
          maxHeight: "95vh",
          minWidth: "400px",
          minHeight: "300px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-3 border-b"
          style={{
            borderColor: darkMode
              ? "rgba(75, 85, 99, 0.3)"
              : "rgba(229, 231, 235, 0.5)",
            backgroundColor: darkMode ? "#1f2937" : "#ffffff",
          }}
        >
          <div className="flex-1 min-w-0">
            <h3
              className="text-base font-semibold truncate"
              style={{ color: darkMode ? "#ffffff" : "#1f2937" }}
            >
              {file.originalName}
            </h3>
            {file.size && (
              <p
                className="text-xs mt-0.5"
                style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}
              >
                {(file.size / 1024).toFixed(1)} KB
              </p>
            )}
          </div>
          <div className="flex items-center gap-1 ml-4">
            <button
              onClick={handleDownload}
              className="p-2 rounded-lg transition-all duration-200 hover:shadow-lg"
              style={{
                backgroundColor: darkMode
                  ? "rgba(16, 185, 129, 0.1)"
                  : "rgba(16, 185, 129, 0.1)",
                color: darkMode ? "#10b981" : "#059669",
              }}
              title="Download"
            >
              <Download size={18} />
            </button>
            <button
              onClick={() => setIsMinimized(true)}
              className="p-2 rounded-lg transition-all duration-200 hover:shadow-lg"
              style={{
                backgroundColor: darkMode
                  ? "rgba(99, 102, 241, 0.15)"
                  : "rgba(99, 102, 241, 0.1)",
                color: darkMode ? "#a5b4fc" : "#4f46e5",
              }}
              title="Minimize"
            >
              <Minimize2 size={18} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg transition-all duration-200 hover:shadow-lg"
              style={{
                backgroundColor: darkMode
                  ? "rgba(239, 68, 68, 0.1)"
                  : "rgba(239, 68, 68, 0.1)",
                color: darkMode ? "#fca5a5" : "#dc2626",
              }}
              title="Close (ESC)"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div
          className="flex-1 overflow-auto"
          style={{
            minHeight: 0,
            backgroundColor: darkMode ? "#111827" : "#f9fafb",
          }}
        >
          {getViewerContent()}
        </div>

        {/* Resize Handle - Horizontal (Right Edge) */}
        <div
          onMouseDown={(e) => handleResizeStart(e, "horizontal")}
          className="absolute top-0 right-0 h-full w-3 cursor-ew-resize flex items-center justify-center"
          style={{ backgroundColor: "transparent" }}
        >
          <div
            className="w-1 rounded-full"
            style={{
              height: "60px",
              background: darkMode
                ? "rgba(148, 163, 184, 0.6)"
                : "rgba(71, 85, 105, 0.4)",
            }}
          />
        </div>

        {/* Resize Handle - Vertical (Bottom Edge) */}
        <div
          onMouseDown={(e) => handleResizeStart(e, "vertical")}
          className="absolute bottom-0 left-0 w-full h-3 cursor-ns-resize flex items-center justify-center"
          style={{ backgroundColor: "transparent" }}
        >
          <div
            className="h-1 rounded-full"
            style={{
              width: "60px",
              background: darkMode
                ? "rgba(148, 163, 184, 0.6)"
                : "rgba(71, 85, 105, 0.4)",
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default FilePreviewModal;
