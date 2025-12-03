import { useCallback, useEffect, useMemo } from "react";
import { useVideoCallStore } from "../stores/videoCallStore";
import { useSocketContext } from "../context/SocketContext";
import { webRTCService } from "../services/webrtcService";
import toast from "react-hot-toast";

export const useVideoCall = () => {
  const {
    isInCall,
    callId,
    chatRoomId,
    localStream,
    isMuted,
    isVideoOff,
    isScreenSharing,
    isCallMinimized,
    participants,
    incomingCall,
    setIsInCall,
    setCallId,
    setChatRoomId,
    setLocalStream,
    setIsMuted,
    setIsVideoOff,
    setIncomingCall,
    addParticipant,
    resetCall,
  } = useVideoCallStore();

  const { socket } = useSocketContext();

  // Get current user
  const currentUser = useMemo(() => {
    const stored = localStorage.getItem("lms:user");
    return stored ? JSON.parse(stored) : null;
  }, []);

  // Set up socket listeners for incoming calls
  useEffect(() => {
    if (!socket) return;

    // Handle incoming call notification
    const handleIncomingCall = (data: {
      callId: string;
      chatRoomId: string;
      callType: string;
      caller: {
        id: string;
        username: string;
        avatar_url?: string;
      };
    }) => {
      // Don't show if we're the caller or already in a call
      if (data.caller.id === currentUser?._id || isInCall) return;

      console.log("Incoming call:", data);
      setIncomingCall({
        callId: data.callId,
        chatRoomId: data.chatRoomId,
        chatRoomName: data.chatRoomId, // We can get this from chatroom store if needed
        callerId: data.caller.id,
        callerName: data.caller.username,
        callerAvatar: data.caller.avatar_url,
        isGroupCall: true,
        participants: [data.caller.id],
      });

      // Play ringtone (you can add an audio element)
      toast(`Incoming call from ${data.caller.username}`, {
        icon: "📞",
        duration: 10000,
      });
    };

    // Handle call ended by host
    const handleCallEnded = (data: { callId: string }) => {
      if (callId === data.callId) {
        toast("Call ended", { icon: "📴" });
        webRTCService.cleanup();
        resetCall();
      }
      // Also clear incoming call if it was declined/ended
      if (incomingCall?.callId === data.callId) {
        setIncomingCall(null);
      }
    };

    // Handle call rejected by someone
    const handleCallRejected = (data: { callId: string; rejectedBy: { id: string; username: string } }) => {
      toast(`${data.rejectedBy.username} declined the call`, { icon: "📴" });
    };

    socket.on("videocall:incoming-call", handleIncomingCall);
    socket.on("videocall:call-ended", handleCallEnded);
    socket.on("videocall:call-rejected", handleCallRejected);

    return () => {
      socket.off("videocall:incoming-call", handleIncomingCall);
      socket.off("videocall:call-ended", handleCallEnded);
      socket.off("videocall:call-rejected", handleCallRejected);
    };
  }, [socket, currentUser, isInCall, callId, incomingCall, setIncomingCall, resetCall]);

  // Start a new call
  const startCall = useCallback(async (targetChatRoomId: string, _chatRoomName: string) => {
    if (!socket || !currentUser) {
      toast.error("Not connected");
      return;
    }

    if (isInCall) {
      toast.error("Already in a call");
      return;
    }

    try {
      // Get local media stream
      const stream = await webRTCService.getLocalStream(true, true);
      setLocalStream(stream);

      // Initialize WebRTC service with handlers
      webRTCService.initialize(socket, currentUser._id, {
        onRemoteStream: (userId, remoteStream) => {
          console.log("[useVideoCall] Remote stream received for:", userId);
          const state = useVideoCallStore.getState();
          if (!state.participants.has(userId)) {
            state.addParticipant(userId, {
              oderId: userId,
              odername: `User ${userId.substring(0, 6)}`,
              stream: remoteStream,
            });
          } else {
            state.updateParticipantStream(userId, remoteStream);
          }
        },
        onPeerDisconnected: (userId) => {
          console.log("[useVideoCall] Peer disconnected:", userId);
          useVideoCallStore.getState().removeParticipant(userId);
        },
        onConnectionStateChange: (userId, state) => {
          console.log(`[useVideoCall] Connection with ${userId}: ${state}`);
        },
      });

      setChatRoomId(targetChatRoomId);
      setIsInCall(true);

      // Notify server to start call - backend will generate callId
      socket.emit("videocall:start", {
        chatRoomId: targetChatRoomId,
        callType: "video",
      });

      // Listen for call started confirmation
      socket.once("videocall:call-started", (data: { callId: string }) => {
        console.log("[useVideoCall] Call started with ID:", data.callId);
        setCallId(data.callId);
      });

      toast.success("Starting call...");
    } catch (error: unknown) {
      console.error("Failed to start call:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to access camera/microphone";
      toast.error(errorMessage);
      resetCall();
    }
  }, [socket, currentUser, isInCall, setLocalStream, setCallId, setChatRoomId, setIsInCall, resetCall]);

  // Accept incoming call
  const acceptCall = useCallback(async () => {
    if (!socket || !currentUser || !incomingCall) {
      toast.error("Cannot accept call");
      return;
    }

    try {
      // Get local media stream
      const stream = await webRTCService.getLocalStream(true, true);
      setLocalStream(stream);

      setCallId(incomingCall.callId);
      setChatRoomId(incomingCall.chatRoomId);
      setIsInCall(true);
      setIncomingCall(null);

      // Initialize WebRTC service with handlers
      webRTCService.initialize(socket, currentUser._id, {
        onRemoteStream: (userId, remoteStream) => {
          console.log("[useVideoCall] Remote stream received for:", userId);
          const state = useVideoCallStore.getState();
          if (!state.participants.has(userId)) {
            state.addParticipant(userId, {
              oderId: userId,
              odername: `User ${userId.substring(0, 6)}`,
              stream: remoteStream,
            });
          } else {
            state.updateParticipantStream(userId, remoteStream);
          }
        },
        onPeerDisconnected: (userId) => {
          console.log("[useVideoCall] Peer disconnected:", userId);
          useVideoCallStore.getState().removeParticipant(userId);
        },
        onConnectionStateChange: (userId, state) => {
          console.log(`[useVideoCall] Connection with ${userId}: ${state}`);
        },
      });

      // Add the caller as a participant
      addParticipant(incomingCall.callerId, {
        oderId: incomingCall.callerId,
        odername: incomingCall.callerName,
        oderAvatar: incomingCall.callerAvatar,
      });

      // Notify server we're joining
      socket.emit("videocall:join", {
        callId: incomingCall.callId,
        chatRoomId: incomingCall.chatRoomId,
      });

      toast.success("Joined call");
    } catch (error: unknown) {
      console.error("Failed to accept call:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to access camera/microphone";
      toast.error(errorMessage);
      setIncomingCall(null);
    }
  }, [socket, currentUser, incomingCall, setLocalStream, setCallId, setChatRoomId, setIsInCall, setIncomingCall, addParticipant]);

  // Decline incoming call
  const declineCall = useCallback(() => {
    if (!socket || !incomingCall) return;

    socket.emit("videocall:reject", {
      callId: incomingCall.callId,
      callerId: incomingCall.callerId,
    });

    setIncomingCall(null);
    toast("Call declined", { icon: "📴" });
  }, [socket, incomingCall, setIncomingCall]);

  // Join an ongoing call in a chat room
  const joinCall = useCallback(async (targetCallId: string, targetChatRoomId: string) => {
    if (!socket || !currentUser) {
      toast.error("Not connected");
      return;
    }

    if (isInCall) {
      toast.error("Already in a call");
      return;
    }

    try {
      // Get local media stream
      const stream = await webRTCService.getLocalStream(true, true);
      setLocalStream(stream);

      // Initialize WebRTC service with handlers
      webRTCService.initialize(socket, currentUser._id, {
        onRemoteStream: (userId, remoteStream) => {
          console.log("[useVideoCall] Remote stream received for:", userId);
          const state = useVideoCallStore.getState();
          if (!state.participants.has(userId)) {
            state.addParticipant(userId, {
              oderId: userId,
              odername: `User ${userId.substring(0, 6)}`,
              stream: remoteStream,
            });
          } else {
            state.updateParticipantStream(userId, remoteStream);
          }
        },
        onPeerDisconnected: (userId) => {
          console.log("[useVideoCall] Peer disconnected:", userId);
          useVideoCallStore.getState().removeParticipant(userId);
        },
        onConnectionStateChange: (userId, state) => {
          console.log(`[useVideoCall] Connection with ${userId}: ${state}`);
        },
      });

      setCallId(targetCallId);
      setChatRoomId(targetChatRoomId);
      setIsInCall(true);

      // Notify server we're joining
      socket.emit("videocall:join", {
        callId: targetCallId,
        chatRoomId: targetChatRoomId,
      });

      toast.success("Joining call...");
    } catch (error: unknown) {
      console.error("Failed to join call:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to access camera/microphone";
      toast.error(errorMessage);
      resetCall();
    }
  }, [socket, currentUser, isInCall, setLocalStream, setCallId, setChatRoomId, setIsInCall, resetCall]);

  // End current call
  const endCall = useCallback(() => {
    if (!socket || !callId) return;

    socket.emit("videocall:leave", {
      callId,
    });

    webRTCService.cleanup();
    resetCall();
    toast("Call ended", { icon: "📴" });
  }, [socket, callId, resetCall]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    webRTCService.toggleAudio(!newMuted);
  }, [isMuted, setIsMuted]);

  // Toggle video
  const toggleVideo = useCallback(() => {
    const newVideoOff = !isVideoOff;
    setIsVideoOff(newVideoOff);
    webRTCService.toggleVideo(!newVideoOff);
  }, [isVideoOff, setIsVideoOff]);

  return {
    // State
    isInCall,
    callId,
    chatRoomId,
    localStream,
    isMuted,
    isVideoOff,
    isScreenSharing,
    isCallMinimized,
    participants,
    incomingCall,

    // Actions
    startCall,
    joinCall,
    acceptCall,
    declineCall,
    endCall,
    toggleMute,
    toggleVideo,
  };
};
