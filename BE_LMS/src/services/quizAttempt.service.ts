import { BAD_REQUEST, NOT_FOUND } from '@/constants/http';
import { EnrollmentModel, QuizAttemptModel, QuizModel } from '@/models';
import { AttemptStatus, EnrollmentStatus, ICourse, IQuestionAnswer, IQuiz, Role } from '@/types';
import appAssert from '@/utils/appAssert';
import {
  Answer,
  EnrollQuizInput,
  SaveQuizInput,
  SubmitAnswerInput,
  SubmitQuizInput,
  UpdateQuizAttemptScoreInput,
} from '@/validators/quizAttempt.schemas';
import mongoose from 'mongoose';
import { isTeacherOfCourse } from './helpers/quizHelpers';

/**
 * Enroll in a quiz.
 * Only students of a course can enroll in quizzes.
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
  user: { role, userId, userAgent, ip },
}: EnrollQuizInput) => {
  // Logic đăng ký làm bài quiz
  const quiz = await QuizModel.findById(quizId).populate<{ courseId: ICourse }>('courseId');
  appAssert(quiz, NOT_FOUND, 'Quiz not found');

  if (role === Role.STUDENT) {
    // Chỉ học sinh của khóa học mới được đăng ký làm bài quiz
    const isStudentOfCourse = await EnrollmentModel.findOne({
      studentId: userId,
      courseId: quiz.courseId,
      status: EnrollmentStatus.APPROVED,
    });
    appAssert(isStudentOfCourse, BAD_REQUEST, 'You are not a student of this course');
  }

  if (role === Role.TEACHER) {
    isTeacherOfCourse(quiz.courseId, userId);
  }

  // Kiem tra mat khau
  appAssert(quiz.compareHashPassword(hashPassword), BAD_REQUEST, 'Invalid password');

  // Kiem tra nguoi dung da lam bai chua
  const quizAttempt = await QuizAttemptModel.findOne({
    quizId: quiz._id,
    studentId: userId,
  });
  if (quizAttempt) {
    appAssert(
      !(quizAttempt?.status === AttemptStatus.SUBMITTED),
      BAD_REQUEST,
      'You have already completed this quiz'
    );

    // Kiem tra xem người dùng có bị banned ko
    appAssert(
      !(quizAttempt?.status === AttemptStatus.ABANDONED),
      BAD_REQUEST,
      'You are banned from taking this quiz'
    );
  }

  const now = new Date().getTime();
  // Kiểm tra quiz đã được xuất bản và trong thời gian làm bài
  appAssert(now >= quiz.startTime.getTime(), BAD_REQUEST, 'This quiz has not started yet');

  appAssert(now <= quiz.endTime.getTime(), BAD_REQUEST, 'This quiz has ended');

  // Kiem tra nguoi dung da lam bai chua
  if (quizAttempt && quizAttempt.status === AttemptStatus.IN_PROGRESS) {
    // Đã có bài làm dang dở, không tạo mới
    return quizAttempt;
  }

  // Người dùng chỉ được đăng ký trong vòng 15 phút kể từ khi quiz bắt đầu
  appAssert(
    new Date().getTime() <= quiz.startTime.getTime() + 15 * 60 * 1000,
    BAD_REQUEST,
    'You can only enroll within 15 minutes after the quiz starts'
  );

  const questionAnswers: IQuestionAnswer[] = quiz.snapshotQuestions.map((q) => {
    const { id } = q;

    return {
      questionId: id,
      answer: q.options.map((o) => 0),
      text: q.text,
      type: q.type,
      options: q.options,
      images: q.images,
      correct: false,
      pointsEarned: 0,
    };
  });

  // Tạo mới quiz attempt
  const data = await QuizAttemptModel.findOneAndUpdate(
    { quizId: quiz._id, studentId: userId },
    {
      $setOnInsert: {
        quizId: quiz._id,
        studentId: userId,
        ipAddress: ip,
        userAgent: userAgent,
        answers: questionAnswers,
      },
    },
    { upsert: true, new: true }
  );

  return data;
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
export const submitQuizAttempt = async (
  { quizAttemptId }: SubmitQuizInput,
  userId: mongoose.Types.ObjectId
) => {
  const quizAttempt = await QuizAttemptModel.findById(quizAttemptId).populate<{
    quizId: IQuiz;
  }>('quizId');
  appAssert(quizAttempt, NOT_FOUND, 'Quiz attempt not found');

  // Kiem tra quiz da duoc tao chua
  const quiz = await QuizModel.findById(quizAttempt.quizId).populate<{ courseId: ICourse }>(
    'courseId'
  );
  appAssert(quiz, NOT_FOUND, 'Quiz not found');

  appAssert(
    quizAttempt.studentId.toString() === userId.toString(),
    BAD_REQUEST,
    'You are not the creator of this quiz'
  );

  const answers: IQuestionAnswer[] = quizAttempt.answers;

  appAssert(
    quizAttempt.status !== AttemptStatus.ABANDONED,
    BAD_REQUEST,
    'You were banned from taking this quiz'
  );

  appAssert(
    quizAttempt.status !== AttemptStatus.SUBMITTED,
    BAD_REQUEST,
    'You have already submitted this quiz'
  );

  // Kiem tra xem nguoi dung co dung thoi gian lam bai khong
  const isOnTime = quizAttempt.quizId.endTime.getTime() + 30 * 1000 >= Date.now();

  appAssert(isOnTime, BAD_REQUEST, 'Time limit exceeded');

  //validate số lượng câu trả lời
  appAssert(
    answers.length === quizAttempt.quizId.snapshotQuestions.length,
    BAD_REQUEST,
    'Invalid number of answers submitted'
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
export const saveQuizAttempt = async (
  { quizAttemptId, answers }: SaveQuizInput,
  userId: mongoose.Types.ObjectId
) => {
  const quizAttempt = await QuizAttemptModel.findById(quizAttemptId).populate<{
    quizId: IQuiz;
  }>('quizId');

  appAssert(quizAttempt, NOT_FOUND, 'Quiz attempt not found');

  // Kiem tra quiz da duoc tao chua
  const quiz = await QuizModel.findById(quizAttempt.quizId).populate<{ courseId: ICourse }>(
    'courseId'
  );
  appAssert(quiz, NOT_FOUND, 'Quiz not found');

  // Kiem tra nguoi dung co phai nguoi tao khong
  appAssert(
    quizAttempt.studentId.toString() === userId.toString(),
    BAD_REQUEST,
    'You are not the creator of this quiz'
  );

  appAssert(
    quizAttempt.status !== AttemptStatus.ABANDONED,
    BAD_REQUEST,
    'You were banned from taking this quiz'
  );

  appAssert(
    quizAttempt.status !== AttemptStatus.SUBMITTED,
    BAD_REQUEST,
    'You have already submitted this quiz'
  );

  // Kiem tra xem nguoi dung co dung thoi gian lam bai khong
  const isOnTime = quizAttempt.quizId.endTime.getTime() + 30 * 1000 >= Date.now();

  appAssert(isOnTime, BAD_REQUEST, 'Time limit exceeded');

  //validate số lượng câu trả lời
  appAssert(
    answers.length === quizAttempt.quizId.snapshotQuestions.length,
    BAD_REQUEST,
    'Invalid number of answers submitted'
  );

  const data = await QuizAttemptModel.findOneAndUpdate(
    { _id: quizAttemptId },
    { answers },
    { new: true }
  );

  return data;
};

/**
 * Delete a quiz attempt.
 * @param  quizAttemptId - ID of the quiz attempt to delete.
 * @param  userId - ID of the user who is deleting the quiz attempt.
 * @param  role - Role of the user who is deleting the quiz attempt.
 * @throws  If the quiz attempt is not found.
 * @throws  If the user is not the creator of the quiz and is a teacher.
 * @throws  If the quiz attempt is on going.
 * @returns  The deleted quiz attempt.
 */
