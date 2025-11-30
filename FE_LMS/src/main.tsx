import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { SocketProvider } from "./context/SocketContext.tsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ChatRoomsProvider } from "./context/ChatRoomContext.tsx";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <SocketProvider>
      <ChatRoomsProvider>
        <App />
      </ChatRoomsProvider>
    </SocketProvider>
  </QueryClientProvider>
);
