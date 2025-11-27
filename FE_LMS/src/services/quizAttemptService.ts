import http from "../utils/http";
import type { QuizResponse } from "./quizService";

export interface QuizAttempt {
  _id: string;
  quizId: string | QuizResponse;
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
  text?: string;
  options?: string[];
  type?: string;
  images?: Array<{ url: string; fromDB?: boolean }>;
  explanation?: string;
  points?: number;
}

export interface QuizAnswerPayload {
  questionId: string;
  answer: number[];
}

export interface EnrollQuizInput {
  quizId: string;
  hashPassword: string;
}

export interface SubmitQuizInput {
  quizAttemptId: string;
}

export interface SubmitQuizResponse {
  totalQuestions: number;
  totalScore: number;
  totalQuizScore: number;
  scorePercentage: number;
  failedQuestions: QuizAnswer[];
  passedQuestions: QuizAnswer[];
  answersSubmitted: QuizAnswer[];
}

export interface AutoSaveInput {
  quizAttemptId: string;
  questionId: string;
  answer: number[];
}

export interface AutoSaveResult {
  attempt: QuizAttempt;
  total: number;
  answeredTotal: number;
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
   * Get quiz attempt details
   * GET /quiz-attempts/:quizAttemptId
   */
  getQuizAttempt: async (quizAttemptId: string): Promise<QuizAttempt> => {
    const response = await http.get<QuizAttempt>(`/quiz-attempts/${quizAttemptId}`);
    return response.data;
  },

  /**
   * Submit quiz attempt
   * POST /quiz-attempts/:quizAttemptId/submit
   */
  submitQuiz: async (input: SubmitQuizInput): Promise<SubmitQuizResponse> => {
    const response = await http.put<SubmitQuizResponse>(
      `/quiz-attempts/${input.quizAttemptId}/submit`,
      {}
    );
    return response.data;
  },

  /**
   * Auto save a single question
   * POST /quiz-attempts/:quizAttemptId/auto-save
   */
  autoSaveAnswer: async (input: AutoSaveInput): Promise<AutoSaveResult> => {
    const response = await http.put<{
      data: QuizAttempt;
      total: number;
      answeredTotal: number;
    }>(`/quiz-attempts/${input.quizAttemptId}/auto-save`, {
      answer: {
        questionId: input.questionId,
        answer: input.answer,
      },
    });

    return {
      attempt: response.data,
      total: response.total ?? 0,
      answeredTotal: response.answeredTotal ?? 0,
    };
  },
};

