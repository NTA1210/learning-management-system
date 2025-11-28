import {
  createContext,
  useContext,
  useState,
  useEffect,
  type JSX,
  useCallback,
} from "react";
import { io, Socket } from "socket.io-client";
import { toast } from "react-hot-toast";
import { authService } from "../services";

type SocketContextType = {
  socket: Socket | null;
};

const SocketContext = createContext<SocketContextType>({
  socket: null,
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
  const [user, setUser] = useState(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("lms:user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    console.log("USER", user);

    const socketClient = io(import.meta.env.VITE_BASE_API, {
      withCredentials: true,
      reconnectionAttempts: 1,
    });

    setSocket(socketClient);

    socketClient.on("connect", () => {
      console.log("connected", socketClient.id);
    });

    socketClient.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      toast.error("Socket connection error");
    });

    socketClient.on("internal_error", (error) => {
      console.error("Socket internal error:", error);
      toast.error("Socket internal error");
    });

    return () => {
      socketClient.disconnect();
      setSocket(null);
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};
