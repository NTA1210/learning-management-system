import type { JSX } from "react";
import ChatPlaceholder from "./ChatPlaceholder";

import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import { useChatRoomStore } from "../../stores/chatRoomStore";
import { useTheme } from "../../hooks/useTheme";

const ChatWindow = (): JSX.Element => {
  const { selectedChatRoom } = useChatRoomStore();
  const { darkMode } = useTheme();

  return (
    <div
      className="flex flex-col justify-between w-full max-h-screen min-h-screen"
      style={{
        backgroundColor: darkMode ? "#020617" : "#ffffff",
        color: darkMode ? "#e5e7eb" : "#0f172a",
      }}
    >
      {selectedChatRoom && <ChatHeader />}
      {selectedChatRoom && <MessageList />}
      {selectedChatRoom && <MessageInput />}
      {!selectedChatRoom && <ChatPlaceholder />}
    </div>
  );
};

export default ChatWindow;
