import { BAD_REQUEST, NOT_FOUND } from '@/constants/http';
import { CourseModel, EnrollmentModel, QuizAttemptModel, QuizModel } from '@/models';
import {
  AttemptStatus,
  EnrollmentStatus,
  ICourse,
  IQuiz,
  IQuizAttempt,
  IUser,
  Role,
} from '@/types';
import appAssert from '@/utils/appAssert';
import { CreateQuiz, UpdateQuiz } from '@/validators/quiz.schemas';
import { checkProperQuestionType } from './quizQuestion.service';
import { TImage } from '@/models/quiz.model';
import { getKeyFromPublicUrl, removeFiles } from '@/utils/uploadFile';
import mongoose from 'mongoose';
import {
  calculateMedian,
  calculateRank,
  findMinMax,
  isTeacherOfCourse,
  standardDeviation,
} from './helpers/quizHelpers';
import { QuizQuestionType } from '@/types/quizQuestion.type';

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
    isPublished,
    snapshotQuestions,
  }: CreateQuiz,
  userId: mongoose.Types.ObjectId,
  role: Role
): Promise<IQuiz> => {
  const course = await CourseModel.findById(courseId);
  appAssert(course, NOT_FOUND, 'Course not found');

  //check whether user is teacher of course
  if (role === Role.TEACHER) {
    isTeacherOfCourse(course, userId);
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
    isPublished,
    createdBy: userId,
    snapshotQuestions: [...snapshotQuestions],
  });

  return quiz;
};

/**
 * Update a quiz.
 *
 * This function updates the properties of an existing quiz, including its title, description,
 * start and end times, shuffle settings, and questions. It handles added, updated, and deleted
 * questions, merges images safely, and validates question types and time constraints.
 *
 * Rules:
 * - If the quiz is currently ongoing:
 *   - Only title, description, and endTime can be updated.
 *   - endTime cannot be set to a past time.
 *   - startTime and shuffleQuestions cannot be changed.
 * - startTime must always be before endTime.
 * - For updated questions (`isDirty`), full question data is expected from the client.
 * - For deleted questions, associated images that are not from DB will be removed from storage.
 *
 * @param params - Parameters to update the quiz.
 * @param params.quizId - ID of the quiz to update.
 * @param params.title - (Optional) New title of the quiz.
 * @param params.description - (Optional) New description of the quiz.
 * @param params.startTime - (Optional) New start time of the quiz.
 * @param params.endTime - (Optional) New end time of the quiz.
 * @param params.shuffleQuestions - (Optional) Whether to shuffle questions.
 * @param params.snapshotQuestions - (Optional) Array of questions to add/update/delete.
 * @param userId - ID of the user performing the update.
 * @param role - Role of the user performing the update (e.g., TEACHER).
 *
 * @throws NOT_FOUND if the quiz does not exist.
 * @throws BAD_REQUEST if:
 *   - The quiz is ongoing and the user attempts to update disallowed fields.
 *   - startTime is after endTime.
 *   - endTime is set to a past time for ongoing quizzes.
 *   - Updated question data is invalid or a question already exists when adding.
 *
 * @returns The updated quiz document.
 */

export const updateQuiz = async (
  {
    quizId,
    title,
    description,
    startTime,
    endTime,
    shuffleQuestions,
    snapshotQuestions,
  }: UpdateQuiz,
  userId: mongoose.Types.ObjectId,
  role: Role
) => {
  const quiz = await QuizModel.findById(quizId).populate<{ courseId: ICourse }>('courseId');
  appAssert(quiz, NOT_FOUND, 'Quiz not found');

  //isTeacher of course
  if (role === Role.TEACHER) {
    isTeacherOfCourse(quiz.courseId, userId);
  }

  //isOnGoing
  const isOnGoing = quiz.startTime.getTime() <= Date.now() && quiz.endTime.getTime() >= Date.now();

  if (isOnGoing) {
    appAssert(
      (!snapshotQuestions || snapshotQuestions.length === 0) &&
        shuffleQuestions === undefined &&
        startTime === undefined,
      BAD_REQUEST,
      'You can just update title, description, endTime while quiz is on going'
    );
  }

  let deletedImages: string[] = [];
  const map = new Map<string, number>();
  quiz.snapshotQuestions.forEach((q: any, i: number) => map.set(q.id, i));

  if (snapshotQuestions?.length) {
    for (const question of snapshotQuestions) {
      if (!question.isDeleted)
        checkProperQuestionType(
          question.type,
          question.correctOptions,
          `Question "${question.text}" is invalid`
        );
    }
  }
  const updated = snapshotQuestions.filter((q) => q.isDirty && !q.isNewQuestion && !q.isDeleted);
  const added = snapshotQuestions.filter((q) => q.isNewQuestion && !q.isDeleted);
  const deleted = snapshotQuestions.filter((q) => q.isDeleted && !q.isNewQuestion);

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

    // Merge ảnh
    quiz.snapshotQuestions[index].images = newImages;

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

      const images: string[] = (q.images || [])
        .filter((img: TImage) => !img.fromDB)
        .map((img: TImage) => img.url);

      deletedImages.push(...images);
    }
  }

  const deletedIds = deleted.map((q) => q.id);
  quiz.snapshotQuestions = quiz.snapshotQuestions.filter((q) => !deletedIds.includes(q.id));

  if (deletedImages.length > 0) {
    await removeFiles(deletedImages.map((img) => getKeyFromPublicUrl(img)));
  }

  console.log('Deleted : ', deletedImages.length);

  quiz.title = title ?? quiz.title;
  quiz.description = description ?? quiz.description;
  quiz.startTime = startTime ?? quiz.startTime;
  if (endTime) {
    if (isOnGoing) {
      appAssert(
        endTime.getTime() >= Date.now(),
        BAD_REQUEST,
        'You can not update endTime less than current time'
      );
    }
    quiz.endTime = endTime;
  }
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
  role,
}: {
  quizId: string;
  userId: mongoose.Types.ObjectId;
  role: Role;
}) => {
  const quiz = await QuizModel.findById(quizId).populate<{ courseId: ICourse }>('courseId');
  appAssert(quiz, NOT_FOUND, 'Quiz not found');

  //isTeacher of course
  if (role === Role.TEACHER) {
    isTeacherOfCourse(quiz.courseId, userId);
  }
  //isOnGoing
  const isOnGoing = quiz.startTime.getTime() <= Date.now() && quiz.endTime.getTime() >= Date.now();
  appAssert(!isOnGoing, BAD_REQUEST, 'Cannot delete a quiz that is on going');

  quiz.deletedAt = new Date();
  quiz.deletedBy = userId;
  const data = await quiz.save();

  return data;
};

