import { useEffect, useState, useRef } from "react";
import type { FormEvent } from "react";
import { useTheme } from "../hooks/useTheme";
import { useAuth } from "../hooks/useAuth";
import Navbar from "../components/Navbar.tsx";
import Sidebar from "../components/Sidebar.tsx";
import { PlusCircle, X, ImagePlus, CheckCircle, AlertCircle, Info, Upload, Download, FileText } from "lucide-react";
import { subjectService, quizQuestionService, type QuizQuestion } from "../services";
import type { Subject } from "../types/subject";
import { useNavigate } from "react-router-dom";
import { QuizPagination } from "../components/quiz/QuizPagination";

type Question = {
  text: string;
  options: string[];
  correctOptions: number[];
  imageFiles: File[];
  imagePreviews: string[];
};

export default function QuizManagementPage() {
  const { darkMode } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectsPage, setSubjectsPage] = useState(1);
  const [subjectsPageSize] = useState(10);
  const [subjectsPagination, setSubjectsPagination] = useState<{
    totalItems: number;
    currentPage: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  } | null>(null);
  const [questionCounts, setQuestionCounts] = useState<Record<string, number>>({});
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importSubjectId, setImportSubjectId] = useState("");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const importFileInputRef = useRef<HTMLInputElement | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportSubjectId, setExportSubjectId] = useState("");
  const [exporting, setExporting] = useState(false);
  const closeExportModal = () => {
    if (exporting) return;
    setShowExportModal(false);
    setExportSubjectId("");
  };
  const quizUploadEndpoint = `${import.meta.env.VITE_BASE_API.replace(/\/$/, "")}/quiz-questions`;
  // Refs for file inputs for each question
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  // Notification system
  type NotificationType = "error" | "warning" | "success" | "info";
  interface Notification {
    id: string;
    message: string;
    type: NotificationType;
  }
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const showNotification = (message: string, type: NotificationType = "error") => {
    const id = Date.now().toString();
    const newNotification: Notification = { id, message, type };
    setNotifications((prev) => [...prev, newNotification]);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 4000);
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };



  // Step 1: Quiz Details
  const [quizDetails, setQuizDetails] = useState({
    title: "",
    description: "",
    examCode: "",
  });

  // Step 2: Questions
  const [questions, setQuestions] = useState<Question[]>([
    {
      text: "",
      options: ["", "", "", ""],
      correctOptions: [0, 0, 0, 0],
      imageFiles: [],
      imagePreviews: [],
    },
  ]);

  // Fetch subjects for /quiz - Sử dụng environment variable VITE_BASE_API
  useEffect(() => {
    (async () => {
      try {
        console.log("Fetching subjects from API...");
        const result = await subjectService.getAllSubjects({ 
          page: subjectsPage,
          limit: subjectsPageSize 
        });
        console.log("Subjects response:", result);
        setSubjects(result.data || []);
        
        // Handle pagination response
        if (result.pagination) {
          setSubjectsPagination({
            totalItems: result.pagination.totalItems || result.data.length,
            currentPage: result.pagination.currentPage || subjectsPage,
            limit: result.pagination.limit || subjectsPageSize,
            totalPages: result.pagination.totalPages || Math.ceil((result.pagination.totalItems || result.data.length) / subjectsPageSize),
            hasNext: result.pagination.hasNext || false,
            hasPrev: result.pagination.hasPrev || false,
          });
        } else {
          // Fallback if no pagination info
          setSubjectsPagination({
            totalItems: result.data.length,
            currentPage: subjectsPage,
            limit: subjectsPageSize,
            totalPages: 1,
            hasNext: false,
            hasPrev: false,
          });
        }
      } catch (error) {
        console.error("Error fetching subjects:", error);
        setSubjects([]);
      }
    })();
  }, [subjectsPage, subjectsPageSize]);

  // Fetch question counts for each subject
  useEffect(() => {
    const fetchQuestionCounts = async () => {
      if (subjects.length === 0) return;
      
      const counts: Record<string, number> = {};
      await Promise.all(
        subjects.map(async (subject) => {
          try {
            // Fetch first page with large limit to get most questions
            const result = await quizQuestionService.getAllQuizQuestions({
              subjectId: subject._id,
              limit: 100,
              page: 1,
            });
            
            // Use pagination total if available, otherwise count from data
            const total = result.pagination?.totalItems;
            if (total !== undefined && total !== null) {
              counts[subject._id] = total;
            } else {
              // Fallback: count questions from first page
              counts[subject._id] = (result.data || []).length;
            }
          } catch (err) {
            console.error(`Failed to fetch question count for subject ${subject._id}:`, err);
            counts[subject._id] = 0;
          }
        })
      );
      setQuestionCounts(counts);
    };

    fetchQuestionCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjects]);

  const handlePickSubject = (subjectId: string) => {
    navigate(`/questionbank/${subjectId}`);
  };

  const generateExamCode = (subject: Subject) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    return `${subject.code}-${year}${month}${day}-${hours}${minutes}`;
  };

  const handleSelectSubject = (subject: Subject) => {
    setSelectedSubject(subject);
    // Auto-generate exam code
    if (!quizDetails.examCode) {
      const code = generateExamCode(subject);
      if (code) {
        setQuizDetails((prev) => ({ ...prev, examCode: code }));
      }
    }
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!selectedSubject) {
        showNotification("Subject is required", "error");
        return;
      }
      if (!quizDetails.title.trim()) {
        showNotification("Quiz Title is required", "error");
        return;
      }
      if (!quizDetails.examCode.trim()) {
        showNotification("Exam Code is required", "error");
        return;
      }
    }
    setCurrentStep(2);
  };

  const handlePrevStep = () => {
    setCurrentStep(1);
  };

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        text: "",
        options: ["", "", "", ""],
        correctOptions: [0, 0, 0, 0],
        imageFiles: [],
        imagePreviews: [],
      },
    ]);
  };

