import React, { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useSocketContext } from "./SocketContext";
import { toast } from "sonner";
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
  logo: string;
  unreadCounts: any;
  participants: User[];
  lastMessage: {
    senderId: any;
    content: string;
    timestamp: Date;
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
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("lms:user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    if (data) {
      setChatRooms(data);
    }
  }, [data]);

  const handleNewConversation = (chatRoom: ChatRoom) => {
    console.log("Conversation:accept", chatRoom);

    setChatRooms((prev: ChatRoom[]) => {
      return [...prev, chatRoom];
    });
  };

  const handleErrorNewConversation = () => {
    toast.error("Couldn't create conversation");
  };
  const handleConversationMarkAsReadError = () => {
    toast.error("Failed to mark conversation as read");
  };

  const handleChatRoomUpdate = ({
    chatRoomId,
    lastMessage,
    unreadCounts,
  }: {
    chatRoomId: string;
    lastMessage: any;
    unreadCounts: any;
  }) => {
    console.log(unreadCounts);

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
  };

  const handleChatRoomUpdateUnreadCounts = ({
    chatRoomId,
    unreadCounts,
  }: {
    chatRoomId: string;
    unreadCounts: any;
  }) => {
    setChatRooms((prev: ChatRoom[]) => {
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

  useEffect(() => {
    socket?.on("conversation:accept", handleNewConversation);
    socket?.on("conversation:request:error", handleErrorNewConversation);
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

    return () => {
      socket?.off("conversation:accept", handleNewConversation);
      socket?.off("conversation:request:error", handleErrorNewConversation);
      socket?.off(
        "chatroom:mark-as-read:error",
        handleConversationMarkAsReadError
      );
      socket?.off("chatroom:update-chatroom", handleChatRoomUpdate);
      socket?.off(
        "chatroom:update-unread-counts",
        handleChatRoomUpdateUnreadCounts
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
