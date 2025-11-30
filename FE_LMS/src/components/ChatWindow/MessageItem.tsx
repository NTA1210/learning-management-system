import { useEffect, useState } from "react";
import type { Message } from "../../services/messageService";

const MessageItem: React.FC<Message> = ({
  _id,
  senderId,
  content,
  file,
  isLink,
  isNotification,
  createdAt,
}) => {
  const [user, setUser] = useState(null);
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
      <div className="flex items-center justify-center gap-2 mb-4">
        <p className="text-xs text-gray-500">{content}</p>
      </div>
    );
  }

  if (userIsSender) {
    return (
      <div className="relative flex justify-end mb-4">
        <span className="absolute text-xs text-gray-700 -top-4 right-1">
          {senderId.username}
        </span>
        <div className="max-w-xs p-3 text-white bg-sky-500 lg:max-w-md rounded-2xl">
          {isLink ? (
            <a href={content} className="text-sm underline" target="_blank">
              {content}
            </a>
          ) : (
            <p className="text-sm">{content}</p>
          )}
          <span className="flex items-center gap-1 mt-1 text-xs text-blue-100">
            {displayTime}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex mb-4">
      <span className="absolute left-8.5 -top-4 text-xs text-gray-700">
        {senderId.username}
      </span>
      <img
        src={senderId.avatar_url || "https://shorturl.at/0Xbnm"}
        alt={senderId.username}
        className="object-cover mr-2 rounded-full size-8"
      />
      <div className="max-w-xs p-3 bg-white lg:max-w-md rounded-2xl">
        {isLink ? (
          <a href={content} className="text-sm underline" target="_blank">
            {content}
          </a>
        ) : (
          <p className="text-sm">{content}</p>
        )}
        <span className="flex items-center gap-1 mt-1 text-xs text-gray-600">
          {displayTime}
        </span>
      </div>
    </div>
  );
};

export default MessageItem;
