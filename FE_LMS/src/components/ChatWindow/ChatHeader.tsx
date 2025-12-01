import type React from "react";
import { EllipsisVertical, X, UserPlus } from "lucide-react";
import { useChatRoomStore } from "../../stores/chatRoomStore";
import { useEffect, useState } from "react";
import Modal from "./components/Modal";
import { useDebounce } from "../../hooks";
import { userService } from "../../services";
import { useSocketContext } from "../../context/SocketContext";

const ChatHeader: React.FC = () => {
  const { selectedChatRoom, setSelectedChatRoom } = useChatRoomStore();
  const [user, setUser] = useState<any>(null);
  const [open, setOpen] = useState<boolean>(false);
  const [search, setSearch] = useState<string>("");
  const [users, setUsers] = useState<any[]>([]);
  const { socket } = useSocketContext();
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const searchDebounce = useDebounce(search, 500);

  useEffect(() => {
    const storedUser = localStorage.getItem("lms:user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      if (searchDebounce) {
        const res = (await userService.getUsers({
          username: searchDebounce,
        })) as any;
        setUsers(res?.users);
      } else {
        const res = (await userService.getUsers()) as any;
        setUsers(res?.users);
      }
    };

    fetchUsers();
  }, [searchDebounce]);

  const handleAddUser = (email: string): void => {
    socket?.emit("chatroom:invite-user", {
      chatRoomId: selectedChatRoom?.chatRoomId,
      email,
    });
    setOpen(false);
  };

  const handleLeaveTheChatroomEvent = () => {
    socket?.emit("chatroom:leave-chatroom", {
      chatRoomId: selectedChatRoom?.chatRoomId,
    });
    setSelectedChatRoom(null);
    setIsOpen(false);
  };
  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-200">
      <div className="flex items-center space-x-3">
        <img
          src={selectedChatRoom?.course?.logo || "https://shorturl.at/ARotg"}
          alt="User image"
          className="object-cover rounded-full size-10"
        />
        <div>
          <h2 className="font-semibold">{selectedChatRoom?.name}</h2>
        </div>
      </div>
      <div className="flex space-x-4">
        {user?.role === "student" || (
          <button
            className="text-gray-500 cursor-pointer hover:text-gray-700"
            onClick={() => setOpen(true)}
          >
            <UserPlus className="size-5" />
          </button>
        )}
        <button
          className="relative inline-block text-gray-500 cursor-pointer hover:text-gray-900"
          onClick={() => setIsOpen(!isOpen)}
        >
          <EllipsisVertical className="size-5" />
          {isOpen && (
            <div className="popup">
              <span className="inline-block w-full px-4 py-2 text-sm rounded-md whitespace-nowrap hover:bg-gray-300 text-start">
                Do something
              </span>
              <span
                className="inline-block w-full px-4 py-2 text-sm text-red-500 rounded-md whitespace-nowrap hover:bg-gray-300 text-start"
                onClick={handleLeaveTheChatroomEvent}
              >
                Leave the chatroom
              </span>
            </div>
          )}
        </button>
        <button
          onClick={() => setSelectedChatRoom(null)}
          className="text-gray-500 cursor-pointer sm:hidden hover:text-gray-700"
        >
          <X className="size-4" />
        </button>
      </div>

      <Modal open={open} onClose={() => setOpen(false)}>
        <div className="min-w-[400px]">
          <header className="flex items-center justify-start mb-4">
            <p className="font-semibold">Invite someone in your chatroom</p>
          </header>
          <label className="flex flex-col gap-2">
            <p className="text-sm text-gray-500">By email or username</p>
            <input
              className="border-gray-400 rounded-sm border-1 h-min-[50px] w-full px-4 py-2 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>

          {!(users.length > 0) || (
            <div className="flex flex-col gap-2 px-4 py-4 mt-5 border border-gray-400 rounded-lg users-list h-[200px] overflow-auto">
              {users.map((user) => (
                <span
                  className="flex items-center justify-between w-full py-1 border-gray-400 border-b-1 items"
                  key={user._id.toString()}
                >
                  <p className="text-xs text-gray-500"> {user?.email}</p>
                  <button
                    className="px-2 py-1 text-xs border border-gray-400 rounded-sm cursor-pointer hover:bg-blue-400 hover:text-white"
                    onClick={() => handleAddUser(user.email)}
                  >
                    Add
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default ChatHeader;
