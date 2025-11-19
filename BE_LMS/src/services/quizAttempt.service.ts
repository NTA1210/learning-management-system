import { BAD_REQUEST, NOT_FOUND } from "@/constants/http";
import { QuizAttemptModel, QuizModel } from "@/models";
import { AttemptStatus, Role } from "@/types";
import appAssert from "@/utils/appAssert";
import { EnrollQuizInput } from "@/validators/quizAttempt.schemas";

export const enrollQuiz = async ({ quizId, user }: EnrollQuizInput) => {
  // Chỉ học sinh mới được đăng ký làm bài quiz
  appAssert(
    user.role === Role.STUDENT,
    BAD_REQUEST,
    "Only students can enroll in quizzes"
  );

  // Logic đăng ký làm bài quiz
  const quiz = await QuizModel.findById(quizId);
  appAssert(quiz, NOT_FOUND, "Quiz not found");

  // Kiem tra nguoi dung da lam bai chua
  const quizAttempt = await QuizAttemptModel.findOne({
    quizId: quiz._id,
    studentId: user.userId,
  });
  if (quizAttempt) {
    appAssert(
      !(quizAttempt?.status === AttemptStatus.SUBMITTED),
      BAD_REQUEST,
      "You have already completed this quiz"
    );

    // Kiem tra xem người dùng có bị banned ko
    appAssert(
      !(quizAttempt?.status === AttemptStatus.ABANDONED),
      BAD_REQUEST,
      "You are banned from taking this quiz"
    );
  }

  const now = new Date().getTime();
  // Kiểm tra quiz đã được xuất bản và trong thời gian làm bài
  appAssert(
    now >= quiz.startTime.getTime() && now <= quiz.endTime.getTime(),
    BAD_REQUEST,
    "Quiz is not active"
  );

  if (quizAttempt && quizAttempt.status === AttemptStatus.IN_PROGRESS) {
    // Đã có bài làm dang dở, không tạo mới
    return quizAttempt;
  }

  // Người dùng chỉ được đăng ký trong vòng 15 phút kể từ khi quiz bắt đầu
  appAssert(
    new Date().getTime() <= quiz.startTime.getTime() + 15 * 60 * 1000,
    BAD_REQUEST,
    "You can only enroll within 15 minutes after the quiz starts"
  );

  // Tạo mới quiz attempt
  const quizAttemptModel = new QuizAttemptModel({
    quizId: quiz._id,
    studentId: user.userId,
    ipAddress: user.ip,
    userAgent: user.userAgent,
  });
  await quizAttemptModel.save();
  return quizAttemptModel;
};
