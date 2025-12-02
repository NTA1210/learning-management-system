import { create } from "zustand";
import type { ChatRoom } from "../context/ChatRoomContext";

export interface FloatingChat {
  chatRoom: ChatRoom;
  isMinimized: boolean;
}

interface FloatingChatState {
  openChats: FloatingChat[];
  maxChats: number;
  
  // Actions
  openChat: (chatRoom: ChatRoom) => void;
  closeChat: (chatRoomId: string) => void;
  minimizeChat: (chatRoomId: string) => void;
  maximizeChat: (chatRoomId: string) => void;
  toggleMinimize: (chatRoomId: string) => void;
  closeAllChats: () => void;
  bringToFront: (chatRoomId: string) => void;
}

export const useFloatingChatStore = create<FloatingChatState>((set, get) => ({
  openChats: [],
  maxChats: 3, // Maximum number of floating chats at once
  
  openChat: (chatRoom) => {
    const { openChats, maxChats } = get();
    
    // Check if already open
    const existingIndex = openChats.findIndex(
      (chat) => chat.chatRoom.chatRoomId === chatRoom.chatRoomId
    );
    
    if (existingIndex !== -1) {
      // If minimized, maximize it and bring to front
      set({
        openChats: [
          ...openChats.filter((_, i) => i !== existingIndex),
          { ...openChats[existingIndex], isMinimized: false },
        ],
      });
      return;
    }
    
    // Add new chat
    let newOpenChats = [...openChats, { chatRoom, isMinimized: false }];
    
    // If exceeds max, remove the oldest one
    if (newOpenChats.length > maxChats) {
      newOpenChats = newOpenChats.slice(1);
    }
    
    set({ openChats: newOpenChats });
  },
  
  closeChat: (chatRoomId) => {
    set({
      openChats: get().openChats.filter(
        (chat) => chat.chatRoom.chatRoomId !== chatRoomId
      ),
    });
  },
  
  minimizeChat: (chatRoomId) => {
    set({
      openChats: get().openChats.map((chat) =>
        chat.chatRoom.chatRoomId === chatRoomId
          ? { ...chat, isMinimized: true }
          : chat
      ),
    });
  },
  
  maximizeChat: (chatRoomId) => {
    set({
      openChats: get().openChats.map((chat) =>
        chat.chatRoom.chatRoomId === chatRoomId
          ? { ...chat, isMinimized: false }
          : chat
      ),
    });
  },
  
  toggleMinimize: (chatRoomId) => {
    set({
      openChats: get().openChats.map((chat) =>
        chat.chatRoom.chatRoomId === chatRoomId
          ? { ...chat, isMinimized: !chat.isMinimized }
          : chat
      ),
    });
  },
  
  closeAllChats: () => {
    set({ openChats: [] });
  },
  
  bringToFront: (chatRoomId) => {
    const { openChats } = get();
    const chatIndex = openChats.findIndex(
      (chat) => chat.chatRoom.chatRoomId === chatRoomId
    );
    
    if (chatIndex !== -1 && chatIndex !== openChats.length - 1) {
      const chat = openChats[chatIndex];
      set({
        openChats: [
          ...openChats.filter((_, i) => i !== chatIndex),
          chat,
        ],
      });
    }
  },
}));
