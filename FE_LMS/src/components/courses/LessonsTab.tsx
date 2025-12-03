import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, ChevronLeft, ChevronRight } from "lucide-react";
import axios from "axios";
import { httpClient } from "../../utils/http";
import type { Lesson } from "../../types/lesson";
import SimpleLessonCard from "./SimpleLessonCard";
import { useAuth } from "../../hooks/useAuth";
import LessonFormModal from "../lessons/LessonFormModal";
import type { LessonFormValues } from "../../types/lesson";

interface LessonsTabProps {
  courseId: string;
  darkMode: boolean;
  courseTitle?: string;
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

const LessonsTab: React.FC<LessonsTabProps> = ({
  courseId,
  darkMode,
  courseTitle,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [currentPageState, setCurrentPageState] = useState(1);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const itemsPerPage = 5;
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fetchingRef = useRef<boolean>(false);

  const [modalState, setModalState] = useState<{ mode: "create" } | null>(null);

  const isAdmin = user?.role === "admin";
  const isTeacher = user?.role === "teacher";
  const canCreate = isAdmin || isTeacher;

  useEffect(() => {
    // Reset to page 1 when courseId changes
    setCurrentPageState(1);
    setSearchTerm("");
    setSearchInput("");
  }, [courseId]);

  useEffect(() => {
    console.log("[LessonsTab] useEffect triggered:", {
      courseId,
      currentPageState,
      searchTerm,
    });

    const fetchLessons = async () => {
      // Prevent duplicate requests for the same page
      if (fetchingRef.current) {
        console.log(
          "[LessonsTab] Already fetching, skipping duplicate request"
        );
        return;
      }

      try {
        fetchingRef.current = true;
        console.log("[LessonsTab] Fetching lessons:", {
          courseId,
          currentPageState,
          searchTerm,
        });
        setLoading(true);

        // If search term exists, try searching by title first, then by content if no results
        let lessons: Lesson[] = [];
        let totalCount = 0;
        let totalPagesCount = 1;
        let hasNextPage = false;
        let hasPrevPage = false;
        let currentPageFromApi = currentPageState;

        if (searchTerm.trim()) {
          // First, try searching by title
          const titleParams: Record<string, string | number> = {
            courseId,
            page: currentPageState,
            limit: itemsPerPage,
            title: searchTerm.trim(),
          };
          // Default sort by createdAt descending (newest first)
          titleParams.sortBy = "createdAt";
          titleParams.sortOrder = "desc";

          const titleResponse = await httpClient.get<ApiResponse>("/lessons/", {
            params: titleParams,
            withCredentials: true,
          });

          const titleData = titleResponse.data;
          if (titleData?.success && titleData?.data) {
            lessons = titleData.data;
            if (titleData.pagination) {
              totalCount = titleData.pagination.total || 0;
              totalPagesCount = titleData.pagination.totalPages || 1;
              hasNextPage = titleData.pagination.hasNext || false;
              hasPrevPage = titleData.pagination.hasPrev || false;
              if (titleData.pagination.page !== undefined) {
                currentPageFromApi = titleData.pagination.page;
              }
            }
          }

          // If no results from title search, try searching by content
          if (lessons.length === 0) {
            const contentParams: Record<string, string | number> = {
              courseId,
              page: currentPageState,
              limit: itemsPerPage,
              content: searchTerm.trim(),
            };
            // Default sort by createdAt descending (newest first)
            contentParams.sortBy = "createdAt";
            contentParams.sortOrder = "desc";

            const contentResponse = await httpClient.get<ApiResponse>(
              "/lessons/",
              {
                params: contentParams,
                withCredentials: true,
              }
            );

            const contentData = contentResponse.data;
            if (contentData?.success && contentData?.data) {
              lessons = contentData.data;
              if (contentData.pagination) {
                totalCount = contentData.pagination.total || 0;
                totalPagesCount = contentData.pagination.totalPages || 1;
                hasNextPage = contentData.pagination.hasNext || false;
                hasPrevPage = contentData.pagination.hasPrev || false;
                if (contentData.pagination.page !== undefined) {
                  currentPageFromApi = contentData.pagination.page;
                }
              }
            }
          }
        } else {
          // No search term, fetch normally
          const params: Record<string, string | number> = {
            courseId,
            page: currentPageState,
            limit: itemsPerPage,
          };
          // Default sort by createdAt descending (newest first)
          params.sortBy = "createdAt";
          params.sortOrder = "desc";

          const response = await httpClient.get<ApiResponse>("/lessons/", {
            params,
            withCredentials: true,
          });

          const data = response.data;
          if (data?.success && data?.data) {
            lessons = data.data;
            if (data.pagination) {
              totalCount = data.pagination.total || 0;
              totalPagesCount = data.pagination.totalPages || 1;
              hasNextPage = data.pagination.hasNext || false;
              hasPrevPage = data.pagination.hasPrev || false;
              if (data.pagination.page !== undefined) {
                currentPageFromApi = data.pagination.page;
              }
            }
          } else if (Array.isArray(data)) {
            lessons = data;
            totalPagesCount = Math.ceil(data.length / itemsPerPage);
            totalCount = data.length;
          }
        }

        console.log("[LessonsTab] Fetch completed:", {
          lessonsCount: lessons.length,
          totalPages: totalPagesCount,
          total: totalCount,
          hasNext: hasNextPage,
          hasPrev: hasPrevPage,
          currentPageFromApi,
        });
        setLessons(lessons);
        setTotalPages(totalPagesCount);
        setTotal(totalCount);
        setHasNext(hasNextPage);
        setHasPrev(hasPrevPage);
        setCurrentPageState(currentPageFromApi);
        setError("");
      } catch (e: unknown) {
        console.error("[LessonsTab] Error fetching lessons:", e);
        // Try to extract a helpful message from the backend / axios error
        let message = "Failed to load lessons";
        try {
          if (axios.isAxiosError(e)) {
            const respData = (e.response && e.response.data) as any;
            if (respData) {
              if (typeof respData.message === "string" && respData.message)
                message = respData.message;
              else if (typeof respData.error === "string" && respData.error)
                message = respData.error;
            }
            // fallback to axios error message
            if (!message && e.message) message = e.message;
          } else if (e instanceof Error) {
            message = e.message || message;
          }
        } catch (ex) {
          console.warn("[LessonsTab] Failed to parse error object", ex);
        }

        setError(message);
        setLessons([]);
      } finally {
        setLoading(false);
        fetchingRef.current = false;
      }
    };

    if (courseId) {
      fetchLessons();
    }
  }, [courseId, currentPageState, searchTerm, refreshTrigger]);

  const handleCreate = () => setModalState({ mode: "create" });
  const closeModal = () => setModalState(null);

  const handleModalSubmit = async (values: LessonFormValues) => {
    try {
      const payload: any = {
        courseId: values.courseId,
        title: values.title,
      };
      if (values.content) payload.content = values.content;
      if (values.durationMinutes > 0)
        payload.durationMinutes = values.durationMinutes;

      await httpClient.post("/lessons", payload, { withCredentials: true });

      // Show success message
      const Swal = (await import("sweetalert2")).default;
      await Swal.fire({
        icon: "success",
        title: "Success",
        text: "Lesson created successfully",
        confirmButtonColor: darkMode ? "#4c1d95" : "#4f46e5",
        background: darkMode ? "#1f2937" : "#ffffff",
        color: darkMode ? "#ffffff" : "#1e293b",
      });

      closeModal();
      // Refresh lessons
      setCurrentPageState(1);
      // Trigger a re-fetch by clearing and setting search term or just calling fetchLessons logic if extracted
      // Since fetchLessons is inside useEffect, we can trigger it by changing a dependency or extracting it.
      // But here fetchLessons is defined inside useEffect.
      // A simple way to force refresh is to toggle a dummy state or just rely on the fact that we might want to reload the page or
      // ideally, we should extract fetchLessons outside.
      // For now, let's just reload the window or navigate to the same page, but that's not ideal.
      // Better: Extract fetchLessons or use a refresh trigger.
      // Let's add a refresh trigger state.
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: any) {
      console.error("Error creating lesson:", err);
      const message =
        err.response?.data?.message || err.message || "Failed to create lesson";
      const Swal = (await import("sweetalert2")).default;
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: message,
        confirmButtonColor: darkMode ? "#4c1d95" : "#4f46e5",
        background: darkMode ? "#1f2937" : "#ffffff",
        color: darkMode ? "#ffffff" : "#1e293b",
      });
    }
  };

