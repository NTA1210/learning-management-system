export interface Major {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Specialist {
  _id: string;
  name: string;
  description: string;
  slug: string;
  isActive: boolean;
  majorId?: Major | null;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface SpecialistFilters {
  search?: string;
  majorId?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: "name" | "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
}

export interface SpecialistResponse {
  success: boolean;
  message: string;
  data: Specialist[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  meta: {
    timestamp: string;
    timezone: string;
  };
}

