import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, ChevronLeft, ChevronRight } from "lucide-react";
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

const AssignmentsTab: React.FC<AssignmentsTabProps> = ({ courseId, darkMode }) => {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
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
    const fetchAssignments = async () => {
      try {
        setLoading(true);
        const response = await httpClient.get<ApiResponse>("/assignments", {
          params: {
            courseId,
            page: currentPage,
            limit: itemsPerPage,
          },
          withCredentials: true,
        });

        const data = response.data;
        if (data?.success && data?.data) {
          setAssignments(data.data);
          if (data.pagination) {
            setTotalPages(data.pagination.totalPages || 1);
            setTotal(data.pagination.total || 0);
          }
        } else if (Array.isArray(data)) {
          // Handle case where API returns array directly
          setAssignments(data);
          setTotalPages(Math.ceil(data.length / itemsPerPage));
          setTotal(data.length);
        } else {
          setAssignments([]);
        }
        setError("");
      } catch (e: unknown) {
        console.error("Error fetching assignments:", e);
        setError("Failed to load assignments");
        setAssignments([]);
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      fetchAssignments();
    }
  }, [courseId, currentPage]);

  const handleNavigate = (assignmentId: string) => {
    navigate(`/assignments/${assignmentId}`);
  };

  const handleViewAll = () => {
    navigate(`/assignments?courseId=${courseId}`);
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
      {assignments.length === 0 ? (
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

export default AssignmentsTab;

