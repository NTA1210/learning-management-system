import http from "../utils/http";
import type { Specialist, SpecialistFilters } from "../types/specialist";

export const specialistService = {
  // Get all specialists with optional filters
  getAllSpecialists: async (filters?: SpecialistFilters): Promise<{ specialists: Specialist[]; pagination: unknown }> => {
    const params = new URLSearchParams();
    
    if (filters?.search) params.append("search", filters.search);
    if (filters?.majorId) params.append("majorId", filters.majorId);
    if (filters?.isActive !== undefined) params.append("isActive", String(filters.isActive));
    if (filters?.page) params.append("page", String(filters.page));
    if (filters?.limit) params.append("limit", String(filters.limit));
    if (filters?.sortBy) params.append("sortBy", filters.sortBy);
    if (filters?.sortOrder) params.append("sortOrder", filters.sortOrder);

    const queryString = params.toString();
    const url = `/specialists${queryString ? `?${queryString}` : ""}`;
    const response = await http.get<Specialist[]>(url);
    
    // Handle response format - response.data is an array, pagination is at top level
    const specialists = Array.isArray(response.data) ? response.data : [];
    // Pagination can be at response.pagination or response.meta?.pagination
    const pagination = response.pagination || (response as any).meta?.pagination;
    
    return { specialists, pagination };
  },

  // Get a single specialist by ID
  getSpecialistById: async (id: string): Promise<Specialist> => {
    const response = await http.get<Specialist>(`/specialists/${id}`);
    return response.data;
  },
};

