import mongoose from "mongoose";

export const prefixLessonMaterial = (
  courseId: mongoose.Types.ObjectId,
  lessonId: mongoose.Types.ObjectId
) => {
  return `courses/${courseId}/lessons/${lessonId}`;
};

export const prefixSubmission = (
  courseId: mongoose.Types.ObjectId,
  assignmentId: mongoose.Types.ObjectId,
  studentId: mongoose.Types.ObjectId
) => {
  return `courses/${courseId}/assignments/${assignmentId}/submissions/${studentId}`;
};

export const prefixQuizQuestionImage = (
  subjectId: string,
  questionId: string
) => {
  return `subjects/${subjectId}/questions/${questionId}/image`;
};
