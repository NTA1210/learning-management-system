import { CREATED } from "@/constants/http";
import { createQuiz, updateQuiz } from "@/services/quiz.service";
import { catchErrors } from "@/utils/asyncHandler";
import { updateQuizSchema, createQuizSchema } from "@/validators/quiz.schemas";

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

// // PUT /quizzes - Add snapshot questions
// export const addSnapshotQuestionsHandler = catchErrors(async (req, res) => {
//   const input = addSnapshotQuestionsSchema.parse(req.body);

//   const data = await addSnapshotQuestions(input);

//   return res.success(OK, {
//     data,
//     message: "Snapshot questions added successfully",
//   });
// });

// PUT /:quizId - Update snapshot questions
export const updateQuizHandler = catchErrors(async (req, res) => {
  const input = updateQuizSchema.parse({
    ...req.body,
    quizId: req.params.quizId,
  });

  const data = await updateQuiz(input);

  return res.success(CREATED, {
    data,
    message: "Quiz updated successfully",
  });
});
