import { Send, Plus, ThumbsUp, MapPin, X, Smile, Image, Paperclip, Bold, Italic, Underline, Strikethrough, List, ListOrdered, Link, Code, Quote, Type, Trash2, Upload, File as FileIcon, Mic } from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";
import { useChatRoomStore } from "../../stores/chatRoomStore";
import { useSocketContext } from "../../context/SocketContext";
import AttachMenu from "./components/AttachMenu";
import { useTheme } from "../../hooks/useTheme";
import VoiceRecorder from "./VoiceRecorder";

// Type for staged files with preview
interface StagedFile {
  file: File;
  id: string;
  preview?: string;
}

const MessageInput: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const { selectedChatRoom } = useChatRoomStore();
  const { socket } = useSocketContext();
  const [openPopup, setOpenPopup] = useState(false);
  const [showFormatting, setShowFormatting] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const { darkMode } = useTheme();

  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);
  const editorRef = useRef<HTMLDivElement | null>(null);
  const attachButtonRef = useRef<HTMLButtonElement | null>(null);
  const dropZoneRef = useRef<HTMLDivElement | null>(null);
  const dragCounterRef = useRef(0);

  useEffect(() => {
    const user = localStorage.getItem("lms:user");
    if (user) {
      setUser(JSON.parse(user));
    }
  }, []);

  const emitTyping = (isTyping: boolean) => {
    if (!socket || !user || !selectedChatRoom) return;

    socket.emit("conversation:typing", {
      chatRoomId: selectedChatRoom.chatRoomId,
      isTyping,
    });
    isTypingRef.current = isTyping;
  };

  const checkIfEmpty = useCallback(() => {
    if (editorRef.current) {
      const text = editorRef.current.innerText?.trim() || "";
      setIsEmpty(text.length === 0);
    }
  }, []);

  const getMessageContent = (): string => {
    if (!editorRef.current) return "";
    // Get HTML content and convert to markdown-like format for sending
    return editorRef.current.innerHTML || "";
  };

  const getPlainText = (): string => {
    if (!editorRef.current) return "";
    return editorRef.current.innerText?.trim() || "";
  };

  if (!selectedChatRoom) return null;

  const handleSendMessage = () => {
    const content = getPlainText();
    const hasContent = content !== "";
    const hasFiles = stagedFiles.length > 0;
    
    if ((!hasContent && !hasFiles) || !user || !socket) return;

    // Send text message if there's content
    if (hasContent) {
      // Get the HTML content to preserve formatting
      const htmlContent = getMessageContent();
      
      // Clean up HTML for sending (keep formatting tags)
      const cleanedContent = cleanHtmlContent(htmlContent);

      socket.emit("chatroom:send-message", {
        chatRoomId: selectedChatRoom.chatRoomId,
        userId: user._id,
        senderRole: user.role,
        content: cleanedContent,
      });
    }

    // Send all staged files
    if (hasFiles) {
      stagedFiles.forEach((stagedFile) => {
        sendFile(stagedFile.file);
      });
      // Clear staged files and revoke object URLs
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
    setShowFormatting(false);

    if (isTypingRef.current) emitTyping(false);
  };

  // Clean HTML content - keep formatting but remove unwanted tags
  const cleanHtmlContent = (html: string): string => {
    let cleaned = html;
    // Replace div/p with br for better rendering
    cleaned = cleaned.replace(/<div><br><\/div>/gi, "\n");
    cleaned = cleaned.replace(/<div>/gi, "<br>");
    cleaned = cleaned.replace(/<\/div>/gi, "");
    cleaned = cleaned.replace(/<p>/gi, "");
    cleaned = cleaned.replace(/<\/p>/gi, "<br>");
    // Remove leading/trailing br tags
    cleaned = cleaned.replace(/^(<br\s*\/?>)+/i, "");
    cleaned = cleaned.replace(/(<br\s*\/?>)+$/i, "");
    // Trim whitespace
    cleaned = cleaned.trim();
    // If content is just plain text (no HTML tags), return as is
    if (!/<[^>]+>/.test(cleaned)) {
      return cleaned;
    }
    return cleaned;
  };

  // Convert HTML to markdown (keeping for fallback/compatibility)
  const htmlToMarkdown = (html: string): string => {
    let markdown = html;
    // Convert common HTML to markdown
    markdown = markdown.replace(/<b>(.*?)<\/b>/gi, "**$1**");
    markdown = markdown.replace(/<strong>(.*?)<\/strong>/gi, "**$1**");
    markdown = markdown.replace(/<i>(.*?)<\/i>/gi, "_$1_");
    markdown = markdown.replace(/<em>(.*?)<\/em>/gi, "_$1_");
    markdown = markdown.replace(/<u>(.*?)<\/u>/gi, "<u>$1</u>");
    markdown = markdown.replace(/<s>(.*?)<\/s>/gi, "~~$1~~");
    markdown = markdown.replace(/<strike>(.*?)<\/strike>/gi, "~~$1~~");
    markdown = markdown.replace(/<code>(.*?)<\/code>/gi, "`$1`");
    markdown = markdown.replace(/<br\s*\/?>/gi, "\n");
    markdown = markdown.replace(/<div>/gi, "\n");
    markdown = markdown.replace(/<\/div>/gi, "");
    markdown = markdown.replace(/<p>/gi, "");
    markdown = markdown.replace(/<\/p>/gi, "\n");
    markdown = markdown.replace(/&nbsp;/gi, " ");
    markdown = markdown.replace(/<[^>]*>/g, ""); // Remove any remaining HTML tags
    return markdown.trim();
  };

  const handleSendLike = () => {
    if (!user || !socket) return;

    socket.emit("chatroom:send-message", {
      chatRoomId: selectedChatRoom.chatRoomId,
      userId: user._id,
      senderRole: user.role,
      content: "👍",
    });
  };

  const handleSendLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const locationMessage = `[📍 My Location](https://www.google.com/maps?q=${latitude},${longitude})\n\n<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d383.1395853422083!2d${longitude}!3d${latitude}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2z${latitude}N+${longitude}E!5e0!3m2!1sen!2s!4v1700000000000" width="300" height="200" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>`;

        if (socket && user) {
          socket.emit("chatroom:send-message", {
            chatRoomId: selectedChatRoom.chatRoomId,
            userId: user._id,
            senderRole: user.role,
            content: locationMessage,
          });
        }
        setShowLocationPicker(false);
        setOpenPopup(false);
      },
      (error) => {
        console.error("Error getting location:", error);
        alert("Unable to get your location. Please check your permissions.");
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInput = () => {
    checkIfEmpty();

    if (!isTypingRef.current) emitTyping(true);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => emitTyping(false), 500);
  };

  // Format commands using execCommand
  const formatText = (command: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    checkIfEmpty();
  };

  const handleAttachItemClick = (
    type: "poll" | "file" | "location",
    file?: File
  ) => {
    setOpenPopup(false);

    if (type === "file" && file) {
      stageFile(file);
    }

    if (type === "location") {
      setShowLocationPicker(true);
    }

    if (type === "poll") {
      console.log("Send poll");
    }
  };

  // Stage a file for sending (with preview for images)
  const stageFile = (file: File) => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const isImage = file.type.startsWith("image/");
    const preview = isImage ? URL.createObjectURL(file) : undefined;
    
    setStagedFiles((prev) => [...prev, { file, id, preview }]);
  };

  // Remove a staged file
  const removeStagedFile = (id: string) => {
    setStagedFiles((prev) => {
      const fileToRemove = prev.find((f) => f.id === id);
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return prev.filter((f) => f.id !== id);
    });
  };

  // Send file via socket
  const sendFile = (file: File) => {
    if (!socket || !user || !selectedChatRoom) return;
    
    const reader = new FileReader();
    reader.onload = () => {
      const arrayBuffer = reader.result;
      socket.emit("chatroom:send-file", {
        chatRoomId: selectedChatRoom.chatRoomId,
        userId: user._id,
        senderRole: user.role,
        fileName: file.name,
        mimeType: file.type,
        data: arrayBuffer,
      });
    };
    reader.readAsArrayBuffer(file);
  };

  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
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
    if (files && files.length > 0) {
      // Stage all dropped files (don't send immediately)
      Array.from(files).forEach((file) => {
        stageFile(file);
      });
    }
  }, []);

  const clearEditor = () => {
    if (editorRef.current) {
      editorRef.current.innerHTML = "";
    }
    setIsEmpty(true);
  };

  const ToolbarButton = ({ onClick, children, title }: { onClick: () => void; children: React.ReactNode; title: string }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors ${
        darkMode ? "text-slate-300" : "text-slate-600"
      }`}
    >
      {children}
    </button>
  );

  const Divider = () => (
    <span className={`w-px h-5 mx-1 ${darkMode ? "bg-slate-600" : "bg-slate-300"}`} />
  );

  return (
    <div
      ref={dropZoneRef}
      className="px-4 py-3 border-t relative"
      style={{
        backgroundColor: darkMode ? "#020617" : "#ffffff",
        borderColor: darkMode ? "rgba(31,41,55,0.9)" : "rgba(229,231,235,1)",
      }}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Drag Overlay */}
      {isDragging && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center rounded-xl border-2 border-dashed"
          style={{
            backgroundColor: darkMode ? "rgba(30, 41, 59, 0.95)" : "rgba(248, 250, 252, 0.95)",
            borderColor: "#6366f1",
          }}
        >
          <div className="flex flex-col items-center gap-2 text-indigo-500">
            <Upload className="size-10" />
            <span className="font-medium">Drop files here to send</span>
            <span className="text-sm text-slate-500">Images, documents, and more</span>
          </div>
        </div>
      )}

      {/* Location Picker Modal */}
      {showLocationPicker && (
        <div
          className="mb-3 p-4 rounded-xl border"
          style={{
            backgroundColor: darkMode ? "#1e293b" : "#f8fafc",
            borderColor: darkMode ? "rgba(71, 85, 105, 0.5)" : "rgba(229, 231, 235, 1)",
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <MapPin className="size-4 text-indigo-500" />
              <span className="font-medium text-sm">Share Your Location</span>
            </div>
            <button
              onClick={() => setShowLocationPicker(false)}
              className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"
            >
              <X className="size-4" />
            </button>
          </div>
          <p className="text-xs text-slate-500 mb-3">
            Click the button below to share your current location with embedded map.
          </p>
          <button
            onClick={handleSendLocation}
            className="w-full py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
          >
            📍 Send My Current Location
          </button>
        </div>
      )}

      {/* Staged Files Preview */}
      {stagedFiles.length > 0 && (
        <div
          className="mb-3 p-3 rounded-xl border"
          style={{
            backgroundColor: darkMode ? "#1e293b" : "#f8fafc",
            borderColor: darkMode ? "rgba(71, 85, 105, 0.5)" : "rgba(229, 231, 235, 1)",
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">
              {stagedFiles.length} file{stagedFiles.length > 1 ? "s" : ""} ready to send
            </span>
            <button
              onClick={() => {
                stagedFiles.forEach((sf) => {
                  if (sf.preview) URL.revokeObjectURL(sf.preview);
                });
                setStagedFiles([]);
              }}
              className="text-xs text-red-500 hover:text-red-600"
            >
              Clear all
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {stagedFiles.map((stagedFile) => (
              <div
                key={stagedFile.id}
                className="relative group"
              >
                {stagedFile.preview ? (
                  // Image preview
                  <div className="relative">
                    <img
                      src={stagedFile.preview}
                      alt={stagedFile.file.name}
                      className="h-16 w-16 object-cover rounded-lg border"
                      style={{
                        borderColor: darkMode ? "rgba(71, 85, 105, 0.5)" : "rgba(229, 231, 235, 1)",
                      }}
                    />
                    <button
                      onClick={() => removeStagedFile(stagedFile.id)}
                      className="absolute -top-1.5 -right-1.5 p-0.5 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ) : (
                  // File preview (non-image)
                  <div
                    className="relative flex items-center gap-2 px-3 py-2 rounded-lg border"
                    style={{
                      backgroundColor: darkMode ? "#0f172a" : "#ffffff",
                      borderColor: darkMode ? "rgba(71, 85, 105, 0.5)" : "rgba(229, 231, 235, 1)",
                    }}
                  >
                    <FileIcon className="size-4 text-indigo-500" />
                    <div className="flex flex-col">
                      <span className="text-xs font-medium truncate max-w-[120px]">
                        {stagedFile.file.name}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {formatFileSize(stagedFile.file.size)}
                      </span>
                    </div>
                    <button
                      onClick={() => removeStagedFile(stagedFile.id)}
                      className="ml-1 p-0.5 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Voice Recorder - shows above the main editor when recording */}
      {isRecording && (
        <div className="mb-3">
          <VoiceRecorder
            isRecording={isRecording}
            setIsRecording={setIsRecording}
            onSend={(audioBlob, duration) => {
              if (!user || !socket || !selectedChatRoom) return;
              const reader = new FileReader();
              reader.onload = () => {
                socket.emit("chatroom:send-file", {
                  chatRoomId: selectedChatRoom.chatRoomId,
                  userId: user._id,
                  senderRole: user.role,
                  fileName: `voice_message_${Date.now()}.mp3`,
                  mimeType: "audio/mpeg",
                  data: reader.result,
                  duration,
                });
              };
              reader.readAsArrayBuffer(audioBlob);
            }}
            onCancel={() => setIsRecording(false)}
          />
        </div>
      )}

      {/* Main Editor Container */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{
          backgroundColor: darkMode ? "#1e293b" : "#ffffff",
          borderColor: darkMode ? "rgba(71, 85, 105, 0.5)" : "rgba(229, 231, 235, 1)",
        }}
      >
        {/* Formatting Toolbar - Only shows when showFormatting is true */}
        {showFormatting && (
          <div
            className="flex items-center gap-0.5 px-3 py-2 border-b flex-wrap"
            style={{
              borderColor: darkMode ? "rgba(71, 85, 105, 0.5)" : "rgba(229, 231, 235, 1)",
            }}
          >
            <ToolbarButton onClick={() => formatText("bold")} title="Bold">
              <Bold className="size-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => formatText("italic")} title="Italic">
              <Italic className="size-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => formatText("underline")} title="Underline">
              <Underline className="size-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => formatText("strikeThrough")} title="Strikethrough">
              <Strikethrough className="size-4" />
            </ToolbarButton>

            <Divider />

            <ToolbarButton onClick={() => formatText("insertUnorderedList")} title="Bullet List">
              <List className="size-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => formatText("insertOrderedList")} title="Numbered List">
              <ListOrdered className="size-4" />
            </ToolbarButton>

            <Divider />

            <ToolbarButton onClick={() => {
              const url = prompt("Enter URL:");
              if (url) formatText("createLink", url);
            }} title="Insert Link">
              <Link className="size-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => formatText("formatBlock", "pre")} title="Code Block">
              <Code className="size-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => formatText("formatBlock", "blockquote")} title="Quote">
              <Quote className="size-4" />
            </ToolbarButton>

            {/* Delete/Clear button on right */}
            <div className="ml-auto">
              <ToolbarButton onClick={clearEditor} title="Clear">
                <Trash2 className="size-4" />
              </ToolbarButton>
            </div>
          </div>
        )}

        {/* Rich Text Editor Area */}
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          className="px-4 py-3 text-sm focus:outline-none min-h-[44px] max-h-[200px] overflow-y-auto"
          style={{
            color: darkMode ? "#e5e7eb" : "#0f172a",
          }}
          data-placeholder="Type a message..."
          suppressContentEditableWarning
        />

        {/* Bottom Action Bar */}
        <div
          className="flex items-center justify-between px-3 py-2 border-t"
          style={{
            borderColor: darkMode ? "rgba(71, 85, 105, 0.5)" : "rgba(229, 231, 235, 1)",
          }}
        >
          {/* Left side icons */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShowFormatting(!showFormatting)}
              title="Show Formatting options"
              className={`p-2 rounded-lg transition-colors ${
                showFormatting
                  ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400"
                  : darkMode
                    ? "text-slate-400 hover:bg-slate-700 hover:text-slate-200"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              }`}
            >
              <Type className="size-5" />
            </button>

            <button
              type="button"
              title="Emoji"
              className={`p-2 rounded-lg transition-colors ${
                darkMode
                  ? "text-slate-400 hover:bg-slate-700 hover:text-slate-200"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              }`}
            >
              <Smile className="size-5" />
            </button>

            <button
              type="button"
              title="Attach Image"
              className={`p-2 rounded-lg transition-colors ${
                darkMode
                  ? "text-slate-400 hover:bg-slate-700 hover:text-slate-200"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              }`}
            >
              <Image className="size-5" />
            </button>

            <div className="relative">
              <button
                ref={attachButtonRef}
                type="button"
                onClick={() => setOpenPopup((prev) => !prev)}
                title="Attach File"
                className={`p-2 rounded-lg transition-colors ${
                  darkMode
                    ? "text-slate-400 hover:bg-slate-700 hover:text-slate-200"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                }`}
              >
                <Paperclip className="size-5" />
              </button>
              {openPopup && <AttachMenu onItemClick={handleAttachItemClick} anchorRef={attachButtonRef} />}
            </div>

            <button
              type="button"
              onClick={() => setOpenPopup((prev) => !prev)}
              title="More options"
              className={`p-2 rounded-lg transition-colors ${
                darkMode
                  ? "text-slate-400 hover:bg-slate-700 hover:text-slate-200"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              }`}
            >
              <Plus className="size-5" />
            </button>
          </div>

          {/* Divider */}
          <span className={`w-px h-6 mx-2 ${darkMode ? "bg-slate-600" : "bg-slate-300"}`} />

          {/* Send button, Voice recorder, or Like button */}
          {!isEmpty || stagedFiles.length > 0 ? (
            <button
              onClick={handleSendMessage}
              type="button"
              title={stagedFiles.length > 0 ? `Send ${stagedFiles.length} file${stagedFiles.length > 1 ? "s" : ""}` : "Send"}
              className="p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors relative"
            >
              <Send className="size-5" />
              {stagedFiles.length > 0 && (
                <span className="absolute -top-1 -right-1 size-4 flex items-center justify-center text-[10px] font-bold bg-red-500 text-white rounded-full">
                  {stagedFiles.length}
                </span>
              )}
            </button>
          ) : (
            <div className="flex items-center gap-1">
              {/* Voice recorder button */}
              <button
                onClick={() => setIsRecording(true)}
                type="button"
                title="Record voice message"
                className={`p-2 rounded-lg transition-colors ${
                  darkMode
                    ? "text-slate-400 hover:bg-slate-700 hover:text-slate-200"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                }`}
              >
                <Mic className="size-5" />
              </button>
              <button
                onClick={handleSendLike}
                type="button"
                title="Send Like"
                className={`p-2 rounded-lg transition-colors ${
                  darkMode
                    ? "text-slate-400 hover:bg-slate-700 hover:text-slate-200"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                }`}
              >
                <ThumbsUp className="size-5" />
              </button>
            </div>
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
        [contenteditable] blockquote {
          border-left: 3px solid ${darkMode ? "#6366f1" : "#818cf8"};
          padding-left: 12px;
          margin: 4px 0;
          color: ${darkMode ? "#94a3b8" : "#64748b"};
        }
        [contenteditable] pre {
          background: ${darkMode ? "#0f172a" : "#f1f5f9"};
          padding: 8px 12px;
          border-radius: 6px;
          font-family: monospace;
          margin: 4px 0;
        }
        [contenteditable] ul, [contenteditable] ol {
          padding-left: 20px;
          margin: 4px 0;
        }
        [contenteditable] a {
          color: #6366f1;
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
};

export default MessageInput;
