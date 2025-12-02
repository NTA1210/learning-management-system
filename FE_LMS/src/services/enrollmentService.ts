import http from "../utils/http";

export interface EnrollmentUser {
  _id: string;
  username: string;
  email: string;
  fullname?: string;
}

export interface EnrollmentItem {
  _id: string;
  userId?: EnrollmentUser; // Legacy field - some endpoints return this
  studentId?: EnrollmentUser; // Actual API returns studentId for getByCourse
  courseId: string;
  status: string;
  role: string;
  enrolledAt?: string;
  method?: string;
  createdAt?: string;
  updatedAt?: string;
  respondedAt?: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
}

export interface StudentRef {
  _id: string;
  username: string;
  email: string;
  fullname?: string;
  avatar_url?: string;
}

export interface CourseRef {
  _id: string;
  title: string;
  description?: string;
}

export interface ApiEnrollmentRecord {
  _id: string;
  studentId: StudentRef;
  courseId: CourseRef;
  status: string;
  method?: string;
  role?: string;
  progress?: { totalLessons: number; completedLessons: number };
  createdAt: string;
  updatedAt?: string;
  respondedBy?: string;
  respondedAt?: string;
}

export const enrollmentService = {
  getByCourse: async (
    courseId: string,
    params?: { page?: number; limit?: number }
  ): Promise<{ enrollments: EnrollmentItem[]; pagination: PaginationMeta | undefined }> => {
    const usp = new URLSearchParams();
    if (params?.page) usp.append("page", String(params.page));
    if (params?.limit) usp.append("limit", String(params.limit));
    const qs = usp.toString();
    const url = `/enrollments/course/${courseId}${qs ? `?${qs}` : ""}`;
    const response = await http.get<{ enrollments: EnrollmentItem[]; pagination?: PaginationMeta }>(url);
    const dataAny = response.data as unknown as any;
    const enrollments: EnrollmentItem[] = Array.isArray(dataAny?.enrollments)
      ? dataAny.enrollments
      : Array.isArray(dataAny)
      ? dataAny
      : [];
    const pagination: PaginationMeta | undefined = dataAny?.pagination
      ? (dataAny.pagination as PaginationMeta)
      : undefined;
    return { enrollments, pagination };
  },

  listAll: async (
    params?: { page?: number; limit?: number; status?: string; courseId?: string; studentId?: string }
  ): Promise<{ items: ApiEnrollmentRecord[]; pagination?: PaginationMeta; message?: string }> => {
    const usp = new URLSearchParams();
    if (params?.page) usp.append("page", String(params.page));
    if (params?.limit) usp.append("limit", String(params.limit));
    if (params?.status) usp.append("status", params.status);
    if (params?.courseId) usp.append("courseId", params.courseId);
    if (params?.studentId) usp.append("studentId", params.studentId);
    const qs = usp.toString();
    const url = `/enrollments${qs ? `?${qs}` : ""}`;
    const response = await http.get<{ data: ApiEnrollmentRecord[]; pagination?: PaginationMeta; message?: string }>(url);
    const items: ApiEnrollmentRecord[] = Array.isArray(response.data) ? (response.data as ApiEnrollmentRecord[]) : [];
    const pagination: PaginationMeta | undefined = (response as any)?.pagination || (response.meta?.pagination as PaginationMeta | undefined);
    const message = (response as any)?.message;
    return { items, pagination, message };
  },

  create: async (
    data: { userId: string; courseId: string; status?: "pending" | "approved"; role?: string }
  ): Promise<ApiEnrollmentRecord> => {
    const payload = {
      studentId: data.userId,
      courseId: data.courseId,
      status: data.status,
      role: data.role,
    };
    const response = await http.post<ApiEnrollmentRecord>("/enrollments", payload);
    const created = response.data as unknown as ApiEnrollmentRecord;
    return created;
  },

  getByStudent: async (
    studentId: string,
    params?: { page?: number; limit?: number; status?: string }
  ): Promise<{ items: ApiEnrollmentRecord[]; pagination?: PaginationMeta }> => {
    const usp = new URLSearchParams();
    if (params?.page) usp.append("page", String(params.page));
    if (params?.limit) usp.append("limit", String(params.limit));
    if (params?.status) usp.append("status", params.status);
    const qs = usp.toString();
    const url = `/enrollments/student/${studentId}${qs ? `?${qs}` : ""}`;
    const response = await http.get<{ data: ApiEnrollmentRecord[]; pagination?: PaginationMeta }>(url);
    const items: ApiEnrollmentRecord[] = Array.isArray(response.data) ? (response.data as ApiEnrollmentRecord[]) : [];
    const pagination: PaginationMeta | undefined = response.pagination || (response as any).meta?.pagination;
    return { items, pagination };
  },
};


