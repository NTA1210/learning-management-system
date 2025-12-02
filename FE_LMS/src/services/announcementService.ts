/* eslint-disable @typescript-eslint/no-explicit-any */
import http from "../utils/http";

export interface Announcement {
  _id: string;
  title: string;
  content: string;
  type: 'system' | 'course';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  courseId?: string | { _id: string; title: string };
  isActive: boolean;
  isPinned: boolean;
  createdBy?: string | { _id: string; username: string; fullname?: string };
  createdAt: string;
  updatedAt?: string;
}

export interface AnnouncementPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AnnouncementListResponse {
  data: Announcement[];
  pagination?: AnnouncementPagination;
  message?: string;
}

export interface CreateAnnouncementData {
  title: string;
  content: string;
  type: 'system' | 'course';
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  courseId?: string;
  isActive?: boolean;
  isPinned?: boolean;
}

export interface UpdateAnnouncementData {
  title?: string;
  content?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  isActive?: boolean;
  isPinned?: boolean;
}

export interface GetAnnouncementsParams {
  page?: number;
  limit?: number;
  isActive?: boolean;
  sortOrder?: 'asc' | 'desc';
}

const buildQuery = (params: Record<string, string | number | boolean | undefined>) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
};

export const announcementService = {
  /**
   * Get all announcements (Admin/Teacher only)
   * GET /announcements
   */
  getAllAnnouncements: async (params?: GetAnnouncementsParams): Promise<AnnouncementListResponse> => {
    const query = buildQuery({
      page: params?.page ?? 1,
      limit: params?.limit ?? 10,
    });
    const response = await http.get<AnnouncementListResponse>(`/announcements${query}`);
    
    // Handle both response formats
    const data = Array.isArray(response.data) 
      ? response.data 
      : (response as any)?.data || [];
    const pagination = (response as any)?.pagination || response.pagination;
    
    return { 
      data: data as Announcement[], 
      pagination 
    };
  },

  /**
   * Get system announcements (authenticated users)
   * GET /announcements/system
   */
  getSystemAnnouncements: async (params?: GetAnnouncementsParams): Promise<AnnouncementListResponse> => {
    const query = buildQuery({
      page: params?.page ?? 1,
      limit: params?.limit ?? 10,
    });
    const response = await http.get<AnnouncementListResponse>(`/announcements/system${query}`);
    
    // Handle both response formats
    const data = Array.isArray(response.data) 
      ? response.data 
      : (response as any)?.data || [];
    const pagination = (response as any)?.pagination || response.pagination;
    
    return { 
      data: data as Announcement[], 
      pagination 
    };
  },

  /**
   * Get announcements for a specific course
   * GET /announcements/course/:courseId
   */
  getCourseAnnouncements: async (
    courseId: string, 
    params?: GetAnnouncementsParams
  ): Promise<AnnouncementListResponse> => {
    const query = buildQuery({
      page: params?.page ?? 1,
      limit: params?.limit ?? 10,
    });
    const response = await http.get<AnnouncementListResponse>(
      `/announcements/course/${courseId}${query}`
    );
    
    // Handle both response formats
    const data = Array.isArray(response.data) 
      ? response.data 
      : (response as any)?.data || [];
    const pagination = (response as any)?.pagination || response.pagination;
    
    return { 
      data: data as Announcement[], 
      pagination 
    };
  },

  /**
   * Get announcement by ID
   * GET /announcements/:id
   */
  getAnnouncementById: async (id: string): Promise<Announcement> => {
    const response = await http.get<{ data: Announcement }>(`/announcements/${id}`);
    return response.data as unknown as Announcement;
  },

  /**
   * Create a new announcement (Admin/Teacher only)
   * POST /announcements
   */
  createAnnouncement: async (data: CreateAnnouncementData): Promise<Announcement> => {
    const response = await http.post<{ data: Announcement }>("/announcements", data);
    return response.data as unknown as Announcement;
  },

  /**
   * Update an announcement (Admin/Teacher only)
   * PUT /announcements/:id
   */
  updateAnnouncement: async (id: string, data: UpdateAnnouncementData): Promise<Announcement> => {
    const response = await http.put<{ data: Announcement }>(`/announcements/${id}`, data);
    return response.data as unknown as Announcement;
  },

  /**
   * Delete an announcement (Admin/Teacher only)
   * DELETE /announcements/:id
   */
  deleteAnnouncement: async (id: string): Promise<{ message: string }> => {
    const response = await http.del<{ message: string }>(`/announcements/${id}`);
    return response as unknown as { message: string };
  },
};
