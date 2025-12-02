import React, { useEffect, useState } from "react";
import { httpClient } from "../../utils/http";
import { useAuth } from "../../hooks/useAuth";
import type { Lesson } from "../../types/lesson";

interface SimpleLessonCardProps {
  lesson: Lesson;
  darkMode: boolean;
  onNavigate: (lessonId: string) => void;
}

const formatDuration = (minutes: number) => {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
};

const SimpleLessonCard: React.FC<SimpleLessonCardProps> = ({ lesson, darkMode, onNavigate }) => {
  const { user } = useAuth();
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const isStudent = user?.role === 'student';

  useEffect(() => {
    const fetchProgress = async () => {
      if (!lesson.hasAccess || !isStudent) return;
      
      try {
        const response = await httpClient.get(`/lesson-progress/lessons/${lesson._id}`, {
          withCredentials: true,
        });
        if (response.data?.success && response.data?.data) {
          const progressData = response.data.data;
          if (progressData.isCompleted) {
            setProgressPercent(100);
          } else if (progressData.progressPercent !== undefined) {
            setProgressPercent(progressData.progressPercent);
          }
        }
      } catch {
        setProgressPercent(0);
      }
    };

    fetchProgress();
    
    const handleProgressUpdate = (event: CustomEvent) => {
      if (event.detail.lessonId === lesson._id) {
        if (event.detail.isCompleted) {
          setProgressPercent(100);
        } else if (event.detail.progressPercent !== undefined) {
          setProgressPercent(event.detail.progressPercent);
        }
      }
    };
    
    window.addEventListener('lessonProgressUpdated', handleProgressUpdate as EventListener);
    
    return () => {
      window.removeEventListener('lessonProgressUpdated', handleProgressUpdate as EventListener);
    };
  }, [lesson._id, lesson.hasAccess, isStudent]);

  return (
    <div
      className="rounded-lg p-4 cursor-pointer transition-all hover:shadow-lg relative overflow-hidden"
      style={{
        backgroundColor: darkMode
          ? "rgba(31, 41, 55, 0.6)"
          : "rgba(249, 250, 251, 0.8)",
        border: darkMode
          ? "1px solid rgba(75, 85, 99, 0.3)"
          : "1px solid rgba(229, 231, 235, 0.5)",
      }}
      onClick={() => onNavigate(lesson._id)}
    >
      <h3
        className="text-lg font-semibold mb-2 hover:underline"
        style={{ color: darkMode ? "#ffffff" : "#1f2937" }}
      >
        {lesson.title}
      </h3>
      <p
        className="text-sm mb-3 line-clamp-2"
        style={{ color: darkMode ? "#d1d5db" : "#6b7280" }}
      >
        {lesson.content}
      </p>
      <div
        className="flex items-center gap-4 text-xs"
        style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}
      >
        <div className="flex items-center">
          <svg
            className="w-4 h-4 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {formatDuration(lesson.durationMinutes)}
        </div>
        {lesson.createdAt && (
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {new Date(lesson.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </div>
        )}
        {lesson.isPublished && (
          <span
            className="px-2 py-1 rounded"
            style={{
              backgroundColor: darkMode
                ? "rgba(59, 130, 246, 0.2)"
                : "rgba(59, 130, 246, 0.1)",
              color: darkMode ? "#93c5fd" : "#2563eb",
            }}
          >
            Published
          </span>
        )}
      </div>
      {/* Progress bar at bottom */}
      {lesson.hasAccess && isStudent && (
        <div className="absolute bottom-0 left-0 right-0 h-1.5 flex items-center">
          <div
            className="h-full transition-all duration-300 ease-out relative"
            style={{
              width: `${progressPercent}%`,
              backgroundColor:
                progressPercent >= 100
                  ? darkMode
                    ? "#10b981"
                    : "#059669"
                  : darkMode
                  ? "#6366f1"
                  : "#4f46e5",
            }}
          />
          <span
            className="absolute text-[10px] font-semibold whitespace-nowrap"
            style={{
              top: "-12px", // đẩy lên phía trên progress
              right: "0", // canh phải
              color: darkMode ? "#9ca3af" : "#6b7280",
            }}
          >
            {Math.round(progressPercent)}%
          </span>
        </div>
      )}
    </div>
  );
};

export default SimpleLessonCard;

