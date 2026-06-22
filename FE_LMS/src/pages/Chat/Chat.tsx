import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ChatSidebar from "../../components/ChatWindow/Sidebar/ChatSidebar";
import ChatWindow from "../../components/ChatWindow/ChatWindow";
import { useTheme } from "../../hooks/useTheme";
import { useAuth } from "../../hooks/useAuth";
import { useChatRoomsContext } from "../../context/ChatRoomContext";
import { useChatRoomStore } from "../../stores/chatRoomStore";

function Chat() {
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { roomId } = useParams<{ roomId?: string }>();
  const { chatRooms, isLoading } = useChatRoomsContext();
  const { setSelectedChatRoom, selectedChatRoom } = useChatRoomStore();

  const handleBackToWorkspace = () => {
    if (user?.role === "admin") navigate("/dashboard");
    else if (user?.role === "teacher") navigate("/teacher-dashboard");
    else if (user?.role === "student") navigate("/student-dashboard");
    else navigate("/");
  };

  // Sync chat room selection with URL - only on initial load or direct URL navigation
  useEffect(() => {
    // If URL has roomId but no room is selected (e.g., direct URL access or page refresh)
    if (roomId && chatRooms.length > 0 && !isLoading) {
      // Only set if not already selected (avoids flicker when clicking items)
      if (!selectedChatRoom || selectedChatRoom.chatRoomId !== roomId) {
        const targetRoom = chatRooms.find((room) => room.chatRoomId === roomId);
        if (targetRoom) {
          setSelectedChatRoom(targetRoom);
        }
      }
    } 
    // If no roomId in URL but a room is selected, clear it (back button pressed)
    else if (!roomId && selectedChatRoom) {
      setSelectedChatRoom(null);
    }
  }, [roomId, chatRooms, isLoading]);

  return (
    <div
      className="app-page min-h-screen"
      style={{
        backgroundColor: darkMode ? "#020617" : "#f3f4f6",
        color: darkMode ? "#e5e7eb" : "#0f172a",
      }}
    >
      <div
        className="fixed inset-x-0 top-0 z-50 border-b backdrop-blur-md"
        style={{
          height: 64,
          backgroundColor: darkMode
            ? "rgba(15, 23, 42, 0.92)"
            : "rgba(255, 255, 255, 0.92)",
          borderColor: darkMode
            ? "rgba(148, 163, 184, 0.16)"
            : "rgba(226, 232, 240, 0.9)",
        }}
      >
        <div className="flex h-full items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl font-bold text-white"
              style={{ backgroundColor: "#4f46e5" }}
            >
              F
            </div>
            <div>
              <p className="text-sm font-bold">FStudyMate Chat</p>
              <p
                className="text-xs"
                style={{ color: darkMode ? "#94a3b8" : "#64748b" }}
              >
                Course conversations and study groups
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleBackToWorkspace}
            className="ui-button-secondary"
          >
            Back to workspace
          </button>
        </div>
      </div>

      <div className="flex min-h-screen pt-16">
        {/* Sidebar - hidden on mobile when a chat is selected */}
        <div className={`w-full sm:w-1/3 sm:max-w-[456px] border-r border-gray-200/70 dark:border-slate-700/60 ${selectedChatRoom ? 'hidden sm:block' : 'block'}`} style={{ minHeight: "calc(100vh - 64px)" }}>
          <ChatSidebar />
        </div>
        {/* Chat Window - shown on mobile only when a chat is selected, always shown on desktop */}
        <div className={`flex-1 ${selectedChatRoom ? 'flex' : 'hidden sm:flex'}`} style={{ minHeight: "calc(100vh - 64px)" }}>
          <ChatWindow />
        </div>
      </div>
    </div>
  );
}

export default Chat;
