import { useEffect, useState } from "react";
import type { Message } from "../../services/messageService";
import { useTheme } from "../../hooks/useTheme";

type MessageItemProps = Message & {
  isFirstInBlock?: boolean;
  isLastInBlock?: boolean;
};

const MessageItem: React.FC<MessageItemProps> = ({
  _id,
  senderId,
  content,
  file,
  isLink,
  isNotification,
  createdAt,
  isFirstInBlock = true,
  isLastInBlock = true,
}) => {
  const [user, setUser] = useState(null);
  const { darkMode } = useTheme();
  const userIsSender = senderId._id === (user as any)?._id;

  const created = new Date(createdAt);
  const now = new Date();

  const diffInMs = now.getTime() - created.getTime();
  const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

  const time = created.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const date = created.toLocaleDateString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const displayTime = diffInDays > 1 ? `${date} ${time}` : time;

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("lms:user") || "{}");

    setUser(user);
  }, []);

  if (isNotification) {
    console.log("ISNOTIFICATION", isNotification);

    return (
      <div className="flex items-center justify-center gap-2 my-4">
        <div 
          className="flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-full"
          style={{
            backgroundColor: darkMode ? "rgba(99, 102, 241, 0.15)" : "rgba(219, 234, 254, 1)",
            borderColor: darkMode ? "rgba(99, 102, 241, 0.3)" : "rgba(147, 197, 253, 1)",
            color: darkMode ? "#a5b4fc" : "#1e40af",
            border: "1px solid",
          }}
        >
          <span className="text-sm"></span>
          <p>{content}</p>
        </div>
      </div>
    );
  }

  if (userIsSender) {
    return (
      <div
        className="flex flex-col items-end mb-1"
        style={{
          marginTop: isFirstInBlock ? "1rem" : "0.15rem",
          marginBottom: isLastInBlock ? "0.9rem" : "0.15rem",
        }}
      >
        {isFirstInBlock && (
          <span className="text-xs text-gray-400 mb-1 mr-1">
            {senderId.username}
          </span>
        )}
        <div className="max-w-xs p-3 text-sm text-white bg-indigo-600 lg:max-w-md rounded-2xl rounded-br-sm">
          {isLink ? (
            <a href={content} className="text-sm underline" target="_blank">
              {content}
            </a>
          ) : (
            <p className="text-sm">{content}</p>
          )}
          <span className="flex items-center gap-1 mt-1 text-[11px] text-indigo-100">
            {displayTime}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex gap-2"
      style={{
        marginTop: isFirstInBlock ? "1rem" : "0.15rem",
        marginBottom: isLastInBlock ? "0.9rem" : "0.15rem",
      }}
    >
      {/* Avatar - always show on first block, spacer for subsequent */}
      {isFirstInBlock ? (
        <img
          src={senderId.avatar_url || "https://shorturl.at/0Xbnm"}
          alt={senderId.username}
          className="object-cover rounded-full size-8 flex-shrink-0"
        />
      ) : (
        <div className="size-8 flex-shrink-0" />
      )}
      
      {/* Username and message content stacked vertically */}
      <div className="flex flex-col gap-1 flex-1 min-w-0">
        {/* Username - only show on first block */}
        {isFirstInBlock && (
          <span className="text-xs text-gray-400">
            {senderId.username}
          </span>
        )}
        
        {/* Message bubble */}
        <div 
          className="max-w-xs p-3 text-sm lg:max-w-md rounded-2xl rounded-bl-sm border w-fit"
          style={{
            backgroundColor: darkMode ? "rgba(51, 65, 85, 0.6)" : "#f3f4f6",
            borderColor: darkMode ? "rgba(71, 85, 105, 0.4)" : "rgba(229, 231, 235, 0.8)",
            color: darkMode ? "#e5e7eb" : "#1f2937",
          }}
        >
          {isLink ? (
            <a href={content} className="text-sm underline" target="_blank">
              {content}
            </a>
          ) : (
            <p className="text-sm">{content}</p>
          )}
          <span 
            className="flex items-center gap-1 mt-1 text-xs"
            style={{
              color: darkMode ? "#94a3b8" : "#6b7280",
            }}
          >
            {displayTime}
          </span>
        </div>
      </div>
    </div>
  );
};

export default MessageItem;
