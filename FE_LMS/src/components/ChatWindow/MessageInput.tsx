import { Send, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useChatRoomStore } from "../../stores/chatRoomStore";
import { useSocketContext } from "../../context/SocketContext";
import AttachMenu from "./components/AttachMenu";

const MessageInput: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const { selectedChatRoom } = useChatRoomStore();
  const { socket } = useSocketContext();
  const [message, setMessage] = useState("");
  const [openPopup, setOpenPopup] = useState(false);

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
    <div className="p-4 bg-white border border-gray-200">
      <div className="flex items-center gap-3">
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpenPopup((prev) => !prev)}
            className="flex items-center justify-center text-white transition-transform rounded-full cursor-pointer duration-[1500ms] bg-sky-500 size-10 hover:bg-sky-600"
            style={{ transform: openPopup ? "rotate(45deg)" : "rotate(0deg)" }}
          >
            <Plus className="size-4" />
          </button>

          {openPopup && <AttachMenu onItemClick={handleAttachItemClick} />}
        </div>

        <div className="flex-1">
          <input
            placeholder="Type a message..."
            className="flex items-center w-full px-4 py-3 text-sm bg-gray-100 rounded-full resize-none focus:outline-none focus:ring-2 focus:ring-sky-500"
            value={message}
            onChange={handleOnChange}
            onKeyDown={handleKeyDown}
          />
        </div>

        <button
          onClick={handleSendMessage}
          type="button"
          className="flex items-center justify-center text-white rounded-full cursor-pointer bg-sky-500 size-10 hover:bg-sky-600"
        >
          <Send className="size-4" />
        </button>
      </div>
    </div>
  );
};

export default MessageInput;
