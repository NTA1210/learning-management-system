import { create } from "zustand";
import type { ChatRoom } from "../context/ChatRoomContext";

type ChatRoomState = {
  selectedChatRoom: ChatRoom | null;
  setSelectedChatRoom: (chatRoom: ChatRoom | null) => void;
};

export const useChatRoomStore = create<ChatRoomState>((set) => ({
  selectedChatRoom: null,
  setSelectedChatRoom: (chatRoom) => set({ selectedChatRoom: chatRoom }),
}));
