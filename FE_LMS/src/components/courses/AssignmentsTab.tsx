import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, ChevronLeft, ChevronRight } from "lucide-react";
import axios from "axios";
import { httpClient } from "../../utils/http";
import type { Assignment } from "../../types/assignment";
import SimpleAssignmentCard from "./SimpleAssignmentCard";

interface AssignmentsTabProps {
  courseId: string;
  darkMode: boolean;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data: Assignment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

const AssignmentsTab: React.FC<AssignmentsTabProps> = ({
  courseId,
  darkMode,
}) => {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [currentPageState, setCurrentPageState] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const itemsPerPage = 5;
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fetchingRef = useRef<boolean>(false);

  useEffect(() => {
    // Reset to page 1 when courseId changes
    setCurrentPageState(1);
    setSearchTerm("");
    setSearchInput("");
  }, [courseId]);

  useEffect(() => {
    const fetchAssignments = async () => {
      // Prevent duplicate requests
      if (fetchingRef.current) {
        console.log(
          "[AssignmentsTab] Already fetching, skipping duplicate request"
        );
        return;
      }

      try {
        fetchingRef.current = true;
        console.log("[AssignmentsTab] Fetching assignments:", {
          courseId,
          currentPageState,
          searchTerm,
        });
        setLoading(true);
        const params: Record<string, string | number> = {
          courseId,
          page: currentPageState,
          limit: itemsPerPage,
        };

        // Add search parameter
        if (searchTerm.trim()) {
          params.search = searchTerm.trim();
        }

        // Add sort parameters
        // Default sort by createdAt descending (newest first)
        params.sortBy = "createdAt";
        params.sortOrder = "desc";

        const response = await httpClient.get<ApiResponse>("/assignments", {
          params,
          withCredentials: true,
        });

        const data = response.data;
        let hasNextPage = false;
        let hasPrevPage = false;
        let currentPageFromApi = currentPageState;

        if (data?.success && data?.data) {
          setAssignments(data.data);
          if (data.pagination) {
            setTotalPages(data.pagination.totalPages || 1);
            setTotal(data.pagination.total || 0);
            // Use hasNextPage/hasPrevPage from API (note: API uses hasNextPage, not hasNext)
            hasNextPage = data.pagination.hasNextPage || false;
            hasPrevPage = data.pagination.hasPrevPage || false;
            if (data.pagination.page !== undefined) {
              currentPageFromApi = data.pagination.page;
            }
          }
          console.log("[AssignmentsTab] Fetch completed:", {
            assignmentsCount: data.data.length,
            totalPages: data.pagination?.totalPages || 1,
            total: data.pagination?.total || 0,
            hasNext: hasNextPage,
            hasPrev: hasPrevPage,
            currentPageFromApi,
          });
        } else if (Array.isArray(data)) {
          // Handle case where API returns array directly
          setAssignments(data);
          setTotalPages(Math.ceil(data.length / itemsPerPage));
          setTotal(data.length);
          hasNextPage = false;
          hasPrevPage = false;
          currentPageFromApi = 1;
        } else {
          setAssignments([]);
        }
        setHasNext(hasNextPage);
        setHasPrev(hasPrevPage);
        setCurrentPageState(currentPageFromApi);
        setError("");
      } catch (e: unknown) {
        console.error("[AssignmentsTab] Error fetching assignments:", e);
        // Extract a helpful message from axios/backend error when possible
        let message = "Failed to load assignments";
        try {
          if (axios.isAxiosError(e)) {
            const respData = (e.response && e.response.data) as any;
            if (respData) {
              if (typeof respData.message === "string" && respData.message)
                message = respData.message;
              else if (typeof respData.error === "string" && respData.error)
                message = respData.error;
            }
            if (!message && e.message) message = e.message;
          } else if (e instanceof Error) {
            message = e.message || message;
          }
        } catch (ex) {
          console.warn("[AssignmentsTab] Failed to parse error object", ex);
        }

        setError(message);
        setAssignments([]);
      } finally {
        setLoading(false);
        fetchingRef.current = false;
      }
    };

    if (courseId) {
      fetchAssignments();
    }
  }, [courseId, currentPageState, searchTerm]);

  const handleNavigate = (assignmentId: string) => {
    navigate(`/assignments/${assignmentId}`);
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
    console.log("[AssignmentsTab] handlePageChange called:", {
      newPage,
      currentPageState,
      totalPages,
    });
    // Update page state if page is valid, let useEffect handle the fetch
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPageState) {
      console.log("[AssignmentsTab] Updating page state to:", newPage);
      setCurrentPageState(newPage);
    } else {
      console.log("[AssignmentsTab] Page change skipped:", {
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
            placeholder="Search by title or description..."
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
      ) : assignments.length === 0 ? (
        <div className="text-center py-12">
          <FileText
            className="w-16 h-16 mx-auto mb-4"
            style={{ color: darkMode ? "#4b5563" : "#9ca3af" }}
          />
          <p style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>
            No assignments available for this course
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3 mb-6">
            {assignments.map((assignment) => (
              <SimpleAssignmentCard
                key={assignment._id}
                assignment={assignment}
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
                  console.log("[AssignmentsTab] Previous button clicked:", {
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
                  console.log("[AssignmentsTab] Next button clicked:", {
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
    </div>
  );
};

export default AssignmentsTab;
