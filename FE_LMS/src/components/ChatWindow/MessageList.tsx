import { useEffect, useRef, useState } from "react";
import MessageItem from "./MessageItem";

import TypingIndicator from "./TypingIndicator";
import { useChatRoomStore } from "../../stores/chatRoomStore";
import { useMessages } from "../../hooks/useMessages";
import { useSocketContext } from "../../context/SocketContext";
import { useMessageListen } from "../../hooks/useMessageListen";
import { useTypingListen } from "../../hooks/useTypingListen";
import FileMessageItem from "./FileMessageItem";
import { useTheme } from "../../hooks/useTheme";
import type { Message } from "../../services/messageService";

const MessageList: React.FC = () => {
  const { selectedChatRoom } = useChatRoomStore();
  const [user, setUser] = useState(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { data, isLoading, isFetchingNextPage, handleLoadMore, hasNextPage } =
    useMessages(selectedChatRoom?.chatRoomId, containerRef);

  const { socket } = useSocketContext();
  const { darkMode } = useTheme();
  const previousChatRoomIdRef = useRef<string | null>(null);

  console.log(data);

  const allMessages: Message[] =
    (data?.pages
      .slice()
      .reverse()
      .flatMap((page) => page.messages) as Message[]) ?? [];

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
        <div className="rounded-full size-10 bg-indigo-100 animate-pulse"></div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 p-4 pb-10 overflow-y-auto"
      style={{
        backgroundColor: darkMode ? "#020617" : "#f9fafb",
      }}
    >
      {hasNextPage && (
        <div className="flex justify-center mb-4">
          <button
            type="button"
            className="px-2 py-1 text-xs text-white transition-colors bg-indigo-600 rounded-lg cursor-pointer hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleLoadMore}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? "Loading..." : "Load More"}
          </button>
        </div>
      )}

      {allMessages.map((message, index) => {
        const prev = allMessages[index - 1];
        const next = allMessages[index + 1];

        const isNotification = "isNotification" in message && message.isNotification;

        const samePrevSender =
          !!prev &&
          "senderId" in prev &&
          "senderId" in message &&
          (prev as any).senderId?._id === (message as any).senderId?._id &&
          !(prev as any).isNotification &&
          !isNotification;

        const sameNextSender =
          !!next &&
          "senderId" in next &&
          "senderId" in message &&
          (next as any).senderId?._id === (message as any).senderId?._id &&
          !(next as any).isNotification &&
          !isNotification;

        const isFirstInBlock = !samePrevSender;
        const isLastInBlock = !sameNextSender;

        if ("content" in message) {
          return (
            <MessageItem
              key={message._id ?? index}
              {...(message as any)}
              isFirstInBlock={isFirstInBlock}
              isLastInBlock={isLastInBlock}
            />
          );
        } else if ("file" in message) {
          return (
            <FileMessageItem
              key={message._id ?? index}
              {...(message as any)}
              isFirstInBlock={isFirstInBlock}
              isLastInBlock={isLastInBlock}
            />
          );
        }

        return null;
      })}

      {isTyping && <TypingIndicator />}
    </div>
  );
};

export default MessageList;
