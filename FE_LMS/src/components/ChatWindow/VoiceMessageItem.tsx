import React, { useEffect, useState } from "react";
import { useTheme } from "../../hooks/useTheme";
import AudioPlayer from "./AudioPlayer";

export interface VoiceMessage {
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
    duration?: number;
  };
  createdAt: string;
}

type VoiceMessageItemProps = VoiceMessage & {
  isFirstInBlock?: boolean;
  isLastInBlock?: boolean;
};

interface UserInfo {
  _id: string;
  username: string;
}

const VoiceMessageItem: React.FC<VoiceMessageItemProps> = ({
  senderId,
  file,
  createdAt,
  isFirstInBlock = true,
  isLastInBlock = true,
}) => {
  const [user, setUser] = useState<UserInfo | null>(null);
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

  return (
    <div
      className={`flex gap-2 ${userIsSender ? "flex-row-reverse" : ""}`}
      style={{
        marginTop: isFirstInBlock ? "1rem" : "0.2rem",
        marginBottom: isLastInBlock ? "0.9rem" : "0.2rem",
      }}
    >
      {/* Avatar */}
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

      {/* Content */}
      <div className={`flex flex-col gap-1 flex-1 min-w-0 ${userIsSender ? "items-end" : ""}`}>
        {/* Username */}
        {isFirstInBlock && (
          <span className={`text-xs text-gray-400 ${userIsSender ? "mr-1" : ""}`}>
            {senderId.username}
          </span>
        )}

        {/* Voice message bubble */}
        <div
          className={`p-2 rounded-2xl ${
            userIsSender
              ? "bg-indigo-600 text-white rounded-br-sm"
              : darkMode
              ? "bg-slate-900 text-slate-50 rounded-bl-sm border border-slate-700/60"
              : "bg-white text-gray-900 rounded-bl-sm"
          }`}
        >
          <AudioPlayer
            src={file.url}
            duration={file.duration}
            isSender={userIsSender}
          />
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

export default VoiceMessageItem;
