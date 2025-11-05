import { useParams, useNavigate } from "react-router-dom";
import LandingHeader from "../components/LandingHeader";
import LandingFooter from "../components/LandingFooter";
import { useTheme } from "../hooks/useTheme";

type CourseUi = {
  title: string;
  image: string;
  description: string;
  category: string;
  instructors: string[];
  lessons: string[];
};

const COURSE_CONTENT: Record<string, CourseUi> = {
  "html-css": {
    title: "HTML, CSS",
    image: "https://files.fullstack.edu.vn/f8-prod/courses/2.png",
    description:
      "Khóa học nền tảng về HTML/CSS: cấu trúc tài liệu, semantic, responsive, layout và best practices.",
    category: "Frontend",
    instructors: ["Nguyễn Văn A", "Trần Thị B"],
    lessons: [
      "Giới thiệu HTML & Semantic",
      "Text, Link, Image, List",
      "Form & Validation cơ bản",
      "CSS Selectors & Specificity",
      "Flexbox & Grid Layout",
      "Responsive Design & Media Queries",
    ],
  },
  javascript: {
    title: "JavaScript",
    image: "https://files.fullstack.edu.vn/f8-prod/courses/3.png",
    description:
      "JavaScript từ căn bản đến nâng cao: ES6+, DOM, Async, Patterns và thực hành dự án.",
    category: "Frontend",
    instructors: ["Phạm Văn C"],
    lessons: [
      "Biến, Kiểu dữ liệu, Toán tử",
      "Hàm, Scope, Closures",
      "Array & Object nâng cao",
      "DOM & Event",
      "Promise, Async/Await",
      "Modules & Tooling",
    ],
  },
  "node-expressjs": {
    title: "Node & ExpressJS",
    image: "https://files.fullstack.edu.vn/f8-prod/courses/6.png",
    description:
      "Xây dựng backend với Node.js, Express: routing, middleware, REST API, auth, và deploy.",
    category: "Backend",
    instructors: ["Lê Văn D"],
    lessons: [
      "Node.js Fundamentals",
      "Express Routing & Middleware",
      "REST API & Validation",
      "Authentication & Authorization",
      "Error Handling & Logging",
      "Deployment & Scaling",
    ],
  },
  ai: {
    title: "AI",
    image: "https://files.fullstack.edu.vn/f8-prod/courses/4/61a9e9e701506.png",
    description:
      "Nhập môn Trí tuệ nhân tạo: thuật toán cơ bản, machine learning, ứng dụng thực tế.",
    category: "AI/ML",
    instructors: ["Đinh Thị E"],
    lessons: [
      "AI Overview & Use-cases",
      "Supervised vs Unsupervised Learning",
      "Feature Engineering",
      "Evaluation Metrics",
      "Model Serving",
      "Ethics & Responsible AI",
    ],
  },
};

export default function CourseDetail() {
  const { slug = "" } = useParams();
  const navigate = useNavigate();
  const { darkMode: isDarkMode } = useTheme();

  const data = COURSE_CONTENT[slug];

  return (
    <div
      className="min-h-screen transition-colors duration-300"
      style={{
        backgroundColor: isDarkMode ? "#111827" : "#f9fafb",
        color: isDarkMode ? "#ffffff" : "#000000",
      }}
    >
      <LandingHeader />

      <div className="max-w-[1200px] mx-auto px-4 py-10">
        {!data ? (
          <div className="text-center py-20">
            <h1
              className="text-3xl font-bold mb-4"
              style={{ color: isDarkMode ? "#ffffff" : "#1c1c1c" }}
            >
              Không tìm thấy khóa học
            </h1>
            <p
              className="mb-6"
              style={{ color: isDarkMode ? "#d1d5db" : "#4b5563" }}
            >
              Vui lòng quay lại và chọn một khóa học hợp lệ.
            </p>
            <button
              onClick={() => navigate("/")}
              className="bg-[#525fe1] text-white px-5 py-2 rounded-lg hover:scale-105 transition"
            >
              Về trang chủ
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              <div
                className="p-6 rounded-xl shadow-lg lg:col-span-1"
                style={{
                  backgroundColor: isDarkMode ? "#1f2937" : "#ffffff",
                }}
              >
                <img
                  src={data.image}
                  alt={data.title}
                  className="rounded-lg w-full object-cover"
                />
              </div>

              <div className="lg:col-span-2">
                <h1
                  className="text-4xl font-bold mb-3"
                  style={{ color: isDarkMode ? "#ffffff" : "#1c1c1c" }}
                >
                  {data.title}
                </h1>
                <div className="flex items-center gap-3 mb-5">
                  <span className="px-3 py-1 text-sm rounded-full bg-yellow-100 text-yellow-800">
                    {data.category}
                  </span>
                  <span
                    className="text-sm"
                    style={{ color: isDarkMode ? "#d1d5db" : "#6b7280" }}
                  >
                    Giảng viên: {data.instructors.join(", ")}
                  </span>
                </div>
                <p
                  className="text-base mb-6"
                  style={{ color: isDarkMode ? "#d1d5db" : "#4b5563" }}
                >
                  {data.description}
                </p>

                <div
                  className="p-6 rounded-xl shadow-md mb-6"
                  style={{
                    backgroundColor: isDarkMode ? "#1f2937" : "#ffffff",
                  }}
                >
                  <h2
                    className="text-2xl font-semibold mb-4"
                    style={{ color: isDarkMode ? "#ffffff" : "#1c1c1c" }}
                  >
                    Nội dung học
                  </h2>
                  <ul className="space-y-3">
                    {data.lessons.map((lesson, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-3"
                        style={{
                          color: isDarkMode ? "#d1d5db" : "#374151",
                        }}
                      >
                        <span className="text-[#525fe1] mt-1">•</span>
                        <span>{lesson}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => navigate("/register")}
                    className="bg-[#ffcf59] text-[#1c1c1c] font-semibold px-5 py-2 rounded-lg hover:scale-105 transition"
                  >
                    Đăng ký học
                  </button>
                  <button
                    onClick={() => navigate("/")}
                    className="bg-[#eaedff] text-[#1c1c1c] font-semibold px-5 py-2 rounded-lg hover:scale-105 transition"
                  >
                    Quay lại
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <LandingFooter />
    </div>
  );
}