import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../hooks/useTheme";
import { quizService, quizAttemptService } from "../services";
import type { QuizResponse, SnapshotQuestion } from "../services/quizService";
import type { QuizAnswer, QuizAnswerPayload } from "../services/quizAttemptService";
import { Clock, Lock, CheckCircle, XCircle, ChevronLeft, ChevronRight, Book } from "lucide-react";

export default function TakeQuizPage() {
  const { courseId, quizId } = useParams<{ courseId?: string; quizId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { darkMode } = useTheme();

  const [quiz, setQuiz] = useState<QuizResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [enrolling, setEnrolling] = useState(false);
  const [quizAttemptId, setQuizAttemptId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, number[]>>({});
  const [answersChanged, setAnswersChanged] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [savingProgress, setSavingProgress] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const restoredAttemptRef = useRef(false);
  const storageKey = quizId ? `quizAttempt:${quizId}` : null;

  const toAnswerPayloads = (source?: QuizAnswer[]): QuizAnswerPayload[] => {
    if (!Array.isArray(source)) return [];
    return source
      .filter((ans): ans is QuizAnswer => Boolean(ans?.questionId))
      .map((ans) => ({
        questionId: ans.questionId,
        answer: Array.isArray(ans.answer) ? ans.answer : [],
      }));
  };

  const persistAttemptState = (attemptId: string, answersToStore: QuizAnswerPayload[] = []) => {
    if (!storageKey) return;
    const payload = {
      attemptId,
      answers: answersToStore.map((ans) => ({
        questionId: ans.questionId,
        answer: ans.answer,
      })),
    };
    sessionStorage.setItem(storageKey, JSON.stringify(payload));
  };

  const clearPersistedAttempt = () => {
    if (!storageKey) return;
    sessionStorage.removeItem(storageKey);
  };

  const buildAnswerPayloads = (): QuizAnswerPayload[] => {
    if (!quiz?.snapshotQuestions) return [];
    return quiz.snapshotQuestions
      .filter((q) => !q.isDeleted)
      .map((q) => {
        const questionId = q.id || "";
        const optionLength = q.options?.length || 0;
        return {
          questionId,
          answer: answers[questionId] || new Array(optionLength).fill(0),
        };
      });
  };

  useEffect(() => {
    if (!quizId) {
      navigate(courseId ? `/quizz/${courseId}` : "/quizz");
      return;
    }

    const fetchQuiz = async () => {
      try {
        setLoading(true);
        const quizData = await quizService.getQuizById(quizId);
        setQuiz(quizData);
        
        // Initialize answers with empty arrays
        if (quizData.snapshotQuestions) {
          const initialAnswers: Record<string, number[]> = {};
          quizData.snapshotQuestions.forEach((q) => {
            if (!q.isDeleted) {
              initialAnswers[q.id || ""] = new Array(q.options?.length || 0).fill(0);
            }
          });
          setAnswers(initialAnswers);
        }

        // Show password modal
        setShowPasswordModal(true);
      } catch (err) {
        console.error("Failed to fetch quiz:", err);
        const message =
          typeof err === "object" && err !== null && "message" in err
            ? String((err as { message?: string }).message)
            : "Failed to load quiz";
        alert(message);
        navigate(courseId ? `/quizz/${courseId}` : "/quizz");
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId, navigate, courseId]);

  useEffect(() => {
    if (!quiz || !storageKey || restoredAttemptRef.current) return;
    const persisted = sessionStorage.getItem(storageKey);
    if (!persisted) {
      setShowPasswordModal(true);
      return;
    }

    try {
      const parsed = JSON.parse(persisted) as {
        attemptId?: string;
        answers?: { questionId: string; answer: number[] }[];
      };

      if (parsed.attemptId) {
        setQuizAttemptId(parsed.attemptId);
        if (Array.isArray(parsed.answers)) {
          const restored: Record<string, number[]> = {};
          parsed.answers.forEach((ans) => {
            if (ans?.questionId && Array.isArray(ans.answer)) {
              restored[ans.questionId] = ans.answer;
            }
          });
          if (Object.keys(restored).length) {
            setAnswers((prev) => ({ ...prev, ...restored }));
          }
        }
        setShowPasswordModal(false);
        restoredAttemptRef.current = true;
        return;
      }
    } catch {
      sessionStorage.removeItem(storageKey);
    }

    setShowPasswordModal(true);
  }, [quiz, storageKey]);

  useEffect(() => {
    if (quiz && quizAttemptId && !submitted) {
      // Start countdown timer
      const endTime = new Date(quiz.endTime).getTime();
      
      const updateTimer = () => {
        const now = Date.now();
        const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
        setTimeRemaining(remaining);

        if (remaining <= 0) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          // Auto submit when time runs out
          handleSubmit();
        }
      };

      updateTimer();
      intervalRef.current = setInterval(updateTimer, 1000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [quiz, quizAttemptId, submitted]);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const createMarkup = (content?: string) => ({ __html: content || "" });

  const handleEnroll = async () => {
    if (!quizId || !password.trim()) {
      setPasswordError("Please enter the quiz password");
      return;
    }

    try {
      setEnrolling(true);
      setPasswordError("");
      
      const attempt = await quizAttemptService.enrollQuiz({
        quizId,
        hashPassword: password.trim(),
      });

      setQuizAttemptId(attempt._id);
      if (quiz?.snapshotQuestions?.length) {
        const restoredAnswers: Record<string, number[]> = {};
        attempt.answers?.forEach((ans) => {
          if (!ans?.questionId || !Array.isArray(ans.answer)) return;
          restoredAnswers[ans.questionId] = ans.answer;
        });
        if (Object.keys(restoredAnswers).length) {
          setAnswers((prev) => ({ ...prev, ...restoredAnswers }));
        }
      }
      persistAttemptState(attempt._id, toAnswerPayloads(attempt.answers));
      setShowPasswordModal(false);
      setPassword("");
    } catch (err: any) {
      console.error("Failed to enroll in quiz:", err);
      const message =
        err?.message || "Failed to enroll in quiz. Please check the password and try again.";
      setPasswordError(message);
    } finally {
      setEnrolling(false);
    }
  };

  const handleAnswerChange = (questionId: string, optionIndex: number, checked: boolean) => {
    setAnswers((prev) => {
      const current = prev[questionId] || [];
      const updated = [...current];
      updated[optionIndex] = checked ? 1 : 0;
      return { ...prev, [questionId]: updated };
    });
    setAnswersChanged(true);
  };

  const saveProgressIfNeeded = async () => {
    if (!quizAttemptId || !answersChanged || savingProgress) return;
    const answersArray = buildAnswerPayloads();
    const hasUnanswered = answersArray.some((ans) => !ans.answer?.some((val) => val === 1));
    if (hasUnanswered) {
      return;
    }
    try {
      setSavingProgress(true);
      await quizAttemptService.saveQuiz({
        quizAttemptId,
        answers: answersArray,
      });
      persistAttemptState(quizAttemptId, answersArray);
      setAnswersChanged(false);
    } catch (err) {
      console.warn("Failed to auto-save quiz attempt:", err);
    } finally {
      setSavingProgress(false);
    }
  };

  const goToQuestion = async (index: number) => {
    if (index === currentQuestionIndex || !quiz?.snapshotQuestions) return;
    await saveProgressIfNeeded();
    setCurrentQuestionIndex(index);
  };

  const handleNextQuestion = async () => {
    if (!quiz?.snapshotQuestions) return;
    await saveProgressIfNeeded();
    setCurrentQuestionIndex((prev) => Math.min(prev + 1, quiz.snapshotQuestions!.length - 1));
  };

  const handlePrevQuestion = async () => {
    if (!quiz?.snapshotQuestions) return;
    await saveProgressIfNeeded();
    setCurrentQuestionIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    if (!quizAttemptId || !quiz || submitted) return;

    try {
      await saveProgressIfNeeded();
      setSubmitting(true);

      // Convert answers to the format expected by backend
      const answersArray = buildAnswerPayloads();
      const firstUnanswered = answersArray.find((ans) => !ans.answer?.some((val) => val === 1));
      if (firstUnanswered) {
        const idx =
          questions.findIndex((q) => (q.id || "") === firstUnanswered.questionId) + 1;
        alert(`Please answer question ${idx || ""} before submitting.`);
        setSubmitting(false);
        return;
      }

      const submitResult = await quizAttemptService.submitQuiz({ quizAttemptId });

      setResult(submitResult);
      setSubmitted(true);
      clearPersistedAttempt();

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    } catch (err: any) {
      console.error("Failed to submit quiz:", err);
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to submit quiz. Please try again.";
      if (message.toLowerCase().includes("quiz attempt not found")) {
        clearPersistedAttempt();
        setQuizAttemptId(null);
        setShowPasswordModal(true);
      }
      alert(message);
    } finally {
      setSubmitting(false);
    }
  };

  const questions: SnapshotQuestion[] = (quiz?.snapshotQuestions?.filter((q) => !q.isDeleted) as SnapshotQuestion[]) || [];
  const currentQuestion = questions[currentQuestionIndex];

  const getQuestionTypeLabel = (question?: SnapshotQuestion) => {
    const type = (question?.type || "").toLowerCase();
    switch (type) {
      case "multichoice":
        return "Multiple Choice • Select all that apply";
      case "true_false":
        return "True / False";
      case "fill_blank":
        return "Fill in the Blank";
      default:
        return "Single Choice ";
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Navbar />
          <main className="flex-1 overflow-y-auto p-6 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p style={{ color: "var(--muted-text)" }}>Loading quiz...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar role={(user?.role as "admin" | "teacher" | "student") || "student"} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6" style={{ backgroundColor: "var(--page-bg)", color: "var(--page-text)" }}>
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <button
                onClick={() => navigate(courseId ? `/quizz/${courseId}` : "/quizz")}
                className="flex items-center gap-2 text-sm mb-4 hover:underline"
                style={{ color: "var(--muted-text)" }}
              >
                ← Back to Quizzes
              </button>
              <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--heading-text)" }}>
                {quiz.title}
              </h1>
              {quiz.description && (
                <p className="text-sm mb-4" style={{ color: "var(--muted-text)" }}>
                  {quiz.description}
                </p>
              )}
            </div>

            {/* Timer */}
            {quizAttemptId && !submitted && timeRemaining !== null && (
              <div className="mb-6 p-4 rounded-lg flex items-center justify-between" style={{ backgroundColor: "var(--card-surface)", border: "1px solid var(--card-border)" }}>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" style={{ color: timeRemaining < 300 ? "#ef4444" : "var(--heading-text)" }} />
                  <span className="text-lg font-semibold" style={{ color: timeRemaining < 300 ? "#ef4444" : "var(--heading-text)" }}>
                    Time Remaining: {formatTime(timeRemaining)}
                  </span>
                </div>
              </div>
            )}

            {/* Password Modal */}
            {showPasswordModal && (
              <div className="fixed inset-0 z-[120] flex items-center justify-center px-4 bg-black/80">
                <div
                  className="w-full max-w-md rounded-xl shadow-xl p-6"
                  style={{ backgroundColor: "var(--card-surface)", border: "1px solid var(--card-border)" }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <Lock className="w-6 h-6" style={{ color: "var(--heading-text)" }} />
                    <h2 className="text-xl font-semibold" style={{ color: "var(--heading-text)" }}>
                      Enter Quiz Password
                    </h2>
                  </div>
                  <p className="text-sm mb-4" style={{ color: "var(--muted-text)" }}>
                    This quiz is password protected. Please enter the password to start.
                  </p>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setPasswordError("");
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleEnroll()}
                    placeholder="Enter password"
                    className="w-full px-4 py-2 rounded-lg border mb-2"
                    style={{
                      backgroundColor: "var(--input-bg)",
                      borderColor: passwordError ? "#ef4444" : "var(--input-border)",
                      color: "var(--input-text)",
                    }}
                    autoFocus
                  />
                  {passwordError && (
                    <p className="text-sm mb-4" style={{ color: "#ef4444" }}>
                      {passwordError}
                    </p>
                  )}
                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={() => navigate(courseId ? `/quizz/${courseId}` : "/quizz")}
                      className="px-4 py-2 rounded-lg text-sm font-medium"
                      style={{ backgroundColor: "var(--divider-color)", color: "var(--heading-text)" }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleEnroll}
                      disabled={enrolling}
                      className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
                      style={{ backgroundColor: "#6d28d9" }}
                    >
                      {enrolling ? "Enrolling..." : "Start Quiz"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Quiz Form */}
            {quizAttemptId && !submitted && currentQuestion && (
              <>
                <div className="mb-4 flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full text-sm" style={{ backgroundColor: "var(--card-surface)", border: "1px solid var(--card-border)" }}>
                    <Book className="w-4 h-4" />
                    <span>
                      Question {currentQuestionIndex + 1} / {questions.length}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {questions.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => goToQuestion(idx)}
                        className={`w-8 h-8 rounded-full text-sm font-semibold ${
                          idx === currentQuestionIndex ? "text-white" : ""
                        }`}
                        style={{
                          backgroundColor: idx === currentQuestionIndex ? "#6d28d9" : "var(--card-surface)",
                          border: "1px solid var(--card-border)",
                        }}
                      >
                        {idx + 1}
                      </button>
                    ))}
                  </div>
                </div>

                <div
                  className="rounded-lg p-6 border mb-6 space-y-4"
                  style={{ backgroundColor: "var(--card-surface)", borderColor: "var(--card-border)" }}
                >
                  <div className="flex items-start gap-3 mb-4">
                    <span className="font-semibold text-lg" style={{ color: "var(--heading-text)" }}>
                      {currentQuestionIndex + 1}.
                    </span>
                    <div
                      className="flex-1 prose prose-sm max-w-none"
                      style={{ color: "var(--heading-text)" }}
                      dangerouslySetInnerHTML={createMarkup(currentQuestion.text)}
                    />
                  </div>
                  <div className="text-xs font-semibold uppercase px-3 py-1 rounded-full inline-flex" style={{ backgroundColor: "var(--card-row-bg)", color: "var(--muted-text)" }}>
                    {getQuestionTypeLabel(currentQuestion)}
                  </div>
                  {currentQuestion.options && currentQuestion.options.length > 0 && (
                    <div className="space-y-2 ml-8">
                      {currentQuestion.options.map((option, optIdx) => (
                        <label
                          key={optIdx}
                          className="flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-opacity-50"
                          style={{ backgroundColor: "var(--input-bg)" }}
                        >
                          <input
                            type="checkbox"
                            checked={(answers[currentQuestion.id || ""]?.[optIdx] || 0) === 1}
                            onChange={(e) => handleAnswerChange(currentQuestion.id || "", optIdx, e.target.checked)}
                            className="w-4 h-4"
                          />
                          <span style={{ color: "var(--input-text)" }}>
                            <span className="font-semibold mr-1">
                              {String.fromCharCode(65 + optIdx)}.
                            </span>
                            <span dangerouslySetInnerHTML={createMarkup(option)} />
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                  <button
                    onClick={handlePrevQuestion}
                    disabled={currentQuestionIndex === 0 || savingProgress}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
                    style={{ backgroundColor: "var(--card-surface)", border: "1px solid var(--card-border)" }}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                  {savingProgress && <span className="text-xs" style={{ color: "var(--muted-text)" }}>Saving...</span>}
                  <button
                    onClick={handleNextQuestion}
                    disabled={currentQuestionIndex === questions.length - 1 || savingProgress}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
                    style={{ backgroundColor: "var(--card-surface)", border: "1px solid var(--card-border)" }}
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="px-6 py-3 rounded-lg font-semibold text-white disabled:opacity-50"
                    style={{ backgroundColor: "#6d28d9" }}
                  >
                    {submitting ? "Submitting..." : "Submit Quiz"}
                  </button>
                </div>
              </>
            )}

            {/* Result */}
            {submitted && result && (
              <div className="rounded-lg p-6 border" style={{ backgroundColor: "var(--card-surface)", borderColor: "var(--card-border)" }}>
                <div className="text-center mb-6">
                  <CheckCircle className="w-16 h-16 mx-auto mb-4" style={{ color: "#10b981" }} />
                  <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--heading-text)" }}>
                    Quiz Submitted!
                  </h2>
                  <div className="text-4xl font-bold mb-2" style={{ color: "#6d28d9" }}>
                    {result.scorePercentage?.toFixed(1)}%
                  </div>
                  <p className="text-lg" style={{ color: "var(--muted-text)" }}>
                    Score: {result.totalScore} / {result.totalQuizScore} points
                  </p>
                  <p className="text-sm mt-2" style={{ color: "var(--muted-text)" }}>
                    Passed: {result.passedQuestions?.length || 0} / {result.totalQuestions} questions
                  </p>
                </div>

                {/* Detailed Results */}
                <div className="mt-6 space-y-4">
                  <h3 className="text-lg font-semibold" style={{ color: "var(--heading-text)" }}>
                    Question Review
                  </h3>
                  {questions.map((question, index) => {
                    const answerData = result.answersSubmitted?.find(
                      (a: QuizAnswer) => a.questionId === question.id
                    );
                    const isCorrect = answerData?.correct;
                    
                    return (
                      <div
                        key={question.id || index}
                        className="rounded-lg p-4 border space-y-2"
                        style={{
                          backgroundColor: isCorrect ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                          borderColor: isCorrect ? "#10b981" : "#ef4444",
                        }}
                      >
                        <div className="flex items-start gap-2 mb-2">
                          {isCorrect ? (
                            <CheckCircle className="w-5 h-5 mt-0.5" style={{ color: "#10b981" }} />
                          ) : (
                            <XCircle className="w-5 h-5 mt-0.5" style={{ color: "#ef4444" }} />
                          )}
                          <div className="flex-1">
                            <p className="font-medium" style={{ color: "var(--heading-text)" }}>
                              Question {index + 1}:{" "}
                              <span dangerouslySetInnerHTML={createMarkup(question.text)} />
                            </p>
                            <p className="text-sm mt-1" style={{ color: "var(--muted-text)" }}>
                              Points: {answerData?.pointsEarned || 0} / {question.points || 1}
                            </p>
                            <div className="text-xs font-semibold uppercase mt-1" style={{ color: "var(--muted-text)" }}>
                              {getQuestionTypeLabel(question as SnapshotQuestion)}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 flex justify-center">
                  <button
                    onClick={() => navigate(courseId ? `/quizz/${courseId}` : "/quizz")}
                    onClick={() => navigate(courseId ? `/quizz/${courseId}` : "/quizz")}
                    className="px-6 py-3 rounded-lg font-semibold text-white"
                    style={{ backgroundColor: "#6d28d9" }}
                  >
                    Back to Quizzes
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

