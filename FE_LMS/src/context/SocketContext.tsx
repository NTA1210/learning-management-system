import {
  createContext,
  useContext,
  useState,
  useEffect,
  type JSX,
} from "react";
import { io, Socket } from "socket.io-client";
import { toast } from "react-hot-toast";

type SocketContextType = {
  socket: Socket | null;
  disconnectSocket: () => void;
};

const SocketContext = createContext<SocketContextType>({
  socket: null,
  disconnectSocket: () => {},
});

export const useSocketContext = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocketContext must be used within a SocketProvider");
  }
  return context;
};

export const SocketProvider = ({
  children,
}: {
  children: JSX.Element;
}): JSX.Element => {
  const [user, setUser] = useState<any>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("lms:user");
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  useEffect(() => {
    if (!user) return;

    const socketClient = io(import.meta.env.VITE_BASE_API, {
      withCredentials: true,
      reconnectionAttempts: 1,
    });

    setSocket(socketClient);

    // Lắng nghe events
    const handleNewMessage = (data: any) => {
      toast(`New message in ${data.chatRoomName}`, {
        icon: "📧",
        className: "bg-sky-500 text-white",
      });
    };

    const handleConnectError = (error: any) =>
      toast.error("Socket connection error");
    const handleInternalError = (error: any) =>
      toast.error("Socket internal error");

    socketClient.on("connect", () => console.log("connected", socketClient.id));
    socketClient.on("chatroom:notification-new-message", handleNewMessage);
    socketClient.on("connect_error", handleConnectError);
    socketClient.on("internal_error", handleInternalError);

    // Hàm disconnect + remove listener
    const cleanup = () => {
      socketClient.off("chatroom:notification-new-message", handleNewMessage);
      socketClient.off("connect_error", handleConnectError);
      socketClient.off("internal_error", handleInternalError);
      socketClient.disconnect();
      setSocket(null);
    };

    return cleanup;
  }, [user]);

  // Hàm này dùng để logout + hủy socket
  const disconnectSocket = () => {
    if (socket) {
      socket.removeAllListeners(); // hủy toàn bộ listener
      socket.disconnect();
      setSocket(null);
    }
    setUser(null);
    localStorage.removeItem("lms:user");
  };

  return (
    <SocketContext.Provider value={{ socket, disconnectSocket }}>
      {children}
    </SocketContext.Provider>
  );
};