export const deleteQuizAttempt = async (
  quizAttemptId: string,
  userId: mongoose.Types.ObjectId,
  role: Role
) => {
  const data = await QuizAttemptModel.findById(quizAttemptId).populate<{
    quizId: IQuiz;
  }>('quizId');

  appAssert(data, NOT_FOUND, 'Quiz attempt not found');

  if (role === Role.TEACHER) {
    appAssert(
      data.quizId.createdBy?.equals(userId),
      BAD_REQUEST,
      'You are not the teacher who created this quiz'
    );
  }

  const now = new Date();
  const isOnGoing =
    data.quizId.startTime.getTime() <= now.getTime() &&
    data.quizId.endTime.getTime() >= now.getTime();
  appAssert(!isOnGoing, BAD_REQUEST, 'Cannot delete a quiz attempt that is on going');

  // Xóa quiz attempt
  const deleted = await QuizAttemptModel.findByIdAndDelete(quizAttemptId);
  appAssert(deleted, NOT_FOUND, 'Quiz attempt already deleted');

  return deleted;
};

/**
 * Ban a quiz attempt.
 * @param  quizAttemptId - ID of the quiz attempt to ban.
 * @param  userId - ID of the user who is banning the quiz attempt.
 * @param  role - Role of the user who is banning the quiz attempt.
 * @throws  If the quiz attempt is not found.
 * @throws  If the user is not the creator of the quiz and is a teacher.
 * @throws  If the quiz attempt is already submitted.
 * @returns  The banned quiz attempt.
 */
