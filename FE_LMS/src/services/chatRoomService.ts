import http from "../utils/http";

export const chatRoomService = {
  fetchChatRooms: async () => {
    const response = await http.get("/chat-rooms");
    return response.data;
  },
};
