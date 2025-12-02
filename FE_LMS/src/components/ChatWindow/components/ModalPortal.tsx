import { createPortal } from "react-dom";

interface Props {
  children: React.ReactNode;
}

export default function ModalPortal({ children }: Props) {
  const portalRoot = document.getElementById("portal") as HTMLElement;
  return createPortal(children, portalRoot);
}
