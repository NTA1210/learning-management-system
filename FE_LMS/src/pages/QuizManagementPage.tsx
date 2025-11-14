import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useTheme } from "../hooks/useTheme";
import { useAuth } from "../hooks/useAuth";
import Navbar from "../components/Navbar.tsx";
import Sidebar from "../components/Sidebar.tsx";
import { PlusCircle, X } from "lucide-react";
import { subjectService, type Subject } from "../services";
import { useNavigate } from "react-router-dom";

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
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const quizUploadEndpoint = `${import.meta.env.VITE_BASE_API.replace(/\/$/, "")}/quiz-questions`;



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
        const result = await subjectService.getAllSubjects({ limit: 100 });
        console.log("Subjects response:", result);
        setSubjects(result.data || []);
      } catch (error) {
        console.error("Error fetching subjects:", error);
        setSubjects([]);
      }
    })();
  }, []);

  const handlePickSubject = (subjectId: string) => {
    navigate(`/quiz/${subjectId}`);
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
        alert("Please select a subject first");
        return;
      }
      if (!quizDetails.title.trim()) {
        alert("Please enter quiz title");
        return;
      }
      if (!quizDetails.examCode.trim()) {
        alert("Please enter exam code");
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

  const handleQuestionImageChange = (questionIndex: number, fileList: FileList | null) => {
    const files = fileList ? Array.from(fileList) : [];
    if (!files.length) {
      setQuestions((prev) => {
        const updated = [...prev];
        updated[questionIndex] = {
          ...updated[questionIndex],
          imageFiles: [],
          imagePreviews: [],
        };
        return updated;
      });
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
        updated[questionIndex] = {
          ...updated[questionIndex],
          imageFiles: files,
          imagePreviews: previews.filter(Boolean),
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
      alert("Please select a subject first");
      return;
    }

    const subjectId = selectedSubject._id;

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) {
        alert(`Please enter question text for question ${i + 1}`);
        return;
      }
      if (q.options.some((opt) => !opt.trim())) {
        alert(`Please fill all options for question ${i + 1}`);
        return;
      }
      if (!q.correctOptions.includes(1)) {
        alert(`Please select at least one correct answer for question ${i + 1}`);
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
          alert(`Question ${questions.indexOf(question) + 1}: At least 2 options are required`);
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
          alert(`Question ${questions.indexOf(question) + 1}: At least one correct answer must be selected`);
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
      alert("Quiz questions created successfully!");
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
      
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setCurrentStep(1);
    setSelectedCourse(null);
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
            <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold">Quiz Management</h1>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-semibold shadow-md transition-transform hover:-translate-y-0.5"
                style={{ backgroundColor: "#4f46e5", color: "#ffffff" }}
              >
                <PlusCircle className="w-5 h-5" />
                Create quiz
              </button>
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
                    <h2 className="text-2xl font-bold">Create New Quiz</h2>
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
                        Quiz Details
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

                  <form onSubmit={handleSubmit} className="p-6 space-y-6">
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
                            Quiz Title <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={quizDetails.title}
                            onChange={(e) => setQuizDetails({ ...quizDetails, title: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg"
                            style={{ backgroundColor: inputBg, border: `1px solid ${inputBorder}`, color: textColor }}
                            placeholder="Enter quiz title"
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
                            placeholder="Enter quiz description"
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
                                value={question.text}
                                onChange={(e) => handleUpdateQuestion(qIndex, "text", e.target.value)}
                                className="w-full px-4 py-2 rounded-lg resize-none"
                                style={{ backgroundColor: inputBg, border: `1px solid ${inputBorder}`, color: textColor }}
                                rows={3}
                                placeholder="Enter question text"
                              />
                            </div>

                            {/* Options */}
                            <div className="grid grid-cols-2 gap-3">
                              {question.options.map((option, optIndex) => (
                                <div key={optIndex}>
                                  <label className="block text-sm font-semibold mb-2" style={{ color: labelColor }}>
                                    Option {String.fromCharCode(65 + optIndex)} <span className="text-red-500">*</span>
                                  </label>
                                  <div className="flex gap-2">
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
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Removed Difficulty and Category */}

                            {/* Removed Explanation */}

                            {/* Image Upload (multiple) */}
                            <div>
                              <label className="block text-sm font-semibold mb-2" style={{ color: labelColor }}>
                                Question Images
                              </label>
                              <input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={(e) => handleQuestionImageChange(qIndex, e.target.files)}
                                className="block w-full text-sm file:mr-3 file:px-3 file:py-2 file:rounded-lg file:border file:border-gray-300 file:bg-transparent"
                              />
                              {question.imagePreviews.length > 0 && (
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
                            {isSubmitting ? "Creating..." : "Create Quiz"}
                          </button>
                        </div>
                      </div>
                    )}
                  </form>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

