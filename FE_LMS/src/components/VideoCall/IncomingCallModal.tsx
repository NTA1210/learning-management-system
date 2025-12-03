import React from "react";
import { Phone, PhoneOff, Video } from "lucide-react";
import { useVideoCallStore } from "../../stores/videoCallStore";

interface IncomingCallModalProps {
  onAccept: () => void;
  onDecline: () => void;
}

const IncomingCallModal: React.FC<IncomingCallModalProps> = ({
  onAccept,
  onDecline,
}) => {
  const { incomingCall } = useVideoCallStore();

  if (!incomingCall) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-800 rounded-2xl p-8 shadow-2xl max-w-sm w-full mx-4 animate-pulse-slow">
        {/* Caller Avatar */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative mb-4">
            <img
              src={incomingCall.callerAvatar || "https://shorturl.at/0Xbnm"}
              alt={incomingCall.callerName}
              className="size-24 rounded-full object-cover ring-4 ring-green-500 ring-offset-4 ring-offset-slate-800"
            />
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-green-500 text-white px-3 py-1 rounded-full text-xs">
              <Video className="size-3 inline mr-1" />
              Video Call
            </div>
          </div>
          
          <h3 className="text-white text-xl font-semibold mb-1">
            {incomingCall.callerName}
          </h3>
          
          <p className="text-slate-400 text-sm">
            {incomingCall.isGroupCall 
              ? `Group call in ${incomingCall.chatRoomName}` 
              : "Incoming video call..."}
          </p>

          {incomingCall.isGroupCall && incomingCall.participants.length > 0 && (
            <p className="text-slate-500 text-xs mt-2">
              {incomingCall.participants.length} participant(s) in call
            </p>
          )}
        </div>

        {/* Call Actions */}
        <div className="flex items-center justify-center gap-6">
          {/* Decline Button */}
          <button
            onClick={onDecline}
            className="group flex flex-col items-center gap-2"
          >
            <div className="p-4 rounded-full bg-red-500 hover:bg-red-600 text-white transition-all transform group-hover:scale-110">
              <PhoneOff className="size-6" />
            </div>
            <span className="text-slate-400 text-sm">Decline</span>
          </button>

          {/* Accept Button */}
          <button
            onClick={onAccept}
            className="group flex flex-col items-center gap-2"
          >
            <div className="p-4 rounded-full bg-green-500 hover:bg-green-600 text-white transition-all transform group-hover:scale-110 animate-bounce">
              <Phone className="size-6" />
            </div>
            <span className="text-slate-400 text-sm">Accept</span>
          </button>
        </div>
      </div>

      {/* Add ringtone styles */}
      <style>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default IncomingCallModal;
