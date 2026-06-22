import { useQuery } from "@tanstack/react-query";
import { chatRoomService } from "../services/chatRoomService";

export function useChatRooms() {
  const hasAuthSession =
    typeof window !== "undefined" &&
    localStorage.getItem("isAuthenticated") === "true" &&
    Boolean(localStorage.getItem("userData"));

  return useQuery({
    queryKey: ["chatRooms"],
    queryFn: chatRoomService.fetchChatRooms,
    enabled: hasAuthSession,
    retry: false,
  });
}
