import http from "../utils/http";

export interface QuizAttempt {
  _id: string;
  quizId: string;
  studentId: string;
  status: "in_progress" | "submitted" | "abandoned";
  startTime: string;
  submittedAt?: string;
  answers?: QuizAnswer[];
  totalScore?: number;
  totalQuizScore?: number;
  scorePercentage?: number;
}

export interface QuizAnswer {
  questionId: string;
  answer: number[]; // Array of 0s and 1s
  correct?: boolean;
  pointsEarned?: number;
}

export interface EnrollQuizInput {
  quizId: string;
  hashPassword: string;
}

export interface SubmitQuizInput {
  quizAttemptId: string;
  answers: QuizAnswer[];
}

export interface SubmitQuizResponse {
  totalQuestions: number;
  totalScore: number;
  totalQuizScore: number;
  scorePercentage: number;
  failedQuestions: any[];
  passedQuestions: any[];
  answersSubmitted: QuizAnswer[];
}

export const quizAttemptService = {
  /**
   * Enroll in a quiz (start quiz attempt)
   * POST /quiz-attempts/enroll
   */
  enrollQuiz: async (input: EnrollQuizInput): Promise<QuizAttempt> => {
    const response = await http.post<QuizAttempt>("/quiz-attempts/enroll", input);
    return response.data;
  },

  /**
   * Submit quiz attempt
   * PUT /quiz-attempts/:quizAttemptId/submit
   */
  submitQuiz: async (input: SubmitQuizInput): Promise<SubmitQuizResponse> => {
    const response = await http.put<SubmitQuizResponse>(
      `/quiz-attempts/${input.quizAttemptId}/submit`,
      { answers: input.answers }
    );
    return response.data;
  },

  /**
   * Save quiz attempt (auto-save during quiz)
   * PUT /quiz-attempts/:quizAttemptId/save
   */
  saveQuiz: async (input: SubmitQuizInput): Promise<QuizAttempt> => {
    const response = await http.put<QuizAttempt>(
      `/quiz-attempts/${input.quizAttemptId}/save`,
      { answers: input.answers }
    );
    return response.data;
  },
};

