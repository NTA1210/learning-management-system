import { Contact, Settings } from "lucide-react";
import { useState, type JSX } from "react";

function Header(): JSX.Element {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  return (
    <div className="flex items-center justify-between p-4 text-white bg-sky-500">
      <h1 className="text-xl font-bold">Message</h1>
      <div className="flex space-x-3">
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 rounded-full cursor-pointer"
        >
          <Contact className="size-4" />
        </button>
        <button className="p-2 rounded-full cursor-pointer">
          <Settings className="size-4" />
        </button>
      </div>
    </div>
  );
}

export default Header;
