import { useEffect, useState, type RefObject } from "react";
import { useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Message } from "../services/messageService";
import { useSocketContext } from "../context/SocketContext";

export function useMessageListen(
  chatRoomId: string | undefined,
  containerRef: RefObject<HTMLDivElement | null>
) {
  const [user, setUser] = useState(null);
  const { socket } = useSocketContext();
  const queryClient = useQueryClient();

  useEffect(() => {
    const storedUser = localStorage.getItem("lms:user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    if (!chatRoomId || !socket) return;

    const handleSendMessageError = (error: { error: string }) =>
      toast.error(error.error);

    const handleNewMessage = (payload: {
      chatRoomId: string;
      message: Message;
    }) => {
      if (payload.chatRoomId !== chatRoomId) return;

      toast.success("Message sent successfully");

      queryClient.setQueryData(
        ["messages", chatRoomId],
        (
          currentData: InfiniteData<{
            messages: Message[];
            nextCursor: string;
            hasNext: boolean;
          }>
        ) => {
          if (!currentData || !currentData.pages.length) return currentData;

          const messages = currentData.pages.flatMap((page) => page.messages);
          if (
            messages.some(
              (message: Message) => message._id === payload.message._id
            )
          )
            return currentData;

          const updatesPages = [...currentData.pages];
          updatesPages[0] = {
            ...updatesPages[0],
            messages: [...updatesPages[0].messages, payload.message],
          };

          return { ...currentData, pages: updatesPages };
        }
      );

      setTimeout(() => {
        if (!containerRef.current) return;

        containerRef.current.scrollTo({
          top: containerRef.current.scrollHeight,
          behavior: "smooth",
        });
      }, 0);
    };

    socket.on("chatroom:new-message", handleNewMessage);
    socket.on("chatroom:send-message:error", handleSendMessageError);

    return () => {
      socket.off("chatroom:new-message", handleNewMessage);
      socket.off("chatroom:send-message:error", handleSendMessageError);
    };
  }, [chatRoomId, user, socket, queryClient]);
}
