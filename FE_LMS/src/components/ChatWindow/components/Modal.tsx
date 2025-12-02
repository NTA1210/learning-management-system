import { useEffect } from "react";
import ModalPortal from "./ModalPortal";
import { useTheme } from "../../../hooks/useTheme";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export default function Modal({ open, onClose, children }: ModalProps) {
  const { darkMode } = useTheme();

  useEffect(() => {
    if (open) {
      // khóa scroll body
      document.documentElement.style.overflow = "hidden";
    } else {
      document.documentElement.style.overflow = "";
    }

    // cleanup khi component unmount
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 flex items-center justify-center pointer-events-auto z-1000 bg-black/50"
        onClick={onClose}
      >
        <div
          className="p-6 rounded-lg shadow-2xl"
          style={{
            backgroundColor: darkMode ? "rgba(30, 41, 59, 0.95)" : "#ffffff",
            color: darkMode ? "#e5e7eb" : "#1f2937",
            border: darkMode ? "1px solid rgba(71, 85, 105, 0.5)" : "1px solid rgba(229, 231, 235, 0.8)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    </ModalPortal>
  );
}
