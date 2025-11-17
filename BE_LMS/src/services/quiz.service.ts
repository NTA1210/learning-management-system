import { BAD_REQUEST, NOT_FOUND } from "@/constants/http";
import { CourseModel, QuizModel } from "@/models";
import { IQuiz } from "@/types";
import appAssert from "@/utils/appAssert";
import { CreateQuiz, UpdateQuiz } from "@/validators/quiz.schemas";
import { checkProperQuestionType } from "./quizQuestion.service";
import { TImage } from "@/models/quiz.model";
import { getKeyFromPublicUrl, removeFiles } from "@/utils/uploadFile";
import mongoose from "mongoose";

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
  userId: mongoose.Types.ObjectId
): Promise<IQuiz> => {
  const course = await CourseModel.findById(courseId);
  appAssert(course, NOT_FOUND, "Course not found");

  //check endTime > startTime
  appAssert(
    startTime < endTime,
    BAD_REQUEST,
    "Start time must be before end time"
  );

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
  appAssert(quiz, NOT_FOUND, "Quiz not found");

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

  const updated = snapshotQuestions.filter(
    (q) => q.isDirty && !q.isNew && !q.isDeleted
  );
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
        .filter(
          (img: TImage) =>
            !newImages.some((newImg) => newImg.url === img.url) && !img.fromDB
        )
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

  console.log("Deleted : ", deletedImages.length);

  quiz.title = title ?? quiz.title;
  quiz.description = description ?? quiz.description;
  quiz.courseId = new mongoose.Types.ObjectId(courseId ?? quiz.courseId);
  quiz.startTime = startTime ?? quiz.startTime;
  quiz.endTime = endTime ?? quiz.endTime;
  quiz.shuffleQuestions = shuffleQuestions ?? quiz.shuffleQuestions;

  await quiz.save();
  return quiz;
};

export const deleteQuiz = async ({
  quizId,
  userId,
}: {
  quizId: string;
  userId: mongoose.Types.ObjectId;
}) => {
  const quiz = await QuizModel.findById(quizId);
  appAssert(quiz, NOT_FOUND, "Quiz not found");

  const isOnGoing =
    quiz.startTime.getTime() <= Date.now() &&
    quiz.endTime.getTime() >= Date.now();

  appAssert(isOnGoing, BAD_REQUEST, "Cannot delete a quiz that is on going");

  quiz.deletedAt = new Date();
  quiz.deletedBy = userId;
  await quiz.save();

  return quiz;
};
