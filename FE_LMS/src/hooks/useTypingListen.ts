import { useEffect, useState, type RefObject } from "react";
import { useSocketContext } from "../context/SocketContext";

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

  useEffect(() => {
    if (!socket || !userId || !containerRef) return;

    const handleTyping = (payload: { userId: string; isTyping: boolean }) => {
      if (payload.userId === userId) return;

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
  }, [socket, userId, containerRef]);

  return {
    isTyping,
  };
}
