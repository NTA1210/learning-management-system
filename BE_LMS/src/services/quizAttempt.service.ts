import { BAD_REQUEST, NOT_FOUND } from "@/constants/http";
import { QuizAttemptModel, QuizModel } from "@/models";
import { AttemptStatus, IQuiz, Role } from "@/types";
import appAssert from "@/utils/appAssert";
import {
  EnrollQuizInput,
  SubmitQuizInput,
} from "@/validators/quizAttempt.schemas";

/**
 * Enroll in a quiz.
 * Only students can enroll in quizzes.
 * User must enroll within 15 minutes after the quiz starts.
 * User cannot enroll if they have already completed the quiz.
 * User cannot enroll if they are banned from taking the quiz.
 * @param  data - Parameters to enroll in a quiz.
 * @param  data.quizId - ID of the quiz to enroll in.
 * @param  data.user - User who is enrolling in the quiz.
 * @returns  - The created quiz attempt.
 * @throws  - If the user is not a student or if the user has already completed the quiz or if the user is banned from taking the quiz.
 * @throws  - If the quiz is not found.
 */
export const enrollQuiz = async ({
  quizId,
  hashPassword,
  user,
}: EnrollQuizInput) => {
  // Chỉ học sinh mới được đăng ký làm bài quiz
  appAssert(
    user.role === Role.STUDENT,
    BAD_REQUEST,
    "Only students can enroll in quizzes"
  );

  // Logic đăng ký làm bài quiz
  const quiz = await QuizModel.findById(quizId);
  appAssert(quiz, NOT_FOUND, "Quiz not found");

  // Kiem tra mat khau
  appAssert(
    quiz.compareHashPassword(hashPassword),
    BAD_REQUEST,
    "Invalid password"
  );

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
    now >= quiz.startTime.getTime(),
    BAD_REQUEST,
    "This quiz has not started yet"
  );

  appAssert(now <= quiz.endTime.getTime(), BAD_REQUEST, "This quiz has ended");

  // Kiem tra nguoi dung da lam bai chua
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

/**
 * Submit a quiz attempt.
 * @param  params - Parameters to submit a quiz attempt.
 * @param  params.quizAttemptId - ID of the quiz attempt to submit.
 * @param  params.answers - Array of answers to submit.
 * @returns  - The submitted quiz attempt with score and other information.
 * @throws  - If the quiz attempt is not found.
 * @throws  - If the user was banned from taking the quiz.
 * @throws  - If the user has already submitted the quiz.
 * @throws  - If the time limit has been exceeded.
 */
export const submitQuizAttempt = async ({
  quizAttemptId,
  answers,
}: SubmitQuizInput) => {
  const quizAttempt = await QuizAttemptModel.findById(quizAttemptId).populate<{
    quizId: IQuiz;
  }>("quizId");
  appAssert(quizAttempt, NOT_FOUND, "Quiz attempt not found");

  appAssert(
    quizAttempt.status !== AttemptStatus.ABANDONED,
    BAD_REQUEST,
    "You were banned from taking this quiz"
  );

  appAssert(
    quizAttempt.status !== AttemptStatus.SUBMITTED,
    BAD_REQUEST,
    "You have already submitted this quiz"
  );

  // Kiem tra xem nguoi dung co dung thoi gian lam bai khong
  const isOnTime =
    quizAttempt.quizId.endTime.getTime() + 30 * 1000 >= Date.now();

  appAssert(isOnTime, BAD_REQUEST, "Time limit exceeded");

  //validate số lượng câu trả lời
  appAssert(
    answers.length === quizAttempt.quizId.snapshotQuestions.length,
    BAD_REQUEST,
    "Invalid number of answers submitted"
  );

  const {
    totalQuestions,
    totalScore,
    totalQuizScore,
    scorePercentage,
    failedQuestions,
    passedQuestions,
    answers: answersSubmitted,
  } = await quizAttempt.grade(answers, quizAttempt.quizId);
  return {
    totalQuestions,
    totalScore,
    totalQuizScore,
    scorePercentage,
    failedQuestions,
    passedQuestions,
    answersSubmitted,
  };
};
