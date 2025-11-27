import type React from "react";
import { EllipsisVertical, X } from "lucide-react";
import { useChatRoomStore } from "../../stores/chatRoomStore";

const ChatHeader: React.FC = () => {
  const { selectedChatRoom, setSelectedChatRoom } = useChatRoomStore();

  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-200">
      <div className="flex items-center space-x-3">
        <img
          src={selectedChatRoom?.logo || "https://shorturl.at/ARotg"}
          alt="User image"
          className="object-cover rounded-full size-10"
        />
        <div>
          <h2 className="font-semibold">{selectedChatRoom?.name}</h2>
        </div>
      </div>
      <div className="flex space-x-4">
        <button className="text-gray-500 cursor-pointer hover:text-gray-700">
          <EllipsisVertical className="size-[16px]" />
        </button>
        <button
          onClick={() => setSelectedChatRoom(null)}
          className="text-gray-500 cursor-pointer sm:hidden hover:text-gray-700"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;
