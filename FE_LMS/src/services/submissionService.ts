/* eslint-disable @typescript-eslint/no-explicit-any */
import http from "../utils/http";

export interface GradeItem {
  _id: string;
  assignmentId: {
    _id: string;
    title: string;
    courseId: string | { _id: string; title: string };
    maxScore: number;
    dueDate: string;
  };
  studentId: string;
  grade?: number;
  feedback?: string;
  submittedAt: string;
  gradedAt?: string;
  gradedBy?: {
    _id: string;
    fullname?: string;
    email: string;
  };
  status: string;
  fileUrl?: string;
}

export interface GradesResponse {
  data: GradeItem[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  summary?: {
    totalAssignments: number;
    gradedCount: number;
    averageGrade: number;
  };
}

export interface SubmissionStatus {
  submitted: boolean;
  submissionId?: string;
  submittedAt?: string;
  grade?: number;
  feedback?: string;
  status?: string;
}

export interface SubmissionStats {
  totalSubmissions: number;
  gradedSubmissions: number;
  pendingSubmissions: number;
  averageGrade?: number;
  highestGrade?: number;
  lowestGrade?: number;
}

export interface SubmissionListItem {
  _id: string;
  studentId: {
    _id: string;
    username: string;
    email: string;
    fullname?: string;
  };
  assignmentId: string;
  fileUrl?: string;
  grade?: number;
  feedback?: string;
  status: string;
  submittedAt: string;
  gradedAt?: string;
  gradedBy?: string;
}

export interface SubmissionListResponse {
  data: SubmissionListItem[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CourseReport {
  courseId: string;
  totalAssignments: number;
  totalSubmissions: number;
  gradedSubmissions: number;
  averageGrade?: number;
  submissionRate?: number;
}

export const submissionService = {
  // Get all grades for the current student
  getMyGrades: async (): Promise<GradesResponse> => {
    const response = await http.get<GradesResponse>("/submissions/my/grades");
    return {
      data: Array.isArray(response.data) ? response.data : [],
      pagination: response.pagination,
      summary: response.summary,
    };
  },

  // Get submission status for a specific assignment
  getSubmissionStatus: async (assignmentId: string): Promise<SubmissionStatus> => {
    const response = await http.get<SubmissionStatus | { data: SubmissionStatus }>(`/submissions/${assignmentId}/status`);
    if ((response as { data: SubmissionStatus }).data) {
      return (response as { data: SubmissionStatus }).data;
    }
    return response as SubmissionStatus;
  },

  // Get submission by ID
  getSubmissionById: async (submissionId: string): Promise<GradeItem> => {
    const response = await http.get<GradeItem | { data: GradeItem }>(`/submissions/${submissionId}`);
    if ((response as { data: GradeItem }).data) {
      return (response as { data: GradeItem }).data;
    }
    return response as GradeItem;
  },

  // Submit an assignment
  submitAssignment: async (assignmentId: string, file: File): Promise<GradeItem> => {
    const formData = new FormData();
    formData.append("assignmentId", assignmentId);
    formData.append("file", file);

    const response = await http.post<any>("/submissions", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data || response;
  },

  // Resubmit an assignment
  resubmitAssignment: async (assignmentId: string, file: File): Promise<GradeItem> => {
    const formData = new FormData();
    formData.append("assignmentId", assignmentId);
    formData.append("file", file);

    const response = await http.put<any>("/submissions", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data || response;
  },

  /**
   * Get submission statistics for an assignment (Teacher/Admin only)
   * GET /submissions/:assignmentId/stats
   */
  getSubmissionStats: async (assignmentId: string): Promise<SubmissionStats> => {
    const response = await http.get<SubmissionStats | { data: SubmissionStats }>(
      `/submissions/${assignmentId}/stats`
    );
    if ((response as { data: SubmissionStats }).data) {
      return (response as { data: SubmissionStats }).data;
    }
    return response as SubmissionStats;
  },

  /**
   * Get all submissions for an assignment (Teacher/Admin only)
   * GET /submissions/:assignmentId/all
   */
  listSubmissionsByAssignment: async (
    assignmentId: string,
    params?: { page?: number; limit?: number }
  ): Promise<SubmissionListResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", String(params.page));
    if (params?.limit) queryParams.append("limit", String(params.limit));
    
    const queryString = queryParams.toString();
    const url = `/submissions/${assignmentId}/all${queryString ? `?${queryString}` : ""}`;
    const response = await http.get<any>(url);
    
    return {
      data: Array.isArray(response.data) ? response.data : Array.isArray(response) ? response : [],
      pagination: response?.pagination,
    };
  },

  /**
   * Get submission report for an assignment (Teacher/Admin only)
   * GET /submissions/:assignmentId/report
   */
  getSubmissionReport: async (assignmentId: string): Promise<any> => {
    const response = await http.get<any>(`/submissions/${assignmentId}/report`);
    return response.data || response;
  },

  /**
   * Get course-wide submission report (Teacher/Admin only)
   * GET /submissions/course/:courseId/report
   */
  getCourseReport: async (courseId: string): Promise<CourseReport> => {
    const response = await http.get<CourseReport | { data: CourseReport }>(
      `/submissions/course/${courseId}/report`
    );
    if ((response as { data: CourseReport }).data) {
      return (response as { data: CourseReport }).data;
    }
    return response as CourseReport;
  },

  /**
   * Grade a submission (Teacher/Admin only)
   * PUT /submissions/:assignmentId/grade
   */
  gradeSubmission: async (
    assignmentId: string,
    data: { studentId: string; grade: number; feedback?: string }
  ): Promise<GradeItem> => {
    const response = await http.put<GradeItem | { data: GradeItem }>(
      `/submissions/${assignmentId}/grade`,
      data
    );
    if ((response as { data: GradeItem }).data) {
      return (response as { data: GradeItem }).data;
    }
    return response as GradeItem;
  },

  /**
   * Grade a submission by submission ID (Teacher/Admin only)
   * PUT /submissions/by-submission/:submissionId/grade
   */
  gradeSubmissionById: async (
    submissionId: string,
    data: { grade: number; feedback?: string }
  ): Promise<GradeItem> => {
    const response = await http.put<GradeItem | { data: GradeItem }>(
      `/submissions/by-submission/${submissionId}/grade`,
      data
    );
    if ((response as { data: GradeItem }).data) {
      return (response as { data: GradeItem }).data;
    }
    return response as GradeItem;
  },
};
