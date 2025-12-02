import type { JSX } from "react";
import {
  useChatRoomsContext,
  type ChatRoom,
} from "../../../context/ChatRoomContext";
import ChatRoomItem from "./ChatRoomItem";
import Header from "./Header";
import { useTheme } from "../../../hooks/useTheme";

const ChatSidebar = (): JSX.Element => {
  const { chatRooms = [], isLoading, isError } = useChatRoomsContext();
  const { darkMode } = useTheme();

  if (isLoading) {
    return (
      <div className="items-center justify-center flex-1 h-full">
        <div className="rounded-full size-10 bg-indigo-200 animate-bounce"></div>
      </div>
    );
  }

  if (isError) {
    return <div>Something went wrong</div>;
  }

  return (
    <div
      style={{
        backgroundColor: darkMode ? "rgba(26, 32, 44, 0.95)" : "#ffffff",
      }}
    >
      <Header />
      {chatRooms
        .sort(
          (a: ChatRoom, b: ChatRoom) =>
            new Date(b?.lastMessage?.timestamp).getTime() -
            new Date(a?.lastMessage?.timestamp).getTime()
        )
        .map((chatRoom, index) => {
          return (
            <div key={chatRoom.chatRoomId || index}>
              <ChatRoomItem {...chatRoom} />
            </div>
          );
        })}
    </div>
  );
};

export default ChatSidebar;
