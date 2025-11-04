import React, { useState } from "react";
import FAQPopup from "./FAQPopup";

const FAQButton = ({ buttonText = "FAQ", className = "" }: { buttonText?: string; className?: string }) => {
  const [isFAQOpen, setIsFAQOpen] = useState(false);

  const openFAQ = () => setIsFAQOpen(true);
  const closeFAQ = () => setIsFAQOpen(false);

  return (
    <>
      <button
        onClick={openFAQ}
        className={`text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors focus:outline-none ${className}`}
      >
        {buttonText}
      </button>
      <FAQPopup isOpen={isFAQOpen} onClose={closeFAQ} />
    </>
  );
};

export default FAQButton;



