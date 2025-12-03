// src/__tests__/unit/quizAttempt.controller.test.ts

import { CREATED, OK } from '@/constants/http';
import {
  enrollQuizHandler,
  submitQuizHandler,
  saveQuizHandler,
  deleteQuizAttemptHandler,
  banQuizAttemptHandler,
  autoSaveQuizHandler,
  getQuizAttemptByIdHandler,
  gradeQuizAttemptHandler,
  updateQuizAttemptScoreHandler,
} from '@/controller/quizAttempt.controller';

// Mock TOÀN BỘ service + validator trước khi import controller
jest.mock('@/services/quizAttempt.service', () => ({
  enrollQuiz: jest.fn(),
  submitQuizAttempt: jest.fn(),
  saveQuizAttempt: jest.fn(),
  autoSaveQuizAttempt: jest.fn(),
  deleteQuizAttempt: jest.fn(),
  banQuizAttempt: jest.fn(),
  getQuizAttemptById: jest.fn(),
  gradeQuizAttempt: jest.fn(),
  updateQuizAttemptScore: jest.fn(),
}));

jest.mock('@/validators/quizAttempt.schemas', () => ({
  enrollQuizSchema: { parse: jest.fn() },
  submitQuizSchema: { parse: jest.fn() },
  saveQuizSchema: { parse: jest.fn() },
  submitAnswerSchema: { parse: jest.fn() },
  quizAttemptIdSchema: { parse: jest.fn() },
  updateQuizAttemptScoreSchema: { parse: jest.fn() },
}));

import {
  enrollQuiz,
  submitQuizAttempt,
  saveQuizAttempt,
  autoSaveQuizAttempt,
  deleteQuizAttempt,
  banQuizAttempt,
  getQuizAttemptById,
  gradeQuizAttempt,
  updateQuizAttemptScore,
} from '@/services/quizAttempt.service';
import {
  enrollQuizSchema,
  submitQuizSchema,
  saveQuizSchema,
  submitAnswerSchema,
  quizAttemptIdSchema,
  updateQuizAttemptScoreSchema,
} from '@/validators/quizAttempt.schemas';

const mockSuccess = jest.fn();
const mockRes = {
  success: mockSuccess.mockReturnThis(),
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
} as any;

const mockNext = jest.fn();

const baseReq = {
  body: {},
  params: {},
  headers: { 'user-agent': 'Mozilla/Test' },
  userId: 'user123',
  role: 'student',
  socket: { remoteAddress: '127.0.0.1' },
} as any;

beforeEach(() => {
  jest.clearAllMocks();
  mockSuccess.mockImplementation(() => mockRes);
});

