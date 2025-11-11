import { BAD_REQUEST, NOT_FOUND } from "@/constants/http";
import { CourseModel, QuizModel } from "@/models";
import { IQuiz } from "@/types";
import appAssert from "@/utils/appAssert";
import { AddSnapshotQuestions, CreateQuiz } from "@/validators/quiz.schemas";

/**
 * Create a new quiz.
 * @param  data - Quiz data
 * @param  userId - User ID
 * @returns  Created quiz
 * @throws  If start time is not before end time
 * @throws  If course not found
 */
export const createQuiz = async (
  {
    courseId,
    title,
    description,
    startTime,
    endTime,
    shuffleQuestions,
    questionIds,
  }: CreateQuiz,
  userId: string
): Promise<IQuiz> => {
  const course = await CourseModel.findById(courseId);
  appAssert(course, NOT_FOUND, "Course not found");

  //check endTime > startTime
  appAssert(
    startTime < endTime,
    BAD_REQUEST,
    "Start time must be before end time"
  );

  const quiz = await QuizModel.create({
    courseId,
    title,
    description,
    startTime,
    endTime,
    shuffleQuestions,
    questionIds,
    createdBy: userId,
  });

  await quiz.createSnapshot();

  return quiz;
};

/**
 * Add snapshot questions to a quiz.
 * @throws  If quiz not found
 * @throws  If quiz is already completed
 * @throws  If snapshot questions already added
 * @throws  If no questions provided
 */
export const addSnapshotQuestions = async ({
  quizId,
  questions,
}: AddSnapshotQuestions) => {
  const quiz = await QuizModel.findById(quizId);
  appAssert(quiz, NOT_FOUND, "Quiz not found");

  appAssert(
    !quiz.isCompleted,
    BAD_REQUEST,
    "Cannot add snapshot questions to a completed quiz"
  );

  appAssert(
    !quiz.snapshotQuestions.length,
    BAD_REQUEST,
    "Snapshot questions already added"
  );

  appAssert(
    questions && questions.length > 0,
    BAD_REQUEST,
    "At least one question must be provided"
  );

  if (questions) {
    await quiz.addSnapshotQuestions(questions);
  }

  return quiz;
};
