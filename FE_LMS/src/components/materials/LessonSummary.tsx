import React from "react";
import type { LessonSummary as LessonSummaryType } from "../../types/lessonMaterial";

interface LessonSummaryProps {
  lesson: LessonSummaryType;
  darkMode: boolean;
  formatDuration: (minutes: number) => string;
}

const LessonSummary: React.FC<LessonSummaryProps> = ({ lesson, darkMode, formatDuration }) => (
  <div
    className="rounded-lg shadow-md overflow-hidden mb-6 p-6"
    style={{
      backgroundColor: darkMode ? "rgba(31, 41, 55, 0.8)" : "rgba(255, 255, 255, 0.9)",
      border: darkMode ? "1px solid rgba(75, 85, 99, 0.3)" : "1px solid rgba(229, 231, 235, 0.5)",
    }}
  >
    <div className="mb-3">
      <span
        className="inline-block px-3 py-1 text-xs font-semibold rounded-full"
        style={{
          backgroundColor: darkMode ? "rgba(99, 102, 241, 0.2)" : "rgba(99, 102, 241, 0.1)",
          color: darkMode ? "#a5b4fc" : "#6366f1",
        }}
      >
        {lesson.courseId.title}
      </span>
    </div>
    <h1 className="text-3xl font-bold mb-4" style={{ color: darkMode ? "#ffffff" : "#1f2937" }}>
      {lesson.title}
    </h1>
    {lesson.content && (
      <p className="text-base mb-4 whitespace-pre-wrap" style={{ color: darkMode ? "#d1d5db" : "#6b7280" }}>
        {lesson.content}
      </p>
    )}
    <div
      className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t"
      style={{ borderColor: darkMode ? "rgba(75, 85, 99, 0.3)" : "rgba(229, 231, 235, 0.5)" }}
    >
      <div className="flex items-center text-sm" style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Duration: {formatDuration(lesson.durationMinutes)}
      </div>
      <div className="flex items-center text-sm" style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5a2 2 0 002 2h2a2 2 0 002-2" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 12h3m-6 0h.01M9 16h.01m3 0h3" />
        </svg>
        Order: {lesson.order}
      </div>
      <div className="flex items-center text-sm" style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>
        {lesson.hasAccess ? (
          <span
            className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded"
            style={{
              backgroundColor: darkMode ? "rgba(34, 197, 94, 0.2)" : "rgba(34, 197, 94, 0.1)",
              color: darkMode ? "#86efac" : "#16a34a",
            }}
          >
            Accessible
          </span>
        ) : (
          <span
            className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded"
            style={{
              backgroundColor: darkMode ? "rgba(239, 68, 68, 0.2)" : "rgba(239, 68, 68, 0.1)",
              color: darkMode ? "#fca5a5" : "#dc2626",
            }}
          >
            No Access
          </span>
        )}
      </div>
    </div>
  </div>
);

export default LessonSummary;

