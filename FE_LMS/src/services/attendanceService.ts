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
  status: "notyet" | "present" | "absent";
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
  notyet: number;
  present: number;
  absent: number;
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

export interface CreateAttendanceData {
  courseId: string;
  date: string; // YYYY-MM-DD format
  entries: Array<{
    studentId: string;
    status: "present" | "absent";
  }>;
}

export interface UpdateAttendanceData {
  status: "notyet" | "present" | "absent";
}

export interface CreateAttendanceResponse {
  success: boolean;
  message: string;
  data?: any;
}

export interface StudentAttendanceCounts {
  present: number;
  absent: number;
  notyet?: number;
}

export interface StudentAttendanceAlerts {
  highAbsence: boolean;
}

export interface StudentAttendanceStat {
  studentId: string;
  student: {
    _id: string;
    username: string;
    email: string;
    fullname?: string;
    avatar_url?: string;
  };
  counts: StudentAttendanceCounts;
  totalSessions: number;
  attendanceRate: number;
  absentRate: number;
  longestAbsentStreak: number;
  alerts: StudentAttendanceAlerts;
}

export interface CourseAttendanceStats {
  courseId: string;
  totalStudents: number;
  totalRecords: number;
  classAttendanceRate: number;
  studentsAtRisk: StudentAttendanceStat[];
  studentStats: StudentAttendanceStat[];
  threshold: number;
}

export interface ExportAttendanceResponse {
  format: string;
  summary: {
    total: number;
    notyet: number;
    present: number;
    absent: number;
  };
  csv: string;
  total: number;
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

  createAttendance: async (data: CreateAttendanceData): Promise<CreateAttendanceResponse> => {
    const response = await http.post<CreateAttendanceResponse>("/attendances/", data);
    return response;
  },

  getCourseStats: async (courseId: string): Promise<CourseAttendanceStats> => {
    const response = await http.get<CourseAttendanceStats>(`/attendances/courses/${courseId}/stats`);
    return response.data;
  },

  updateAttendance: async (
    attendanceId: string,
    data: UpdateAttendanceData
  ): Promise<CreateAttendanceResponse> => {
    const response = await http.patch<CreateAttendanceResponse>(`/attendances/${attendanceId}`, data);
    return response;
  },

  deleteAttendance: async (attendanceId: string): Promise<void> => {
    await http.del(`/attendances/${attendanceId}`);
  },

  exportAttendance: async (): Promise<ExportAttendanceResponse> => {
    const response = await http.get<ExportAttendanceResponse>("/attendances/export");
    return response.data;
  },
};

