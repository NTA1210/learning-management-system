import http from "../utils/http";

export interface QuizQuestion {
  _id: string;
  subjectId: string;
  text: string;
  image?: string;
  type: string;
  options?: string[];
  correctOptions?: number[];
  points: number;
  explanation?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface QuizQuestionFilters {
  subjectId?: string;
  type?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortOrder?: "asc" | "desc";
}

export interface QuizQuestionListResponse {
  data: QuizQuestion[];
  pagination: {
    totalItems: number;
    currentPage: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export const quizQuestionService = {
  // Get all quiz questions with optional filters
  getAllQuizQuestions: async (filters?: QuizQuestionFilters): Promise<QuizQuestionListResponse> => {
    const params = new URLSearchParams();
    
    if (filters?.subjectId) params.append("subjectId", filters.subjectId);
    if (filters?.type) params.append("type", filters.type);
    if (filters?.search) params.append("search", filters.search);
    if (filters?.page) params.append("page", String(filters.page));
    if (filters?.limit) params.append("limit", String(filters.limit));
    if (filters?.sortOrder) params.append("sortOrder", filters.sortOrder);

    const queryString = params.toString();
    const url = `/quiz-questions${queryString ? `?${queryString}` : ""}`;
    const response = await http.get<QuizQuestion[]>(url);
    
    // Handle response format - response.data is the array, response.pagination is pagination info
    const questions = Array.isArray(response.data) ? response.data : [];
    const pagination = response.pagination || {
      totalItems: 0,
      currentPage: 1,
      limit: 10,
      totalPages: 0,
      hasNext: false,
      hasPrev: false,
    };
    
    return { data: questions, pagination };
  },
};

