import { create } from "zustand";

export interface Participant {
  oderId: string;
  odername: string;
  oderAvatar?: string;
  stream?: MediaStream;
  isMuted?: boolean;
  isVideoOff?: boolean;
}

export interface IncomingCall {
  callId: string;
  chatRoomId: string;
  chatRoomName: string;
  callerId: string;
  callerName: string;
  callerAvatar?: string;
  isGroupCall: boolean;
  participants: string[];
}

interface VideoCallState {
  // Call state
  isInCall: boolean;
  callId: string | null;
  chatRoomId: string | null;
  
  // Media state
  localStream: MediaStream | null;
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  
  // Participants
  participants: Map<string, Participant>;
  
  // Incoming call
  incomingCall: IncomingCall | null;
  
  // UI state
  isCallMinimized: boolean;
  
  // Actions
  setIsInCall: (isInCall: boolean) => void;
  setCallId: (callId: string | null) => void;
  setChatRoomId: (chatRoomId: string | null) => void;
  setLocalStream: (stream: MediaStream | null) => void;
  setIsMuted: (isMuted: boolean) => void;
  setIsVideoOff: (isVideoOff: boolean) => void;
  setIsScreenSharing: (isScreenSharing: boolean) => void;
  setIncomingCall: (call: IncomingCall | null) => void;
  setIsCallMinimized: (minimized: boolean) => void;
  
  // Participant management
  addParticipant: (userId: string, participant: Participant) => void;
  removeParticipant: (userId: string) => void;
  updateParticipantStream: (userId: string, stream: MediaStream) => void;
  clearParticipants: () => void;
  
  // Reset
  resetCall: () => void;
}

export const useVideoCallStore = create<VideoCallState>((set, get) => ({
  // Initial state
  isInCall: false,
  callId: null,
  chatRoomId: null,
  localStream: null,
  isMuted: false,
  isVideoOff: false,
  isScreenSharing: false,
  participants: new Map(),
  incomingCall: null,
  isCallMinimized: false,
  
  // Actions
  setIsInCall: (isInCall) => set({ isInCall }),
  setCallId: (callId) => set({ callId }),
  setChatRoomId: (chatRoomId) => set({ chatRoomId }),
  setLocalStream: (stream) => set({ localStream: stream }),
  setIsMuted: (isMuted) => set({ isMuted }),
  setIsVideoOff: (isVideoOff) => set({ isVideoOff }),
  setIsScreenSharing: (isScreenSharing) => set({ isScreenSharing }),
  setIncomingCall: (call) => set({ incomingCall: call }),
  setIsCallMinimized: (minimized) => set({ isCallMinimized: minimized }),
  
  // Participant management
  addParticipant: (userId, participant) => {
    console.log("[Store] Adding participant:", userId, participant);
    const newParticipants = new Map(get().participants);
    // Preserve existing stream if participant already exists
    const existing = newParticipants.get(userId);
    if (existing?.stream && !participant.stream) {
      participant.stream = existing.stream;
    }
    newParticipants.set(userId, participant);
    set({ participants: newParticipants });
  },
  
  removeParticipant: (userId) => {
    console.log("[Store] Removing participant:", userId);
    const newParticipants = new Map(get().participants);
    newParticipants.delete(userId);
    set({ participants: newParticipants });
  },
  
  updateParticipantStream: (userId, stream) => {
    console.log("[Store] Updating participant stream:", userId, stream?.getTracks());
    const newParticipants = new Map(get().participants);
    const participant = newParticipants.get(userId);
    if (participant) {
      newParticipants.set(userId, { ...participant, stream });
      set({ participants: newParticipants });
    } else {
      // If participant doesn't exist, create them with the stream
      console.log("[Store] Participant not found, creating with stream:", userId);
      newParticipants.set(userId, {
        oderId: userId,
        odername: `User ${userId.substring(0, 6)}`,
        stream,
      });
      set({ participants: newParticipants });
    }
  },
  
  clearParticipants: () => set({ participants: new Map() }),
  
  // Reset entire call state
  resetCall: () => {
    const { localStream } = get();
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    set({
      isInCall: false,
      callId: null,
      chatRoomId: null,
      localStream: null,
      isMuted: false,
      isVideoOff: false,
      isScreenSharing: false,
      participants: new Map(),
      incomingCall: null,
      isCallMinimized: false,
    });
  },
}));
