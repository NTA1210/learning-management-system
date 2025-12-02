import type React from "react";
import { EllipsisVertical, UserPlus, Video, Phone } from "lucide-react";
import { useChatRoomStore } from "../../stores/chatRoomStore";
import { useEffect, useState } from "react";
import Modal from "./components/Modal";
import { useDebounce } from "../../hooks";
import { userService } from "../../services";
import { useSocketContext } from "../../context/SocketContext";
import { useTheme } from "../../hooks/useTheme";
import { useVideoCall } from "../../hooks/useVideoCall";

const ChatHeader: React.FC = () => {
  const { selectedChatRoom, setSelectedChatRoom } = useChatRoomStore();
  const [user, setUser] = useState<any>(null);
  const [open, setOpen] = useState<boolean>(false);
  const [search, setSearch] = useState<string>("");
  const [users, setUsers] = useState<any[]>([]);
  const { socket } = useSocketContext();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const { darkMode } = useTheme();
  const { startCall, isInCall } = useVideoCall();

  const searchDebounce = useDebounce(search, 500);

  const handleStartVideoCall = () => {
    if (selectedChatRoom) {
      startCall(selectedChatRoom.chatRoomId, selectedChatRoom.name);
    }
  };

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
          onClick={() => setSelectedChatRoom(null)}
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
        </div>
      </div>
      <div className="flex space-x-4">
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
          disabled={isInCall}
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
          disabled={isInCall}
        >
          <Phone className="size-5" />
        </button>

        {user?.role === "student" || (
          <button
            className="text-gray-400 cursor-pointer hover:text-gray-200"
            onClick={() => setOpen(true)}
          >
            <UserPlus className="size-5" />
          </button>
        )}
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
     transition-colors duration-150 ` +
                  (darkMode ? "hover:bg-slate-800/70" : "hover:bg-gray-100")
                }
              >
                Do something
              </span>

              <span
                className={
                  `inline-block w-full px-4 py-2 text-sm text-red-500 rounded-md whitespace-nowrap text-start
     transition-colors duration-150 ` +
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

      <Modal open={open} onClose={() => setOpen(false)}>
        <div className="min-w-[400px]">
          <header className="flex items-center justify-start mb-4">
            <p className="font-semibold">Invite someone in your chatroom</p>
          </header>
          <label className="flex flex-col gap-2">
            <p className="text-sm text-white">By email or username</p>
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
                  <p className="text-xs text-white"> {user?.email}</p>
                  <button
                    className="px-2 py-1 text-xs border border-gray-400 rounded-sm cursor-pointer hover:bg-indigo-600 hover:text-white"
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
