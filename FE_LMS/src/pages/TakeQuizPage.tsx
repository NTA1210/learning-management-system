import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../hooks/useAuth";
import { quizService, quizAttemptService } from "../services";
import type { QuizResponse, SnapshotQuestion } from "../services/quizService";
import type {
  QuizAnswer,
  QuizAnswerPayload,
  SubmitQuizResponse,
  QuizAttempt,
} from "../services/quizAttemptService";
import { Clock, Lock, CheckCircle, XCircle, ChevronLeft, ChevronRight, Book } from "lucide-react";

const deriveResultFromAttempt = (
  attempt: QuizAttempt,
  quizData?: QuizResponse | null
): SubmitQuizResponse | null => {
  const quizInfo =
    quizData ||
    (typeof attempt.quizId === "object" ? (attempt.quizId as QuizResponse) : null);

  const answered = attempt.answers || [];
  if (!answered.length) {
    return null;
  }

  const totalQuestions =
    quizInfo?.snapshotQuestions?.length || answered.length || 0;
  const totalQuizScore =
    quizInfo?.snapshotQuestions?.reduce((sum, q) => sum + (q.points || 1), 0) ||
    answered.reduce((sum, ans) => sum + (ans.pointsEarned || 0), 0) ||
    totalQuestions;

  const totalScore = answered.reduce((sum, ans) => sum + (ans.pointsEarned || 0), 0);

  const passedQuestions = answered.filter((ans) => ans.correct);
  const failedQuestions = answered.filter((ans) => !ans.correct);

  const scorePercentage =
    totalQuizScore > 0 ? (totalScore / totalQuizScore) * 10 : 0;

  return {
    totalQuestions,
    totalScore,
    totalQuizScore,
    scorePercentage,
    passedQuestions,
    failedQuestions,
    answersSubmitted: answered,
  };
};

