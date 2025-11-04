import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { useTheme } from "../hooks/useTheme";
import FAQPopup from "../components/FAQPopup";

const FAQPage = () => {
  const { darkMode } = useTheme();
  const [isFAQOpen, setIsFAQOpen] = useState(true);

  useEffect(() => { setIsFAQOpen(true); }, []);

  return (
    <div
      className="flex h-screen overflow-hidden relative"
      style={{
        backgroundColor: darkMode ? "#1a202c" : "#f8fafc",
        color: darkMode ? "#ffffff" : "#1e293b",
      }}
    >
      <Navbar />
      <Sidebar />

      <div className="flex flex-col flex-1 w-0 overflow-hidden">
        <main className="flex-1 relative overflow-y-auto focus:outline-none p-4 mt-16 sm:pl-24 md:pl-28">
          {!isFAQOpen && (
            <div className="max-w-6xl mx-auto px-4">
              <div className="text-center">
                <h1 className="text-3xl font-bold mb-4">FAQ / Usage Guide</h1>
                <p className="mb-6" style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>
                  Answers to frequently asked questions about using FStudyMate.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>

      <FAQPopup isOpen={isFAQOpen} closable={false} />
    </div>
  );
};

export default FAQPage;


