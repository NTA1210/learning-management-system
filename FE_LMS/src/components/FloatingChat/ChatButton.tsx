import { useState, useRef, useEffect } from "react";
import { MessageCircle, ExternalLink, Search } from "lucide-react";
import { useTheme } from "../../hooks/useTheme";
import { useChatRoomsContext } from "../../context/ChatRoomContext";
import { useFloatingChatStore } from "../../stores/floatingChatStore";
import { useNavigate } from "react-router-dom";
import type { ChatRoom } from "../../context/ChatRoomContext";

interface UserInfo {
  _id: string;
  username: string;
  email: string;
  fullname?: string;
}

const ChatButton: React.FC = () => {
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const { chatRooms, isLoading } = useChatRoomsContext();
  const { openChat } = useFloatingChatStore();
  
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get user for unread count
  const [user, setUser] = useState<UserInfo | null>(null);
  useEffect(() => {
    const storedUser = localStorage.getItem("lms:user");
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter chat rooms
  const filteredChatRooms = chatRooms.filter((room) =>
    room.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate total unread count
  const totalUnread = chatRooms.reduce((acc, room) => {
    const unread = user ? room.unreadCounts?.[user._id] || 0 : 0;
    return acc + unread;
  }, 0);

  const handleChatRoomClick = (chatRoom: ChatRoom) => {
    openChat(chatRoom);
    setIsOpen(false);
    setSearchTerm("");
  };

  const openFullChatPage = () => {
    setIsOpen(false);
    navigate("/chat-rooms");
  };

  const formatLastMessage = (content: string, maxLength: number = 30) => {
    // Strip HTML tags
    const stripped = content.replace(/<[^>]*>/g, "");
    if (stripped.length <= maxLength) return stripped;
    return stripped.substring(0, maxLength) + "...";
  };

  const formatTime = (timestamp: Date | string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg transition-colors"
        style={{
          backgroundColor: isOpen
            ? darkMode ? "rgba(99, 102, 241, 0.2)" : "rgba(99, 102, 241, 0.1)"
            : "transparent",
          color: darkMode ? "#a5b4fc" : "#4f46e5",
        }}
        title="Messages"
      >
        <MessageCircle className="size-5" />
        {totalUnread > 0 && (
          <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-xs font-bold text-white bg-red-500 rounded-full min-w-[18px] text-center">
            {totalUnread > 99 ? "99+" : totalUnread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-80 rounded-xl shadow-2xl border overflow-hidden z-[120]"
          style={{
            backgroundColor: darkMode ? "rgba(15, 23, 42, 0.98)" : "rgba(255, 255, 255, 0.98)",
            borderColor: darkMode ? "rgba(71, 85, 105, 0.6)" : "rgba(226, 232, 240, 0.9)",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 border-b"
            style={{
              borderColor: darkMode ? "rgba(71, 85, 105, 0.5)" : "rgba(229, 231, 235, 1)",
            }}
          >
            <h3
              className="font-semibold"
              style={{ color: darkMode ? "#f9fafb" : "#0f172a" }}
            >
              Messages
            </h3>
            <button
              onClick={openFullChatPage}
              className="flex items-center gap-1 text-xs font-medium text-indigo-500 hover:text-indigo-600"
            >
              <ExternalLink className="size-3" />
              Open full chat
            </button>
          </div>

          {/* Search */}
          <div className="px-3 py-2">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 size-4"
                style={{ color: darkMode ? "#64748b" : "#94a3b8" }}
              />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                style={{
                  backgroundColor: darkMode ? "#1e293b" : "#f8fafc",
                  borderColor: darkMode ? "rgba(71, 85, 105, 0.5)" : "rgba(229, 231, 235, 1)",
                  color: darkMode ? "#e5e7eb" : "#0f172a",
                }}
              />
            </div>
          </div>

          {/* Chat list */}
          <div className="max-h-[400px] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500" />
              </div>
            ) : filteredChatRooms.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-500">
                {searchTerm ? "No conversations found" : "No conversations yet"}
              </div>
            ) : (
              filteredChatRooms.map((room) => {
                const unreadCount = user ? room.unreadCounts?.[user._id] || 0 : 0;
                
                return (
                  <button
                    key={room.chatRoomId}
                    onClick={() => handleChatRoomClick(room)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left"
                  >
                    <div className="relative">
                      <img
                        src={room.course?.logo || "https://via.placeholder.com/40"}
                        alt={room.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center text-xs font-bold text-white bg-red-500 rounded-full">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-sm font-medium truncate ${unreadCount > 0 ? "font-semibold" : ""}`}
                          style={{ color: darkMode ? "#f9fafb" : "#0f172a" }}
                        >
                          {room.name}
                        </span>
                        {room.lastMessage?.timestamp && (
                          <span className="text-xs text-slate-500 ml-2 flex-shrink-0">
                            {formatTime(room.lastMessage.timestamp)}
                          </span>
                        )}
                      </div>
                      {room.lastMessage?.content && (
                        <p
                          className={`text-xs truncate mt-0.5 ${
                            unreadCount > 0
                              ? darkMode ? "text-slate-300" : "text-slate-700"
                              : "text-slate-500"
                          }`}
                        >
                          {formatLastMessage(room.lastMessage.content)}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatButton;
