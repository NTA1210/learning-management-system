import type { JSX } from "react";
import ChatPlaceholder from "./ChatPlaceholder";

import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import { useChatRoomStore } from "../../stores/chatRoomStore";

const ChatWindow = (): JSX.Element => {
  const { selectedChatRoom } = useChatRoomStore();
  return (
    <div className="flex flex-col justify-between w-full max-h-screen min-h-screen bg-white">
      {selectedChatRoom && <ChatHeader />}
      {selectedChatRoom && <MessageList />}
      {selectedChatRoom && <MessageInput />}
      {!selectedChatRoom && <ChatPlaceholder />}
    </div>
  );
};

export default ChatWindow;
