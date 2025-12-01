import http from "../utils/http";

export interface Assignment {
  _id: string;
  title: string;
  description?: string;
  courseId: string | { _id: string; title: string; code?: string };
  dueDate: string;
  maxScore: number;
  fileUrl?: string;
  allowResubmit?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AssignmentsResponse {
  data: Assignment[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface AssignmentListParams {
  page?: number;
  limit?: number;
  courseId?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export const assignmentService = {
  // List assignments with optional filters
  listAssignments: async (params?: AssignmentListParams): Promise<AssignmentsResponse> => {
    const usp = new URLSearchParams();
    if (params?.page) usp.append("page", String(params.page));
    if (params?.limit) usp.append("limit", String(params.limit));
    if (params?.courseId) usp.append("courseId", params.courseId);
    if (params?.sortBy) usp.append("sortBy", params.sortBy);
    if (params?.sortOrder) usp.append("sortOrder", params.sortOrder);
    
    const qs = usp.toString();
    const url = `/assignments${qs ? `?${qs}` : ""}`;
    
    const response = await http.get<AssignmentsResponse>(url);
    return {
      data: Array.isArray(response.data) ? response.data : [],
      pagination: response.pagination,
    };
  },

  // Get assignment by ID
  getAssignmentById: async (id: string): Promise<Assignment> => {
    const response = await http.get<Assignment>(`/assignments/${id}`);
    return response.data;
  },
};
