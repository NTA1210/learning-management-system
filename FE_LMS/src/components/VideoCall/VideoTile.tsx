import React, { useEffect, useRef } from "react";

interface VideoTileProps {
  stream: MediaStream | null;
  username: string;
  avatar?: string;
  isMuted?: boolean;
  isVideoOff?: boolean;
  isLocal?: boolean;
  isLarge?: boolean;
}

const VideoTile: React.FC<VideoTileProps> = ({
  stream,
  username,
  avatar,
  isMuted = false,
  isVideoOff = false,
  isLocal = false,
  isLarge = false,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (videoElement && stream) {
      console.log(`[VideoTile] Setting stream for ${username}:`, stream.getTracks());
      videoElement.srcObject = stream;
      
      // Ensure video plays
      videoElement.play().catch(err => {
        console.error(`[VideoTile] Error playing video for ${username}:`, err);
      });
    }
    
    return () => {
      if (videoElement) {
        videoElement.srcObject = null;
      }
    };
  }, [stream, username]);

  const hasVideoTrack = stream?.getVideoTracks().some(track => track.enabled) ?? false;
  const showVideo = stream && !isVideoOff && hasVideoTrack;

  return (
    <div
      className={`relative bg-slate-900 rounded-xl overflow-hidden ${
        isLarge ? "w-full h-full" : "w-full aspect-video"
      }`}
    >
      {/* Video Element */}
      {showVideo ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className={`w-full h-full object-cover ${isLocal ? "transform scale-x-[-1]" : ""}`}
        />
      ) : (
        // Avatar placeholder when video is off
        <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
          <div className="flex flex-col items-center gap-2">
            <img
              src={avatar || "https://shorturl.at/0Xbnm"}
              alt={username}
              className={`rounded-full object-cover ${isLarge ? "size-24" : "size-16"}`}
            />
          </div>
        </div>
      )}

      {/* User Info Overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
        <div className="flex items-center gap-2">
          <span className="text-white text-sm font-medium truncate">
            {isLocal ? "You" : username}
          </span>
          {isMuted && (
            <span className="text-red-500">
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            </span>
          )}
        </div>
      </div>

      {/* Local indicator */}
      {isLocal && (
        <div className="absolute top-2 right-2 px-2 py-1 bg-indigo-600 text-white text-xs rounded-full">
          You
        </div>
      )}
    </div>
  );
};

export default VideoTile;
