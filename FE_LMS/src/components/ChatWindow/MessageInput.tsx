import { Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useChatRoomStore } from "../../stores/chatRoomStore";
import { useSocketContext } from "../../context/SocketContext";

const MessageInput: React.FC = () => {
  const [user, setUser] = useState(null);
  const { selectedChatRoom } = useChatRoomStore();
  const { socket } = useSocketContext();
  const [message, setMessage] = useState("");

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

  if (!selectedChatRoom) return;

  const handleSendMessage = () => {
    if (message.trim() === "" || !user || !socket) return;

    socket.emit("chatroom:send-message", {
      chatRoomId: selectedChatRoom.chatRoomId,
      userId: (user as any)._id,
      senderRole: (user as any).role,
      content: message.trim(),
    });

    setMessage("");

    if (isTypingRef.current) {
      emitTyping(false);
    }
  };

  const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);

    if (!isTypingRef.current) {
      emitTyping(true);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      emitTyping(false);
    }, 500);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault(); // tránh xuống dòng
      handleSendMessage();
    }
  };

  return (
    <div className="p-4 bg-white border border-gray-200">
      <div className="flex items-center">
        <div className="flex-1">
          <input
            placeholder="Type a message..."
            className="flex items-center w-full px-4 py-3 text-sm bg-gray-100 rounded-full resize-none focus:outline-none focus:ring-2 focus:ring-sky-500"
            value={message}
            onChange={(e) => handleOnChange(e)}
            onKeyDown={(e) => handleKeyDown(e)}
          />
        </div>

        <div className="ml-3">
          <button
            onClick={handleSendMessage}
            type="button"
            className="flex items-center justify-center text-white rounded-full cursor-pointer bg-sky-500 size-10 hover:bg-sky-600"
          >
            <Send className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessageInput;
