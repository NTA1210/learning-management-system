import { useFloatingChatStore } from "../../stores/floatingChatStore";
import FloatingChatWindow from "./FloatingChatWindow";

const FloatingChatContainer: React.FC = () => {
  const { openChats } = useFloatingChatStore();

  if (openChats.length === 0) return null;

  return (
    <>
      {openChats.map((chat, index) => (
        <FloatingChatWindow
          key={chat.chatRoom.chatRoomId}
          chat={chat}
          index={index}
        />
      ))}
    </>
  );
};

export default FloatingChatContainer;
