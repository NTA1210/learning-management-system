import { CREATED, OK } from '@/constants/http';
import {
  autoSaveQuizAttempt,
  banQuizAttempt,
  deleteQuizAttempt,
  enrollQuiz,
  saveQuizAttempt,
  submitQuizAttempt,
} from '@/services/quizAttempt.service';
import { catchErrors } from '@/utils/asyncHandler';
import {
  enrollQuizSchema,
  quizAttemptIdSchema,
  saveQuizSchema,
  submitAnswerSchema,
  submitQuizSchema,
} from '@/validators/quizAttempt.schemas';

// POST /quiz-attempts/enroll - Enroll in a quiz
export const enrollQuizHandler = catchErrors(async (req, res) => {
  const input = enrollQuizSchema.parse(req.body);
  const { userId } = req;
  const userAgent = req.headers['user-agent'];
  const xff = req.headers['x-forwarded-for'] as string | undefined;
  const ip = xff?.split(',')[0] || req.socket.remoteAddress;

  const data = await enrollQuiz({
    ...input,
    user: { userId, userAgent, ip },
  });

  return res.success(CREATED, {
    data,
    message: 'Quiz enrolled successfully',
  });
});

// PUT /quiz-attempts/:quizAttemptId/submit - Update a quiz attempt
export const submitQuizHandler = catchErrors(async (req, res) => {
  const input = submitQuizSchema.parse({
    quizAttemptId: req.params.quizAttemptId,
  });
  const userId = req.userId;
  const data = await submitQuizAttempt(input, userId);
  return res.success(OK, {
    data,
    message: 'Submit quiz attempt successfully',
  });
});

// PUT /quiz-attempts/:quizAttemptId/save - Update a quiz attempt
export const saveQuizHandler = catchErrors(async (req, res) => {
  const input = saveQuizSchema.parse({
    quizAttemptId: req.params.quizAttemptId,
    answers: req.body.answers,
  });
  const userId = req.userId;
  const data = await saveQuizAttempt(input, userId);
  return res.success(OK, {
    data,
    message: 'Submit quiz attempt successfully',
  });
});

// DELETE /quiz-attempts/:quizAttemptId - Delete a quiz attempt
export const deleteQuizAttemptHandler = catchErrors(async (req, res) => {
  const quizAttemptId = quizAttemptIdSchema.parse(req.params.quizAttemptId);
  const userId = req.userId;
  const role = req.role;
  const data = await deleteQuizAttempt(quizAttemptId, userId, role);
  return res.success(OK, {
    data,
    message: 'Delete quiz attempt successfully',
  });
});

// PUT /quiz-attempts/:quizAttemptId/ban - Ban a quiz attempt
export const banQuizAttemptHandler = catchErrors(async (req, res) => {
  const quizAttemptId = quizAttemptIdSchema.parse(req.params.quizAttemptId);
  const userId = req.userId;
  const role = req.role;
  const data = await banQuizAttempt(quizAttemptId, userId, role);
  return res.success(OK, {
    data,
    message: 'Ban quiz attempt successfully',
  });
});

// PUT /quiz-attempts/:quizAttemptId/auto-save - Auto save a quiz attempt
export const autoSaveQuizHandler = catchErrors(async (req, res) => {
  const input = submitAnswerSchema.parse({
    quizAttemptId: req.params.quizAttemptId,
    answer: req.body.answer,
  });
  const userId = req.userId;
  const data = await autoSaveQuizAttempt(input, userId);
  return res.success(OK, {
    data,
    message: 'Auto save quiz attempt successfully',
  });
});