  const handleNavigate = (lessonId: string) => {
    navigate(`/materials/${lessonId}`);
  };

  // Real-time search with debounce
  useEffect(() => {
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for debounce (1000ms - 1 second)
    searchTimeoutRef.current = setTimeout(() => {
      setSearchTerm(searchInput);
      setCurrentPageState(1); // Reset to page 1 when searching
    }, 1000);

    // Cleanup on unmount
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchInput]);

  const handlePageChange = (newPage: number) => {
    console.log("[LessonsTab] handlePageChange called:", {
      newPage,
      currentPageState,
      totalPages,
    });
    // Update page state if page is valid, let useEffect handle the fetch
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPageState) {
      console.log("[LessonsTab] Updating page state to:", newPage);
      setCurrentPageState(newPage);
    } else {
      console.log("[LessonsTab] Page change skipped:", {
        reason:
          newPage < 1
            ? "page < 1"
            : newPage > totalPages
            ? "page > totalPages"
            : newPage === currentPageState
            ? "same page"
            : "unknown",
        newPage,
        currentPageState,
        totalPages,
      });
    }
  };

  return (
    <div className="py-6">
      {/* Search and Sort Controls - Always visible */}
      <div className="mb-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by title or content..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border transition-colors"
            style={{
              backgroundColor: darkMode ? "rgba(55, 65, 81, 0.8)" : "#ffffff",
              borderColor: darkMode ? "rgba(75, 85, 99, 0.3)" : "#e5e7eb",
              color: darkMode ? "#ffffff" : "#000000",
            }}
          />
        </div>
        {canCreate && (
          <button
            onClick={handleCreate}
            className="px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap"
            style={{
              backgroundColor: darkMode ? "#4c1d95" : "#4f46e5",
              color: "#ffffff",
            }}
          >
            + Create Lesson
          </button>
        )}
      </div>

      {loading ? (
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
      ) : error ? (
        <div className="py-8 text-center">
          <p style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>{error}</p>
        </div>
      ) : lessons.length === 0 ? (
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
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const prevPage = Math.max(1, currentPageState - 1);
                  console.log("[LessonsTab] Previous button clicked:", {
                    currentPageState,
                    prevPage,
                    hasPrev,
                  });
                  handlePageChange(prevPage);
                }}
                disabled={currentPageState <= 1}
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
                Page {currentPageState} of {totalPages} ({total} total)
              </span>
              <button
                onClick={() => {
                  const nextPage = Math.min(totalPages, currentPageState + 1);
                  console.log("[LessonsTab] Next button clicked:", {
                    currentPageState,
                    nextPage,
                    hasNext,
                  });
                  handlePageChange(nextPage);
                }}
                disabled={currentPageState >= totalPages}
                className="p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: darkMode ? "#1f2937" : "#f3f4f6",
                  color: darkMode ? "#ffffff" : "#111827",
                }}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}

      <LessonFormModal
        darkMode={darkMode}
        isOpen={Boolean(modalState)}
        mode="create"
        courses={[{ _id: courseId, title: courseTitle || "Current Course" }]}
        initialValues={{
          courseId: courseId,
          title: "",
          content: "",
          order: 0,
          durationMinutes: 0,
          publishedAt: "",
        }}
        onClose={closeModal}
        onSubmit={handleModalSubmit}
      />
    </div>
  );
};

export default LessonsTab;
