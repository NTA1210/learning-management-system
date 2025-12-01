import { useEffect, useState, type RefObject } from "react";
import { useSocketContext } from "../context/SocketContext";
import { useChatRoomStore } from "../stores/chatRoomStore";

const isNearBottom = (containerRef: RefObject<HTMLDivElement | null>) => {
  if (!containerRef.current) return false;
  const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
  return scrollTop + clientHeight >= scrollHeight - 100;
};

export function useTypingListen(
  userId: string | undefined,
  containerRef: RefObject<HTMLDivElement | null>
) {
  const { socket } = useSocketContext();
  const [isTyping, setIsTyping] = useState(false);
  const { selectedChatRoom } = useChatRoomStore();

  useEffect(() => {
    if (!socket || !userId || !containerRef) return;

    const handleTyping = (payload: {
      userId: string;
      isTyping: boolean;
      chatRoomId: string;
    }) => {
      if (payload.userId === userId) return;
      if (payload.chatRoomId !== selectedChatRoom?.chatRoomId) return;

      setIsTyping(payload.isTyping);
      const wasNearBottom = isNearBottom(containerRef);

      if (payload.isTyping && wasNearBottom) {
        setTimeout(() => {
          if (!containerRef.current) return;
          containerRef.current.scrollTo({
            top: containerRef.current.scrollHeight,
            behavior: "smooth",
          });
        });
      }
    };

    socket.on("conversation:update-typing", handleTyping);

    return () => {
      socket.off("conversation:update-typing", handleTyping);
    };
  }, [socket, userId, containerRef, selectedChatRoom]);

  return {
    isTyping,
  };
}
