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
    const response = await http.get<SubmissionStatus>(`/submissions/${assignmentId}/status`);
    return response.data;
  },

  // Get submission by ID
  getSubmissionById: async (submissionId: string): Promise<GradeItem> => {
    const response = await http.get<GradeItem>(`/submissions/${submissionId}`);
    return response.data;
  },

  // Submit an assignment
  submitAssignment: async (assignmentId: string, file: File): Promise<GradeItem> => {
    const formData = new FormData();
    formData.append("assignmentId", assignmentId);
    formData.append("file", file);

    const response = await http.post("/submissions", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  // Resubmit an assignment
  resubmitAssignment: async (assignmentId: string, file: File): Promise<GradeItem> => {
    const formData = new FormData();
    formData.append("assignmentId", assignmentId);
    formData.append("file", file);

    const response = await http.put("/submissions", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },
};
