import { CREATED, OK } from "@/constants/http";
import { enrollQuiz, submitQuizAttempt } from "@/services/quizAttempt.service";
import { catchErrors } from "@/utils/asyncHandler";
import {
  enrollQuizSchema,
  quizAttemptIdSchema,
  submitQuizSchema,
} from "@/validators/quizAttempt.schemas";

// POST /quiz-attempts/enroll - Enroll in a quiz
export const enrollQuizHandler = catchErrors(async (req, res) => {
  const input = enrollQuizSchema.parse(req.body);
  const { userId, role } = req;
  const userAgent = req.headers["user-agent"];
  const xff = req.headers["x-forwarded-for"] as string | undefined;
  const ip = xff?.split(",")[0] || req.socket.remoteAddress;

  const data = await enrollQuiz({
    ...input,
    user: { userId, role, userAgent, ip },
  });

  return res.success(CREATED, {
    data,
    message: "Quiz enrolled successfully",
  });
});

// PUT /quiz-attempts/:quizAttemptId/submit - Update a quiz attempt
export const submitQuizHandler = catchErrors(async (req, res) => {
  const input = submitQuizSchema.parse({
    quizAttemptId: req.params.quizAttemptId,
    answers: req.body.answers,
  });
  const data = await submitQuizAttempt(input);
  return res.success(OK, {
    data,
    message: "Submit quiz attempt successfully",
  });
});
