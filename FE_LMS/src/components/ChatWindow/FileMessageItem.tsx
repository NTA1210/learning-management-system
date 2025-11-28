import React, { useEffect, useState } from "react";

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

const FileMessageItem: React.FC<FileMessage> = ({
  senderId,
  file,
  createdAt,
}) => {
  const [user, setUser] = useState<any>(null);

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
          className="w-40 h-auto max-w-xs rounded-lg cursor-pointer hover:opacity-90"
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
                        ? "bg-blue-700 text-white"
                        : "bg-gray-200 text-gray-800"
                    } 
                    hover:opacity-90`}
      >
        📎 {file.originalName}
      </a>
    );
  };

  return (
    <div className={`relative flex mb-4 ${userIsSender ? "justify-end" : ""}`}>
      <span
        className={`absolute text-xs text-gray-700 -top-4  ${
          userIsSender ? "right-1" : "left-8.5"
        }`}
      >
        {senderId.username}
      </span>
      {!userIsSender && (
        <img
          src={senderId.avatar_url || "https://shorturl.at/0Xbnm"}
          alt={senderId.username}
          className="object-cover w-8 h-8 mr-2 rounded-full"
        />
      )}
      <div className="max-w-xs p-2 bg-white lg:max-w-md rounded-2xl">
        {renderFile()}
        <span className="block mt-1 text-xs text-gray-600">{time}</span>
      </div>
    </div>
  );
};

export default FileMessageItem;