export default function TakeQuizPage() {
  const { courseId, quizId } = useParams<{ courseId?: string; quizId: string }>();
  const navigate = useNavigate();
  const location = useLocation() as { state?: { quiz?: QuizResponse } };
  const { user } = useAuth();

  const [quiz, setQuiz] = useState<QuizResponse | null>(location.state?.quiz || null);
  const [loading, setLoading] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [enrolling, setEnrolling] = useState(false);
  const [quizAttemptId, setQuizAttemptId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, number[]>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitQuizResponse | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [attemptLoading, setAttemptLoading] = useState(false);
  const [autoSaveState, setAutoSaveState] = useState<{
    status: "idle" | "saving" | "saved" | "error";
    message?: string;
  }>({ status: "idle" });
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

  const mapAnswersFromAttempt = (source?: QuizAnswer[]): Record<string, number[]> => {
    const restored: Record<string, number[]> = {};
    if (!Array.isArray(source)) {
      return restored;
    }
    source.forEach((ans) => {
      if (!ans?.questionId) return;
      restored[ans.questionId] = Array.isArray(ans.answer) ? ans.answer : [];
    });
    return restored;
  };

  const initializeAnswersForQuiz = useCallback((quizData: QuizResponse) => {
    if (!quizData.snapshotQuestions) return;
    setAnswers((prev) => {
      let changed = false;
      const updated = { ...prev };
      quizData.snapshotQuestions!.forEach((q) => {
        const questionId = q.id || "";
        if (!updated[questionId]) {
          updated[questionId] = new Array(q.options?.length || 0).fill(0);
          changed = true;
        }
      });
      return changed ? updated : prev;
    });
  }, []);

  const questions: SnapshotQuestion[] = useMemo(() => {
    const snapshot = quiz?.snapshotQuestions?.filter((q) => !q.isDeleted);
    return (snapshot as SnapshotQuestion[]) || [];
  }, [quiz]);

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

  const persistAttemptState = useCallback(
    (attemptId: string, answersToStore: QuizAnswerPayload[] = []) => {
      if (!storageKey) return;
      const payload = {
        attemptId,
        answers: answersToStore.map((ans) => ({
          questionId: ans.questionId,
          answer: ans.answer,
        })),
      };
      sessionStorage.setItem(storageKey, JSON.stringify(payload));
    },
    [storageKey]
  );

  const clearPersistedAttempt = useCallback(() => {
    if (!storageKey) return;
    sessionStorage.removeItem(storageKey);
  }, [storageKey]);

  const triggerAutoSave = async (questionId: string, answerArray: number[]) => {
    if (!quizAttemptId) return;
    setAutoSaveState({ status: "saving", message: "" });
    try {
      const response = await quizAttemptService.autoSaveAnswer({
        quizAttemptId,
        questionId,
        answer: answerArray,
      });

      if (response.attempt?.answers) {
        persistAttemptState(quizAttemptId, toAnswerPayloads(response.attempt.answers));
      }

      setAutoSaveState({ status: "saved", message: "" });
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      autoSaveTimeoutRef.current = setTimeout(() => {
        setAutoSaveState({ status: "idle" });
      }, 2000);
    } catch (error) {
      console.error("Failed to auto-save answer:", error);
      setAutoSaveState({
        status: "error",
        message: getErrorMessage(error, "Auto-save failed"),
      });
    }
  };

  useEffect(() => {
    if (!quizId) {
      navigate(courseId ? `/quizz/${courseId}` : "/quizz");
      return;
    }

    if (quiz) {
      initializeAnswersForQuiz(quiz);
      setLoading(false);
      if (!quizAttemptId) {
        setShowPasswordModal(true);
      }
      return;
    }

    const fetchQuiz = async () => {
      try {
        setLoading(true);
        const quizData = await quizService.getQuizById(quizId);
        setQuiz(quizData);
      } catch (error) {
        console.error("Failed to fetch quiz:", error);
        const message = getErrorMessage(error, "Failed to load quiz");
        alert(message);
        navigate(courseId ? `/quizz/${courseId}` : "/quizz");
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId, navigate, courseId, quiz, quizAttemptId, initializeAnswersForQuiz]);

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
    if (!quizAttemptId) return;
    let cancelled = false;

    const fetchAttempt = async () => {
      try {
        setAttemptLoading(true);
        const attemptDetail = await quizAttemptService.getQuizAttempt(quizAttemptId);
        if (cancelled) return;

        let populatedQuiz: QuizResponse | undefined;
        if (attemptDetail.quizId && typeof attemptDetail.quizId !== "string") {
          populatedQuiz = attemptDetail.quizId as QuizResponse;
          setQuiz(populatedQuiz);
        }

        if (Array.isArray(attemptDetail.answers)) {
          const restored = mapAnswersFromAttempt(attemptDetail.answers);
          if (Object.keys(restored).length) {
            setAnswers((prev) => ({ ...prev, ...restored }));
          }
          persistAttemptState(quizAttemptId, toAnswerPayloads(attemptDetail.answers));
        }

        if (attemptDetail.status === "submitted") {
          const derived = deriveResultFromAttempt(
            attemptDetail,
            populatedQuiz || quiz
          );
          if (derived) {
            setResult(derived);
          }
          setSubmitted(true);
          setShowPasswordModal(false);
          return;
        }

        setShowPasswordModal(false);
      } catch (error) {
        if (cancelled) return;
        console.error("Failed to load quiz attempt:", error);
        setPasswordError(getErrorMessage(error, "Không thể tải bài làm. Vui lòng thử lại."));
        setShowPasswordModal(true);
      } finally {
        if (!cancelled) {
          setAttemptLoading(false);
        }
      }
    };

    fetchAttempt();

    return () => {
      cancelled = true;
    };
  }, [quizAttemptId, persistAttemptState, quiz]);

  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

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

  const getErrorMessage = (error: unknown, fallback: string) => {
    if (error instanceof Error) {
      return error.message || fallback;
    }
    if (typeof error === "object" && error !== null && "message" in error) {
      const maybeMessage = (error as { message?: string }).message;
      if (maybeMessage) {
        return String(maybeMessage);
      }
    }
    return fallback;
  };

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
      const restored = mapAnswersFromAttempt(attempt.answers);
      if (Object.keys(restored).length) {
        setAnswers((prev) => ({ ...prev, ...restored }));
      }
      persistAttemptState(attempt._id, toAnswerPayloads(attempt.answers));
      setShowPasswordModal(false);
      setPassword("");
    } catch (error) {
      console.error("Failed to enroll in quiz:", error);
      const message = getErrorMessage(
        error,
        "Failed to enroll in quiz. Please check the password and try again."
      );
      setPasswordError(message);
    } finally {
      setEnrolling(false);
    }
  };

  const handleAnswerChange = (question: SnapshotQuestion, optionIndex: number, checked: boolean) => {
    if (!quizAttemptId) return;
    const questionId = question.id || "";
    const optionLength = question.options?.length || 0;
    const current = answers[questionId] || new Array(optionLength).fill(0);
    let updated = [...current];
    const type = (question.type || "").toLowerCase();
    const isMultiSelect = type === "multichoice";

    if (isMultiSelect) {
      updated[optionIndex] = checked ? 1 : 0;
    } else {
      updated = new Array(optionLength).fill(0);
      if (checked) {
        updated[optionIndex] = 1;
      }
    }

    setAnswers((prev) => ({
      ...prev,
      [questionId]: updated,
    }));
    triggerAutoSave(questionId, updated);
  };

  const goToQuestion = (index: number) => {
    if (index === currentQuestionIndex || !questions.length) return;
    setCurrentQuestionIndex(Math.max(0, Math.min(index, questions.length - 1)));
  };

  const handleNextQuestion = () => {
    if (!questions.length) return;
    setCurrentQuestionIndex((prev) => Math.min(prev + 1, questions.length - 1));
  };

  const handlePrevQuestion = () => {
    if (!questions.length) return;
    setCurrentQuestionIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = useCallback(
    async (skipConfirm?: boolean) => {
      if (!quizAttemptId || !quiz || submitted) return;

      if (!skipConfirm) {
        const answerCount = Object.values(answers).filter((arr) => arr?.some((i) => i === 1)).length;
        if (answerCount < questions.length) {
          const proceed = window.confirm(
            "Bạn chưa trả lời hết tất cả câu hỏi. Bạn có chắc muốn nộp bài không?"
          );
          if (!proceed) {
            return;
          }
        }
      }

      try {
        setSubmitting(true);

        const submitResult = await quizAttemptService.submitQuiz({ quizAttemptId });

        setResult(submitResult);
        setSubmitted(true);
        clearPersistedAttempt();

        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      } catch (error) {
        console.error("Failed to submit quiz:", error);
        const message = getErrorMessage(error, "Failed to submit quiz. Please try again.");
        if (message.toLowerCase().includes("quiz attempt not found")) {
          clearPersistedAttempt();
          setQuizAttemptId(null);
          setShowPasswordModal(true);
        }
        alert(message);
      } finally {
        setSubmitting(false);
      }
    },
    [quizAttemptId, quiz, submitted, clearPersistedAttempt, answers, questions]
  );

  useEffect(() => {
    if (quiz && quizAttemptId && !submitted) {
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
          handleSubmit(true);
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
  }, [quiz, quizAttemptId, submitted, handleSubmit]);

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

            {quizAttemptId && !submitted && attemptLoading && (
              <div
                className="mb-6 p-4 rounded-lg flex items-center gap-3"
                style={{ backgroundColor: "var(--card-surface)", border: "1px solid var(--card-border)" }}
              >
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-500" />
                <span style={{ color: "var(--muted-text)" }}>Loading quiz attempt...</span>
              </div>
            )}

            {/* Quiz Form */}
            {quizAttemptId && !submitted && currentQuestion && !attemptLoading && (
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
                            type={(currentQuestion.type || "").toLowerCase() === "multichoice" ? "checkbox" : "radio"}
                            name={(currentQuestion.type || "").toLowerCase() === "multichoice" ? undefined : `question-${currentQuestion.id}`}
                            checked={(answers[currentQuestion.id || ""]?.[optIdx] || 0) === 1}
                            onChange={(e) =>
                              handleAnswerChange(
                                currentQuestion,
                                optIdx,
                                (currentQuestion.type || "").toLowerCase() === "multichoice" ? e.target.checked : true
                              )
                            }
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
                    disabled={currentQuestionIndex === 0}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
                    style={{ backgroundColor: "var(--card-surface)", border: "1px solid var(--card-border)" }}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                  {autoSaveState.status !== "idle" && (
                    <span
                      className="text-xs"
                      style={{
                        color: autoSaveState.status === "error" ? "#ef4444" : "var(--muted-text)",
                      }}
                    >

                    </span>
                  )}
                  <button
                    onClick={handleNextQuestion}
                    disabled={currentQuestionIndex === questions.length - 1}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
                    style={{ backgroundColor: "var(--card-surface)", border: "1px solid var(--card-border)" }}
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => handleSubmit(false)}
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

