import { useEffect } from "react";
import ModalPortal from "./ModalPortal";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export default function Modal({ open, onClose, children }: ModalProps) {
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
          className="p-4 bg-white rounded shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    </ModalPortal>
  );
}
