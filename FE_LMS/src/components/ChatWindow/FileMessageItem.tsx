import React, { useEffect, useState } from "react";
import { useTheme } from "../../hooks/useTheme";
import { FileText, FileSpreadsheet, Presentation, Eye } from "lucide-react";
import FilePreviewModal from "../common/FilePreviewModal";

export interface FileMessage {
  _id: string;
  senderId: {
    _id: string;
    username: string;
    avatar_url?: string;
  };
  file: {
    url: string;
    originalName: string;
    mimeType?: string;
    size?: number;
  };
  createdAt: string;
}

type FileMessageItemProps = FileMessage & {
  isFirstInBlock?: boolean;
  isLastInBlock?: boolean;
};

// File extensions that support preview
const previewableExtensions = new Set([
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
  "txt",
  "md",
]);

const getFileExtension = (filename: string): string => {
  return filename.split(".").pop()?.toLowerCase() || "";
};

const getFileIcon = (extension: string) => {
  if (["xls", "xlsx", "csv"].includes(extension)) return FileSpreadsheet;
  if (["ppt", "pptx"].includes(extension)) return Presentation;
  return FileText;
};

const isPreviewable = (file: { originalName: string; mimeType?: string }): boolean => {
  const extension = getFileExtension(file.originalName);
  const mimeType = file.mimeType?.toLowerCase() || "";
  
  return (
    previewableExtensions.has(extension) ||
    mimeType.includes("pdf") ||
    mimeType.includes("word") ||
    mimeType.includes("excel") ||
    mimeType.includes("powerpoint") ||
    mimeType.includes("presentation") ||
    mimeType.includes("spreadsheet") ||
    mimeType.startsWith("text/")
  );
};

const FileMessageItem: React.FC<FileMessageItemProps> = ({
  senderId,
  file,
  createdAt,
  isFirstInBlock = true,
  isLastInBlock = true,
}) => {
  const [user, setUser] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const { darkMode } = useTheme();

  useEffect(() => {
    const storedUser = localStorage.getItem("lms:user");
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  const userIsSender = senderId._id === user?._id;

  const created = new Date(createdAt);
  const time = created.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const canPreview = isPreviewable(file);
  const extension = getFileExtension(file.originalName);
  const FileIcon = getFileIcon(extension);

  const handleFileClick = () => {
    if (canPreview) {
      setIsPreviewOpen(true);
    } else {
      window.open(file.url, "_blank");
    }
  };

  const renderFile = () => {
    if (file.mimeType?.startsWith("image/")) {
      return (
        <img
          src={file.url}
          alt={file.originalName}
          className="max-w-xs max-h-[320px] rounded-2xl cursor-pointer object-cover hover:opacity-90"
          onClick={() => window.open(file.url, "_blank")}
        />
      );
    }

    return (
      <button
        onClick={handleFileClick}
        className={`flex items-center gap-2 p-2 text-sm font-medium rounded-lg w-full text-left group
                    ${
                      userIsSender
                        ? "bg-indigo-700 text-white hover:bg-indigo-800"
                        : darkMode
                        ? "bg-slate-700 text-slate-50 hover:bg-slate-600"
                        : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                    } 
                    transition-colors`}
      >
        <FileIcon className="size-5 flex-shrink-0" />
        <span className="truncate flex-1 max-w-[180px]">{file.originalName}</span>
        {canPreview && (
          <Eye 
            className={`size-4 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity ${
              userIsSender ? "text-indigo-200" : darkMode ? "text-slate-400" : "text-gray-500"
            }`} 
          />
        )}
      </button>
    );
  };

  const isImage = file.mimeType?.startsWith("image/");

  return (
    <div
      className={`flex gap-2 ${userIsSender ? "flex-row-reverse" : ""}`}
      style={{
        marginTop: isFirstInBlock ? "1rem" : "0.2rem",
        marginBottom: isLastInBlock ? "0.9rem" : "0.2rem",
      }}
    >
      {/* Avatar - always show on first block, spacer for subsequent */}
      {!userIsSender && (
        isFirstInBlock ? (
          <img
            src={senderId.avatar_url || "https://shorturl.at/0Xbnm"}
            alt={senderId.username}
            className="object-cover w-8 h-8 rounded-full flex-shrink-0"
          />
        ) : (
          <div className="w-8 h-8 flex-shrink-0" />
        )
      )}
      
      {/* Username and file/image content stacked vertically */}
      <div className={`flex flex-col gap-1 flex-1 min-w-0 ${userIsSender ? "items-end" : ""}`}>
        {/* Username - show on first block or always for images */}
        {(isFirstInBlock || isImage) && (
          <span className={`text-xs text-gray-400 ${userIsSender ? "mr-1" : ""}`}>
            {senderId.username}
          </span>
        )}
        
        {/* File/Image bubble */}
        <div
          className={`max-w-xs p-2 lg:max-w-md rounded-2xl w-fit ${
            userIsSender
              ? "bg-indigo-600 text-white rounded-br-sm"
              : darkMode
              ? "bg-slate-900 text-slate-50 rounded-bl-sm border border-slate-700/60"
              : "bg-white text-gray-900 rounded-bl-sm"
          }`}
        >
          {renderFile()}
          <span
            className={`block mt-1 text-[11px] ${
              userIsSender
                ? "text-indigo-100"
                : darkMode
                ? "text-slate-400"
                : "text-gray-600"
            }`}
          >
            {time}
          </span>
        </div>
      </div>

      {/* File Preview Modal */}
      <FilePreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        file={file}
      />
    </div>
  );
};

export default FileMessageItem;
