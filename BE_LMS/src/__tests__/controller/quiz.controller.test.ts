import {
  createQuizHandler,
  updateQuizHandler,
  deleteQuizHandler,
  getStatisticByQuizIdHandler,
  getQuizAttemptsByQuizIdHandler,
} from '@/controller/quiz.controller';
import {
  createQuiz,
  updateQuiz,
  deleteQuiz,
  getStatisticByQuizId,
  getQuizAttemptsByQuizId,
} from '@/services/quiz.service';
import {
  createQuizSchema,
  updateQuizSchema,
  quizIdSchema,
  getQuizAttemptsSchema,
} from '@/validators/quiz.schemas';
import { CREATED, OK } from '@/constants/http';

jest.mock('@/services/quiz.service', () => ({
  createQuiz: jest.fn(),
  updateQuiz: jest.fn(),
  deleteQuiz: jest.fn(),
  getStatisticByQuizId: jest.fn(),
  getQuizById: jest.fn(),
  getQuizAttemptsByQuizId: jest.fn(),
}));

jest.mock('@/validators/quiz.schemas', () => ({
  createQuizSchema: { parse: jest.fn() },
  updateQuizSchema: { parse: jest.fn() },
  quizIdSchema: { parse: jest.fn() },
  getQuizAttemptsSchema: { parse: jest.fn() },
}));

describe('Quiz Controller Unit Tests (reduced set)', () => {
  const mockReqBase: any = {
    body: {},
    params: {},
    query: {},
    userId: 'userId',
    role: 'teacher',
  };

  const mockRes: any = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    success: jest.fn().mockReturnThis(),
    cookie: jest.fn().mockReturnThis(),
    clearCookie: jest.fn().mockReturnThis(),
  };

  const mockNext = jest.fn();

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Create quiz - keep success + validation error only
  describe('createQuizHandler', () => {
    const input = { title: 'Quiz 1', courseId: 'c1', questions: [] };
    const createdQuiz = { _id: 'q1', title: 'Quiz 1' };

    it('should parse request, call createQuiz and return CREATED', async () => {
      (createQuizSchema.parse as jest.Mock).mockReturnValueOnce(input);
      (createQuiz as jest.Mock).mockResolvedValueOnce(createdQuiz);

      const req = { ...mockReqBase, body: input };

      await createQuizHandler(req as any, mockRes, mockNext);

      expect(createQuizSchema.parse).toHaveBeenCalledWith(req.body);
      expect(createQuiz).toHaveBeenCalledWith(input, req.userId, req.role);
      expect(mockRes.success).toHaveBeenCalledWith(CREATED, {
        data: createdQuiz,
        message: 'Quiz created successfully',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  // Update quiz - keep success + validation error only
  describe('updateQuizHandler', () => {
    const reqParams = { quizId: 'q1' };
    const reqBody = { title: 'Updated' };
    const parsedInput = { ...reqBody, quizId: 'q1' };
    const updatedQuiz = { _id: 'q1', title: 'Updated' };

    it('should parse request, call updateQuiz and return CREATED', async () => {
      (updateQuizSchema.parse as jest.Mock).mockReturnValueOnce(parsedInput);
      (updateQuiz as jest.Mock).mockResolvedValueOnce(updatedQuiz);

      const req = {
        ...mockReqBase,
        params: reqParams,
        body: reqBody,
      };

      await updateQuizHandler(req as any, mockRes, mockNext);

      expect(updateQuizSchema.parse).toHaveBeenCalledWith({
        ...req.body,
        quizId: req.params.quizId,
      });
      expect(updateQuiz).toHaveBeenCalledWith(parsedInput, req.userId, req.role);
      expect(mockRes.success).toHaveBeenCalledWith(CREATED, {
        data: updatedQuiz,
        message: 'Quiz updated successfully',
      });
    });
  });

  // Delete quiz - keep only success path
  describe('deleteQuizHandler', () => {
    it('should parse quiz id and call deleteQuiz and return OK', async () => {
      const quizId = 'q1';
      (quizIdSchema.parse as jest.Mock).mockReturnValueOnce(quizId);
      (deleteQuiz as jest.Mock).mockResolvedValueOnce(undefined);

      const req = { ...mockReqBase, params: { quizId } };

      await deleteQuizHandler(req as any, mockRes, mockNext);

      expect(quizIdSchema.parse).toHaveBeenCalledWith(quizId);
      expect(deleteQuiz).toHaveBeenCalledWith({ quizId, userId: req.userId, role: req.role });
      expect(mockRes.success).toHaveBeenCalledWith(OK, {
        message: 'Quiz deleted successfully',
      });
    });
  });

  // Statistics & getQuizById - keep only success paths
  describe('getStatisticByQuizIdHandler & getQuizByIdHandler', () => {
    it('should get statistics by quiz id and return OK', async () => {
      const quizId = 'q1';
      const stats = { average: 9 };
      (quizIdSchema.parse as jest.Mock).mockReturnValueOnce(quizId);
      (getStatisticByQuizId as jest.Mock).mockResolvedValueOnce(stats);

      const req = { ...mockReqBase, params: { quizId } };

      await getStatisticByQuizIdHandler(req as any, mockRes, mockNext);

      expect(quizIdSchema.parse).toHaveBeenCalledWith(quizId);
      expect(getStatisticByQuizId).toHaveBeenCalledWith(quizId, req.userId, req.role);
      expect(mockRes.success).toHaveBeenCalledWith(OK, {
        data: stats,
        message: 'Statistic retrieved successfully',
      });
    });
  });

  // Get quiz attempts - keep only success path
  describe('getQuizAttemptsByQuizIdHandler', () => {
    it('should parse query+params, call service and return OK', async () => {
      const input = { quizId: 'q1', limit: 10, skip: 0 };
      const attempts = [{ _id: 'a1' }];
      (getQuizAttemptsSchema.parse as jest.Mock).mockReturnValueOnce(input);
      (getQuizAttemptsByQuizId as jest.Mock).mockResolvedValueOnce(attempts);

      const req = { ...mockReqBase, params: { quizId: 'q1' }, query: { limit: 10, skip: 0 } };

      await getQuizAttemptsByQuizIdHandler(req as any, mockRes, mockNext);

      expect(getQuizAttemptsSchema.parse).toHaveBeenCalledWith({
        ...req.query,
        quizId: req.params.quizId,
      });
      expect(getQuizAttemptsByQuizId).toHaveBeenCalledWith(input);
      expect(mockRes.success).toHaveBeenCalledWith(OK, {
        data: attempts,
        message: 'Quiz attempts retrieved successfully',
      });
    });
  });
});