/**
 * Get the statistic of a quiz.
 * @param  quizId - ID of the quiz to get statistic.
 * @param  userId - ID of the user who is getting the statistic.
 * @throws  If the quiz is not found.
 * @throws  If the user is not a teacher of the course.
 * @returns  An object containing the total number of students, the number of submitted quizzes, the average score, the median score, the minimum and maximum score, the standard deviation score, the distribution of scores and the rank of students.
 */
export const getStatisticByQuizId = async (
  quizId: string,
  userId: mongoose.Types.ObjectId,
  role: Role
) => {
  const quiz = await QuizModel.findById(quizId).populate<{ courseId: ICourse }>('courseId').lean();
  appAssert(quiz, NOT_FOUND, 'Quiz not found');

  if (role === Role.TEACHER) {
    isTeacherOfCourse(quiz.courseId, userId);
  }

  // count total student
  const totalStudents = await EnrollmentModel.find({
    courseId: quiz.courseId._id,
    status: EnrollmentStatus.APPROVED,
  }).countDocuments();

  const quizAttempt = await QuizAttemptModel.find({
    quizId: quiz._id,
    status: AttemptStatus.SUBMITTED,
  })
    .populate<{ studentId: IUser }>('studentId', 'id username email fullname')
    .lean<(IQuizAttempt & { studentId: IUser })[]>();

  const scoresArray = quizAttempt.map((attempt) => attempt.score);

  // count submitted
  const submittedCount = quizAttempt.length;

  // count average
  const averageScore = quizAttempt.length
    ? quizAttempt.reduce((total, attempt) => total + attempt.score, 0) / quizAttempt.length
    : 0;

  // count median
  const medianScore = calculateMedian(scoresArray);

  // count min max
  const minMax = findMinMax([...new Set(scoresArray)]);

  // count standard deviation
  const standardDeviationScore = standardDeviation(scoresArray);

  // count distribution
  const intervals = [
    { min: 0, max: 2, label: '0-2' },
    { min: 2, max: 4, label: '2-4' },
    { min: 4, max: 6, label: '4-6' },
    { min: 6, max: 8, label: '6-8' },
    { min: 8, max: 10, label: '8-10' },
  ];

  const scoreDistribution = intervals.map((interval) => {
    const count = scoresArray.filter(
      (score) => score >= interval.min && score < interval.max
    ).length;
    return {
      min: interval.min,
      max: interval.max,
      range: interval.label,
      count,
      percentage: `${
        Number.isFinite(count / submittedCount)
          ? ((count / submittedCount) * 100).toFixed(2)
          : Number(0).toFixed(2)
      }%`,
    };
  });

  // count rank
  const students = calculateRank(quizAttempt);

  return {
    totalStudents,
    submittedCount,
    averageScore,
    medianScore,
    minMax,
    standardDeviationScore,
    scoreDistribution,
    students,
  };
};

interface StudentSnapshotQuestion {
  id: string;
  text: string;
  type: QuizQuestionType;
  options: string[];
  images?: { url: string; fromDB: boolean }[];
}

export const getQuizById = async (quizId: string, userId: mongoose.Types.ObjectId, role: Role) => {
  const quiz = await QuizModel.findById(quizId).populate<{ courseId: ICourse }>('courseId').lean();
  appAssert(quiz, NOT_FOUND, 'Quiz not found');

  if (role === Role.TEACHER) {
    isTeacherOfCourse(quiz.courseId, userId);
  }

  if (role === Role.STUDENT) {
    quiz.snapshotQuestions = quiz.snapshotQuestions.map((q): any => {
      const {
        correctOptions,
        explanation,
        points,
        isDeleted,
        isDirty,
        isExternal,
        isNewQuestion,
        ...rest
      } = q;
      return rest;
    });
    const { courseId, ...rest } = quiz;
    return rest;
  }

  return quiz;
};
