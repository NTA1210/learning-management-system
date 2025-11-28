import { useEffect, useRef, useState } from "react";
import MessageItem from "./MessageItem";

import TypingIndicator from "./TypingIndicator";
import { useChatRoomStore } from "../../stores/chatRoomStore";
import { useMessages } from "../../hooks/useMessages";
import { useSocketContext } from "../../context/SocketContext";
import { useMessageListen } from "../../hooks/useMessageListen";
import { useTypingListen } from "../../hooks/useTypingListen";
import FileMessageItem from "./FileMessageItem";

const MessageList: React.FC = () => {
  const { selectedChatRoom } = useChatRoomStore();
  const [user, setUser] = useState(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { data, isLoading, isFetchingNextPage, handleLoadMore, hasNextPage } =
    useMessages(selectedChatRoom?.chatRoomId, containerRef);

  const { socket } = useSocketContext();
  const previousChatRoomIdRef = useRef<string | null>(null);

  console.log(data);

  const allMessages =
    data?.pages
      .slice()
      .reverse()
      .flatMap((page) => page.messages) ?? [];

  useEffect(() => {
    const storedUser = localStorage.getItem("lms:user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    if (!selectedChatRoom?.chatRoomId) return;

    if (
      data?.pages.length &&
      previousChatRoomIdRef.current !== selectedChatRoom.chatRoomId
    ) {
      setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
      }, 0);

      previousChatRoomIdRef.current = selectedChatRoom.chatRoomId;
    }

    socket?.emit("chatroom:mark-as-read", {
      chatRoomId: selectedChatRoom?.chatRoomId,
      userId: (user as any)?._id,
    });
  }, [data, selectedChatRoom, socket, user]);

  useMessageListen(selectedChatRoom?.chatRoomId, containerRef);

  const { isTyping } = useTypingListen((user as any)?._id, containerRef);

  if (isLoading) {
    return (
      <div className="relative flex items-center justify-center flex-1 h-full">
        <div className="rounded-full size-10 bg-sky-100 animate-pulse"></div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 p-4 pb-10 overflow-y-auto bg-gray-50"
    >
      {hasNextPage && (
        <div className="flex justify-center mb-4">
          <button
            type="button"
            className="px-2 py-1 text-xs text-white transition-colors bg-gray-300 rounded-lg cursor-pointer hover:bg-gray-400 "
            onClick={handleLoadMore}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? "Loading..." : "Load More"}
          </button>
        </div>
      )}

      {allMessages.map((message, index) => {
        if ("content" in message) {
          return <MessageItem key={index} {...message} />;
        } else if ("file" in message) {
          return <FileMessageItem key={index} {...(message as any)} />;
        }
      })}

      {isTyping && <TypingIndicator />}
    </div>
  );
};

export default MessageList;
