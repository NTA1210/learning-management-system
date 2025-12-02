import { useEffect, useState } from "react";
import { useChatRoomsContext } from "../context/ChatRoomContext";

export const useUnreadChat = () => {
  const { chatRooms, isLoading } = useChatRoomsContext();
  const [isUnread, setIsUnread] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("lms:user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    if (!user || isLoading) return;

    const unread = chatRooms?.some((room) => {
      return room.unreadCounts?.[user._id] > 0;
    });

    setIsUnread(unread);
  }, [chatRooms, isLoading, user]);

  return { isUnread };
};
