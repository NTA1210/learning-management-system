import ChatSidebar from "../../components/ChatWindow/Sidebar/ChatSidebar";
import ChatWindow from "../../components/ChatWindow/ChatWindow";

function Chat() {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <div className="w-full sm:w-1/3 sm:max-w-[456px] min-h-screen">
        <ChatSidebar />
      </div>
      <div className="flex-1 hidden min-h-screen sm:flex">
        <ChatWindow />
      </div>
    </div>
  );
}

export default Chat;