describe('QuizAttempt Controller - Pure Unit Tests (100% Isolated)', () => {
  // 1. enrollQuizHandler - cover cả 2 nhánh IP
  describe('enrollQuizHandler', () => {
    it('should enroll successfully with x-forwarded-for', async () => {
      const input = { quizId: 'q1' };
      const result = { _id: 'qa1' };

      (enrollQuizSchema.parse as jest.Mock).mockReturnValue(input);
      (enrollQuiz as jest.Mock).mockResolvedValue(result);

      const req = {
        ...baseReq,
        body: input,
        headers: { ...baseReq.headers, 'x-forwarded-for': '203.0.113.5, 198.51.100.1' },
      };

      await enrollQuizHandler(req, mockRes, mockNext);

      expect(enrollQuiz).toHaveBeenCalledWith({
        ...input,
        user: expect.objectContaining({
          userId: 'user123',
          role: 'student',
          userAgent: 'Mozilla/Test',
          ip: '203.0.113.5', // ← lấy phần đầu tiên
        }),
      });
      expect(mockSuccess).toHaveBeenCalledWith(CREATED, expect.any(Object));
    });

    it('should fallback to remoteAddress when no x-forwarded-for', async () => {
      (enrollQuizSchema.parse as jest.Mock).mockReturnValue({ quizId: 'q1' });
      (enrollQuiz as jest.Mock).mockResolvedValue({});

      const req = {
        ...baseReq,
        body: { quizId: 'q1' },
        headers: { 'user-agent': 'Mozilla/Test' }, // không có x-forwarded-for
        socket: { remoteAddress: '192.168.1.99' },
      };

      await enrollQuizHandler(req, mockRes, mockNext);

      expect(enrollQuiz).toHaveBeenCalledWith({
        quizId: 'q1',
        user: expect.objectContaining({
          ip: '192.168.1.99', // ← phải là cái này → branch được cover
        }),
      });
    });

    it('should call next() on validation error', async () => {
      const err = new Error('Invalid quizId');
      (enrollQuizSchema.parse as jest.Mock).mockImplementation(() => {
        throw err;
      });

      await enrollQuizHandler({ ...baseReq, body: {} }, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledWith(err);
    });
  });

  it('submitQuizHandler - success', async () => {
    (submitQuizSchema.parse as jest.Mock).mockReturnValue({ quizAttemptId: 'qa1' });
    (submitQuizAttempt as jest.Mock).mockResolvedValue({ score: 90 });

    await submitQuizHandler({ ...baseReq, params: { quizAttemptId: 'qa1' } }, mockRes, mockNext);
    expect(submitQuizAttempt).toHaveBeenCalledWith({ quizAttemptId: 'qa1' }, 'user123');
    expect(mockSuccess).toHaveBeenCalledWith(OK, expect.any(Object));
  });

  it('saveQuizHandler - success', async () => {
    const parsed = { quizAttemptId: 'qa1', answers: [] };
    (saveQuizSchema.parse as jest.Mock).mockReturnValue(parsed);
    (saveQuizAttempt as jest.Mock).mockResolvedValue({ saved: true });

    await saveQuizHandler(
      { ...baseReq, params: { quizAttemptId: 'qa1' }, body: { answers: [] } },
      mockRes,
      mockNext
    );
    expect(saveQuizAttempt).toHaveBeenCalledWith(parsed, 'user123');
  });

  it('autoSaveQuizHandler - success', async () => {
    const parsed = { quizAttemptId: 'qa1', answer: { q: 'q1', a: 'A' } };
    (submitAnswerSchema.parse as jest.Mock).mockReturnValue(parsed);
    (autoSaveQuizAttempt as jest.Mock).mockResolvedValue({
      data: { updated: true },
      total: 10,
      answeredTotal: 5,
    });

    await autoSaveQuizHandler(
      { ...baseReq, params: { quizAttemptId: 'qa1' }, body: { answer: {} } },
      mockRes,
      mockNext
    );
    expect(autoSaveQuizAttempt).toHaveBeenCalledWith(parsed, 'user123');
    expect(mockSuccess).toHaveBeenCalledWith(OK, {
      data: expect.any(Object),
      total: 10,
      answeredTotal: 5,
      message: expect.any(String),
    });
  });

  it('deleteQuizAttemptHandler - success', async () => {
    (quizAttemptIdSchema.parse as jest.Mock).mockReturnValue('qa1');
    (deleteQuizAttempt as jest.Mock).mockResolvedValue({ deleted: true });

    await deleteQuizAttemptHandler(
      { ...baseReq, params: { quizAttemptId: 'qa1' }, role: 'teacher' },
      mockRes,
      mockNext
    );
    expect(deleteQuizAttempt).toHaveBeenCalledWith('qa1', 'user123', 'teacher');
  });

  it('banQuizAttemptHandler - success', async () => {
    (quizAttemptIdSchema.parse as jest.Mock).mockReturnValue('qa1');
    (banQuizAttempt as jest.Mock).mockResolvedValue({ banned: true });

    await banQuizAttemptHandler(
      { ...baseReq, params: { quizAttemptId: 'qa1' }, role: 'teacher' },
      mockRes,
      mockNext
    );
    expect(banQuizAttempt).toHaveBeenCalledWith('qa1', 'user123', 'teacher');
  });

  it('getQuizAttemptByIdHandler - success', async () => {
    (quizAttemptIdSchema.parse as jest.Mock).mockReturnValue('qa1');
    (getQuizAttemptById as jest.Mock).mockResolvedValue({ _id: 'qa1' });

    await getQuizAttemptByIdHandler(
      { ...baseReq, params: { quizAttemptId: 'qa1' }, role: 'teacher' },
      mockRes,
      mockNext
    );
    expect(getQuizAttemptById).toHaveBeenCalledWith('qa1', 'user123', 'teacher');
  });

  it('gradeQuizAttemptHandler - success', async () => {
    (quizAttemptIdSchema.parse as jest.Mock).mockReturnValue('qa1');
    (gradeQuizAttempt as jest.Mock).mockResolvedValue({ score: 95 });

    await gradeQuizAttemptHandler(
      { ...baseReq, params: { quizAttemptId: 'qa1' }, role: 'teacher' },
      mockRes,
      mockNext
    );
    expect(gradeQuizAttempt).toHaveBeenCalledWith('qa1', 'user123', 'teacher');
  });

  it('updateQuizAttemptScoreHandler - success', async () => {
    const parsed = { quizAttemptId: 'qa1', score: 88 };
    (updateQuizAttemptScoreSchema.parse as jest.Mock).mockReturnValue(parsed);
    (updateQuizAttemptScore as jest.Mock).mockResolvedValue({ score: 88 });

    await updateQuizAttemptScoreHandler(
      { ...baseReq, params: { quizAttemptId: 'qa1' }, body: { score: 88 }, role: 'teacher' },
      mockRes,
      mockNext
    );
    expect(updateQuizAttemptScore).toHaveBeenCalledWith(parsed, 'user123', 'teacher');
  });

  it('updateQuizAttemptScoreHandler - validation error → next()', async () => {
    const err = new Error('Score invalid');
    (updateQuizAttemptScoreSchema.parse as jest.Mock).mockImplementation(() => {
      throw err;
    });

    await updateQuizAttemptScoreHandler(
      { ...baseReq, params: { quizAttemptId: 'qa1' }, body: { score: 999 } },
      mockRes,
      mockNext
    );
    expect(mockNext).toHaveBeenCalledWith(err);
  });
});
