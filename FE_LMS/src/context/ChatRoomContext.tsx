import React, { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useSocketContext } from "./SocketContext";
import { toast } from "react-hot-toast";
import { useChatRooms } from "../hooks/useChatRooms";

export type User = {
  _id: string;
  fullname: string;
  username: string;
  email: string;
  avatarUrl: string;
};

export type Course = {
  title: string;
  subjectId: string;
  startDate: Date;
  endDate: Date;
  logo?: string;
  semesterId: string;
};

export type ChatRoom = {
  chatRoomId: string;
  name: string;
  course: Course;
  unreadCounts: any;
  participants: User[];
  lastMessage: {
    senderId: any;
    content: string;
    timestamp: Date;
    isNotification: boolean;
  };
};

type ChatRoomsContextType = {
  chatRooms: ChatRoom[];
  searchTerm: string;
  setSearchTerm: (searchTerm: string) => void;
  isLoading: boolean;
  isError: boolean;
};

const ChatRoomsContext = createContext<ChatRoomsContextType | undefined>(
  undefined
);

export const useChatRoomsContext = () => {
  const context = useContext(ChatRoomsContext);
  if (!context) {
    throw new Error(
      "useChatRoomsContext must be used within a ChatRoomsProvider"
    );
  }
  return context;
};

type ChatRoomsProviderProps = {
  children: ReactNode;
};

export const ChatRoomsProvider: React.FC<{ children: ReactNode }> = ({
  children,
}: ChatRoomsProviderProps) => {
  const { data, isLoading, isError } = useChatRooms();
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const { socket } = useSocketContext();

  useEffect(() => {
    if (data) {
      setChatRooms(data);
    }
  }, [data]);

  console.log(chatRooms);

  const handleConversationMarkAsReadError = () => {
    toast.error("Failed to mark conversation as read");
  };

  const handleChatRoomUpdate = ({
    chatRoomId,
    name,
    course,
    participants,
    lastMessage,
    unreadCounts,
  }: {
    chatRoomId: string;
    name: string;
    course: any;
    participants: any;
    lastMessage: any;
    unreadCounts: any;
  }) => {
    if (chatRooms.length === 0) {
      return setChatRooms((prev: ChatRoom[] = []) => {
        return [
          {
            chatRoomId,
            name,
            course,
            participants,
            lastMessage,
            unreadCounts: unreadCounts,
          },
        ];
      });
    } else {
      setChatRooms((prev: ChatRoom[]) => {
        return prev.map((chatRoom) => {
          if (chatRoom.chatRoomId === chatRoomId) {
            return {
              ...chatRoom,
              lastMessage,
              unreadCounts: unreadCounts,
            };
          }
          return chatRoom;
        });
      });
    }
  };

  const handleChatRoomUpdateUnreadCounts = ({
    chatRoomId,
    unreadCounts,
  }: {
    chatRoomId: string;
    unreadCounts: any;
  }) => {
    setChatRooms((prev: ChatRoom[] = []) => {
      return prev.map((chatRoom) => {
        if (chatRoom.chatRoomId === chatRoomId) {
          return {
            ...chatRoom,
            unreadCounts,
          };
        }
        return chatRoom;
      });
    });
  };

  const handleChatRoomSendMessageError = () => {
    toast.error("Failed to send message");
  };

  const handleChatRoomInviteError = (error: any) => {
    toast.error(error || "Failed to invite user");
  };

  const handleLeaveChatroomSuccess = ({
    chatRoomId,
  }: {
    chatRoomId: string;
  }) => {
    setChatRooms((prev: ChatRoom[] = []) => {
      if (prev && prev.length === 0) return prev;
      return prev.filter((chatRoom) => chatRoom.chatRoomId !== chatRoomId);
    });
  };

  useEffect(() => {
    socket?.on(
      "conversation:mark-as-read:error",
      handleConversationMarkAsReadError
    );
    socket?.on("chatroom:update-chatroom", handleChatRoomUpdate);
    socket?.on(
      "chatroom:update-unread-counts",
      handleChatRoomUpdateUnreadCounts
    );
    socket?.on("chatroom:send-message:error", handleChatRoomSendMessageError);
    socket?.on("chatroom:invite-user:error", (errorMessage) =>
      handleChatRoomInviteError(errorMessage)
    );
    socket?.on("chatroom:leave-chatroom:success", handleLeaveChatroomSuccess);

    return () => {
      socket?.off(
        "chatroom:mark-as-read:error",
        handleConversationMarkAsReadError
      );
      socket?.off("chatroom:update-chatroom", handleChatRoomUpdate);
      socket?.off(
        "chatroom:update-unread-counts",
        handleChatRoomUpdateUnreadCounts
      );
      socket?.off(
        "chatroom:send-message:error",
        handleChatRoomSendMessageError
      );

      socket?.off("chatroom:invite-user:error", handleChatRoomInviteError);
      socket?.off(
        "chatroom:leave-chatroom:success",
        handleLeaveChatroomSuccess
      );
    };
  }, [socket]);

  return (
    <ChatRoomsContext.Provider
      value={{
        chatRooms,
        searchTerm,
        setSearchTerm,
        isLoading,
        isError,
      }}
    >
      {children}
    </ChatRoomsContext.Provider>
  );
};
