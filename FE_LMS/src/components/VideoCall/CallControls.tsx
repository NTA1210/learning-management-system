import React from "react";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Monitor,
  Users,
  Maximize2,
  Minimize2,
} from "lucide-react";

interface CallControlsProps {
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  isMinimized: boolean;
  participantCount: number;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onToggleMinimize: () => void;
  onEndCall: () => void;
  onShowParticipants?: () => void;
}

const CallControls: React.FC<CallControlsProps> = ({
  isMuted,
  isVideoOff,
  isScreenSharing,
  isMinimized,
  participantCount,
  onToggleMute,
  onToggleVideo,
  onToggleScreenShare,
  onToggleMinimize,
  onEndCall,
  onShowParticipants,
}) => {
  return (
    <div className="flex items-center justify-center gap-3 p-4 bg-slate-900/90 backdrop-blur-sm rounded-2xl">
      {/* Mute Button */}
      <button
        onClick={onToggleMute}
        className={`p-4 rounded-full transition-all ${
          isMuted
            ? "bg-red-500 hover:bg-red-600 text-white"
            : "bg-slate-700 hover:bg-slate-600 text-white"
        }`}
        title={isMuted ? "Unmute" : "Mute"}
      >
        {isMuted ? <MicOff className="size-5" /> : <Mic className="size-5" />}
      </button>

      {/* Video Button */}
      <button
        onClick={onToggleVideo}
        className={`p-4 rounded-full transition-all ${
          isVideoOff
            ? "bg-red-500 hover:bg-red-600 text-white"
            : "bg-slate-700 hover:bg-slate-600 text-white"
        }`}
        title={isVideoOff ? "Turn on camera" : "Turn off camera"}
      >
        {isVideoOff ? <VideoOff className="size-5" /> : <Video className="size-5" />}
      </button>

      {/* Screen Share Button */}
      <button
        onClick={onToggleScreenShare}
        className={`p-4 rounded-full transition-all ${
          isScreenSharing
            ? "bg-green-500 hover:bg-green-600 text-white"
            : "bg-slate-700 hover:bg-slate-600 text-white"
        }`}
        title={isScreenSharing ? "Stop sharing" : "Share screen"}
      >
        <Monitor className="size-5" />
      </button>

      {/* Participants Button */}
      {onShowParticipants && (
        <button
          onClick={onShowParticipants}
          className="p-4 rounded-full bg-slate-700 hover:bg-slate-600 text-white transition-all relative"
          title="Participants"
        >
          <Users className="size-5" />
          <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-xs rounded-full size-5 flex items-center justify-center">
            {participantCount}
          </span>
        </button>
      )}

      {/* Minimize/Maximize Button */}
      <button
        onClick={onToggleMinimize}
        className="p-4 rounded-full bg-slate-700 hover:bg-slate-600 text-white transition-all"
        title={isMinimized ? "Maximize" : "Minimize"}
      >
        {isMinimized ? <Maximize2 className="size-5" /> : <Minimize2 className="size-5" />}
      </button>

      {/* End Call Button */}
      <button
        onClick={onEndCall}
        className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white transition-all"
        title="End call"
      >
        <PhoneOff className="size-5" />
      </button>
    </div>
  );
};

export default CallControls;
