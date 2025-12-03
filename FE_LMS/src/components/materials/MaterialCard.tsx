import React from "react";
import { Eye, Download, Pencil, Trash, FileText, Video, Presentation, Link as LinkIcon, File } from "lucide-react";
import type { LessonMaterial } from "../../types/lessonMaterial";

interface MaterialCardProps {
  material: LessonMaterial;
  darkMode: boolean;
  canManage: boolean;
  onView: (material: LessonMaterial) => void;
  onDownload: (materialId: string) => void;
  onEdit: (material: LessonMaterial) => void;
  onDelete: (materialId: string) => void;
}

const getFileIcon = (mimeType?: string) => {
  if (!mimeType) return <File size={24} />;
  if (mimeType.includes("pdf")) return <FileText size={24} />;
  if (mimeType.includes("video")) return <Video size={24} />;
  if (mimeType.includes("presentation") || mimeType.includes("powerpoint")) return <Presentation size={24} />;
  if (mimeType.includes("link")) return <LinkIcon size={24} />;
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

const MaterialCard: React.FC<MaterialCardProps> = ({
  material,
  darkMode,
  canManage,
  onView,
  onDownload,
  onEdit,
  onDelete,
}) => (
  <div
    className="rounded-lg shadow-md overflow-hidden transition-all duration-200 hover:shadow-lg"
    style={{
      backgroundColor: darkMode ? "rgba(31, 41, 55, 0.8)" : "rgba(255, 255, 255, 0.9)",
      border: darkMode ? "1px solid rgba(75, 85, 99, 0.3)" : "1px solid rgba(229, 231, 235, 0.5)",
    }}
  >
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-start mb-3">
            <div
              className="p-2 rounded-lg mr-3 flex-shrink-0"
              style={{
                backgroundColor: darkMode ? "rgba(99, 102, 241, 0.2)" : "rgba(99, 102, 241, 0.1)",
                color: darkMode ? "#a5b4fc" : "#6366f1",
              }}
            >
              {getFileIcon(material.mimeType)}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg sm:text-xl font-semibold mb-1 break-words" style={{ color: darkMode ? "#ffffff" : "#1f2937" }}>
                {material.title}
              </h3>
              {material.originalName && (
                <p className="text-sm mb-2 truncate" style={{ color: darkMode ? "#9ca3af" : "#6b7280" }} title={material.originalName}>
                  {material.originalName}
                </p>
              )}
            </div>
          </div>

          {material.note && (
            <p className="text-sm mb-4" style={{ color: darkMode ? "#d1d5db" : "#6b7280" }}>
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

          <div
            className="flex items-center pt-4 border-t"
            style={{ borderColor: darkMode ? "rgba(75, 85, 99, 0.3)" : "rgba(229, 231, 235, 0.5)" }}
          >
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

        <div className="flex items-center gap-2 flex-wrap sm:ml-4 sm:flex-nowrap">
          {material.hasAccess && (
            <>
              <button
                onClick={() => onView(material)}
                className="flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg transition-all duration-200 hover:shadow-lg flex items-center justify-center"
                style={{
                  backgroundColor: darkMode ? "rgba(99, 102, 241, 0.15)" : "rgba(99, 102, 241, 0.1)",
                  color: darkMode ? "#a5b4fc" : "#4f46e5",
                  border: darkMode ? "1px solid rgba(99, 102, 241, 0.35)" : "1px solid rgba(79, 70, 229, 0.25)",
                }}
              >
                <Eye size={18} className="sm:mr-2" />
                <span className="hidden sm:inline">View</span>
              </button>
              <button
                onClick={() => onDownload(material._id)}
                className="flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg text-white transition-all duration-200 hover:shadow-lg flex items-center justify-center"
                style={{ backgroundColor: darkMode ? "#059669" : "#10b981" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = darkMode ? "#047857" : "#059669";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = darkMode ? "#059669" : "#10b981";
                }}
              >
                <Download size={18} className="sm:mr-2" />
                <span className="hidden sm:inline">Download</span>
              </button>
            </>
          )}
          {canManage && (
            <>
              <button
                onClick={() => onEdit(material)}
                className="px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105 hover:shadow-md flex items-center justify-center gap-1 sm:gap-2"
                style={{
                  backgroundColor: darkMode ? "rgba(99, 102, 241, 0.2)" : "#eef2ff",
                  color: darkMode ? "#a5b4fc" : "#4f46e5",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = darkMode ? "rgba(99, 102, 241, 0.3)" : "#e0e7ff";
                  e.currentTarget.style.transform = "scale(1.05)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = darkMode ? "rgba(99, 102, 241, 0.2)" : "#eef2ff";
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                <Pencil size={16} />
                <span className="hidden sm:inline">Edit</span>
              </button>
              <button
                onClick={() => onDelete(material._id)}
                className="px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105 hover:shadow-md flex items-center justify-center gap-1 sm:gap-2"
                style={{
                  backgroundColor: darkMode ? "rgba(239, 68, 68, 0.2)" : "#fee2e2",
                  color: darkMode ? "#fca5a5" : "#dc2626",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = darkMode ? "rgba(239, 68, 68, 0.3)" : "#fecaca";
                  e.currentTarget.style.transform = "scale(1.05)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = darkMode ? "rgba(239, 68, 68, 0.2)" : "#fee2e2";
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                <Trash size={16} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  </div>
);

export default MaterialCard;

