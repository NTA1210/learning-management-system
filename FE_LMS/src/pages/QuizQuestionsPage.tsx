import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { quizService } from "../services";
import type { QuizResponse } from "../services/quizService";
import { ArrowLeft } from "lucide-react";

export default function QuizQuestionsPage() {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState<QuizResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!quizId) {
      setError("Quiz ID is required");
      setLoading(false);
      return;
    }

    const fetchQuiz = async () => {
      try {
        setLoading(true);
        setError(null);
        const quizData = await quizService.getQuizById(quizId);
        setQuiz(quizData);
      } catch (err) {
        console.error("Failed to fetch quiz:", err);
        const message =
          typeof err === "object" && err !== null && "message" in err
            ? String((err as { message?: string }).message)
            : "Failed to load quiz";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId]);

  const questions = quiz?.snapshotQuestions?.filter((q) => !q.isDeleted) || [];
  const renderMarkup = (content?: string | number) => ({ __html: content ? String(content) : "" });

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6" style={{ backgroundColor: "var(--page-bg)", color: "var(--page-text)" }}>
          <div className="max-w-6xl mx-auto">
            {/* Header with Back Button */}
            <div className="mb-6 p-6 pt-18 ">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-sm mb-4 hover:underline"
                style={{ color: "var(--muted-text)" }}
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--heading-text)" }}>
                {quiz ? quiz.title : "Loading..."}
              </h1>
              {quiz?.description && (
                <p className="text-sm mb-4" style={{ color: "var(--muted-text)" }}>
                  {quiz.description}
                </p>
              )}
            </div>

            {/* Loading State */}
            {loading && (
              <div className="text-center py-12">
                <p style={{ color: "var(--muted-text)" }}>Loading questions...</p>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div
                className="rounded-lg p-4 mb-6"
                style={{ backgroundColor: "var(--error-bg)", color: "var(--error-text)" }}
              >
                {error}
              </div>
            )}

            {/* Questions List */}
            {!loading && !error && (
              <>
                {questions.length === 0 ? (
                  <div
                    className="rounded-lg p-8 text-center"
                    style={{ backgroundColor: "var(--card-surface)", border: "1px solid var(--card-border)" }}
                  >
                    <p style={{ color: "var(--muted-text)" }}>No questions available.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {questions.map((question, index) => (
                      <div
                        key={question.id || index}
                        className="border rounded-xl p-4 relative"
                        style={{ borderColor: "var(--card-row-border)", backgroundColor: "var(--card-row-bg)" }}
                      >
                        <div className="flex items-start gap-3">
                          <span className="font-semibold text-lg" style={{ color: "var(--heading-text)" }}>
                            {index + 1}.
                          </span>
                          <div className="flex-1">
                            <div
                              className="mb-3 prose prose-sm max-w-none"
                              style={{ color: "var(--heading-text)" }}
                              dangerouslySetInnerHTML={renderMarkup(question.text)}
                            />
                            {Array.isArray(question.options) && question.options.length > 0 && (
                              <ul className="space-y-2">
                                {question.options.map((opt, idx) => (
                                  <li
                                    key={idx}
                                    className={`text-sm ${
                                      question.correctOptions?.[idx] === 1
                                        ? "font-semibold text-emerald-600"
                                        : ""
                                    }`}
                                    style={{
                                      color:
                                        question.correctOptions?.[idx] === 1
                                          ? "#10b981"
                                          : "var(--muted-text)",
                                    }}
                                  >
                                    <span className="font-semibold mr-1">
                                      {String.fromCharCode(65 + idx)}.
                                    </span>
                                    <span dangerouslySetInnerHTML={renderMarkup(opt)} />
                                    {question.correctOptions?.[idx] === 1 && (
                                      <span className="ml-2 text-xs">✓ Correct</span>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            )}
                            {question.explanation && (
                              <div className="mt-3 p-2 rounded" style={{ backgroundColor: "var(--card-surface)" }}>
                                <p className="text-xs font-medium mb-1" style={{ color: "var(--muted-text)" }}>
                                  Explanation:
                                </p>
                                <div
                                  className="text-sm prose prose-sm max-w-none"
                                  style={{ color: "var(--heading-text)" }}
                                  dangerouslySetInnerHTML={renderMarkup(question.explanation)}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
