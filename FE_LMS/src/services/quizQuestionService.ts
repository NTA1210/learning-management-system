import http from "../utils/http";

export interface QuizQuestion {
  _id: string;
  subjectId: string | { _id: string; code?: string; name?: string };
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
    
    const baseUrl = import.meta.env.VITE_BASE_API || "";
    console.log("QuizQuestionService: Base URL from env:", baseUrl);
    console.log("QuizQuestionService: Full URL will be:", `${baseUrl}${url}`);
    console.log("QuizQuestionService: Fetching from URL:", url);
    console.log("QuizQuestionService: Filters:", filters);
    
    const response = await http.get<QuizQuestion[]>(url);
    console.log("QuizQuestionService: Raw response:", response);
    console.log("QuizQuestionService: Response type:", typeof response);
    console.log("QuizQuestionService: Response.data type:", typeof response.data);
    console.log("QuizQuestionService: Response.data is array?", Array.isArray(response.data));
    
    // Handle response format - có thể là response.data hoặc response trực tiếp
    let questions: QuizQuestion[] = [];
    
    // Thử nhiều format response
    if (Array.isArray(response.data)) {
      questions = response.data;
    } else if (Array.isArray(response)) {
      questions = response;
    } else if (response.data && Array.isArray(response.data.data)) {
      questions = response.data.data;
    } else if (response.data && Array.isArray(response.data)) {
      questions = response.data;
    }
    
    console.log("QuizQuestionService: Parsed questions:", questions);
    
    const pagination = response.meta?.pagination || response.pagination || {
      totalItems: questions.length,
      currentPage: filters?.page || 1,
      limit: filters?.limit || 10,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
    };
    
    return { data: questions, pagination };
  },
};


