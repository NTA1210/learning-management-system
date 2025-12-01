import { Contact, Settings } from "lucide-react";
import { useEffect, useState, type JSX } from "react";
import { useNavigate } from "react-router-dom";

function Header(): JSX.Element {
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

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

  return (
    <div className="flex items-center justify-between p-4 text-white bg-sky-500">
      <div className="flex items-center justify-start gap-2">
        <span
          className="flex items-center space-x-3"
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
        <button className="p-2 rounded-full cursor-pointer">
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
