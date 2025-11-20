import { CREATED } from "@/constants/http";
import { enrollQuiz } from "@/services/quizAttempt.service";
import { catchErrors } from "@/utils/asyncHandler";
import { enrollQuizSchema } from "@/validators/quizAttempt.schemas";

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