const handleAddOptionToQuestion = (questionIndex: number) => {
  setQuestions((prev) => {
    const updated = [...prev];
    const question = updated[questionIndex];
    updated[questionIndex] = {
      ...question,
      options: [...question.options, ""],
      correctOptions: [...question.correctOptions, 0],
    };
    return updated;
  });
};

const handleRemoveOptionFromQuestion = (questionIndex: number, optionIndex: number) => {
  setQuestions((prev) => {
    const updated = [...prev];
    const question = updated[questionIndex];
    if (question.options.length <= 2) return prev;

    updated[questionIndex] = {
      ...question,
      options: question.options.filter((_, idx) => idx !== optionIndex),
      correctOptions: question.correctOptions.filter((_, idx) => idx !== optionIndex),
    };
    return updated;
  });
  };

  const handleUpdateQuestion = (index: number, field: keyof Question, value: unknown) => {
    const updated = [...questions];
    if (field === "options") {
      updated[index] = { ...updated[index], options: value as string[] };
    } else if (field === "correctOptions") {
      updated[index] = { ...updated[index], correctOptions: value as number[] };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setQuestions(updated);
  };

  const handleUpdateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const updated = [...questions];
    updated[questionIndex].options[optionIndex] = value;
    setQuestions(updated);
  };

  const handleUpdateCorrectOption = (questionIndex: number, optionIndex: number) => {
    const updated = [...questions];
    const current = updated[questionIndex].correctOptions[optionIndex];
    updated[questionIndex].correctOptions[optionIndex] = current === 1 ? 0 : 1;
    setQuestions(updated);
  };

  const handleRemoveQuestion = (index: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index));
    }
  };

  const handleQuestionImageChange = (questionIndex: number, fileList: FileList | null, append: boolean = false) => {
    const files = fileList ? Array.from(fileList) : [];
    if (!files.length) {
      if (!append) {
        setQuestions((prev) => {
          const updated = [...prev];
          updated[questionIndex] = {
            ...updated[questionIndex],
            imageFiles: [],
            imagePreviews: [],
          };
          return updated;
        });
      }
      return;
    }

    const readers = files.map(
      (file) =>
        new Promise<string>((resolve) => {
          const r = new FileReader();
          r.onloadend = () => resolve(typeof r.result === "string" ? r.result : "");
          r.readAsDataURL(file);
        })
    );

    Promise.all(readers).then((previews) => {
      setQuestions((prev) => {
        const updated = [...prev];
        const currentQuestion = updated[questionIndex];
        updated[questionIndex] = {
          ...updated[questionIndex],
          imageFiles: append 
            ? [...currentQuestion.imageFiles, ...files]
            : files,
          imagePreviews: append
            ? [...currentQuestion.imagePreviews, ...previews.filter(Boolean)]
            : previews.filter(Boolean),
        };
        return updated;
      });
    });
  };

  const handleRemoveImageAt = (questionIndex: number, imgIndex: number) => {
    setQuestions((prev) => {
      const updated = [...prev];
      const q = updated[questionIndex];
      updated[questionIndex] = {
        ...q,
        imageFiles: q.imageFiles.filter((_, i) => i !== imgIndex),
        imagePreviews: q.imagePreviews.filter((_, i) => i !== imgIndex),
      };
      return updated;
    });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedSubject) {
      showNotification("Subject is required", "error");
      return;
    }

    const subjectId = selectedSubject._id;

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) {
        showNotification(`Question Text is required for Question ${i + 1}`, "error");
        return;
      }
      if (q.options.some((opt) => !opt.trim())) {
        showNotification(`All options (A, B, C, D) are required for Question ${i + 1}`, "error");
        return;
      }
      // Check for duplicate options
      const trimmedOptions = q.options.map(opt => opt.trim()).filter(opt => opt !== "");
      const uniqueOptions = new Set(trimmedOptions);
      if (uniqueOptions.size !== trimmedOptions.length) {
        showNotification(`Question ${i + 1}: Options cannot be duplicate. Please enter different values.`, "error");
        return;
      }
      if (!q.correctOptions.includes(1)) {
        showNotification(`Please select at least one correct answer for Question ${i + 1}`, "error");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      // Create each question
      for (const question of questions) {
        // Ensure options is always an array of strings
        let normalizedOptions: string[] = [];
        if (Array.isArray(question.options)) {
          normalizedOptions = question.options.filter((opt: string) => opt && opt.trim() !== "");
        } else if (typeof question.options === "string") {
          // If it's a string like "A, B, C", convert to array
          const optionsString = question.options as string;
          normalizedOptions = optionsString
            .split(",")
            .map((opt: string) => opt.trim())
            .filter((opt: string) => opt !== "");
        } else {
          normalizedOptions = [];
        }

        // Ensure correctOptions is always an array of numbers (0 or 1)
        let normalizedCorrectOptions: number[] = [];
        if (Array.isArray(question.correctOptions)) {
          normalizedCorrectOptions = question.correctOptions.map(val => 
            typeof val === "number" ? (val === 1 ? 1 : 0) : 0
          );
        } else if (typeof question.correctOptions === "string") {
          // If it's a string, try to parse it
          try {
            const parsed = JSON.parse(question.correctOptions);
            if (Array.isArray(parsed)) {
              normalizedCorrectOptions = parsed.map(val => typeof val === "number" ? (val === 1 ? 1 : 0) : 0);
            }
          } catch {
            normalizedCorrectOptions = [];
          }
        } else {
          normalizedCorrectOptions = [];
        }

        // Validate arrays
        if (normalizedOptions.length < 2) {
          showNotification(`Question ${questions.indexOf(question) + 1}: At least 2 options are required`, "error");
          setIsSubmitting(false);
          return;
        }

        // Check for duplicate options
        const uniqueOptions = new Set(normalizedOptions);
        if (uniqueOptions.size !== normalizedOptions.length) {
          showNotification(`Question ${questions.indexOf(question) + 1}: Options cannot be duplicate. Please enter different values.`, "error");
          setIsSubmitting(false);
          return;
        }

        if (normalizedCorrectOptions.length !== normalizedOptions.length) {
          // Pad or trim correctOptions to match options length
          normalizedCorrectOptions = Array(normalizedOptions.length).fill(0).map((_, idx) => 
            question.correctOptions && Array.isArray(question.correctOptions) && question.correctOptions[idx] === 1 ? 1 : 0
          );
        }

        if (!normalizedCorrectOptions.includes(1)) {
          showNotification(`Question ${questions.indexOf(question) + 1}: Please select at least one correct answer`, "error");
          setIsSubmitting(false);
          return;
        }

        const formData = new FormData();
        formData.append("subjectId", subjectId);
        formData.append("text", question.text.trim());
        formData.append("options", JSON.stringify(normalizedOptions));
        formData.append("correctOptions", JSON.stringify(normalizedCorrectOptions));
        formData.append("type", "mcq");
        // Removed explanation
        if (question.imageFiles && question.imageFiles.length > 0) {
          for (const f of question.imageFiles) {
            formData.append("files", f);
          }
        }

        console.log("Uploading quiz question with image to:", quizUploadEndpoint);

        const response = await fetch(quizUploadEndpoint, {
          method: "POST",
          body: formData,
        });

        const result = await response.json().catch(() => null);

        if (!response.ok || (result && result.success === false)) {
          const message =
            (result && (result.message || result.error?.message)) ||
            response.statusText ||
            "Failed to create quiz question";
          throw new Error(message);
        }

        console.log("Question created successfully:", result);
      }
      // Show success notification
      setShowSuccessNotification(true);
      // Reset form
      setShowCreateModal(false);
      setCurrentStep(1);
      setSelectedSubject(null);
      setQuizDetails({ title: "", description: "", examCode: "" });
      setQuestions([
        {
          text: "",
          options: ["", "", "", ""],
          correctOptions: [0, 0, 0, 0],
          imageFiles: [],
          imagePreviews: [],
        },
      ]);
      // Auto hide notification after 3 seconds
      setTimeout(() => {
        setShowSuccessNotification(false);
      }, 3000);
    } catch (error: unknown) {
      console.error("Error creating quiz questions:", error);
      let errorMessage = "Failed to create quiz questions";
      
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as { response?: { data?: { message?: string; error?: { message?: string } } } };
        errorMessage = axiosError.response?.data?.message 
          || axiosError.response?.data?.error?.message 
          || errorMessage;
        
        // Log full error for debugging
        console.error("Full error response:", axiosError.response?.data);
      } else if (error instanceof Error && error.message) {
        errorMessage = error.message;
      }
      
      showNotification(errorMessage, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setCurrentStep(1);

    setQuizDetails({ title: "", description: "", examCode: "" });
    setQuestions([
      {
        text: "",
        options: ["", "", "", ""],
        correctOptions: [0, 0, 0, 0],
        imageFiles: [],
        imagePreviews: [],
      },
    ]);
  };

