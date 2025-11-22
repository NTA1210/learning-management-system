import http from "../utils/http";
import type { Major } from "../types/specialist";

export interface MajorFilters {
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: "name" | "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
}

export interface CreateMajorData {
  name: string;
  slug: string;
  description?: string;
}

export interface UpdateMajorData {
  name?: string;
  description?: string;
}

export const majorService = {
  // Get all majors with optional filters
  getAllMajors: async (filters?: MajorFilters): Promise<{ majors: Major[]; pagination: unknown }> => {
    const params = new URLSearchParams();
    
    if (filters?.search) params.append("search", filters.search);
    if (filters?.page) params.append("page", String(filters.page));
    if (filters?.limit) params.append("limit", String(filters.limit));
    if (filters?.sortBy) params.append("sortBy", filters.sortBy);
    if (filters?.sortOrder) params.append("sortOrder", filters.sortOrder);

    const queryString = params.toString();
    const url = `/majors${queryString ? `?${queryString}` : ""}`;
    const response = await http.get<Major[]>(url);
    
    // Handle response format - response.data is an array, pagination is at top level
    const majors = Array.isArray(response.data) ? response.data : [];
    // Pagination can be at response.pagination or response.meta?.pagination
    const pagination = response.pagination || (response as any).meta?.pagination;
    
    return { majors, pagination };
  },

  // Get a single major by ID
  getMajorById: async (id: string): Promise<Major> => {
    const response = await http.get<Major>(`/majors/id/${id}`);
    return response.data;
  },

  // Create a new major
  createMajor: async (data: CreateMajorData): Promise<Major> => {
    const response = await http.post<Major>("/majors", data);
    return response.data;
  },

  // Update an existing major by ID
  updateMajor: async (id: string, data: UpdateMajorData): Promise<Major> => {
    const response = await http.patch<Major>(`/majors/id/${id}`, data);
    return response.data;
  },

  // Delete a major by ID
  deleteMajor: async (id: string): Promise<void> => {
    await http.del(`/majors/id/${id}`);
  },
};

