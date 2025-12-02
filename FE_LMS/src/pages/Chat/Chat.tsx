import { useEffect } from "react";
import { useParams } from "react-router-dom";
import ChatSidebar from "../../components/ChatWindow/Sidebar/ChatSidebar";
import ChatWindow from "../../components/ChatWindow/ChatWindow";
import { useTheme } from "../../hooks/useTheme";
import { useChatRoomsContext } from "../../context/ChatRoomContext";
import { useChatRoomStore } from "../../stores/chatRoomStore";

function Chat() {
  const { darkMode } = useTheme();
  const { roomId } = useParams<{ roomId?: string }>();
  const { chatRooms, isLoading } = useChatRoomsContext();
  const { setSelectedChatRoom, selectedChatRoom } = useChatRoomStore();

  // Auto-select chat room from URL param
  useEffect(() => {
    if (roomId && chatRooms.length > 0 && !isLoading) {
      const targetRoom = chatRooms.find((room) => room.chatRoomId === roomId);
      if (targetRoom && selectedChatRoom?.chatRoomId !== roomId) {
        setSelectedChatRoom(targetRoom);
      }
    }
  }, [roomId, chatRooms, isLoading, setSelectedChatRoom, selectedChatRoom]);

  return (
    <div
      className="flex min-h-screen"
      style={{
        backgroundColor: darkMode ? "#020617" : "#f3f4f6",
        color: darkMode ? "#e5e7eb" : "#0f172a",
      }}
    >
      <div className="w-full sm:w-1/3 sm:max-w-[456px] min-h-screen border-r border-gray-200/70 dark:border-slate-700/60">
        <ChatSidebar />
      </div>
      <div className="flex-1 hidden min-h-screen sm:flex">
        <ChatWindow />
      </div>
    </div>
  );
}

export default Chat;
