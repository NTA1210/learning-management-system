import { ChevronLeft, ChevronRight, Edit3, Trash2 } from "lucide-react";
import type { QuizQuestion } from "../../services";

interface QuizQuestionCardProps {
  question: QuizQuestion;
  index: number;
  startNumber: number;
  textColor: string;
  cardBg: string;
  borderColor: string;
  darkMode: boolean;
  deletingId: string | null;
  currentImageIndex: number;
  resolveImageSrc: (question: QuizQuestion) => string[];
  onImagePrev: (questionId: string) => void;
  onImageNext: (questionId: string) => void;
  onEdit: (question: QuizQuestion) => void;
  onDelete: (questionId: string) => void;
}

export function QuizQuestionCard({
  question,
  index,
  startNumber,
  textColor,
  cardBg,
  borderColor,
  darkMode,
  deletingId,
  currentImageIndex,
  resolveImageSrc,
  onImagePrev,
  onImageNext,
  onEdit,
  onDelete,
}: QuizQuestionCardProps) {
  const images = resolveImageSrc(question);
  const hasNext = currentImageIndex < images.length - 1;
  const hasPrev = currentImageIndex > 0;

  return (
    <div
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
            <span className="mr-2">Question {startNumber + index}:</span>
            <span dangerouslySetInnerHTML={{ __html: question.text }} />
          </h3>
          <div className="flex items-center gap-2 md:gap-3 md:ml-4 self-end md:self-auto md:flex-shrink-0">
            <button
              onClick={() => onEdit(question)}
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
              onClick={() => onDelete(question._id)}
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
        {images.length > 0 && (
          <div className="mt-4 relative">
            <div className="relative flex items-center justify-center group">
              {hasPrev && (
                <button
                  onClick={() => onImagePrev(question._id)}
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
                src={images[currentImageIndex]}
                alt={`Question ${index + 1} image ${currentImageIndex + 1}`}
                className="max-w-full max-h-96 object-contain rounded-lg border transition-opacity"
                style={{ borderColor: borderColor }}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
              {hasNext && (
                <button
                  onClick={() => onImageNext(question._id)}
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
                <span
                  className="text-sm px-3 py-1 rounded-full inline-block"
                  style={{
                    color: textColor,
                    backgroundColor: darkMode ? "rgba(99,102,241,0.2)" : "rgba(99,102,241,0.1)",
                  }}
                >
                  {currentImageIndex + 1} / {images.length}
                </span>
              </div>
            )}
          </div>
        )}
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
            const isCorrect = isBinaryCorrect ? correctOptions[optIndex] === 1 : correctOptions.includes(optIndex);

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
                    isCorrect ? (darkMode ? "rgba(16,185,129,0.5)" : "rgba(16,185,129,0.3)") : borderColor
                  }`,
                  color: textColor,
                }}
              >
                <span className="font-semibold">{String.fromCharCode(65 + optIndex)}. </span>
                {option}
                {isCorrect && <span className="ml-2 text-green-500">✓ (True)</span>}
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
}


