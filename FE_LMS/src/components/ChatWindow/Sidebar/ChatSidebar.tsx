import type { JSX } from "react";
import { useChatRoomsContext } from "../../../context/ChatRoomContext";
import ChatRoomItem from "./ChatRoomItem";
import Header from "./Header";

const ChatSidebar = (): JSX.Element => {
  const { chatRooms, isLoading, isError } = useChatRoomsContext();

  if (isLoading) {
    return (
      <div className="items-center justify-center flex-1 h-full">
        <div className="rounded-full size-10 bg-sky-200 animate-bounce"></div>
      </div>
    );
  }

  if (isError) {
    return <div>Something went wrong</div>;
  }

  return (
    <div>
      <Header />
      {chatRooms.map((chatRoom) => {
        return (
          <div key={chatRoom.chatRoomId} className="text-black">
            <ChatRoomItem {...chatRoom} />
          </div>
        );
      })}
    </div>
  );
};

export default ChatSidebar;
