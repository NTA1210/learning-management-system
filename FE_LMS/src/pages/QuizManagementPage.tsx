import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useTheme } from "../hooks/useTheme";
import { useAuth } from "../hooks/useAuth";
import Navbar from "../components/Navbar.tsx";
import Sidebar from "../components/Sidebar.tsx";
import { PlusCircle, X } from "lucide-react";
import { courseService } from "../services";
import { useNavigate } from "react-router-dom";
import { httpClient } from "../utils/http";

type Course = {
  _id: string;
  title: string;
  subjectId?: {
    _id: string;
    code: string;
    name: string;
  } | string;
};

type Question = {
  text: string;
  options: string[];
  correctOptions: number[];
  difficulty: string;
  category: string;
  explanation: string;
};

export default function QuizManagementPage() {
  const { darkMode } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      difficulty: "easy",
      category: "",
      explanation: "",
    },
  ]);

  // Fetch courses for /quiz
  useEffect(() => {
    (async () => {
      try {
        const { courses: list } = await courseService.getAllCourses({ limit: 100 });
        setCourses(list as Course[]);
      } catch {
        setCourses([]);
      }
    })();
  }, []);

  const handlePickCourse = (courseId: string) => {
    navigate(`/quiz/${courseId}`);
  };

  const generateExamCode = (course: Course) => {
    if (typeof course.subjectId !== "object" || !course.subjectId) return "";
    const subject = course.subjectId;
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    return `${subject.code}-${year}${month}${day}-${hours}${minutes}`;
  };

  const handleSelectCourse = (course: Course) => {
    setSelectedCourse(course);
    // Auto-generate exam code if subject is available
    if (typeof course.subjectId === "object" && course.subjectId && !quizDetails.examCode) {
      const code = generateExamCode(course);
      if (code) {
        setQuizDetails((prev) => ({ ...prev, examCode: code }));
      }
    }
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!selectedCourse) {
        alert("Please select a course first");
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
        difficulty: "easy",
        category: "",
        explanation: "",
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

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedCourse || typeof selectedCourse.subjectId !== "object" || !selectedCourse.subjectId) {
      alert("Please select a course first");
      return;
    }

    const subjectId = typeof selectedCourse.subjectId === "object" ? selectedCourse.subjectId._id : selectedCourse.subjectId;

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

        const payload = {
          subjectId,
          text: question.text.trim(),
          options: normalizedOptions,
          correctOptions: normalizedCorrectOptions,
          explanation: question.explanation?.trim() || undefined,
          type: "mcq" as const,
        };
        
        console.log("Creating question with payload:", payload);
        console.log("Options type:", Array.isArray(payload.options) ? "array" : typeof payload.options);
        console.log("CorrectOptions type:", Array.isArray(payload.correctOptions) ? "array" : typeof payload.correctOptions);
        
        const response = await httpClient.post("/quiz-questions", payload);
        console.log("Question created successfully:", response);
      }
      alert("Quiz questions created successfully!");
      // Reset form
      setShowCreateModal(false);
      setCurrentStep(1);
      setSelectedCourse(null);
      setQuizDetails({ title: "", description: "", examCode: "" });
      setQuestions([
        {
          text: "",
          options: ["", "", "", ""],
          correctOptions: [0, 0, 0, 0],
          difficulty: "easy",
          category: "",
          explanation: "",
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
        difficulty: "easy",
        category: "",
        explanation: "",
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

            {/* Courses list */}
            <section className="grid gap-6 lg:grid-cols-1">
              <div
                className="rounded-2xl shadow-md p-6 space-y-4"
                style={{ backgroundColor: cardBg, border: cardBorder }}
              >
                <h2 className="text-xl font-semibold">Courses</h2>
                {courses.length === 0 ? (
                  <p className="text-sm" style={{ color: labelColor }}>
                    Không có khoá học nào hoặc chưa tải được.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {courses.map((c) => {
                      return (
                        <div
                          key={c._id}
                          onClick={() => handlePickCourse(c._id)}
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
                            {c.title}
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
              <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
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
                        
                        {/* Course Selection */}
                        <div>
                          <label className="block text-sm font-semibold mb-2" style={{ color: labelColor }}>
                            Course <span className="text-red-500">*</span>
                          </label>
                          <div className="grid grid-cols-1 gap-3 max-h-48 overflow-y-auto">
                            {courses.map((course) => {
                              const isSelected = selectedCourse?._id === course._id;
                              const subject = typeof course.subjectId === "object" ? course.subjectId : null;
                              return (
                                <div
                                  key={course._id}
                                  onClick={() => handleSelectCourse(course)}
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
                                  <div className="font-semibold">{course.title}</div>
                                  {subject && (
                                    <div className="text-xs mt-1" style={{ color: labelColor }}>
                                      {subject.code} - {subject.name}
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

                        {/* Subject (auto-filled from course) */}
                        {selectedCourse && typeof selectedCourse.subjectId === "object" && selectedCourse.subjectId && (
                          <div>
                            <label className="block text-sm font-semibold mb-2" style={{ color: labelColor }}>
                              Subject <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              disabled
                              value={`${selectedCourse.subjectId.code} - ${selectedCourse.subjectId.name}`}
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

                            {/* Difficulty and Category */}
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-sm font-semibold mb-2" style={{ color: labelColor }}>
                                  Difficulty
                                </label>
                                <select
                                  value={question.difficulty}
                                  onChange={(e) => handleUpdateQuestion(qIndex, "difficulty", e.target.value)}
                                  className="w-full px-4 py-2 rounded-lg"
                                  style={{ backgroundColor: inputBg, border: `1px solid ${inputBorder}`, color: textColor }}
                                >
                                  <option value="easy">Easy</option>
                                  <option value="medium">Medium</option>
                                  <option value="hard">Hard</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-semibold mb-2" style={{ color: labelColor }}>
                                  Category
                                </label>
                                <input
                                  type="text"
                                  value={question.category}
                                  onChange={(e) => handleUpdateQuestion(qIndex, "category", e.target.value)}
                                  className="w-full px-4 py-2 rounded-lg"
                                  style={{ backgroundColor: inputBg, border: `1px solid ${inputBorder}`, color: textColor }}
                                  placeholder="e.g. Algorithm"
                                />
                              </div>
                            </div>

                            {/* Explanation */}
                            <div>
                              <label className="block text-sm font-semibold mb-2" style={{ color: labelColor }}>
                                Explanation
                              </label>
                              <input
                                type="text"
                                value={question.explanation}
                                onChange={(e) => handleUpdateQuestion(qIndex, "explanation", e.target.value)}
                                className="w-full px-4 py-2 rounded-lg"
                                style={{ backgroundColor: inputBg, border: `1px solid ${inputBorder}`, color: textColor }}
                                placeholder="Explanation for the answer"
                              />
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

