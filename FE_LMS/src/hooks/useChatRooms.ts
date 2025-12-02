import { useQuery } from "@tanstack/react-query";
import { chatRoomService } from "../services/chatRoomService";

export function useChatRooms() {
  return useQuery({
    queryKey: ["chatRooms"],
    queryFn: chatRoomService.fetchChatRooms,
    retry: false,
  });
}
