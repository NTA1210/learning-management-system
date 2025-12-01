import { File, MapPin } from "lucide-react";
import React, { useRef } from "react";

interface AttachMenuProps {
  className?: string;
  onItemClick?: (type: "poll" | "file" | "location", file?: File) => void;
}

const AttachMenu: React.FC<AttachMenuProps> = ({ className, onItemClick }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  return (
    <div
      className={`absolute left-0 bottom-14 bg-white shadow-lg rounded-xl p-3 w-48 border border-gray-200 ${className}`}
    >
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="flex flex-col gap-2">
        <button
          className="flex items-center gap-2 px-3 py-2 text-left rounded-lg cursor-pointer hover:bg-gray-100"
          onClick={handleFileClick}
        >
          <File className="size-4" /> Share file
        </button>

        <button
          className="flex items-center gap-2 px-3 py-2 text-left rounded-lg cursor-pointer hover:bg-gray-100"
          onClick={() => onItemClick?.("location")}
        >
          <MapPin className="size-4" /> Location
        </button>

        <button
          className="flex items-center gap-2 px-3 py-2 text-left rounded-lg cursor-pointer hover:bg-gray-100"
          onClick={() => onItemClick?.("poll")}
        >
          <MapPin className="size-4" /> Poll
        </button>
      </div>
    </div>
  );
};

export default AttachMenu;
