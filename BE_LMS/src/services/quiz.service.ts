import { BAD_REQUEST, FORBIDDEN, NOT_FOUND } from '@/constants/http';
import { CourseModel, QuizModel } from '@/models';
import { IQuiz, Role } from '@/types';
import appAssert from '@/utils/appAssert';
import { CreateQuiz, GetQuizzes, UpdateQuiz } from '@/validators/quiz.schemas';
import { checkProperQuestionType } from './quizQuestion.service';
import { TImage } from '@/models/quiz.model';
import { getKeyFromPublicUrl, removeFiles } from '@/utils/uploadFile';
import mongoose from 'mongoose';

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
    // questionIds,
    snapshotQuestions,
  }: CreateQuiz,
  userId: mongoose.Types.ObjectId,
  role: Role
): Promise<IQuiz> => {
  const course = await CourseModel.findById(courseId);
  appAssert(course, NOT_FOUND, 'Course not found');

  //check whether user is teacher of course
  if (role === Role.TEACHER) {
    const isTeacherOfCourse = course.teacherIds.some((teacherId) => teacherId.equals(userId));
    appAssert(isTeacherOfCourse, FORBIDDEN, 'You are not a teacher of this course');
  }

  //check endTime > startTime
  appAssert(startTime < endTime, BAD_REQUEST, 'Start time must be before end time');

  if (snapshotQuestions && snapshotQuestions.length > 0) {
    for (let question of snapshotQuestions) {
      checkProperQuestionType(
        question.type,
        question.correctOptions,
        `Question "${question.text}" is invalid`
      );
    }
  }

  const quiz = await QuizModel.create({
    courseId,
    title,
    description,
    startTime,
    endTime,
    shuffleQuestions,
    createdBy: userId,
    snapshotQuestions: [...snapshotQuestions],
  });

  return quiz;
};

/**
 * Update a quiz.
 * @param  { quizId, courseId, title, description, startTime, endTime, shuffleQuestions, snapshotQuestions }
 * @throws  If quiz not found
 * @throws  If quiz is already completed
 * @throws  If snapshot questions already added
 * @throws  If no questions provided
 * @returns  Updated quiz
 */
export const updateQuiz = async ({
  quizId,
  courseId,
  title,
  description,
  startTime,
  endTime,
  shuffleQuestions,
  snapshotQuestions,
}: UpdateQuiz) => {
  const quiz = await QuizModel.findById(quizId);
  appAssert(quiz, NOT_FOUND, 'Quiz not found');

  let deletedImages: string[] = [];
  const map = new Map<string, number>();
  quiz.snapshotQuestions.forEach((q: any, i: number) => map.set(q.id, i));

  for (const question of snapshotQuestions) {
    if (!question.isDeleted)
      checkProperQuestionType(
        question.type,
        question.correctOptions,
        `Question "${question.text}" is invalid`
      );
  }

  const updated = snapshotQuestions.filter((q) => q.isDirty && !q.isNew && !q.isDeleted);
  const added = snapshotQuestions.filter((q) => q.isNew && !q.isDeleted);
  const deleted = snapshotQuestions.filter((q) => q.isDeleted && !q.isNew);

  for (const q of updated) {
    const index = map.get(q.id) || -1;
    if (index === -1) continue;

    const oldQuestion = quiz.snapshotQuestions[index];
    const oldImages = oldQuestion.images || [];
    const newImages = q.images || [];

    // Merge cac field khác
    quiz.snapshotQuestions[index] = {
      ...oldQuestion,
      ...q,
    };

    // Merge ảnh: giữ ảnh DB, add ảnh newcom
    const mergedImages = [...newImages];
    quiz.snapshotQuestions[index].images = mergedImages;

    // Xóa ảnh
    deletedImages.push(
      ...oldImages
        .filter((img: TImage) => !newImages.some((newImg) => newImg.url === img.url) && !img.fromDB)
        .map((img: TImage) => img.url)
    );
  }

  // Add new questions
  if (added.length > 0) {
    for (const q of added) {
      const exists = quiz.snapshotQuestions.some((sq) => sq.id === q.id);
      appAssert(!exists, BAD_REQUEST, `Question "${q.text}" already exists`);
      quiz.snapshotQuestions.push(q);
    }
  }

  // Delete questions
  if (deleted.length > 0) {
    for (const q of deleted) {
      const index = map.get(q.id);
      if (index === -1) continue;
      quiz.snapshotQuestions = quiz.snapshotQuestions.filter(
        (q) => !deleted.some((d) => d.id === q.id)
      );

      const images: string[] = (q.images || [])
        .filter((img: TImage) => !img.fromDB)
        .map((img: TImage) => img.url);

      deletedImages.push(...images);
    }
  }

  if (deletedImages.length > 0) {
    await removeFiles(deletedImages.map((img) => getKeyFromPublicUrl(img)));
  }

  console.log('Deleted : ', deletedImages.length);

  quiz.title = title ?? quiz.title;
  quiz.description = description ?? quiz.description;
  quiz.courseId = new mongoose.Types.ObjectId(courseId ?? quiz.courseId);
  quiz.startTime = startTime ?? quiz.startTime;
  quiz.endTime = endTime ?? quiz.endTime;
  quiz.shuffleQuestions = shuffleQuestions ?? quiz.shuffleQuestions;

  await quiz.save();
  return quiz;
};

