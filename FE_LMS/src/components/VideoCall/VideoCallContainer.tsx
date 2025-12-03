import React, { useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { useVideoCallStore } from "../../stores/videoCallStore";
import { useSocketContext } from "../../context/SocketContext";
import { webRTCService } from "../../services/webrtcService";
import VideoTile from "./VideoTile";
import CallControls from "./CallControls";
import toast from "react-hot-toast";

const VideoCallContainer: React.FC = () => {
  const {
    isInCall,
    callId,
    localStream,
    isMuted,
    isVideoOff,
    isScreenSharing,
    isCallMinimized,
    participants,
    setIsMuted,
    setIsVideoOff,
    setIsScreenSharing,
    setIsCallMinimized,
    addParticipant,
    resetCall,
  } = useVideoCallStore();

  const { socket } = useSocketContext();

  // Get current user
  const currentUser = useMemo(() => {
    const stored = localStorage.getItem("lms:user");
    return stored ? JSON.parse(stored) : null;
  }, []);

  // Set local stream to WebRTC service when it changes
  useEffect(() => {
    if (!isInCall || !localStream) return;

    console.log("[VideoCall] Setting local stream to WebRTC service");
    webRTCService.setLocalStream(localStream);
  }, [isInCall, localStream]);

  // Handle participant updates from socket
  useEffect(() => {
    if (!socket || !isInCall || !callId) return;

    const handleParticipantJoined = (data: {
      userId: string;
      userName: string;
      userAvatar?: string;
    }) => {
      console.log("[VideoCall] Participant joined event:", data);
      
      // Add participant (stream will be added when WebRTC connects)
      addParticipant(data.userId, {
        oderId: data.userId,
        odername: data.userName,
        oderAvatar: data.userAvatar,
      });
      toast(`${data.userName} joined the call`, { icon: "👋" });
    };

    const handlePeerJoined = async (data: {
      callId: string;
      peerId: string;
      peerInfo: {
        id: string;
        username: string;
        avatar_url?: string;
      };
    }) => {
      console.log("[VideoCall] Peer joined, creating offer for:", data.peerId);
      
      // Add participant first
      addParticipant(data.peerId, {
        oderId: data.peerId,
        odername: data.peerInfo.username || `User ${data.peerId.substring(0, 6)}`,
        oderAvatar: data.peerInfo.avatar_url,
      });

      toast(`${data.peerInfo.username} joined the call`, { icon: "👋" });

      // Create offer for the new peer
      try {
        await webRTCService.createOffer(data.peerId, data.callId);
      } catch (error) {
        console.error("[VideoCall] Failed to create offer:", error);
      }
    };

    // Handle list of existing participants when joining
    // NOTE: We do NOT create offers here - existing participants will create offers to us
    // This prevents "glare" condition where both sides try to be the offerer
    const handleExistingParticipants = (data: {
      callId: string;
      participants: string[];
    }) => {
      console.log("[VideoCall] Existing participants (waiting for their offers):", data.participants);
      
      // Just add participants - they will send us offers
      for (const participantId of data.participants) {
        if (participantId !== currentUser?._id) {
          addParticipant(participantId, {
            oderId: participantId,
            odername: `User ${participantId.substring(0, 6)}`,
          });
        }
      }
    };

    socket.on("videocall:participant-joined", handleParticipantJoined);
    socket.on("videocall:peer-joined", handlePeerJoined);
    socket.on("videocall:existing-participants", handleExistingParticipants);

    return () => {
      socket.off("videocall:participant-joined", handleParticipantJoined);
      socket.off("videocall:peer-joined", handlePeerJoined);
      socket.off("videocall:existing-participants", handleExistingParticipants);
    };
  }, [socket, isInCall, callId, currentUser, addParticipant]);

  const handleToggleMute = useCallback(() => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    webRTCService.toggleAudio(!newMuted);
  }, [isMuted, setIsMuted]);

  const handleToggleVideo = useCallback(() => {
    const newVideoOff = !isVideoOff;
    setIsVideoOff(newVideoOff);
    webRTCService.toggleVideo(!newVideoOff);
  }, [isVideoOff, setIsVideoOff]);

  const handleToggleScreenShare = useCallback(async () => {
    try {
      if (isScreenSharing) {
        await webRTCService.stopScreenShare();
        setIsScreenSharing(false);
      } else {
        await webRTCService.startScreenShare();
        setIsScreenSharing(true);
      }
    } catch (error) {
      console.error("Screen share error:", error);
      toast.error("Failed to share screen");
    }
  }, [isScreenSharing, setIsScreenSharing]);

  const handleToggleMinimize = useCallback(() => {
    setIsCallMinimized(!isCallMinimized);
  }, [isCallMinimized, setIsCallMinimized]);

  const handleEndCall = useCallback(() => {
    if (callId) {
      webRTCService.leaveCall(callId);
    }
    resetCall();
  }, [callId, resetCall]);

  if (!isInCall) return null;

  // Convert participants map to array
  const participantsArray = Array.from(participants.values());
  const totalParticipants = participantsArray.length + 1; // +1 for local user

  // Render minimized view
  if (isCallMinimized) {
    return createPortal(
      <div
        className="fixed bottom-4 right-4 z-[9999] w-72 bg-slate-900 rounded-2xl shadow-2xl overflow-hidden cursor-pointer"
        onClick={handleToggleMinimize}
      >
        {/* Mini video preview */}
        <div className="aspect-video relative">
          {localStream && !isVideoOff ? (
            <video
              autoPlay
              playsInline
              muted
              ref={(el) => {
                if (el) el.srcObject = localStream;
              }}
              className="w-full h-full object-cover transform scale-x-[-1]"
            />
          ) : (
            <div className="w-full h-full bg-slate-800 flex items-center justify-center">
              <img
                src={currentUser?.avatar_url || "https://shorturl.at/0Xbnm"}
                alt="You"
                className="size-12 rounded-full"
              />
            </div>
          )}
          
          {/* Participant count badge */}
          <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
            {totalParticipants} in call
          </div>

          {/* Status indicators */}
          <div className="absolute bottom-2 left-2 flex gap-1">
            {isMuted && (
              <span className="bg-red-500 text-white p-1 rounded-full">
                <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
              </span>
            )}
            {isVideoOff && (
              <span className="bg-red-500 text-white p-1 rounded-full">
                <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
                </svg>
              </span>
            )}
          </div>

          {/* End call button in mini mode */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleEndCall();
            }}
            className="absolute bottom-2 right-2 bg-red-600 hover:bg-red-700 text-white p-2 rounded-full"
          >
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
            </svg>
          </button>
        </div>
      </div>,
      document.body
    );
  }

  // Full screen call view
  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-slate-950 flex flex-col">
      {/* Video Grid */}
      <div className="flex-1 p-4 overflow-hidden">
        <div
          className={`h-full grid gap-3 ${
            totalParticipants === 1
              ? "grid-cols-1"
              : totalParticipants === 2
              ? "grid-cols-2"
              : totalParticipants <= 4
              ? "grid-cols-2 grid-rows-2"
              : totalParticipants <= 6
              ? "grid-cols-3 grid-rows-2"
              : "grid-cols-4 grid-rows-2"
          }`}
        >
          {/* Local Video */}
          <VideoTile
            stream={localStream}
            username={currentUser?.username || "You"}
            avatar={currentUser?.avatar_url}
            isMuted={isMuted}
            isVideoOff={isVideoOff}
            isLocal={true}
            isLarge={totalParticipants === 1}
          />

          {/* Remote Participants */}
          {participantsArray.map((participant) => (
            <VideoTile
              key={participant.oderId}
              stream={participant.stream || null}
              username={participant.odername}
              avatar={participant.oderAvatar}
              isMuted={participant.isMuted}
              isVideoOff={participant.isVideoOff}
              isLocal={false}
            />
          ))}
        </div>
      </div>

      {/* Call Controls */}
      <div className="flex justify-center pb-6">
        <CallControls
          isMuted={isMuted}
          isVideoOff={isVideoOff}
          isScreenSharing={isScreenSharing}
          isMinimized={isCallMinimized}
          participantCount={totalParticipants}
          onToggleMute={handleToggleMute}
          onToggleVideo={handleToggleVideo}
          onToggleScreenShare={handleToggleScreenShare}
          onToggleMinimize={handleToggleMinimize}
          onEndCall={handleEndCall}
        />
      </div>
    </div>,
    document.body
  );
};

export default VideoCallContainer;
