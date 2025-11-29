import type React from "react";
import { EllipsisVertical, X, UserPlus } from "lucide-react";
import { useChatRoomStore } from "../../stores/chatRoomStore";
import { useEffect, useState } from "react";
import Modal from "./components/Modal";
import { useDebounce } from "../../hooks";
import { userService } from "../../services";

const ChatHeader: React.FC = () => {
  const { selectedChatRoom, setSelectedChatRoom } = useChatRoomStore();
  const [open, setOpen] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");
  const [users, setUsers] = useState<any[]>([]);

  const searchDebounce = useDebounce(search, 500);

  useEffect(() => {
    const fetchUsers = async () => {
      if (searchDebounce) {
        const res = (await userService.getUsers({ username: search })) as any;
        setUsers(res);
      } else {
        const res = (await userService.getUsers({ limit: 20 })) as any;
        setUsers(res);
      }
    };

    fetchUsers();
  }, [searchDebounce]);

  console.log(users);

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
          <UserPlus className="size-5" />
        </button>
        <button className="text-gray-500 cursor-pointer hover:text-gray-700">
          <EllipsisVertical className="size-5" />
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
                <span className="flex items-center justify-between w-full py-1 border-gray-400 border-b-1 items">
                  <p className="text-xs text-gray-500"> {user?.email}</p>
                  <button className="px-2 py-1 text-xs border border-gray-400 rounded-sm cursor-pointer">
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
