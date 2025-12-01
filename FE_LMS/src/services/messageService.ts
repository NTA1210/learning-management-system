import http from "../utils/http";

export type Message = {
  _id: string;
  chatRoomId: string;
  senderId: {
    _id: string;
    username: string;
    avatar_url: string;
  };
  content: string;
  isLink: boolean;
  isNotification: boolean;
  file: string;
  createdAt: string;
};

interface MessagesResponse {
  messages: Message[];
  nextCursor: string | undefined;
  hasNext: boolean;
}

export const messageService = {
  fetchMessages: async (
    conversationId: string,
    cursor?: string
  ): Promise<MessagesResponse> => {
    const response = await http.get(`/chat-rooms/${conversationId}/messages`, {
      params: { cursor },
    });
    return (response as any).data;
  },
};
