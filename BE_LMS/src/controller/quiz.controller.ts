import { CREATED, OK } from "@/constants/http";
import { addSnapshotQuestions, createQuiz } from "@/services/quiz.service";
import { catchErrors } from "@/utils/asyncHandler";
import {
  addSnapshotQuestionsSchema,
  createQuizSchema,
} from "@/validators/quiz.schemas";

// POST /quizzes - Create a new quiz
export const createQuizHandler = catchErrors(async (req, res) => {
  const input = createQuizSchema.parse(req.body);
  const userId = req.userId;
  const data = await createQuiz(input, userId.toString());

  return res.success(CREATED, {
    data,
    message: "Quiz created successfully",
  });
});

// PUT /quizzes - Add snapshot questions
export const addSnapshotQuestionsHandler = catchErrors(async (req, res) => {
  const input = addSnapshotQuestionsSchema.parse(req.body);

  const data = await addSnapshotQuestions(input);

  return res.success(OK, {
    data,
    message: "Snapshot questions added successfully",
  });
});
