import React, { useEffect } from "react";
import { VideoCallContainer, IncomingCallModal } from "../components/VideoCall";
import { useVideoCall } from "../hooks/useVideoCall";

interface VideoCallProviderProps {
  children: React.ReactNode;
}

export const VideoCallProvider: React.FC<VideoCallProviderProps> = ({ children }) => {
  const { incomingCall, acceptCall, declineCall, isInCall } = useVideoCall();

  // Request permissions on mount (optional - can be removed if you want to ask on first call)
  useEffect(() => {
    // Pre-check if permissions are granted
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      const hasVideo = devices.some((d) => d.kind === "videoinput");
      const hasAudio = devices.some((d) => d.kind === "audioinput");
      console.log("Media devices available:", { hasVideo, hasAudio });
    });
  }, []);

  return (
    <>
      {children}
      
      {/* Incoming Call Modal */}
      {incomingCall && !isInCall && (
        <IncomingCallModal onAccept={acceptCall} onDecline={declineCall} />
      )}
      
      {/* Video Call Container (full screen when in call) */}
      <VideoCallContainer />
    </>
  );
};

export default VideoCallProvider;