const handleImportQuiz = async () => {
  if (!importSubjectId) {
    showNotification("Subject is required", "error");
    return;
  }
  if (!importFile) {
    showNotification("Please choose an XML file", "error");
    return;
  }

  try {
    setImporting(true);
    
    // 1. Fetch và lưu tất cả câu hỏi cũ trước khi import (vì BE sẽ xóa chúng)
    const oldQuestionsResult = await quizQuestionService.getAllQuizQuestions({
      subjectId: importSubjectId,
      limit: 10000, // Lấy tất cả
      option: "subjectId",
    });
    const oldQuestions = oldQuestionsResult.data || [];
    
    let subjectDetail: Subject | null = null;
    try {
      subjectDetail = await subjectService.getSubjectById(importSubjectId);
    } catch (error) {
      console.error("Failed to fetch subject info for import:", error);
      subjectDetail = null;
    }

    const enhanceWithSubject = (questions: QuizQuestion[]) => {
      if (!subjectDetail) return questions;
      return questions.map((q) => {
        if (typeof q.subjectId === "string" || !q.subjectId) {
          return {
            ...q,
            subjectId: {
              _id: subjectDetail?._id,
              code: subjectDetail?.code,
              name: subjectDetail?.name,
            },
          };
        }
        return q;
      });
    };

    // 2. Import câu hỏi mới (BE sẽ xóa câu hỏi cũ và insert câu hỏi mới)
    const result = await quizQuestionService.importQuizFromXml(importSubjectId, importFile);
    const imported = Array.isArray(result) ? result : result?.data || [];
    
    // 3. Merge câu hỏi cũ với câu hỏi mới để hiển thị cả hai
    const allQuestions = enhanceWithSubject([...oldQuestions, ...imported]);

    showNotification("Quiz questions imported successfully", "success");
    setShowImportModal(false);
    setImportSubjectId("");
    setImportFile(null);

    // Navigate to quiz page và pass cả câu hỏi cũ và mới để hiển thị
    navigate(`/questionbank/${importSubjectId}`, {
      state: { mergedQuestions: allQuestions, subjectInfo: subjectDetail ?? undefined },
    });
  } catch (error) {
    console.error("Import quiz failed:", error);
    let message = "Failed to import quiz questions";
    if (error && typeof error === "object" && "message" in error) {
      message = (error as { message?: string }).message || message;
    }
    showNotification(message, "error");
  } finally {
    setImporting(false);
  }
  };

  const handleExportQuiz = async () => {
    if (!exportSubjectId) {
      showNotification("Please choose a subject to export", "error");
      return;
    }

    try {
      setExporting(true);
      const blob = await quizQuestionService.exportQuizQuestions(exportSubjectId);
      const subject = subjects.find((s) => s._id === exportSubjectId);
      const subjectLabel = subject?.code || subject?.name || "quiz";
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `${subjectLabel}-${timestamp}.xml`;

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showNotification("Exported quiz successfully", "success");
      setShowExportModal(false);
      setExportSubjectId("");
    } catch (error) {
      console.error("Export quiz failed:", error);
      showNotification("Failed to export quiz", "error");
    } finally {
      setExporting(false);
    }
  };

  const pageBg = darkMode ? "#111827" : "#f8fafc";
  const cardBg = darkMode ? "rgba(30, 41, 59, 0.85)" : "#ffffff";
  const cardBorder = darkMode ? "1px solid rgba(148, 163, 184, 0.2)" : "1px solid rgba(148, 163, 184, 0.2)";
  const labelColor = darkMode ? "#cbd5f5" : "#475569";
  const inputBg = darkMode ? "rgba(15, 23, 42, 0.8)" : "#ffffff";
  const inputBorder = darkMode ? "rgba(100, 116, 139, 0.4)" : "#cbd5f5";
  const textColor = darkMode ? "#e2e8f0" : "#1e293b";

  return (
    <div
      className="flex h-screen overflow-hidden relative"
      style={{ backgroundColor: pageBg, color: textColor }}
    >
      <Navbar />
      <Sidebar role={(user?.role as "admin" | "teacher" | "student") || "teacher"} />

      <div className="flex flex-col flex-1 w-0 overflow-hidden">
        <main className="flex-1 relative overflow-y-auto focus:outline-none p-4 mt-16 sm:pl-24 md:pl-28">
          <div className="max-w-7xl mx-auto px-4 space-y-8">
            <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold">Quiz Management</h1>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setShowImportModal(true)}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-semibold shadow-md transition-transform hover:-translate-y-0.5"
                  style={{
                    backgroundColor: darkMode ? "rgba(16,185,129,0.2)" : "rgba(16,185,129,0.15)",
                    color: darkMode ? "#5eead4" : "#047857",
                  }}
                >
                  <Upload className="w-5 h-5" />
                  Import Question
                </button>
                <button
                  onClick={() => setShowExportModal(true)}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-semibold shadow-md transition-transform hover:-translate-y-0.5"
                  style={{ backgroundColor: darkMode ? "rgba(59,130,246,0.25)" : "#1d4ed8", color: "#e0f2fe" }}
                >
                  <Download className="w-5 h-5" />
                  Export Question
                </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-semibold shadow-md transition-transform hover:-translate-y-0.5"
                style={{ backgroundColor: "#4f46e5", color: "#ffffff" }}
              >
                <PlusCircle className="w-5 h-5" />
                Create Question
              </button>
              </div>
            </header>

            {/* Subjects list */}
            <section className="grid gap-6 lg:grid-cols-1">
              <div
                className="rounded-2xl shadow-md p-6 space-y-4"
                style={{ backgroundColor: cardBg, border: cardBorder }}
              >
                <h2 className="text-xl font-semibold">Subjects</h2>
                {subjects.length === 0 ? (
                  <p className="text-sm" style={{ color: labelColor }}>
                    Không có môn học nào hoặc chưa tải được.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {subjects.map((subject) => {
                      const questionCount = questionCounts[subject._id] ?? null;
                      return (
                        <div
                          key={subject._id}
                          onClick={() => handlePickSubject(subject._id)}
                          className="cursor-pointer rounded-2xl px-6 py-5 transition-all"
                          style={{
                            backgroundColor: darkMode ? "rgba(15,23,42,0.6)" : "#ffffff",
                            border: `1px solid ${darkMode ? "rgba(148,163,184,0.2)" : "rgba(148,163,184,0.2)"}`,
                          }}
                        >
                          <h3
                            className="text-xl font-semibold mb-2"
                            style={{ color: textColor }}
                          >
                            {subject.code} - {subject.name}
                          </h3>
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="w-4 h-4" style={{ color: darkMode ? "#a5b4fc" : "#6366f1" }} />
                            <span
                              className="text-sm"
                              style={{ color: darkMode ? "#a5b4fc" : "#6366f1" }}
                            >
                              {questionCount === null
                                ? "Loading..."
                                : questionCount === 1
                                ? "1 question"
                                : `${questionCount} questions`}
                            </span>
                          </div>
                          <span
                            className="text-sm"
                            style={{ color: darkMode ? "#a5b4fc" : "#6366f1" }}
                          >
                            Click to view available exams
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
                {subjectsPagination && subjectsPagination.totalPages > 1 && (
                  <QuizPagination
                    currentPage={subjectsPagination.currentPage}
                    totalPages={subjectsPagination.totalPages}
                    textColor={textColor}
                    borderColor={darkMode ? "rgba(148,163,184,0.2)" : "rgba(148,163,184,0.2)"}
                    hasPrev={subjectsPagination.hasPrev}
                    hasNext={subjectsPagination.hasNext}
                    pageOptions={Array.from({ length: Math.min(5, subjectsPagination.totalPages) }, (_, i) => {
                      const start = Math.max(1, subjectsPagination.currentPage - 2);
                      return Math.min(start + i, subjectsPagination.totalPages);
                    }).filter((v, i, arr) => arr.indexOf(v) === i)}
                    onPrev={() => setSubjectsPage((p) => Math.max(1, p - 1))}
                    onNext={() => setSubjectsPage((p) => Math.min(subjectsPagination!.totalPages, p + 1))}
                    onSelectPage={(page) => setSubjectsPage(page)}
                  />
                )}
              </div>

            </section>

            {showCreateModal && (
              <div className="fixed inset-0 z-[120] flex items-center justify-center px-4">
                <div
                  className="absolute inset-0 bg-black/50"
                  onClick={handleCloseModal}
                />
                <div
                  className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl mx-auto"
                  style={{ backgroundColor: cardBg, border: cardBorder }}
                >
                  <div
                    className="sticky top-0 flex items-center justify-between px-6 py-4 z-10"
                    style={{ backgroundColor: cardBg, borderBottom: darkMode ? "1px solid rgba(148,163,184,0.2)" : "1px solid #e2e8f0" }}
                  >
                    <h2 className="text-2xl font-bold">Create New Question</h2>
                    <button
                      onClick={handleCloseModal}
                      className="px-3 py-1 rounded-lg text-sm font-semibold transition-colors"
                      style={{
                        backgroundColor: darkMode ? "rgba(148,163,184,0.15)" : "#e2e8f0",
                        color: textColor,
                      }}
                    >
                      Cancel
                    </button>
                  </div>

                  {/* Progress Indicator */}
                  <div className="px-6 py-4 flex items-center gap-4" style={{ borderBottom: darkMode ? "1px solid rgba(148,163,184,0.2)" : "1px solid #e2e8f0" }}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-white"
                        style={{ backgroundColor: currentStep >= 1 ? "#6366f1" : "#94a3b8" }}
                      >
                        1
                      </div>
                      <span className="text-sm font-medium" style={{ color: currentStep >= 1 ? textColor : labelColor }}>
                      Question Details
                      </span>
                    </div>
                    <div className="flex-1 h-0.5" style={{ backgroundColor: currentStep >= 2 ? "#6366f1" : "#e2e8f0" }} />
                    <div className="flex items-center gap-2">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-white"
                        style={{ backgroundColor: currentStep >= 2 ? "#6366f1" : "#94a3b8" }}
                      >
                        2
                      </div>
                      <span className="text-sm font-medium" style={{ color: currentStep >= 2 ? textColor : labelColor }}>
                        Add Questions
                      </span>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} noValidate className="p-6 space-y-6">
                    {currentStep === 1 && (
                      <div className="space-y-6">
                        <h3 className="text-lg font-semibold">Quiz Details</h3>
                        
                        {/* Subject Selection */}
                        <div>
                          <label className="block text-sm font-semibold mb-2" style={{ color: labelColor }}>
                            Subject <span className="text-red-500">*</span>
                          </label>
                          <div className="grid grid-cols-1 gap-3 max-h-48 overflow-y-auto">
                            {subjects.map((subject) => {
                              const isSelected = selectedSubject?._id === subject._id;
                              const questionCount = questionCounts[subject._id] ?? null;
                              return (
                                <div
                                  key={subject._id}
                                  onClick={() => handleSelectSubject(subject)}
                                  className="cursor-pointer rounded-lg px-4 py-3 transition-all"
                                  style={{
                                    backgroundColor: isSelected
                                      ? darkMode
                                        ? "rgba(99,102,241,0.2)"
                                        : "rgba(99,102,241,0.1)"
                                      : darkMode
                                        ? "rgba(15,23,42,0.6)"
                                        : "#f8fafc",
                                    border: isSelected
                                      ? `2px solid #6366f1`
                                      : `1px solid ${inputBorder}`,
                                  }}
                                >
                                  <div className="font-semibold">{subject.code} - {subject.name}</div>
                                  <div className="flex items-center gap-2 mt-1">
                                    <FileText className="w-3 h-3" style={{ color: darkMode ? "#a5b4fc" : "#6366f1" }} />
                                    <span className="text-xs" style={{ color: labelColor }}>
                                      {questionCount === null
                                        ? "Loading..."
                                        : questionCount === 1
                                        ? "1 question"
                                        : `${questionCount} questions`}
                                    </span>
                                  </div>
                                  {subject.description && (
                                    <div className="text-xs mt-1" style={{ color: labelColor }}>
                                      {subject.description}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Quiz Title */}
                        <div>
                          <label className="block text-sm font-semibold mb-2" style={{ color: labelColor }}>
                          Question Title <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={quizDetails.title}
                            onChange={(e) => setQuizDetails({ ...quizDetails, title: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg"
                            style={{ backgroundColor: inputBg, border: `1px solid ${inputBorder}`, color: textColor }}
                            placeholder="Enter Question title"
                          />
                        </div>

                        {/* Description */}
                        <div>
                          <label className="block text-sm font-semibold mb-2" style={{ color: labelColor }}>
                            Description
                          </label>
                          <textarea
                            value={quizDetails.description}
                            onChange={(e) => setQuizDetails({ ...quizDetails, description: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg resize-none"
                            style={{ backgroundColor: inputBg, border: `1px solid ${inputBorder}`, color: textColor }}
                            rows={3}
                            placeholder="Enter Question description"
                          />
                        </div>

                        {/* Selected Subject (read-only) */}
                        {selectedSubject && (
                          <div>
                            <label className="block text-sm font-semibold mb-2" style={{ color: labelColor }}>
                              Selected Subject <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              disabled
                              value={`${selectedSubject.code} - ${selectedSubject.name}`}
                              className="w-full px-4 py-2 rounded-lg"
                              style={{
                                backgroundColor: darkMode ? "rgba(15,23,42,0.4)" : "#f1f5f9",
                                border: `1px solid ${inputBorder}`,
                                color: labelColor,
                                cursor: "not-allowed",
                              }}
                            />
                          </div>
                        )}

                        {/* Exam Code */}
                        <div>
                          <label className="block text-sm font-semibold mb-2" style={{ color: labelColor }}>
                            Exam Code <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={quizDetails.examCode}
                            onChange={(e) => setQuizDetails({ ...quizDetails, examCode: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg"
                            style={{ backgroundColor: inputBg, border: `1px solid ${inputBorder}`, color: textColor }}
                            placeholder="MAE101-20251112-1633"
                          />
                          <p className="text-xs mt-1" style={{ color: labelColor }}>
                            Default format: Subject-YYYYMMDD-HHMM (e.g. CSD201-20230515-1430)
                          </p>
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                          <button
                            type="button"
                            onClick={handleCloseModal}
                            className="px-4 py-2 rounded-lg font-semibold"
                            style={{
                              backgroundColor: darkMode ? "rgba(148,163,184,0.15)" : "#e2e8f0",
                              color: textColor,
                            }}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleNextStep}
                            className="px-4 py-2 rounded-lg font-semibold text-white"
                            style={{ backgroundColor: "#6366f1" }}
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}

                    {currentStep === 2 && (
                      <div className="space-y-6">
                        <h3 className="text-lg font-semibold">Add Questions</h3>
                        
                        {questions.map((question, qIndex) => (
                          <div
                            key={qIndex}
                            className="rounded-lg p-4 space-y-4"
                            style={{ backgroundColor: darkMode ? "rgba(15,23,42,0.6)" : "#f8fafc", border: cardBorder }}
                          >
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold">Question {qIndex + 1}</h4>
                              {questions.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveQuestion(qIndex)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <X className="w-5 h-5" />
                                </button>
                              )}
                            </div>

                            {/* Question Text */}
                            <div>
                              <label className="block text-sm font-semibold mb-2" style={{ color: labelColor }}>
                                Question Text <span className="text-red-500">*</span>
                              </label>
                              <textarea
                                required
                                value={question.text || ""}
                                onChange={(e) => handleUpdateQuestion(qIndex, "text", e.target.value)}
                                className="w-full px-4 py-2 rounded-lg resize-y"
                                style={{ backgroundColor: inputBg, border: `1px solid ${inputBorder}`, color: textColor }}
                                rows={3}
                                placeholder="Enter question text"
                                disabled={isSubmitting}
                              />
                            </div>

                            {/* Options */}
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <label className="text-sm font-semibold" style={{ color: labelColor }}>
                                  Options
                                </label>
                                <button
                                  type="button"
                                  onClick={() => handleAddOptionToQuestion(qIndex)}
                                  className="text-sm font-semibold px-3 py-1 rounded-lg"
                                  style={{
                                    backgroundColor: darkMode ? "rgba(99,102,241,0.15)" : "rgba(99,102,241,0.1)",
                                    color: "#6366f1",
                                  }}
                                >
                                  + Add option
                                </button>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {question.options.map((option, optIndex) => (
                                <div key={optIndex}>
                                  <label className="block text-sm font-semibold mb-2" style={{ color: labelColor }}>
                                    Option {String.fromCharCode(65 + optIndex)} <span className="text-red-500">*</span>
                                  </label>
                                    <div className="flex gap-2 items-center">
                                    <input
                                      type="text"
                                      required
                                      value={option}
                                      onChange={(e) => handleUpdateOption(qIndex, optIndex, e.target.value)}
                                      className="flex-1 px-4 py-2 rounded-lg"
                                      style={{ backgroundColor: inputBg, border: `1px solid ${inputBorder}`, color: textColor }}
                                      placeholder={`Option ${String.fromCharCode(65 + optIndex)}`}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateCorrectOption(qIndex, optIndex)}
                                      className="px-3 py-2 rounded-lg font-semibold text-sm"
                                      style={{
                                        backgroundColor: question.correctOptions[optIndex] === 1 ? "#10b981" : inputBg,
                                        color: question.correctOptions[optIndex] === 1 ? "#fff" : textColor,
                                        border: `1px solid ${inputBorder}`,
                                      }}
                                    >
                                      {question.correctOptions[optIndex] === 1 ? "✓" : "○"}
                                    </button>
                                      {question.options.length > 2 && (
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveOptionFromQuestion(qIndex, optIndex)}
                                          className="text-sm text-red-500 hover:text-red-600"
                                        >
                                          Remove
                                        </button>
                                      )}
                                  </div>
                                </div>
                              ))}
                              </div>
                            </div>

                            {/* Removed Difficulty and Category */}

                            {/* Removed Explanation */}

                            {/* Image Upload (multiple) */}
                            <div>
                              <label className="block text-sm font-semibold mb-2" style={{ color: labelColor }}>
                                Question Images
                              </label>
                              <input
                                ref={(el) => {
                                  fileInputRefs.current[qIndex] = el;
                                }}
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={(e) => {
                                  handleQuestionImageChange(qIndex, e.target.files, question.imagePreviews.length > 0);
                                  // Reset input để có thể chọn lại file giống nhau
                                  if (e.target) {
                                    e.target.value = '';
                                  }
                                }}
                                className="block w-full text-sm file:mr-3 file:px-3 file:py-2 file:rounded-lg file:border file:border-gray-300 file:bg-transparent"
                              />
                              {question.imagePreviews.length > 0 && (
                                <>
                                  <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {question.imagePreviews.map((src, imgIdx) => (
                                      <div key={imgIdx} className="relative">
                                        <img
                                          src={src}
                                          alt={`Question ${qIndex + 1} image ${imgIdx + 1}`}
                                          className="w-full max-h-40 object-contain rounded-lg border"
                                          style={{ borderColor: inputBorder, backgroundColor: darkMode ? 'rgba(15,23,42,0.4)' : '#fff' }}
                                        />
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveImageAt(qIndex, imgIdx)}
                                          className="absolute top-2 right-2 px-2 py-1 rounded-md text-xs font-semibold"
                                          style={{ backgroundColor: darkMode ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.15)', color: '#ef4444' }}
                                        >
                                          Remove
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => fileInputRefs.current[qIndex]?.click()}
                                    className="mt-3 px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors"
                                    style={{
                                      backgroundColor: darkMode ? "rgba(99,102,241,0.2)" : "rgba(99,102,241,0.1)",
                                      color: "#6366f1",
                                      border: `2px dashed #6366f1`,
                                    }}
                                  >
                                    <ImagePlus className="w-4 h-4" />
                                    Chọn thêm ảnh
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        ))}

                        {/* Add Next Question Button */}
                        <button
                          type="button"
                          onClick={handleAddQuestion}
                          className="w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
                          style={{
                            backgroundColor: darkMode ? "rgba(99,102,241,0.2)" : "rgba(99,102,241,0.1)",
                            color: "#6366f1",
                            border: `2px dashed #6366f1`,
                          }}
                        >
                          <PlusCircle className="w-5 h-5" />
                          Add Next Question
                        </button>

                        <div className="flex justify-end gap-3 pt-4">
                          <button
                            type="button"
                            onClick={handlePrevStep}
                            className="px-4 py-2 rounded-lg font-semibold"
                            style={{
                              backgroundColor: darkMode ? "rgba(148,163,184,0.15)" : "#e2e8f0",
                              color: textColor,
                            }}
                          >
                            Back
                          </button>
                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-4 py-2 rounded-lg font-semibold text-white disabled:opacity-50"
                            style={{ backgroundColor: "#6366f1" }}
                          >
                            {isSubmitting ? "Creating..." : "Create Question"}
                          </button>
                        </div>
                      </div>
                    )}
                  </form>
                </div>
              </div>
            )}

            {showImportModal && (
              <div className="fixed inset-0 z-[130] flex items-center justify-center px-4">
                <div className="absolute inset-0 bg-black/60" onClick={() => !importing && setShowImportModal(false)} />
                <div
                  className="relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
                  style={{ backgroundColor: cardBg, border: cardBorder }}
                >
                  <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: cardBorder }}>
                    <h3 className="text-xl font-semibold">Import Questions</h3>
                    <span />
                  </div>
                  <div className="p-6 space-y-5">
                    <div>
                      <label className="block text-sm font-semibold mb-2" style={{ color: labelColor }}>
                        Subject <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={importSubjectId}
                        onChange={(e) => setImportSubjectId(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border"
                        style={{ backgroundColor: inputBg, borderColor: inputBorder, color: textColor }}
                        disabled={importing}
                      >
                        <option value="">Select subject</option>
                        {subjects.map((subject) => (
                          <option key={subject._id} value={subject._id}>
                            {subject.code || subject.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2" style={{ color: labelColor }}>
                        XML file <span className="text-red-500">*</span>
                      </label>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => importFileInputRef.current?.click()}
                          className="px-4 py-2 rounded-lg font-semibold text-sm"
                          style={{
                            backgroundColor: darkMode ? "rgba(99,102,241,0.2)" : "rgba(99,102,241,0.1)",
                            color: "#6366f1",
                          }}
                          disabled={importing}
                        >
                          Choose XML file
                        </button>
                        <span className="text-xs md:text-sm truncate" style={{ color: labelColor }}>
                          {importFile ? importFile.name : "No file selected"}
                        </span>
                      </div>
                      <input
                        ref={importFileInputRef}
                        type="file"
                        accept=".xml,application/xml,text/xml"
                        onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                        className="hidden"
                        disabled={importing}
                      />
                      <p className="text-xs mt-1" style={{ color: labelColor }}>
                        Upload a Moodle-compatible XML file exported from another question.
                      </p>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowImportModal(false)}
                        className="px-4 py-2 rounded-lg font-semibold"
                        style={{
                          backgroundColor: darkMode ? "rgba(148,163,184,0.15)" : "#e2e8f0",
                          color: textColor,
                        }}
                        disabled={importing}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleImportQuiz}
                        className="px-4 py-2 rounded-lg font-semibold text-white disabled:opacity-60"
                        style={{ backgroundColor: "#0ea5e9" }}
                        disabled={importing}
                      >
                        {importing ? "Importing..." : "Import"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {showExportModal && (
              <div className="fixed inset-0 z-[130] flex items-center justify-center px-4">
                <div className="absolute inset-0 bg-black/60" onClick={closeExportModal} />
                <div
                  className="relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
                  style={{ backgroundColor: cardBg, border: cardBorder }}
                >
                  <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: cardBorder }}>
                    <h3 className="text-xl font-semibold">Export Questions</h3>
                    <span />
                  </div>
                  <div className="p-6 space-y-5">
                    <div>
                      <label className="block text-sm font-semibold mb-2" style={{ color: labelColor }}>
                        Subject <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={exportSubjectId}
                        onChange={(e) => setExportSubjectId(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border"
                        style={{ backgroundColor: inputBg, borderColor: inputBorder, color: textColor }}
                        disabled={exporting}
                      >
                        <option value="">Select subject</option>
                        {subjects.map((subject) => (
                          <option key={subject._id} value={subject._id}>
                            {subject.code ? `${subject.code} · ` : ""}
                            {subject.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <p className="text-sm" style={{ color: labelColor }}>
                      Choose a subject to download its questions as an XML file.
                    </p>
                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={closeExportModal}
                        className="px-4 py-2 rounded-lg font-semibold"
                        style={{
                          backgroundColor: darkMode ? "rgba(148,163,184,0.15)" : "#e2e8f0",
                          color: textColor,
                        }}
                        disabled={exporting}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleExportQuiz}
                        className="px-4 py-2 rounded-lg font-semibold text-white disabled:opacity-60"
                        style={{ backgroundColor: "#1d4ed8" }}
                        disabled={exporting || !exportSubjectId}
                      >
                        {exporting ? "Exporting..." : "Export"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Success Notification */}
      {showSuccessNotification && (
        <div
          className="fixed top-20 right-4 z-[150] animate-slide-in-right"
          style={{
            animation: "slideInRight 0.3s ease-out",
          }}
        >
          <div
            className="flex items-center gap-3 px-6 py-4 rounded-xl shadow-lg min-w-[320px]"
            style={{
              backgroundColor: darkMode ? "rgba(16,185,129,0.95)" : "#10b981",
              color: "#ffffff",
            }}
          >
            <CheckCircle className="w-6 h-6 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-semibold">Completed!</p>
              <p className="text-sm opacity-90">Created questions successfully.</p>
            </div>
            <button
              onClick={() => setShowSuccessNotification(false)}
              className="ml-2 p-1 rounded-full hover:bg-white/20 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Notifications */}
      <div className="fixed top-20 right-4 z-[200] space-y-2">
        {notifications.map((notification) => {
          const getNotificationStyles = () => {
            switch (notification.type) {
              case "error":
                return {
                  backgroundColor: darkMode ? "rgba(239,68,68,0.95)" : "#ef4444",
                  color: "#ffffff",
                };
              case "warning":
                return {
                  backgroundColor: darkMode ? "rgba(245,158,11,0.95)" : "#f59e0b",
                  color: "#ffffff",
                };
              case "success":
                return {
                  backgroundColor: darkMode ? "rgba(16,185,129,0.95)" : "#10b981",
                  color: "#ffffff",
                };
              case "info":
                return {
                  backgroundColor: darkMode ? "rgba(59,130,246,0.95)" : "#3b82f6",
                  color: "#ffffff",
                };
              default:
                return {
                  backgroundColor: darkMode ? "rgba(100,116,139,0.95)" : "#64748b",
                  color: "#ffffff",
                };
            }
          };

          const getIcon = () => {
            switch (notification.type) {
              case "error":
                return <AlertCircle className="w-5 h-5 flex-shrink-0" />;
              case "warning":
                return <AlertCircle className="w-5 h-5 flex-shrink-0" />;
              case "success":
                return <CheckCircle className="w-5 h-5 flex-shrink-0" />;
              case "info":
                return <Info className="w-5 h-5 flex-shrink-0" />;
              default:
                return <Info className="w-5 h-5 flex-shrink-0" />;
            }
          };

          return (
            <div
              key={notification.id}
              className="flex items-start gap-3 px-4 py-3 rounded-lg shadow-lg min-w-[320px] max-w-[400px] animate-slide-in-right"
              style={{
                ...getNotificationStyles(),
                animation: "slideInRight 0.3s ease-out",
              }}
            >
              {getIcon()}
              <div className="flex-1">
                <p className="text-sm font-medium break-words">{notification.message}</p>
              </div>
              <button
                onClick={() => removeNotification(notification.id)}
                className="ml-2 p-1 rounded-full hover:bg-white/20 transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

