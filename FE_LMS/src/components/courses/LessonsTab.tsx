import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, ChevronLeft, ChevronRight } from "lucide-react";
import { httpClient } from "../../utils/http";
import type { Lesson } from "../../types/lesson";
import SimpleLessonCard from "./SimpleLessonCard";

interface LessonsTabProps {
  courseId: string;
  darkMode: boolean;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data: Lesson[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

const LessonsTab: React.FC<LessonsTabProps> = ({ courseId, darkMode }) => {
  const navigate = useNavigate();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const itemsPerPage = 3;

  useEffect(() => {
    setCurrentPage(1);
  }, [courseId]);

  useEffect(() => {
    const fetchLessons = async () => {
      try {
        setLoading(true);
        const response = await httpClient.get<ApiResponse>("/lessons/", {
          params: {
            courseId,
            page: currentPage,
            limit: itemsPerPage,
          },
          withCredentials: true,
        });

        const data = response.data;
        if (data?.success && data?.data) {
          setLessons(data.data);
          if (data.pagination) {
            setTotalPages(data.pagination.totalPages || 1);
            setTotal(data.pagination.total || 0);
          }
        } else if (Array.isArray(data)) {
          // Handle case where API returns array directly
          setLessons(data);
          setTotalPages(Math.ceil(data.length / itemsPerPage));
          setTotal(data.length);
        } else {
          setLessons([]);
        }
        setError("");
      } catch (e: unknown) {
        console.error("Error fetching lessons:", e);
        setError("Failed to load lessons");
        setLessons([]);
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      fetchLessons();
    }
  }, [courseId, currentPage]);

  const handleNavigate = (lessonId: string) => {
    navigate(`/materials/${lessonId}`);
  };

  const handleViewAll = () => {
    navigate(`/materials?courseId=${courseId}`);
  };

  if (loading) {
    return (
      <div className="py-8">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-32 rounded-lg"
              style={{
                backgroundColor: darkMode ? "#1f2937" : "#f3f4f6",
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center">
        <p style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>{error}</p>
      </div>
    );
  }

  return (
    <div className="py-6">
      {lessons.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen
            className="w-16 h-16 mx-auto mb-4"
            style={{ color: darkMode ? "#4b5563" : "#9ca3af" }}
          />
          <p style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>
            No lessons available for this course
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3 mb-6">
            {lessons.map((lesson) => (
              <SimpleLessonCard
                key={lesson._id}
                lesson={lesson}
                darkMode={darkMode}
                onNavigate={handleNavigate}
              />
            ))}
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: darkMode ? "#1f2937" : "#f3f4f6",
                  color: darkMode ? "#ffffff" : "#111827",
                }}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span
                className="text-sm px-3"
                style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}
              >
                Page {currentPage} of {totalPages} ({total} total)
              </span>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: darkMode ? "#1f2937" : "#f3f4f6",
                  color: darkMode ? "#ffffff" : "#111827",
                }}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={handleViewAll}
              className="px-4 py-2 rounded-lg font-medium transition-colors"
              style={{
                backgroundColor: darkMode ? "#1f2937" : "#f3f4f6",
                color: darkMode ? "#ffffff" : "#111827",
              }}
            >
              View all
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default LessonsTab;

