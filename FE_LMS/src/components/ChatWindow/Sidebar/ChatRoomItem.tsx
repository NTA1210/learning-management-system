// import type { Conversation } from '../../contexts/ConversationsContext';
// import { useAuthStore } from '../../stores/authStore';

import { useEffect, useState } from "react";
import { useChatRoomStore } from "../../../stores/chatRoomStore";
import type { ChatRoom } from "../../../context/ChatRoomContext";

const ChatRoomItem = ({
  chatRoomId,
  name,
  course,
  logo,
  participants,
  unreadCounts,
  lastMessage,
}: ChatRoom) => {
  const [user, setUser] = useState(null);
  const { selectedChatRoom, setSelectedChatRoom } = useChatRoomStore();

  let displayTime = "";

  const isSelected = selectedChatRoom?.chatRoomId === chatRoomId;

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("lms:user") || "{}");
    setUser(user);
  }, []);

  if (lastMessage?.timestamp) {
    const createdAt = new Date(lastMessage.timestamp);
    const now = new Date();

    const diffInMs = now.getTime() - createdAt.getTime();
    const diffInDays = diffInMs / (60 * 60 * 24 * 1000);

    const time = createdAt.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const date = createdAt.toLocaleDateString([], {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

    displayTime = diffInDays >= 1 ? `${date} ${time}` : time;
  }

  return (
    <div
      className={`
            p-4 border-b border-gray-200 flex items-center space-x-3 cursor-pointer transition-colors ${
              isSelected ? "bg-blue-100" : "bg-gray-50"
            }
        `}
      onClick={() => {
        if (isSelected) {
          setSelectedChatRoom(null);
        } else {
          setSelectedChatRoom({
            chatRoomId,
            name,
            course,
            logo,
            participants,
            lastMessage,
            unreadCounts,
          });
        }
      }}
    >
      <div className="relative">
        <img
          src={logo || "https://shorturl.at/ARotg"}
          alt="User"
          className="object-cover rounded-full size-10"
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold truncate">{name}</h2>
          {lastMessage?.timestamp && (
            <span className="text-xs text-gray-500">{displayTime}</span>
          )}
        </div>

        <div className="flex items-center">
          <p
            className={
              unreadCounts[(user as any)?._id] > 0
                ? "text-sm text-gray-500 truncate min-h-5"
                : "text-sm text-sky-500 truncate min-h-5"
            }
          >
            {lastMessage?.content ?? ""}
          </p>
          {user && unreadCounts[(user as any)?._id] > 0 && (
            <div className="flex items-center justify-center ml-2 text-xs text-white rounded-full bg-sky-500 size-5 shrink-0">
              {unreadCounts[(user as any)?._id]}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatRoomItem;
