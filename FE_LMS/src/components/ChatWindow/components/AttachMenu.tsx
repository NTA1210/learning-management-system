import { File, MapPin } from "lucide-react";
import React, { useRef, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "../../../hooks/useTheme";

interface AttachMenuProps {
  className?: string;
  onItemClick?: (type: "poll" | "file" | "location", file?: File) => void;
  anchorRef?: React.RefObject<HTMLElement>;
}

const AttachMenu: React.FC<AttachMenuProps> = ({ className, onItemClick, anchorRef }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { darkMode } = useTheme();
  const [position, setPosition] = useState({ left: 0, bottom: 0 });

  useEffect(() => {
    if (anchorRef?.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPosition({
        left: rect.left,
        bottom: window.innerHeight - rect.top + 8, // 8px gap above the button
      });
    }
  }, [anchorRef]);

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onItemClick?.("file", file);
      e.target.value = ""; // reset để chọn lại file
    }
  };

  const menuContent = (
    <div
      ref={menuRef}
      className={`fixed shadow-lg rounded-xl p-3 w-48 border z-[9999] ${className}`}
      style={{
        left: position.left,
        bottom: position.bottom,
        backgroundColor: darkMode ? "#1e293b" : "#ffffff",
        borderColor: darkMode
          ? "rgba(71, 85, 105, 0.5)"
          : "rgba(229, 231, 235, 1)",
        color: darkMode ? "#e5e7eb" : "#1f2937",
      }}
    >
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="flex flex-col gap-2">
        <button
          className="flex items-center gap-2 px-3 py-2 text-left rounded-lg cursor-pointer transition-colors hover:bg-gray-100 dark:hover:bg-slate-700"
          onClick={handleFileClick}
        >
          <File className="size-4" /> Share file
        </button>

        <button
          className="flex items-center gap-2 px-3 py-2 text-left rounded-lg cursor-pointer transition-colors hover:bg-gray-100 dark:hover:bg-slate-700"
          onClick={() => onItemClick?.("location")}
        >
          <MapPin className="size-4" /> Location
        </button>

        <button
          className="flex items-center gap-2 px-3 py-2 text-left rounded-lg cursor-pointer transition-colors hover:bg-gray-100 dark:hover:bg-slate-700"
          onClick={() => onItemClick?.("poll")}
        >
          <MapPin className="size-4" /> Poll
        </button>
      </div>
    </div>
  );

  return createPortal(menuContent, document.body);
};

export default AttachMenu;
