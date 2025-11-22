import { CREATED, OK } from '@/constants/http';
import { createQuiz, deleteQuiz, getStatisticByQuizId, updateQuiz } from '@/services/quiz.service';
import { catchErrors } from '@/utils/asyncHandler';
import { updateQuizSchema, createQuizSchema, quizIdSchema } from '@/validators/quiz.schemas';

// POST /quizzes - Create a new quiz
export const createQuizHandler = catchErrors(async (req, res) => {
  const input = createQuizSchema.parse(req.body);
  const userId = req.userId;
  const role = req.role;

  const data = await createQuiz(input, userId, role);

  return res.success(CREATED, {
    data,
    message: 'Quiz created successfully',
  });
});

// PUT /:quizId - Update snapshot questions
export const updateQuizHandler = catchErrors(async (req, res) => {
  const input = updateQuizSchema.parse({
    ...req.body,
    quizId: req.params.quizId,
  });

  const data = await updateQuiz(input);

  return res.success(CREATED, {
    data,
    message: 'Quiz updated successfully',
  });
});

// DELETE /:quizId - Delete a quiz
export const deleteQuizHandler = catchErrors(async (req, res) => {
  const quizId = quizIdSchema.parse(req.params.quizId);
  const userId = req.userId;
  await deleteQuiz({ quizId, userId });

  return res.success(OK, {
    message: 'Quiz deleted successfully',
  });
});

//GET /quizzes/:quizId/statistics
export const getStatisticByQuizIdHandler = catchErrors(async (req, res) => {
  const quizId = quizIdSchema.parse(req.params.quizId);
  const userId = req.userId;
  const role = req.role;

  const data = await getStatisticByQuizId(quizId, userId, role);

  return res.success(OK, {
    data,
    message: 'Statistic retrieved successfully',
  });
});
