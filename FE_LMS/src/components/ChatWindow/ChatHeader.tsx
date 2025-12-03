import type React from "react";
import { EllipsisVertical, Video, Phone, PhoneCall, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useChatRoomStore } from "../../stores/chatRoomStore";
import { useEffect, useState, useCallback } from "react";
import { useSocketContext } from "../../context/SocketContext";
import { useTheme } from "../../hooks/useTheme";
import { useVideoCall } from "../../hooks/useVideoCall";
import ChatMembersModal from "./ChatMembersModal";

interface ActiveCallInfo {
  hasActiveCall: boolean;
  callId?: string;
  chatRoomId: string;
  participantCount?: number;
  participants?: string[];
}

const ChatHeader: React.FC = () => {
  const { selectedChatRoom, setSelectedChatRoom } = useChatRoomStore();
  const [user, setUser] = useState<any>(null);
  const [showMembersModal, setShowMembersModal] = useState<boolean>(false);
  const { socket } = useSocketContext();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const { darkMode } = useTheme();
  const { startCall, joinCall, isInCall, chatRoomId: currentCallChatRoomId } = useVideoCall();
  const navigate = useNavigate();
  const [activeCallInfo, setActiveCallInfo] = useState<ActiveCallInfo | null>(null);

  const handleGoBack = () => {
    navigate('/chat-rooms', { replace: true });
  };

  const handleStartVideoCall = () => {
    if (selectedChatRoom) {
      startCall(selectedChatRoom.chatRoomId, selectedChatRoom.name);
    }
  };

  const handleJoinCall = useCallback(() => {
    if (selectedChatRoom && activeCallInfo?.callId) {
      joinCall(activeCallInfo.callId, selectedChatRoom.chatRoomId);
    }
  }, [selectedChatRoom, activeCallInfo, joinCall]);

  // Check for active call when chat room changes
  useEffect(() => {
    if (!socket || !selectedChatRoom) return;

    // Request active call info for this chat room
    socket.emit("videocall:get-active-call", {
      chatRoomId: selectedChatRoom.chatRoomId,
    });

    // Listen for active call info
    const handleActiveCallInfo = (data: ActiveCallInfo) => {
      if (data.chatRoomId === selectedChatRoom.chatRoomId) {
        setActiveCallInfo(data);
      }
    };

    // Listen for new calls starting in this room
    const handleIncomingCall = (data: { callId: string; chatRoomId: string }) => {
      if (data.chatRoomId === selectedChatRoom.chatRoomId) {
        setActiveCallInfo({
          hasActiveCall: true,
          callId: data.callId,
          chatRoomId: data.chatRoomId,
          participantCount: 1,
        });
      }
    };

    // Listen for calls ending
    const handleCallEnded = (data: { callId: string }) => {
      if (activeCallInfo?.callId === data.callId) {
        setActiveCallInfo(null);
      }
    };

    socket.on("videocall:active-call-info", handleActiveCallInfo);
    socket.on("videocall:incoming-call", handleIncomingCall);
    socket.on("videocall:call-ended", handleCallEnded);

    return () => {
      socket.off("videocall:active-call-info", handleActiveCallInfo);
      socket.off("videocall:incoming-call", handleIncomingCall);
      socket.off("videocall:call-ended", handleCallEnded);
    };
  }, [socket, selectedChatRoom, activeCallInfo?.callId]);

  // Determine if there's an ongoing call we can join (not our own call)
  const canJoinCall = activeCallInfo?.hasActiveCall && 
    (!isInCall || currentCallChatRoomId !== selectedChatRoom?.chatRoomId);

  useEffect(() => {
    const storedUser = localStorage.getItem("lms:user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLeaveTheChatroomEvent = () => {
    socket?.emit("chatroom:leave-chatroom", {
      chatRoomId: selectedChatRoom?.chatRoomId,
    });
    setSelectedChatRoom(null);
    setIsOpen(false);
    navigate('/chat-rooms', { replace: true });
  };

  return (
    <>
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{
          backgroundColor: darkMode ? "#020617" : "#ffffff",
          borderColor: darkMode ? "rgba(31,41,55,0.9)" : "rgba(229,231,235,1)",
        }}
      >
        <div className="flex items-center space-x-3">
          {/* Back button for mobile */}
          <button
            onClick={handleGoBack}
            className="sm:hidden p-1.5 -ml-1 mr-1 rounded-lg transition-colors"
            style={{
              color: darkMode ? "#9ca3af" : "#6b7280",
            }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <img
            src={selectedChatRoom?.course?.logo || "https://shorturl.at/ARotg"}
            alt="User image"
            className="object-cover rounded-full size-10"
          />
          <div>
            <h2
              className="font-semibold text-sm sm:text-base"
              style={{ color: darkMode ? "#e5e7eb" : "#0f172a" }}
            >
              {selectedChatRoom?.name}
            </h2>
            <button
              onClick={() => setShowMembersModal(true)}
              className="text-xs flex items-center gap-1 hover:underline"
              style={{ color: darkMode ? "#94a3b8" : "#64748b" }}
            >
              <Users className="size-3" />
              {selectedChatRoom?.participants?.length || 0} members
            </button>
          </div>
        </div>
        <div className="flex space-x-4">
          {/* Join Ongoing Call Button - shown when there's an active call we can join */}
          {canJoinCall && (
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors bg-green-500 hover:bg-green-600 text-white text-sm font-medium animate-pulse"
              onClick={handleJoinCall}
              title={`Join call (${activeCallInfo?.participantCount || 1} participant${(activeCallInfo?.participantCount || 1) > 1 ? 's' : ''})`}
            >
              <PhoneCall className="size-4" />
              <span className="hidden sm:inline">Join Call</span>
            </button>
          )}

          {/* Video Call Button */}
          <button
            className={`p-2 rounded-lg transition-colors ${
              isInCall
                ? "text-green-500 bg-green-500/20"
                : darkMode
                ? "text-gray-400 hover:text-gray-200 hover:bg-slate-700"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            }`}
            onClick={handleStartVideoCall}
            title={isInCall ? "In call" : "Start video call"}
            disabled={isInCall || canJoinCall}
          >
            <Video className="size-5" />
          </button>

          {/* Audio Call Button */}
          <button
            className={`p-2 rounded-lg transition-colors ${
              darkMode
                ? "text-gray-400 hover:text-gray-200 hover:bg-slate-700"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            }`}
            onClick={handleStartVideoCall}
            title="Start audio call"
            disabled={isInCall || canJoinCall}
          >
            <Phone className="size-5" />
          </button>

          {/* Member List Button */}
          <button
            className={`p-2 rounded-lg transition-colors ${
              darkMode
                ? "text-gray-400 hover:text-gray-200 hover:bg-slate-700"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            }`}
            onClick={() => setShowMembersModal(true)}
            title="Member list"
          >
            <Users className="size-5" />
          </button>

          {/* More Options Button */}
          <button
            className="relative inline-block text-gray-400 cursor-pointer hover:text-gray-100"
            onClick={() => setIsOpen(!isOpen)}
          >
            <EllipsisVertical className="size-5" />
            {isOpen && (
              <div
                className="popup"
                style={{
                  backgroundColor: darkMode ? "#020617" : "#ffffff",
                  border: `1px solid ${
                    darkMode ? "rgba(55,65,81,1)" : "rgba(229,231,235,1)"
                  }`,
                  color: darkMode ? "#e5e7eb" : "#0f172a",
                }}
              >
                <span
                  className={
                    `inline-block w-full px-4 py-2 text-sm rounded-md whitespace-nowrap text-start
       transition-colors duration-150 cursor-pointer ` +
                    (darkMode ? "hover:bg-slate-800/70" : "hover:bg-gray-100")
                  }
                  onClick={() => setShowMembersModal(true)}
                >
                  View Members
                </span>

                <span
                  className={
                    `inline-block w-full px-4 py-2 text-sm text-red-500 rounded-md whitespace-nowrap text-start
       transition-colors duration-150 cursor-pointer ` +
                    (darkMode ? "hover:bg-slate-800/70" : "hover:bg-gray-100")
                  }
                  onClick={handleLeaveTheChatroomEvent}
                >
                  Leave the chatroom
                </span>
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Chat Members Modal */}
      <ChatMembersModal
        isOpen={showMembersModal}
        onClose={() => setShowMembersModal(false)}
        darkMode={darkMode}
        participants={selectedChatRoom?.participants || []}
        chatRoomName={selectedChatRoom?.name || ""}
        chatRoomId={selectedChatRoom?.chatRoomId || ""}
        userRole={user?.role}
      />
    </>
  );
};

export default ChatHeader;
