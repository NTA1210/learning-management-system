import http from "../utils/http";
import type { Subject } from "../types/subject";

export interface SubjectFilters {
  search?: string;
  code?: string;
  specialistId?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "name" | "code" | "updatedAt";
  sortOrder?: "asc" | "desc";
}

export interface SubjectListResponse {
  data: Subject[];
  pagination?: {
    totalItems: number;
    currentPage: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface CreateSubjectData {
  name: string;
  code: string;
  slug: string;
  credits?: number;
  description?: string;
  specialistIds?: string[];
  prerequisites?: string[];
  isActive?: boolean;
}

export interface UpdateSubjectData extends Partial<CreateSubjectData> {}

export const subjectService = {
  // Get all subjects with optional filters
  getAllSubjects: async (filters?: SubjectFilters): Promise<SubjectListResponse> => {
    const params = new URLSearchParams();
    
    if (filters?.search) params.append("search", filters.search);
    if (filters?.code) params.append("code", filters.code);
    if (filters?.specialistId) params.append("specialistId", filters.specialistId);
    if (filters?.isActive !== undefined) params.append("isActive", String(filters.isActive));
    if (filters?.page) params.append("page", String(filters.page));
    if (filters?.limit) params.append("limit", String(filters.limit));
    if (filters?.sortBy) params.append("sortBy", filters.sortBy);
    if (filters?.sortOrder) params.append("sortOrder", filters.sortOrder);

    const queryString = params.toString();
    const url = `/subjects${queryString ? `?${queryString}` : ""}`;

    const response = await http.get<{ data: Subject[] }>(url);

    let subjects: Subject[] = [];
    if (Array.isArray(response.data)) {
      subjects = response.data;
    } else if (response.data && Array.isArray((response.data as any).data)) {
      subjects = (response.data as any).data;
    }

    const pagination =
      response.pagination ||
      response.meta?.pagination ||
      (response.data as any)?.pagination || {
        totalItems: subjects.length,
        currentPage: filters?.page || 1,
        limit: filters?.limit || subjects.length || 10,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      };

    return { data: subjects, pagination };
  },

  // Get subject by ID
  getSubjectById: async (subjectId: string): Promise<Subject> => {
    const response = await http.get<Subject>(`/subjects/${subjectId}`);
    if (!response.data) {
      throw new Error("Subject not found in response");
    }
    return response.data;
  },

  // Create subject
  createSubject: async (data: CreateSubjectData): Promise<Subject> => {
    const response = await http.post<Subject>("/subjects", data);
    return response.data;
  },

  // Update subject by ID
  updateSubject: async (subjectId: string, data: UpdateSubjectData): Promise<Subject> => {
    const response = await http.patch<Subject>(`/subjects/${subjectId}`, data);
    return response.data;
  },

  // Delete subject by ID
  deleteSubject: async (subjectId: string): Promise<void> => {
    await http.del(`/subjects/${subjectId}`);
  },
};

