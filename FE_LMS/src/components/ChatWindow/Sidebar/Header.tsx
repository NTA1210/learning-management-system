import { Contact, Settings, Plus } from "lucide-react";
import { useEffect, useState, type JSX } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../../hooks/useTheme";
import CreateChatGroupModal from "../CreateChatGroupModal";

function Header(): JSX.Element {
  const [user, setUser] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const navigate = useNavigate();
  const { darkMode } = useTheme();

  useEffect(() => {
    const storedUser = localStorage.getItem("lms:user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleReturnHomePage = () => {
    const path = "/admin/dashboard";
    switch (user?.role) {
      case "admin":
        navigate(path);
        break;
      case "teacher":
        navigate("/teacher-dashboard");
        break;
      case "student":
        navigate("/student-dashboard");
        break;
      default:
        navigate("/");
    }
  };

  const canCreateGroup = user?.role === "admin" || user?.role === "teacher";

  const handleChatCreated = () => {
    // Reload page to refresh chat rooms list
    window.location.reload();
  };

  return (
    <>
      <div className="flex items-center justify-between p-4 text-white bg-indigo-600">
        <div className="flex items-center justify-start gap-2">
          <span
            className="flex items-center space-x-3 cursor-pointer"
            onClick={handleReturnHomePage}
          >
            <div
              className="flex items-center justify-center w-10 h-10 shadow-lg rounded-xl"
              style={{ backgroundColor: "#6366f1" }}
            >
              <span className="text-lg font-bold text-white">F</span>
            </div>
          </span>
          <h1 className="text-xl font-bold">Message</h1>
        </div>
        <div className="flex space-x-3">
          {canCreateGroup && (
            <button
              className="p-2 rounded-full cursor-pointer hover:bg-indigo-500 transition-colors"
              onClick={() => setShowCreateModal(true)}
              title="Create Chat Group"
            >
              <Plus className="size-4" />
            </button>
          )}
          <button className="p-2 rounded-full cursor-pointer hover:bg-indigo-500 transition-colors">
            <Contact className="size-4" />
          </button>
          <button className="p-2 rounded-full cursor-pointer hover:bg-indigo-500 transition-colors">
            <Settings className="size-4" />
          </button>
        </div>
      </div>

      {/* Create Chat Group Modal */}
      <CreateChatGroupModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        darkMode={darkMode}
        onChatCreated={handleChatCreated}
      />
    </>
  );
}

export default Header;
