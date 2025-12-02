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
      className="flex min-h-screen"
      style={{
        backgroundColor: darkMode ? "#020617" : "#f3f4f6",
        color: darkMode ? "#e5e7eb" : "#0f172a",
      }}
    >
      {/* Sidebar - hidden on mobile when a chat is selected */}
      <div className={`w-full sm:w-1/3 sm:max-w-[456px] min-h-screen border-r border-gray-200/70 dark:border-slate-700/60 ${selectedChatRoom ? 'hidden sm:block' : 'block'}`}>
        <ChatSidebar />
      </div>
      {/* Chat Window - shown on mobile only when a chat is selected, always shown on desktop */}
      <div className={`flex-1 min-h-screen ${selectedChatRoom ? 'flex' : 'hidden sm:flex'}`}>
        <ChatWindow />
      </div>
    </div>
  );
}

export default Chat;
