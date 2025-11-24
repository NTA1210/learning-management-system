import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar.tsx";
import Sidebar from "../components/Sidebar.tsx";
import { useAuth } from "../hooks/useAuth";
import http from "../utils/http";
import { courseService, quizService, subjectService, quizQuestionService } from "../services";
import type { Course } from "../types/course";
import type { Subject } from "../types/subject";
import type { QuizQuestion } from "../services/quizQuestionService";
import { QuizPagination } from "../components/quiz/QuizPagination";

interface CreateQuizForm {
  courseId: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  shuffleQuestions: boolean;
  isPublished: boolean;
}

interface DraftQuestion {
  id: string;
  text: string;
  options: string[];
  correctOptions: number[];
}

interface SnapshotQuestion {
  id: string;
  text: string | number;
  type: string | number;
  options: (string | number)[];
  correctOptions: number[];
  points: number | string;
  explanation?: string | number;
  images?: Array<{ url: string; fromDB?: boolean }>;
  isExternal: boolean;
  isNewQuestion: boolean;
  isDeleted: boolean;
  isDirty: boolean;
}

const emptyDraftQuestion = (): DraftQuestion => ({
  id: crypto.randomUUID(),
  text: "",
  options: ["", "", "", ""],
  correctOptions: [0, 0, 0, 0],
});

/**
 * Converts a datetime-local string to ISO UTC string
 * @param datetimeLocal - String in format "YYYY-MM-DDTHH:mm" (local time)
 * @returns ISO UTC string in format "YYYY-MM-DDTHH:mm:ss.sssZ"
 */
const convertToISOUTC = (datetimeLocal: string): string => {
  if (!datetimeLocal) return "";
  // Create Date object from local datetime string
  // JavaScript will parse it as local time
  const localDate = new Date(datetimeLocal);
  // Convert to ISO UTC string
  return localDate.toISOString();
};

// Fix nested p tags in HTML text (e.g., <p><p>...</p></p> -> <p>...</p>)
// Also ensure the value is converted to string
const fixNestedPTags = (html: string | number | undefined | null): string => {
  // Convert to string first
  if (html === null || html === undefined) return "";
  if (typeof html === 'number') return String(html);
  if (typeof html !== 'string') return String(html);
  
  // Remove nested <p> tags: replace <p><p> with <p> and </p></p> with </p>
  let fixed = html;
  
  // Fix multiple nested opening p tags
  fixed = fixed.replace(/<p\s*[^>]*>\s*<p\s*[^>]*>/gi, '<p>');
  
  // Fix multiple nested closing p tags
  fixed = fixed.replace(/<\/p>\s*<\/p>/gi, '</p>');
  
  // Also handle cases with attributes: <p class="..."><p> -> <p>
  fixed = fixed.replace(/<p[^>]*>\s*<p[^>]*>/gi, '<p>');
  
  return fixed;
};

// Force convert snapshot question to ensure all text fields are strings
const normalizeSnapshotQuestion = (snapshot: SnapshotQuestion) => {
  return {
    ...snapshot,
    text: String(snapshot.text ?? ""),
    type: String(snapshot.type ?? "mcq"),
    options: Array.isArray(snapshot.options)
      ? snapshot.options.map((opt: string | number) => String(opt ?? ""))
      : [],
    correctOptions: Array.isArray(snapshot.correctOptions)
      ? snapshot.correctOptions.map((co: number) => Number(co) || 0)
      : [],
    points: Number(snapshot.points) || 1,
    explanation: snapshot.explanation ? String(snapshot.explanation) : undefined,
    images: Array.isArray(snapshot.images) ? snapshot.images : undefined,
    id: snapshot.id ? String(snapshot.id) : undefined,
    isExternal: Boolean(snapshot.isExternal),
      isNewQuestion: Boolean(snapshot.isNewQuestion ?? false),
    isDeleted: Boolean(snapshot.isDeleted ?? false),
    isDirty: Boolean(snapshot.isDirty ?? false),
  };
};

const QuizCreatePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");

  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [coursesPage, setCoursesPage] = useState(1);
  const [coursesPageSize] = useState(10);
  const [coursesPagination, setCoursesPagination] = useState<{
    totalItems: number;
    currentPage: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  } | null>(null);

  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState<"details" | "select">("details");

  const [bankQuestions, setBankQuestions] = useState<QuizQuestion[]>([]);
  const [bankLoading, setBankLoading] = useState(false);
  const [bankSearch, setBankSearch] = useState("");
  const [randomCount, setRandomCount] = useState(0);
  const [selectedBankIds, setSelectedBankIds] = useState<Set<string>>(new Set());

  const [draftQuestions, setDraftQuestions] = useState<DraftQuestion[]>([emptyDraftQuestion()]);
  const [currentDraftPage, setCurrentDraftPage] = useState(1);
  const [quizDetails, setQuizDetails] = useState<CreateQuizForm>({
    courseId: "",
    title: "",
    description: "",
    startTime: "",
    endTime: "",
    shuffleQuestions: false,
    isPublished: true,
  });

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);

  const quizUploadEndpoint = useMemo(
    () => `${(import.meta.env.VITE_BASE_API || "").replace(/\/$/, "")}/quiz-questions`,
    []
  );

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        setLoadingSubjects(true);
        const { data } = await subjectService.getAllSubjects({ limit: 100 });
        setSubjects(data);
      } catch (err) {
        console.error("Failed to load subjects", err);
        setError("Failed to load subjects. Please refresh.");
      } finally {
        setLoadingSubjects(false);
      }
    };
    fetchSubjects();
  }, []);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoadingCourses(true);
        const response = await http.get("/courses/my-courses", {
          params: {
            page: coursesPage,
            limit: coursesPageSize,
            isPublished: true,
          },
        });

        const coursesList: Course[] = Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response?.data?.data)
          ? response.data.data
          : Array.isArray(response)
          ? (response as Course[])
          : [];

        setCourses(coursesList);

        const pagination = response?.pagination || response?.meta?.pagination;
        
        if (pagination && typeof pagination === 'object') {
          const paginationData = pagination as Record<string, unknown>;
          const totalItems =
            Number(paginationData.totalItems) ||
            Number(paginationData.total) ||
            coursesList.length;
          setCoursesPagination({
            totalItems,
            currentPage:
              Number(paginationData.currentPage) ||
              Number(paginationData.page) ||
              coursesPage,
            limit: Number(paginationData.limit) || coursesPageSize,
            totalPages:
              Number(paginationData.totalPages) ||
              Math.ceil(totalItems / coursesPageSize) ||
              1,
            hasNext:
              Boolean(paginationData.hasNext) ||
              Boolean(paginationData.hasNextPage) ||
              false,
            hasPrev:
              Boolean(paginationData.hasPrev) ||
              Boolean(paginationData.hasPrevPage) ||
              false,
          });
        } else {
          setCoursesPagination({
            totalItems: coursesList.length,
            currentPage: coursesPage,
            limit: coursesPageSize,
            totalPages: 1,
            hasNext: false,
            hasPrev: false,
          });
        }
      } catch (err) {
        console.error("Failed to load courses", err);
        setError("Failed to load courses. Please refresh.");
      } finally {
        setLoadingCourses(false);
      }
    };
    fetchCourses();
  }, [coursesPage, coursesPageSize]);

  const openWizardWithoutCourse = () => {
    setQuizDetails({
      courseId: "",
      title: "",
      description: "",
      startTime: "",
      endTime: "",
      shuffleQuestions: false,
      isPublished: true,
    });
    setDraftQuestions([emptyDraftQuestion()]);
    setSelectedBankIds(new Set());
    setWizardStep("details");
    setDraftQuestions([emptyDraftQuestion()]);
    setSelectedBankIds(new Set());
    setWizardStep("details");
    setShowWizard(true);
  };

  const fetchQuestionBank = async (subjectId: string) => {
    try {
      setBankLoading(true);
      const { data } = await quizQuestionService.getAllQuizQuestions({ subjectId, limit: 100 });
      // Ensure all text fields are strings (API might return number)
      const normalizedQuestions = data.map((q) => ({
        ...q,
        text: String(q.text || ""),
        options: Array.isArray(q.options) ? q.options.map((opt) => String(opt || "")) : [],
        explanation: q.explanation ? String(q.explanation) : undefined,
      }));
      setBankQuestions(normalizedQuestions);
    } catch (err) {
      console.error("Failed to fetch question bank", err);
      setError("Không thể tải câu hỏi từ question bank.");
    } finally {
      setBankLoading(false);
    }
  };

  const filteredBankQuestions = useMemo(() => {
    if (!bankSearch.trim()) return bankQuestions;
    const term = bankSearch.toLowerCase();
    return bankQuestions.filter((q) => q.text.toLowerCase().includes(term));
  }, [bankQuestions, bankSearch]);

  const toggleBankQuestion = (id: string) => {
    setSelectedBankIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const randomPickBankQuestions = () => {
    // Validate: randomCount must be positive and less than available questions
    const availableCount = filteredBankQuestions.length;
    if (!randomCount || randomCount <= 0) {
      setError("Số câu random phải lớn hơn 0.");
      return;
    }
    if (randomCount > availableCount) {
      setError(`Số câu random (${randomCount}) không được lớn hơn số câu hỏi có sẵn (${availableCount}).`);
      return;
    }
    if (availableCount === 0) {
      setError("Không có câu hỏi nào để chọn.");
      return;
    }
    const shuffled = [...filteredBankQuestions].sort(() => Math.random() - 0.5);
    const picked = shuffled.slice(0, randomCount);
    setSelectedBankIds(new Set(picked.map((q) => q._id)));
    setError(null);
  };

  const addDraftQuestion = () => {
    setDraftQuestions((prev) => [...prev, emptyDraftQuestion()]);
    setCurrentDraftPage(draftQuestions.length + 1); // Navigate to new question
  };
  const removeDraftQuestion = (id: string) => {
    setDraftQuestions((prev) => {
      const filtered = prev.filter((dq) => dq.id !== id);
      // Adjust current page if needed
      if (currentDraftPage > filtered.length) {
        setCurrentDraftPage(Math.max(1, filtered.length));
      }
      return filtered.length > 0 ? filtered : [emptyDraftQuestion()];
    });
  };
  const addOptionToDraft = (draftId: string) => {
    updateDraftQuestion(draftId, (prev) => ({
      ...prev,
      options: [...prev.options, ""],
      correctOptions: [...prev.correctOptions, 0],
    }));
  };
  const removeOptionFromDraft = (draftId: string, optionIndex: number) => {
    updateDraftQuestion(draftId, (prev) => {
      if (prev.options.length <= 2) return prev; // Minimum 2 options
      const newOptions = prev.options.filter((_, idx) => idx !== optionIndex);
      const newCorrectOptions = prev.correctOptions.filter((_, idx) => idx !== optionIndex);
      return { ...prev, options: newOptions, correctOptions: newCorrectOptions };
    });
  };
  const updateDraftQuestion = (id: string, updater: (draft: DraftQuestion) => DraftQuestion) => {
    setDraftQuestions((prev) => prev.map((dq) => (dq.id === id ? updater(dq) : dq)));
  };

  const buildSnapshot = (question: QuizQuestion, fromBank: boolean) => {
    const options = Array.isArray(question.options) ? question.options : [];
    const correct =
      Array.isArray(question.correctOptions) && question.correctOptions.length === options.length
        ? question.correctOptions
        : options.map((_, idx) =>
            question.correctOptions && question.correctOptions.includes(idx) ? 1 : 0
          );
    return {
      id: question._id ?? crypto.randomUUID(),
      text: String(fixNestedPTags(question.text || "")),
      type: typeof question.type === "string" ? question.type : "mcq",
      options: options.map(opt => String(fixNestedPTags(opt))),
      correctOptions: correct,
      points: Number(question.points) || 1,
      explanation: question.explanation ? String(fixNestedPTags(question.explanation)) : undefined,
      images: Array.isArray(question.images)
        ? question.images.map((img) =>
            typeof img === "string" ? { url: img, fromDB: true } : { url: img.url, fromDB: img.fromDB ?? true }
          )
        : undefined,
      isExternal: !fromBank,
      isNewQuestion: !fromBank,
      isDeleted: false,
      isDirty: false,
    };
  };

  const createDraftQuestion = async (draft: DraftQuestion) => {
    if (!draft.text.trim()) return null;
    const formData = new FormData();
    formData.append("subjectId", selectedSubjectId);
    formData.append("text", fixNestedPTags(draft.text.trim()));
    formData.append("type", "mcq");
    formData.append("options", JSON.stringify(draft.options.map(opt => fixNestedPTags(opt))));
    formData.append("correctOptions", JSON.stringify(draft.correctOptions));
    const response = await fetch(quizUploadEndpoint, {
      method: "POST",
      body: formData,
      credentials: "include",
    });
    const result = await response.json().catch(() => null);
    if (!response.ok || (result && result.success === false)) {
      const message =
        result?.message || result?.error?.message || response.statusText || "Failed to create question";
      throw new Error(message);
    }
    // Ensure all text fields are strings (API might return number)
    const created = result?.data as QuizQuestion;
    if (created) {
      created.text = String(created.text || "");
      if (Array.isArray(created.options)) {
        created.options = created.options.map(opt => String(opt || ""));
      }
      if (created.explanation) {
        created.explanation = String(created.explanation);
      }
    }
    return created;
  };

  const submitQuiz = async () => {
    setError(null);
    if (!selectedSubjectId) {
      setError("Vui lòng chọn subject.");
      return;
    }
    if (!quizDetails.courseId) {
      setError("Vui lòng chọn course.");
      return;
    }
    if (!quizDetails.title.trim()) {
      setError("Vui lòng nhập tiêu đề quiz.");
      return;
    }
    if (!quizDetails.startTime || !quizDetails.endTime) {
      setError("Vui lòng chọn thời gian bắt đầu và kết thúc.");
      return;
    }
    try {
      setSubmittingQuiz(true);
      const snapshotQuestions = [];
      const selectedQuestions = bankQuestions.filter((q) => selectedBankIds.has(q._id));
      selectedQuestions.forEach((q) => snapshotQuestions.push(buildSnapshot(q, true)));

      for (const draft of draftQuestions) {
        if (!draft.text.trim()) continue;
        const created = await createDraftQuestion(draft);
        if (created) snapshotQuestions.push(buildSnapshot(created, false));
      }

      if (snapshotQuestions.length === 0) {
        setError("Không có câu hỏi nào được chọn.");
        return;
      }

      // Final normalization: ensure all text fields are strings before sending
      // This is MANDATORY - all text fields must be strings
      const normalizedSnapshots = snapshotQuestions.map((snapshot) => {
        const normalized = normalizeSnapshotQuestion(snapshot);
        // Double check: ensure text is definitely a string
        if (typeof normalized.text !== 'string') {
          console.error('Text is not string after normalization:', normalized.text, typeof normalized.text);
          normalized.text = String(normalized.text ?? "");
        }
        // Ensure options are strings
        normalized.options = normalized.options.map((opt: string | number) => {
          if (typeof opt !== 'string') {
            console.error('Option is not string:', opt, typeof opt);
            return String(opt ?? "");
          }
          return opt;
        });
        return normalized;
      });

      await quizService.createQuiz({
        courseId: quizDetails.courseId,
        title: quizDetails.title.trim(),
        description: quizDetails.description.trim() || undefined,
        startTime: convertToISOUTC(quizDetails.startTime),
        endTime: convertToISOUTC(quizDetails.endTime),
        shuffleQuestions: quizDetails.shuffleQuestions,
        isPublished: quizDetails.isPublished,
        snapshotQuestions: normalizedSnapshots,
      });

      setSuccess("Quiz created successfully.");
      setShowWizard(false);
    } catch (err) {
      console.error("Failed to create quiz", err);
      const message =
        typeof err === "object" && err !== null && "message" in err
          ? String((err as { message?: string }).message)
          : "Failed to create quiz.";
      setError(message);
    } finally {
      setSubmittingQuiz(false);
    }
  };

  const handleDetailsNext = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!selectedSubjectId) {
      setError("Vui lòng chọn subject cho quiz.");
      return;
    }
    if (!quizDetails.courseId) {
      setError("Vui lòng chọn course.");
      return;
    }
    if (!quizDetails.title.trim()) {
      setError("Vui lòng nhập tiêu đề quiz.");
      return;
    }
    if (!quizDetails.startTime || !quizDetails.endTime) {
      setError("Vui lòng chọn thời gian bắt đầu và kết thúc.");
      return;
    }
    const start = new Date(quizDetails.startTime);
    const end = new Date(quizDetails.endTime);
    if (start >= end) {
      setError("End time phải lớn hơn start time.");
      return;
    }
    setWizardStep("select");
    fetchQuestionBank(selectedSubjectId);
  };

  return (
    <div
      className="flex h-screen overflow-hidden relative"
      style={{ backgroundColor: "var(--page-bg)", color: "var(--page-text)" }}
    >
      <Navbar />
      <Sidebar role={(user?.role as "admin" | "teacher" | "student") || "teacher"} />

      <div className="flex flex-col flex-1 w-0 overflow-hidden">
        <main className="flex-1 relative overflow-y-auto focus:outline-none p-4 mt-16 sm:pl-24 md:pl-28">
          <div className="max-w-6xl mx-auto px-4 space-y-6">
            <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-1" style={{ color: "var(--heading-text)" }}>
                  Questions & Quiz Builder
                </h1>
                <p className="text-sm" style={{ color: "var(--muted-text)" }}>
                  Chọn subject, thêm câu hỏi trước rồi mới tạo quiz.
                </p>
              </div>
              <button
                type="button"
                onClick={openWizardWithoutCourse}
                className="self-start px-4 py-2 rounded-xl font-semibold shadow-lg"
                style={{ backgroundColor: "#6d28d9", color: "#fff" }}
              >
                Create quiz
              </button>
            </header>

            {(error || success) && (
              <div className="space-y-2">
                {error && (
                  <div className="p-3 rounded-md text-sm" style={{ backgroundColor: "var(--error-bg)", color: "var(--error-text)" }}>
                    {error}
                  </div>
                )}
                {success && (
                  <div
                    className="p-3 rounded-md text-sm"
                    style={{ backgroundColor: "var(--status-available-bg)", color: "var(--status-available-text)" }}
                  >
                    {success}
                  </div>
                )}
              </div>
            )}

            <section
              className="rounded-3xl shadow-lg p-6 space-y-6 border"
              style={{ backgroundColor: "var(--card-surface)", borderColor: "var(--card-border)" }}
            >
              <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--heading-text)" }}>
                Courses
              </h2>
              {loadingCourses ? (
                <p style={{ color: "var(--muted-text)" }}>Loading courses...</p>
              ) : courses.length === 0 ? (
                <p style={{ color: "var(--muted-text)" }}>No courses available.</p>
              ) : (
                <div className="grid gap-4">
                  {courses.map((course) => (
                    <div
                      key={course._id}
                      className="rounded-2xl border px-6 py-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg flex flex-col gap-3 cursor-pointer"
                      style={{
                        backgroundColor: "var(--card-row-bg)",
                        borderColor: "var(--card-row-border)",
                      }}
                      onClick={() => navigate(`/quizz/${course._id}`)}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-base font-semibold" style={{ color: "var(--heading-text)" }}>
                            {course.title}
                          </div>
                          {course.code && (
                            <div className="text-xs mt-1 uppercase tracking-wide" style={{ color: "var(--muted-text)" }}>
                              {course.code}
                            </div>
                          )}
                        </div>
                        <span
                          className="text-xs font-semibold px-4 py-1.5 rounded-full shadow"
                          style={{ backgroundColor: "#1d4ed8", color: "#fff" }}
                        >
                          View quizzes
                        </span>
                      </div>
                      <p className="text-xs" style={{ color: "var(--muted-text)" }}>
                        Click card to view or manage quizzes for this course.
                      </p>
                    </div>
                  ))}
                </div>
              )}
              {coursesPagination && coursesPagination.totalPages > 1 && (
                <QuizPagination
                  currentPage={coursesPagination.currentPage}
                  totalPages={coursesPagination.totalPages}
                  textColor="var(--heading-text)"
                  borderColor="var(--card-border)"
                  hasPrev={coursesPagination.hasPrev}
                  hasNext={coursesPagination.hasNext}
                  pageOptions={Array.from({ length: Math.min(5, coursesPagination.totalPages) }, (_, i) => {
                    const start = Math.max(1, coursesPagination.currentPage - 2);
                    return Math.min(start + i, coursesPagination.totalPages);
                  }).filter((v, i, arr) => arr.indexOf(v) === i)}
                  onPrev={() => setCoursesPage((p) => Math.max(1, p - 1))}
                  onNext={() => setCoursesPage((p) => Math.min(coursesPagination!.totalPages, p + 1))}
                  onSelectPage={(page) => setCoursesPage(page)}
                />
              )}
            </section>
          </div>
        </main>
      </div>

      {showWizard && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowWizard(false)} />
          <div
            className="relative w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-2xl shadow-2xl p-6 space-y-4"
            style={{
              backgroundColor: "var(--card-surface)",
              color: "var(--heading-text)",
              border: "1px solid var(--card-border)",
            }}
          >
            {wizardStep === "details" ? (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold">Create Quiz</h2>
                    <p className="text-sm" style={{ color: "var(--muted-text)" }}>
                      Fill out the details below to publish a new quiz.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowWizard(false)}
                    className="px-3 py-1 rounded-lg text-sm font-semibold"
                    style={{ backgroundColor: "var(--divider-color)", color: "var(--heading-text)" }}
                  >
                    Close
                  </button>
                </div>

                <form onSubmit={handleDetailsNext} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: "var(--muted-text)" }}>
                      Subject
                    </label>
                    <select
                      value={selectedSubjectId}
                      onChange={(e) => setSelectedSubjectId(e.target.value)}
                      disabled={loadingSubjects}
                      className="w-full px-3 py-2 rounded-lg border"
                      style={{
                        backgroundColor: "var(--input-bg)",
                        borderColor: "var(--input-border)",
                        color: "var(--input-text)",
                      }}
                    >
                      <option value="">{loadingSubjects ? "Loading subjects..." : "Select subject"}</option>
                      {subjects.map((subject) => (
                        <option key={subject._id} value={subject._id}>
                          {subject.code} - {subject.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: "var(--muted-text)" }}>
                      Course
                    </label>
                    <select
                      value={quizDetails.courseId}
                      onChange={(e) => setQuizDetails((prev) => ({ ...prev, courseId: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border"
                      style={{
                        backgroundColor: "var(--input-bg)",
                        borderColor: "var(--input-border)",
                        color: "var(--input-text)",
                      }}
                    >
                      <option value="">Select course</option>
                      {courses.map((course) => (
                        <option key={course._id} value={course._id}>
                          {course.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: "var(--muted-text)" }}>
                      Title
                    </label>
                    <input
                      type="text"
                      value={quizDetails.title}
                      onChange={(e) => setQuizDetails((prev) => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border"
                      style={{
                        backgroundColor: "var(--input-bg)",
                        borderColor: "var(--input-border)",
                        color: "var(--input-text)",
                      }}
                      placeholder="Enter quiz title"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: "var(--muted-text)" }}>
                      Description
                    </label>
                    <textarea
                      value={quizDetails.description}
                      onChange={(e) => setQuizDetails((prev) => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border"
                      style={{
                        backgroundColor: "var(--input-bg)",
                        borderColor: "var(--input-border)",
                        color: "var(--input-text)",
                      }}
                      rows={3}
                      placeholder="Short description of the quiz"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: "var(--muted-text)" }}>
                        Start Time
                      </label>
                    <input
                        type="datetime-local"
                        value={quizDetails.startTime}
                        onChange={(e) => setQuizDetails((prev) => ({ ...prev, startTime: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border"
                        style={{
                          backgroundColor: "var(--input-bg)",
                          borderColor: "var(--input-border)",
                          color: "var(--input-text)",
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: "var(--muted-text)" }}>
                        End Time
                      </label>
                      <input
                        type="datetime-local"
                        value={quizDetails.endTime}
                        onChange={(e) => setQuizDetails((prev) => ({ ...prev, endTime: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border"
                        style={{
                          backgroundColor: "var(--input-bg)",
                          borderColor: "var(--input-border)",
                          color: "var(--input-text)",
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={quizDetails.isPublished}
                        onChange={(e) => setQuizDetails((prev) => ({ ...prev, isPublished: e.target.checked }))}
                        className="w-4 h-4 rounded border"
                        style={{
                          backgroundColor: quizDetails.isPublished ? "var(--primary-color)" : "var(--input-bg)",
                          borderColor: "var(--input-border)",
                        }}
                      />
                      <span className="text-sm font-medium" style={{ color: "var(--muted-text)" }}>
                        Published
                      </span>
                    </label>
                  </div>


                  <div className="flex items-center justify-between pt-4 border-t">
                    <button
                      type="button"
                      onClick={() => setShowWizard(false)}
                      className="px-4 py-2 rounded-lg text-sm font-medium"
                      style={{ backgroundColor: "var(--divider-color)", color: "var(--heading-text)" }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white"
                    >
                      Next: Add questions
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold">Add Questions</h2>
                    <p className="text-sm" style={{ color: "var(--muted-text)" }}>
                      Chọn câu hỏi từ question bank hoặc tạo câu mới để thêm vào quiz.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowWizard(false)}
                    className="px-3 py-1 rounded-lg text-sm font-semibold"
                    style={{ backgroundColor: "var(--divider-color)", color: "var(--heading-text)" }}
                  >
                    Close
                  </button>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <div
                    className="border rounded-2xl p-4 space-y-3"
                    style={{ backgroundColor: "var(--card-row-bg)", borderColor: "var(--card-row-border)" }}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Question Bank</h3>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          max={filteredBankQuestions.length}
                          className="w-20 px-2 py-1 border rounded"
                          placeholder="Random"
                          value={randomCount || ""}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            if (val < 0) {
                              setRandomCount(0);
                            } else if (val > filteredBankQuestions.length) {
                              setRandomCount(filteredBankQuestions.length);
                            } else {
                              setRandomCount(val);
                            }
                          }}
                        />
                        <span className="text-xs" style={{ color: "var(--muted-text)" }}>
                          / {filteredBankQuestions.length}
                        </span>
                        <button
                          type="button"
                          onClick={randomPickBankQuestions}
                          className="px-3 py-1 rounded bg-indigo-600 text-white text-sm"
                        >
                          Random pick
                        </button>
                      </div>
                    </div>
                    <input
                      type="text"
                      placeholder="Search question..."
                      value={bankSearch}
                      onChange={(e) => setBankSearch(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                      style={{ borderColor: "var(--card-row-border)", backgroundColor: "var(--card-row-bg)", color: "var(--heading-text)" }}
                    />
                    <div className="max-h-[360px] overflow-y-auto space-y-3">
                      {bankLoading ? (
                        <p className="text-sm" style={{ color: "var(--muted-text)" }}>
                          Loading questions...
                        </p>
                      ) : filteredBankQuestions.length === 0 ? (
                        <p className="text-sm" style={{ color: "var(--muted-text)" }}>
                          No questions found.
                        </p>
                      ) : (
                        filteredBankQuestions.map((question) => (
                          <label
                            key={question._id}
                            className="flex items-start gap-2 border rounded-xl p-3 cursor-pointer transition-colors"
                            style={{
                              borderColor: "var(--card-row-border)",
                              backgroundColor: "var(--card-row-bg)",
                            }}
                          >
                            <input
                              type="checkbox"
                              className="mt-1"
                              checked={selectedBankIds.has(question._id)}
                              onChange={() => toggleBankQuestion(question._id)}
                            />
                            <div>
                              <p className="font-medium" style={{ color: "var(--heading-text)" }}>
                                {question.text}
                              </p>
                              {Array.isArray(question.options) && (
                                <ul className="text-sm list-disc pl-5 mt-1 space-y-0.5" style={{ color: "var(--muted-text)" }}>
                                  {question.options.map((opt, idx) => (
                                    <li key={idx}>
                                      {String.fromCharCode(65 + idx)}.{" "}
                                      <span
                                        className={
                                          question.correctOptions?.[idx] === 1 ? "text-emerald-600 font-semibold" : ""
                                        }
                                      >
                                        {opt}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </label>
                        ))
                      )}
                    </div>
                  </div>

                  <div
                    className="border rounded-2xl p-4 space-y-4"
                    style={{ backgroundColor: "var(--card-row-bg)", borderColor: "var(--card-row-border)" }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Create New Questions</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-sm" style={{ color: "var(--muted-text)" }}>
                          {draftQuestions.length} question{draftQuestions.length !== 1 ? 's' : ''}
                        </span>
                        <button
                          type="button"
                          onClick={addDraftQuestion}
                          className="px-3 py-1 rounded bg-indigo-600 text-white text-sm"
                        >
                          + Add question
                        </button>
                      </div>
                    </div>
                    
                    {/* Pagination Navigation */}
                    {draftQuestions.length > 1 && (
                      <div className="flex items-center justify-between mb-4 pb-3 border-b" style={{ borderColor: "var(--card-row-border)" }}>
                        <button
                          type="button"
                          onClick={() => setCurrentDraftPage(Math.max(1, currentDraftPage - 1))}
                          disabled={currentDraftPage === 1}
                          className="px-3 py-1 rounded border text-sm disabled:opacity-50"
                          style={{ borderColor: "var(--card-row-border)" }}
                        >
                          ← Previous
                        </button>
                        <span className="text-sm font-medium" style={{ color: "var(--heading-text)" }}>
                          Question {currentDraftPage} of {draftQuestions.length}
                        </span>
                        <button
                          type="button"
                          onClick={() => setCurrentDraftPage(Math.min(draftQuestions.length, currentDraftPage + 1))}
                          disabled={currentDraftPage === draftQuestions.length}
                          className="px-3 py-1 rounded border text-sm disabled:opacity-50"
                          style={{ borderColor: "var(--card-row-border)" }}
                        >
                          Next →
                        </button>
                      </div>
                    )}

                    {/* Current Question Form */}
                    {draftQuestions[currentDraftPage - 1] && (() => {
                      const draft = draftQuestions[currentDraftPage - 1];
                      return (
                        <div
                          className="border rounded-xl p-4 space-y-3"
                          style={{ borderColor: "var(--card-row-border)", backgroundColor: "var(--input-bg)" }}
                        >
                          <div className="flex items-center justify-between">
                            <p className="font-semibold" style={{ color: "var(--heading-text)" }}>
                              Question {currentDraftPage}
                            </p>
                            {draftQuestions.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeDraftQuestion(draft.id)}
                                className="text-sm text-red-500 hover:text-red-700"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                          <textarea
                            className="w-full border rounded-lg px-3 py-2"
                            placeholder="Enter question text..."
                            value={draft.text}
                            onChange={(e) =>
                              updateDraftQuestion(draft.id, (prev) => ({ ...prev, text: e.target.value }))
                            }
                            style={{
                              borderColor: "var(--card-row-border)",
                              backgroundColor: "var(--card-row-bg)",
                              color: "var(--heading-text)",
                            }}
                            rows={3}
                          />
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="text-sm font-medium" style={{ color: "var(--muted-text)" }}>
                                Options
                              </label>
                              <button
                                type="button"
                                onClick={() => addOptionToDraft(draft.id)}
                                className="text-xs px-2 py-1 rounded bg-indigo-600 text-white"
                              >
                                + Add option
                              </button>
                            </div>
                            {draft.options.map((option, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <label className="text-sm font-medium w-16" style={{ color: "var(--muted-text)" }}>
                                  {String.fromCharCode(65 + idx)}.
                                </label>
                                <input
                                  type="text"
                                  className="flex-1 border rounded-lg px-3 py-2"
                                  value={option}
                                  onChange={(e) =>
                                    updateDraftQuestion(draft.id, (prev) => {
                                      const nextOptions = [...prev.options];
                                      nextOptions[idx] = e.target.value;
                                      return { ...prev, options: nextOptions };
                                    })
                                  }
                                  style={{
                                    borderColor: "var(--card-row-border)",
                                    backgroundColor: "var(--card-row-bg)",
                                    color: "var(--heading-text)",
                                  }}
                                  placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                                />
                                <label className="flex items-center gap-1 text-sm" style={{ color: "var(--muted-text)" }}>
                                  <input
                                    type="checkbox"
                                    checked={draft.correctOptions[idx] === 1}
                                    onChange={(e) =>
                                      updateDraftQuestion(draft.id, (prev) => {
                                        const next = [...prev.correctOptions];
                                        next[idx] = e.target.checked ? 1 : 0;
                                        return { ...prev, correctOptions: next };
                                      })
                                    }
                                  />
                                  Correct
                                </label>
                                {draft.options.length > 2 && (
                                  <button
                                    type="button"
                                    onClick={() => removeOptionFromDraft(draft.id, idx)}
                                    className="text-red-500 hover:text-red-700 text-sm px-2"
                                  >
                                    ×
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowWizard(false)}
                    className="px-4 py-2 rounded-lg border text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => setWizardStep("details")}
                    className="px-4 py-2 rounded-lg border text-sm font-medium"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={submitQuiz}
                    disabled={submittingQuiz}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submittingQuiz ? "Creating..." : "Create quiz"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizCreatePage;