/**
 * Delete a quiz.
 * @param  params - Parameters to delete a quiz.
 * @param  params.quizId - ID of the quiz to delete.
 * @param  params.userId - ID of the user who is deleting the quiz.
 * @throws  If the quiz is not found.
 * @throws  If the quiz is on going.
 * @returns  The deleted quiz.
 */
export const deleteQuiz = async ({
  quizId,
  userId,
}: {
  quizId: string;
  userId: mongoose.Types.ObjectId;
}) => {
  const quiz = await QuizModel.findById(quizId);
  appAssert(quiz, NOT_FOUND, 'Quiz not found');

  const isOnGoing = quiz.startTime.getTime() <= Date.now() && quiz.endTime.getTime() >= Date.now();

  appAssert(isOnGoing, BAD_REQUEST, 'Cannot delete a quiz that is on going');

  quiz.deletedAt = new Date();
  quiz.deletedBy = userId;
  await quiz.save();

  return quiz;
};

/**
 * Get quizzes based on the provided parameters.
 * @param input - Parameters to get quizzes.
 * @param role - Role of the user.
 * @param userId - ID of the user, required for students.
 * @returns A list of quizzes filtered based on the provided parameters.
 * @throws If the course is not found.
 * @throws If the user is not a teacher of the course.
 * @throws If courseId is not provided for students.
 */
export const getQuizzes = async (
  input: GetQuizzes,
  role: string,
  userId?: mongoose.Types.ObjectId
) => {
  const { courseId, isPublished, isCompleted, isDeleted } = input;
  const filter: any = {};
  if (courseId) {
    const course = await CourseModel.findById(courseId);
    appAssert(course, NOT_FOUND, 'Course not found');

    if (role === Role.TEACHER) {
      const isTeacherOfCourse = course.teacherIds.some((teacherId) => teacherId.equals(userId));
      appAssert(isTeacherOfCourse, FORBIDDEN, 'You are not a teacher of this course');
    }

    filter.courseId = courseId;

    if (role === Role.STUDENT) {
      filter.isPublished = true;
      filter.deletedAt = { $exists: false };
    } else {
      if (isPublished !== undefined) {
        filter.isPublished = isPublished;
      }
      if (isDeleted !== undefined) {
        if (isDeleted) {
          filter.deletedAt = { $exists: true };
        } else {
          filter.deletedAt = { $exists: false };
        }
      }
      if (isCompleted !== undefined) {
        filter.endTime = isCompleted ? { $lte: new Date() } : { $gt: new Date() };
      }
    }
  } else {
    if (role === Role.STUDENT) {
      appAssert(userId, FORBIDDEN, 'courseId is required');
    }
  }

  const quizzes = await QuizModel.find(filter).sort({ createdAt: -1 }).lean();

  for (let quiz of quizzes) {
    if (quiz.endTime.getTime() < Date.now()) {
      (quiz as any).isCompleted = true;
    } else {
      (quiz as any).isCompleted = false;
    }

    if (quiz.deletedAt) {
      (quiz as any).isDeleted = true;
    }
  }

  return quizzes;
};
