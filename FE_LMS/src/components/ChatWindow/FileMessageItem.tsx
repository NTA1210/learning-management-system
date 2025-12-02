import React, { useEffect, useState } from "react";
import { useTheme } from "../../hooks/useTheme";

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

const FileMessageItem: React.FC<FileMessageItemProps> = ({
  senderId,
  file,
  createdAt,
  isFirstInBlock = true,
  isLastInBlock = true,
}) => {
  const [user, setUser] = useState<any>(null);
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
      <a
        href={file.url}
        target="_blank"
        rel="noopener noreferrer"
        className={`flex items-center gap-2 p-2 text-sm font-medium rounded-lg
                    ${
                      userIsSender
                        ? "bg-indigo-700 text-white"
                        : darkMode
                        ? "bg-slate-700 text-slate-50"
                        : "bg-gray-200 text-gray-800"
                    } 
                    hover:opacity-90`}
      >
        📎 {file.originalName}
      </a>
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
    </div>
  );
};

export default FileMessageItem;
