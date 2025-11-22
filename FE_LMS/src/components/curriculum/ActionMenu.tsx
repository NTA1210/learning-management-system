import React, { useEffect, useRef } from "react";
import { MoreVertical, Edit, Trash2, Plus } from "lucide-react";
import { useTheme } from "../../hooks/useTheme";

interface ActionMenuProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  type: "major" | "specialist" | "subject" | "course";
  onEdit?: () => void;
  onDelete?: () => void;
  onAddSpecialist?: () => void;
  onAddSubject?: () => void;
  onAddCourse?: () => void;
  onReload?: () => void;
}

const ActionMenu: React.FC<ActionMenuProps> = ({
  isOpen,
  onToggle,
  onClose,
  type,
  onEdit,
  onDelete,
  onAddSpecialist,
  onAddSubject,
  onAddCourse,
  onReload,
}) => {
  const { darkMode } = useTheme();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  return (
    <div style={{ position: "relative", display: "inline-block" }} ref={menuRef}>
      <button
        className="p-1 rounded hover:bg-opacity-20 transition-colors"
        style={{
          backgroundColor: "transparent",
          border: "none",
          cursor: "pointer",
          color: darkMode ? "#9ca3af" : "#6b7280",
        }}
        onClick={onToggle}
      >
        <MoreVertical size={18} />
      </button>
      {isOpen && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "100%",
            marginTop: "4px",
            backgroundColor: darkMode ? "#1f2937" : "#ffffff",
            border: `1px solid ${darkMode ? "#374151" : "#e5e7eb"}`,
            borderRadius: "8px",
            boxShadow: darkMode ? "0 4px 6px rgba(0,0,0,0.3)" : "0 4px 6px rgba(0,0,0,0.1)",
            zIndex: 1000,
            minWidth: type === "major" ? "190px" : "160px",
          }}
        >
          {type === "major" && onAddSpecialist && (
            <button
              className="w-full text-left px-4 py-2 hover:bg-opacity-20 transition-colors flex items-center gap-2"
              style={{ color: darkMode ? "#d1d5db" : "#374151", fontSize: "14px" }}
              onClick={() => {
                onAddSpecialist();
                onClose();
              }}
            >
              <Plus size={16} />
              Add Specialist
            </button>
          )}
          {type === "major" && onReload && (
            <button
              className="w-full text-left px-4 py-2 hover:bg-opacity-20 transition-colors flex items-center gap-2"
              style={{ color: darkMode ? "#d1d5db" : "#374151", fontSize: "14px" }}
              onClick={() => {
                onReload();
                onClose();
              }}
            >
              ⟳ Reload Specialists
            </button>
          )}
          {type === "major" && onEdit && (
            <button
              className="w-full text-left px-4 py-2 hover:bg-opacity-20 transition-colors flex items-center gap-2"
              style={{ color: darkMode ? "#d1d5db" : "#374151", fontSize: "14px" }}
              onClick={() => {
                onEdit();
                onClose();
              }}
            >
              <Edit size={16} />
              Edit Major
            </button>
          )}
          {type === "major" && onDelete && (
            <button
              className="w-full text-left px-4 py-2 hover:bg-opacity-20 transition-colors flex items-center gap-2"
              style={{ color: darkMode ? "#fca5a5" : "#dc2626", fontSize: "14px" }}
              onClick={() => {
                onDelete();
                onClose();
              }}
            >
              <Trash2 size={16} />
              Delete Major
            </button>
          )}
          {type === "specialist" && onAddSubject && (
            <button
              className="w-full text-left px-4 py-2 hover:bg-opacity-20 transition-colors flex items-center gap-2"
              style={{ color: darkMode ? "#d1d5db" : "#374151", fontSize: "14px" }}
              onClick={() => {
                onAddSubject();
                onClose();
              }}
            >
              <Plus size={16} />
              Add Subject
            </button>
          )}
          {type === "specialist" && onEdit && (
            <button
              className="w-full text-left px-4 py-2 hover:bg-opacity-20 transition-colors flex items-center gap-2"
              style={{
                color: darkMode ? "#d1d5db" : "#374151",
                fontSize: "14px",
              }}
              onClick={() => {
                onEdit();
                onClose();
              }}
            >
              <Edit size={16} />
              Edit
            </button>
          )}
          {type === "specialist" && onDelete && (
            <button
              className="w-full text-left px-4 py-2 hover:bg-opacity-20 transition-colors flex items-center gap-2"
              style={{
                color: darkMode ? "#fca5a5" : "#dc2626",
                fontSize: "14px",
              }}
              onClick={() => {
                onDelete();
                onClose();
              }}
            >
              <Trash2 size={16} />
              Delete
            </button>
          )}
          {type === "subject" && onAddCourse && (
            <button
              className="w-full text-left px-4 py-2 hover:bg-opacity-20 transition-colors flex items-center gap-2"
              style={{ color: darkMode ? "#d1d5db" : "#374151", fontSize: "14px" }}
              onClick={() => {
                onAddCourse();
                onClose();
              }}
            >
              <Plus size={16} />
              Add Course
            </button>
          )}
          {type === "subject" && onEdit && (
            <button
              className="w-full text-left px-4 py-2 hover:bg-opacity-20 transition-colors flex items-center gap-2"
              style={{ color: darkMode ? "#d1d5db" : "#374151", fontSize: "14px" }}
              onClick={() => {
                onEdit();
                onClose();
              }}
            >
              <Edit size={16} />
              Edit Subject
            </button>
          )}
          {type === "subject" && onDelete && (
            <button
              className="w-full text-left px-4 py-2 hover:bg-opacity-20 transition-colors flex items-center gap-2"
              style={{ color: darkMode ? "#fca5a5" : "#dc2626", fontSize: "14px" }}
              onClick={() => {
                onDelete();
                onClose();
              }}
            >
              <Trash2 size={16} />
              Delete Subject
            </button>
          )}
          {type === "course" && onEdit && (
            <button
              className="w-full text-left px-4 py-2 hover:bg-opacity-20 transition-colors flex items-center gap-2"
              style={{ color: darkMode ? "#d1d5db" : "#374151", fontSize: "14px" }}
              onClick={() => {
                onEdit();
                onClose();
              }}
            >
              <Edit size={16} />
              Edit Course
            </button>
          )}
          {type === "course" && onDelete && (
            <button
              className="w-full text-left px-4 py-2 hover:bg-opacity-20 transition-colors flex items-center gap-2"
              style={{ color: darkMode ? "#fca5a5" : "#dc2626", fontSize: "14px" }}
              onClick={() => {
                onDelete();
                onClose();
              }}
            >
              <Trash2 size={16} />
              Delete Course
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ActionMenu;

