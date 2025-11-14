import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar.tsx";
import Sidebar from "../components/Sidebar.tsx";
import { useTheme } from "../hooks/useTheme";
import { useAuth } from "../hooks/useAuth";
import { courseService, quizQuestionService, type QuizQuestion } from "../services";
import { ArrowLeft } from "lucide-react";

export default function QuizCoursePage() {
  const { courseId = "" } = useParams();
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const { user } = useAuth();
  const [title, setTitle] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setQuestionsLoading(true);
        const course = await courseService.getCourseById(courseId);
        if (mounted) {
          setTitle((course as any)?.title || (course as any)?.name || "Course");
          
          // Get subjectId from course to fetch quiz questions
          const subjectId = typeof (course as any)?.subjectId === "object" 
            ? (course as any).subjectId._id 
            : (course as any)?.subjectId;
          
          if (subjectId) {
            try {
              const { data } = await quizQuestionService.getAllQuizQuestions({
                subjectId,
                limit: 100, // Get all questions for this subject
              });
              if (mounted) {
                setQuizQuestions(data);
              }
            } catch (error) {
              console.error("Error fetching quiz questions:", error);
              if (mounted) {
                setQuizQuestions([]);
              }
            }
          }
        }
      } catch {
        if (mounted) setTitle("Course");
      } finally {
        if (mounted) {
          setLoading(false);
          setQuestionsLoading(false);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, [courseId]);

  const pageBg = darkMode ? "#111827" : "#f8fafc";
  const cardBg = darkMode ? "rgba(30, 41, 59, 0.85)" : "#ffffff";
  const cardBorder = darkMode ? "1px solid rgba(148, 163, 184, 0.2)" : "1px solid rgba(148, 163, 184, 0.2)";
  const textColor = darkMode ? "#e2e8f0" : "#1e293b";
  const labelColor = darkMode ? "#cbd5f5" : "#475569";

  return (
    <div
      className="flex h-screen overflow-hidden relative"
      style={{ backgroundColor: pageBg, color: textColor }}
    >
      <Navbar />
      <Sidebar role={(user?.role as "admin" | "teacher" | "student") || "teacher"} />

      <div className="flex flex-col flex-1 w-0 overflow-hidden">
        <main className="flex-1 relative overflow-y-auto focus:outline-none p-4 mt-16 sm:pl-24 md:pl-28">
          <div className="max-w-6xl mx-auto px-4 space-y-6">
            <header className="space-y-2">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate("/quiz")}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
                  style={{
                    backgroundColor: darkMode ? "rgba(148,163,184,0.12)" : "rgba(148,163,184,0.2)",
                    color: textColor,
                  }}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to courses
                </button>
                <h1 className="text-3xl font-bold">{loading ? "Loading..." : title}</h1>
              </div>
              <p className="text-sm" style={{ color: labelColor }}>
                Quiz questions for this course
              </p>
            </header>

            <section className="space-y-4">
              {questionsLoading ? (
                <div className="text-center py-8">
                  <p style={{ color: labelColor }}>Loading quiz questions...</p>
                </div>
              ) : quizQuestions.length === 0 ? (
                <div className="text-center py-8 rounded-2xl" style={{ backgroundColor: cardBg, border: cardBorder }}>
                  <p style={{ color: labelColor }}>No quiz questions found for this course.</p>
                </div>
              ) : (
                quizQuestions.map((q) => (
                  <div
                    key={q._id}
                    className="rounded-2xl p-5"
                    style={{ backgroundColor: cardBg, border: cardBorder }}
                  >
                    <p className="font-semibold mb-3">{q.text}</p>
                    {q.options && q.options.length > 0 && (
                      <ul className="text-sm space-y-2">
                        {q.options.map((option, idx) => {
                          const isCorrect = q.correctOptions && q.correctOptions[idx] === 1;
                          return (
                            <li key={idx} className="flex items-center gap-2">
                              <span className="font-mono mr-2">{String.fromCharCode(65 + idx)}.</span>
                              <span>{option}</span>
                              {isCorrect && (
                                <span className="text-green-500 text-xs font-semibold">✓ Correct</span>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                    {q.explanation && (
                      <div className="mt-3 pt-3 border-t" style={{ borderColor: darkMode ? "rgba(148,163,184,0.2)" : "#e2e8f0" }}>
                        <p className="text-xs" style={{ color: labelColor }}>
                          <span className="font-semibold">Explanation:</span> {q.explanation}
                        </p>
                      </div>
                    )}
                    {q.points && (
                      <div className="mt-2">
                        <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: darkMode ? "rgba(99,102,241,0.2)" : "rgba(99,102,241,0.1)", color: "#6366f1" }}>
                          {q.points} point{q.points !== 1 ? "s" : ""}
                        </span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

