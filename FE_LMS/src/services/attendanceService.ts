import http from "../utils/http";

export interface AttendanceRecord {
  _id: string;
  courseId: {
    _id: string;
    title: string;
    code?: string;
  };
  studentId: string;
  date: string;
  status: "present" | "absent" | "late" | "excused";
  markedBy?: {
    _id: string;
    email: string;
    role: string;
    fullname?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceSummary {
  total: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
}

export interface StudentAttendanceResult {
  data: AttendanceRecord[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  summary?: AttendanceSummary;
}

export const attendanceService = {
  getStudentAttendance: async (
    studentId: string,
    params?: { page?: number; limit?: number; courseId?: string; status?: string }
  ): Promise<StudentAttendanceResult> => {
    const usp = new URLSearchParams();
    if (params?.page) usp.append("page", String(params.page));
    if (params?.limit) usp.append("limit", String(params.limit));
    if (params?.courseId) usp.append("courseId", params.courseId);
    if (params?.status) usp.append("status", params.status);
    const qs = usp.toString();
    const url = `/attendances/students/${studentId}${qs ? `?${qs}` : ""}`;
    const response = await http.get<StudentAttendanceResult>(url);
    return {
      data: Array.isArray(response.data) ? response.data : [],
      pagination: response.pagination,
      summary: response.summary,
    };
  },
};