export const banQuizAttempt = async (
  quizAttemptId: string,
  userId: mongoose.Types.ObjectId,
  role: Role
) => {
  // Lấy quiz attempt cùng quiz
  const quizAttempt = await QuizAttemptModel.findById(quizAttemptId).populate<{
    quizId: IQuiz;
  }>('quizId');

  appAssert(quizAttempt, NOT_FOUND, 'Quiz attempt not found');

  // Teacher chỉ được ban quiz do mình tạo
  if (role === Role.TEACHER) {
    appAssert(
      quizAttempt.quizId.createdBy?.equals(userId),
      BAD_REQUEST,
      'You are not the creator of this quiz'
    );
  }

  // Không thể ban quiz đã submit
  appAssert(
    quizAttempt.status !== AttemptStatus.SUBMITTED,
    BAD_REQUEST,
    'Cannot ban a submitted quiz attempt'
  );

  // Cập nhật trạng thái atomic
  const updated = await QuizAttemptModel.findByIdAndUpdate(
    quizAttemptId,
    { status: AttemptStatus.ABANDONED },
    { new: true }
  );

  appAssert(updated, NOT_FOUND, 'Quiz attempt not found or already banned');

  return updated;
};

/**
 * Auto save a quiz attempt.
 * @param  data - Parameters to auto save a quiz attempt.
 * @param  userId - ID of the user who is auto saving the quiz attempt.
 * @throws  If the quiz attempt is not found.
 * @throws  If the user is not a student of the course or if the user was banned from taking the quiz or if the user has already submitted the quiz or if the time limit has been exceeded.
 * @returns  The saved quiz attempt.
 */
export const autoSaveQuizAttempt = async (
  { quizAttemptId, answer }: SubmitAnswerInput,
  userId: mongoose.Types.ObjectId
) => {
  const quizAttempt = await QuizAttemptModel.findById(quizAttemptId).populate<{
    quizId: IQuiz;
  }>('quizId');
  appAssert(quizAttempt, NOT_FOUND, 'Quiz attempt not found');

  appAssert(
    quizAttempt.studentId.toString() === userId.toString(),
    BAD_REQUEST,
    'You are not a creator of this quiz'
  );

  appAssert(
    quizAttempt.status !== AttemptStatus.ABANDONED,
    BAD_REQUEST,
    'You were banned from taking this quiz'
  );

  appAssert(
    quizAttempt.status !== AttemptStatus.SUBMITTED,
    BAD_REQUEST,
    'You have already submitted this quiz'
  );

  // Kiem tra xem nguoi dung co dung thoi gian lam bai khong
  const isOnTime = quizAttempt.quizId.endTime.getTime() + 30 * 1000 >= Date.now();

  appAssert(isOnTime, BAD_REQUEST, 'Time limit exceeded');

  const { questionId, answer: options } = answer;

  for (const ans of quizAttempt.answers) {
    if (ans.questionId.toString() === questionId) {
      ans.answer = options;
    }
  }

  const total = quizAttempt.answers.length;
  const answeredTotal = quizAttempt.answers.filter((answer) => answer.answer.includes(1)).length;

  const data = (await quizAttempt.save()).toObject();
  data.quizId = data.quizId.id;
  return { data, total, answeredTotal };
};

