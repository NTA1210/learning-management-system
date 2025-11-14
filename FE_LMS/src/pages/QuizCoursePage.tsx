import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar.tsx";
import Sidebar from "../components/Sidebar.tsx";
import { useTheme } from "../hooks/useTheme";
import { useAuth } from "../hooks/useAuth";
import { subjectService, quizQuestionService, type QuizQuestion, type Subject } from "../services";
import { ArrowLeft } from "lucide-react";

export default function QuizCoursePage() {
  const { courseId = "" } = useParams(); // Thực ra là subjectId nhưng giữ tên route cũ
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const { user } = useAuth();
  const [title, setTitle] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(true);
  const apiBase = (import.meta.env.VITE_BASE_API || "").replace(/\/$/, "");

  const resolveImageSrc = (q: QuizQuestion): string | undefined => {
    const obj = q as unknown as Record<string, unknown>;
    const fileObj = (obj["file"] as Record<string, unknown> | undefined);
    const candidates: unknown[] = [
      obj["image"],
      obj["imageUrl"],
      obj["fileUrl"],
      fileObj?.["url"],
      obj["url"],
    ];
    const raw = candidates.find((v): v is string => typeof v === "string");
    if (!raw) return undefined;
    return raw.startsWith("http") ? raw : (apiBase ? `${apiBase}/${raw.replace(/^\/+/, "")}` : raw);
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setQuestionsLoading(true);
        
        // courseId thực ra là subjectId từ route /quiz/:courseId
        const subjectId = courseId;
        
        if (subjectId) {
          let subjectTitle = "Subject";
          
          // Try to fetch subject info (optional - if fails, still fetch questions)
          try {
            console.log("QuizCoursePage: Fetching subject with ID:", subjectId);
            const subject = await subjectService.getSubjectById(subjectId);
            console.log("QuizCoursePage: Subject loaded:", subject);
            
            if (mounted && subject) {
              subjectTitle = `${subject.code} - ${subject.name}`;
              setTitle(subjectTitle);
            }
          } catch (subjectError) {
            console.warn("QuizCoursePage: Could not fetch subject info, will still try to fetch questions:", subjectError);
            if (mounted) {
              setTitle(`Subject ID: ${subjectId}`);
            }
          }
          
          // Fetch quiz questions using API {{base_url}}/quiz-questions (get all, then filter by subjectId)
          try {
            console.log("QuizCoursePage: Fetching all quiz questions for subjectId:", subjectId);
            const baseUrl = import.meta.env.VITE_BASE_API || "";
            console.log("QuizCoursePage: Base URL:", baseUrl);
            
            // Call API without filters to get all questions
            const result = await quizQuestionService.getAllQuizQuestions({
              limit: 1000, // Get all questions
            });
            
            console.log("QuizCoursePage: All quiz questions result:", result);
            console.log("QuizCoursePage: Total questions:", result.data?.length || 0);
            
            // Filter by subjectId on client side
            const filteredQuestions = (result.data || []).filter(
              (q) => q.subjectId === subjectId || (typeof q.subjectId === "object" && q.subjectId._id === subjectId)
            );
            
            console.log("QuizCoursePage: Filtered questions for subjectId:", filteredQuestions.length);
            
            if (mounted) {
              setQuizQuestions(filteredQuestions);
              console.log("QuizCoursePage: Set quiz questions:", filteredQuestions.length);
              
              // Update title if we have questions but no subject info
              if (filteredQuestions.length > 0 && subjectTitle === "Subject") {
                setTitle(`Quiz Questions (${filteredQuestions.length} questions)`);
              }
            }
          } catch (questionsError) {
            console.error("QuizCoursePage: Error fetching quiz questions:", questionsError);
            if (questionsError && typeof questionsError === "object" && "message" in questionsError) {
              console.error("QuizCoursePage: Error message:", (questionsError as { message: string }).message);
            }
            if (mounted) {
              setQuizQuestions([]);
            }
          }
        } else {
          console.warn("QuizCoursePage: No subjectId provided");
          if (mounted) {
            setTitle("Subject");
            setQuizQuestions([]);
          }
        }
      } catch (error) {
        console.error("Error:", error);
        if (mounted) {
          setTitle("Subject");
          setQuizQuestions([]);
        }
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
                  Back to subjects
                </button>
                <h1 className="text-3xl font-bold">{loading ? "Loading..." : title}</h1>
              </div>
              <p className="text-sm" style={{ color: labelColor }}>
                Quiz questions for this subject
              </p>
            </header>

            <section className="space-y-4">
              {questionsLoading ? (
                <div className="text-center py-8">
                  <p style={{ color: labelColor }}>Loading quiz questions...</p>
                </div>
              ) : quizQuestions.length === 0 ? (
                <div className="text-center py-8 rounded-2xl" style={{ backgroundColor: cardBg, border: cardBorder }}>
                  <p style={{ color: labelColor }}>No quiz questions found for this subject.</p>
                </div>
              ) : (
                quizQuestions.map((q) => {
                  const imageSrc = resolveImageSrc(q);
                  return (
                  <div
                    key={q._id}
                    className="rounded-2xl p-5"
                    style={{ backgroundColor: cardBg, border: cardBorder }}
                  >
                    <p className="font-semibold mb-3 break-words">{q.text}</p>
                    {imageSrc && (
                      <div className="mt-3">
                        <img
                          src={imageSrc}
                          alt="Quiz question"
                          className="w-full max-h-64 object-contain rounded-xl border"
                          style={{ borderColor: darkMode ? "rgba(148,163,184,0.3)" : "#e2e8f0", backgroundColor: darkMode ? "rgba(15,23,42,0.5)" : "#fff" }}
                        />
                      </div>
                    )}
                    {q.options && q.options.length > 0 && (
                      <ul className="text-sm space-y-2">
                        {q.options.map((option, idx) => {
                          const isCorrect = q.correctOptions && q.correctOptions[idx] === 1;
                          return (
                            <li key={idx} className="flex items-center gap-2">
                              <span className="font-mono mr-2">{String.fromCharCode(65 + idx)}.</span>
                              <span className="break-words">{option}</span>
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
                )})
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

