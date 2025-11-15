import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTheme } from "../hooks/useTheme";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { quizQuestionService, type QuizQuestion } from "../services";

export default function QuizCoursePage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("Quiz Questions");
  // Track current image index for each question
  const [currentImageIndices, setCurrentImageIndices] = useState<Record<string, number>>({});

  const apiBase = import.meta.env.VITE_BASE_API || "";

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

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        const subjectId = courseId; // courseId is actually subjectId from route /quiz/:courseId

        if (!subjectId) {
          console.warn("QuizCoursePage: No subjectId provided");
          if (mounted) {
            setTitle("Quiz Questions");
            setQuizQuestions([]);
            setLoading(false);
          }
          return;
        }

        console.log("QuizCoursePage: Fetching quiz questions for subjectId:", subjectId);

        // Fetch all quiz questions and filter by subjectId on client side
        const result = await quizQuestionService.getAllQuizQuestions({
          limit: 1000, // Get all questions
        });

        console.log("QuizCoursePage: All quiz questions result:", result);
        console.log("QuizCoursePage: Total questions:", result.data?.length || 0);

        // Filter by subjectId on client side
        const filteredQuestions = (result.data || []).filter((q) => {
          const qSubjectId = typeof q.subjectId === "object" && q.subjectId ? q.subjectId._id : q.subjectId;
          return qSubjectId === subjectId;
        });

        console.log("QuizCoursePage: Filtered questions for subjectId:", filteredQuestions.length);

        if (mounted) {
          setQuizQuestions(filteredQuestions);
          setTitle(`Quiz Questions (${filteredQuestions.length} questions)`);
        }
      } catch (error) {
        console.error("QuizCoursePage: Error fetching quiz questions:", error);
        if (mounted) {
          setQuizQuestions([]);
          setTitle("Quiz Questions");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [courseId]);

  const textColor = darkMode ? "#e2e8f0" : "#1e293b";
  const bgColor = darkMode ? "#0f172a" : "#f8fafc";
  const cardBg = darkMode ? "rgba(15,23,42,0.6)" : "#ffffff";
  const borderColor = darkMode ? "rgba(148,163,184,0.2)" : "rgba(148,163,184,0.2)";

  return (
    <div className="min-h-screen" style={{ backgroundColor: bgColor }}>
      <Navbar />
      <div className="flex">
        <Sidebar />
        <div className="flex-1 p-6 ml-64">
          <div className="max-w-6xl mx-auto">
            <div className="mb-6 flex items-center justify-between">
              <h1 className="text-3xl font-bold" style={{ color: textColor }}>
                {title}
              </h1>
              <button
                onClick={() => navigate(-1)}
                className="px-4 py-2 rounded-lg font-semibold transition-colors"
                style={{
                  backgroundColor: darkMode ? "rgba(99,102,241,0.2)" : "#6366f1",
                  color: darkMode ? "#a5b4fc" : "#ffffff",
                }}
              >
                Quay lại
              </button>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <p style={{ color: textColor }}>Đang tải...</p>
              </div>
            ) : quizQuestions.length === 0 ? (
              <div className="text-center py-12">
                <p style={{ color: textColor }}>Không có câu hỏi nào.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {quizQuestions.map((question, index) => {
                  const images = resolveImageSrc(question);
                  return (
                    <div
                      key={question._id}
                      className="rounded-2xl p-6"
                      style={{
                        backgroundColor: cardBg,
                        border: `1px solid ${borderColor}`,
                      }}
                    >
                      <div className="mb-4">
                        <h3
                          className="text-xl font-semibold mb-2 break-words"
                          style={{ color: textColor }}
                        >
                          Câu {index + 1}: {question.text}
                        </h3>
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
                            Lựa chọn:
                          </p>
                          {question.options.map((option, optIndex) => {
                            const isCorrect = question.correctOptions?.includes(optIndex);
                            return (
                              <div
                                key={optIndex}
                                className="p-3 rounded-lg break-words"
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
                                  <span className="ml-2 text-green-500">✓ (Đúng)</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {question.points && (
                        <div className="mt-4">
                          <span className="text-sm" style={{ color: textColor }}>
                            Điểm: {question.points}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
