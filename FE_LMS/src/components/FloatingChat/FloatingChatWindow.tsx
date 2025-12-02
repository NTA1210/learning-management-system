import { useEffect, useRef, useState, useCallback } from "react";
import { Send, X, Minus, ThumbsUp, Paperclip, ExternalLink, Upload, File as FileIcon } from "lucide-react";
import { useTheme } from "../../hooks/useTheme";
import { useSocketContext } from "../../context/SocketContext";
import { useFloatingChatStore, type FloatingChat } from "../../stores/floatingChatStore";
import { useNavigate } from "react-router-dom";
import { messageService, type Message as ServiceMessage } from "../../services/messageService";
import MessageItem from "../ChatWindow/MessageItem";
import FileMessageItem from "../ChatWindow/FileMessageItem";

interface FloatingChatWindowProps {
  chat: FloatingChat;
  index: number;
}

interface StagedFile {
  file: File;
  id: string;
  preview?: string;
}

interface UserInfo {
  _id: string;
  username: string;
  email: string;
  fullname?: string;
  avatar_url?: string;
  profileImageUrl?: string;
  role?: string;
}

const FloatingChatWindow: React.FC<FloatingChatWindowProps> = ({ chat, index }) => {
  const { darkMode } = useTheme();
  const { socket } = useSocketContext();
  const navigate = useNavigate();
  const { closeChat, toggleMinimize, bringToFront } = useFloatingChatStore();
  
  const [user, setUser] = useState<UserInfo | null>(null);
  const [messages, setMessages] = useState<ServiceMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
  const [isEmpty, setIsEmpty] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  
  const editorRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);
  const isInitialLoadRef = useRef(true);
  
  const { chatRoom, isMinimized } = chat;
  const chatRoomId = chatRoom.chatRoomId;

  // Calculate position from right
  const rightPosition = 24 + (index * 340);

  useEffect(() => {
    const storedUser = localStorage.getItem("lms:user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Fetch messages using messageService
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setIsLoading(true);
        isInitialLoadRef.current = true;
        const response = await messageService.fetchMessages(chatRoomId);
        if (response.messages) {
          // Messages come newest first from API
          setMessages(response.messages.slice());
          setHasMore(response.hasNext);
          setNextCursor(response.nextCursor);
        }
      } catch (error) {
        console.error("Failed to fetch messages:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (!isMinimized) {
      fetchMessages();
    }
  }, [chatRoomId, isMinimized]);

  // Load more messages when scrolling to top
  const loadMoreMessages = useCallback(async () => {
    if (isLoadingMore || !hasMore || !nextCursor) return;

    const container = messagesContainerRef.current;
    if (!container) return;

    const scrollHeightBefore = container.scrollHeight;
    const scrollTopBefore = container.scrollTop;

    try {
      setIsLoadingMore(true);
      const response = await messageService.fetchMessages(chatRoomId, nextCursor);
      
      if (response.messages && response.messages.length > 0) {
        // Prepend older messages (they come newest first, so add to beginning)
        setMessages((prev) => [...response.messages, ...prev]);
        setHasMore(response.hasNext);
        setNextCursor(response.nextCursor);

        // Maintain scroll position after prepending
        setTimeout(() => {
          if (container) {
            const scrollHeightAfter = container.scrollHeight;
            container.scrollTop = scrollTopBefore + (scrollHeightAfter - scrollHeightBefore);
          }
        }, 0);
      }
    } catch (error) {
      console.error("Failed to load more messages:", error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [chatRoomId, hasMore, nextCursor, isLoadingMore]);

  // Handle scroll to detect when user scrolls to top
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container || isLoadingMore || !hasMore) return;

    // Load more when scrolled near the top (within 50px)
    if (container.scrollTop < 50) {
      loadMoreMessages();
    }
  }, [loadMoreMessages, isLoadingMore, hasMore]);

  // Listen for new messages
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (data: { chatRoomId: string; message: ServiceMessage }) => {
      if (data.chatRoomId === chatRoomId) {
        setMessages((prev) => [...prev, data.message]);
        // Scroll to bottom for new messages
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    };

    socket.on("chatroom:new-message", handleNewMessage);
    return () => {
      socket.off("chatroom:new-message", handleNewMessage);
    };
  }, [socket, chatRoomId]);

  // Scroll to bottom on initial load only
  useEffect(() => {
    if (!isMinimized && !isLoading && isInitialLoadRef.current && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
      isInitialLoadRef.current = false;
    }
  }, [messages, isMinimized, isLoading]);

  // Mark as read when opened
  useEffect(() => {
    if (!isMinimized && socket && user) {
      socket.emit("chatroom:mark-as-read", {
        chatRoomId,
        userId: user._id,
      });
    }
  }, [isMinimized, socket, user, chatRoomId]);

  const checkIfEmpty = useCallback(() => {
    if (editorRef.current) {
      const text = editorRef.current.innerText?.trim() || "";
      setIsEmpty(text.length === 0);
    }
  }, []);

  const handleSendMessage = () => {
    const content = editorRef.current?.innerText?.trim() || "";
    const hasContent = content !== "";
    const hasFiles = stagedFiles.length > 0;

    if ((!hasContent && !hasFiles) || !user || !socket) return;

    // Send text message
    if (hasContent) {
      socket.emit("chatroom:send-message", {
        chatRoomId,
        userId: user._id,
        senderRole: user.role,
        content,
      });
    }

    // Send files
    if (hasFiles) {
      stagedFiles.forEach((stagedFile) => {
        const reader = new FileReader();
        reader.onload = () => {
          socket.emit("chatroom:send-file", {
            chatRoomId,
            userId: user._id,
            senderRole: user.role,
            fileName: stagedFile.file.name,
            mimeType: stagedFile.file.type,
            data: reader.result,
          });
        };
        reader.readAsArrayBuffer(stagedFile.file);
      });
      stagedFiles.forEach((sf) => {
        if (sf.preview) URL.revokeObjectURL(sf.preview);
      });
      setStagedFiles([]);
    }

    // Clear editor
    if (editorRef.current) {
      editorRef.current.innerHTML = "";
    }
    setIsEmpty(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendLike = () => {
    if (!user || !socket) return;
    socket.emit("chatroom:send-message", {
      chatRoomId,
      userId: user._id,
      senderRole: user.role,
      content: "👍",
    });
  };

  const openFullChat = () => {
    closeChat(chatRoomId);
    navigate(`/chat-rooms/${chatRoomId}`);
  };

  // File handling
  const stageFile = (file: File) => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const isImage = file.type.startsWith("image/");
    const preview = isImage ? URL.createObjectURL(file) : undefined;
    setStagedFiles((prev) => [...prev, { file, id, preview }]);
  };

  const removeStagedFile = (id: string) => {
    setStagedFiles((prev) => {
      const fileToRemove = prev.find((f) => f.id === id);
      if (fileToRemove?.preview) URL.revokeObjectURL(fileToRemove.preview);
      return prev.filter((f) => f.id !== id);
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(stageFile);
    }
    e.target.value = "";
  };

  // Drag and drop
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.items?.length > 0) setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounterRef.current = 0;
    const files = e.dataTransfer.files;
    if (files?.length > 0) {
      Array.from(files).forEach(stageFile);
    }
  }, []);

  // Get unread count
  const unreadCount = user ? chatRoom.unreadCounts?.[user._id] || 0 : 0;

  if (isMinimized) {
    return (
      <div
        className="fixed bottom-0 z-[100] cursor-pointer"
        style={{ right: `${rightPosition}px` }}
        onClick={() => toggleMinimize(chatRoomId)}
      >
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-t-xl shadow-lg border border-b-0"
          style={{
            backgroundColor: darkMode ? "#1e293b" : "#ffffff",
            borderColor: darkMode ? "rgba(71, 85, 105, 0.5)" : "rgba(229, 231, 235, 1)",
            minWidth: "200px",
            maxWidth: "300px",
          }}
        >
          <img
            src={chatRoom.course?.logo || "https://via.placeholder.com/32"}
            alt={chatRoom.name}
            className="w-6 h-6 rounded-full object-cover"
          />
          <span
            className="text-sm font-medium truncate flex-1"
            style={{ color: darkMode ? "#e5e7eb" : "#0f172a" }}
          >
            {chatRoom.name}
          </span>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 text-xs font-bold text-white bg-red-500 rounded-full">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              closeChat(chatRoomId);
            }}
            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-600"
          >
            <X className="size-3" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed bottom-0 z-[100] flex flex-col rounded-t-xl shadow-2xl border border-b-0 overflow-hidden"
      style={{
        right: `${rightPosition}px`,
        width: "320px",
        height: "450px",
        backgroundColor: darkMode ? "#0f172a" : "#ffffff",
        borderColor: darkMode ? "rgba(71, 85, 105, 0.5)" : "rgba(229, 231, 235, 1)",
      }}
      onClick={() => bringToFront(chatRoomId)}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {isDragging && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center border-2 border-dashed"
          style={{
            backgroundColor: darkMode ? "rgba(30, 41, 59, 0.95)" : "rgba(248, 250, 252, 0.95)",
            borderColor: "#6366f1",
          }}
        >
          <div className="flex flex-col items-center gap-2 text-indigo-500">
            <Upload className="size-8" />
            <span className="text-sm font-medium">Drop files here</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2 border-b"
        style={{
          backgroundColor: darkMode ? "#1e293b" : "#f8fafc",
          borderColor: darkMode ? "rgba(71, 85, 105, 0.5)" : "rgba(229, 231, 235, 1)",
        }}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <img
            src={chatRoom.course?.logo || "https://via.placeholder.com/32"}
            alt={chatRoom.name}
            className="w-8 h-8 rounded-full object-cover"
          />
          <span
            className="text-sm font-semibold truncate"
            style={{ color: darkMode ? "#e5e7eb" : "#0f172a" }}
          >
            {chatRoom.name}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={openFullChat}
            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            title="Open full chat"
          >
            <ExternalLink className="size-4" style={{ color: darkMode ? "#94a3b8" : "#64748b" }} />
          </button>
          <button
            onClick={() => toggleMinimize(chatRoomId)}
            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            title="Minimize"
          >
            <Minus className="size-4" style={{ color: darkMode ? "#94a3b8" : "#64748b" }} />
          </button>
          <button
            onClick={() => closeChat(chatRoomId)}
            className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
            title="Close"
          >
            <X className="size-4" style={{ color: "#ef4444" }} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-3"
        style={{ backgroundColor: darkMode ? "#020617" : "#f9fafb" }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-sm text-slate-500">
            No messages yet
          </div>
        ) : (
          <>
            {/* Load More Button */}
            {hasMore && (
              <div className="flex justify-center mb-3">
                <button
                  type="button"
                  className="px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  onClick={loadMoreMessages}
                  disabled={isLoadingMore}
                >
                  {isLoadingMore ? (
                    <span className="flex items-center gap-1">
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
                      Loading...
                    </span>
                  ) : (
                    "Load older messages"
                  )}
                </button>
              </div>
            )}
            {messages.map((message, index) => {
              const prev = messages[index - 1];
              const next = messages[index + 1];

              const isNotification = message.isNotification;

              const samePrevSender =
                !!prev &&
                prev.senderId?._id === message.senderId?._id &&
                !prev.isNotification &&
                !isNotification;

              const sameNextSender =
                !!next &&
                next.senderId?._id === message.senderId?._id &&
                !next.isNotification &&
                !isNotification;

              const isFirstInBlock = !samePrevSender;
              const isLastInBlock = !sameNextSender;

              // Use MessageItem for content messages, FileMessageItem for file messages
              if (message.content) {
                return (
                  <MessageItem
                    key={message._id ?? index}
                    {...message}
                    isFirstInBlock={isFirstInBlock}
                    isLastInBlock={isLastInBlock}
                  />
                );
              } else if (message.file) {
                return (
                  <FileMessageItem
                    key={message._id ?? index}
                    {...(message as any)}
                    isFirstInBlock={isFirstInBlock}
                    isLastInBlock={isLastInBlock}
                  />
                );
              }

              return null;
            })}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Staged files preview */}
      {stagedFiles.length > 0 && (
        <div
          className="px-2 py-2 border-t flex gap-2 overflow-x-auto"
          style={{
            backgroundColor: darkMode ? "#1e293b" : "#f8fafc",
            borderColor: darkMode ? "rgba(71, 85, 105, 0.5)" : "rgba(229, 231, 235, 1)",
          }}
        >
          {stagedFiles.map((sf) => (
            <div key={sf.id} className="relative flex-shrink-0 group">
              {sf.preview ? (
                <img
                  src={sf.preview}
                  alt={sf.file.name}
                  className="h-12 w-12 object-cover rounded border"
                  style={{ borderColor: darkMode ? "rgba(71, 85, 105, 0.5)" : "rgba(229, 231, 235, 1)" }}
                />
              ) : (
                <div
                  className="h-12 px-2 flex items-center gap-1 rounded border text-xs"
                  style={{
                    backgroundColor: darkMode ? "#0f172a" : "#ffffff",
                    borderColor: darkMode ? "rgba(71, 85, 105, 0.5)" : "rgba(229, 231, 235, 1)",
                    color: darkMode ? "#e5e7eb" : "#0f172a",
                  }}
                >
                  <FileIcon className="size-3 text-indigo-500" />
                  <span className="truncate max-w-[60px]">{sf.file.name}</span>
                </div>
              )}
              <button
                onClick={() => removeStagedFile(sf.id)}
                className="absolute -top-1 -right-1 p-0.5 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input */}
      <div
        className="border-t p-2"
        style={{
          backgroundColor: darkMode ? "#1e293b" : "#f8fafc",
          borderColor: darkMode ? "rgba(71, 85, 105, 0.5)" : "rgba(229, 231, 235, 1)",
        }}
      >
        <div className="flex items-end gap-2">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            multiple
            onChange={handleFileSelect}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            <Paperclip className="size-4" style={{ color: darkMode ? "#94a3b8" : "#64748b" }} />
          </button>
          
          <div
            ref={editorRef}
            contentEditable
            onInput={checkIfEmpty}
            onKeyDown={handleKeyDown}
            className="flex-1 px-3 py-2 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500/20 max-h-[80px] overflow-y-auto"
            style={{
              backgroundColor: darkMode ? "#0f172a" : "#ffffff",
              borderColor: darkMode ? "rgba(71, 85, 105, 0.5)" : "rgba(229, 231, 235, 1)",
              color: darkMode ? "#e5e7eb" : "#0f172a",
              minHeight: "36px",
            }}
            data-placeholder="Aa"
            suppressContentEditableWarning
          />
          
          {!isEmpty || stagedFiles.length > 0 ? (
            <button
              onClick={handleSendMessage}
              className="p-2 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 transition-colors relative"
            >
              <Send className="size-4" />
              {stagedFiles.length > 0 && (
                <span className="absolute -top-1 -right-1 size-4 flex items-center justify-center text-[10px] font-bold bg-red-500 rounded-full">
                  {stagedFiles.length}
                </span>
              )}
            </button>
          ) : (
            <button
              onClick={handleSendLike}
              className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              <ThumbsUp className="size-4" style={{ color: darkMode ? "#94a3b8" : "#64748b" }} />
            </button>
          )}
        </div>
      </div>

      {/* CSS for placeholder */}
      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: ${darkMode ? "#64748b" : "#94a3b8"};
          pointer-events: none;
        }
      `}</style>
    </div>
  );
};

export default FloatingChatWindow;
