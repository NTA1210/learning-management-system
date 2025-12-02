import { Send, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useChatRoomStore } from "../../stores/chatRoomStore";
import { useSocketContext } from "../../context/SocketContext";
import AttachMenu from "./components/AttachMenu";
import { useTheme } from "../../hooks/useTheme";

const MessageInput: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const { selectedChatRoom } = useChatRoomStore();
  const { socket } = useSocketContext();
  const [message, setMessage] = useState("");
  const [openPopup, setOpenPopup] = useState(false);
  const { darkMode } = useTheme();

  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  useEffect(() => {
    const user = localStorage.getItem("lms:user");
    if (user) {
      setUser(JSON.parse(user));
    }
  }, []);

  const emitTyping = (isTyping: boolean) => {
    if (!socket || !user || !selectedChatRoom) return;

    socket.emit("conversation:typing", {
      chatRoomId: selectedChatRoom.chatRoomId,
      isTyping,
    });
    isTypingRef.current = isTyping;
  };

  if (!selectedChatRoom) return null;

  const handleSendMessage = () => {
    if (message.trim() === "" || !user || !socket) return;

    socket.emit("chatroom:send-message", {
      chatRoomId: selectedChatRoom.chatRoomId,
      userId: user._id,
      senderRole: user.role,
      content: message.trim(),
    });

    setMessage("");

    if (isTypingRef.current) emitTyping(false);
  };

  const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);

    if (!isTypingRef.current) emitTyping(true);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => emitTyping(false), 500);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // --- HANDLE ATTACH ITEM ---
  const handleAttachItemClick = (
    type: "poll" | "file" | "location",
    file?: File
  ) => {
    setOpenPopup(false);

    if (type === "file" && file && socket && user) {
      const reader = new FileReader();
      reader.onload = () => {
        const arrayBuffer = reader.result;
        socket.emit("chatroom:send-file", {
          chatRoomId: selectedChatRoom.chatRoomId,
          userId: user._id,
          senderRole: user.role,
          fileName: file.name,
          mimeType: file.type,
          data: arrayBuffer,
        });
      };
      reader.readAsArrayBuffer(file);
    }

    if (type === "location") {
      // logic gửi location
      console.log("Send location");
    }

    if (type === "poll") {
      // logic gửi poll
      console.log("Send poll");
    }
  };

  return (
    <div
      className="px-4 py-3 border-t"
      style={{
        backgroundColor: darkMode ? "#020617" : "#ffffff",
        borderColor: darkMode ? "rgba(31,41,55,0.9)" : "rgba(229,231,235,1)",
      }}
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpenPopup((prev) => !prev)}
            className="flex items-center justify-center text-white transition-transform rounded-full cursor-pointer duration-[1500ms] bg-indigo-600 size-10 hover:bg-indigo-700"
            style={{ transform: openPopup ? "rotate(45deg)" : "rotate(0deg)" }}
          >
            <Plus className="size-4" />
          </button>

          {openPopup && <AttachMenu onItemClick={handleAttachItemClick} />}
        </div>

        <div className="flex-1">
          <input
            placeholder="Type a message..."
            className="flex items-center w-full px-4 py-3 text-sm rounded-full resize-none focus:outline-none focus:ring-2 focus:ring-indigo-600"
            value={message}
            onChange={handleOnChange}
            onKeyDown={handleKeyDown}
            style={{
              backgroundColor: darkMode ? "#020617" : "#f3f4f6",
              color: darkMode ? "#e5e7eb" : "#0f172a",
              border: darkMode
                ? "1px solid rgba(55,65,81,1)"
                : "1px solid rgba(209,213,219,1)",
            }}
          />
        </div>

        <button
          onClick={handleSendMessage}
          type="button"
          className="flex items-center justify-center text-white rounded-full cursor-pointer bg-indigo-600 size-10 hover:bg-indigo-700"
        >
          <Send className="size-4" />
        </button>
      </div>
    </div>
  );
};

export default MessageInput;
