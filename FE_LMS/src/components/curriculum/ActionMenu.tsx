import React, { useEffect, useRef } from "react";
import { MoreVertical, Edit, Trash2, Plus } from "lucide-react";
import { useTheme } from "../../hooks/useTheme";

interface ActionMenuProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  type: 'major' | 'specialist';
  onEdit?: () => void;
  onDelete?: () => void;
  onAddSpecialist?: () => void;
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
            minWidth: type === 'major' ? "180px" : "150px",
          }}
        >
          {type === 'major' && onAddSpecialist && (
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
          {type === 'major' && onReload && (
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
          {type === 'specialist' && onEdit && (
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
          {type === 'specialist' && onDelete && (
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
        </div>
      )}
    </div>
  );
};

export default ActionMenu;

