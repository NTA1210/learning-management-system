import http from "../utils/http";

export interface EnrollmentUser {
  _id: string;
  username: string;
  email: string;
  fullname?: string;
}

export interface EnrollmentItem {
  _id: string;
  userId: EnrollmentUser;
  courseId: string;
  status: string;
  role: string;
  enrolledAt: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
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
    // This endpoint returns pagination nested under data.pagination
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
};


