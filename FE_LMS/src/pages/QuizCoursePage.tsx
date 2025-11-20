import { useState, useEffect, useRef, type ChangeEvent } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "../hooks/useTheme";
import { useAuth } from "../hooks/useAuth";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { ChevronLeft, ChevronRight, Trash2, Edit3, ArrowLeft } from "lucide-react";
import {
  quizQuestionService,
  subjectService,
  type QuizQuestion,
  type QuizQuestionImage,
  type Subject,
} from "../services";

type EditFormState = {
  text: string;
  points: number;
  options: string[];
  correctFlags: boolean[];
  explanation: string;
  existingImages: QuizQuestionImage[];
  deletedImageUrls: string[];
  newImageFiles: File[];
  newImagePreviews: string[];
};

export default function QuizCoursePage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { darkMode } = useTheme();
  const { user } = useAuth();
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("Quiz Questions");
  const [subjectInfo, setSubjectInfo] = useState<Subject | null>(null);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [paginationInfo, setPaginationInfo] = useState({
    totalItems: 0,
    currentPage: 1,
    limit: 20,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });
  const [manualQuestions, setManualQuestions] = useState<QuizQuestion[] | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<QuizQuestion | null>(null);
  const [editForm, setEditForm] = useState<EditFormState | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const newImageInputRef = useRef<HTMLInputElement | null>(null);
  // Track current image index for each question
  const [currentImageIndices, setCurrentImageIndices] = useState<Record<string, number>>({});
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const resolvedRole = (user?.role as "admin" | "teacher" | "student") || "teacher";

  const apiBase = import.meta.env.VITE_BASE_API || "";
  const handleToggleSidebar = () => {
    setMobileSidebarOpen((prev) => !prev);
  };
  const handleCloseSidebar = () => {
    setMobileSidebarOpen(false);
  };

  // Resolve image source from various possible fields
  const resolveImageSrc = (q: QuizQuestion): string[] => {
    const obj = q as unknown as Record<string, unknown>;
    const images: string[] = [];

    // Check for images array
    if (Array.isArray(obj["images"])) {
      const imageArray = obj["images"] as unknown[];
      imageArray.forEach((img) => {
        if (typeof img === "string") {
          images.push(img);
        } else if (typeof img === "object" && img !== null) {
          const imgObj = img as Record<string, unknown>;
          const url = imgObj["url"] || imgObj["publicUrl"] || imgObj["imageUrl"];
          if (typeof url === "string") {
            images.push(url);
          }
        }
      });
    }

    // Check for single image field
    const singleImage = obj["image"] || obj["imageUrl"] || obj["fileUrl"];
    if (typeof singleImage === "string" && !images.includes(singleImage)) {
      images.push(singleImage);
    }

    // Check for file object
    const fileObj = obj["file"] as Record<string, unknown> | undefined;
    if (fileObj) {
      const fileUrl = fileObj["url"] || fileObj["publicUrl"];
      if (typeof fileUrl === "string" && !images.includes(fileUrl)) {
        images.push(fileUrl);
      }
    }

    // Normalize URLs - add base URL if relative
    return images.map((img) => {
      if (!img) return "";
      return img.startsWith("http") ? img : (apiBase ? `${apiBase}/${img.replace(/^\/+/, "")}` : img);
    }).filter(Boolean);
  };

  type LocationState = {
    mergedQuestions?: QuizQuestion[];
    subjectInfo?: Subject;
  } | null;

  const locationState = location.state as LocationState;

  useEffect(() => {
    if (locationState?.mergedQuestions && locationState.mergedQuestions.length > 0) {
      setManualQuestions(locationState.mergedQuestions);
    } else {
      setManualQuestions(null);
    }
  }, [locationState?.mergedQuestions]);

  useEffect(() => {
    if (!courseId) return;
    let cancelled = false;

    const fetchSubject = async () => {
      try {
        const subject = await subjectService.getSubjectById(courseId);
        if (!cancelled) {
          setSubjectInfo(subject);
        }
      } catch (error) {
        console.error("QuizCoursePage: Failed to fetch subject info:", error);
        if (!cancelled) {
          setSubjectInfo(null);
        }
      }
    };

    if (locationState?.subjectInfo && locationState.subjectInfo._id === courseId) {
      setSubjectInfo(locationState.subjectInfo);
    } else {
      fetchSubject();
    }

    return () => {
      cancelled = true;
    };
  }, [courseId, locationState?.subjectInfo]);

  useEffect(() => {
    const subjectLabel = subjectInfo
      ? `${subjectInfo.code ? `${subjectInfo.code} · ` : ""}${subjectInfo.name}`
      : "Quiz Questions";
    const countLabel = totalQuestions > 0 ? ` (${totalQuestions} questions)` : "";
    setTitle(`${subjectLabel}${countLabel}`);
  }, [subjectInfo, totalQuestions]);

  useEffect(() => {
    if (!courseId) return;
    let mounted = true;

    const fetchQuestions = async () => {
      try {
        setLoading(true);

        if (manualQuestions && manualQuestions.length > 0) {
          const totalItems = manualQuestions.length;
          const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
          const safePage = Math.min(Math.max(1, currentPage), totalPages);
          if (safePage !== currentPage) {
            setCurrentPage(safePage);
            return;
          }
          const startIndex = (safePage - 1) * pageSize;
          const sliced = manualQuestions.slice(startIndex, startIndex + pageSize);

          if (mounted) {
            setQuizQuestions(sliced);
            setPaginationInfo({
              totalItems,
              currentPage: safePage,
              limit: pageSize,
              totalPages,
              hasNext: safePage < totalPages,
              hasPrev: safePage > 1,
            });
            setTotalQuestions(totalItems);
          }
          return;
        }

        const result = await quizQuestionService.getAllQuizQuestions({
          subjectId: courseId,
          page: currentPage,
          limit: pageSize,
          option: "subjectId",
        });

        const pagination = result.pagination || {
          totalItems: result.data?.length || 0,
          currentPage,
          limit: pageSize,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        };

        if (pagination.totalPages > 0 && currentPage > pagination.totalPages) {
          setCurrentPage(Math.max(1, pagination.totalPages));
          return;
        }

        if (mounted) {
          setQuizQuestions(result.data || []);
          setPaginationInfo({
            totalItems: pagination.totalItems ?? (result.data?.length || 0),
            currentPage: pagination.currentPage ?? currentPage,
            limit: pagination.limit ?? pageSize,
            totalPages: pagination.totalPages ?? 1,
            hasNext: pagination.hasNext ?? false,
            hasPrev: pagination.hasPrev ?? false,
          });
          setTotalQuestions(pagination.totalItems ?? (result.data?.length || 0));
        }
      } catch (error) {
        console.error("QuizCoursePage: Error fetching quiz questions:", error);
        if (mounted) {
          setQuizQuestions([]);
          setPaginationInfo({
            totalItems: 0,
            currentPage: 1,
            limit: pageSize,
            totalPages: 1,
            hasNext: false,
            hasPrev: false,
          });
          setTotalQuestions(0);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchQuestions();

    return () => {
      mounted = false;
    };
  }, [courseId, manualQuestions, currentPage, pageSize, refreshKey]);

  useEffect(() => {
    if (!subjectInfo) return;

    const applySubject = (question: QuizQuestion): QuizQuestion => {
      if (typeof question.subjectId === "string" || !question.subjectId) {
        return {
          ...question,
          subjectId: {
            _id: subjectInfo._id,
            code: subjectInfo.code,
            name: subjectInfo.name,
          },
        };
      }
      return question;
    };

    setQuizQuestions((prev) => prev.map(applySubject));
    setManualQuestions((prev) => (prev ? prev.map(applySubject) : prev));
  }, [subjectInfo]);

  useEffect(() => {
    setCurrentPage(1);
  }, [courseId]);

  useEffect(() => {
    setCurrentPage(1);
  }, [pageSize]);

  useEffect(() => {
    if (manualQuestions) {
      setCurrentPage(1);
    }
  }, [manualQuestions]);

  const getSwalBaseOptions = () => ({
    width: 360,
    background: darkMode ? "rgba(15,23,42,0.95)" : "#ffffff",
    color: darkMode ? "#e2e8f0" : "#1f2937",
    confirmButtonColor: "#6366f1",
  });

  const showSwalConfirm = async (message: string): Promise<boolean> => {
    const Swal = (await import("sweetalert2")).default;
    const base = getSwalBaseOptions();
    const result = await Swal.fire({
      ...base,
      title: "Confirm",
      text: message,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: darkMode ? "#334155" : "#e2e8f0",
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
      reverseButtons: true,
      heightAuto: false,
    });
    return result.isConfirmed;
  };

  const showSwalError = async (message: string) => {
    const Swal = (await import("sweetalert2")).default;
    const base = getSwalBaseOptions();
    await Swal.fire({
      ...base,
      icon: "error",
      title: "Error",
      text: message,
      confirmButtonText: "Close",
      heightAuto: false,
    });
  };

  const showSwalSuccess = async (message: string) => {
    const Swal = (await import("sweetalert2")).default;
    const base = getSwalBaseOptions();
    await Swal.fire({
      ...base,
      icon: "success",
      title: "Success",
      text: message,
      timer: 1500,
      showConfirmButton: false,
      heightAuto: false,
    });
  };

  const handleDeleteQuestion = async (questionId: string) => {
    const confirmed = await showSwalConfirm("Delete this question?");
    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(questionId);
      const question = quizQuestions.find((q) => q._id === questionId);
      await quizQuestionService.deleteQuizQuestion(questionId, question);

      if (manualQuestions) {
        setManualQuestions((prev) => prev?.filter((q) => q._id !== questionId) || null);
      } else {
        setRefreshKey((prev) => prev + 1);
      }

      await showSwalSuccess("Question deleted.");
    } catch (error) {
      console.error("Error deleting question:", error);
      await showSwalError("Failed to delete question. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const pageSizeOptions = [20, 50, 100];
  const pageOptions = Array.from(
    { length: Math.max(1, paginationInfo.totalPages) },
    (_, index) => index + 1
  );

  const goToPage = (page: number) => {
    const total = Math.max(1, paginationInfo.totalPages);
    const nextPage = Math.min(Math.max(1, page), total);
    setCurrentPage(nextPage);
  };

  const handlePageChange = (direction: "prev" | "next") => {
    if (direction === "prev" && paginationInfo.hasPrev) {
      goToPage(currentPage - 1);
    }
    if (direction === "next" && paginationInfo.hasNext) {
      goToPage(currentPage + 1);
    }
  };

  const handlePageSizeChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = Number(event.target.value);
    if (!Number.isNaN(value)) {
      setPageSize(value);
    }
  };

  const determineCorrectFlags = (question: QuizQuestion, options: string[]) => {
    const correctOptions = question.correctOptions || [];
    const isBinary =
      correctOptions.length === options.length && correctOptions.every((val) => val === 0 || val === 1);

    if (isBinary) {
      return correctOptions.map((val) => val === 1);
    }

    return options.map((_, idx) => correctOptions.includes(idx));
  };

  const normalizeQuestionImages = (question: QuizQuestion): QuizQuestionImage[] => {
    if (!question.images || !Array.isArray(question.images)) return [];
    const normalized: QuizQuestionImage[] = [];
    question.images.forEach((img) => {
      if (!img) return;
      if (typeof img === "string") {
        normalized.push({ url: img, fromDB: true });
        return;
      }
      if (typeof img === "object" && img !== null) {
        const candidate = img as Partial<QuizQuestionImage>;
        if (typeof candidate.url === "string") {
          normalized.push({ url: candidate.url, fromDB: candidate.fromDB });
        }
      }
    });
    return normalized;
  };

  const handleOpenEditQuestion = (question: QuizQuestion) => {
    const existingOptions = question.options && question.options.length > 0 ? [...question.options] : ["", ""];
    const flags = determineCorrectFlags(question, existingOptions);

    setEditForm({
      text: question.text,
      points: question.points || 1,
      options: existingOptions,
      correctFlags: flags.length === existingOptions.length ? flags : new Array(existingOptions.length).fill(false),
      explanation: question.explanation || "",
      existingImages: normalizeQuestionImages(question),
      deletedImageUrls: [],
      newImageFiles: [],
      newImagePreviews: [],
    });
    setEditingQuestion(question);
  };

  const handleCloseEdit = () => {
    if (savingEdit) return;
    setEditingQuestion(null);
    setEditForm(null);
  };

  const handleEditInputChange = (field: keyof EditFormState, value: string | number) => {
    if (!editForm) return;
    setEditForm({
      ...editForm,
      [field]: field === "points" ? Number(value) : value,
    });
  };

  const handleOptionChange = (index: number, value: string) => {
    if (!editForm) return;
    const updatedOptions = [...editForm.options];
    updatedOptions[index] = value;
    setEditForm({
      ...editForm,
      options: updatedOptions,
    });
  };

  const handleToggleCorrect = (index: number) => {
    if (!editForm) return;
    const updatedFlags = [...editForm.correctFlags];
    updatedFlags[index] = !updatedFlags[index];
    setEditForm({
      ...editForm,
      correctFlags: updatedFlags,
    });
  };

  const handleAddOption = () => {
    if (!editForm) return;
    setEditForm({
      ...editForm,
      options: [...editForm.options, ""],
      correctFlags: [...editForm.correctFlags, false],
    });
  };

  const handleToggleExistingImage = (url: string) => {
    if (!editForm) return;
    const isMarked = editForm.deletedImageUrls.includes(url);
    setEditForm({
      ...editForm,
      deletedImageUrls: isMarked
        ? editForm.deletedImageUrls.filter((item) => item !== url)
        : [...editForm.deletedImageUrls, url],
    });
  };

  const handleSelectNewImages = (event: ChangeEvent<HTMLInputElement>) => {
    if (!editForm) return;
    const files = event.target.files ? Array.from(event.target.files) : [];
    if (files.length === 0) return;

    const readers = files.map(
      (file) =>
        new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(typeof reader.result === "string" ? reader.result : "");
          reader.readAsDataURL(file);
        })
    );

    Promise.all(readers).then((previews) => {
      setEditForm((prev) =>
        prev
          ? {
              ...prev,
              newImageFiles: [...prev.newImageFiles, ...files],
              newImagePreviews: [...prev.newImagePreviews, ...previews.filter(Boolean)],
            }
          : prev
      );
    });

    if (event.target) {
      event.target.value = "";
    }
  };

  const handleRemoveNewImage = (index: number) => {
    if (!editForm) return;
    setEditForm({
      ...editForm,
      newImageFiles: editForm.newImageFiles.filter((_, idx) => idx !== index),
      newImagePreviews: editForm.newImagePreviews.filter((_, idx) => idx !== index),
    });
  };

  const handleRemoveOption = (index: number) => {
    if (!editForm || editForm.options.length <= 2) return;
    setEditForm({
      ...editForm,
      options: editForm.options.filter((_, idx) => idx !== index),
      correctFlags: editForm.correctFlags.filter((_, idx) => idx !== index),
    });
  };

  const handleSubmitEdit = async () => {
    if (!editingQuestion || !editForm) return;

    const trimmedText = editForm.text.trim();
    const cleanedOptions = editForm.options.map((opt) => opt.trim());
    const hasValidOptions = cleanedOptions.every((opt) => opt.length > 0);
    const hasCorrectAnswer = editForm.correctFlags.some(Boolean);

    if (!trimmedText) {
      await showSwalError("Vui lòng nhập nội dung câu hỏi.");
      return;
    }

    if (cleanedOptions.length < 2 || !hasValidOptions) {
      await showSwalError("Mỗi câu hỏi phải có ít nhất 2 lựa chọn hợp lệ.");
      return;
    }

    if (!hasCorrectAnswer) {
      await showSwalError("Please select at least one correct option.");
      return;
    }

    const selectedCorrectCount = editForm.correctFlags.filter(Boolean).length;
    const originalType = editingQuestion.type || "mcq";
    const canBecomeMulti = originalType === "mcq" || originalType === "multichoice";

    if (selectedCorrectCount > 1 && !canBecomeMulti) {
      await showSwalError("This question type allows only one correct option.");
      return;
    }

    let nextType = originalType;
    if (selectedCorrectCount > 1 && canBecomeMulti) {
      nextType = "multichoice";
    } else if (selectedCorrectCount <= 1 && originalType === "multichoice") {
      nextType = "mcq";
    }

    try {
      setSavingEdit(true);
      const subjectId =
        typeof editingQuestion.subjectId === "object" && editingQuestion.subjectId
          ? editingQuestion.subjectId._id
          : (editingQuestion.subjectId as string);

      const updatedQuestion = await quizQuestionService.updateQuizQuestion(editingQuestion._id, {
        subjectId,
        text: trimmedText,
        points: editForm.points,
        options: cleanedOptions,
        correctOptions: editForm.correctFlags.map((flag) => (flag ? 1 : 0)),
        type: nextType,
        explanation: editForm.explanation,
        deletedKeys: editForm.deletedImageUrls,
        newImages: editForm.newImageFiles,
      });

      setQuizQuestions((prev) =>
        prev.map((q) => (q._id === updatedQuestion._id ? { ...q, ...updatedQuestion } : q))
      );
      setManualQuestions((prev) =>
        prev ? prev.map((q) => (q._id === updatedQuestion._id ? { ...q, ...updatedQuestion } : q)) : prev
      );

      await showSwalSuccess("Question updated.");
      handleCloseEdit();
    } catch (error) {
      console.error("Error updating question:", error);
      await showSwalError("Failed to update question. Please try again.");
    } finally {
      setSavingEdit(false);
    }
  };

  const textColor = darkMode ? "#e2e8f0" : "#1e293b";
  const bgColor = darkMode ? "#0f172a" : "#f8fafc";
  const cardBg = darkMode ? "rgba(15,23,42,0.6)" : "#ffffff";
  const borderColor = darkMode ? "rgba(148,163,184,0.2)" : "rgba(148,163,184,0.2)";
  const startItem =
    totalQuestions === 0 ? 0 : (paginationInfo.currentPage - 1) * paginationInfo.limit + 1;
  const endItem =
    totalQuestions === 0 ? 0 : Math.min(totalQuestions, startItem + quizQuestions.length - 1);

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ backgroundColor: bgColor }}>
      <Navbar onToggleSidebar={handleToggleSidebar} />
      <Sidebar
        variant="mobile"
        role={resolvedRole}
        isOpen={mobileSidebarOpen}
        onClose={handleCloseSidebar}
      />
      <div className="flex relative w-full pt-32 md:pt-28 lg:pt-24">
        <Sidebar role={resolvedRole} />
        <div className="flex-1 w-full px-4 sm:px-6 py-6 md:ml-[50px] relative overflow-x-hidden">
          <div className="max-w-6xl mx-auto">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between md:ml-[50px]">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate(-1)}
                  className="inline-flex items-center justify-center rounded-xl shadow-lg transition-colors w-18 h-20 sm:w-12 sm:h-12 -ml-1 sm:-ml-3 md:-ml-6"
                  style={{
                    backgroundColor: darkMode ? "rgba(99,102,241,0.25)" : "#6366f1",
                    color: darkMode ? "#a5b4fc" : "#ffffff",
                  }}
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span className="sr-only">Back to subjects</span>
                </button>
                <h1 className="text-3xl font-bold" style={{ color: textColor }}>
                  {title}
                </h1>
              </div>
            </div>

            <div className="md:pl-12">
              {loading ? (
                <div className="text-center py-12">
                  <p style={{ color: textColor }}>Loading...</p>
                </div>
              ) : quizQuestions.length === 0 ? (
                <div className="text-center py-12">
                  <p style={{ color: textColor }}>No questions.</p>
                </div>
              ) : (
                <>
                  
                  
                  
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between mb-6">
                    <div className="space-y-1 text-left w-full md:flex-1">
                      <p className="text-sm font-medium" style={{ color: textColor }}>
                        Showing{" "}
                        <span className="font-semibold">
                          {startItem} - {endItem}
                        </span>{" "}
                        of{" "}
                        <span className="font-semibold">{totalQuestions}</span> questions
                      </p>
                      {subjectInfo && (
                        <p className="text-xs" style={{ color: darkMode ? "#94a3b8" : "#475569" }}>
                          Subject: {subjectInfo.code ? `${subjectInfo.code} · ` : ""}
                          {subjectInfo.name}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-3 w-full sm:flex-row sm:items-center sm:gap-4 sm:justify-end md:w-auto">
                      <div className="flex flex-col gap-1 w-full sm:w-44">
                        <label className="text-sm" style={{ color: textColor }}>
                          Rows per page
                        </label>
                        <select
                          value={pageSize}
                          onChange={handlePageSizeChange}
                          className="rounded-lg border px-3 py-1 bg-transparent w-full"
                          style={{ borderColor: borderColor, color: textColor }}
                        >
                          {pageSizeOptions.map((size) => (
                            <option key={size} value={size} className="bg-slate-900 text-white">
                              {size}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-center gap-1 self-start md:self-auto mt-[23px]">


                        <button
                          onClick={() => handlePageChange("prev")}
                          disabled={!paginationInfo.hasPrev}
                          className="p-2 rounded-lg border transition-colors"
                          style={{
                            borderColor: borderColor,
                            color: paginationInfo.hasPrev ? textColor : "#94a3b8",
                            opacity: paginationInfo.hasPrev ? 1 : 0.4,
                          }}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-sm" style={{ color: textColor }}>
                          Page {paginationInfo.currentPage} / {paginationInfo.totalPages}
                        </span>
                        <button
                          onClick={() => handlePageChange("next")}
                          disabled={!paginationInfo.hasNext}
                          className="p-2 rounded-lg border transition-colors"
                          style={{
                            borderColor: borderColor,
                            color: paginationInfo.hasNext ? textColor : "#94a3b8",
                            opacity: paginationInfo.hasNext ? 1 : 0.4,
                          }}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col w-full gap-6 overflow-x-hidden">
                    <div className="flex-1 space-y-6">
                {quizQuestions.map((question, index) => {
                  const images = resolveImageSrc(question);
                  return (
                    <div
                      key={question._id}
                      className="rounded-2xl w-full p-4 sm:p-6"
                      style={{
                        backgroundColor: cardBg,
                        border: `1px solid ${borderColor}`,
                      }}
                    >
                      <div className="mb-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-6 mb-2">
                          <h3
                            className="text-lg md:text-xl font-semibold break-words flex-1 leading-relaxed"
                            style={{ color: textColor }}
                          >
                            <span className="mr-2">Question {startItem + index}:</span>
                            <span dangerouslySetInnerHTML={{ __html: question.text }} />
                          </h3>
                          <div className="flex items-center gap-2 md:gap-3 md:ml-4 self-end md:self-auto md:flex-shrink-0">
                            <button
                              onClick={() => handleOpenEditQuestion(question)}
                              className="p-1.5 sm:p-2 rounded-lg transition-colors flex items-center justify-center"
                              style={{
                                backgroundColor: darkMode ? "rgba(59,130,246,0.2)" : "#e0f2fe",
                                color: darkMode ? "#93c5fd" : "#0369a1",
                              }}
                              title="Edit question"
                            >
                              <Edit3 className="w-4 h-4 md:w-5 md:h-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteQuestion(question._id)}
                              disabled={deletingId === question._id}
                              className="p-1.5 sm:p-2 rounded-lg transition-colors flex items-center justify-center"
                              style={{
                                backgroundColor: darkMode ? "rgba(239, 68, 68, 0.2)" : "#fee2e2",
                                color: darkMode ? "#fca5a5" : "#dc2626",
                                opacity: deletingId === question._id ? 0.5 : 1,
                                cursor: deletingId === question._id ? "not-allowed" : "pointer",
                              }}
                              title="Delete question"
                            >
                              <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                            </button>
                          </div>
                        </div>
                        {images.length > 0 && (() => {
                          const currentIndex = currentImageIndices[question._id] || 0;
                          const currentImage = images[currentIndex];
                          const hasNext = currentIndex < images.length - 1;
                          const hasPrev = currentIndex > 0;

                          const handleNext = () => {
                            if (hasNext) {
                              setCurrentImageIndices(prev => ({
                                ...prev,
                                [question._id]: currentIndex + 1
                              }));
                            }
                          };

                          const handlePrev = () => {
                            if (hasPrev) {
                              setCurrentImageIndices(prev => ({
                                ...prev,
                                [question._id]: currentIndex - 1
                              }));
                            }
                          };

                          return (
                            <div className="mt-4 relative">
                              <div className="relative flex items-center justify-center group">
                                {hasPrev && (
                                  <button
                                    onClick={handlePrev}
                                    className="absolute left-2 z-10 p-2 rounded-full shadow-lg transition-all hover:scale-110"
                                    style={{
                                      backgroundColor: darkMode ? "rgba(99,102,241,0.9)" : "#6366f1",
                                      color: "#ffffff",
                                    }}
                                  >
                                    <ChevronLeft className="w-5 h-5" />
                                  </button>
                                )}
                                <img
                                  src={currentImage}
                                  alt={`Question ${index + 1} image ${currentIndex + 1}`}
                                  className="max-w-full max-h-96 object-contain rounded-lg border transition-opacity"
                                  style={{ borderColor: borderColor }}
                                  onError={(e) => {
                                    console.error("Failed to load image:", currentImage);
                                    (e.target as HTMLImageElement).style.display = "none";
                                  }}
                                />
                                {hasNext && (
                                  <button
                                    onClick={handleNext}
                                    className="absolute right-2 z-10 p-2 rounded-full shadow-lg transition-all hover:scale-110"
                                    style={{
                                      backgroundColor: darkMode ? "rgba(99,102,241,0.9)" : "#6366f1",
                                      color: "#ffffff",
                                    }}
                                  >
                                    <ChevronRight className="w-5 h-5" />
                                  </button>
                                )}
                              </div>
                              {images.length > 1 && (
                                <div className="mt-2 text-center">
                                  <span className="text-sm px-3 py-1 rounded-full inline-block" style={{ 
                                    color: textColor,
                                    backgroundColor: darkMode ? "rgba(99,102,241,0.2)" : "rgba(99,102,241,0.1)"
                                  }}>
                                    {currentIndex + 1} / {images.length}
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>

                      {question.options && question.options.length > 0 && (
                        <div className="space-y-2">
                          <p className="font-semibold mb-2" style={{ color: textColor }}>
                            Options:
                          </p>
                          {question.options.map((option, optIndex) => {
                            const correctOptions = question.correctOptions || [];
                            const isBinaryCorrect =
                              correctOptions.length === question.options?.length &&
                              correctOptions.every((val) => val === 0 || val === 1);
                            const isCorrect = isBinaryCorrect
                              ? correctOptions[optIndex] === 1
                              : correctOptions.includes(optIndex);

                            return (
                              <div
                                key={optIndex}
                                className="p-3 rounded-lg break-words text-sm md:text-base"
                                style={{
                                  backgroundColor: isCorrect
                                    ? darkMode
                                      ? "rgba(16,185,129,0.2)"
                                      : "rgba(16,185,129,0.1)"
                                    : darkMode
                                    ? "rgba(15,23,42,0.4)"
                                    : "#f1f5f9",
                                  border: `1px solid ${
                                    isCorrect
                                      ? darkMode
                                        ? "rgba(16,185,129,0.5)"
                                        : "rgba(16,185,129,0.3)"
                                      : borderColor
                                  }`,
                                  color: textColor,
                                }}
                              >
                                <span className="font-semibold">
                                  {String.fromCharCode(65 + optIndex)}.{" "}
                                </span>
                                {option}
                                {isCorrect && (
                                  <span className="ml-2 text-green-500">✓ (True)</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {question.points && (
                        <div className="mt-4">
                          <span className="text-sm" style={{ color: textColor }}>
                            Points: {question.points}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mt-8 mb-12">
                    <p className="text-sm" style={{ color: textColor }}>
                      Page {paginationInfo.currentPage} of {paginationInfo.totalPages}
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center items-center">
                      <button
                        onClick={() => handlePageChange("prev")}
                        disabled={!paginationInfo.hasPrev}
                        className="px-3 py-1.5 rounded-lg border transition-colors"
                        style={{
                          borderColor: borderColor,
                          color: paginationInfo.hasPrev ? textColor : "#94a3b8",
                          opacity: paginationInfo.hasPrev ? 1 : 0.4,
                        }}
                      >
                        Previous
                      </button>
                      {pageOptions.map((page) => (
                        <button
                          key={`bottom-${page}`}
                          onClick={() => goToPage(page)}
                          className={`px-3 py-1 rounded-lg border text-sm transition-colors ${
                            currentPage === page ? "bg-indigo-500 text-white" : ""
                          }`}
                          style={{
                            borderColor: borderColor,
                            color: currentPage === page ? "#ffffff" : textColor,
                          }}
                        >
                          {page}
                        </button>
                      ))}
                      <button
                        onClick={() => handlePageChange("next")}
                        disabled={!paginationInfo.hasNext}
                        className="px-3 py-1.5 rounded-lg border transition-colors"
                        style={{
                          borderColor: borderColor,
                          color: paginationInfo.hasNext ? textColor : "#94a3b8",
                          opacity: paginationInfo.hasNext ? 1 : 0.4,
                        }}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      {editingQuestion && editForm && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={handleCloseEdit}
            aria-hidden="true"
          ></div>
          <div
            className="relative w-full max-w-3xl rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: darkMode ? "#0f172a" : "#ffffff" }}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold" style={{ color: textColor }}>
                  Edit question
                </h2>
                <button
                  onClick={handleCloseEdit}
                  className="text-sm font-semibold"
                  style={{ color: darkMode ? "#94a3b8" : "#475569" }}
                  disabled={savingEdit}
                >
                  Close
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: textColor }}>
                    Question
                  </label>
                  <textarea
                    value={editForm.text}
                    onChange={(e) => handleEditInputChange("text", e.target.value)}
                    className="w-full rounded-lg border px-3 py-2"
                    rows={3}
                    style={{
                      backgroundColor: darkMode ? "rgba(15,23,42,0.6)" : "#ffffff",
                      borderColor: borderColor,
                      color: textColor,
                    }}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: textColor }}>
                      Points
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={editForm.points}
                      onChange={(e) => handleEditInputChange("points", e.target.value)}
                      className="w-full rounded-lg border px-3 py-2"
                      style={{
                        backgroundColor: darkMode ? "rgba(15,23,42,0.6)" : "#ffffff",
                        borderColor: borderColor,
                        color: textColor,
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: textColor }}>
                      Explanation (optional)
                    </label>
                    <input
                      type="text"
                      value={editForm.explanation}
                      onChange={(e) => handleEditInputChange("explanation", e.target.value)}
                      className="w-full rounded-lg border px-3 py-2"
                      style={{
                        backgroundColor: darkMode ? "rgba(15,23,42,0.6)" : "#ffffff",
                        borderColor: borderColor,
                        color: textColor,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium" style={{ color: textColor }}>
                      Images
                    </label>
                    <button
                      type="button"
                      onClick={() => newImageInputRef.current?.click()}
                      className="px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
                      style={{
                        backgroundColor: darkMode ? "rgba(59,130,246,0.2)" : "#dbeafe",
                        color: darkMode ? "#bfdbfe" : "#1d4ed8",
                      }}
                    >
                      Upload images
                    </button>
                  </div>
                  <p className="text-xs mb-3" style={{ color: darkMode ? "#94a3b8" : "#64748b" }}>
                    Supported formats: JPG, PNG, GIF. You can add images even if the question does not have any yet.
                  </p>
                  <input
                    ref={newImageInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleSelectNewImages}
                    className="hidden"
                  />

                  {editForm.existingImages.length === 0 ? (
                    <p className="text-sm mb-4" style={{ color: darkMode ? "#cbd5f5" : "#475569" }}>
                      No images yet. Use the button above to upload new images.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                      {editForm.existingImages.map((img) => {
                        const isRemoved = editForm.deletedImageUrls.includes(img.url);
                        return (
                          <div
                            key={img.url}
                            className="relative rounded-lg overflow-hidden border"
                            style={{
                              borderColor: isRemoved ? "#f87171" : borderColor,
                              backgroundColor: darkMode ? "rgba(15,23,42,0.6)" : "#f8fafc",
                            }}
                          >
                            <img
                              src={img.url}
                              alt="Question"
                              className="w-full h-40 object-cover"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleToggleExistingImage(img.url)}
                                className="px-4 py-2 rounded-full text-sm font-semibold"
                                style={{
                                  backgroundColor: isRemoved ? "#22c55e" : "#ef4444",
                                  color: "#ffffff",
                                }}
                              >
                                {isRemoved ? "Restore" : "Remove"}
                              </button>
                            </div>
                            {isRemoved && (
                              <div className="absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-semibold bg-red-500 text-white">
                                Will delete
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {editForm.newImagePreviews.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2" style={{ color: textColor }}>
                        Images to upload
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {editForm.newImagePreviews.map((preview, idx) => (
                          <div
                            key={`${preview}-${idx}`}
                            className="relative rounded-lg overflow-hidden border"
                            style={{
                              borderColor: borderColor,
                              backgroundColor: darkMode ? "rgba(15,23,42,0.6)" : "#f8fafc",
                            }}
                          >
                            <img src={preview} alt={`New image ${idx + 1}`} className="w-full h-40 object-cover" />
                            <button
                              onClick={() => handleRemoveNewImage(idx)}
                              className="absolute top-2 right-2 px-3 py-1 rounded-full text-xs font-semibold"
                              style={{
                                backgroundColor: darkMode ? "rgba(239,68,68,0.9)" : "#ef4444",
                                color: "#ffffff",
                              }}
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium" style={{ color: textColor }}>
                      Options & correct
                    </label>
                    <button
                      onClick={handleAddOption}
                      className="text-sm font-semibold"
                      style={{ color: darkMode ? "#93c5fd" : "#2563eb" }}
                      type="button"
                    >
                      + Add option
                    </button>
                  </div>
                  <div className="space-y-3">
                    {editForm.options.map((option, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3"
                      >
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => handleOptionChange(idx, e.target.value)}
                          className="flex-1 rounded-lg border px-3 py-2"
                          style={{
                            backgroundColor: darkMode ? "rgba(15,23,42,0.6)" : "#ffffff",
                            borderColor: borderColor,
                            color: textColor,
                          }}
                        />
                        <label className="flex items-center gap-2 text-sm" style={{ color: textColor }}>
                          <input
                            type="checkbox"
                            checked={editForm.correctFlags[idx]}
                            onChange={() => handleToggleCorrect(idx)}
                            className="h-4 w-4"
                          />
                          Correct
                        </label>
                        {editForm.options.length > 2 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveOption(idx)}
                            className="text-sm font-semibold"
                            style={{ color: darkMode ? "#fca5a5" : "#dc2626" }}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4">
                  <button
                    onClick={handleCloseEdit}
                    className="px-4 py-2 rounded-lg font-semibold"
                    style={{
                      backgroundColor: darkMode ? "rgba(15,23,42,0.6)" : "#e2e8f0",
                      color: darkMode ? "#cbd5f5" : "#1e293b",
                    }}
                    disabled={savingEdit}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitEdit}
                    className="px-4 py-2 rounded-lg font-semibold text-white"
                    style={{ backgroundColor: savingEdit ? "#94a3b8" : "#2563eb" }}
                    disabled={savingEdit}
                  >
                    {savingEdit ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
