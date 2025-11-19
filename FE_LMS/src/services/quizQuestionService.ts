import http from "../utils/http";

export interface QuizQuestionImage {
  url: string;
  fromDB?: boolean; // true = ảnh trong kho (có thể tái sử dụng), false = ảnh được upload từ createquiz
}

export interface QuizQuestion {
  _id: string;
  subjectId: string | { _id: string; code?: string; name?: string };
  text: string;
  image?: string;
  images?: string[] | QuizQuestionImage[]; // Có thể là array string hoặc array object với fromDB
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
  option?: string;
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
    if (filters?.option) params.append("option", filters.option);

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

  // Update a quiz question
  updateQuizQuestion: async (
    questionId: string,
    payload: {
      subjectId?: string;
      text?: string;
      type?: string;
      points?: number;
      options?: string[];
      correctOptions?: number[];
      explanation?: string;
      newImages?: File[];
      deletedKeys?: string[];
    }
  ): Promise<QuizQuestion> => {
    const formData = new FormData();

    Object.entries(payload).forEach(([key, value]) => {
      if (value === undefined || value === null) return;

      if (key === "newImages" || key === "deletedKeys") {
        return;
      }

      if (Array.isArray(value)) {
        formData.append(key, JSON.stringify(value));
        return;
      }

      formData.append(key, value.toString());
    });

    if (payload.deletedKeys && payload.deletedKeys.length > 0) {
      formData.append("deletedKeys", JSON.stringify(payload.deletedKeys));
    }

    if (payload.newImages && payload.newImages.length > 0) {
      payload.newImages.forEach((file) => {
        formData.append("files", file);
      });
    }

    const response = await http.put(`/quiz-questions/${questionId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return response.data;
  },

  importQuizFromXml: async (subjectId: string, file: File) => {
    const formData = new FormData();
    formData.append("subjectId", subjectId);
    formData.append("file", file);

    const response = await http.post("/quiz-questions/import", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    // API shape: { success, data, total, importedTypes }
    return response.data;
  },

  // Delete a quiz question
  deleteQuizQuestion: async (questionId: string, question?: QuizQuestion): Promise<void> => {
    // If question is not provided, try to get it from the current questions
    let questionToDelete = question;
    
    if (!questionToDelete) {
      // Fallback: get the question (but this should be avoided if possible)
      const questions = await quizQuestionService.getAllQuizQuestions({ limit: 1000 });
      questionToDelete = questions.data.find((q) => q._id === questionId);
    }
    
    // Delete images that are not from DB (fromDB === false)
    if (questionToDelete?.images && Array.isArray(questionToDelete.images)) {
      for (const image of questionToDelete.images) {
        let imageUrl: string;
        let fromDB = true; // Default to true for safety

        if (typeof image === "string") {
          imageUrl = image;
          // If it's a string, assume it's from DB (existing images in database)
          fromDB = true;
        } else if (typeof image === "object" && image !== null) {
          const imgObj = image as QuizQuestionImage;
          imageUrl = imgObj.url;
          fromDB = imgObj.fromDB ?? true; // Default to true if not specified
        } else {
          continue;
        }

        // Only delete if fromDB === false (images uploaded from createquiz)
        if (!fromDB && imageUrl) {
          try {
            const deleteImageUrl = `/quiz-questions/image?url=${encodeURIComponent(imageUrl)}`;
            await http.del(deleteImageUrl);
            console.log("Deleted image:", imageUrl);
          } catch (error) {
            console.error("Error deleting image:", imageUrl, error);
            // Continue with question deletion even if image deletion fails
          }
        }
      }
    }

    // Delete the question
    const deleteQuestionUrl = `/quiz-questions/${questionId}`;
    await http.del(deleteQuestionUrl);
  },
};


