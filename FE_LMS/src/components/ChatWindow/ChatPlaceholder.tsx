import { MessageCircle } from "lucide-react";
import type { JSX } from "react";
import { useTheme } from "../../hooks/useTheme";

function ChatPlaceholder(): JSX.Element {
  const { darkMode } = useTheme();

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center text-center p-8"
      style={{
        backgroundColor: darkMode ? "#020617" : "#f9fafb",
        color: darkMode ? "#6b7280" : "#6b7280",
      }}
    >
      <MessageCircle className="size-16 mb-4 opacity-70" />
      <h2
        className="text-lg font-semibold"
        style={{ color: darkMode ? "#e5e7eb" : "#111827" }}
      >
        Welcome to Chat
      </h2>
      <p className="text-sm mt-2 max-w-sm">
        Select a chat room on the left to start messaging with your class.
      </p>
    </div>
  );
}

export default ChatPlaceholder;
