import http, { httpClient } from "../utils/http";

export interface Subject {
  _id: string;
  code: string;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SubjectFilters {
  search?: string;
  code?: string;
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

export const subjectService = {
  // Get all subjects with optional filters
  getAllSubjects: async (filters?: SubjectFilters): Promise<SubjectListResponse> => {
    const params = new URLSearchParams();
    
    if (filters?.search) params.append("search", filters.search);
    if (filters?.code) params.append("code", filters.code);
    if (filters?.page) params.append("page", String(filters.page));
    if (filters?.limit) params.append("limit", String(filters.limit));
    if (filters?.sortBy) params.append("sortBy", filters.sortBy);
    if (filters?.sortOrder) params.append("sortOrder", filters.sortOrder);

    const queryString = params.toString();
    const url = `/subjects${queryString ? `?${queryString}` : ""}`;
    
    console.log("SubjectService: Fetching from URL:", url);
    const response = await http.get<Subject[]>(url);
    console.log("SubjectService: Raw response:", response);
    
    // Handle response format - có thể là response.data hoặc response trực tiếp
    let subjects: Subject[] = [];
    
    // Thử nhiều format response
    if (Array.isArray(response.data)) {
      subjects = response.data;
    } else if (Array.isArray(response)) {
      subjects = response;
    } else if (response.data && Array.isArray(response.data.data)) {
      subjects = response.data.data;
    } else if (response.data && Array.isArray(response.data)) {
      subjects = response.data;
    }
    
    console.log("SubjectService: Parsed subjects:", subjects);
    
    const pagination = response.meta?.pagination || response.pagination || {
      totalItems: subjects.length,
      currentPage: filters?.page || 1,
      limit: filters?.limit || 10,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
    };
    
    return { data: subjects, pagination };
  },

  // Get subject by ID
  getSubjectById: async (subjectId: string): Promise<Subject> => {
    console.log("SubjectService: Fetching subject by ID:", subjectId);
    const url = `/subjects/${subjectId}`;
    console.log("SubjectService: URL:", url);
    
    try {
      const response = await http.get<Subject>(url);
      console.log("SubjectService: Response:", response);
      
      if (!response.data) {
        throw new Error("Subject not found in response");
      }
      
      return response.data;
    } catch (error) {
      console.error("SubjectService: Error fetching subject:", error);
      throw error;
    }
  },
};