/**
 * Get a quiz attempt by id.
 * @param  quizAttemptId - ID of the quiz attempt to get.
 * @param  userId - ID of the user who is getting the quiz attempt.
 * @param  role - Role of the user who is getting the quiz attempt.
 * @returns  The quiz attempt.
 * @throws  If the quiz attempt is not found.
 * @throws  If the user is not the creator of the quiz and is a student.
 * @throws  If the user is not a teacher of the course and is a teacher.
 */
export const getQuizAttemptById = async (
  quizAttemptId: string,
  userId: mongoose.Types.ObjectId,
  role: Role
) => {
  const quizAttempt = await QuizAttemptModel.findById(quizAttemptId).populate<{
    quizId: IQuiz;
  }>('quizId');
  appAssert(quizAttempt, NOT_FOUND, 'Quiz attempt not found');

  // Kiem tra quiz da duoc tao chua
  const quiz = await QuizModel.findById(quizAttempt.quizId._id).populate<{ courseId: ICourse }>(
    'courseId'
  );
  appAssert(quiz, NOT_FOUND, 'Quiz not found');

  if (role === Role.STUDENT) {
    appAssert(
      quizAttempt.studentId.toString() === userId.toString(),
      BAD_REQUEST,
      'You are not the creator of this quiz'
    );
  }

  if (role === Role.TEACHER) {
    isTeacherOfCourse(quiz.courseId, userId);
  }

  return quizAttempt;
};

/**
 * Grade a quiz attempt.
 * Only students of a course can grade their quiz attempts.
 * User must not be banned from taking the quiz.
 * User must submit the same number of answers as the number of questions in the quiz.
 * @param  quizAttemptId - ID of the quiz attempt to grade.
 * @param  userId - ID of the user who is grading the quiz attempt.
 * @param  role - Role of the user who is grading the quiz attempt.
 * @returns  The graded quiz attempt with score and other information.
 * @throws  If the quiz attempt is not found.
 * @throws  If the user is not the creator of the quiz and is a student.
 * @throws  If the user is not a teacher of the course and is a teacher.
 * @throws  If the user was banned from taking the quiz.
 * @throws  If the user did not submit the same number of answers as the number of questions in the quiz.
 */
export const gradeQuizAttempt = async (
  quizAttemptId: string,
  userId: mongoose.Types.ObjectId,
  role: Role
) => {
  const quizAttempt = await getQuizAttemptById(quizAttemptId, userId, role);

  const answers: IQuestionAnswer[] = quizAttempt.answers;

  appAssert(
    quizAttempt.status !== AttemptStatus.ABANDONED,
    BAD_REQUEST,
    'Student was banned from taking this quiz'
  );

  //validate số lượng câu trả lời
  appAssert(
    answers.length === quizAttempt.quizId.snapshotQuestions.length,
    BAD_REQUEST,
    'Invalid number of answers submitted'
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

export const updateQuizAttemptScore = async (
  { quizAttemptId, score }: UpdateQuizAttemptScoreInput,
  userId: mongoose.Types.ObjectId,
  role: Role
) => {
  const quizAttempt = await getQuizAttemptById(quizAttemptId, userId, role);
  const quizAttemptPopulated = await quizAttempt.populate({
    path: 'quizId',
    populate: { path: 'courseId' },
  });

  if (role === Role.TEACHER) {
    const course = quizAttemptPopulated.quizId.courseId as unknown as ICourse;

    isTeacherOfCourse(course, userId);
  }

  quizAttempt.score = score;
  await quizAttempt.save();
  return quizAttempt;
};
